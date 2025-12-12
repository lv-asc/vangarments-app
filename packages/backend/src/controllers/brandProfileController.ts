import { Request, Response } from 'express';
import { BrandAccountModel, BrandProfileData } from '../models/BrandAccount';
import { BrandTeamModel, BrandRole } from '../models/BrandTeam';
import { BrandLookbookModel } from '../models/BrandLookbook';
import { BrandCollectionModel, CollectionType } from '../models/BrandCollection';
import { AuthenticatedRequest } from '../utils/auth';

export class BrandProfileController {
    /**
     * Get full brand profile with team, lookbooks, and collections
     */
    async getFullProfile(req: Request, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const fullProfile = await BrandAccountModel.getFullProfile(brandId);

            if (!fullProfile) {
                res.status(404).json({
                    error: { code: 'BRAND_NOT_FOUND', message: 'Brand not found' }
                });
                return;
            }

            res.json({ success: true, data: fullProfile });
        } catch (error: any) {
            res.status(500).json({
                error: { code: 'GET_PROFILE_FAILED', message: error.message }
            });
        }
    }

    /**
     * Update brand profile data (bio, social links, etc.)
     */
    async updateProfileData(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { bio, foundedDate, instagram, tiktok, youtube, additionalLogos } = req.body;

            const profileData: Partial<BrandProfileData> = {};
            if (bio !== undefined) profileData.bio = bio;
            if (foundedDate !== undefined) profileData.foundedDate = foundedDate;
            if (instagram !== undefined) profileData.instagram = instagram;
            if (tiktok !== undefined) profileData.tiktok = tiktok;
            if (youtube !== undefined) profileData.youtube = youtube;
            if (additionalLogos !== undefined) profileData.additionalLogos = additionalLogos;

            const updated = await BrandAccountModel.updateProfileData(brandId, profileData);

            if (!updated) {
                res.status(404).json({
                    error: { code: 'BRAND_NOT_FOUND', message: 'Brand not found' }
                });
                return;
            }

            res.json({ success: true, data: { brand: updated } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'UPDATE_PROFILE_FAILED', message: error.message }
            });
        }
    }

    // ============ TEAM MANAGEMENT ============

    /**
     * Get team members for a brand
     */
    async getTeamMembers(req: Request, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const publicOnly = req.query.publicOnly !== 'false';

            const team = await BrandTeamModel.getTeamMembers(brandId, publicOnly);
            res.json({ success: true, data: { team } });
        } catch (error: any) {
            res.status(500).json({
                error: { code: 'GET_TEAM_FAILED', message: error.message }
            });
        }
    }

    /**
     * Add a team member
     */
    async addTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { userId, role, title, isPublic } = req.body;

            if (!userId || !role) {
                res.status(400).json({
                    error: { code: 'INVALID_INPUT', message: 'userId and role are required' }
                });
                return;
            }

            const member = await BrandTeamModel.addMember({
                brandId,
                userId,
                role: role as BrandRole,
                title,
                isPublic
            });

            res.status(201).json({ success: true, data: { member } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'ADD_MEMBER_FAILED', message: error.message }
            });
        }
    }

    /**
     * Update a team member
     */
    async updateTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { memberId } = req.params;
            const { role, title, isPublic } = req.body;

            const updated = await BrandTeamModel.updateMember(memberId, { role, title, isPublic });

            if (!updated) {
                res.status(404).json({
                    error: { code: 'MEMBER_NOT_FOUND', message: 'Team member not found' }
                });
                return;
            }

            res.json({ success: true, data: { member: updated } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'UPDATE_MEMBER_FAILED', message: error.message }
            });
        }
    }

    /**
     * Remove a team member
     */
    async removeTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { memberId } = req.params;
            const deleted = await BrandTeamModel.removeMemberById(memberId);

            if (!deleted) {
                res.status(404).json({
                    error: { code: 'MEMBER_NOT_FOUND', message: 'Team member not found' }
                });
                return;
            }

            res.json({ success: true, message: 'Team member removed' });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'REMOVE_MEMBER_FAILED', message: error.message }
            });
        }
    }

    // ============ LOOKBOOK MANAGEMENT ============

    /**
     * Get lookbooks for a brand
     */
    async getLookbooks(req: Request, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const publishedOnly = req.query.publishedOnly !== 'false';

            const lookbooks = await BrandLookbookModel.findByBrand(brandId, publishedOnly);
            res.json({ success: true, data: { lookbooks } });
        } catch (error: any) {
            res.status(500).json({
                error: { code: 'GET_LOOKBOOKS_FAILED', message: error.message }
            });
        }
    }

    /**
     * Get a single lookbook with items
     */
    async getLookbook(req: Request, res: Response): Promise<void> {
        try {
            const { lookbookId } = req.params;

            const lookbook = await BrandLookbookModel.findById(lookbookId);
            if (!lookbook) {
                res.status(404).json({
                    error: { code: 'LOOKBOOK_NOT_FOUND', message: 'Lookbook not found' }
                });
                return;
            }

            const items = await BrandLookbookModel.getItems(lookbookId);
            res.json({ success: true, data: { lookbook, items } });
        } catch (error: any) {
            res.status(500).json({
                error: { code: 'GET_LOOKBOOK_FAILED', message: error.message }
            });
        }
    }

    /**
     * Create a lookbook
     */
    async createLookbook(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { name, description, coverImageUrl, season, year } = req.body;

            if (!name) {
                res.status(400).json({
                    error: { code: 'INVALID_INPUT', message: 'name is required' }
                });
                return;
            }

            const lookbook = await BrandLookbookModel.create({
                brandId,
                name,
                description,
                coverImageUrl,
                season,
                year
            });

            res.status(201).json({ success: true, data: { lookbook } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'CREATE_LOOKBOOK_FAILED', message: error.message }
            });
        }
    }

    /**
     * Update a lookbook
     */
    async updateLookbook(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { lookbookId } = req.params;
            const { name, description, coverImageUrl, season, year, isPublished } = req.body;

            const updated = await BrandLookbookModel.update(lookbookId, {
                name, description, coverImageUrl, season, year, isPublished
            });

            if (!updated) {
                res.status(404).json({
                    error: { code: 'LOOKBOOK_NOT_FOUND', message: 'Lookbook not found' }
                });
                return;
            }

            res.json({ success: true, data: { lookbook: updated } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'UPDATE_LOOKBOOK_FAILED', message: error.message }
            });
        }
    }

    /**
     * Delete a lookbook
     */
    async deleteLookbook(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { lookbookId } = req.params;
            const deleted = await BrandLookbookModel.delete(lookbookId);

            if (!deleted) {
                res.status(404).json({
                    error: { code: 'LOOKBOOK_NOT_FOUND', message: 'Lookbook not found' }
                });
                return;
            }

            res.json({ success: true, message: 'Lookbook deleted' });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'DELETE_LOOKBOOK_FAILED', message: error.message }
            });
        }
    }

    /**
     * Add items to a lookbook
     */
    async addLookbookItems(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { lookbookId } = req.params;
            const { items } = req.body; // Array of { itemId, sortOrder }

            if (!Array.isArray(items)) {
                res.status(400).json({
                    error: { code: 'INVALID_INPUT', message: 'items array is required' }
                });
                return;
            }

            for (const item of items) {
                await BrandLookbookModel.addItem(lookbookId, item.itemId, item.sortOrder || 0);
            }

            const updatedItems = await BrandLookbookModel.getItems(lookbookId);
            res.json({ success: true, data: { items: updatedItems } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'ADD_ITEMS_FAILED', message: error.message }
            });
        }
    }

    // ============ COLLECTION MANAGEMENT ============

    /**
     * Get collections for a brand
     */
    async getCollections(req: Request, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const publishedOnly = req.query.publishedOnly !== 'false';

            const collections = await BrandCollectionModel.findByBrand(brandId, publishedOnly);
            res.json({ success: true, data: { collections } });
        } catch (error: any) {
            res.status(500).json({
                error: { code: 'GET_COLLECTIONS_FAILED', message: error.message }
            });
        }
    }

    /**
     * Get a single collection with items
     */
    async getCollection(req: Request, res: Response): Promise<void> {
        try {
            const { collectionId } = req.params;

            const collection = await BrandCollectionModel.findById(collectionId);
            if (!collection) {
                res.status(404).json({
                    error: { code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' }
                });
                return;
            }

            const items = await BrandCollectionModel.getItems(collectionId);
            res.json({ success: true, data: { collection, items } });
        } catch (error: any) {
            res.status(500).json({
                error: { code: 'GET_COLLECTION_FAILED', message: error.message }
            });
        }
    }

    /**
     * Create a collection
     */
    async createCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { name, description, coverImageUrl, collectionType, season, year } = req.body;

            if (!name) {
                res.status(400).json({
                    error: { code: 'INVALID_INPUT', message: 'name is required' }
                });
                return;
            }

            const collection = await BrandCollectionModel.create({
                brandId,
                name,
                description,
                coverImageUrl,
                collectionType: collectionType as CollectionType,
                season,
                year
            });

            res.status(201).json({ success: true, data: { collection } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'CREATE_COLLECTION_FAILED', message: error.message }
            });
        }
    }

    /**
     * Update a collection
     */
    async updateCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { collectionId } = req.params;
            const { name, description, coverImageUrl, collectionType, season, year, isPublished } = req.body;

            const updated = await BrandCollectionModel.update(collectionId, {
                name, description, coverImageUrl, collectionType, season, year, isPublished
            });

            if (!updated) {
                res.status(404).json({
                    error: { code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' }
                });
                return;
            }

            res.json({ success: true, data: { collection: updated } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'UPDATE_COLLECTION_FAILED', message: error.message }
            });
        }
    }

    /**
     * Delete a collection
     */
    async deleteCollection(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { collectionId } = req.params;
            const deleted = await BrandCollectionModel.delete(collectionId);

            if (!deleted) {
                res.status(404).json({
                    error: { code: 'COLLECTION_NOT_FOUND', message: 'Collection not found' }
                });
                return;
            }

            res.json({ success: true, message: 'Collection deleted' });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'DELETE_COLLECTION_FAILED', message: error.message }
            });
        }
    }

    /**
     * Add items to a collection
     */
    async addCollectionItems(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { collectionId } = req.params;
            const { items } = req.body; // Array of { itemId, sortOrder }

            if (!Array.isArray(items)) {
                res.status(400).json({
                    error: { code: 'INVALID_INPUT', message: 'items array is required' }
                });
                return;
            }

            for (const item of items) {
                await BrandCollectionModel.addItem(collectionId, item.itemId, item.sortOrder || 0);
            }

            const updatedItems = await BrandCollectionModel.getItems(collectionId);
            res.json({ success: true, data: { items: updatedItems } });
        } catch (error: any) {
            res.status(400).json({
                error: { code: 'ADD_ITEMS_FAILED', message: error.message }
            });
        }
    }
}
