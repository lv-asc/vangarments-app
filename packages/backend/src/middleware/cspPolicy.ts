import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export interface CSPConfig {
  environment: 'development' | 'staging' | 'production';
  reportUri?: string;
  reportOnly?: boolean;
  enableNonce?: boolean;
}

export class CSPPolicyMiddleware {
  private nonces: Map<string, string> = new Map();

  /**
   * Generate a cryptographically secure nonce for CSP
   */
  generateNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Create CSP middleware with environment-specific policies
   */
  createCSPMiddleware(config: CSPConfig) {
    const isDevelopment = config.environment === 'development';
    const isProduction = config.environment === 'production';

    return helmet.contentSecurityPolicy({
      useDefaults: false,
      reportOnly: config.reportOnly || false,
      directives: {
        // Default source - only allow same origin
        defaultSrc: ["'self'"],

        // Script sources
        scriptSrc: [
          "'self'",
          ...(isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
          ...(config.enableNonce ? ["'nonce-{nonce}'"] : []),
          // Allow specific trusted CDNs
          'https://cdn.jsdelivr.net',
          'https://unpkg.com',
          // Google Analytics (if used)
          'https://www.google-analytics.com',
          'https://www.googletagmanager.com',
          // AWS SDK
          'https://sdk.amazonaws.com',
        ],

        // Style sources
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for many CSS frameworks
          // Google Fonts
          'https://fonts.googleapis.com',
          // CDNs
          'https://cdn.jsdelivr.net',
          'https://unpkg.com',
        ],

        // Font sources
        fontSrc: [
          "'self'",
          'data:',
          'https://fonts.gstatic.com',
          'https://cdn.jsdelivr.net',
        ],

        // Image sources
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
          // AWS S3 buckets
          'https://*.s3.amazonaws.com',
          'https://*.s3.*.amazonaws.com',
          // CloudFront CDN
          'https://*.cloudfront.net',
          // Social media platforms for profile images
          'https://graph.facebook.com',
          'https://pbs.twimg.com',
          'https://instagram.com',
          // Analytics
          'https://www.google-analytics.com',
        ],

        // Media sources (video, audio)
        mediaSrc: [
          "'self'",
          'blob:',
          'https:',
          // AWS S3 for media files
          'https://*.s3.amazonaws.com',
          'https://*.s3.*.amazonaws.com',
          'https://*.cloudfront.net',
        ],

        // Connection sources (AJAX, WebSocket, EventSource)
        connectSrc: [
          "'self'",
          // API endpoints
          'https://api.vangarments.com',
          'https://*.vangarments.com',
          // AWS services
          'https://*.amazonaws.com',
          // Analytics
          'https://www.google-analytics.com',
          'https://analytics.google.com',
          // Development WebSocket (if applicable)
          ...(isDevelopment ? ['ws://localhost:*', 'wss://localhost:*'] : []),
          // Payment processors
          'https://api.stripe.com',
          'https://checkout.stripe.com',
          // Social media APIs
          'https://graph.facebook.com',
          'https://api.instagram.com',
        ],

        // Object sources (plugins like Flash, Java)
        objectSrc: ["'none'"],

        // Embed sources (iframes)
        frameSrc: [
          "'self'",
          // Payment processors
          'https://checkout.stripe.com',
          'https://js.stripe.com',
          // Social media embeds
          'https://www.facebook.com',
          'https://www.instagram.com',
          // Maps (if used)
          'https://www.google.com',
          'https://maps.google.com',
        ],

        // Child sources (web workers, nested browsing contexts)
        childSrc: [
          "'self'",
          'blob:',
        ],

        // Worker sources (service workers, shared workers)
        workerSrc: [
          "'self'",
          'blob:',
        ],

        // Manifest sources (web app manifests)
        manifestSrc: ["'self'"],

        // Base URI restriction
        baseUri: ["'self'"],

        // Form action restriction
        formAction: [
          "'self'",
          // Payment processors
          'https://checkout.stripe.com',
        ],

        // Frame ancestors (prevents clickjacking)
        frameAncestors: ["'none'"],

        // Upgrade insecure requests (HTTPS only in production)
        ...(isProduction ? { upgradeInsecureRequests: [] } : {}),

        // Block mixed content (HTTPS only in production)
        ...(isProduction ? { blockAllMixedContent: [] } : {}),
      },

      // Report violations
      ...(config.reportUri ? {
        reportUri: config.reportUri,
      } : {}),
    });
  }

  /**
   * Nonce injection middleware
   */
  createNonceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const nonce = this.generateNonce();
      
      // Store nonce for this request
      res.locals.nonce = nonce;
      
      // Add nonce to CSP header
      const originalSetHeader = res.setHeader;
      res.setHeader = function(name: string, value: any) {
        if (name.toLowerCase() === 'content-security-policy') {
          value = value.replace(/{nonce}/g, nonce);
        }
        return originalSetHeader.call(this, name, value);
      };

      next();
    };
  }

  /**
   * CSP violation reporting endpoint
   */
  createViolationReporter() {
    return async (req: Request, res: Response) => {
      try {
        const violation = req.body;
        
        // Log CSP violation
        console.warn('[CSP VIOLATION]', {
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          violation: violation['csp-report'] || violation,
        });

        // In production, you would:
        // 1. Store violations in database
        // 2. Alert security team for repeated violations
        // 3. Analyze patterns for potential attacks

        res.status(204).send();
      } catch (error) {
        console.error('CSP violation reporting error:', error);
        res.status(500).json({ error: 'Failed to process violation report' });
      }
    };
  }

  /**
   * Security headers middleware
   */
  createSecurityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Strict Transport Security (HSTS)
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

      // X-Content-Type-Options
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // X-Frame-Options (backup for frame-ancestors CSP)
      res.setHeader('X-Frame-Options', 'DENY');

      // X-XSS-Protection (legacy browsers)
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Referrer Policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Permissions Policy (formerly Feature Policy)
      res.setHeader('Permissions-Policy', [
        'camera=self',
        'microphone=self',
        'geolocation=self',
        'payment=self',
        'usb=(),',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()',
      ].join(', '));

      // Cross-Origin Embedder Policy
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');

      // Cross-Origin Opener Policy
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

      // Cross-Origin Resource Policy
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

      // Cache Control for sensitive endpoints
      if (req.path.includes('/api/auth') || req.path.includes('/api/lgpd')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      // LGPD compliance headers
      res.setHeader('X-Data-Protection', 'LGPD-Compliant');
      res.setHeader('X-Privacy-Policy', 'https://vangarments.com/privacy');
      res.setHeader('X-Terms-Of-Service', 'https://vangarments.com/terms');

      next();
    };
  }

  /**
   * CORS configuration for security
   */
  createSecureCORS() {
    return (req: Request, res: Response, next: NextFunction) => {
      const allowedOrigins = [
        'https://vangarments.com',
        'https://www.vangarments.com',
        'https://app.vangarments.com',
        'https://api.vangarments.com',
      ];

      // Add development origins
      if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push(
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001'
        );
      }

      const origin = req.get('Origin');
      
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-User-Consents',
        'X-API-Key',
        'X-Request-ID',
      ].join(', '));

      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(204).send();
      }

      next();
    };
  }

  /**
   * Request ID middleware for tracking
   */
  createRequestIdMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const crypto = require('crypto');
      const requestId = req.get('X-Request-ID') || crypto.randomUUID();
      
      req.headers['x-request-id'] = requestId;
      res.setHeader('X-Request-ID', requestId);

      next();
    };
  }

  /**
   * API versioning middleware
   */
  createAPIVersioning() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set API version header
      res.setHeader('X-API-Version', '1.0.0');
      
      // Check for deprecated API usage
      const apiVersion = req.get('X-API-Version') || req.query.version;
      
      if (apiVersion && apiVersion !== '1.0.0') {
        res.setHeader('X-API-Deprecated', 'true');
        res.setHeader('X-API-Sunset', '2025-12-31'); // Deprecation date
      }

      next();
    };
  }
}

// Export singleton instance
export const cspPolicy = new CSPPolicyMiddleware();

// Export pre-configured middleware
export const productionCSP = cspPolicy.createCSPMiddleware({
  environment: 'production',
  reportUri: '/api/security/csp-violation',
  enableNonce: true,
});

export const developmentCSP = cspPolicy.createCSPMiddleware({
  environment: 'development',
  reportOnly: true,
});

export const stagingCSP = cspPolicy.createCSPMiddleware({
  environment: 'staging',
  reportUri: '/api/security/csp-violation',
  reportOnly: false,
});

export const nonceMiddleware = cspPolicy.createNonceMiddleware();
export const violationReporter = cspPolicy.createViolationReporter();
export const securityHeaders = cspPolicy.createSecurityHeaders();
export const secureCORS = cspPolicy.createSecureCORS();
export const requestIdMiddleware = cspPolicy.createRequestIdMiddleware();
export const apiVersioning = cspPolicy.createAPIVersioning();