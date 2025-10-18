import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export enum ErrorCode {
  // Database errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'DATABASE_QUERY_FAILED',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  
  // Authentication errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED',
  STORAGE_FULL = 'STORAGE_FULL',
  
  // API errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API_FAILED = 'EXTERNAL_API_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  ENVIRONMENT_ERROR = 'ENVIRONMENT_ERROR',
  
  // Business logic errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  context?: any;
  recoveryActions?: string[];
  shouldRetry?: boolean;
  retryAfter?: number;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: any;
  public readonly recoveryActions?: string[];
  public readonly shouldRetry?: boolean;
  public readonly retryAfter?: number;
  public readonly timestamp: Date;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.context = details.context;
    this.recoveryActions = details.recoveryActions;
    this.shouldRetry = details.shouldRetry;
    this.retryAfter = details.retryAfter;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      recoveryActions: this.recoveryActions,
      shouldRetry: this.shouldRetry,
      retryAfter: this.retryAfter,
      timestamp: this.timestamp,
    };
  }
}

export class ErrorHandler {
  public static createDatabaseError(message: string, originalError?: Error, context?: any): AppError {
    return new AppError({
      code: ErrorCode.DATABASE_QUERY_FAILED,
      message: `Database operation failed: ${message}`,
      statusCode: 500,
      context: { ...context, originalError: originalError?.message },
      recoveryActions: [
        'Check database connection',
        'Verify query syntax',
        'Check database permissions',
        'Retry the operation'
      ],
      shouldRetry: true,
      retryAfter: 5000,
    });
  }

  public static createAuthenticationError(message: string, context?: any): AppError {
    return new AppError({
      code: ErrorCode.AUTHENTICATION_FAILED,
      message: `Authentication failed: ${message}`,
      statusCode: 401,
      context,
      recoveryActions: [
        'Check credentials',
        'Verify token validity',
        'Re-authenticate'
      ],
      shouldRetry: false,
    });
  }

  public static createValidationError(message: string, context?: any): AppError {
    return new AppError({
      code: ErrorCode.VALIDATION_FAILED,
      message: `Validation failed: ${message}`,
      statusCode: 400,
      context,
      recoveryActions: [
        'Check input format',
        'Verify required fields',
        'Review validation rules'
      ],
      shouldRetry: false,
    });
  }

  public static createFileError(message: string, context?: any): AppError {
    return new AppError({
      code: ErrorCode.FILE_PROCESSING_FAILED,
      message: `File operation failed: ${message}`,
      statusCode: 500,
      context,
      recoveryActions: [
        'Check file permissions',
        'Verify file format',
        'Check available storage space',
        'Retry the operation'
      ],
      shouldRetry: true,
      retryAfter: 3000,
    });
  }

  public static createConfigurationError(message: string, context?: any): AppError {
    return new AppError({
      code: ErrorCode.CONFIGURATION_ERROR,
      message: `Configuration error: ${message}`,
      statusCode: 500,
      context,
      recoveryActions: [
        'Check environment variables',
        'Verify configuration files',
        'Review system settings',
        'Restart the application'
      ],
      shouldRetry: false,
    });
  }

  public static createResourceNotFoundError(resource: string, id?: string): AppError {
    return new AppError({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `${resource} not found${id ? ` with ID: ${id}` : ''}`,
      statusCode: 404,
      context: { resource, id },
      recoveryActions: [
        'Verify the resource ID',
        'Check if the resource exists',
        'Review access permissions'
      ],
      shouldRetry: false,
    });
  }

  public static handleDatabaseError(error: any, operation: string, table?: string): AppError {
    const context = { operation, table, originalError: error.message };

    // PostgreSQL specific error handling
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique constraint violation
          return new AppError({
            code: ErrorCode.DATABASE_CONSTRAINT_VIOLATION,
            message: 'Resource already exists',
            statusCode: 409,
            context,
            recoveryActions: ['Use a different value', 'Update existing resource'],
            shouldRetry: false,
          });
        
        case '23503': // Foreign key constraint violation
          return new AppError({
            code: ErrorCode.DATABASE_CONSTRAINT_VIOLATION,
            message: 'Referenced resource does not exist',
            statusCode: 400,
            context,
            recoveryActions: ['Create the referenced resource first', 'Check foreign key values'],
            shouldRetry: false,
          });
        
        case '23502': // Not null constraint violation
          return new AppError({
            code: ErrorCode.MISSING_REQUIRED_FIELD,
            message: 'Required field is missing',
            statusCode: 400,
            context,
            recoveryActions: ['Provide all required fields'],
            shouldRetry: false,
          });
        
        case 'ECONNREFUSED':
        case '08006': // Connection failure
          return new AppError({
            code: ErrorCode.DATABASE_CONNECTION_FAILED,
            message: 'Database connection failed',
            statusCode: 503,
            context,
            recoveryActions: ['Check database server status', 'Verify connection settings', 'Retry connection'],
            shouldRetry: true,
            retryAfter: 10000,
          });
      }
    }

    return this.createDatabaseError(error.message, error, context);
  }

  public static middleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] as string;
      const userId = (req as any).user?.id;

      // Handle AppError instances
      if (error instanceof AppError) {
        logger.error(
          `Application error: ${error.message}`,
          {
            code: error.code,
            statusCode: error.statusCode,
            context: error.context,
            url: req.url,
            method: req.method,
            userAgent: req.headers['user-agent'],
          },
          error,
          requestId,
          userId
        );

        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            recoveryActions: error.recoveryActions,
            shouldRetry: error.shouldRetry,
            retryAfter: error.retryAfter,
            timestamp: error.timestamp,
          },
          requestId,
        });
      }

      // Handle unexpected errors
      logger.error(
        `Unexpected error: ${error.message}`,
        {
          url: req.url,
          method: req.method,
          userAgent: req.headers['user-agent'],
        },
        error,
        requestId,
        userId
      );

      res.status(500).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred',
          recoveryActions: ['Try again later', 'Contact support if the problem persists'],
          shouldRetry: true,
          retryAfter: 5000,
          timestamp: new Date(),
        },
        requestId,
      });
    };
  }

  public static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

export default ErrorHandler;