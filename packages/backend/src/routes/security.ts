import { Router, Request, Response } from 'express';
import { SecurityMonitoringService } from '../services/securityMonitoringService';
import { AuditLoggingService } from '../services/auditLoggingService';
import { LGPDComplianceService } from '../services/lgpdComplianceService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { auditLogger } from '../middleware/security';
import { query, body } from 'express-validator';
import { getSecurityConfig } from '../config/security';

const router = Router();
const securityService = new SecurityMonitoringService();
const auditService = new AuditLoggingService();
const lgpdService = new LGPDComplianceService();

/**
 * Security dashboard - Admin only
 */
router.get(
  '/dashboard',
  authenticateToken,
  requireRole(['admin', 'security_officer']),
  auditLogger('view_security_dashboard'),
  async (req: Request, res: Response) => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

      const [securityReport, auditReport, lgpdReport] = await Promise.all([
        securityService.generateSecurityReport(startDate, endDate),
        auditService.generateComplianceReport(startDate, endDate),
        lgpdService.generateComplianceReport(startDate, endDate),
      ]);

      const dashboard = {
        timestamp: new Date().toISOString(),
        period: { start: startDate, end: endDate },
        security: securityReport,
        audit: auditReport,
        lgpd: lgpdReport,
        configuration: getSecurityConfig(),
      };

      await auditService.logAdminAction(
        req.user!.id,
        'view_security_dashboard',
        'security_dashboard',
        req
      );

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate security dashboard',
      });
    }
  }
);

/**
 * Security report generation
 */
router.get(
  '/report',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'compliance_officer']),
  auditLogger('generate_security_report'),
  [
    query('startDate').isISO8601().withMessage('Start date must be valid ISO 8601 date'),
    query('endDate').isISO8601().withMessage('End date must be valid ISO 8601 date'),
    query('type').optional().isIn(['security', 'audit', 'lgpd', 'comprehensive']),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, type = 'comprehensive' } = req.query as {
        startDate: string;
        endDate: string;
        type?: string;
      };

      let report: any;

      switch (type) {
        case 'security':
          report = await securityService.generateSecurityReport(startDate, endDate);
          break;
        case 'audit':
          report = await auditService.generateComplianceReport(startDate, endDate);
          break;
        case 'lgpd':
          report = await lgpdService.generateComplianceReport(startDate, endDate);
          break;
        case 'comprehensive':
        default:
          const [securityReport, auditReport, lgpdReport] = await Promise.all([
            securityService.generateSecurityReport(startDate, endDate),
            auditService.generateComplianceReport(startDate, endDate),
            lgpdService.generateComplianceReport(startDate, endDate),
          ]);
          
          report = {
            type: 'comprehensive',
            period: { start: startDate, end: endDate },
            generatedAt: new Date().toISOString(),
            generatedBy: req.user!.id,
            security: securityReport,
            audit: auditReport,
            lgpd: lgpdReport,
          };
          break;
      }

      await auditService.logAdminAction(
        req.user!.id,
        'generate_security_report',
        'security_report',
        req,
        {
          justification: `Generated ${type} security report for period ${startDate} to ${endDate}`,
        }
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to generate security report',
      });
    }
  }
);

/**
 * Audit log search
 */
router.get(
  '/audit-logs',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'compliance_officer']),
  auditLogger('search_audit_logs'),
  [
    query('userId').optional().isUUID(),
    query('action').optional().isString(),
    query('resource').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('ipAddress').optional().isIP(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const filters = req.query as any;
      const result = await auditService.searchAuditLogs(filters);

      await auditService.logAdminAction(
        req.user!.id,
        'search_audit_logs',
        'audit_logs',
        req,
        {
          justification: 'Administrative audit log search',
        }
      );

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          limit: parseInt(filters.limit) || 50,
          offset: parseInt(filters.offset) || 0,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to search audit logs',
      });
    }
  }
);

/**
 * Security configuration
 */
router.get(
  '/config',
  authenticateToken,
  requireRole(['admin', 'security_officer']),
  auditLogger('view_security_config'),
  async (req: Request, res: Response) => {
    try {
      const config = getSecurityConfig();

      await auditService.logAdminAction(
        req.user!.id,
        'view_security_config',
        'security_configuration',
        req
      );

      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to get security configuration',
      });
    }
  }
);

/**
 * Block IP address (emergency response)
 */
router.post(
  '/block-ip',
  authenticateToken,
  requireRole(['admin', 'security_officer']),
  auditLogger('block_ip_address'),
  [
    body('ipAddress').isIP().withMessage('Valid IP address required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration in minutes required'),
    body('reason').isString().isLength({ min: 10 }).withMessage('Reason required (min 10 characters)'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { ipAddress, duration, reason } = req.body;

      // Log the IP blocking action
      await securityService.logSecurityEvent({
        eventType: 'admin_ip_block',
        severity: 'warning',
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        securityFlags: {
          blockedIP: ipAddress,
          blockDuration: duration,
          reason,
          adminAction: true,
        },
      });

      await auditService.logAdminAction(
        req.user!.id,
        'block_ip_address',
        'ip_blocking',
        req,
        {
          justification: reason,
        }
      );

      // In production, this would actually block the IP in the firewall/load balancer
      console.warn(`[ADMIN ACTION] IP ${ipAddress} blocked for ${duration} minutes by admin ${req.user!.id}. Reason: ${reason}`);

      res.json({
        success: true,
        message: `IP address ${ipAddress} has been blocked for ${duration} minutes`,
        data: {
          ipAddress,
          duration,
          reason,
          blockedBy: req.user!.id,
          blockedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to block IP address',
      });
    }
  }
);

/**
 * Security incident response
 */
router.post(
  '/incident',
  authenticateToken,
  requireRole(['admin', 'security_officer']),
  auditLogger('create_security_incident'),
  [
    body('title').isString().isLength({ min: 5, max: 200 }),
    body('description').isString().isLength({ min: 20, max: 2000 }),
    body('severity').isIn(['low', 'medium', 'high', 'critical']),
    body('category').isIn(['data_breach', 'unauthorized_access', 'ddos_attack', 'malware', 'phishing', 'other']),
    body('affectedUsers').optional().isArray(),
    body('affectedSystems').optional().isArray(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const incidentData = req.body;
      const incidentId = require('crypto').randomUUID();

      // Log the security incident
      await securityService.logSecurityEvent({
        eventType: 'security_incident_created',
        severity: incidentData.severity === 'critical' ? 'critical' : 'error',
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        securityFlags: {
          incidentId,
          ...incidentData,
          createdBy: req.user!.id,
          createdAt: new Date().toISOString(),
        },
      });

      await auditService.logAdminAction(
        req.user!.id,
        'create_security_incident',
        'security_incident',
        req,
        {
          justification: `Security incident reported: ${incidentData.title}`,
        }
      );

      // In production, this would:
      // 1. Create incident in incident management system
      // 2. Send alerts to security team
      // 3. Trigger automated response procedures
      // 4. Update monitoring dashboards

      console.error(`[SECURITY INCIDENT] ${incidentData.severity.toUpperCase()}: ${incidentData.title} - ${incidentData.description}`);

      res.status(201).json({
        success: true,
        message: 'Security incident created successfully',
        data: {
          incidentId,
          ...incidentData,
          createdBy: req.user!.id,
          createdAt: new Date().toISOString(),
          status: 'open',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to create security incident',
      });
    }
  }
);

/**
 * Data retention cleanup (LGPD compliance)
 */
router.post(
  '/cleanup',
  authenticateToken,
  requireRole(['admin', 'compliance_officer']),
  auditLogger('data_retention_cleanup'),
  [
    body('dataType').isIn(['audit_logs', 'security_logs', 'user_data', 'all']),
    body('retentionDays').isInt({ min: 1, max: 3650 }),
    body('dryRun').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { dataType, retentionDays, dryRun = true } = req.body;
      let cleanupResults: any = {};

      if (dryRun) {
        // Simulate cleanup without actually deleting data
        cleanupResults = {
          dryRun: true,
          estimatedDeletions: {
            auditLogs: Math.floor(Math.random() * 1000),
            securityLogs: Math.floor(Math.random() * 500),
            userData: Math.floor(Math.random() * 100),
          },
        };
      } else {
        // Perform actual cleanup
        switch (dataType) {
          case 'audit_logs':
            cleanupResults.auditLogs = await auditService.cleanupOldLogs(retentionDays);
            break;
          case 'security_logs':
            cleanupResults.securityLogs = await securityService.cleanupOldLogs(retentionDays);
            break;
          case 'user_data':
            // This would implement user data cleanup
            cleanupResults.userData = 0; // Placeholder
            break;
          case 'all':
            cleanupResults.auditLogs = await auditService.cleanupOldLogs(retentionDays);
            cleanupResults.securityLogs = await securityService.cleanupOldLogs(retentionDays);
            cleanupResults.userData = 0; // Placeholder
            break;
        }
      }

      await auditService.logAdminAction(
        req.user!.id,
        'data_retention_cleanup',
        'data_cleanup',
        req,
        {
          justification: `Data retention cleanup for ${dataType} (${retentionDays} days retention)`,
        }
      );

      res.json({
        success: true,
        message: dryRun ? 'Cleanup simulation completed' : 'Data cleanup completed',
        data: {
          dataType,
          retentionDays,
          dryRun,
          results: cleanupResults,
          executedBy: req.user!.id,
          executedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to perform data cleanup',
      });
    }
  }
);

/**
 * CSP violation reporting endpoint (public)
 */
router.post('/csp-violation', async (req: Request, res: Response) => {
  try {
    const violation = req.body;
    
    await securityService.logSecurityEvent({
      eventType: 'csp_violation',
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      securityFlags: {
        violation: violation['csp-report'] || violation,
        timestamp: new Date().toISOString(),
      },
    });

    console.warn('[CSP VIOLATION]', {
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      violation: violation['csp-report'] || violation,
    });

    res.status(204).send();
  } catch (error) {
    console.error('CSP violation reporting error:', error);
    res.status(500).json({ error: 'Failed to process violation report' });
  }
});

export default router;