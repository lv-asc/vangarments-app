export interface SecurityConfig {
  environment: 'development' | 'staging' | 'production';
  
  // Rate limiting configuration
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    authWindowMs: number;
    authMaxRequests: number;
    uploadWindowMs: number;
    uploadMaxRequests: number;
  };

  // DDoS protection configuration
  ddosProtection: {
    enabled: boolean;
    suspiciousActivityThreshold: number;
    blockDuration: number;
    geolocationEnabled: boolean;
    allowedCountries: string[];
    botDetectionEnabled: boolean;
  };

  // CSP configuration
  contentSecurityPolicy: {
    enabled: boolean;
    reportOnly: boolean;
    reportUri?: string;
    nonceEnabled: boolean;
  };

  // LGPD compliance configuration
  lgpdCompliance: {
    enabled: boolean;
    dataRetentionDays: number;
    auditLogRetentionDays: number;
    consentRequired: boolean;
    dataMinimizationEnabled: boolean;
  };

  // Audit logging configuration
  auditLogging: {
    enabled: boolean;
    logLevel: 'basic' | 'detailed' | 'comprehensive';
    retentionDays: number;
    realTimeAlertsEnabled: boolean;
    complianceReportingEnabled: boolean;
  };

  // Security monitoring configuration
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      failedLoginAttempts: number;
      rateLimitViolations: number;
      suspiciousPatterns: number;
      ddosRequestsPerMinute: number;
    };
    alertChannels: string[];
  };

  // Encryption and hashing
  encryption: {
    algorithm: string;
    keyRotationDays: number;
    saltRounds: number;
  };

  // Session security
  session: {
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
  };
}

const developmentConfig: SecurityConfig = {
  environment: 'development',
  
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // Generous for development
    authWindowMs: 15 * 60 * 1000,
    authMaxRequests: 20,
    uploadWindowMs: 60 * 60 * 1000,
    uploadMaxRequests: 50,
  },

  ddosProtection: {
    enabled: true,
    suspiciousActivityThreshold: 10,
    blockDuration: 5 * 60 * 1000, // 5 minutes
    geolocationEnabled: false, // Disabled for development
    allowedCountries: ['BR', 'US'],
    botDetectionEnabled: true,
  },

  contentSecurityPolicy: {
    enabled: true,
    reportOnly: true, // Report only in development
    nonceEnabled: false,
  },

  lgpdCompliance: {
    enabled: true,
    dataRetentionDays: 30, // Shorter for development
    auditLogRetentionDays: 30,
    consentRequired: true,
    dataMinimizationEnabled: true,
  },

  auditLogging: {
    enabled: true,
    logLevel: 'detailed',
    retentionDays: 30,
    realTimeAlertsEnabled: false,
    complianceReportingEnabled: true,
  },

  monitoring: {
    enabled: true,
    alertThresholds: {
      failedLoginAttempts: 10,
      rateLimitViolations: 20,
      suspiciousPatterns: 5,
      ddosRequestsPerMinute: 200,
    },
    alertChannels: ['console'],
  },

  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 90,
    saltRounds: 12,
  },

  session: {
    secure: false, // HTTP allowed in development
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

const stagingConfig: SecurityConfig = {
  ...developmentConfig,
  environment: 'staging',
  
  rateLimiting: {
    ...developmentConfig.rateLimiting,
    maxRequests: 200, // More restrictive than development
  },

  ddosProtection: {
    ...developmentConfig.ddosProtection,
    geolocationEnabled: true,
    blockDuration: 15 * 60 * 1000, // 15 minutes
  },

  contentSecurityPolicy: {
    enabled: true,
    reportOnly: false, // Enforce in staging
    reportUri: '/api/security/csp-violation',
    nonceEnabled: true,
  },

  lgpdCompliance: {
    ...developmentConfig.lgpdCompliance,
    dataRetentionDays: 365, // 1 year
    auditLogRetentionDays: 365,
  },

  auditLogging: {
    ...developmentConfig.auditLogging,
    retentionDays: 365,
    realTimeAlertsEnabled: true,
  },

  session: {
    ...developmentConfig.session,
    secure: true, // HTTPS required
    sameSite: 'strict',
  },
};

const productionConfig: SecurityConfig = {
  ...stagingConfig,
  environment: 'production',
  
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000,
    maxRequests: 100, // Strict for production
    authWindowMs: 15 * 60 * 1000,
    authMaxRequests: 5,
    uploadWindowMs: 60 * 60 * 1000,
    uploadMaxRequests: 20,
  },

  ddosProtection: {
    enabled: true,
    suspiciousActivityThreshold: 3,
    blockDuration: 30 * 60 * 1000, // 30 minutes
    geolocationEnabled: true,
    allowedCountries: ['BR'], // Brazil only for production launch
    botDetectionEnabled: true,
  },

  contentSecurityPolicy: {
    enabled: true,
    reportOnly: false,
    reportUri: '/api/security/csp-violation',
    nonceEnabled: true,
  },

  lgpdCompliance: {
    enabled: true,
    dataRetentionDays: 2555, // 7 years (LGPD requirement)
    auditLogRetentionDays: 2555,
    consentRequired: true,
    dataMinimizationEnabled: true,
  },

  auditLogging: {
    enabled: true,
    logLevel: 'comprehensive',
    retentionDays: 2555, // 7 years
    realTimeAlertsEnabled: true,
    complianceReportingEnabled: true,
  },

  monitoring: {
    enabled: true,
    alertThresholds: {
      failedLoginAttempts: 5,
      rateLimitViolations: 10,
      suspiciousPatterns: 3,
      ddosRequestsPerMinute: 100,
    },
    alertChannels: ['email', 'slack', 'sms'], // Multiple alert channels
  },

  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 30, // More frequent rotation in production
    saltRounds: 14, // Higher security
  },

  session: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
};

export function getSecurityConfig(): SecurityConfig {
  const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
  
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

export { developmentConfig, stagingConfig, productionConfig };