import { Router, Request, Response } from 'express';
import { healthChecker } from '../utils/healthCheck';
import { performanceMonitor } from '../middleware/performanceMonitoring';
import { logger } from '../utils/logger';
import { localConfig } from '../config/local';
import { ErrorHandler } from '../utils/errorHandler';

const router = Router();

// Health check endpoint
router.get('/health', healthChecker.createHealthEndpoint());

// Readiness check endpoint (for Kubernetes/Docker)
router.get('/ready', healthChecker.createReadinessEndpoint());

// Liveness check endpoint (for Kubernetes/Docker)
router.get('/live', healthChecker.createLivenessEndpoint());

// Performance metrics endpoint
router.get('/metrics', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    const metrics = performanceMonitor.getMetrics();
    const config = localConfig.getConfig();
    
    const systemMetrics = {
      performance: metrics,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      configuration: {
        environment: config.server.environment,
        port: config.server.port,
        storageEnabled: config.storage.enabled,
        loggingLevel: config.logging.level,
      },
    };
    
    logger.info('Metrics requested', { metricsType: 'system' }, requestId);
    
    res.json({
      success: true,
      data: systemMetrics,
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error) {
    throw ErrorHandler.createConfigurationError('Failed to retrieve metrics', { error });
  }
}));

// Database status endpoint
router.get('/database', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    const dbCheck = await healthChecker.checkDatabase();
    
    logger.info('Database status requested', { status: dbCheck.status }, requestId);
    
    const statusCode = dbCheck.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: dbCheck,
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error) {
    throw ErrorHandler.createDatabaseError('Failed to check database status', error as Error);
  }
}));

// Storage status endpoint
router.get('/storage', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    const storageCheck = await healthChecker.checkFileSystem();
    
    logger.info('Storage status requested', { status: storageCheck.status }, requestId);
    
    const statusCode = storageCheck.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: storageCheck,
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error) {
    throw ErrorHandler.createFileError('Failed to check storage status', { error });
  }
}));

// Configuration status endpoint
router.get('/config', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    const configCheck = await healthChecker.checkConfiguration();
    
    logger.info('Configuration status requested', { status: configCheck.status }, requestId);
    
    const statusCode = configCheck.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: configCheck,
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error) {
    throw ErrorHandler.createConfigurationError('Failed to check configuration status', { error });
  }
}));

// Log level endpoint (for dynamic log level changes)
router.post('/log-level', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  const { level } = req.body;
  
  if (!level || !['error', 'warn', 'info', 'debug'].includes(level.toLowerCase())) {
    throw ErrorHandler.createValidationError('Invalid log level. Must be one of: error, warn, info, debug');
  }
  
  try {
    const config = localConfig.getConfig();
    localConfig.updateConfig({
      ...config,
      logging: {
        ...config.logging,
        level: level.toLowerCase(),
      },
    });
    
    logger.info(`Log level changed to: ${level}`, { previousLevel: config.logging.level }, requestId);
    
    res.json({
      success: true,
      data: {
        message: `Log level changed to: ${level}`,
        previousLevel: config.logging.level,
        newLevel: level.toLowerCase(),
      },
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error) {
    throw ErrorHandler.createConfigurationError('Failed to update log level', { level, error });
  }
}));

// System information endpoint
router.get('/system', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    const systemInfo = {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
        v8Version: process.versions.v8,
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      timestamp: new Date().toISOString(),
    };
    
    logger.info('System information requested', { pid: process.pid }, requestId);
    
    res.json({
      success: true,
      data: systemInfo,
      requestId,
    });
  } catch (error) {
    throw ErrorHandler.createConfigurationError('Failed to retrieve system information', { error });
  }
}));

export default router;