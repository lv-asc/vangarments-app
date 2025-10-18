import { db } from '../database/connection';
import { Request } from 'express';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  securityFlags?: Record<string, any>;
}

export interface RateLimitEntry {
  id: string;
  identifier: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  windowEnd: string;
  blockedUntil?: string;
}

export interface SecurityAlert {
  type: 'rate_limit_exceeded' | 'suspicious_activity' | 'authentication_failure' | 'data_breach_attempt' | 'ddos_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userId?: string;
}

export class SecurityMonitoringService {
  private alertThresholds = {
    failedLoginAttempts: 5,
    rateLimitViolations: 10,
    suspiciousPatterns: 3,
    ddosRequestsPerMinute: 100,
  };

  /**
   * Log security event to audit trail
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const query = `
        INSERT INTO security_audit_log (
          event_type, severity, user_id, ip_address, user_agent,
          endpoint, method, status_code, request_data, response_data,
          error_message, security_flags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      const values = [
        event.eventType,
        event.severity,
        event.userId || null,
        event.ipAddress || null,
        event.userAgent || null,
        event.endpoint || null,
        event.method || null,
        event.statusCode || null,
        event.requestData ? JSON.stringify(event.requestData) : null,
        event.responseData ? JSON.stringify(event.responseData) : null,
        event.errorMessage || null,
        event.securityFlags ? JSON.stringify(event.securityFlags) : '{}',
      ];

      await db.query(query, values);

      // Check if this event should trigger an alert
      await this.checkForSecurityAlerts(event);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Enhanced request logging middleware
   */
  createSecurityLogger() {
    return async (req: Request, res: any, next: any) => {
      const startTime = Date.now();
      const originalSend = res.send;

      // Capture response data
      const self = this;
      res.send = function(data: any) {
        const responseTime = Date.now() - startTime;
        
        // Log the request/response
        const securityEvent: Omit<SecurityEvent, 'id' | 'timestamp'> = {
          eventType: 'api_request',
          severity: res.statusCode >= 400 ? (res.statusCode >= 500 ? 'error' : 'warning') : 'info',
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          requestData: self.sanitizeRequestData(req),
          securityFlags: {
            responseTime,
            contentLength: data?.length || 0,
            authenticated: !!req.user,
          },
        };

        // Don't wait for logging to complete
        self.logSecurityEvent(securityEvent).catch(console.error);

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Track rate limiting attempts
   */
  async trackRateLimit(
    identifier: string,
    endpoint: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{ allowed: boolean; resetTime?: number; requestCount: number }> {
    try {
      const windowStart = new Date();
      const windowEnd = new Date(windowStart.getTime() + windowMs);

      // Check current rate limit status
      const checkQuery = `
        SELECT request_count, window_end, blocked_until
        FROM rate_limit_tracking
        WHERE identifier = $1 AND endpoint = $2 AND window_end > NOW()
        ORDER BY window_start DESC
        LIMIT 1
      `;

      const checkResult = await db.query(checkQuery, [identifier, endpoint]);

      if (checkResult.rows.length > 0) {
        const current = checkResult.rows[0];
        
        // Check if currently blocked
        if (current.blocked_until && new Date(current.blocked_until) > new Date()) {
          return {
            allowed: false,
            resetTime: new Date(current.blocked_until).getTime(),
            requestCount: current.request_count,
          };
        }

        // Update existing window
        if (current.request_count >= maxRequests) {
          // Block for the remaining window time
          const blockedUntil = new Date(current.window_end);
          
          await db.query(
            'UPDATE rate_limit_tracking SET blocked_until = $1 WHERE identifier = $2 AND endpoint = $3',
            [blockedUntil, identifier, endpoint]
          );

          // Log rate limit violation
          await this.logSecurityEvent({
            eventType: 'rate_limit_exceeded',
            severity: 'warning',
            ipAddress: identifier.includes('.') ? identifier : undefined,
            userId: !identifier.includes('.') ? identifier : undefined,
            endpoint,
            securityFlags: {
              requestCount: current.request_count,
              maxRequests,
              windowMs,
            },
          });

          return {
            allowed: false,
            resetTime: blockedUntil.getTime(),
            requestCount: current.request_count,
          };
        }

        // Increment counter
        await db.query(
          'UPDATE rate_limit_tracking SET request_count = request_count + 1, updated_at = NOW() WHERE identifier = $1 AND endpoint = $2',
          [identifier, endpoint]
        );

        return {
          allowed: true,
          requestCount: current.request_count + 1,
        };
      }

      // Create new rate limit window
      const insertQuery = `
        INSERT INTO rate_limit_tracking (identifier, endpoint, request_count, window_start, window_end)
        VALUES ($1, $2, 1, $3, $4)
        ON CONFLICT (identifier, endpoint, window_start) DO UPDATE SET
          request_count = rate_limit_tracking.request_count + 1,
          updated_at = NOW()
      `;

      await db.query(insertQuery, [identifier, endpoint, windowStart, windowEnd]);

      return {
        allowed: true,
        requestCount: 1,
      };
    } catch (error) {
      console.error('Rate limit tracking error:', error);
      // Allow request on error to avoid blocking legitimate traffic
      return { allowed: true, requestCount: 0 };
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(req: Request): Promise<boolean> {
    const suspiciousPatterns = [
      // SQL Injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|where|into|values|table|database)\b)/i,
      
      // XSS patterns
      /(<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=)/i,
      
      // Path traversal
      /(\.\.[\/\\]){2,}/,
      
      // Command injection
      /(\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|nslookup|dig|curl|wget)\b.*[;&|`$])/i,
      
      // LDAP injection
      /(\(.*[*)(|&=!><~].*\))/,
      
      // NoSQL injection
      /(\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and)/i,
    ];

    const requestString = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: this.sanitizeHeaders(req.headers),
    });

    const detectedPatterns = suspiciousPatterns.filter(pattern => pattern.test(requestString));

    if (detectedPatterns.length > 0) {
      await this.logSecurityEvent({
        eventType: 'suspicious_activity_detected',
        severity: 'warning',
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method,
        requestData: this.sanitizeRequestData(req),
        securityFlags: {
          detectedPatterns: detectedPatterns.length,
          patterns: detectedPatterns.map(p => p.source),
        },
      });

      return true;
    }

    return false;
  }

  /**
   * Monitor authentication failures
   */
  async trackAuthenticationFailure(
    identifier: string,
    reason: string,
    req: Request
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: 'authentication_failure',
      severity: 'warning',
      userId: req.body?.email || req.body?.cpf,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      errorMessage: reason,
      securityFlags: {
        identifier,
        attemptedCredentials: {
          email: req.body?.email ? '[REDACTED]' : undefined,
          cpf: req.body?.cpf ? '[REDACTED]' : undefined,
        },
      },
    });

    // Check for brute force attempts
    await this.checkBruteForceAttempts(identifier, req.ip);
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(
    startDate: string,
    endDate: string
  ): Promise<{
    summary: any;
    events: SecurityEvent[];
    alerts: SecurityAlert[];
    rateLimitViolations: any[];
    topThreats: any[];
  }> {
    // Security events summary
    const summaryQuery = `
      SELECT 
        event_type,
        severity,
        COUNT(*) as count,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT user_id) as unique_users
      FROM security_audit_log
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY event_type, severity
      ORDER BY count DESC
    `;

    const summaryResult = await db.query(summaryQuery, [startDate, endDate]);

    // Recent security events
    const eventsQuery = `
      SELECT *
      FROM security_audit_log
      WHERE timestamp BETWEEN $1 AND $2
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const eventsResult = await db.query(eventsQuery, [startDate, endDate]);

    // Rate limit violations
    const rateLimitQuery = `
      SELECT 
        identifier,
        endpoint,
        COUNT(*) as violations,
        MAX(request_count) as max_requests,
        MIN(window_start) as first_violation,
        MAX(window_end) as last_violation
      FROM rate_limit_tracking
      WHERE blocked_until IS NOT NULL
        AND window_start BETWEEN $1 AND $2
      GROUP BY identifier, endpoint
      ORDER BY violations DESC
    `;

    const rateLimitResult = await db.query(rateLimitQuery, [startDate, endDate]);

    // Top threat IPs
    const threatsQuery = `
      SELECT 
        ip_address,
        COUNT(*) as threat_count,
        COUNT(DISTINCT event_type) as threat_types,
        MAX(severity) as max_severity,
        MAX(timestamp) as last_seen
      FROM security_audit_log
      WHERE timestamp BETWEEN $1 AND $2
        AND severity IN ('warning', 'error', 'critical')
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      ORDER BY threat_count DESC
      LIMIT 20
    `;

    const threatsResult = await db.query(threatsQuery, [startDate, endDate]);

    return {
      summary: summaryResult.rows,
      events: eventsResult.rows.map(this.mapRowToSecurityEvent),
      alerts: [], // Would be populated from alert system
      rateLimitViolations: rateLimitResult.rows,
      topThreats: threatsResult.rows,
    };
  }

  /**
   * Clean up old security logs (data retention)
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleteQuery = `
      DELETE FROM security_audit_log
      WHERE timestamp < $1
        AND severity NOT IN ('error', 'critical')
    `;

    const result = await db.query(deleteQuery, [cutoffDate]);
    return result.rowCount || 0;
  }

  // Private helper methods

  private async checkForSecurityAlerts(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    // Check for patterns that should trigger immediate alerts
    if (event.severity === 'critical') {
      await this.triggerSecurityAlert({
        type: 'data_breach_attempt',
        severity: 'critical',
        message: `Critical security event detected: ${event.eventType}`,
        details: event,
        timestamp: new Date().toISOString(),
        ipAddress: event.ipAddress,
        userId: event.userId,
      });
    }

    // Check for DDoS patterns
    if (event.eventType === 'rate_limit_exceeded') {
      const recentViolations = await this.getRecentRateLimitViolations(event.ipAddress, 5); // Last 5 minutes
      if (recentViolations > this.alertThresholds.ddosRequestsPerMinute) {
        await this.triggerSecurityAlert({
          type: 'ddos_attack',
          severity: 'high',
          message: `Potential DDoS attack detected from IP ${event.ipAddress}`,
          details: { violations: recentViolations, threshold: this.alertThresholds.ddosRequestsPerMinute },
          timestamp: new Date().toISOString(),
          ipAddress: event.ipAddress,
        });
      }
    }
  }

  private async checkBruteForceAttempts(identifier: string, ipAddress?: string): Promise<void> {
    const recentFailures = await this.getRecentAuthFailures(identifier, 15); // Last 15 minutes
    
    if (recentFailures >= this.alertThresholds.failedLoginAttempts) {
      await this.triggerSecurityAlert({
        type: 'authentication_failure',
        severity: 'medium',
        message: `Brute force attack detected for identifier ${identifier}`,
        details: { failures: recentFailures, threshold: this.alertThresholds.failedLoginAttempts },
        timestamp: new Date().toISOString(),
        ipAddress,
      });
    }
  }

  private async getRecentRateLimitViolations(ipAddress?: string, minutes: number = 5): Promise<number> {
    if (!ipAddress) return 0;

    const query = `
      SELECT COUNT(*)
      FROM rate_limit_tracking
      WHERE identifier = $1
        AND blocked_until IS NOT NULL
        AND window_start > NOW() - INTERVAL '${minutes} minutes'
    `;

    const result = await db.query(query, [ipAddress]);
    return parseInt(result.rows[0].count) || 0;
  }

  private async getRecentAuthFailures(identifier: string, minutes: number = 15): Promise<number> {
    const query = `
      SELECT COUNT(*)
      FROM security_audit_log
      WHERE event_type = 'authentication_failure'
        AND (user_id = $1 OR ip_address = $1)
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
    `;

    const result = await db.query(query, [identifier]);
    return parseInt(result.rows[0].count) || 0;
  }

  private async triggerSecurityAlert(alert: SecurityAlert): Promise<void> {
    // Log the alert
    console.warn(`[SECURITY ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.details);

    // In production, this would:
    // 1. Send notifications to security team
    // 2. Update monitoring dashboards
    // 3. Trigger automated responses (IP blocking, etc.)
    // 4. Create incident tickets
    
    // For now, just log to security audit
    await this.logSecurityEvent({
      eventType: 'security_alert_triggered',
      severity: alert.severity === 'critical' ? 'critical' : 'error',
      ipAddress: alert.ipAddress,
      userId: alert.userId,
      errorMessage: alert.message,
      securityFlags: {
        alertType: alert.type,
        alertDetails: alert.details,
      },
    });
  }

  private sanitizeRequestData(req: Request): any {
    const sanitized = {
      body: { ...req.body },
      query: { ...req.query },
      params: { ...req.params },
    };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'cpf', 'ssn'];
    
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return {
      body: sanitizeObject(sanitized.body),
      query: sanitizeObject(sanitized.query),
      params: sanitizeObject(sanitized.params),
    };
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private mapRowToSecurityEvent(row: any): SecurityEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
      eventType: row.event_type,
      severity: row.severity,
      userId: row.user_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      endpoint: row.endpoint,
      method: row.method,
      statusCode: row.status_code,
      requestData: row.request_data,
      responseData: row.response_data,
      errorMessage: row.error_message,
      securityFlags: row.security_flags || {},
    };
  }
}