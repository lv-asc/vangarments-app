import { db } from '../database/connection';

export interface ContentReport {
  id: string;
  reportedBy: string;
  reportedContentId: string;
  reportedContentType: 'post' | 'comment' | 'user';
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
}

export type ReportReason = 
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'fake_account'
  | 'copyright'
  | 'violence'
  | 'hate_speech'
  | 'nudity'
  | 'misinformation'
  | 'other';

export interface CreateContentReportData {
  reportedBy: string;
  reportedContentId: string;
  reportedContentType: 'post' | 'comment' | 'user';
  reason: ReportReason;
  description?: string;
}

export interface UpdateContentReportData {
  status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  reviewedBy?: string;
  resolution?: string;
}

export class ContentReportModel {
  static async create(reportData: CreateContentReportData): Promise<ContentReport> {
    const { reportedBy, reportedContentId, reportedContentType, reason, description } = reportData;

    // Check if user has already reported this content
    const existingReport = await this.findExisting(reportedBy, reportedContentId, reportedContentType);
    if (existingReport) {
      throw new Error('You have already reported this content');
    }

    // Determine priority based on reason
    const priority = this.determinePriority(reason);

    const query = `
      INSERT INTO content_reports (
        reported_by, reported_content_id, reported_content_type, 
        reason, description, priority, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;

    const values = [
      reportedBy,
      reportedContentId,
      reportedContentType,
      reason,
      description,
      priority,
    ];

    const result = await db.query(query, values);
    return this.mapRowToContentReport(result.rows[0]);
  }

  static async findById(id: string): Promise<ContentReport | null> {
    const query = `
      SELECT cr.*, 
             reporter.profile as reporter_profile,
             reported_user.profile as reported_user_profile
      FROM content_reports cr
      LEFT JOIN users reporter ON cr.reported_by = reporter.id
      LEFT JOIN users reported_user ON (
        cr.reported_content_type = 'user' AND cr.reported_content_id = reported_user.id
      )
      WHERE cr.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToContentReport(result.rows[0]) : null;
  }

  static async findMany(
    filters: {
      status?: string;
      priority?: string;
      reportedContentType?: string;
      reportedBy?: string;
    } = {},
    limit = 20,
    offset = 0
  ): Promise<{ reports: ContentReport[]; total: number }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereConditions.push(`cr.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.priority) {
      whereConditions.push(`cr.priority = $${paramIndex++}`);
      values.push(filters.priority);
    }

    if (filters.reportedContentType) {
      whereConditions.push(`cr.reported_content_type = $${paramIndex++}`);
      values.push(filters.reportedContentType);
    }

    if (filters.reportedBy) {
      whereConditions.push(`cr.reported_by = $${paramIndex++}`);
      values.push(filters.reportedBy);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT cr.*, 
             reporter.profile as reporter_profile,
             reported_user.profile as reported_user_profile
      FROM content_reports cr
      LEFT JOIN users reporter ON cr.reported_by = reporter.id
      LEFT JOIN users reported_user ON (
        cr.reported_content_type = 'user' AND cr.reported_content_id = reported_user.id
      )
      ${whereClause}
      ORDER BY 
        CASE cr.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        cr.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM content_reports cr
      ${whereClause}
    `;

    const [reportsResult, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, values.slice(0, -2)), // Remove limit and offset for count
    ]);

    return {
      reports: reportsResult.rows.map(row => this.mapRowToContentReport(row)),
      total: countResult.rows[0].total,
    };
  }

  static async update(id: string, updateData: UpdateContentReportData): Promise<ContentReport | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.status) {
      setClause.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (updateData.priority) {
      setClause.push(`priority = $${paramIndex++}`);
      values.push(updateData.priority);
    }

    if (updateData.reviewedBy) {
      setClause.push(`reviewed_by = $${paramIndex++}`);
      values.push(updateData.reviewedBy);
      setClause.push(`reviewed_at = NOW()`);
    }

    if (updateData.resolution) {
      setClause.push(`resolution = $${paramIndex++}`);
      values.push(updateData.resolution);
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE content_reports 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToContentReport(result.rows[0]) : null;
  }

  static async findExisting(
    reportedBy: string, 
    reportedContentId: string, 
    reportedContentType: string
  ): Promise<ContentReport | null> {
    const query = `
      SELECT * FROM content_reports 
      WHERE reported_by = $1 
        AND reported_content_id = $2 
        AND reported_content_type = $3
    `;

    const result = await db.query(query, [reportedBy, reportedContentId, reportedContentType]);
    return result.rows.length > 0 ? this.mapRowToContentReport(result.rows[0]) : null;
  }

  static async getStatistics(): Promise<{
    totalReports: number;
    pendingReports: number;
    highPriorityReports: number;
    resolvedToday: number;
  }> {
    const query = `
      SELECT 
        COUNT(*)::int as total_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_reports,
        COUNT(CASE WHEN priority IN ('high', 'urgent') THEN 1 END)::int as high_priority_reports,
        COUNT(CASE WHEN status = 'resolved' AND DATE(reviewed_at) = CURRENT_DATE THEN 1 END)::int as resolved_today
      FROM content_reports
    `;

    const result = await db.query(query);
    const row = result.rows[0];

    return {
      totalReports: row.total_reports,
      pendingReports: row.pending_reports,
      highPriorityReports: row.high_priority_reports,
      resolvedToday: row.resolved_today,
    };
  }

  private static determinePriority(reason: ReportReason): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentReasons: ReportReason[] = ['violence', 'hate_speech', 'harassment'];
    const highReasons: ReportReason[] = ['inappropriate_content', 'nudity'];
    const mediumReasons: ReportReason[] = ['spam', 'fake_account', 'misinformation'];
    
    if (urgentReasons.includes(reason)) return 'urgent';
    if (highReasons.includes(reason)) return 'high';
    if (mediumReasons.includes(reason)) return 'medium';
    return 'low';
  }

  private static mapRowToContentReport(row: any): ContentReport {
    return {
      id: row.id,
      reportedBy: row.reported_by,
      reportedContentId: row.reported_content_id,
      reportedContentType: row.reported_content_type,
      reason: row.reason,
      description: row.description,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
      resolution: row.resolution,
    };
  }
}