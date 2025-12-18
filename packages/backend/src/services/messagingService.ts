import { ConversationModel, Conversation, ConversationParticipant } from '../models/Conversation';
import { MessageModel, Message } from '../models/Message';
import { UserModel } from '../models/User';
import { BrandAccountModel } from '../models/BrandAccount';
import { StoreModel } from '../models/Store';
import { SupplierModel } from '../models/Supplier';
import { PageModel } from '../models/Page';

export type EntityType = 'brand' | 'store' | 'supplier' | 'page';

interface StartConversationOptions {
    senderId: string;
    recipientId?: string;        // For direct user-to-user
    entityType?: EntityType;     // For entity messaging
    entityId?: string;           // For entity messaging
}

interface ConversationWithDetails extends Conversation {
    otherParticipant?: {
        id: string;
        username: string;
        profile: any;
    };
    entity?: any;
}

export class MessagingService {
    /**
     * Start or get existing conversation
     */
    async startConversation(options: StartConversationOptions): Promise<Conversation> {
        const { senderId, recipientId, entityType, entityId } = options;

        // Case 1: Direct user-to-user conversation
        if (recipientId) {
            // Check if recipient exists
            const recipient = await UserModel.findById(recipientId);
            if (!recipient) {
                throw new Error('Recipient user not found');
            }

            if (senderId === recipientId) {
                throw new Error('Cannot start conversation with yourself');
            }

            // Check if conversation already exists
            const existing = await ConversationModel.findDirectConversation(senderId, recipientId);
            if (existing) {
                return existing;
            }

            // Create new direct conversation
            return ConversationModel.create([senderId, recipientId], 'direct');
        }

        // Case 2: Entity conversation
        if (entityType && entityId) {
            // Validate entity exists and get owner
            const entityOwner = await this.getEntityOwner(entityType, entityId);
            if (!entityOwner) {
                throw new Error('Entity not found or has no owner');
            }

            if (senderId === entityOwner) {
                throw new Error('Cannot message your own entity');
            }

            // Check if conversation already exists
            const existing = await ConversationModel.findEntityConversation(senderId, entityType, entityId);
            if (existing) {
                return existing;
            }

            // Create new entity conversation
            // Participants: sender + entity owner
            return ConversationModel.create([senderId, entityOwner], 'entity', entityType, entityId);
        }

        throw new Error('Must provide either recipientId or entityType/entityId');
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(
        conversationId: string,
        senderId: string,
        content: string,
        messageType: 'text' | 'image' | 'item_share' | 'voice' | 'file' = 'text',
        metadata?: any,
        attachments?: any[],
        mentions?: any[]
    ): Promise<Message> {
        // Check if sender is a participant
        const isParticipant = await ConversationModel.isParticipant(conversationId, senderId);
        if (!isParticipant) {
            throw new Error('Not authorized to send messages in this conversation');
        }

        // Validate content (unless it's a media-only message)
        if ((!content || content.trim().length === 0) && (!attachments || attachments.length === 0)) {
            throw new Error('Message content or attachments required');
        }

        if (content && content.length > 5000) {
            throw new Error('Message content too long (max 5000 characters)');
        }

        return MessageModel.create({
            conversationId,
            senderId,
            content: content?.trim() || '',
            messageType,
            metadata,
            attachments,
            mentions,
        });
    }

    /**
     * Get user's conversations (inbox)
     */
    async getConversations(
        userId: string,
        limit = 20,
        offset = 0
    ): Promise<{ conversations: ConversationWithDetails[]; total: number }> {
        const result = await ConversationModel.getUserConversations(userId, limit, offset);

        // Enrich with other participant info or entity info
        const enrichedConversations: ConversationWithDetails[] = [];

        for (const conv of result.conversations) {
            const enriched: ConversationWithDetails = { ...conv };

            // For direct conversations, get the other participant
            if (conv.conversationType === 'direct' && conv.participants) {
                const otherParticipant = conv.participants.find(p => p.userId !== userId);
                if (otherParticipant?.user) {
                    enriched.otherParticipant = otherParticipant.user;
                }
            }

            // For entity conversations, get entity info
            if (conv.conversationType === 'entity' && conv.entityType && conv.entityId) {
                enriched.entity = await this.getEntityInfo(conv.entityType as EntityType, conv.entityId);
            }

            enrichedConversations.push(enriched);
        }

        return {
            conversations: enrichedConversations,
            total: result.total,
        };
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(
        conversationId: string,
        userId: string,
        limit = 50,
        offset = 0
    ): Promise<{ messages: Message[]; total: number }> {
        // Check if user is a participant
        const isParticipant = await ConversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) {
            throw new Error('Not authorized to view messages in this conversation');
        }

        return MessageModel.getByConversation(conversationId, limit, offset);
    }

    /**
     * Mark a conversation as read
     */
    async markAsRead(conversationId: string, userId: string): Promise<void> {
        const isParticipant = await ConversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) {
            throw new Error('Not authorized for this conversation');
        }

        await ConversationModel.markAsRead(conversationId, userId);
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return MessageModel.getUnreadCount(userId);
    }

    /**
     * Get a single conversation by ID
     */
    async getConversation(conversationId: string, userId: string): Promise<ConversationWithDetails | null> {
        const isParticipant = await ConversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) {
            throw new Error('Not authorized to view this conversation');
        }

        const conv = await ConversationModel.findById(conversationId);
        if (!conv) return null;

        const enriched: ConversationWithDetails = { ...conv };

        // For direct conversations, get the other participant
        if (conv.conversationType === 'direct' && conv.participants) {
            const otherParticipant = conv.participants.find(p => p.userId !== userId);
            if (otherParticipant?.user) {
                enriched.otherParticipant = otherParticipant.user;
            }
        }

        // For entity conversations, get entity info
        if (conv.conversationType === 'entity' && conv.entityType && conv.entityId) {
            enriched.entity = await this.getEntityInfo(conv.entityType as EntityType, conv.entityId);
        }

        return enriched;
    }

    /**
     * Delete a message (soft delete)
     */
    async deleteMessage(messageId: string, userId: string): Promise<boolean> {
        return MessageModel.softDelete(messageId, userId);
    }

    /**
     * Update conversation details (name, avatar)
     */
    async updateConversation(
        conversationId: string,
        userId: string,
        updates: { name?: string; avatarUrl?: string }
    ): Promise<Conversation> {
        // Check if user is a participant
        const isParticipant = await ConversationModel.isParticipant(conversationId, userId);
        if (!isParticipant) {
            throw new Error('Not authorized to update this conversation');
        }

        const updated = await ConversationModel.update(conversationId, updates);
        if (!updated) {
            throw new Error('Conversation not found');
        }

        return updated;
    }

    // Helper methods

    private async getEntityOwner(entityType: EntityType, entityId: string): Promise<string | null> {
        switch (entityType) {
            case 'brand':
                const brand = await BrandAccountModel.findById(entityId);
                return brand?.userId || null;
            case 'store':
                const store = await StoreModel.findById(entityId);
                return store?.userId || null;
            case 'supplier':
                const supplier = await SupplierModel.findById(entityId);
                return supplier?.userId || null;
            case 'page':
                const page = await PageModel.findById(entityId);
                return page?.userId || null;
            default:
                return null;
        }
    }

    private async getEntityInfo(entityType: EntityType, entityId: string): Promise<any> {
        switch (entityType) {
            case 'brand':
                return BrandAccountModel.findById(entityId);
            case 'store':
                return StoreModel.findById(entityId);
            case 'supplier':
                return SupplierModel.findById(entityId);
            case 'page':
                return PageModel.findById(entityId);
            default:
                return null;
        }
    }
}
