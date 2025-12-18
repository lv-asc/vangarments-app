import { Router } from 'express';
import { MessagingController } from '../controllers/messagingController';
import { AuthUtils } from '../utils/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';
import { StorageController } from '../controllers/storageController';

const router = Router();
const messagingController = new MessagingController();

// Validation schemas
const startConversationValidation = [
    body('recipientId')
        .optional()
        .isUUID()
        .withMessage('Recipient ID must be a valid UUID'),
    body('entityType')
        .optional()
        .isIn(['brand', 'store', 'supplier', 'page'])
        .withMessage('Entity type must be brand, store, supplier, or page'),
    body('entityId')
        .optional()
        .isUUID()
        .withMessage('Entity ID must be a valid UUID'),
    body('participantIds')
        .optional()
        .isArray()
        .withMessage('Participant IDs must be an array'),
    body('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Group name must be between 1 and 100 characters'),
];

const sendMessageValidation = [
    param('conversationId')
        .isUUID()
        .withMessage('Conversation ID must be a valid UUID'),
    body('content')
        .optional()
        .isLength({ max: 5000 })
        .withMessage('Message content must be at most 5000 characters'),
    body('messageType')
        .optional()
        .isIn(['text', 'image', 'item_share', 'voice', 'file'])
        .withMessage('Message type must be text, image, item_share, voice, or file'),
];

const conversationIdValidation = [
    param('conversationId')
        .isUUID()
        .withMessage('Conversation ID must be a valid UUID'),
];

const messageIdValidation = [
    param('messageId')
        .isUUID()
        .withMessage('Message ID must be a valid UUID'),
];

const editMessageValidation = [
    param('messageId')
        .isUUID()
        .withMessage('Message ID must be a valid UUID'),
    body('content')
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message content must be between 1 and 5000 characters'),
];

const addReactionValidation = [
    param('messageId')
        .isUUID()
        .withMessage('Message ID must be a valid UUID'),
    body('emoji')
        .isLength({ min: 1, max: 50 })
        .withMessage('Emoji is required'),
];

const paginationValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
];

const updateConversationValidation = [
    param('conversationId')
        .isUUID()
        .withMessage('Conversation ID must be a valid UUID'),
    body('name')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Group name must be between 1 and 100 characters'),
    body('avatarUrl')
        .optional()
        .isString()
        .withMessage('Avatar URL must be a string'),
];

// Routes

// Start or get conversation
router.post(
    '/conversations',
    AuthUtils.authenticateToken,
    startConversationValidation,
    validateRequest,
    messagingController.startConversation.bind(messagingController)
);

// Get user's conversations (inbox)
router.get(
    '/conversations',
    AuthUtils.authenticateToken,
    paginationValidation,
    validateRequest,
    messagingController.getConversations.bind(messagingController)
);

// Get single conversation
router.get(
    '/conversations/:conversationId',
    AuthUtils.authenticateToken,
    conversationIdValidation,
    validateRequest,
    messagingController.getConversation.bind(messagingController)
);

// Update conversation
router.patch(
    '/conversations/:conversationId',
    AuthUtils.authenticateToken,
    updateConversationValidation,
    validateRequest,
    messagingController.updateConversation.bind(messagingController)
);

// Get messages in a conversation
router.get(
    '/conversations/:conversationId/messages',
    AuthUtils.authenticateToken,
    conversationIdValidation,
    paginationValidation,
    validateRequest,
    messagingController.getMessages.bind(messagingController)
);

// Send a message
router.post(
    '/conversations/:conversationId/messages',
    AuthUtils.authenticateToken,
    sendMessageValidation,
    validateRequest,
    messagingController.sendMessage.bind(messagingController)
);

// Mark conversation as read
router.post(
    '/conversations/:conversationId/read',
    AuthUtils.authenticateToken,
    conversationIdValidation,
    validateRequest,
    messagingController.markAsRead.bind(messagingController)
);

// Get unread count
router.get(
    '/unread-count',
    AuthUtils.authenticateToken,
    messagingController.getUnreadCount.bind(messagingController)
);

// Edit a message
router.patch(
    '/messages/:messageId',
    AuthUtils.authenticateToken,
    editMessageValidation,
    validateRequest,
    messagingController.editMessage.bind(messagingController)
);

// Delete a message
router.delete(
    '/messages/:messageId',
    AuthUtils.authenticateToken,
    messageIdValidation,
    validateRequest,
    messagingController.deleteMessage.bind(messagingController)
);

// Check if message can be edited
router.get(
    '/messages/:messageId/can-edit',
    AuthUtils.authenticateToken,
    messageIdValidation,
    validateRequest,
    messagingController.canEditMessage.bind(messagingController)
);

// Add a reaction to a message
router.post(
    '/messages/:messageId/reactions',
    AuthUtils.authenticateToken,
    addReactionValidation,
    validateRequest,
    messagingController.addReaction.bind(messagingController)
);

// Get reactions for a message
router.get(
    '/messages/:messageId/reactions',
    AuthUtils.authenticateToken,
    messageIdValidation,
    validateRequest,
    messagingController.getReactions.bind(messagingController)
);

// Remove a reaction from a message
router.delete(
    '/messages/:messageId/reactions/:emoji',
    AuthUtils.authenticateToken,
    messageIdValidation,
    validateRequest,
    messagingController.removeReaction.bind(messagingController)
);

// Upload media for a message
router.post(
    '/upload-media',
    AuthUtils.authenticateToken,
    StorageController.uploadMiddleware,
    messagingController.uploadMedia.bind(messagingController)
);

export default router;
