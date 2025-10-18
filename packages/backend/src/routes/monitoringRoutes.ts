import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoringController';
import { healthCheckService } from '../services/healthCheckService';
import { authenticateToken } from '../middleware/auth';
import { AuthUtils } from '../utils/auth';

const router = Router();

// Health check endpoints (public)
router.get('/health', healthCheckService.createHealthCheckEndpoint());
router.get('/health/ready', healthCheckService.createReadinessProbe());
router.get('/health/live', healthCheckService.createLivenessProbe());

// System monitoring endpoints (admin only)
router.get('/system/health', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getHealthStatus);
router.get('/system/errors', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getErrorStats);
router.get('/system/errors/:errorId', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getErrorReport);
router.patch('/system/errors/:errorId/resolve', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.resolveError);

// Performance monitoring endpoints (admin only)
router.get('/performance/stats', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getPerformanceStats);
router.get('/performance/metrics', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getPerformanceMetrics);
router.get('/performance/system-history', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getSystemMetricsHistory);

// User feedback endpoints
router.post('/feedback/bug-report', authenticateToken, MonitoringController.submitBugReport);
router.post('/feedback/general', authenticateToken, MonitoringController.submitFeedback);
router.post('/feedback/feature-request', authenticateToken, MonitoringController.submitFeatureRequest);
router.post('/feedback/feature-request/:requestId/vote', authenticateToken, MonitoringController.voteOnFeatureRequest);

// Feedback management endpoints (admin only)
router.get('/feedback/bug-reports', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getBugReports);
router.get('/feedback/general', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getUserFeedback);
router.get('/feedback/feature-requests', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getFeatureRequests);
router.get('/feedback/analytics', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.getFeedbackAnalytics);
router.patch('/feedback/bug-reports/:reportId/status', authenticateToken, AuthUtils.requireRole(['admin']), MonitoringController.updateBugReportStatus);

export default router;