import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { WishlistModel } from '../models/Wishlist';

export class WishlistController {
    static async getMyWishlists(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const wishlists = await WishlistModel.getByUserId(req.user.userId);
            res.json(wishlists);
        } catch (error) {
            console.error('Error fetching wishlists', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async toggleWishlistItem(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const { skuItemId, wishlistId } = req.body;
            const userId = req.user.userId;

            if (!skuItemId) return res.status(400).json({ error: 'SKU Item ID is required' });

            // If no wishlistId provided, use default
            let targetWishlistId = wishlistId;
            if (!targetWishlistId) {
                const defaultList = await WishlistModel.getOrCreateDefault(userId);
                targetWishlistId = defaultList.id;
            }

            // Check if item exists in this wishlist (toggle)
            const items = await WishlistModel.getItems(targetWishlistId);
            const exists = items.find(i => i.skuItemId === skuItemId);

            if (exists) {
                await WishlistModel.removeItem(targetWishlistId, skuItemId);
                res.json({ added: false, wishlistId: targetWishlistId });
            } else {
                await WishlistModel.addItem(targetWishlistId, skuItemId);
                res.json({ added: true, wishlistId: targetWishlistId });
            }

        } catch (error) {
            console.error('Error toggling wishlist item', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async checkStatus(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) return res.json({ onWishlist: false });
            const { skuItemId } = req.params;

            // Check if it is in ANY of user's wishlists
            const onWishlist = await WishlistModel.isItemInUserWishlist(req.user.userId, skuItemId);
            res.json({ onWishlist });
        } catch (error) {
            console.error('Error checking wishlist status', error);
            res.status(500).json({ error: 'Error checking status' });
        }
    }

    static async getWishlistItems(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const wishlist = await WishlistModel.findById(id);
            if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });

            // Check visibility
            const isOwner = userId === wishlist.userId;

            if (wishlist.visibility === 'private' && !isOwner) {
                return res.status(403).json({ error: 'This wishlist is private' });
            }

            // TODO: Scale friends check if visibility === 'friends'

            const items = await WishlistModel.getItems(id);
            res.json(items);
        } catch (e) {
            console.error('Error fetching wishlist items', e);
            res.status(500).json({ error: 'Error fetching items' });
        }
    }

    static async createWishlist(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const { name, visibility } = req.body;
            if (!name) return res.status(400).json({ error: 'Name is required' });

            const wishlist = await WishlistModel.create(req.user.userId, name, false);
            if (visibility) {
                await WishlistModel.update(wishlist.id, req.user.userId, { visibility });
            }

            const updated = await WishlistModel.getByUserId(req.user.userId);
            res.json(updated.find(w => w.id === wishlist.id));
        } catch (error) {
            console.error('Error creating wishlist', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async updateWishlist(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const { id } = req.params;
            const { name, visibility } = req.body;

            const updated = await WishlistModel.update(id, req.user.userId, { name, visibility });
            if (!updated) return res.status(404).json({ error: 'Wishlist not found or unauthorized' });

            res.json(updated);
        } catch (error) {
            console.error('Error updating wishlist', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async deleteWishlist(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
            const { id } = req.params;

            const success = await WishlistModel.delete(id, req.user.userId);
            if (!success) return res.status(400).json({ error: 'Could not delete wishlist (default list cannot be deleted)' });

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting wishlist', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
