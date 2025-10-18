import { Request, Response } from 'express';
import { db } from '../database/connection';
import { logger } from './logger';
import { localConfig } from '../config/local';
import fs from 'fs';
import path from 'path';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
}

export class HealthChecker {
  private startTime: Date;
  private version: string;

  constructor() {
    this.startTime = new Date();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  public async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      await db.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;
      
      logger.logHealthCheck('database', 'healthy', { responseTime });
      
      return {
        service: 'database',
        status: 'healthy',
        responseTime,
        details: {
          connectionString: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'),
          queryTime: `${responseTime}ms`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.logHealthCheck('database', 'unhealthy', { error: errorMessage, responseTime });
      
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
        details: {
          connectionString: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'),
        },
      };
    }
  }

  public async checkFileSystem(): Promise<HealthCheckResult> {
    const start = Date.now();
    const config = localConfig.getConfig();
    
    try {
      if (!config.storage.enabled) {
        return {
          service: 'filesystem',
          status: 'healthy',
          responseTime: Date.now() - start,
          details: {
            message: 'Local storage disabled',
          },
        };
      }

      // Check if storage directories exist and are writable
      const testFile = path.join(config.storage.paths.temp, 'health-check.txt');
      const testContent = `Health check at ${new Date().toISOString()}`;
      
      fs.writeFileSync(testFile, testContent);
      const readContent = fs.readFileSync(testFile, 'utf8');
      fs.unlinkSync(testFile);
      
      if (readContent !== testContent) {
        throw new Error('File content mismatch');
      }

      const responseTime = Date.now() - start;
      
      logger.logHealthCheck('filesystem', 'healthy', { responseTime });
      
      return {
        service: 'filesystem',
        status: 'healthy',
        responseTime,
        details: {
          basePath: config.storage.basePath,
          writeable: true,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.logHealthCheck('filesystem', 'unhealthy', { error: errorMessage, responseTime });
      
      return {
        service: 'filesystem',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
        details: {
          basePath: config.storage.basePath,
          writeable: false,
        },
      };
    }
  }

  public async checkMemory(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      const responseTime = Date.now() - start;
      const isHealthy = memoryUsagePercent < 90; // Consider unhealthy if using more than 90% of heap
      
      logger.logHealthCheck('memory', isHealthy ? 'healthy' : 'unhealthy', {
        memoryUsagePercent,
        responseTime,
      });
      
      return {
        service: 'memory',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          heapUsed: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          usagePercent: `${memoryUsagePercent.toFixed(2)}%`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.logHealthCheck('memory', 'unhealthy', { error: errorMessage, responseTime });
      
      return {
        service: 'memory',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  public async checkConfiguration(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const config = localConfig.getConfig();
      const isValid = localConfig.validateConfig();
      
      const responseTime = Date.now() - start;
      
      logger.logHealthCheck('configuration', isValid ? 'healthy' : 'unhealthy', {
        responseTime,
        isValid,
      });
      
      return {
        service: 'configuration',
        status: isValid ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          environment: config.server.environment,
          port: config.server.port,
          storageEnabled: config.storage.enabled,
          loggingEnabled: config.logging.enableFile,
        },
        error: isValid ? undefined : 'Configuration validation failed',
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.logHealthCheck('configuration', 'unhealthy', { error: errorMessage, responseTime });
      
      return {
        service: 'configuration',
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
      };
    }
  }

  public async performFullHealthCheck(): Promise<SystemHealth> {
    const start = Date.now();
    
    logger.info('Starting full system health check');
    
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkFileSystem(),
      this.checkMemory(),
      this.checkConfiguration(),
    ]);
    
    const healthyCount = checks.filter(check => check.status === 'healthy').length;
    const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      overallStatus = 'healthy';
    } else if (unhealthyCount < checks.length / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    const uptime = Date.now() - this.startTime.getTime();
    const totalTime = Date.now() - start;
    
    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000), // in seconds
      version: this.version,
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary: {
        total: checks.length,
        healthy: healthyCount,
        unhealthy: unhealthyCount,
      },
    };
    
    logger.info(`Health check completed in ${totalTime}ms`, {
      status: overallStatus,
      healthy: healthyCount,
      unhealthy: unhealthyCount,
    });
    
    return health;
  }

  public createHealthEndpoint() {
    return async (req: Request, res: Response) => {
      const requestId = req.headers['x-request-id'] as string;
      
      try {
        const health = await this.performFullHealthCheck();
        
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        logger.logApiRequest(req.method, req.path, statusCode, 0, requestId);
        
        res.status(statusCode).json({
          success: true,
          data: health,
          requestId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Health check failed';
        
        logger.error('Health check endpoint failed', { error: errorMessage }, error as Error, requestId);
        
        res.status(500).json({
          success: false,
          error: {
            code: 'HEALTH_CHECK_FAILED',
            message: errorMessage,
          },
          requestId,
        });
      }
    };
  }

  public createReadinessEndpoint() {
    return async (req: Request, res: Response) => {
      const requestId = req.headers['x-request-id'] as string;
      
      try {
        // Only check critical services for readiness
        const dbCheck = await this.checkDatabase();
        const configCheck = await this.checkConfiguration();
        
        const isReady = dbCheck.status === 'healthy' && configCheck.status === 'healthy';
        const statusCode = isReady ? 200 : 503;
        
        logger.logApiRequest(req.method, req.path, statusCode, 0, requestId);
        
        res.status(statusCode).json({
          success: true,
          data: {
            ready: isReady,
            timestamp: new Date().toISOString(),
            checks: [dbCheck, configCheck],
          },
          requestId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Readiness check failed';
        
        logger.error('Readiness check endpoint failed', { error: errorMessage }, error as Error, requestId);
        
        res.status(500).json({
          success: false,
          error: {
            code: 'READINESS_CHECK_FAILED',
            message: errorMessage,
          },
          requestId,
        });
      }
    };
  }

  public createLivenessEndpoint() {
    return (req: Request, res: Response) => {
      const requestId = req.headers['x-request-id'] as string;
      
      // Simple liveness check - just return that the process is running
      const uptime = Date.now() - this.startTime.getTime();
      
      logger.logApiRequest(req.method, req.path, 200, 0, requestId);
      
      res.status(200).json({
        success: true,
        data: {
          alive: true,
          timestamp: new Date().toISOString(),
          uptime: Math.floor(uptime / 1000),
          version: this.version,
        },
        requestId,
      });
    };
  }
}

export const healthChecker = new HealthChecker();
export default healthChecker;