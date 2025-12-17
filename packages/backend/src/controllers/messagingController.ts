import { Request, Response } from 'express';
import { MessagingService } from '../services/messagingService';
import { AuthenticatedRequest } from '../utils/auth';
import { MessageModel } from '../models/Message';
import { ConversationModel } from '../models/Conversation';
import { StorageController } from './storageController';

const messagingService = new MessagingService();

export class MessagingController {
    /**
     * Start or get an existing conversation
     */
    async startConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { recipientId, entityType, entityId, participantIds, name } = req.body;
            const senderId = req.user!.id;

            // Group chat support
            if (participantIds && Array.isArray(participantIds) && participantIds.length > 1) {
                const allParticipants = [senderId, ...participantIds.filter((id: string) => id !== senderId)];
                const conversation = await ConversationModel.create(allParticipants, 'group');
                // Update name if provided
                if (name) {
                    // TODO: Update conversation name
                }
                res.status(201).json({
                    success: true,
                    data: { conversation },
                });
                return;
            }

            const conversation = await messagingService.startConversation({
                senderId,
                recipientId,
                entityType,
                entityId,
            });

            res.status(201).json({
                success: true,
                data: { conversation },
            });
        } catch (error: any) {
            res.status(400).json({
                error: {
                    code: 'START_CONVERSATION_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Get user's conversations (inbox)
     */
    async getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const { limit = 20, offset = 0 } = req.query;

            const result = await messagingService.getConversations(
                userId,
                parseInt(limit as string),
                parseInt(offset as string)
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'GET_CONVERSATIONS_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Get a specific conversation
     */
    async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.id;

            const conversation = await messagingService.getConversation(conversationId, userId);

            if (!conversation) {
                res.status(404).json({
                    error: {
                        code: 'CONVERSATION_NOT_FOUND',
                        message: 'Conversation not found',
                    },
                });
                return;
            }

            res.json({
                success: true,
                data: { conversation },
            });
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403).json({
                    error: {
                        code: 'NOT_AUTHORIZED',
                        message: error.message,
                    },
                });
            } else {
                res.status(500).json({
                    error: {
                        code: 'GET_CONVERSATION_FAILED',
                        message: error.message,
                    },
                });
            }
        }
    }

    /**
     * Get messages in a conversation
     */
    async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.id;
            const { limit = 50, offset = 0 } = req.query;

            const result = await messagingService.getMessages(
                conversationId,
                userId,
                parseInt(limit as string),
                parseInt(offset as string)
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403).json({
                    error: {
                        code: 'NOT_AUTHORIZED',
                        message: error.message,
                    },
                });
            } else {
                res.status(500).json({
                    error: {
                        code: 'GET_MESSAGES_FAILED',
                        message: error.message,
                    },
                });
            }
        }
    }

    async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const { content, messageType, metadata, attachments, mentions } = req.body;
            const senderId = req.user!.id;

            // Validate content (unless it's a media-only message)
            if ((!content || content.trim().length === 0) && (!attachments || attachments.length === 0)) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Message content or attachments required',
                    },
                });
                return;
            }

            const message = await messagingService.sendMessage(
                conversationId,
                senderId,
                content,
                messageType,
                metadata,
                attachments,
                mentions
            );

            res.status(201).json({
                success: true,
                data: { message },
            });
        } catch (error: any) {
            if (error.message.includes('Not authorized')) {
                res.status(403).json({
                    error: {
                        code: 'NOT_AUTHORIZED',
                        message: error.message,
                    },
                });
            } else {
                res.status(400).json({
                    error: {
                        code: 'SEND_MESSAGE_FAILED',
                        message: error.message,
                    },
                });
            }
        }
    }

    /**
     * Upload media for a message
     */
    async uploadMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // Force category to social for messages
            req.body.category = 'social';
            await StorageController.uploadImage(req, res);
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'UPLOAD_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Edit a message (only within 15 minutes)
     */
    async editMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const { content } = req.body;
            const userId = req.user!.id;

            if (!content || content.trim().length === 0) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Message content is required',
                    },
                });
                return;
            }

            const message = await MessageModel.edit(messageId, userId, content.trim());

            if (!message) {
                res.status(400).json({
                    error: {
                        code: 'EDIT_FAILED',
                        message: 'Cannot edit message. Either not found, not the owner, or more than 15 minutes have passed.',
                    },
                });
                return;
            }

            res.json({
                success: true,
                data: { message },
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'EDIT_MESSAGE_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Mark conversation as read
     */
    async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { conversationId } = req.params;
            const userId = req.user!.id;

            await messagingService.markAsRead(conversationId, userId);

            res.json({
                success: true,
                message: 'Conversation marked as read',
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'MARK_READ_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;

            const count = await messagingService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount: count },
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'GET_UNREAD_COUNT_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Delete a message (within 15 minute window)
     */
    async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;

            // Use timed delete (15 min window)
            const success = await MessageModel.timedDelete(messageId, userId);

            if (!success) {
                res.status(400).json({
                    error: {
                        code: 'DELETE_FAILED',
                        message: 'Cannot delete message. Either not found, not the owner, or more than 15 minutes have passed.',
                    },
                });
                return;
            }

            res.json({
                success: true,
                message: 'Message deleted',
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'DELETE_MESSAGE_FAILED',
                    message: error.message,
                },
            });
        }
    }

    // ============== Reactions ==============

    /**
     * Add a reaction to a message
     */
    async addReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const { emoji } = req.body;
            const userId = req.user!.id;

            if (!emoji) {
                res.status(400).json({
                    error: {
                        code: 'INVALID_INPUT',
                        message: 'Emoji is required',
                    },
                });
                return;
            }

            const reaction = await MessageModel.addReaction(messageId, userId, emoji);

            res.status(201).json({
                success: true,
                data: { reaction },
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'ADD_REACTION_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Remove a reaction from a message
     */
    async removeReaction(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { messageId, emoji } = req.params;
            const userId = req.user!.id;

            const success = await MessageModel.removeReaction(messageId, userId, emoji);

            if (!success) {
                res.status(404).json({
                    error: {
                        code: 'REACTION_NOT_FOUND',
                        message: 'Reaction not found',
                    },
                });
                return;
            }

            res.json({
                success: true,
                message: 'Reaction removed',
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'REMOVE_REACTION_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Get reactions for a message
     */
    async getReactions(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;

            const reactions = await MessageModel.getReactions(messageId);

            res.json({
                success: true,
                data: { reactions },
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'GET_REACTIONS_FAILED',
                    message: error.message,
                },
            });
        }
    }

    /**
     * Check if message can be edited
     */
    async canEditMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { messageId } = req.params;
            const userId = req.user!.id;

            const canEdit = await MessageModel.canEdit(messageId, userId);

            res.json({
                success: true,
                data: { canEdit },
            });
        } catch (error: any) {
            res.status(500).json({
                error: {
                    code: 'CHECK_EDIT_FAILED',
                    message: error.message,
                },
            });
        }
    }
}
