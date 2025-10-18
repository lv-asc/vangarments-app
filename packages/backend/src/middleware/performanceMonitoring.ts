import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { RequestWithId } from './requestId';

interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  slowRequests: number;
  errorCount: number;
  lastReset: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private slowRequestThreshold: number = 1000; // 1 second
  private resetInterval: number = 60000; // 1 minute
  private resetTimer?: NodeJS.Timeout;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startResetTimer();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      errorCount: 0,
      lastReset: new Date(),
    };
  }

  private startResetTimer(): void {
    this.resetTimer = setInterval(() => {
      this.logMetrics();
      this.resetMetrics();
    }, this.resetInterval);
  }

  private resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  private logMetrics(): void {
    if (this.metrics.requestCount > 0) {
      logger.logPerformanceMetric('requests_per_minute', this.metrics.requestCount, 'req/min', {
        averageResponseTime: this.metrics.averageResponseTime,
        slowRequests: this.metrics.slowRequests,
        errorCount: this.metrics.errorCount,
      });
    }
  }

  public recordRequest(responseTime: number, isError: boolean = false): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    if (responseTime > this.slowRequestThreshold) {
      this.metrics.slowRequests++;
    }

    if (isError) {
      this.metrics.errorCount++;
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public destroy(): void {
    if (this.resetTimer) {
      clearInterval(this.resetTimer);
    }
  }
}

const performanceMonitor = new PerformanceMonitor();

export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req as RequestWithId).requestId;
  const userId = (req as any).user?.id;

  // Log request start
  logger.info(`Request started: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  }, requestId, userId);

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;

    // Record metrics
    performanceMonitor.recordRequest(responseTime, isError);

    // Log request completion
    logger.logApiRequest(req.method, req.path, res.statusCode, responseTime, requestId, userId);

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.path}`, {
        responseTime,
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
      }, requestId, userId);
    }

    // Log performance metric
    logger.logPerformanceMetric('response_time', responseTime, 'ms', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    }, requestId);

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

export { performanceMonitor };
export default performanceMonitoringMiddleware;