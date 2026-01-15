import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { LikesModel } from '../models/LikesModel';

export class LikesController {
    static async toggleLike(req: AuthenticatedRequest, res: Response) {
        try {
            const { skuItemId } = req.body;

            // AuthenticatedRequest ensures user is present if used with auth middleware,
            // but strict typing might require check
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userId = req.user.userId;

            if (!skuItemId) {
                return res.status(400).json({ error: 'SKU Item ID is required' });
            }

            const result = await LikesModel.toggle(userId, skuItemId);

            // Get updated count
            const count = await LikesModel.getLikeCount(skuItemId);

            res.json({ ...result, count });
        } catch (error) {
            console.error('Error toggling like:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async checkStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const { skuItemId } = req.params;

            if (!req.user) {
                return res.json({ liked: false });
            }

            const userId = req.user.userId;

            const liked = await LikesModel.hasUserLiked(userId, skuItemId);
            res.json({ liked });
        } catch (error) {
            console.error('Error checking like status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getUserLikes(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const userId = req.user.userId;
            const { limit, offset } = req.query;

            const result = await LikesModel.getUserLikedItems(
                userId,
                Number(limit) || 20,
                Number(offset) || 0
            );

            res.json(result);
        } catch (error) {
            console.error('Error fetching user likes:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
