import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

/**
 * Security middleware configuration for LGPD compliance and general security
 */

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // 1000 attempts per window (dev)
  'Too many authentication attempts, please try again later.'
);

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5000, // 5000 requests per window (dev)
  'API rate limit exceeded, please try again later.'
);

export const uploadRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  1000, // 1000 uploads per hour (dev)
  'Upload rate limit exceeded, please try again later.'
);

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.vangarments.com"],
      mediaSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for social media integration
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// LGPD Compliance middleware
export const lgpdCompliance = (req: Request, res: Response, next: NextFunction) => {
  // Add LGPD compliance headers
  res.setHeader('X-Data-Protection', 'LGPD-Compliant');
  res.setHeader('X-Privacy-Policy', 'https://vangarments.com/privacy');
  res.setHeader('X-Data-Controller', 'Vangarments Ltda');

  // Log data processing activities for LGPD audit trail
  if (req.method !== 'GET' && req.user) {
    console.log(`[LGPD-AUDIT] ${new Date().toISOString()} - User ${req.user.id} - ${req.method} ${req.path}`);
  }

  next();
};

// Data minimization middleware (LGPD Article 6, VI)
export const dataMinimization = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const filteredBody: any = {};
      allowedFields.forEach(field => {
        if (req.body.hasOwnProperty(field)) {
          filteredBody[field] = req.body[field];
        }
      });
      req.body = filteredBody;
    }
    next();
  };
};

// Consent validation middleware (LGPD Article 7)
export const validateConsent = (requiredConsents: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userConsents = req.headers['x-user-consents'];

    if (!userConsents) {
      return res.status(400).json({
        success: false,
        message: 'User consent information required',
        code: 'CONSENT_REQUIRED',
        requiredConsents,
      });
    }

    try {
      const consents = JSON.parse(userConsents as string);
      const missingConsents = requiredConsents.filter(consent => !consents[consent]);

      if (missingConsents.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required consents',
          code: 'MISSING_CONSENTS',
          missingConsents,
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid consent format',
        code: 'INVALID_CONSENT_FORMAT',
      });
    }

    next();
  };
};

// Data retention middleware (LGPD Article 16)
export const dataRetentionCheck = (req: Request, res: Response, next: NextFunction) => {
  // Add data retention information to response headers
  res.setHeader('X-Data-Retention-Policy', 'https://vangarments.com/data-retention');
  res.setHeader('X-Data-Retention-Period', '5-years');

  next();
};

// Audit logging for LGPD compliance
export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      dataProcessed: req.method !== 'GET',
    };

    // In production, this would be sent to a secure audit log service
    console.log(`[AUDIT] ${JSON.stringify(auditLog)}`);

    next();
  };
};

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((error: any) => ({
        field: error.param || error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }
  next();
};

// CPF validation for Brazilian users (LGPD compliance)
export const validateCPF = (cpf: string): boolean => {
  // Remove non-numeric characters
  cpf = cpf.replace(/[^\d]/g, '');

  // Check if CPF has 11 digits
  if (cpf.length !== 11) return false;

  // Check for known invalid CPFs
  const invalidCPFs = [
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ];

  if (invalidCPFs.includes(cpf)) return false;

  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
};

// CPF validation middleware
export const cpfValidation = [
  body('cpf')
    .custom((value) => {
      if (!validateCPF(value)) {
        throw new Error('Invalid CPF format');
      }
      return true;
    })
    .withMessage('CPF must be a valid Brazilian document number'),
];

// Security monitoring middleware
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  // Monitor for suspicious activities
  const suspiciousPatterns = [
    /(\<|\%3C)script/i, // Script injection attempts
    /union.*select/i, // SQL injection attempts
    /\.\.\//g, // Directory traversal attempts
    /eval\(/i, // Code execution attempts
  ];

  const requestString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  const suspiciousActivity = suspiciousPatterns.some(pattern =>
    pattern.test(requestString)
  );

  if (suspiciousActivity) {
    console.warn(`[SECURITY-ALERT] Suspicious activity detected from IP ${req.ip}: ${requestString}`);

    // In production, this would trigger security alerts
    return res.status(400).json({
      success: false,
      message: 'Request blocked for security reasons',
      code: 'SECURITY_VIOLATION',
    });
  }

  next();
};

// File upload security
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  if (req.file || req.files) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const validateFile = (file: any) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} not allowed`);
      }

      if (file.size > maxFileSize) {
        throw new Error('File size exceeds 10MB limit');
      }
    };

    try {
      if (req.file) {
        validateFile(req.file);
      }

      if (req.files) {
        if (Array.isArray(req.files)) {
          req.files.forEach(validateFile);
        } else {
          Object.values(req.files).forEach((fileArray: any) => {
            if (Array.isArray(fileArray)) {
              fileArray.forEach(validateFile);
            } else {
              validateFile(fileArray);
            }
          });
        }
      }
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: 'FILE_VALIDATION_ERROR',
      });
    }
  }

  next();
};