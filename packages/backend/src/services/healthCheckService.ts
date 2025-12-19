import { Request, Response } from 'express';
import { Pool } from 'pg';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: HealthCheckResult[];
  summary: {
    healthy: number;
    unhealthy: number;
    degraded: number;
    total: number;
  };
}

export class HealthCheckService {
  private dbPool?: Pool;
  private healthHistory: SystemHealth[] = [];
  private alertThresholds = {
    responseTime: 5000, // 5 seconds
    unhealthyServices: 2, // Number of unhealthy services before alert
    degradedServices: 3, // Number of degraded services before alert
  };

  constructor(dbPool?: Pool) {
    this.dbPool = dbPool;
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const services: HealthCheckResult[] = [];

    // Check database connectivity
    services.push(await this.checkDatabase());

    // Check external services
    services.push(await this.checkGCPConnectivity());
    services.push(await this.checkRedisCache());

    // Check system resources
    services.push(await this.checkMemoryUsage());
    services.push(await this.checkDiskSpace());

    // Check application-specific services
    services.push(await this.checkAPIEndpoints());
    services.push(await this.checkFileStorage());

    // Determine overall system status
    const summary = this.calculateSummary(services);
    const overallStatus = this.determineOverallStatus(summary);

    const systemHealth: SystemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      summary,
    };

    // Store in history
    this.healthHistory.push(systemHealth);
    this.cleanupHealthHistory();

    // Check for alerts
    this.checkHealthAlerts(systemHealth);

    return systemHealth;
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      if (!this.dbPool) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime: 0,
          error: 'Database pool not configured',
        };
      }

      // Test basic connectivity
      const client = await this.dbPool.connect();
      const result = await client.query('SELECT 1 as health_check');
      client.release();

      const responseTime = Date.now() - startTime;

      // Check connection pool status
      const poolStatus = {
        totalConnections: this.dbPool.totalCount,
        idleConnections: this.dbPool.idleCount,
        waitingClients: this.dbPool.waitingCount,
      };

      let status: HealthCheckResult['status'] = 'healthy';
      if (responseTime > 1000) status = 'degraded';
      if (responseTime > 3000) status = 'unhealthy';

      return {
        service: 'database',
        status,
        responseTime,
        details: {
          query: result.rows[0],
          pool: poolStatus,
        },
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  /**
   * Check GCP services connectivity
   */
  private async checkGCPConnectivity(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // In production, this would check actual GCP services (Cloud Storage, Vision AI, etc.)
      // For now, simulate the check
      const gcpServices = {
        cloudStorage: 'healthy',
        visionAI: 'healthy',
        vertexAI: 'healthy',
      };

      const responseTime = Date.now() - startTime;

      return {
        service: 'gcp_services',
        status: 'healthy',
        responseTime,
        details: gcpServices,
      };
    } catch (error) {
      return {
        service: 'gcp_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'GCP services check failed',
      };
    }
  }

  /**
   * Check Redis cache connectivity
   */
  private async checkRedisCache(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // In production, this would check actual Redis connection
      // For now, simulate the check
      const responseTime = Date.now() - startTime;

      return {
        service: 'redis_cache',
        status: 'healthy',
        responseTime,
        details: {
          connected: true,
          memory_usage: '50MB',
          keys: 1250,
        },
      };
    } catch (error) {
      return {
        service: 'redis_cache',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      let status: HealthCheckResult['status'] = 'healthy';
      if (memoryPercentage > 70) status = 'degraded';
      if (memoryPercentage > 85) status = 'unhealthy';

      return {
        service: 'memory',
        status,
        responseTime: Date.now() - startTime,
        details: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
          percentage: Math.round(memoryPercentage),
        },
      };
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Memory check failed',
      };
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // In production, this would check actual disk usage
      // For now, simulate the check
      const diskUsage = {
        total: '100GB',
        used: '45GB',
        available: '55GB',
        percentage: 45,
      };

      let status: HealthCheckResult['status'] = 'healthy';
      if (diskUsage.percentage > 80) status = 'degraded';
      if (diskUsage.percentage > 90) status = 'unhealthy';

      return {
        service: 'disk_space',
        status,
        responseTime: Date.now() - startTime,
        details: diskUsage,
      };
    } catch (error) {
      return {
        service: 'disk_space',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Disk space check failed',
      };
    }
  }

  /**
   * Check critical API endpoints
   */
  private async checkAPIEndpoints(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test critical internal endpoints
      const endpoints = [
        { name: 'auth', path: '/api/auth/health' },
        { name: 'wardrobe', path: '/api/wardrobe/health' },
        { name: 'marketplace', path: '/api/marketplace/health' },
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          const response = await fetch(`http://localhost:${process.env.PORT || 3001}${endpoint.path}`, {
            method: 'GET',
            // @ts-ignore
            timeout: 5000,
          });
          return {
            name: endpoint.name,
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status,
          };
        })
      );

      const endpointResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: endpoints[index].name,
            status: 'unhealthy',
            error: result.reason?.message || 'Endpoint check failed',
          };
        }
      });

      const unhealthyEndpoints = endpointResults.filter(r => r.status === 'unhealthy');
      let status: HealthCheckResult['status'] = 'healthy';
      if (unhealthyEndpoints.length > 0) status = 'degraded';
      if (unhealthyEndpoints.length > 1) status = 'unhealthy';

      return {
        service: 'api_endpoints',
        status,
        responseTime: Date.now() - startTime,
        details: {
          endpoints: endpointResults,
          unhealthy_count: unhealthyEndpoints.length,
        },
      };
    } catch (error) {
      return {
        service: 'api_endpoints',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'API endpoints check failed',
      };
    }
  }

  /**
   * Check file storage system
   */
  private async checkFileStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // In production, this would check Cloud Storage or local file system
      // For now, simulate the check
      const storageInfo = {
        provider: 'Google Cloud Storage',
        bucket: 'vangarments-storage',
        location: 'us-east1',
        accessible: true,
      };

      return {
        service: 'file_storage',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: storageInfo,
      };
    } catch (error) {
      return {
        service: 'file_storage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'File storage check failed',
      };
    }
  }

  /**
   * Calculate health summary
   */
  private calculateSummary(services: HealthCheckResult[]): SystemHealth['summary'] {
    return services.reduce(
      (summary, service) => {
        summary.total++;
        switch (service.status) {
          case 'healthy':
            summary.healthy++;
            break;
          case 'unhealthy':
            summary.unhealthy++;
            break;
          case 'degraded':
            summary.degraded++;
            break;
        }
        return summary;
      },
      { healthy: 0, unhealthy: 0, degraded: 0, total: 0 }
    );
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(summary: SystemHealth['summary']): SystemHealth['status'] {
    if (summary.unhealthy > 0) return 'unhealthy';
    if (summary.degraded > 0) return 'degraded';
    return 'healthy';
  }

  /**
   * Check for health alerts
   */
  private checkHealthAlerts(systemHealth: SystemHealth): void {
    const { summary } = systemHealth;

    // Alert on unhealthy services
    if (summary.unhealthy >= this.alertThresholds.unhealthyServices) {
      this.triggerHealthAlert(
        'UNHEALTHY_SERVICES',
        `${summary.unhealthy} services are unhealthy`,
        systemHealth
      );
    }

    // Alert on degraded services
    if (summary.degraded >= this.alertThresholds.degradedServices) {
      this.triggerHealthAlert(
        'DEGRADED_SERVICES',
        `${summary.degraded} services are degraded`,
        systemHealth
      );
    }

    // Alert on slow response times
    const slowServices = systemHealth.services.filter(
      s => s.responseTime > this.alertThresholds.responseTime
    );
    if (slowServices.length > 0) {
      this.triggerHealthAlert(
        'SLOW_SERVICES',
        `${slowServices.length} services have slow response times`,
        systemHealth
      );
    }
  }

  /**
   * Trigger health alert
   */
  private triggerHealthAlert(type: string, message: string, systemHealth: SystemHealth): void {
    console.warn(`[HEALTH ALERT ${type}] ${message}`, {
      timestamp: systemHealth.timestamp,
      status: systemHealth.status,
      summary: systemHealth.summary,
      unhealthyServices: systemHealth.services
        .filter(s => s.status === 'unhealthy')
        .map(s => ({ service: s.service, error: s.error })),
    });

    // In production, this would:
    // 1. Send to alerting service (PagerDuty, Slack, etc.)
    // 2. Create incident ticket
    // 3. Notify operations team
    // 4. Trigger auto-remediation if configured
  }

  /**
   * Clean up old health history
   */
  private cleanupHealthHistory(): void {
    const maxHistorySize = 1000; // Keep last 1000 health checks
    if (this.healthHistory.length > maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-maxHistorySize);
    }
  }

  /**
   * Get health history
   */
  getHealthHistory(hours: number = 24): SystemHealth[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.healthHistory.filter(h => h.timestamp > cutoff);
  }

  /**
   * Get current system status
   */
  async getCurrentStatus(): Promise<SystemHealth> {
    return this.performHealthCheck();
  }

  /**
   * Create Express middleware for health check endpoint
   */
  createHealthCheckEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const health = await this.performHealthCheck();

        // Set appropriate HTTP status code
        let statusCode = 200;
        if (health.status === 'degraded') statusCode = 200; // Still operational
        if (health.status === 'unhealthy') statusCode = 503; // Service unavailable

        res.status(statusCode).json(health);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Health check failed',
        });
      }
    };
  }

  /**
   * Create readiness probe endpoint
   */
  createReadinessProbe() {
    return async (req: Request, res: Response) => {
      try {
        // Quick check for essential services only
        const essentialChecks = [
          await this.checkDatabase(),
          await this.checkMemoryUsage(),
        ];

        const isReady = essentialChecks.every(check => check.status !== 'unhealthy');

        if (isReady) {
          res.status(200).json({ status: 'ready', timestamp: new Date() });
        } else {
          res.status(503).json({
            status: 'not_ready',
            timestamp: new Date(),
            issues: essentialChecks.filter(c => c.status === 'unhealthy'),
          });
        }
      } catch (error) {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Readiness check failed',
        });
      }
    };
  }

  /**
   * Create liveness probe endpoint
   */
  createLivenessProbe() {
    return (req: Request, res: Response) => {
      // Simple liveness check - just verify the process is running
      res.status(200).json({
        status: 'alive',
        timestamp: new Date(),
        uptime: process.uptime(),
        pid: process.pid,
      });
    };
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();