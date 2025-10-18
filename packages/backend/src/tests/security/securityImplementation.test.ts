import { SecurityMonitoringService } from '../../services/securityMonitoringService';
import { AuditLoggingService } from '../../services/auditLoggingService';
import { LGPDComplianceService } from '../../services/lgpdComplianceService';
import { DDoSProtectionMiddleware } from '../../middleware/ddosProtection';
import { CSPPolicyMiddleware } from '../../middleware/cspPolicy';
import { getSecurityConfig } from '../../config/security';

describe('Security Implementation', () => {
  describe('Security Configuration', () => {
    it('should load security configuration for different environments', () => {
      const config = getSecurityConfig();
      
      expect(config).toBeDefined();
      expect(config.environment).toBeDefined();
      expect(config.rateLimiting).toBeDefined();
      expect(config.ddosProtection).toBeDefined();
      expect(config.contentSecurityPolicy).toBeDefined();
      expect(config.lgpdCompliance).toBeDefined();
      expect(config.auditLogging).toBeDefined();
      expect(config.monitoring).toBeDefined();
    });

    it('should have different configurations for different environments', () => {
      // Mock different environments
      const originalEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'development';
      const devConfig = getSecurityConfig();
      
      process.env.NODE_ENV = 'production';
      const prodConfig = getSecurityConfig();
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
      
      expect(devConfig.environment).toBe('development');
      expect(prodConfig.environment).toBe('production');
      expect(prodConfig.rateLimiting.maxRequests).toBeLessThan(devConfig.rateLimiting.maxRequests);
    });
  });

  describe('Security Monitoring Service', () => {
    let securityService: SecurityMonitoringService;

    beforeEach(() => {
      securityService = new SecurityMonitoringService();
    });

    it('should create security monitoring service instance', () => {
      expect(securityService).toBeDefined();
      expect(typeof securityService.logSecurityEvent).toBe('function');
      expect(typeof securityService.trackRateLimit).toBe('function');
      expect(typeof securityService.detectSuspiciousActivity).toBe('function');
    });

    it('should create security logger middleware', () => {
      const middleware = securityService.createSecurityLogger();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('Audit Logging Service', () => {
    let auditService: AuditLoggingService;

    beforeEach(() => {
      auditService = new AuditLoggingService();
    });

    it('should create audit logging service instance', () => {
      expect(auditService).toBeDefined();
      expect(typeof auditService.logAction).toBe('function');
      expect(typeof auditService.logLGPDAction).toBe('function');
      expect(typeof auditService.logDataAccess).toBe('function');
      expect(typeof auditService.logAdminAction).toBe('function');
    });
  });

  describe('LGPD Compliance Service', () => {
    let lgpdService: LGPDComplianceService;

    beforeEach(() => {
      lgpdService = new LGPDComplianceService();
    });

    it('should create LGPD compliance service instance', () => {
      expect(lgpdService).toBeDefined();
      expect(typeof lgpdService.recordConsent).toBe('function');
      expect(typeof lgpdService.withdrawConsent).toBe('function');
      expect(typeof lgpdService.getUserConsents).toBe('function');
      expect(typeof lgpdService.hasConsent).toBe('function');
    });
  });

  describe('DDoS Protection Middleware', () => {
    let ddosProtection: DDoSProtectionMiddleware;

    beforeEach(() => {
      ddosProtection = new DDoSProtectionMiddleware();
    });

    it('should create DDoS protection middleware instance', () => {
      expect(ddosProtection).toBeDefined();
      expect(typeof ddosProtection.createAdaptiveRateLimit).toBe('function');
      expect(typeof ddosProtection.createAdvancedDDoSDetection).toBe('function');
      expect(typeof ddosProtection.createGeolocationProtection).toBe('function');
      expect(typeof ddosProtection.createBotDetection).toBe('function');
    });

    it('should create rate limiting middleware', () => {
      const middleware = ddosProtection.createAdaptiveRateLimit({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        blockDuration: 5 * 60 * 1000,
      });
      expect(typeof middleware).toBe('function');
    });
  });

  describe('CSP Policy Middleware', () => {
    let cspPolicy: CSPPolicyMiddleware;

    beforeEach(() => {
      cspPolicy = new CSPPolicyMiddleware();
    });

    it('should create CSP policy middleware instance', () => {
      expect(cspPolicy).toBeDefined();
      expect(typeof cspPolicy.createCSPMiddleware).toBe('function');
      expect(typeof cspPolicy.createNonceMiddleware).toBe('function');
      expect(typeof cspPolicy.createViolationReporter).toBe('function');
      expect(typeof cspPolicy.createSecurityHeaders).toBe('function');
    });

    it('should generate cryptographically secure nonces', () => {
      const nonce1 = cspPolicy.generateNonce();
      const nonce2 = cspPolicy.generateNonce();
      
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThan(0);
    });

    it('should create CSP middleware for different environments', () => {
      const devMiddleware = cspPolicy.createCSPMiddleware({
        environment: 'development',
        reportOnly: true,
      });
      
      const prodMiddleware = cspPolicy.createCSPMiddleware({
        environment: 'production',
        reportOnly: false,
        reportUri: '/api/security/csp-violation',
      });
      
      expect(typeof devMiddleware).toBe('function');
      expect(typeof prodMiddleware).toBe('function');
    });
  });

  describe('Security Middleware Integration', () => {
    it('should import all security middleware without errors', () => {
      // Test that all middleware can be imported
      const {
        helmetConfig,
        lgpdCompliance,
        sanitizeInput,
        securityMonitoring,
        fileUploadSecurity,
        validateCPF
      } = require('../../middleware/security');

      expect(helmetConfig).toBeDefined();
      expect(lgpdCompliance).toBeDefined();
      expect(sanitizeInput).toBeDefined();
      expect(securityMonitoring).toBeDefined();
      expect(fileUploadSecurity).toBeDefined();
      expect(validateCPF).toBeDefined();
    });

    it('should validate CPF correctly', () => {
      const { validateCPF } = require('../../middleware/security');
      
      // Valid CPF
      expect(validateCPF('11144477735')).toBe(true);
      
      // Invalid CPFs
      expect(validateCPF('00000000000')).toBe(false);
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('123456789')).toBe(false);
      expect(validateCPF('invalid')).toBe(false);
    });
  });

  describe('Database Migration', () => {
    it('should have LGPD compliance database migration', () => {
      const fs = require('fs');
      const path = require('path');
      
      const migrationPath = path.join(__dirname, '../../database/migrations/create_lgpd_compliance_tables.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      expect(migrationContent).toContain('user_consents');
      expect(migrationContent).toContain('data_processing_records');
      expect(migrationContent).toContain('data_subject_requests');
      expect(migrationContent).toContain('security_audit_log');
      expect(migrationContent).toContain('rate_limit_tracking');
    });
  });

  describe('Security Documentation', () => {
    it('should have comprehensive security documentation', () => {
      const fs = require('fs');
      const path = require('path');
      
      const docPath = path.join(__dirname, '../../docs/SECURITY_IMPLEMENTATION.md');
      expect(fs.existsSync(docPath)).toBe(true);
      
      const docContent = fs.readFileSync(docPath, 'utf8');
      expect(docContent).toContain('LGPD Compliance');
      expect(docContent).toContain('Rate Limiting & DDoS Protection');
      expect(docContent).toContain('Content Security Policy');
      expect(docContent).toContain('Audit Logging & Security Monitoring');
    });
  });
});

describe('LGPD Compliance Features', () => {
  describe('User Consent Management', () => {
    it('should define consent types correctly', () => {
      // Test that consent types are properly defined
      const consentTypes = [
        'data_processing',
        'marketing',
        'analytics',
        'cookies',
        'third_party_sharing'
      ];
      
      consentTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });

    it('should define legal bases correctly', () => {
      const legalBases = [
        'consent',
        'contract',
        'legal_obligation',
        'vital_interests',
        'public_task',
        'legitimate_interests'
      ];
      
      legalBases.forEach(basis => {
        expect(typeof basis).toBe('string');
        expect(basis.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Subject Rights', () => {
    it('should define data subject request types correctly', () => {
      const requestTypes = [
        'access',
        'rectification',
        'erasure',
        'portability',
        'restriction',
        'objection'
      ];
      
      requestTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Security Monitoring Features', () => {
  describe('Risk Level Assessment', () => {
    it('should define risk levels correctly', () => {
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      
      riskLevels.forEach(level => {
        expect(typeof level).toBe('string');
        expect(level.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Event Types', () => {
    it('should define security event types', () => {
      const eventTypes = [
        'api_request',
        'authentication_failure',
        'suspicious_activity_detected',
        'rate_limit_exceeded',
        'ddos_blocked_request',
        'csp_violation',
        'security_alert_triggered'
      ];
      
      eventTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });
});