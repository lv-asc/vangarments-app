import { db } from '../database/connection';
import { ConversationModel } from './Conversation';

export interface MessageReaction {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    createdAt: Date;
    user?: {
        id: string;
        username: string;
        profile: any;
    };
}
export interface MessageAttachment {
    id: string;
    messageId: string;
    attachmentType: 'image' | 'video' | 'audio' | 'file';
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnailUrl?: string;
    createdAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'image' | 'item_share' | 'voice' | 'file';
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;
    deletedAt?: Date;
    sender?: {
        id: string;
        username: string;
        profile: any;
    };
    reactions?: MessageReaction[];
    attachments?: MessageAttachment[];
    mentions?: MessageMention[];
}
export interface MessageMention {
    id: string;
    messageId: string;
    mentionType: 'user' | 'item' | 'brand' | 'store' | 'supplier' | 'page' | 'article';
    mentionId: string;
    mentionText?: string;
    createdAt: Date;
}

export interface CreateAttachmentData {
    attachmentType: 'image' | 'video' | 'audio' | 'file';
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnailUrl?: string;
}

export interface CreateMentionData {
    mentionType: 'user' | 'item' | 'brand' | 'store' | 'supplier' | 'page' | 'article';
    mentionId: string;
    mentionText?: string;
}

export interface CreateMessageData {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: 'text' | 'image' | 'item_share' | 'voice' | 'file';
    metadata?: any;
    attachments?: CreateAttachmentData[];
    mentions?: CreateMentionData[];
}

const EDIT_WINDOW_MINUTES = 15;

export class MessageModel {
    /**
     * Create a new message
     */
    static async create(data: CreateMessageData): Promise<Message> {
        const { conversationId, senderId, content, messageType = 'text', metadata, attachments, mentions } = data;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const messageQuery = `
                INSERT INTO messages (conversation_id, sender_id, content, message_type, metadata)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const result = await client.query(messageQuery, [
                conversationId,
                senderId,
                content,
                messageType,
                metadata ? JSON.stringify(metadata) : null,
            ]);

            const messageRow = result.rows[0];
            const messageId = messageRow.id;

            // Insert attachments if any
            const insertedAttachments: MessageAttachment[] = [];
            if (attachments && attachments.length > 0) {
                for (const att of attachments) {
                    const attQuery = `
                        INSERT INTO message_attachments 
                        (message_id, attachment_type, file_url, file_name, file_size, mime_type, duration, thumbnail_url)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `;
                    const attResult = await client.query(attQuery, [
                        messageId,
                        att.attachmentType,
                        att.fileUrl,
                        att.fileName,
                        att.fileSize,
                        att.mimeType,
                        att.duration,
                        att.thumbnailUrl,
                    ]);
                    insertedAttachments.push(this.mapRowToAttachment(attResult.rows[0]));
                }
            }

            // Insert mentions if any
            const insertedMentions: MessageMention[] = [];
            if (mentions && mentions.length > 0) {
                for (const m of mentions) {
                    const mQuery = `
                        INSERT INTO message_mentions (message_id, mention_type, mention_id, mention_text)
                        VALUES ($1, $2, $3, $4)
                        RETURNING *
                    `;
                    const mResult = await client.query(mQuery, [
                        messageId,
                        m.mentionType,
                        m.mentionId,
                        m.mentionText,
                    ]);
                    insertedMentions.push(this.mapRowToMention(mResult.rows[0]));
                }
            }

            await client.query('COMMIT');

            // Update conversation's last_message_at
            await ConversationModel.updateLastMessageAt(conversationId);

            // Get sender info (not in transaction to avoid bloat)
            const userQuery = `SELECT username, profile FROM users WHERE id = $1`;
            const userResult = await db.query(userQuery, [senderId]);

            const message = this.mapRowToMessage(messageRow);
            if (userResult.rows.length > 0) {
                message.sender = {
                    id: senderId,
                    username: userResult.rows[0].username,
                    profile: userResult.rows[0].profile,
                };
            }
            message.attachments = insertedAttachments;
            message.mentions = insertedMentions;

            return message;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Edit a message (only within 15 minutes)
     */
    static async edit(id: string, userId: string, newContent: string): Promise<Message | null> {
        // First check if the message can be edited
        const checkQuery = `
            SELECT * FROM messages 
            WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
            AND created_at > NOW() - INTERVAL '${EDIT_WINDOW_MINUTES} minutes'
        `;
        const checkResult = await db.query(checkQuery, [id, userId]);

        if (checkResult.rows.length === 0) {
            return null; // Message not found, not owner, or too old
        }

        const updateQuery = `
            UPDATE messages 
            SET content = $1, edited_at = NOW(), updated_at = NOW()
            WHERE id = $2 AND sender_id = $3
            RETURNING *
        `;
        const result = await db.query(updateQuery, [newContent, id, userId]);

        if (result.rows.length === 0) return null;
        return this.mapRowToMessage(result.rows[0]);
    }

    /**
     * Delete a message (only within 15 minutes for regular delete)
     */
    static async timedDelete(id: string, userId: string): Promise<boolean> {
        // Only allow delete within 15 minutes
        const query = `
            UPDATE messages 
            SET deleted_at = NOW(), updated_at = NOW() 
            WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
            AND created_at > NOW() - INTERVAL '${EDIT_WINDOW_MINUTES} minutes'
        `;
        const result = await db.query(query, [id, userId]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Get messages for a conversation (paginated) with reactions, attachments, and mentions
     */
    static async getByConversation(
        conversationId: string,
        limit = 50,
        offset = 0
    ): Promise<{ messages: Message[]; total: number }> {
        const query = `
            SELECT m.*, u.username, u.profile,
                   COUNT(*) OVER() as total
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await db.query(query, [conversationId, limit, offset]);
        const messages = result.rows.map(row => this.mapRowToMessage(row)).reverse();

        if (messages.length > 0) {
            const messageIds = messages.map(m => m.id);

            // Load reactions
            const reactionsQuery = `
                SELECT mr.*, u.username, u.profile
                FROM message_reactions mr
                JOIN users u ON mr.user_id = u.id
                WHERE mr.message_id = ANY($1)
            `;
            const reactionsResult = await db.query(reactionsQuery, [messageIds]);

            const reactionsMap = new Map<string, MessageReaction[]>();
            for (const row of reactionsResult.rows) {
                const reactions = reactionsMap.get(row.message_id) || [];
                reactions.push({
                    id: row.id,
                    messageId: row.message_id,
                    userId: row.user_id,
                    emoji: row.emoji,
                    createdAt: row.created_at,
                    user: { id: row.user_id, username: row.username, profile: row.profile },
                });
                reactionsMap.set(row.message_id, reactions);
            }

            // Load attachments
            const attachmentsQuery = `
                SELECT * FROM message_attachments
                WHERE message_id = ANY($1)
            `;
            const attachmentsResult = await db.query(attachmentsQuery, [messageIds]);

            const attachmentsMap = new Map<string, MessageAttachment[]>();
            for (const row of attachmentsResult.rows) {
                const attachments = attachmentsMap.get(row.message_id) || [];
                attachments.push(this.mapRowToAttachment(row));
                attachmentsMap.set(row.message_id, attachments);
            }

            // Load mentions
            const mentionsQuery = `
                SELECT * FROM message_mentions
                WHERE message_id = ANY($1)
            `;
            const mentionsResult = await db.query(mentionsQuery, [messageIds]);

            const mentionsMap = new Map<string, MessageMention[]>();
            for (const row of mentionsResult.rows) {
                const mentions = mentionsMap.get(row.message_id) || [];
                mentions.push(this.mapRowToMention(row));
                mentionsMap.set(row.message_id, mentions);
            }

            for (const msg of messages) {
                msg.reactions = reactionsMap.get(msg.id) || [];
                msg.attachments = attachmentsMap.get(msg.id) || [];
                msg.mentions = mentionsMap.get(msg.id) || [];
            }
        }

        return {
            messages,
            total: result.rows.length > 0 ? parseInt(result.rows[0].total) : 0,
        };
    }

    /**
     * Get a single message by ID
     */
    static async findById(id: string): Promise<Message | null> {
        const query = `
            SELECT m.*, u.username, u.profile
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = $1 AND m.deleted_at IS NULL
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) return null;

        const message = this.mapRowToMessage(result.rows[0]);

        // Load reactions, attachments, mentions
        message.reactions = await this.getReactions(id);

        const attachmentsResult = await db.query(`SELECT * FROM message_attachments WHERE message_id = $1`, [id]);
        message.attachments = attachmentsResult.rows.map(row => this.mapRowToAttachment(row));

        const mentionsResult = await db.query(`SELECT * FROM message_mentions WHERE message_id = $1`, [id]);
        message.mentions = mentionsResult.rows.map(row => this.mapRowToMention(row));

        return message;
    }

    /**
     * Soft delete a message (admin or no time limit)
     */
    static async softDelete(id: string, userId: string): Promise<boolean> {
        const query = `
            UPDATE messages 
            SET deleted_at = NOW(), updated_at = NOW() 
            WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [id, userId]);
        return (result.rowCount || 0) > 0;
    }

    // ============== Reactions ==============

    /**
     * Add a reaction to a message
     */
    static async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
        const query = `
            INSERT INTO message_reactions (message_id, user_id, emoji)
            VALUES ($1, $2, $3)
            ON CONFLICT (message_id, user_id, emoji) DO NOTHING
            RETURNING *
        `;
        const result = await db.query(query, [messageId, userId, emoji]);

        if (result.rows.length === 0) {
            // Reaction already exists, fetch it
            const existing = await db.query(
                `SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
                [messageId, userId, emoji]
            );
            return this.mapRowToReaction(existing.rows[0]);
        }

        return this.mapRowToReaction(result.rows[0]);
    }

    /**
     * Remove a reaction from a message
     */
    static async removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
        const query = `
            DELETE FROM message_reactions 
            WHERE message_id = $1 AND user_id = $2 AND emoji = $3
        `;
        const result = await db.query(query, [messageId, userId, emoji]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Get all reactions for a message
     */
    static async getReactions(messageId: string): Promise<MessageReaction[]> {
        const query = `
            SELECT mr.*, u.username, u.profile
            FROM message_reactions mr
            JOIN users u ON mr.user_id = u.id
            WHERE mr.message_id = $1
            ORDER BY mr.created_at
        `;
        const result = await db.query(query, [messageId]);
        return result.rows.map(row => ({
            id: row.id,
            messageId: row.message_id,
            userId: row.user_id,
            emoji: row.emoji,
            createdAt: row.created_at,
            user: { id: row.user_id, username: row.username, profile: row.profile },
        }));
    }

    /**
     * Get unread message count for a user across all conversations
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const query = `
            SELECT COUNT(*)::int as count
            FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
            WHERE cp.user_id = $1 
            AND m.sender_id != $1
            AND m.deleted_at IS NULL
            AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0].count;
    }

    /**
     * Get unread message count for a specific conversation
     */
    static async getUnreadCountForConversation(conversationId: string, userId: string): Promise<number> {
        const query = `
            SELECT COUNT(*)::int as count
            FROM messages m
            JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id AND cp.user_id = $2
            WHERE m.conversation_id = $1 
            AND m.sender_id != $2
            AND m.deleted_at IS NULL
            AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')
        `;
        const result = await db.query(query, [conversationId, userId]);
        return result.rows[0].count;
    }

    /**
     * Check if message can be edited/deleted (within 15 min)
     */
    static async canEdit(id: string, userId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM messages 
            WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL
            AND created_at > NOW() - INTERVAL '${EDIT_WINDOW_MINUTES} minutes'
        `;
        const result = await db.query(query, [id, userId]);
        return result.rows.length > 0;
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
            editedAt: row.edited_at,
            deletedAt: row.deleted_at,
            sender: row.username ? {
                id: row.sender_id,
                username: row.username,
                profile: row.profile,
            } : undefined,
        };
    }

    private static mapRowToReaction(row: any): MessageReaction {
        return {
            id: row.id,
            messageId: row.message_id,
            userId: row.user_id,
            emoji: row.emoji,
            createdAt: row.created_at,
        };
    }

    private static mapRowToAttachment(row: any): MessageAttachment {
        return {
            id: row.id,
            messageId: row.message_id,
            attachmentType: row.attachment_type,
            fileUrl: row.file_url,
            fileName: row.file_name,
            fileSize: row.file_size,
            mimeType: row.mime_type,
            duration: row.duration,
            thumbnailUrl: row.thumbnail_url,
            createdAt: row.created_at,
        };
    }

    private static mapRowToMention(row: any): MessageMention {
        return {
            id: row.id,
            messageId: row.message_id,
            mentionType: row.mention_type,
            mentionId: row.mention_id,
            mentionText: row.mention_text,
            createdAt: row.created_at,
        };
    }
}
