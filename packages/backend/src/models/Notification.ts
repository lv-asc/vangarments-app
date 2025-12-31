import { db as pool } from '../database/connection';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
    actorId?: string;
    entityId?: string;
    metadata?: any;
    // Joined fields
    actor?: {
        id: string;
        name: string;
        username: string;
        avatarUrl?: string;
        verificationStatus?: string;
    };
    entity?: {
        id: string;
        name: string;
        logo?: string;
        slug?: string;
    };
}

export interface CreateNotificationData {
    userId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
    actorId?: string;
    entityId?: string;
    metadata?: any;
}

export class NotificationModel {
    /**
     * Create a new notification
     */
    static async create(data: CreateNotificationData): Promise<Notification> {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link, actor_id, entity_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING 
                id, 
                user_id as "userId", 
                type, 
                title, 
                message, 
                link, 
                actor_id as "actorId",
                entity_id as "entityId",
                metadata,
                is_read as "isRead", 
                created_at as "createdAt", 
                read_at as "readAt"`,
            [data.userId, data.type, data.title, data.message, data.link, data.actorId, data.entityId, data.metadata || {}]
        );
        return result.rows[0];
    }

    /**
     * Get user's notifications with pagination
     */
    static async getByUserId(
        userId: string,
        options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
    ): Promise<Notification[]> {
        const { limit = 50, offset = 0, unreadOnly = false } = options;

        let query = `
            SELECT 
                n.id, 
                n.user_id as "userId", 
                n.type, 
                n.title, 
                n.message, 
                n.link, 
                n.actor_id as "actorId",
                n.entity_id as "entityId",
                n.metadata,
                n.is_read as "isRead", 
                n.created_at as "createdAt", 
                n.read_at as "readAt",
                json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'username', u.username,
                    'avatarUrl', u.personal_info->>'avatarUrl',
                    'verificationStatus', CASE WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') THEN 'verified' ELSE u.verification_status END
                ) as actor,
                json_build_object(
                    'id', ba.id,
                    'name', ba.name,
                    'logo', ba.logo,
                    'slug', ba.slug
                ) as entity
            FROM notifications n
            LEFT JOIN users u ON n.actor_id = u.id
            LEFT JOIN brand_accounts ba ON n.entity_id = ba.id
            WHERE n.user_id = $1
        `;

        const params: any[] = [userId];

        if (unreadOnly) {
            query += ` AND is_read = false`;
        }

        query += ` ORDER BY n.created_at DESC LIMIT $2 OFFSET $3`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Post-process to clean up null actor/entity objects from json_build_object
        return result.rows.map(row => {
            if (!row.actor?.id) delete row.actor;
            if (!row.entity?.id) delete row.entity;
            return row;
        });
    }

    /**
     * Get unread notification count for a user
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*) as count 
             FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count, 10);
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [notificationId, userId]
        );
        return result.rowCount ? result.rowCount > 0 : false;
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string): Promise<number> {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = CURRENT_TIMESTAMP 
             WHERE user_id = $1 AND is_read = false
             RETURNING id`,
            [userId]
        );
        return result.rowCount || 0;
    }

    /**
     * Delete a notification
     */
    static async delete(notificationId: string, userId: string): Promise<boolean> {
        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE id = $1 AND user_id = $2`,
            [notificationId, userId]
        );
        return result.rowCount ? result.rowCount > 0 : false;
    }

    /**
     * Delete all read notifications for a user
     */
    static async deleteAllRead(userId: string): Promise<number> {
        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE user_id = $1 AND is_read = true`,
            [userId]
        );
        return result.rowCount || 0;
    }
}
