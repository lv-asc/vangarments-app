import { db } from '../database/connection';
import { Request } from 'express';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  requestData?: any;
  responseData?: any;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags: string[];
  createdAt: string;
}

export interface ComplianceReport {
  period: { start: string; end: string };
  summary: {
    totalActions: number;
    userActions: number;
    adminActions: number;
    dataAccess: number;
    dataModification: number;
    dataExport: number;
    failedAttempts: number;
  };
  lgpdCompliance: {
    consentActions: number;
    dataSubjectRequests: number;
    dataProcessingActivities: number;
    retentionActions: number;
  };
  securityEvents: {
    authenticationFailures: number;
    suspiciousActivities: number;
    privilegeEscalations: number;
    dataBreachAttempts: number;
  };
  topUsers: Array<{ userId: string; actionCount: number }>;
  topResources: Array<{ resource: string; accessCount: number }>;
  riskAnalysis: {
    highRiskActions: number;
    criticalActions: number;
    anomalousPatterns: string[];
  };
}

export class AuditLoggingService {
  private sensitiveActions = [
    'user_login',
    'user_logout',
    'password_change',
    'email_change',
    'profile_update',
    'data_export',
    'data_deletion',
    'consent_withdrawal',
    'admin_action',
    'privilege_change',
    'payment_processing',
    'sensitive_data_access',
  ];

  private highRiskActions = [
    'admin_login',
    'user_deletion',
    'data_export',
    'bulk_operation',
    'privilege_escalation',
    'system_configuration_change',
    'security_setting_change',
  ];

  /**
   * Log user action with comprehensive audit trail
   */
  async logAction(
    action: string,
    resource: string,
    req: Request,
    options: {
      resourceId?: string;
      changes?: Record<string, { before: any; after: any }>;
      metadata?: Record<string, any>;
      responseData?: any;
      statusCode?: number;
    } = {}
  ): Promise<void> {
    try {
      const auditEntry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'createdAt'> = {
        userId: req.user?.id,
        sessionId: this.getSessionId(req),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        action,
        resource,
        resourceId: options.resourceId,
        method: req.method,
        endpoint: req.path,
        statusCode: options.statusCode,
        requestData: this.sanitizeRequestData(req),
        responseData: options.responseData ? this.sanitizeResponseData(options.responseData) : undefined,
        changes: options.changes,
        metadata: options.metadata,
        riskLevel: this.calculateRiskLevel(action, resource, req),
        complianceFlags: this.getComplianceFlags(action, resource, req),
      };

      await this.insertAuditLog(auditEntry);

      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(auditEntry);

      // Trigger real-time alerts for critical actions
      if (auditEntry.riskLevel === 'critical') {
        await this.triggerCriticalAlert(auditEntry);
      }
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Log LGPD-specific actions
   */
  async logLGPDAction(
    action: string,
    userId: string,
    req: Request,
    details: {
      dataCategories?: string[];
      legalBasis?: string;
      purpose?: string;
      consentType?: string;
      requestType?: string;
    }
  ): Promise<void> {
    await this.logAction(action, 'lgpd_compliance', req, {
      metadata: {
        ...details,
        lgpdCompliant: true,
        dataController: 'Vangarments Ltda',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data access for LGPD compliance
   */
  async logDataAccess(
    userId: string,
    dataType: string,
    purpose: string,
    req: Request,
    options: {
      dataCategories?: string[];
      recordCount?: number;
      exportFormat?: string;
    } = {}
  ): Promise<void> {
    await this.logAction('data_access', dataType, req, {
      resourceId: userId,
      metadata: {
        purpose,
        dataCategories: options.dataCategories || [],
        recordCount: options.recordCount,
        exportFormat: options.exportFormat,
        lgpdBasis: 'user_consent',
        accessReason: purpose,
      },
    });
  }

  /**
   * Log administrative actions
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetResource: string,
    req: Request,
    options: {
      targetUserId?: string;
      changes?: Record<string, { before: any; after: any }>;
      justification?: string;
    } = {}
  ): Promise<void> {
    await this.logAction(action, targetResource, req, {
      resourceId: options.targetUserId,
      changes: options.changes,
      metadata: {
        adminUserId,
        justification: options.justification,
        adminAction: true,
        requiresApproval: this.requiresApproval(action),
      },
    });
  }

  /**
   * Generate compliance report for LGPD audits
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<ComplianceReport> {
    const baseQuery = `
      FROM security_audit_log 
      WHERE timestamp BETWEEN $1 AND $2
      ${userId ? 'AND user_id = $3' : ''}
    `;

    const params = userId ? [startDate, endDate, userId] : [startDate, endDate];

    // Summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as user_actions,
        COUNT(CASE WHEN security_flags->>'adminAction' = 'true' THEN 1 END) as admin_actions,
        COUNT(CASE WHEN event_type = 'data_access' THEN 1 END) as data_access,
        COUNT(CASE WHEN event_type IN ('data_modification', 'profile_update') THEN 1 END) as data_modification,
        COUNT(CASE WHEN event_type = 'data_export' THEN 1 END) as data_export,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_attempts
      ${baseQuery}
    `;

    const summaryResult = await db.query(summaryQuery, params);

    // LGPD compliance metrics
    const lgpdQuery = `
      SELECT 
        COUNT(CASE WHEN event_type LIKE '%consent%' THEN 1 END) as consent_actions,
        COUNT(CASE WHEN event_type LIKE '%data_subject_request%' THEN 1 END) as data_subject_requests,
        COUNT(CASE WHEN event_type = 'data_processing' THEN 1 END) as data_processing_activities,
        COUNT(CASE WHEN event_type LIKE '%retention%' THEN 1 END) as retention_actions
      ${baseQuery}
    `;

    const lgpdResult = await db.query(lgpdQuery, params);

    // Security events
    const securityQuery = `
      SELECT 
        COUNT(CASE WHEN event_type = 'authentication_failure' THEN 1 END) as authentication_failures,
        COUNT(CASE WHEN event_type = 'suspicious_activity_detected' THEN 1 END) as suspicious_activities,
        COUNT(CASE WHEN event_type LIKE '%privilege%' THEN 1 END) as privilege_escalations,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as data_breach_attempts
      ${baseQuery}
    `;

    const securityResult = await db.query(securityQuery, params);

    // Top users by activity
    const topUsersQuery = `
      SELECT 
        user_id,
        COUNT(*) as action_count
      ${baseQuery}
      AND user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY action_count DESC
      LIMIT 10
    `;

    const topUsersResult = await db.query(topUsersQuery, params);

    // Top resources accessed
    const topResourcesQuery = `
      SELECT 
        endpoint,
        COUNT(*) as access_count
      ${baseQuery}
      GROUP BY endpoint
      ORDER BY access_count DESC
      LIMIT 10
    `;

    const topResourcesResult = await db.query(topResourcesQuery, params);

    // Risk analysis
    const riskQuery = `
      SELECT 
        COUNT(CASE WHEN security_flags->>'riskLevel' = 'high' THEN 1 END) as high_risk_actions,
        COUNT(CASE WHEN security_flags->>'riskLevel' = 'critical' THEN 1 END) as critical_actions
      ${baseQuery}
    `;

    const riskResult = await db.query(riskQuery, params);

    return {
      period: { start: startDate, end: endDate },
      summary: summaryResult.rows[0],
      lgpdCompliance: lgpdResult.rows[0],
      securityEvents: securityResult.rows[0],
      topUsers: topUsersResult.rows,
      topResources: topResourcesResult.rows.map(row => ({
        resource: row.endpoint,
        accessCount: row.access_count,
      })),
      riskAnalysis: {
        ...riskResult.rows[0],
        anomalousPatterns: await this.detectAnomalousPatterns(startDate, endDate, userId),
      },
    };
  }

  /**
   * Search audit logs with filters
   */
  async searchAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    riskLevel?: string;
    ipAddress?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters.action) {
      conditions.push(`event_type = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters.resource) {
      conditions.push(`endpoint LIKE $${paramIndex++}`);
      params.push(`%${filters.resource}%`);
    }

    if (filters.startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    if (filters.riskLevel) {
      conditions.push(`security_flags->>'riskLevel' = $${paramIndex++}`);
      params.push(filters.riskLevel);
    }

    if (filters.ipAddress) {
      conditions.push(`ip_address = $${paramIndex++}`);
      params.push(filters.ipAddress);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total records
    const countQuery = `SELECT COUNT(*) FROM security_audit_log ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const selectQuery = `
      SELECT * FROM security_audit_log 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);
    const logsResult = await db.query(selectQuery, params);

    return {
      logs: logsResult.rows.map(this.mapRowToAuditEntry),
      total,
    };
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 2555): Promise<number> { // 7 years default for LGPD
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Keep critical and high-risk logs longer
    const deleteQuery = `
      DELETE FROM security_audit_log
      WHERE timestamp < $1
        AND security_flags->>'riskLevel' NOT IN ('high', 'critical')
        AND event_type NOT LIKE '%lgpd%'
        AND event_type NOT LIKE '%consent%'
        AND event_type NOT LIKE '%data_subject_request%'
    `;

    const result = await db.query(deleteQuery, [cutoffDate]);
    return result.rowCount || 0;
  }

  // Private helper methods

  private async insertAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'createdAt'>): Promise<void> {
    const query = `
      INSERT INTO security_audit_log (
        user_id, ip_address, user_agent, event_type, endpoint, method,
        status_code, request_data, response_data, error_message, security_flags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    const securityFlags = {
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      changes: entry.changes,
      metadata: entry.metadata,
      riskLevel: entry.riskLevel,
      complianceFlags: entry.complianceFlags,
      sessionId: entry.sessionId,
    };

    const values = [
      entry.userId || null,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.action,
      entry.endpoint,
      entry.method,
      entry.statusCode || null,
      entry.requestData ? JSON.stringify(entry.requestData) : null,
      entry.responseData ? JSON.stringify(entry.responseData) : null,
      null, // error_message
      JSON.stringify(securityFlags),
    ];

    await db.query(query, values);
  }

  private getSessionId(req: Request): string | undefined {
    // Extract session ID from various sources
    return req.session?.id || req.get('X-Session-ID') || req.cookies?.sessionId;
  }

  private calculateRiskLevel(action: string, resource: string, req: Request): 'low' | 'medium' | 'high' | 'critical' {
    // Critical actions
    if (this.highRiskActions.includes(action)) {
      return 'critical';
    }

    // High risk conditions
    if (
      this.sensitiveActions.includes(action) ||
      resource.includes('admin') ||
      resource.includes('sensitive') ||
      req.path.includes('/admin/')
    ) {
      return 'high';
    }

    // Medium risk conditions
    if (
      action.includes('delete') ||
      action.includes('update') ||
      action.includes('modify') ||
      req.method === 'DELETE' ||
      req.method === 'PUT'
    ) {
      return 'medium';
    }

    return 'low';
  }

  private getComplianceFlags(action: string, resource: string, req: Request): string[] {
    const flags: string[] = [];

    // LGPD compliance flags
    if (action.includes('consent') || resource.includes('lgpd')) {
      flags.push('LGPD_RELEVANT');
    }

    if (action.includes('data_') || resource.includes('personal_data')) {
      flags.push('PERSONAL_DATA_PROCESSING');
    }

    if (action.includes('export') || action.includes('portability')) {
      flags.push('DATA_PORTABILITY');
    }

    if (action.includes('deletion') || action.includes('erasure')) {
      flags.push('RIGHT_TO_ERASURE');
    }

    // Security compliance flags
    if (req.user?.role === 'admin') {
      flags.push('ADMIN_ACTION');
    }

    if (this.sensitiveActions.includes(action)) {
      flags.push('SENSITIVE_ACTION');
    }

    return flags;
  }

  private requiresApproval(action: string): boolean {
    const approvalRequiredActions = [
      'user_deletion',
      'bulk_data_export',
      'system_configuration_change',
      'privilege_escalation',
      'security_setting_change',
    ];

    return approvalRequiredActions.includes(action);
  }

  private async checkSuspiciousPatterns(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'createdAt'>): Promise<void> {
    // Check for rapid successive actions from same IP
    if (entry.ipAddress) {
      const recentActions = await this.getRecentActionsByIP(entry.ipAddress, 5); // Last 5 minutes
      if (recentActions > 50) {
        console.warn(`[AUDIT ALERT] Suspicious activity: ${recentActions} actions from IP ${entry.ipAddress} in 5 minutes`);
      }
    }

    // Check for unusual admin actions
    if (entry.metadata?.adminAction && entry.riskLevel === 'critical') {
      console.warn(`[AUDIT ALERT] Critical admin action: ${entry.action} by user ${entry.userId}`);
    }

    // Check for data export patterns
    if (entry.action === 'data_export' && entry.userId) {
      const recentExports = await this.getRecentExportsByUser(entry.userId, 24); // Last 24 hours
      if (recentExports > 5) {
        console.warn(`[AUDIT ALERT] Excessive data exports: ${recentExports} exports by user ${entry.userId} in 24 hours`);
      }
    }
  }

  private async triggerCriticalAlert(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'createdAt'>): Promise<void> {
    console.error(`[CRITICAL AUDIT ALERT] ${entry.action} on ${entry.resource} by user ${entry.userId} from IP ${entry.ipAddress}`);
    
    // In production, this would:
    // 1. Send immediate notifications to security team
    // 2. Create incident tickets
    // 3. Trigger automated security responses
    // 4. Update monitoring dashboards
  }

  private async getRecentActionsByIP(ipAddress: string, minutes: number): Promise<number> {
    const query = `
      SELECT COUNT(*)
      FROM security_audit_log
      WHERE ip_address = $1
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
    `;

    const result = await db.query(query, [ipAddress]);
    return parseInt(result.rows[0].count) || 0;
  }

  private async getRecentExportsByUser(userId: string, hours: number): Promise<number> {
    const query = `
      SELECT COUNT(*)
      FROM security_audit_log
      WHERE user_id = $1
        AND event_type = 'data_export'
        AND timestamp > NOW() - INTERVAL '${hours} hours'
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count) || 0;
  }

  private async detectAnomalousPatterns(startDate: string, endDate: string, userId?: string): Promise<string[]> {
    const patterns: string[] = [];

    // This would implement more sophisticated anomaly detection
    // For now, return basic patterns

    const baseQuery = `
      FROM security_audit_log 
      WHERE timestamp BETWEEN $1 AND $2
      ${userId ? 'AND user_id = $3' : ''}
    `;

    const params = userId ? [startDate, endDate, userId] : [startDate, endDate];

    // Check for unusual time patterns
    const timeQuery = `
      SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        COUNT(*) as count
      ${baseQuery}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      HAVING COUNT(*) > 100
    `;

    const timeResult = await db.query(timeQuery, params);
    if (timeResult.rows.length > 0) {
      patterns.push('unusual_time_patterns');
    }

    return patterns;
  }

  private sanitizeRequestData(req: Request): any {
    const sanitized = {
      body: { ...req.body },
      query: { ...req.query },
      params: { ...req.params },
    };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'cpf', 'ssn', 'credit_card'];
    
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

    return sanitizeObject(sanitized);
  }

  private sanitizeResponseData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'cpf', 'ssn', 'credit_card'];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (Array.isArray(value)) {
          result[key] = value.map(sanitizeObject);
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  private mapRowToAuditEntry(row: any): AuditLogEntry {
    const securityFlags = row.security_flags || {};
    
    return {
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id,
      sessionId: securityFlags.sessionId,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      action: securityFlags.action || row.event_type,
      resource: securityFlags.resource || 'unknown',
      resourceId: securityFlags.resourceId,
      method: row.method,
      endpoint: row.endpoint,
      statusCode: row.status_code,
      requestData: row.request_data,
      responseData: row.response_data,
      changes: securityFlags.changes,
      metadata: securityFlags.metadata,
      riskLevel: securityFlags.riskLevel || 'low',
      complianceFlags: securityFlags.complianceFlags || [],
      createdAt: row.created_at || row.timestamp,
    };
  }
}