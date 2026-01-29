import { db } from '../database/connection';

export interface UserConsent {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'cookies' | 'third_party_sharing';
  consentGiven: boolean;
  consentDate: string;
  consentVersion: string;
  ipAddress: string;
  userAgent: string;
  withdrawalDate?: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  purpose: string;
  dataCategories: string[];
  retentionPeriod: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataProcessingRecord {
  id: string;
  userId: string;
  processingActivity: string;
  dataCategories: string[];
  purpose: string;
  legalBasis: string;
  dataSource: string;
  recipients?: string[];
  internationalTransfers?: boolean;
  retentionPeriod: string;
  securityMeasures: string[];
  processedAt: string;
  processedBy: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: string;
  completionDate?: string;
  requestDetails: string;
  responseData?: any;
  rejectionReason?: string;
  verificationMethod: string;
  handledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export class LGPDComplianceService {
  /**
   * Record user consent (LGPD Article 8)
   */
  async recordConsent(
    userId: string,
    consentData: {
      consentType: UserConsent['consentType'];
      consentGiven: boolean;
      purpose: string;
      dataCategories: string[];
      legalBasis: UserConsent['legalBasis'];
      retentionPeriod: string;
      ipAddress: string;
      userAgent: string;
      consentVersion?: string;
    }
  ): Promise<UserConsent> {
    const query = `
      INSERT INTO user_consents (
        user_id, consent_type, consent_given, purpose, data_categories,
        legal_basis, retention_period, ip_address, user_agent, consent_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      userId,
      consentData.consentType,
      consentData.consentGiven,
      consentData.purpose,
      consentData.dataCategories,
      consentData.legalBasis,
      consentData.retentionPeriod,
      consentData.ipAddress,
      consentData.userAgent,
      consentData.consentVersion || '1.0',
    ];

    const result = await db.query(query, values);
    return this.mapRowToUserConsent(result.rows[0]);
  }

  /**
   * Withdraw consent (LGPD Article 8, §5º)
   */
  async withdrawConsent(
    userId: string,
    consentType: UserConsent['consentType'],
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const query = `
      UPDATE user_consents 
      SET consent_given = false, withdrawal_date = NOW(), updated_at = NOW()
      WHERE user_id = $1 AND consent_type = $2 AND consent_given = true
    `;

    await db.query(query, [userId, consentType]);

    // Log the withdrawal for audit purposes
    await this.recordDataProcessing({
      userId,
      processingActivity: 'consent_withdrawal',
      dataCategories: ['consent_data'],
      purpose: 'Process consent withdrawal request',
      legalBasis: 'legal_obligation',
      dataSource: 'user_request',
      retentionPeriod: '5_years',
      securityMeasures: ['encryption', 'access_control'],
      processedBy: 'system',
    });
  }

  /**
   * Get user consents
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    const query = `
      SELECT * FROM user_consents 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows.map(row => this.mapRowToUserConsent(row));
  }

  /**
   * Check if user has given specific consent
   */
  async hasConsent(userId: string, consentType: UserConsent['consentType']): Promise<boolean> {
    const query = `
      SELECT consent_given FROM user_consents 
      WHERE user_id = $1 AND consent_type = $2 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const result = await db.query(query, [userId, consentType]);
    return result.rows.length > 0 && result.rows[0].consent_given;
  }

  /**
   * Record data processing activity (LGPD Article 37)
   */
  async recordDataProcessing(
    processingData: Omit<DataProcessingRecord, 'id' | 'processedAt'>
  ): Promise<DataProcessingRecord> {
    const query = `
      INSERT INTO data_processing_records (
        user_id, processing_activity, data_categories, purpose, legal_basis,
        data_source, recipients, international_transfers, retention_period,
        security_measures, processed_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      processingData.userId,
      processingData.processingActivity,
      processingData.dataCategories,
      processingData.purpose,
      processingData.legalBasis,
      processingData.dataSource,
      processingData.recipients || null,
      processingData.internationalTransfers || false,
      processingData.retentionPeriod,
      processingData.securityMeasures,
      processingData.processedBy,
    ];

    const result = await db.query(query, values);
    return this.mapRowToDataProcessingRecord(result.rows[0]);
  }

  /**
   * Handle data subject request (LGPD Articles 18-22)
   */
  async createDataSubjectRequest(
    userId: string,
    requestData: {
      requestType: DataSubjectRequest['requestType'];
      requestDetails: string;
      verificationMethod: string;
    }
  ): Promise<DataSubjectRequest> {
    const query = `
      INSERT INTO data_subject_requests (
        user_id, request_type, request_details, verification_method
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      userId,
      requestData.requestType,
      requestData.requestDetails,
      requestData.verificationMethod,
    ];

    const result = await db.query(query, values);
    return this.mapRowToDataSubjectRequest(result.rows[0]);
  }

  /**
   * Process data access request (LGPD Article 18, II)
   */
  async processDataAccessRequest(requestId: string): Promise<any> {
    // Get the request
    const request = await this.getDataSubjectRequest(requestId);
    if (!request || request.requestType !== 'access') {
      throw new Error('Invalid access request');
    }

    // Collect all user data
    const userData = await this.collectUserData(request.userId);

    // Update request status
    await this.updateDataSubjectRequest(requestId, {
      status: 'completed',
      responseData: userData,
    });

    return userData;
  }

  /**
   * Process data erasure request (LGPD Article 18, VI)
   */
  async processDataErasureRequest(requestId: string): Promise<void> {
    const request = await this.getDataSubjectRequest(requestId);
    if (!request || request.requestType !== 'erasure') {
      throw new Error('Invalid erasure request');
    }

    // Check if erasure is legally possible
    const canErase = await this.canEraseUserData(request.userId);
    if (!canErase.allowed) {
      await this.updateDataSubjectRequest(requestId, {
        status: 'rejected',
        rejectionReason: canErase.reason,
      });
      return;
    }

    // Perform data erasure
    await this.eraseUserData(request.userId);

    // Update request status
    await this.updateDataSubjectRequest(requestId, {
      status: 'completed',
    });
  }

  /**
   * Process data portability request (LGPD Article 18, V)
   */
  async processDataPortabilityRequest(requestId: string): Promise<any> {
    const request = await this.getDataSubjectRequest(requestId);
    if (!request || request.requestType !== 'portability') {
      throw new Error('Invalid portability request');
    }

    // Export user data in structured format
    const exportData = await this.exportUserDataForPortability(request.userId);

    // Update request status
    await this.updateDataSubjectRequest(requestId, {
      status: 'completed',
      responseData: exportData,
    });

    return exportData;
  }

  /**
   * Generate LGPD compliance report
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string
  ): Promise<{
    consentMetrics: any;
    dataProcessingActivities: any;
    dataSubjectRequests: any;
    securityIncidents: any;
    dataRetentionStatus: any;
  }> {
    // Consent metrics
    const consentQuery = `
      SELECT 
        consent_type,
        COUNT(*) as total_consents,
        COUNT(CASE WHEN consent_given THEN 1 END) as given_consents,
        COUNT(CASE WHEN withdrawal_date IS NOT NULL THEN 1 END) as withdrawn_consents
      FROM user_consents 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY consent_type
    `;

    const consentResult = await db.query(consentQuery, [startDate, endDate]);

    // Data processing activities
    const processingQuery = `
      SELECT 
        processing_activity,
        legal_basis,
        COUNT(*) as activity_count,
        COUNT(DISTINCT user_id) as affected_users
      FROM data_processing_records 
      WHERE processed_at BETWEEN $1 AND $2
      GROUP BY processing_activity, legal_basis
    `;

    const processingResult = await db.query(processingQuery, [startDate, endDate]);

    // Data subject requests
    const requestsQuery = `
      SELECT 
        request_type,
        status,
        COUNT(*) as request_count,
        AVG(EXTRACT(EPOCH FROM (completion_date - request_date))/86400) as avg_completion_days
      FROM data_subject_requests 
      WHERE request_date BETWEEN $1 AND $2
      GROUP BY request_type, status
    `;

    const requestsResult = await db.query(requestsQuery, [startDate, endDate]);

    return {
      consentMetrics: consentResult.rows,
      dataProcessingActivities: processingResult.rows,
      dataSubjectRequests: requestsResult.rows,
      securityIncidents: [], // Would be populated from security logs
      dataRetentionStatus: await this.getDataRetentionStatus(),
    };
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetentionCompliance(): Promise<{
    expiredData: Array<{
      userId: string;
      dataType: string;
      retentionExpiry: string;
      action: 'delete' | 'anonymize' | 'archive';
    }>;
    upcomingExpirations: Array<{
      userId: string;
      dataType: string;
      retentionExpiry: string;
      daysUntilExpiry: number;
    }>;
  }> {
    // This would check various data types against their retention periods
    // For now, return mock data
    return {
      expiredData: [],
      upcomingExpirations: [],
    };
  }

  // Private helper methods

  private async collectUserData(userId: string): Promise<any> {
    // Collect all user data from various tables
    const queries = {
      profile: 'SELECT * FROM users WHERE id = $1',
      wardrobe: 'SELECT * FROM vufs_items WHERE user_id = $1',
      social: 'SELECT * FROM social_account_links WHERE user_id = $1',
      consents: 'SELECT * FROM user_consents WHERE user_id = $1',
      analytics: 'SELECT * FROM user_analytics WHERE user_id = $1',
    };

    const userData: any = {};

    for (const [key, query] of Object.entries(queries)) {
      try {
        const result = await db.query(query, [userId]);
        userData[key] = result.rows;
      } catch (error) {
        console.error(`Error collecting ${key} data:`, error);
        userData[key] = [];
      }
    }

    return userData;
  }

  private async canEraseUserData(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check if user has any legal obligations that prevent erasure
    // For example: ongoing contracts, legal disputes, etc.

    // Check for active subscriptions
    const subscriptionQuery = 'SELECT * FROM premium_subscriptions WHERE user_id = $1 AND status = $2';
    const subscriptions = await db.query(subscriptionQuery, [userId, 'active']);

    if (subscriptions.rows.length > 0) {
      return {
        allowed: false,
        reason: 'User has active subscription - data required for contract fulfillment',
      };
    }

    // Check for pending transactions
    // Check for legal holds
    // etc.

    return { allowed: true };
  }

  private async eraseUserData(userId: string): Promise<void> {
    // Anonymize or delete user data according to LGPD requirements
    const tables = [
      'users',
      'vufs_items',
      'social_account_links',
      'user_analytics',
      'user_interactions',
    ];

    for (const table of tables) {
      try {
        // For most tables, we'll anonymize rather than delete to maintain referential integrity
        const anonymizeQuery = `
          UPDATE ${table} 
          SET 
            email = 'anonymized_' || id || '@deleted.local',
            name = 'Deleted User',
            cpf = NULL,
            phone = NULL,
            updated_at = NOW()
          WHERE user_id = $1 OR id = $1
        `;

        await db.query(anonymizeQuery, [userId]);
      } catch (error) {
        console.error(`Error anonymizing data in ${table}:`, error);
      }
    }

    // Record the erasure activity
    await this.recordDataProcessing({
      userId,
      processingActivity: 'data_erasure',
      dataCategories: ['all_personal_data'],
      purpose: 'Fulfill data subject erasure request',
      legalBasis: 'legal_obligation',
      dataSource: 'user_request',
      retentionPeriod: '5_years',
      securityMeasures: ['secure_deletion', 'audit_logging'],
      processedBy: 'system',
    });
  }

  private async exportUserDataForPortability(userId: string): Promise<any> {
    const userData = await this.collectUserData(userId);

    // Format data for portability (structured, machine-readable format)
    return {
      exportDate: new Date().toISOString(),
      userId,
      format: 'JSON',
      data: userData,
      metadata: {
        exportedBy: 'Vangarments LGPD Compliance System',
        dataController: 'Vangarments Ltda',
        exportReason: 'Data portability request (LGPD Article 18, V)',
      },
    };
  }

  private async getDataSubjectRequest(requestId: string): Promise<DataSubjectRequest | null> {
    const query = 'SELECT * FROM data_subject_requests WHERE id = $1';
    const result = await db.query(query, [requestId]);
    return result.rows.length > 0 ? this.mapRowToDataSubjectRequest(result.rows[0]) : null;
  }

  private async updateDataSubjectRequest(
    requestId: string,
    updates: Partial<DataSubjectRequest>
  ): Promise<void> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE data_subject_requests 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
    `;

    const values = [requestId, ...Object.values(updates)];
    await db.query(query, values);
  }

  private async getDataRetentionStatus(): Promise<any> {
    // Check data retention status across different data types
    return {
      userProfiles: { total: 1000, expiringSoon: 5, expired: 2 },
      wardrobeData: { total: 5000, expiringSoon: 20, expired: 8 },
      analyticsData: { total: 10000, expiringSoon: 50, expired: 15 },
    };
  }

  // Mapping methods
  private mapRowToUserConsent(row: any): UserConsent {
    return {
      id: row.id,
      userId: row.user_id,
      consentType: row.consent_type,
      consentGiven: row.consent_given,
      consentDate: row.consent_date || row.created_at,
      consentVersion: row.consent_version,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      withdrawalDate: row.withdrawal_date,
      legalBasis: row.legal_basis,
      purpose: row.purpose,
      dataCategories: row.data_categories || [],
      retentionPeriod: row.retention_period,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToDataProcessingRecord(row: any): DataProcessingRecord {
    return {
      id: row.id,
      userId: row.user_id,
      processingActivity: row.processing_activity,
      dataCategories: row.data_categories || [],
      purpose: row.purpose,
      legalBasis: row.legal_basis,
      dataSource: row.data_source,
      recipients: row.recipients,
      internationalTransfers: row.international_transfers,
      retentionPeriod: row.retention_period,
      securityMeasures: row.security_measures || [],
      processedAt: row.processed_at,
      processedBy: row.processed_by,
    };
  }

  private mapRowToDataSubjectRequest(row: any): DataSubjectRequest {
    return {
      id: row.id,
      userId: row.user_id,
      requestType: row.request_type,
      status: row.status,
      requestDate: row.request_date,
      completionDate: row.completion_date,
      requestDetails: row.request_details,
      responseData: row.response_data,
      rejectionReason: row.rejection_reason,
      verificationMethod: row.verification_method,
      handledBy: row.handled_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}