
import { Request, Response } from 'express';
import { OutfitModel } from '../models/OutfitModel';
import { AuthenticatedRequest } from '../utils/auth';

export class OutfitController {

    static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { name, description, items } = req.body;

            if (!name) {
                res.status(400).json({ error: { code: 'VALIATION_ERROR', message: 'Name is required' } });
                return;
            }

            const outfit = await OutfitModel.create({
                ownerId: req.user.userId,
                name,
                description,
                items
            });

            res.status(201).json(outfit);
        } catch (error) {
            console.error('Create outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create outfit' } });
        }
    }

    static async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const outfits = await OutfitModel.findByOwner(req.user.userId);
            res.json(outfits);
        } catch (error) {
            console.error('Get outfits error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch outfits' } });
        }
    }

    static async getOne(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { id } = req.params;
            const outfit = await OutfitModel.findById(id);

            if (!outfit) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found' } });
                return;
            }

            if (outfit.ownerId !== req.user.userId) {
                res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
                return;
            }

            res.json(outfit);
        } catch (error) {
            console.error('Get outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch outfit' } });
        }
    }

    static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { id } = req.params;
            const existing = await OutfitModel.findById(id);

            if (!existing) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found' } });
                return;
            }

            if (existing.ownerId !== req.user.userId) {
                res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
                return;
            }

            const updated = await OutfitModel.update(id, req.body);
            res.json(updated);
        } catch (error) {
            console.error('Update outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update outfit' } });
        }
    }

    static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { id } = req.params;
            const existing = await OutfitModel.findById(id);

            if (!existing) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found' } });
                return;
            }

            if (existing.ownerId !== req.user.userId) {
                res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
                return;
            }

            await OutfitModel.delete(id);
            res.json({ success: true });
        } catch (error) {
            console.error('Delete outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete outfit' } });
        }
    }

    // Get own outfit by slug
    static async getBySlug(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { slug } = req.params;
            const outfit = await OutfitModel.findBySlug(req.user.userId, slug);

            if (!outfit) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found' } });
                return;
            }

            res.json(outfit);
        } catch (error) {
            console.error('Get outfit by slug error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch outfit' } });
        }
    }

    // Get public outfits by username
    static async getPublicByUsername(req: Request, res: Response): Promise<void> {
        try {
            const { username } = req.params;
            const outfits = await OutfitModel.findByUsername(username);
            res.json(outfits);
        } catch (error) {
            console.error('Get public outfits error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch outfits' } });
        }
    }

    // Get single public outfit by username and slug
    static async getPublicByUsernameAndSlug(req: Request, res: Response): Promise<void> {
        try {
            const { username, slug } = req.params;
            const outfit = await OutfitModel.findByUsernameAndSlug(username, slug);

            if (!outfit) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found' } });
                return;
            }

            res.json(outfit);
        } catch (error) {
            console.error('Get public outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch outfit' } });
        }
    }

    // Get deleted outfits (trash)
    static async getDeleted(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const outfits = await OutfitModel.findDeleted(req.user.userId);
            res.json(outfits);
        } catch (error) {
            console.error('Get deleted outfits error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch deleted outfits' } });
        }
    }

    // Restore outfit from trash
    static async restore(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { id } = req.params;
            const success = await OutfitModel.restore(id);

            if (!success) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found in trash' } });
                return;
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Restore outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to restore outfit' } });
        }
    }

    // Permanently delete outfit
    static async permanentDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
                return;
            }

            const { id } = req.params;
            const success = await OutfitModel.permanentDelete(id);

            if (!success) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Outfit not found' } });
                return;
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Permanent delete outfit error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to permanently delete outfit' } });
        }
    }
}
