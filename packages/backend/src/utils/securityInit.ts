import { getSecurityConfig } from '../config/security';
import { SecurityMonitoringService } from '../services/securityMonitoringService';
import { AuditLoggingService } from '../services/auditLoggingService';
import { LGPDComplianceService } from '../services/lgpdComplianceService';

/**
 * Security initialization utility
 * Ensures all security measures are properly configured and running
 */
export class SecurityInitializer {
  private securityService: SecurityMonitoringService;
  private auditService: AuditLoggingService;
  private lgpdService: LGPDComplianceService;

  constructor() {
    this.securityService = new SecurityMonitoringService();
    this.auditService = new AuditLoggingService();
    this.lgpdService = new LGPDComplianceService();
  }

  /**
   * Initialize all security measures
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing security measures...');

    try {
      // Load and validate security configuration
      const config = getSecurityConfig();
      this.validateSecurityConfig(config);

      // Initialize security monitoring
      await this.initializeSecurityMonitoring();

      // Initialize audit logging
      await this.initializeAuditLogging();

      // Initialize LGPD compliance
      await this.initializeLGPDCompliance();

      // Perform security health checks
      await this.performSecurityHealthChecks();

      console.log('✅ Security initialization completed successfully');
      console.log(`📊 Security configuration: ${config.environment} environment`);
      console.log(`🛡️  Rate limiting: ${config.rateLimiting.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🚫 DDoS protection: ${config.ddosProtection.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`📋 CSP policy: ${config.contentSecurityPolicy.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`⚖️  LGPD compliance: ${config.lgpdCompliance.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`📝 Audit logging: ${config.auditLogging.enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`👁️  Security monitoring: ${config.monitoring.enabled ? 'ENABLED' : 'DISABLED'}`);

    } catch (error) {
      console.error('❌ Security initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate security configuration
   */
  private validateSecurityConfig(config: any): void {
    const requiredSettings = [
      'environment',
      'rateLimiting',
      'ddosProtection',
      'contentSecurityPolicy',
      'lgpdCompliance',
      'auditLogging',
      'monitoring',
    ];

    for (const setting of requiredSettings) {
      if (!config[setting]) {
        throw new Error(`Missing required security configuration: ${setting}`);
      }
    }

    // Validate production-specific requirements
    if (config.environment === 'production') {
      if (!config.contentSecurityPolicy.enabled) {
        throw new Error('CSP must be enabled in production');
      }
      if (!config.lgpdCompliance.enabled) {
        throw new Error('LGPD compliance must be enabled in production');
      }
      if (!config.auditLogging.enabled) {
        throw new Error('Audit logging must be enabled in production');
      }
      if (config.rateLimiting.maxRequests > 200) {
        console.warn('⚠️  High rate limit detected in production environment');
      }
    }
  }

  /**
   * Initialize security monitoring
   */
  private async initializeSecurityMonitoring(): Promise<void> {
    try {
      // Test security monitoring functionality
      await this.securityService.logSecurityEvent({
        eventType: 'security_system_startup',
        severity: 'info',
        securityFlags: {
          timestamp: new Date().toISOString(),
          component: 'SecurityInitializer',
        },
      });

      console.log('✅ Security monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize security monitoring:', error);
      throw error;
    }
  }

  /**
   * Initialize audit logging
   */
  private async initializeAuditLogging(): Promise<void> {
    try {
      // Test audit logging functionality
      const mockRequest = {
        // user: undefined - Allow system (null) user
        ip: '127.0.0.1',
        get: () => 'SecurityInitializer/1.0',
        path: '/system/init',
        method: 'POST',
      } as any;

      await this.auditService.logAction(
        'security_system_startup',
        'security_initialization',
        mockRequest,
        {
          metadata: {
            component: 'SecurityInitializer',
            timestamp: new Date().toISOString(),
          },
        }
      );

      console.log('✅ Audit logging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audit logging:', error);
      throw error;
    }
  }

  /**
   * Initialize LGPD compliance
   */
  private async initializeLGPDCompliance(): Promise<void> {
    try {
      // Test LGPD compliance functionality
      const complianceReport = await this.lgpdService.generateComplianceReport(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );

      console.log('✅ LGPD compliance initialized');
    } catch (error) {
      console.error('❌ Failed to initialize LGPD compliance:', error);
      throw error;
    }
  }

  /**
   * Perform security health checks
   */
  private async performSecurityHealthChecks(): Promise<void> {
    const healthChecks = [
      this.checkDatabaseConnection(),
      this.checkSecurityTables(),
      this.checkEnvironmentVariables(),
      this.checkSecurityHeaders(),
    ];

    try {
      await Promise.all(healthChecks);
      console.log('✅ All security health checks passed');
    } catch (error) {
      console.error('❌ Security health check failed:', error);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<void> {
    try {
      const { db } = await import('../database/connection');
      await db.query('SELECT 1');
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }

  /**
   * Check security tables exist
   */
  private async checkSecurityTables(): Promise<void> {
    try {
      const { db } = await import('../database/connection');

      const requiredTables = [
        'user_consents',
        'data_processing_records',
        'data_subject_requests',
        'security_audit_log',
        'rate_limit_tracking',
        'data_retention_tracking',
      ];

      for (const table of requiredTables) {
        const result = await db.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          )`,
          [table]
        );

        if (!result.rows[0].exists) {
          throw new Error(`Required security table '${table}' does not exist`);
        }
      }
    } catch (error) {
      throw new Error(`Security tables check failed: ${error}`);
    }
  }

  /**
   * Check required environment variables
   */
  private checkEnvironmentVariables(): void {
    const requiredEnvVars = [
      'JWT_SECRET',
      'SESSION_SECRET',
    ];

    const hasDatabaseConfig = process.env.DATABASE_URL ||
      (process.env.DB_HOST && process.env.DB_USER && (process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD));

    const missingVars = requiredEnvVars.filter(varName => {
      if (varName === 'DATABASE_URL' && hasDatabaseConfig) return false;
      return !process.env[varName];
    });

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Check for weak secrets in production
    if (process.env.NODE_ENV === 'production') {
      const weakSecrets = [
        'your-super-secret-jwt-key-change-in-production',
        'your-super-secret-session-key-change-in-production',
        'secret',
        'password',
        '123456',
      ];

      if (weakSecrets.includes(process.env.JWT_SECRET || '')) {
        throw new Error('Weak JWT_SECRET detected in production');
      }

      if (weakSecrets.includes(process.env.SESSION_SECRET || '')) {
        throw new Error('Weak SESSION_SECRET detected in production');
      }
    }
  }

  /**
   * Check security headers configuration
   */
  private checkSecurityHeaders(): void {
    const config = getSecurityConfig();

    if (config.environment === 'production') {
      if (!config.contentSecurityPolicy.enabled) {
        throw new Error('CSP must be enabled in production');
      }

      if (config.contentSecurityPolicy.reportOnly) {
        console.warn('⚠️  CSP is in report-only mode in production');
      }
    }
  }

  /**
   * Get security status summary
   */
  async getSecurityStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{ name: string; status: 'pass' | 'fail' | 'warning'; message?: string }>;
    configuration: any;
  }> {
    const checks = [];
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

    try {
      // Database check
      await this.checkDatabaseConnection();
      checks.push({ name: 'Database Connection', status: 'pass' as const });
    } catch (error) {
      checks.push({ name: 'Database Connection', status: 'fail' as const, message: 'Database connection failed' });
      overallStatus = 'critical';
    }

    try {
      // Security tables check
      await this.checkSecurityTables();
      checks.push({ name: 'Security Tables', status: 'pass' as const });
    } catch (error) {
      checks.push({ name: 'Security Tables', status: 'fail' as const, message: 'Security tables missing' });
      overallStatus = 'critical';
    }

    try {
      // Environment variables check
      this.checkEnvironmentVariables();
      checks.push({ name: 'Environment Variables', status: 'pass' as const });
    } catch (error) {
      checks.push({ name: 'Environment Variables', status: 'fail' as const, message: (error as Error).message });
      overallStatus = 'critical';
    }

    try {
      // Security headers check
      this.checkSecurityHeaders();
      checks.push({ name: 'Security Headers', status: 'pass' as const });
    } catch (error) {
      checks.push({ name: 'Security Headers', status: 'warning' as const, message: (error as Error).message });
      if (overallStatus === 'healthy') overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      checks,
      configuration: getSecurityConfig(),
    };
  }
}

// Export singleton instance
export const securityInitializer = new SecurityInitializer();