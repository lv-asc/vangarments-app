import { db } from '../database/connection';

export interface Commission {
  id: string;
  transactionId: string;
  brandId: string;
  storeId?: string; // For store partnerships
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'disputed';
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommissionData {
  transactionId: string;
  brandId: string;
  storeId?: string;
  amount: number;
  commissionRate: number;
  platformFeeRate?: number;
}

export interface UpdateCommissionData {
  status?: 'pending' | 'approved' | 'paid' | 'disputed';
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
}

export interface CommissionFilters {
  brandId?: string;
  storeId?: string;
  status?: 'pending' | 'approved' | 'paid' | 'disputed';
  dateRange?: {
    start: string;
    end: string;
  };
}

export class CommissionTrackingModel {
  static async create(commissionData: CreateCommissionData): Promise<Commission> {
    const {
      transactionId,
      brandId,
      storeId,
      amount,
      commissionRate,
      platformFeeRate = 0.05, // 5% platform fee
    } = commissionData;

    // Calculate commission amounts
    const commissionAmount = amount * commissionRate;
    const platformFee = commissionAmount * platformFeeRate;
    const netAmount = commissionAmount - platformFee;

    const query = `
      INSERT INTO commissions (
        transaction_id, brand_id, store_id, amount, commission_rate,
        commission_amount, platform_fee, net_amount, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      transactionId,
      brandId,
      storeId || null,
      amount,
      commissionRate,
      commissionAmount,
      platformFee,
      netAmount,
      'pending',
    ];

    const result = await db.query(query, values);
    return this.mapRowToCommission(result.rows[0]);
  }

  static async findById(id: string): Promise<Commission | null> {
    const query = `
      SELECT c.*, 
             ba.brand_info,
             mt.status as transaction_status
      FROM commissions c
      LEFT JOIN brand_accounts ba ON c.brand_id = ba.id
      LEFT JOIN marketplace_transactions mt ON c.transaction_id = mt.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToCommission(result.rows[0]) : null;
  }

  static async findByTransactionId(transactionId: string): Promise<Commission[]> {
    const query = `
      SELECT c.*, 
             ba.brand_info,
             mt.status as transaction_status
      FROM commissions c
      LEFT JOIN brand_accounts ba ON c.brand_id = ba.id
      LEFT JOIN marketplace_transactions mt ON c.transaction_id = mt.id
      WHERE c.transaction_id = $1
    `;

    const result = await db.query(query, [transactionId]);
    return result.rows.map(row => this.mapRowToCommission(row));
  }

  static async findMany(
    filters: CommissionFilters = {},
    limit = 20,
    offset = 0
  ): Promise<{ commissions: Commission[]; total: number }> {
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.brandId) {
      whereConditions.push(`c.brand_id = $${paramIndex++}`);
      values.push(filters.brandId);
    }

    if (filters.storeId) {
      whereConditions.push(`c.store_id = $${paramIndex++}`);
      values.push(filters.storeId);
    }

    if (filters.status) {
      whereConditions.push(`c.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    if (filters.dateRange) {
      whereConditions.push(`c.created_at >= $${paramIndex++} AND c.created_at <= $${paramIndex++}`);
      values.push(filters.dateRange.start, filters.dateRange.end);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT c.*, 
             ba.brand_info,
             mt.status as transaction_status,
             COUNT(*) OVER() as total
      FROM commissions c
      LEFT JOIN brand_accounts ba ON c.brand_id = ba.id
      LEFT JOIN marketplace_transactions mt ON c.transaction_id = mt.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await db.query(query, values);
    
    return {
      commissions: result.rows.map(row => this.mapRowToCommission(row)),
      total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
    };
  }

  static async update(id: string, updateData: UpdateCommissionData): Promise<Commission | null> {
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.status) {
      setClause.push(`status = $${paramIndex++}`);
      values.push(updateData.status);
    }

    if (updateData.paymentMethod) {
      setClause.push(`payment_method = $${paramIndex++}`);
      values.push(updateData.paymentMethod);
    }

    if (updateData.paymentDate) {
      setClause.push(`payment_date = $${paramIndex++}`);
      values.push(updateData.paymentDate);
    }

    if (updateData.notes !== undefined) {
      setClause.push(`notes = $${paramIndex++}`);
      values.push(updateData.notes);
    }

    if (setClause.length === 0) {
      throw new Error('No fields to update');
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE commissions 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows.length > 0 ? this.mapRowToCommission(result.rows[0]) : null;
  }

  static async getCommissionSummary(
    brandId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    totalCommissions: number;
    totalPaid: number;
    totalPending: number;
    averageCommissionRate: number;
    transactionCount: number;
    periodBreakdown: Array<{
      period: string;
      commissions: number;
      transactions: number;
    }>;
  }> {
    // Get overall summary
    const summaryQuery = `
      SELECT 
        COUNT(*)::int as transaction_count,
        COALESCE(SUM(commission_amount), 0)::decimal as total_commissions,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0)::decimal as total_paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0)::decimal as total_pending,
        COALESCE(AVG(commission_rate), 0)::decimal as avg_commission_rate
      FROM commissions 
      WHERE brand_id = $1
    `;

    const summaryResult = await db.query(summaryQuery, [brandId]);
    const summary = summaryResult.rows[0];

    // Get period breakdown
    let dateFormat: string;
    switch (period) {
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'quarter':
        dateFormat = 'YYYY-Q';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    const periodQuery = `
      SELECT 
        TO_CHAR(created_at, $2) as period,
        COALESCE(SUM(commission_amount), 0)::decimal as commissions,
        COUNT(*)::int as transactions
      FROM commissions 
      WHERE brand_id = $1
        AND created_at >= NOW() - INTERVAL '1 year'
      GROUP BY TO_CHAR(created_at, $2)
      ORDER BY period DESC
      LIMIT 12
    `;

    const periodResult = await db.query(periodQuery, [brandId, dateFormat]);

    return {
      totalCommissions: parseFloat(summary.total_commissions),
      totalPaid: parseFloat(summary.total_paid),
      totalPending: parseFloat(summary.total_pending),
      averageCommissionRate: parseFloat(summary.avg_commission_rate),
      transactionCount: summary.transaction_count,
      periodBreakdown: periodResult.rows.map(row => ({
        period: row.period,
        commissions: parseFloat(row.commissions),
        transactions: row.transactions,
      })),
    };
  }

  static async processPayment(commissionIds: string[], paymentMethod: string): Promise<void> {
    if (commissionIds.length === 0) return;

    const query = `
      UPDATE commissions 
      SET status = 'paid',
          payment_method = $1,
          payment_date = NOW(),
          updated_at = NOW()
      WHERE id = ANY($2) AND status = 'approved'
    `;

    await db.query(query, [paymentMethod, commissionIds]);
  }

  static async bulkApprove(commissionIds: string[]): Promise<void> {
    if (commissionIds.length === 0) return;

    const query = `
      UPDATE commissions 
      SET status = 'approved',
          updated_at = NOW()
      WHERE id = ANY($1) AND status = 'pending'
    `;

    await db.query(query, [commissionIds]);
  }

  private static mapRowToCommission(row: any): Commission {
    return {
      id: row.id,
      transactionId: row.transaction_id,
      brandId: row.brand_id,
      storeId: row.store_id,
      amount: parseFloat(row.amount),
      commissionRate: parseFloat(row.commission_rate),
      commissionAmount: parseFloat(row.commission_amount),
      platformFee: parseFloat(row.platform_fee),
      netAmount: parseFloat(row.net_amount),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentDate: row.payment_date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}