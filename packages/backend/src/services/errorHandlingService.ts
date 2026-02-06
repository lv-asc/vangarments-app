import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorContext {
  requestId: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  body?: any;
  query?: any;
  params?: any;
  timestamp: Date;
}

export interface ErrorReport {
  id: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'database' | 'external_api' | 'business_logic' | 'system' | 'unknown';
  resolved: boolean;
  createdAt: Date;
}

export class ErrorHandlingService {
  private errorReports: Map<string, ErrorReport> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private alertThresholds = {
    errorRate: 10, // errors per minute
    criticalErrors: 3, // critical errors per hour
    userErrors: 5, // errors per user per hour
  };

  /**
   * Create standardized error response
   */
  createErrorResponse(
    error: Error,
    context: Partial<ErrorContext>,
    statusCode: number = 500
  ): {
    status: number;
    body: {
      error: {
        code: string;
        message: string;
        requestId: string;
        timestamp: string;
        details?: any;
      };
    };
  } {
    const requestId = context.requestId || uuidv4();
    const timestamp = new Date().toISOString();

    // Log error for monitoring
    this.logError(error, { ...context, requestId, timestamp: new Date(timestamp) });

    // Determine error code
    const errorCode = this.getErrorCode(error, statusCode);

    // Create user-friendly message
    const userMessage = this.getUserFriendlyMessage(error, statusCode);

    return {
      status: statusCode,
      body: {
        error: {
          code: errorCode,
          message: userMessage,
          requestId,
          timestamp,
          ...(process.env.NODE_ENV === 'development' && {
            details: {
              originalMessage: error.message,
              stack: error.stack,
            },
          }),
        },
      },
    };
  }

  /**
   * Express error handling middleware
   */
  createErrorMiddleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const context: Partial<ErrorContext> = {
        requestId: req.headers['x-request-id'] as string || uuidv4(),
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params,
      };

      // Determine status code
      let statusCode = 500;
      if ((error as any).status) {
        statusCode = (error as any).status;
      } else if ((error as any).statusCode) {
        statusCode = (error as any).statusCode;
      } else if (error.name === 'ValidationError') {
        statusCode = 400;
      } else if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
        statusCode = 401;
      } else if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
        statusCode = 403;
      } else if (error.name === 'NotFoundError' || error.message.includes('not found')) {
        statusCode = 404;
      }

      const errorResponse = this.createErrorResponse(error, context, statusCode);

      // Send response
      res.status(errorResponse.status).json(errorResponse.body);
    };
  }

  /**
   * Log error with context
   */
  private logError(error: Error, context: Partial<ErrorContext>): void {
    const errorReport: ErrorReport = {
      id: uuidv4(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      context: {
        requestId: context.requestId || uuidv4(),
        userId: context.userId,
        userAgent: context.userAgent,
        ip: context.ip,
        method: context.method,
        url: context.url,
        body: context.body,
        query: context.query,
        params: context.params,
        timestamp: context.timestamp || new Date(),
      },
      severity: this.determineSeverity(error, context),
      category: this.categorizeError(error),
      resolved: false,
      createdAt: new Date(),
    };

    // Store error report
    this.errorReports.set(errorReport.id, errorReport);

    // Update error counts for monitoring
    this.updateErrorCounts(errorReport);

    // Log to console (in production, this would go to a logging service)
    console.error(`[ERROR ${errorReport.severity.toUpperCase()}] ${errorReport.id}:`, {
      error: errorReport.error,
      context: errorReport.context,
      category: errorReport.category,
    });

    // Check for alert conditions
    this.checkAlertConditions(errorReport);

    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorReport);
    }
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context: Partial<ErrorContext>): ErrorReport['severity'] {
    // Critical errors
    if (
      error.name === 'DatabaseError' ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout') ||
      error.message.includes('out of memory')
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      error.name === 'SecurityError' ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      context.url?.includes('/auth/')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      error.name === 'ValidationError' ||
      error.name === 'BusinessLogicError' ||
      context.method === 'POST' ||
      context.method === 'PUT' ||
      context.method === 'DELETE'
    ) {
      return 'medium';
    }

    // Low severity errors (default)
    return 'low';
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: Error): ErrorReport['category'] {
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return 'validation';
    }
    if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      return 'authentication';
    }
    if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
      return 'authorization';
    }
    if (error.name === 'DatabaseError' || error.message.includes('database')) {
      return 'database';
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'external_api';
    }
    if (error.name === 'BusinessLogicError') {
      return 'business_logic';
    }
    if (error.message.includes('memory') || error.message.includes('timeout')) {
      return 'system';
    }
    return 'unknown';
  }

  /**
   * Get error code for API response
   */
  private getErrorCode(error: Error, statusCode: number): string {
    if ((error as any).code) {
      return (error as any).code;
    }

    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: Error, statusCode: number): string {
    // Don't expose internal error details to users
    switch (statusCode) {
      case 400:
        return 'The request contains invalid data. Please check your submission.';
      case 401:
        return 'Unauthorized access. Please log in to continue.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Data conflict. The resource already exists or is being used.';
      case 422:
        return 'The provided data is invalid. Please verify and try again.';
      case 429:
        return 'Too many requests. Please try again in a few moments.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Communication error with the server. Please try again.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Update error counts for monitoring
   */
  private updateErrorCounts(errorReport: ErrorReport): void {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const userHourKey = `${errorReport.context.userId}-${hourKey}`;

    // Update counts
    this.errorCounts.set(minuteKey, (this.errorCounts.get(minuteKey) || 0) + 1);
    this.errorCounts.set(`critical-${hourKey}`,
      (this.errorCounts.get(`critical-${hourKey}`) || 0) + (errorReport.severity === 'critical' ? 1 : 0)
    );
    if (errorReport.context.userId) {
      this.errorCounts.set(`user-${userHourKey}`, (this.errorCounts.get(`user-${userHourKey}`) || 0) + 1);
    }

    // Clean up old counts (keep only last 24 hours)
    this.cleanupOldCounts();
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(errorReport: ErrorReport): void {
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    const userHourKey = `${errorReport.context.userId}-${hourKey}`;

    // Check error rate threshold
    const errorRate = this.errorCounts.get(minuteKey) || 0;
    if (errorRate >= this.alertThresholds.errorRate) {
      this.triggerAlert('HIGH_ERROR_RATE', `Error rate exceeded: ${errorRate} errors in the last minute`);
    }

    // Check critical error threshold
    const criticalErrors = this.errorCounts.get(`critical-${hourKey}`) || 0;
    if (criticalErrors >= this.alertThresholds.criticalErrors) {
      this.triggerAlert('CRITICAL_ERRORS', `Critical error threshold exceeded: ${criticalErrors} critical errors in the last hour`);
    }

    // Check user error threshold
    if (errorReport.context.userId) {
      const userErrors = this.errorCounts.get(`user-${userHourKey}`) || 0;
      if (userErrors >= this.alertThresholds.userErrors) {
        this.triggerAlert('USER_ERROR_SPIKE', `User error spike: ${userErrors} errors for user ${errorReport.context.userId} in the last hour`);
      }
    }
  }

  /**
   * Trigger monitoring alert
   */
  private triggerAlert(type: string, message: string): void {
    console.warn(`[ALERT ${type}] ${message}`);

    // In production, this would:
    // 1. Send to alerting service (PagerDuty, Slack, etc.)
    // 2. Create incident ticket
    // 3. Notify on-call engineer
    // 4. Update monitoring dashboard
  }

  /**
   * Clean up old error counts
   */
  private cleanupOldCounts(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [key] of this.errorCounts) {
      // Parse timestamp from key and remove if too old
      const parts = key.split('-');
      if (parts.length >= 4) {
        const keyDate = new Date(
          parseInt(parts[0]), // year
          parseInt(parts[1]), // month
          parseInt(parts[2]), // day
          parseInt(parts[3])  // hour
        );

        if (keyDate < cutoff) {
          this.errorCounts.delete(key);
        }
      }
    }
  }

  /**
   * Send error to external monitoring service
   */
  private sendToMonitoringService(errorReport: ErrorReport): void {
    // In production, this would send to services like:
    // - Sentry
    // - Datadog
    // - New Relic
    // - CloudWatch
    // - Custom monitoring endpoint

    console.log(`[MONITORING] Sending error report ${errorReport.id} to external service`);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
    errorRate: number;
  } {
    const errors = Array.from(this.errorReports.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = errors.filter(error => error.createdAt > oneHourAgo);

    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: recentErrors.slice(-10), // Last 10 recent errors
      errorRate: recentErrors.length, // Errors per hour
    };
  }

  /**
   * Get specific error report
   */
  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errorReports.get(errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();