import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface PerformanceMetric {
  id: string;
  type: 'request' | 'database' | 'external_api' | 'custom';
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: {
    method?: string;
    url?: string;
    statusCode?: number;
    userId?: string;
    query?: string;
    endpoint?: string;
    [key: string]: any;
  };
}

export interface SystemMetrics {
  timestamp: Date;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  requests: {
    total: number;
    perMinute: number;
    averageResponseTime: number;
  };
  errors: {
    total: number;
    rate: number;
  };
}

export class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private responseTimes: number[] = [];
  private systemMetricsHistory: SystemMetrics[] = [];
  
  private thresholds = {
    slowRequest: 1000, // ms
    verySlowRequest: 5000, // ms
    slowDatabase: 500, // ms
    slowExternalAPI: 2000, // ms
    highMemoryUsage: 80, // percentage
    highCPUUsage: 80, // percentage
  };

  /**
   * Express middleware for request performance monitoring
   */
  createRequestMonitoringMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || uuidv4();
      
      // Store request start time
      (req as any).startTime = startTime;
      (req as any).requestId = requestId;

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Record performance metric
        const metric: PerformanceMetric = {
          id: uuidv4(),
          type: 'request',
          name: `${req.method} ${req.route?.path || req.path}`,
          duration,
          timestamp: new Date(startTime),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            userId: (req as any).user?.id,
          },
        };

        performanceMonitoringService.recordMetric(metric);
        
        // Call original end method
        originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.set(metric.id, metric);
    
    // Update request tracking
    if (metric.type === 'request') {
      this.updateRequestTracking(metric);
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metric);

    // Log slow operations
    this.logSlowOperations(metric);

    // Clean up old metrics (keep only last 24 hours)
    this.cleanupOldMetrics();
  }

  /**
   * Create a timer for measuring operations
   */
  createTimer(name: string, type: PerformanceMetric['type'] = 'custom'): {
    end: (metadata?: any) => PerformanceMetric;
  } {
    const startTime = Date.now();
    
    return {
      end: (metadata?: any) => {
        const duration = Date.now() - startTime;
        const metric: PerformanceMetric = {
          id: uuidv4(),
          type,
          name,
          duration,
          timestamp: new Date(startTime),
          metadata,
        };
        
        this.recordMetric(metric);
        return metric;
      },
    };
  }

  /**
   * Measure database query performance
   */
  async measureDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    query?: string
  ): Promise<T> {
    const timer = this.createTimer(queryName, 'database');
    
    try {
      const result = await queryFn();
      timer.end({ query, success: true });
      return result;
    } catch (error) {
      timer.end({ query, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Measure external API call performance
   */
  async measureExternalAPI<T>(
    apiName: string,
    apiFn: () => Promise<T>,
    endpoint?: string
  ): Promise<T> {
    const timer = this.createTimer(apiName, 'external_api');
    
    try {
      const result = await apiFn();
      timer.end({ endpoint, success: true });
      return result;
    } catch (error) {
      timer.end({ endpoint, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update request tracking metrics
   */
  private updateRequestTracking(metric: PerformanceMetric): void {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    
    // Update request count
    this.requestCounts.set(minuteKey, (this.requestCounts.get(minuteKey) || 0) + 1);
    
    // Update response times (keep last 1000 for average calculation)
    this.responseTimes.push(metric.duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    let alertType: string | null = null;
    let alertMessage: string | null = null;

    switch (metric.type) {
      case 'request':
        if (metric.duration > this.thresholds.verySlowRequest) {
          alertType = 'VERY_SLOW_REQUEST';
          alertMessage = `Very slow request: ${metric.name} took ${metric.duration}ms`;
        } else if (metric.duration > this.thresholds.slowRequest) {
          alertType = 'SLOW_REQUEST';
          alertMessage = `Slow request: ${metric.name} took ${metric.duration}ms`;
        }
        break;
        
      case 'database':
        if (metric.duration > this.thresholds.slowDatabase) {
          alertType = 'SLOW_DATABASE_QUERY';
          alertMessage = `Slow database query: ${metric.name} took ${metric.duration}ms`;
        }
        break;
        
      case 'external_api':
        if (metric.duration > this.thresholds.slowExternalAPI) {
          alertType = 'SLOW_EXTERNAL_API';
          alertMessage = `Slow external API call: ${metric.name} took ${metric.duration}ms`;
        }
        break;
    }

    if (alertType && alertMessage) {
      this.triggerPerformanceAlert(alertType, alertMessage, metric);
    }
  }

  /**
   * Log slow operations for debugging
   */
  private logSlowOperations(metric: PerformanceMetric): void {
    const isSlowOperation = 
      (metric.type === 'request' && metric.duration > this.thresholds.slowRequest) ||
      (metric.type === 'database' && metric.duration > this.thresholds.slowDatabase) ||
      (metric.type === 'external_api' && metric.duration > this.thresholds.slowExternalAPI);

    if (isSlowOperation) {
      console.warn(`[PERFORMANCE] Slow ${metric.type}: ${metric.name} (${metric.duration}ms)`, {
        metadata: metric.metadata,
        timestamp: metric.timestamp,
      });
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerPerformanceAlert(type: string, message: string, metric: PerformanceMetric): void {
    console.warn(`[PERFORMANCE ALERT ${type}] ${message}`, {
      metric: {
        id: metric.id,
        type: metric.type,
        name: metric.name,
        duration: metric.duration,
        metadata: metric.metadata,
      },
    });

    // In production, this would:
    // 1. Send to alerting service
    // 2. Update monitoring dashboard
    // 3. Trigger auto-scaling if needed
    // 4. Create performance incident
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [id, metric] of this.metrics) {
      if (metric.timestamp < cutoff) {
        this.metrics.delete(id);
      }
    }

    // Clean up request counts
    for (const [key] of this.requestCounts) {
      const parts = key.split('-');
      if (parts.length >= 4) {
        const keyDate = new Date(
          parseInt(parts[0]), // year
          parseInt(parts[1]), // month
          parseInt(parts[2]), // day
          parseInt(parts[3])  // hour
        );
        
        if (keyDate < cutoff) {
          this.requestCounts.delete(key);
        }
      }
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics(): SystemMetrics {
    const now = new Date();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    // Get CPU usage (simplified - in production use proper CPU monitoring)
    const cpuUsage = process.cpuUsage();
    const cpuPercentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage

    // Calculate request metrics
    const currentMinute = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const requestsPerMinute = this.requestCounts.get(currentMinute) || 0;
    const totalRequests = Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0);
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;

    const systemMetrics: SystemMetrics = {
      timestamp: now,
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: memoryPercentage,
      },
      cpu: {
        usage: cpuPercentage,
      },
      requests: {
        total: totalRequests,
        perMinute: requestsPerMinute,
        averageResponseTime,
      },
      errors: {
        total: 0, // This would be populated from error service
        rate: 0,
      },
    };

    // Store in history
    this.systemMetricsHistory.push(systemMetrics);
    
    // Keep only last 24 hours of system metrics
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.systemMetricsHistory = this.systemMetricsHistory.filter(m => m.timestamp > cutoff);

    // Check system thresholds
    this.checkSystemThresholds(systemMetrics);

    return systemMetrics;
  }

  /**
   * Check system performance thresholds
   */
  private checkSystemThresholds(metrics: SystemMetrics): void {
    if (metrics.memory.percentage > this.thresholds.highMemoryUsage) {
      this.triggerPerformanceAlert(
        'HIGH_MEMORY_USAGE',
        `High memory usage: ${metrics.memory.percentage.toFixed(2)}%`,
        {
          id: uuidv4(),
          type: 'custom',
          name: 'system_memory',
          duration: 0,
          timestamp: metrics.timestamp,
          metadata: { memoryPercentage: metrics.memory.percentage },
        }
      );
    }

    if (metrics.cpu.usage > this.thresholds.highCPUUsage) {
      this.triggerPerformanceAlert(
        'HIGH_CPU_USAGE',
        `High CPU usage: ${metrics.cpu.usage.toFixed(2)}%`,
        {
          id: uuidv4(),
          type: 'custom',
          name: 'system_cpu',
          duration: 0,
          timestamp: metrics.timestamp,
          metadata: { cpuUsage: metrics.cpu.usage },
        }
      );
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalMetrics: number;
    averageResponseTime: number;
    slowRequests: number;
    requestsPerMinute: number;
    systemMetrics: SystemMetrics;
    topSlowOperations: PerformanceMetric[];
    metricsByType: Record<string, number>;
  } {
    const metrics = Array.from(this.metrics.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo);
    const requestMetrics = recentMetrics.filter(m => m.type === 'request');
    
    const averageResponseTime = requestMetrics.length > 0
      ? requestMetrics.reduce((sum, m) => sum + m.duration, 0) / requestMetrics.length
      : 0;
    
    const slowRequests = requestMetrics.filter(m => m.duration > this.thresholds.slowRequest).length;
    
    const currentMinute = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const requestsPerMinute = this.requestCounts.get(currentMinute) || 0;
    
    const topSlowOperations = metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    const metricsByType = metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMetrics: metrics.length,
      averageResponseTime,
      slowRequests,
      requestsPerMinute,
      systemMetrics: this.collectSystemMetrics(),
      topSlowOperations,
      metricsByType,
    };
  }

  /**
   * Get metrics by type and time range
   */
  getMetrics(
    type?: PerformanceMetric['type'],
    startTime?: Date,
    endTime?: Date
  ): PerformanceMetric[] {
    let metrics = Array.from(this.metrics.values());
    
    if (type) {
      metrics = metrics.filter(m => m.type === type);
    }
    
    if (startTime) {
      metrics = metrics.filter(m => m.timestamp >= startTime);
    }
    
    if (endTime) {
      metrics = metrics.filter(m => m.timestamp <= endTime);
    }
    
    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get system metrics history
   */
  getSystemMetricsHistory(hours: number = 24): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.systemMetricsHistory.filter(m => m.timestamp > cutoff);
  }
}

// Export singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();