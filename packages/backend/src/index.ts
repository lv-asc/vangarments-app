import './env';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes';

// Import configuration watcher
import { configurationWatcher } from './services/configurationWatcherService';

// Security middleware imports
import {
  helmetConfig,
  lgpdCompliance,
  sanitizeInput,
  securityMonitoring,
  fileUploadSecurity
} from './middleware/security';
import {
  standardRateLimit,
  authRateLimit,
  advancedDDoSDetection,
  geolocationProtection,
  botDetection
} from './middleware/ddosProtection';
import {
  productionCSP,
  developmentCSP,
  securityHeaders,
  secureCORS,
  requestIdMiddleware,
  apiVersioning,
  violationReporter
} from './middleware/cspPolicy';
import { SecurityMonitoringService } from './services/securityMonitoringService';
import { securityInitializer } from './utils/securityInit';
import { errorHandlingService } from './services/errorHandlingService';
import { performanceMonitoringService } from './services/performanceMonitoringService';
import { healthCheckService } from './services/healthCheckService';
import { LocalStorageService } from './services/localStorageService';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize security monitoring
const securityService = new SecurityMonitoringService();

// Initialize monitoring services
// healthCheckService initialized in module

// Security middleware (order is important)
app.use(requestIdMiddleware);
app.use(securityHeaders);

// CSP and Helmet configuration
if (NODE_ENV === 'production') {
  app.use(productionCSP);
} else {
  app.use(developmentCSP);
}
app.use(helmetConfig);

// CORS configuration
app.use(secureCORS);

// DDoS and bot protection
// app.use(geolocationProtection);
// app.use(botDetection);
// app.use(advancedDDoSDetection);

// Rate limiting
app.use('/api/auth', authRateLimit);
app.use('/api', standardRateLimit);

// CORS for static files - allow frontend to load images from backend
app.use('/storage', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Serve static files from storage directory
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// Body parsing with security
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization and security monitoring
app.use(sanitizeInput);
app.use(securityMonitoring);
app.use(fileUploadSecurity);

// LGPD compliance middleware
app.use(lgpdCompliance);

// API versioning
app.use(apiVersioning);

// Enhanced request logging with security monitoring
app.use(securityService.createSecurityLogger());

// Performance monitoring middleware
app.use(performanceMonitoringService.createRequestMonitoringMiddleware());

// Security endpoints
app.post('/api/security/csp-violation', violationReporter);

// Health check endpoint with security info
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    security: {
      lgpdCompliant: true,
      cspEnabled: true,
      rateLimitingActive: true,
      ddosProtectionActive: true,
    }
  });
});

// Security status endpoint (admin only)
app.get('/api/security/status', async (req, res) => {
  try {
    // This would require admin authentication in production
    const status = await securityInitializer.getSecurityStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to get security status',
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Global error handler with comprehensive error handling
app.use(errorHandlingService.createErrorMiddleware());

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`🚀 Vangarments backend server running on port ${PORT}`);
    console.log(`📚 API documentation available at http://localhost:${PORT}/api/health`);

    // Initialize local storage
    try {
      await LocalStorageService.initialize();
      console.log('📁 Local storage initialized successfully');
    } catch (error) {
      console.error('⚠️  Local storage initialization failed:', error);
    }

    // Initialize configuration watcher
    try {
      console.log('⚙️  Configuration watcher initialized successfully');
      console.log(`📁 Watching ${configurationWatcher.getWatchedFiles().length} configuration files`);
    } catch (error) {
      console.error('⚠️  Configuration watcher initialization failed:', error);
    }

    // Initialize security measures
    try {
      await securityInitializer.initialize();
    } catch (error) {
      console.error('⚠️  Security initialization failed, but server is still running:', error);
    }
  });

}

export default app;