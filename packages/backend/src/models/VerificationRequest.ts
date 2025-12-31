import { db } from '../database/connection';

export interface VerificationRequest {
    id: string;
    userId?: string;
    entityId?: string;
    requestType: 'user' | 'entity';
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    supportingDocuments?: string[];
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVerificationRequestData {
    userId?: string;
    entityId?: string;
    requestType: 'user' | 'entity';
    reason?: string;
    supportingDocuments?: string[];
}

export interface UpdateVerificationRequestData {
    status?: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewNotes?: string;
}

export class VerificationRequestModel {
    /**
     * Create a new verification request
     */
    static async create(data: CreateVerificationRequestData): Promise<VerificationRequest> {
        const { userId, entityId, requestType, reason, supportingDocuments = [] } = data;

        // Validate that either userId or entityId is provided, but not both
        if ((userId && entityId) || (!userId && !entityId)) {
            throw new Error('Either userId or entityId must be provided, but not both');
        }

        const query = `
      INSERT INTO verification_requests (user_id, entity_id, request_type, reason, supporting_documents)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [
            userId || null,
            entityId || null,
            requestType,
            reason || null,
            JSON.stringify(supportingDocuments)
        ];

        const result = await db.query(query, values);
        return this.mapRowToVerificationRequest(result.rows[0]);
    }

    /**
     * Find verification request by ID
     */
    static async findById(id: string): Promise<VerificationRequest | null> {
        const query = 'SELECT * FROM verification_requests WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows.length > 0 ? this.mapRowToVerificationRequest(result.rows[0]) : null;
    }

    /**
     * Find all verification requests with filters
     */
    static async findMany(filters: {
        status?: 'pending' | 'approved' | 'rejected';
        requestType?: 'user' | 'entity';
        userId?: string;
        entityId?: string;
    } = {}, limit = 50, offset = 0): Promise<{ requests: VerificationRequest[]; total: number }> {
        const whereConditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (filters.status) {
            whereConditions.push(`status = $${paramIndex++}`);
            values.push(filters.status);
        }

        if (filters.requestType) {
            whereConditions.push(`request_type = $${paramIndex++}`);
            values.push(filters.requestType);
        }

        if (filters.userId) {
            whereConditions.push(`user_id = $${paramIndex++}`);
            values.push(filters.userId);
        }

        if (filters.entityId) {
            whereConditions.push(`entity_id = $${paramIndex++}`);
            values.push(filters.entityId);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
      SELECT *, COUNT(*) OVER() as total
      FROM verification_requests
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

        values.push(limit, offset);

        const result = await db.query(query, values);

        return {
            requests: result.rows.map(row => this.mapRowToVerificationRequest(row)),
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0
        };
    }

    /**
     * Update verification request
     */
    static async update(id: string, updateData: UpdateVerificationRequestData): Promise<VerificationRequest | null> {
        const setClause: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updateData.status !== undefined) {
            setClause.push(`status = $${paramIndex++}`);
            values.push(updateData.status);
        }

        if (updateData.reviewedBy !== undefined) {
            setClause.push(`reviewed_by = $${paramIndex++}`);
            values.push(updateData.reviewedBy);
            setClause.push(`reviewed_at = NOW()`);
        }

        if (updateData.reviewNotes !== undefined) {
            setClause.push(`review_notes = $${paramIndex++}`);
            values.push(updateData.reviewNotes);
        }

        if (setClause.length === 0) {
            throw new Error('No fields to update');
        }

        setClause.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
      UPDATE verification_requests
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await db.query(query, values);
        return result.rows.length > 0 ? this.mapRowToVerificationRequest(result.rows[0]) : null;
    }

    /**
     * Delete verification request
     */
    static async delete(id: string): Promise<boolean> {
        const query = 'DELETE FROM verification_requests WHERE id = $1';
        const result = await db.query(query, [id]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Check if user/entity has pending request
     */
    static async hasPendingRequest(userId?: string, entityId?: string): Promise<boolean> {
        const query = userId
            ? 'SELECT id FROM verification_requests WHERE user_id = $1 AND status = $2'
            : 'SELECT id FROM verification_requests WHERE entity_id = $1 AND status = $2';

        const result = await db.query(query, [userId || entityId, 'pending']);
        return result.rows.length > 0;
    }

    /**
     * Map database row to VerificationRequest object
     */
    private static mapRowToVerificationRequest(row: any): VerificationRequest {
        return {
            id: row.id,
            userId: row.user_id,
            entityId: row.entity_id,
            requestType: row.request_type,
            status: row.status,
            reason: row.reason,
            supportingDocuments: row.supporting_documents || [],
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
            reviewNotes: row.review_notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
