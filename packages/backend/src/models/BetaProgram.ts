import { db } from '../database/connection';

export interface BetaParticipant {
  id: string;
  userId: string;
  participantType: 'brand' | 'influencer' | 'stylist' | 'model' | 'designer' | 'industry_leader';
  joinedAt: string;
  invitedBy?: string;
  referralCode: string;
  status: 'active' | 'graduated' | 'inactive';
  privileges: {
    earlyAccess: boolean;
    advancedAnalytics: boolean;
    directFeedback: boolean;
    customBadges: boolean;
    prioritySupport: boolean;
  };
  metrics: {
    referralsCount: number;
    feedbackSubmitted: number;
    featuresUsed: string[];
    engagementScore: number;
  };
  graduationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBetaParticipantData {
  userId: string;
  participantType: 'brand' | 'influencer' | 'stylist' | 'model' | 'designer' | 'industry_leader';
  invitedBy?: string;
  customPrivileges?: Partial<BetaParticipant['privileges']>;
}

export interface BetaFeedback {
  id: string;
  participantId: string;
  feedbackType: 'bug_report' | 'feature_request' | 'improvement' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'reviewed' | 'in_progress' | 'completed' | 'rejected';
  attachments?: string[];
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBetaFeedbackData {
  participantId: string;
  feedbackType: 'bug_report' | 'feature_request' | 'improvement' | 'general';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
}

export class BetaProgramModel {
  static async create(participantData: CreateBetaParticipantData): Promise<BetaParticipant> {
    const { userId, participantType, invitedBy, customPrivileges } = participantData;

    // Check if user is already a beta participant
    const existing = await this.findByUserId(userId);
    if (existing) {
      throw new Error('User is already a beta participant');
    }

    // Generate unique referral code
    const referralCode = this.generateReferralCode();

    // Set default privileges based on participant type
    const defaultPrivileges = this.getDefaultPrivileges(participantType);
    const privileges = { ...defaultPrivileges, ...customPrivileges };

    const query = `
      INSERT INTO beta_participants (
        user_id, participant_type, invited_by, referral_code, 
        privileges, metrics
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      userId,
      participantType,
      invitedBy || null,
      referralCode,
      JSON.stringify(privileges),
      JSON.stringify({
        referralsCount: 0,
        feedbackSubmitted: 0,
        featuresUsed: [],
        engagementScore: 0,
      }),
    ];

    const result = await db.query(query, values);
    return this.mapRowToBetaParticipant(result.rows[0]);
  }

  static async findById(id: string): Promise<BetaParticipant | null> {
    const query = `
      SELECT bp.*, 
             u.profile as user_profile,
             inviter.profile as inviter_profile
      FROM beta_participants bp
      LEFT JOIN users u ON bp.user_id = u.id
      LEFT JOIN users inviter ON bp.invited_by = inviter.id
      WHERE bp.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToBetaParticipant(result.rows[0]) : null;
  }

  static async findByUserId(userId: string): Promise<BetaParticipant | null> {
    const query = `
      SELECT bp.*, 
             u.profile as user_profile,
             inviter.profile as inviter_profile
      FROM beta_participants bp
      LEFT JOIN users u ON bp.user_id = u.id
      LEFT JOIN users inviter ON bp.invited_by = inviter.id
      WHERE bp.user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows.length > 0 ? this.mapRowToBetaParticipant(result.rows[0]) : null;
  }

  static async findByReferralCode(referralCode: string): Promise<BetaParticipant | null> {
    const query = `
      SELECT bp.*, 
             u.profile as user_profile
      FROM beta_participants bp
      LEFT JOIN users u ON bp.user_id = u.id
      WHERE bp.referral_code = $1
    `;

    const result = await db.query(query, [referralCode]);
    return result.rows.length > 0 ? this.mapRowToBetaParticipant(result.rows[0]) : null;
  }

  static async findMany(
    filters: {
      participantType?: string;
      status?: 'active' | 'graduated' | 'inactive';
      invitedBy?: string;
    } = {},
    limit = 50,
    offset = 0
  ): Promise<{ participants: BetaParticipant[]; total: number }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (filters.participantType) {
      whereConditions.push(`bp.participant_type = $${paramIndex++}`);
      values.push(filters.participantType);
    }

    if (filters.status) {
      whereConditions.push(`bp.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.invitedBy) {
      whereConditions.push(`bp.invited_by = $${paramIndex++}`);
      values.push(filters.invitedBy);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT bp.*, 
             u.profile as user_profile,
             COUNT(*) OVER() as total
      FROM beta_participants bp
      LEFT JOIN users u ON bp.user_id = u.id
      ${whereClause}
      ORDER BY bp.joined_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    
    return {
      participants: result.rows.map(row => this.mapRowToBetaParticipant(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async updateMetrics(
    participantId: string,
    metrics: Partial<BetaParticipant['metrics']>
  ): Promise<BetaParticipant | null> {
    // Get current metrics
    const current = await this.findById(participantId);
    if (!current) return null;

    const updatedMetrics = {
      ...current.metrics,
      ...metrics,
    };

    const query = `
      UPDATE beta_participants 
      SET metrics = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [JSON.stringify(updatedMetrics), participantId]);
    return result.rows.length > 0 ? this.mapRowToBetaParticipant(result.rows[0]) : null;
  }

  static async graduateParticipant(participantId: string): Promise<BetaParticipant | null> {
    const query = `
      UPDATE beta_participants 
      SET status = 'graduated', graduation_date = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [participantId]);
    return result.rows.length > 0 ? this.mapRowToBetaParticipant(result.rows[0]) : null;
  }

  static async submitFeedback(feedbackData: CreateBetaFeedbackData): Promise<BetaFeedback> {
    const { participantId, feedbackType, title, description, priority = 'medium', attachments } = feedbackData;

    const query = `
      INSERT INTO beta_feedback (
        participant_id, feedback_type, title, description, priority, attachments
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      participantId,
      feedbackType,
      title,
      description,
      priority,
      attachments ? JSON.stringify(attachments) : null,
    ];

    const result = await db.query(query, values);
    
    // Update participant metrics
    const participant = await this.findById(participantId);
    if (participant) {
      await this.updateMetrics(participantId, {
        feedbackSubmitted: participant.metrics.feedbackSubmitted + 1,
      });
    }

    return this.mapRowToBetaFeedback(result.rows[0]);
  }

  static async getFeedback(
    participantId?: string,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<{ feedback: BetaFeedback[]; total: number }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (participantId) {
      whereConditions.push(`bf.participant_id = $${paramIndex++}`);
      values.push(participantId);
    }

    if (status) {
      whereConditions.push(`bf.status = $${paramIndex++}`);
      values.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT bf.*, 
             bp.user_id,
             u.profile as user_profile,
             COUNT(*) OVER() as total
      FROM beta_feedback bf
      LEFT JOIN beta_participants bp ON bf.participant_id = bp.id
      LEFT JOIN users u ON bp.user_id = u.id
      ${whereClause}
      ORDER BY bf.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    
    return {
      feedback: result.rows.map(row => this.mapRowToBetaFeedback(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async respondToFeedback(
    feedbackId: string,
    response: string,
    respondedBy: string,
    status: 'reviewed' | 'in_progress' | 'completed' | 'rejected'
  ): Promise<BetaFeedback | null> {
    const query = `
      UPDATE beta_feedback 
      SET response = $1, responded_by = $2, responded_at = NOW(), status = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(query, [response, respondedBy, status, feedbackId]);
    return result.rows.length > 0 ? this.mapRowToBetaFeedback(result.rows[0]) : null;
  }

  static async getBetaStats(): Promise<{
    totalParticipants: number;
    activeParticipants: number;
    graduatedParticipants: number;
    totalFeedback: number;
    pendingFeedback: number;
    participantsByType: Record<string, number>;
    topReferrers: Array<{ userId: string; referrals: number }>;
  }> {
    const statsQuery = `
      SELECT 
        COUNT(*)::int as total_participants,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_participants,
        COUNT(CASE WHEN status = 'graduated' THEN 1 END)::int as graduated_participants
      FROM beta_participants
    `;

    const feedbackQuery = `
      SELECT 
        COUNT(*)::int as total_feedback,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END)::int as pending_feedback
      FROM beta_feedback
    `;

    const typeQuery = `
      SELECT participant_type, COUNT(*)::int as count
      FROM beta_participants
      GROUP BY participant_type
    `;

    const referrersQuery = `
      SELECT invited_by as user_id, COUNT(*)::int as referrals
      FROM beta_participants
      WHERE invited_by IS NOT NULL
      GROUP BY invited_by
      ORDER BY referrals DESC
      LIMIT 10
    `;

    const [statsResult, feedbackResult, typeResult, referrersResult] = await Promise.all([
      db.query(statsQuery),
      db.query(feedbackQuery),
      db.query(typeQuery),
      db.query(referrersQuery),
    ]);

    const stats = statsResult.rows[0];
    const feedbackStats = feedbackResult.rows[0];
    const participantsByType: Record<string, number> = {};
    
    typeResult.rows.forEach(row => {
      participantsByType[row.participant_type] = row.count;
    });

    return {
      totalParticipants: stats.total_participants,
      activeParticipants: stats.active_participants,
      graduatedParticipants: stats.graduated_participants,
      totalFeedback: feedbackStats.total_feedback,
      pendingFeedback: feedbackStats.pending_feedback,
      participantsByType,
      topReferrers: referrersResult.rows,
    };
  }

  private static generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private static getDefaultPrivileges(participantType: string): BetaParticipant['privileges'] {
    const basePrivileges = {
      earlyAccess: true,
      advancedAnalytics: false,
      directFeedback: true,
      customBadges: false,
      prioritySupport: false,
    };

    switch (participantType) {
      case 'industry_leader':
        return {
          ...basePrivileges,
          advancedAnalytics: true,
          customBadges: true,
          prioritySupport: true,
        };
      case 'brand':
        return {
          ...basePrivileges,
          advancedAnalytics: true,
          prioritySupport: true,
        };
      case 'influencer':
        return {
          ...basePrivileges,
          customBadges: true,
        };
      default:
        return basePrivileges;
    }
  }

  private static mapRowToBetaParticipant(row: any): BetaParticipant {
    return {
      id: row.id,
      userId: row.user_id,
      participantType: row.participant_type,
      joinedAt: row.joined_at,
      invitedBy: row.invited_by,
      referralCode: row.referral_code,
      status: row.status,
      privileges: row.privileges || {},
      metrics: row.metrics || {
        referralsCount: 0,
        feedbackSubmitted: 0,
        featuresUsed: [],
        engagementScore: 0,
      },
      graduationDate: row.graduation_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToBetaFeedback(row: any): BetaFeedback {
    return {
      id: row.id,
      participantId: row.participant_id,
      feedbackType: row.feedback_type,
      title: row.title,
      description: row.description,
      priority: row.priority,
      status: row.status,
      attachments: row.attachments || [],
      response: row.response,
      respondedBy: row.responded_by,
      respondedAt: row.responded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}