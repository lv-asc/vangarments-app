import { db } from '../database/connection';
import { slugify } from '../utils/slugify';

export interface Conversation {
    id: string;
    conversationType: 'direct' | 'entity' | 'group';
    entityType?: string;
    entityId?: string;
    name?: string;
    avatarUrl?: string;
    description?: string;
    slug?: string;
    createdBy?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    // Populated fields
    participants?: ConversationParticipant[];
    lastMessage?: Message;
    unreadCount?: number;
}

export interface ConversationParticipant {
    id: string;
    conversationId: string;
    userId: string;
    role: 'admin' | 'member';
    lastReadAt?: Date;
    joinedAt: Date;
    // Populated
    user?: {
        id: string;
        username: string;
        profile: any;
    };
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'image' | 'item_share';
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    // Populated
    sender?: {
        id: string;
        username: string;
        profile: any;
    };
}

export class ConversationModel {
    /**
     * Create a new conversation
     */
    static async create(
        participantIds: string[],
        type: 'direct' | 'entity' | 'group' = 'direct',
        createdBy?: string,
        entityType?: string,
        entityId?: string,
        name?: string
    ): Promise<Conversation> {
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // Create conversation
            const slug = name && type === 'group' ? `${slugify(name)}-${Math.random().toString(36).substring(2, 7)}` : null;
            const convQuery = `
                INSERT INTO conversations (conversation_type, entity_type, entity_id, name, created_by, slug)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const convResult = await client.query(convQuery, [type, entityType || null, entityId || null, name || null, createdBy || null, slug]);
            const conversation = convResult.rows[0];

            // Add participants
            for (const userId of participantIds) {
                const role = userId === createdBy ? 'admin' : 'member';
                await client.query(
                    `INSERT INTO conversation_participants (conversation_id, user_id, role) VALUES ($1, $2, $3)`,
                    [conversation.id, userId, role]
                );
            }

            await client.query('COMMIT');
            return this.mapRowToConversation(conversation);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Find a conversation by ID or Slug
     */
    static async findById(idOrSlug: string): Promise<Conversation | null> {
        const query = `SELECT * FROM conversations WHERE id::text = $1 OR slug = $1`;
        const result = await db.query(query, [idOrSlug]);

        if (result.rows.length === 0) return null;

        const conversation = this.mapRowToConversation(result.rows[0]);
        conversation.participants = await this.getParticipants(conversation.id);

        return conversation;
    }

    /**
     * Find existing direct conversation between two users
     */
    static async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
        const query = `
            SELECT c.* FROM conversations c
            WHERE c.conversation_type = 'direct'
            AND EXISTS (
                SELECT 1 FROM conversation_participants cp1 
                WHERE cp1.conversation_id = c.id AND cp1.user_id = $1
            )
            AND EXISTS (
                SELECT 1 FROM conversation_participants cp2 
                WHERE cp2.conversation_id = c.id AND cp2.user_id = $2
            )
            AND (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = c.id) = 2
            LIMIT 1
        `;

        const result = await db.query(query, [userId1, userId2]);

        if (result.rows.length === 0) return null;

        const conversation = this.mapRowToConversation(result.rows[0]);
        conversation.participants = await this.getParticipants(conversation.id);

        return conversation;
    }

    /**
     * Find existing entity conversation
     */
    static async findEntityConversation(
        userId: string,
        entityType: string,
        entityId: string
    ): Promise<Conversation | null> {
        const query = `
            SELECT c.* FROM conversations c
            WHERE c.conversation_type = 'entity'
            AND c.entity_type = $2
            AND c.entity_id = $3
            AND EXISTS (
                SELECT 1 FROM conversation_participants cp 
                WHERE cp.conversation_id = c.id AND cp.user_id = $1
            )
            LIMIT 1
        `;

        const result = await db.query(query, [userId, entityType, entityId]);

        if (result.rows.length === 0) return null;

        return this.mapRowToConversation(result.rows[0]);
    }

    /**
     * Get all conversations for a user
     */
    static async getUserConversations(
        userId: string,
        limit = 20,
        offset = 0
    ): Promise<{ conversations: Conversation[]; total: number }> {
        const query = `
            SELECT c.*, 
                   COUNT(*) OVER() as total,
                   (
                       SELECT COUNT(*)::int 
                       FROM messages m 
                       WHERE m.conversation_id = c.id 
                       AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
                       AND m.sender_id != $1
                       AND m.deleted_at IS NULL
                   ) as unread_count
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = $1
            ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [userId, limit, offset]);

        const conversations: Conversation[] = [];

        for (const row of result.rows) {
            const conv = this.mapRowToConversation(row);
            conv.unreadCount = parseInt(row.unread_count) || 0;
            conv.participants = await this.getParticipants(conv.id);
            conv.lastMessage = await this.getLastMessage(conv.id);
            conversations.push(conv);
        }

        return {
            conversations,
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
        };
    }

    /**
     * Get participants of a conversation
     */
    static async getParticipants(conversationId: string): Promise<ConversationParticipant[]> {
        const query = `
            SELECT cp.*, u.username, u.profile, u.last_seen_at
            FROM conversation_participants cp
            JOIN users u ON cp.user_id = u.id
            WHERE cp.conversation_id = $1
        `;

        const result = await db.query(query, [conversationId]);

        return result.rows.map(row => ({
            id: row.id,
            conversationId: row.conversation_id,
            userId: row.user_id,
            role: row.role,
            lastReadAt: row.last_read_at,
            joinedAt: row.joined_at,
            user: {
                id: row.user_id,
                username: row.username,
                profile: row.profile,
                lastSeenAt: row.last_seen_at
            },
        }));
    }

    /**
     * Get last message in a conversation
     */
    static async getLastMessage(conversationId: string): Promise<Message | undefined> {
        const query = `
            SELECT m.*, u.username, u.profile
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT 1
        `;

        const result = await db.query(query, [conversationId]);

        if (result.rows.length === 0) return undefined;

        return this.mapRowToMessage(result.rows[0]);
    }

    /**
     * Mark a conversation as read for a user
     */
    static async markAsRead(conversationId: string, userId: string): Promise<void> {
        const query = `
            UPDATE conversation_participants 
            SET last_read_at = NOW() 
            WHERE conversation_id = $1 AND user_id = $2
        `;
        await db.query(query, [conversationId, userId]);
    }

    /**
     * Update last message timestamp
     */
    static async updateLastMessageAt(conversationId: string): Promise<void> {
        const query = `
            UPDATE conversations 
            SET last_message_at = NOW(), updated_at = NOW() 
            WHERE id = $1
        `;
        await db.query(query, [conversationId]);
    }

    /**
     * Update a conversation's details
     */
    static async update(id: string, updates: { name?: string; avatarUrl?: string; description?: string }): Promise<Conversation | null> {
        const current = await this.findById(id);
        if (!current) return null;

        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (updates.name !== undefined) {
            fields.push(`name = $${index++}`);
            values.push(updates.name);

            // Generate slug if name changed OR if slug doesn't exist yet
            if (current.conversationType === 'group' && (updates.name !== current.name || !current.slug)) {
                const newSlug = `${slugify(updates.name)}-${Math.random().toString(36).substring(2, 7)}`;
                fields.push(`slug = $${index++}`);
                values.push(newSlug);
            }
        } else if (current.conversationType === 'group' && !current.slug && current.name) {
            // Generate slug if it doesn't exist and we have a name
            const newSlug = `${slugify(current.name)}-${Math.random().toString(36).substring(2, 7)}`;
            fields.push(`slug = $${index++}`);
            values.push(newSlug);
        }
        if (updates.avatarUrl !== undefined) {
            fields.push(`avatar_url = $${index++}`);
            values.push(updates.avatarUrl);
        }
        if (updates.description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(updates.description);
        }

        if (fields.length === 0) return this.findById(id);

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `
            UPDATE conversations 
            SET ${fields.join(', ')} 
            WHERE id = $${index}
            RETURNING *
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) return null;
        return this.mapRowToConversation(result.rows[0]);
    }

    /**
     * Check if user is a participant in conversation
     */
    static async isParticipant(conversationId: string, userId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = $1 AND user_id = $2
        `;
        const result = await db.query(query, [conversationId, userId]);
        return result.rows.length > 0;
    }

    /**
     * Add a participant to a conversation
     */
    static async addParticipant(conversationId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<void> {
        const query = `
            INSERT INTO conversation_participants (conversation_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (conversation_id, user_id) DO NOTHING
        `;
        await db.query(query, [conversationId, userId, role]);
    }

    /**
     * Remove a participant from a conversation
     */
    static async removeParticipant(conversationId: string, userId: string): Promise<void> {
        const query = `DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`;
        await db.query(query, [conversationId, userId]);
    }

    /**
     * Update a participant's role
     */
    static async updateParticipantRole(conversationId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
        const query = `UPDATE conversation_participants SET role = $1 WHERE conversation_id = $2 AND user_id = $3`;
        await db.query(query, [role, conversationId, userId]);
    }

    /**
     * Check if user is an admin of a conversation
     */
    static async isAdmin(conversationId: string, userId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = $1 AND user_id = $2 AND role = 'admin'
        `;
        const result = await db.query(query, [conversationId, userId]);
        return result.rows.length > 0;
    }

    /**
     * Get the oldest participant of a conversation
     */
    static async getOldestMember(conversationId: string): Promise<string | null> {
        const query = `
            SELECT user_id 
            FROM conversation_participants 
            WHERE conversation_id = $1 
            ORDER BY joined_at ASC 
            LIMIT 1
        `;
        const result = await db.query(query, [conversationId]);
        return result.rows.length > 0 ? result.rows[0].user_id : null;
    }

    private static mapRowToConversation(row: any): Conversation {
        return {
            id: row.id,
            conversationType: row.conversation_type,
            entityType: row.entity_type,
            entityId: row.entity_id,
            name: row.name,
            avatarUrl: row.avatar_url,
            description: row.description,
            slug: row.slug,
            createdBy: row.created_by,
            lastMessageAt: row.last_message_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private static mapRowToMessage(row: any): Message {
        return {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            content: row.content,
            messageType: row.message_type,
            metadata: row.metadata,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            sender: row.username ? {
                id: row.sender_id,
                username: row.username,
                profile: row.profile,
            } : undefined,
        };
    }
}
