import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

interface QueryCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  timestamp: number;
  rowCount?: number;
}

export class DatabasePerformanceService {
  private static instance: DatabasePerformanceService;
  private queryCache: QueryCache = {};
  private performanceMetrics: QueryPerformanceMetrics[] = [];
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly MAX_METRICS_SIZE = 10000;

  private constructor() {}

  public static getInstance(): DatabasePerformanceService {
    if (!DatabasePerformanceService.instance) {
      DatabasePerformanceService.instance = new DatabasePerformanceService();
    }
    return DatabasePerformanceService.instance;
  }

  /**
   * Execute query with performance monitoring and caching
   */
  async executeQuery(
    pool: Pool,
    query: string,
    params: any[] = [],
    options: {
      cache?: boolean;
      cacheTTL?: number;
      cacheKey?: string;
    } = {}
  ): Promise<any> {
    const startTime = Date.now();
    const cacheKey = options.cacheKey || this.generateCacheKey(query, params);

    // Check cache first if caching is enabled
    if (options.cache) {
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        logger.debug(`Cache hit for query: ${query.substring(0, 50)}...`);
        return cachedResult;
      }
    }

    let client: PoolClient | undefined;
    try {
      client = await pool.connect();
      const result = await client.query(query, params);
      const executionTime = Date.now() - startTime;

      // Record performance metrics
      this.recordPerformanceMetric({
        query: query.substring(0, 200), // Truncate for storage
        executionTime,
        timestamp: Date.now(),
        rowCount: result.rowCount || 0,
      });

      // Cache result if caching is enabled
      if (options.cache) {
        this.setCachedResult(
          cacheKey,
          result.rows,
          options.cacheTTL || this.DEFAULT_CACHE_TTL
        );
      }

      // Log slow queries
      if (executionTime > 1000) {
        logger.warn(`Slow query detected (${executionTime}ms): ${query.substring(0, 100)}...`);
      }

      return result.rows;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Query failed after ${executionTime}ms: ${query.substring(0, 100)}...`, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute paginated query with optimizations
   */
  async executePaginatedQuery(
    pool: Pool,
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    pagination: {
      page: number;
      limit: number;
    },
    options: {
      cache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Add LIMIT and OFFSET to the base query
    const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limit, offset];

    // Execute both queries concurrently
    const [dataResult, countResult] = await Promise.all([
      this.executeQuery(pool, paginatedQuery, paginatedParams, options),
      this.executeQuery(pool, countQuery, params, { 
        cache: options.cache, 
        cacheTTL: options.cacheTTL,
        cacheKey: `count_${this.generateCacheKey(countQuery, params)}`
      }),
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Execute batch queries with transaction support
   */
  async executeBatchQueries(
    pool: Pool,
    queries: Array<{
      query: string;
      params: any[];
    }>,
    useTransaction = true
  ): Promise<any[]> {
    const client = await pool.connect();
    const results: any[] = [];

    try {
      if (useTransaction) {
        await client.query('BEGIN');
      }

      for (const { query, params } of queries) {
        const startTime = Date.now();
        const result = await client.query(query, params);
        const executionTime = Date.now() - startTime;

        this.recordPerformanceMetric({
          query: query.substring(0, 200),
          executionTime,
          timestamp: Date.now(),
          rowCount: result.rowCount || 0,
        });

        results.push(result.rows);
      }

      if (useTransaction) {
        await client.query('COMMIT');
      }

      return results;
    } catch (error) {
      if (useTransaction) {
        await client.query('ROLLBACK');
      }
      logger.error('Batch query execution failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Optimize common marketplace queries
   */
  async getMarketplaceListingsOptimized(
    pool: Pool,
    filters: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      status?: string;
      sellerId?: string;
    } = {},
    pagination: { page: number; limit: number }
  ): Promise<any> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions dynamically
    if (filters.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    } else {
      conditions.push(`status = $${paramIndex++}`);
      params.push('active');
    }

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`price >= $${paramIndex++}`);
      params.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`price <= $${paramIndex++}`);
      params.push(filters.maxPrice);
    }

    if (filters.sellerId) {
      conditions.push(`seller_id = $${paramIndex++}`);
      params.push(filters.sellerId);
    }

    if (filters.search) {
      conditions.push(`(
        to_tsvector('english', title) @@ plainto_tsquery('english', $${paramIndex}) OR
        to_tsvector('english', description) @@ plainto_tsquery('english', $${paramIndex}) OR
        title ILIKE $${paramIndex + 1} OR
        description ILIKE $${paramIndex + 1}
      )`);
      params.push(filters.search, `%${filters.search}%`);
      paramIndex += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseQuery = `
      SELECT 
        ml.*,
        u.profile->>'name' as seller_name,
        u.profile->>'avatar' as seller_avatar,
        (
          SELECT json_agg(
            json_build_object(
              'id', ii.id,
              'url', ii.image_url,
              'type', ii.image_type
            )
          )
          FROM item_images ii 
          WHERE ii.item_id = ml.item_id
        ) as images
      FROM marketplace_listings ml
      LEFT JOIN users u ON ml.seller_id = u.id
      ${whereClause}
      ORDER BY ml.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM marketplace_listings ml
      ${whereClause}
    `;

    return this.executePaginatedQuery(
      pool,
      baseQuery,
      countQuery,
      params,
      pagination,
      {
        cache: true,
        cacheTTL: 2 * 60 * 1000, // 2 minutes cache for marketplace listings
      }
    );
  }

  /**
   * Optimize wardrobe items query
   */
  async getWardrobeItemsOptimized(
    pool: Pool,
    userId: string,
    filters: {
      category?: string;
      search?: string;
      brand?: string;
    } = {},
    pagination: { page: number; limit: number }
  ): Promise<any> {
    const conditions = ['user_id = $1'];
    const params = [userId];
    let paramIndex = 2;

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }

    if (filters.brand) {
      conditions.push(`brand = $${paramIndex++}`);
      params.push(filters.brand);
    }

    if (filters.search) {
      conditions.push(`(
        name ILIKE $${paramIndex} OR
        brand ILIKE $${paramIndex} OR
        category ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const baseQuery = `
      SELECT 
        vi.*,
        (
          SELECT json_agg(
            json_build_object(
              'id', ii.id,
              'url', ii.image_url,
              'type', ii.image_type,
              'processing_status', ii.processing_status
            )
          )
          FROM item_images ii 
          WHERE ii.item_id = vi.id
        ) as images
      FROM vufs_items vi
      ${whereClause}
      ORDER BY vi.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM vufs_items vi
      ${whereClause}
    `;

    return this.executePaginatedQuery(
      pool,
      baseQuery,
      countQuery,
      params,
      pagination,
      {
        cache: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes cache for wardrobe items
      }
    );
  }

  /**
   * Generate cache key from query and parameters
   */
  private generateCacheKey(query: string, params: any[]): string {
    const queryHash = Buffer.from(query).toString('base64').substring(0, 20);
    const paramsHash = Buffer.from(JSON.stringify(params)).toString('base64').substring(0, 20);
    return `${queryHash}_${paramsHash}`;
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult(key: string): any | null {
    const cached = this.queryCache[key];
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      delete this.queryCache[key];
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached result
   */
  private setCachedResult(key: string, data: any, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (Object.keys(this.queryCache).length >= this.MAX_CACHE_SIZE) {
      const oldestKey = Object.keys(this.queryCache)
        .sort((a, b) => this.queryCache[a].timestamp - this.queryCache[b].timestamp)[0];
      delete this.queryCache[oldestKey];
    }

    this.queryCache[key] = {
      data,
      timestamp: Date.now(),
      ttl,
    };
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(metric: QueryPerformanceMetrics): void {
    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.MAX_METRICS_SIZE) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.MAX_METRICS_SIZE / 2);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: QueryPerformanceMetrics[];
    cacheHitRate: number;
    cacheSize: number;
  } {
    const totalQueries = this.performanceMetrics.length;
    const averageExecutionTime = totalQueries > 0 
      ? this.performanceMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
      : 0;

    const slowQueries = this.performanceMetrics
      .filter(m => m.executionTime > 1000)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries,
      averageExecutionTime,
      slowQueries,
      cacheHitRate: 0, // TODO: Implement cache hit tracking
      cacheSize: Object.keys(this.queryCache).length,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache = {};
    logger.info('Query cache cleared');
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.performanceMetrics = [];
    logger.info('Performance metrics cleared');
  }

  /**
   * Run database maintenance tasks
   */
  async runMaintenance(pool: Pool): Promise<void> {
    try {
      logger.info('Starting database maintenance tasks...');

      // Update table statistics
      await this.executeQuery(pool, 'ANALYZE;');

      // Clean up old performance metrics
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      this.performanceMetrics = this.performanceMetrics.filter(
        m => m.timestamp > cutoffTime
      );

      // Clear expired cache entries
      const expiredKeys = Object.keys(this.queryCache).filter(key => {
        const cached = this.queryCache[key];
        return Date.now() - cached.timestamp > cached.ttl;
      });

      expiredKeys.forEach(key => delete this.queryCache[key]);

      logger.info(`Database maintenance completed. Cleared ${expiredKeys.length} expired cache entries.`);
    } catch (error) {
      logger.error('Database maintenance failed:', error);
    }
  }
}

export const dbPerformance = DatabasePerformanceService.getInstance();