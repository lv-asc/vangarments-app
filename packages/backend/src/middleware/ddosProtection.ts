import { Request, Response, NextFunction } from 'express';
import { SecurityMonitoringService } from '../services/securityMonitoringService';

export interface DDoSConfig {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

export class DDoSProtectionMiddleware {
  private securityService: SecurityMonitoringService;
  private suspiciousIPs: Map<string, { count: number; lastSeen: number }> = new Map();
  private blockedIPs: Map<string, number> = new Map(); // IP -> unblock timestamp

  constructor() {
    this.securityService = new SecurityMonitoringService();

    // Clean up old entries every 5 minutes
    setInterval(() => {
      this.cleanupOldEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Create adaptive rate limiting middleware
   */
  createAdaptiveRateLimit(config: DDoSConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const identifier = config.keyGenerator ? config.keyGenerator(req) : this.getClientIdentifier(req);

        // Check if IP is currently blocked
        if (this.isIPBlocked(identifier)) {
          await this.securityService.logSecurityEvent({
            eventType: 'ddos_blocked_request',
            severity: 'warning',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            method: req.method,
            securityFlags: {
              reason: 'IP temporarily blocked for DDoS protection',
              identifier,
            },
          });

          return res.status(429).json({
            success: false,
            message: 'Too many requests. IP temporarily blocked.',
            code: 'DDOS_PROTECTION_ACTIVE',
            retryAfter: this.getBlockTimeRemaining(identifier),
          });
        }

        // Check rate limit
        const rateLimitResult = await this.securityService.trackRateLimit(
          identifier,
          req.path,
          config.windowMs,
          config.maxRequests
        );

        if (!rateLimitResult.allowed) {
          // Escalate to IP blocking if repeated violations
          await this.handleRateLimitViolation(identifier, req);

          if (config.onLimitReached) {
            config.onLimitReached(req, res);
          }

          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : config.windowMs / 1000,
            requestCount: rateLimitResult.requestCount,
            maxRequests: config.maxRequests,
          });
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - rateLimitResult.requestCount));
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());

        next();
      } catch (error) {
        console.error('DDoS protection error:', error);
        // Allow request on error to avoid blocking legitimate traffic
        next();
      }
    };
  }

  /**
   * Advanced DDoS detection middleware
   */
  createAdvancedDDoSDetection() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const clientIP = req.ip || 'unknown';
        const userAgent = req.get('User-Agent') || '';
        const now = Date.now();

        // Detect suspicious patterns
        const suspiciousIndicators = this.detectSuspiciousPatterns(req);

        if (suspiciousIndicators.length > 0) {
          await this.securityService.logSecurityEvent({
            eventType: 'ddos_suspicious_pattern',
            severity: 'warning',
            ipAddress: clientIP,
            userAgent,
            endpoint: req.path,
            method: req.method,
            securityFlags: {
              indicators: suspiciousIndicators,
              riskScore: this.calculateRiskScore(suspiciousIndicators),
            },
          });

          // Increase monitoring for this IP
          this.markSuspiciousIP(clientIP);
        }

        // Check if this IP has been flagged as suspicious
        if (this.isSuspiciousIP(clientIP)) {
          // Apply stricter rate limiting for suspicious IPs
          const strictLimit = await this.securityService.trackRateLimit(
            `suspicious_${clientIP}`,
            req.path,
            60 * 1000, // 1 minute window
            10 // Only 10 requests per minute for suspicious IPs
          );

          if (!strictLimit.allowed) {
            // Block IP for repeated violations
            this.blockIP(clientIP, 15 * 60 * 1000); // 15 minutes

            await this.securityService.logSecurityEvent({
              eventType: 'ddos_ip_blocked',
              severity: 'error',
              ipAddress: clientIP,
              userAgent,
              endpoint: req.path,
              method: req.method,
              securityFlags: {
                reason: 'Suspicious activity detected, IP blocked',
                blockDuration: '15 minutes',
              },
            });

            return res.status(429).json({
              success: false,
              message: 'Suspicious activity detected. Access temporarily restricted.',
              code: 'SUSPICIOUS_ACTIVITY_BLOCKED',
            });
          }
        }

        next();
      } catch (error) {
        console.error('Advanced DDoS detection error:', error);
        next();
      }
    };
  }

  /**
   * Geolocation-based protection
   */
  createGeolocationProtection(allowedCountries: string[] = ['BR']) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // In production, this would use a geolocation service
        // For now, we'll implement basic checks

        const clientIP = req.ip || 'unknown';
        const country = await this.getCountryFromIP(clientIP);

        if (country && !allowedCountries.includes(country)) {
          await this.securityService.logSecurityEvent({
            eventType: 'geolocation_blocked',
            severity: 'info',
            ipAddress: clientIP,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            method: req.method,
            securityFlags: {
              detectedCountry: country || 'unknown',
              allowedCountries,
            },
          });

          return res.status(403).json({
            success: false,
            message: 'Access not available in your region',
            code: 'GEOLOCATION_RESTRICTED',
          });
        }

        next();
      } catch (error) {
        console.error('Geolocation protection error:', error);
        // Allow request on error
        next();
      }
    };
  }

  /**
   * Bot detection middleware
   */
  createBotDetection() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userAgent = req.get('User-Agent') || '';
        const clientIP = req.ip || 'unknown';

        const botIndicators = this.detectBotPatterns(req);

        if (botIndicators.isBot) {
          if (botIndicators.isMalicious) {
            await this.securityService.logSecurityEvent({
              eventType: 'malicious_bot_detected',
              severity: 'warning',
              ipAddress: clientIP,
              userAgent,
              endpoint: req.path,
              method: req.method,
              securityFlags: {
                botType: botIndicators.type,
                confidence: botIndicators.confidence,
                indicators: botIndicators.indicators,
              },
            });

            return res.status(403).json({
              success: false,
              message: 'Automated requests not allowed',
              code: 'BOT_DETECTED',
            });
          } else {
            // Legitimate bot (search engines, etc.) - apply rate limiting
            const botLimit = await this.securityService.trackRateLimit(
              `bot_${clientIP}`,
              req.path,
              60 * 1000, // 1 minute
              30 // 30 requests per minute for bots
            );

            if (!botLimit.allowed) {
              return res.status(429).json({
                success: false,
                message: 'Bot rate limit exceeded',
                code: 'BOT_RATE_LIMIT',
              });
            }
          }
        }

        next();
      } catch (error) {
        console.error('Bot detection error:', error);
        next();
      }
    };
  }

  // Private helper methods

  private getClientIdentifier(req: Request): string {
    // Use IP address as primary identifier
    // In production, you might want to use a combination of IP + User-Agent hash
    return req.ip || 'unknown';
  }

  private isIPBlocked(ip: string): boolean {
    const blockUntil = this.blockedIPs.get(ip);
    if (!blockUntil) return false;

    if (Date.now() > blockUntil) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return true;
  }

  private getBlockTimeRemaining(ip: string): number {
    const blockUntil = this.blockedIPs.get(ip);
    if (!blockUntil) return 0;

    return Math.max(0, Math.ceil((blockUntil - Date.now()) / 1000));
  }

  private async handleRateLimitViolation(identifier: string, req: Request): Promise<void> {
    const violations = await this.getRecentViolations(identifier);

    // Escalate blocking duration based on violation count
    let blockDuration = 5 * 60 * 1000; // 5 minutes base

    if (violations > 5) {
      blockDuration = 30 * 60 * 1000; // 30 minutes
    } else if (violations > 10) {
      blockDuration = 2 * 60 * 60 * 1000; // 2 hours
    } else if (violations > 20) {
      blockDuration = 24 * 60 * 60 * 1000; // 24 hours
    }

    this.blockIP(identifier, blockDuration);

    await this.securityService.logSecurityEvent({
      eventType: 'ddos_escalated_block',
      severity: 'error',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      securityFlags: {
        violations,
        blockDuration: blockDuration / 1000,
        identifier,
      },
    });
  }

  private async getRecentViolations(identifier: string): Promise<number> {
    // This would query the database for recent violations
    // For now, return a mock value
    return Math.floor(Math.random() * 10);
  }

  private blockIP(ip: string, duration: number): void {
    this.blockedIPs.set(ip, Date.now() + duration);
  }

  private detectSuspiciousPatterns(req: Request): string[] {
    const indicators: string[] = [];
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';

    // Check for missing or suspicious User-Agent
    if (!userAgent || userAgent.length < 10) {
      indicators.push('missing_or_short_user_agent');
    }

    // Check for automated tool signatures
    const automatedTools = ['curl', 'wget', 'python-requests', 'bot', 'crawler', 'spider'];
    if (automatedTools.some(tool => userAgent.toLowerCase().includes(tool))) {
      indicators.push('automated_tool_signature');
    }

    // Check for suspicious request patterns
    if (req.method === 'POST' && !req.get('Content-Type')) {
      indicators.push('post_without_content_type');
    }

    // Check for rapid sequential requests (would need session tracking)
    // This is a simplified check
    if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].includes(',')) {
      indicators.push('multiple_proxy_headers');
    }

    // Check for suspicious query parameters
    const queryString = JSON.stringify(req.query);
    if (queryString.length > 1000) {
      indicators.push('excessive_query_parameters');
    }

    return indicators;
  }

  private calculateRiskScore(indicators: string[]): number {
    const weights: Record<string, number> = {
      'missing_or_short_user_agent': 3,
      'automated_tool_signature': 5,
      'post_without_content_type': 2,
      'multiple_proxy_headers': 4,
      'excessive_query_parameters': 3,
    };

    return indicators.reduce((score, indicator) => {
      return score + (weights[indicator] || 1);
    }, 0);
  }

  private markSuspiciousIP(ip: string): void {
    const existing = this.suspiciousIPs.get(ip);
    this.suspiciousIPs.set(ip, {
      count: existing ? existing.count + 1 : 1,
      lastSeen: Date.now(),
    });
  }

  private isSuspiciousIP(ip: string): boolean {
    const entry = this.suspiciousIPs.get(ip);
    if (!entry) return false;

    // Consider IP suspicious if flagged multiple times in the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    return entry.count >= 3 && entry.lastSeen > oneHourAgo;
  }

  private async getCountryFromIP(ip: string): Promise<string | null> {
    // In production, this would use a geolocation service like MaxMind or ipapi
    // For now, return null (unknown)

    // Mock implementation for Brazilian IPs
    if (ip.startsWith('177.') || ip.startsWith('189.') || ip.startsWith('201.')) {
      return 'BR';
    }

    return null;
  }

  private detectBotPatterns(req: Request): {
    isBot: boolean;
    isMalicious: boolean;
    type?: string;
    confidence: number;
    indicators: string[];
  } {
    const userAgent = req.get('User-Agent') || '';
    const indicators: string[] = [];
    let confidence = 0;

    // Known good bots
    const goodBots = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'];
    const isGoodBot = goodBots.some(bot => userAgent.toLowerCase().includes(bot));

    if (isGoodBot) {
      return {
        isBot: true,
        isMalicious: false,
        type: 'search_engine',
        confidence: 0.9,
        indicators: ['known_search_engine'],
      };
    }

    // Malicious bot patterns
    const maliciousBotPatterns = [
      'scrapy',
      'selenium',
      'phantomjs',
      'headless',
      'automation',
      'bot',
      'crawler',
      'spider',
    ];

    maliciousBotPatterns.forEach(pattern => {
      if (userAgent.toLowerCase().includes(pattern)) {
        indicators.push(`malicious_pattern_${pattern}`);
        confidence += 0.3;
      }
    });

    // Check for headless browser signatures
    if (!req.get('Accept-Language') || !req.get('Accept-Encoding')) {
      indicators.push('missing_browser_headers');
      confidence += 0.2;
    }

    // Check for suspicious request timing (would need session tracking)
    // This is a simplified check
    if (req.path.includes('/api/') && !req.get('X-Requested-With')) {
      indicators.push('api_request_without_xhr_header');
      confidence += 0.1;
    }

    return {
      isBot: confidence > 0.3,
      isMalicious: confidence > 0.5,
      type: confidence > 0.5 ? 'malicious' : 'unknown',
      confidence,
      indicators,
    };
  }

  private cleanupOldEntries(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    // Clean up suspicious IPs
    for (const [ip, entry] of this.suspiciousIPs.entries()) {
      if (entry.lastSeen < oneHourAgo) {
        this.suspiciousIPs.delete(ip);
      }
    }

    // Clean up blocked IPs
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (Date.now() > blockUntil) {
        this.blockedIPs.delete(ip);
      }
    }
  }
}

// Export singleton instance
export const ddosProtection = new DDoSProtectionMiddleware();

// Export pre-configured middleware functions
export const standardRateLimit = ddosProtection.createAdaptiveRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5000,
  blockDuration: 5 * 60 * 1000, // 5 minutes
});

export const strictRateLimit = ddosProtection.createAdaptiveRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  blockDuration: 15 * 60 * 1000, // 15 minutes
});

export const authRateLimit = ddosProtection.createAdaptiveRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // Greatly increased for development
  blockDuration: 30 * 60 * 1000, // 30 minutes
  keyGenerator: (req) => `auth_${req.ip}_${req.body?.email || req.body?.cpf || 'unknown'}`,
});
export const advancedDDoSDetection = ddosProtection.createAdvancedDDoSDetection();
export const geolocationProtection = ddosProtection.createGeolocationProtection(['BR']);
export const botDetection = ddosProtection.createBotDetection();