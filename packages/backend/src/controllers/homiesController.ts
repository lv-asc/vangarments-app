import { Request, Response } from 'express';
import { HomiesModel } from '../models/Homies';

import { UserModel } from '../models/User';
import { BrandAccountModel } from '../models/BrandAccount';
import { StoreModel } from '../models/Store';

export class HomiesController {
    // ... existing methods ...

    static async searchCandidates(req: Request, res: Response) {
        try {
            const q = (req.query.q as string || '').trim();
            const limit = 20;

            const [usersResult, brandsResult, storesAll] = await Promise.all([
                UserModel.searchPublicUsers({ search: q, limit }),
                BrandAccountModel.findMany({ search: q }, limit),
                StoreModel.findAll() // Fetch all and filter in memory for now as StoreModel lacks detailed search
            ]);

            const users = usersResult.users.filter((u: any) => u.id !== (req as any).user.id).map(u => ({
                id: u.id,
                username: u.username,
                personalInfo: u.personalInfo,
                verificationStatus: u.verificationStatus,
                type: 'user'
            }));

            const brands = brandsResult.brands.map(b => ({
                id: b.id,
                username: b.brandInfo.slug,
                personalInfo: {
                    name: b.brandInfo.name,
                    avatarUrl: b.brandInfo.logo,
                    bio: b.brandInfo.description
                },
                verificationStatus: b.verificationStatus,
                type: 'brand' // Could be 'brand' or other business types, let's normalize to 'brand' for now or pass actual
            }));

            // Filter stores in memory
            const stores = storesAll.filter(s =>
                !q || s.name.toLowerCase().includes(q.toLowerCase()) || (s.slug && s.slug.toLowerCase().includes(q.toLowerCase()))
            ).slice(0, limit).map(s => ({
                id: s.id,
                username: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
                personalInfo: {
                    name: s.name,
                    avatarUrl: s.socialLinks?.[0]?.url || undefined // Fallback avatar
                },
                type: 'store'
            }));

            const all = [...users, ...brands, ...stores];
            res.json(all);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getMyLists(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            // Ensure default Homies list exists
            await HomiesModel.ensureDefaultList(userId);
            const lists = await HomiesModel.getListsByUserId(userId);
            res.json({ data: lists });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createList(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { name, color } = req.body;
            if (!name) return res.status(400).json({ error: 'List name is required' });
            const list = await HomiesModel.createList(userId, name, color);
            res.status(201).json(list);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateList(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { name, color } = req.body;
            const list = await HomiesModel.updateList(id, userId, { name, color });
            if (!list) return res.status(404).json({ error: 'List not found' });
            res.json(list);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteList(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const success = await HomiesModel.deleteList(id, userId);
            if (!success) return res.status(404).json({ error: 'List not found or permission denied' });
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getListMembers(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const members = await HomiesModel.getListMembers(id);
            res.json({ data: members });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async addMember(req: Request, res: Response) {
        try {
            const { id, memberId } = req.params;
            const { memberType } = req.body;
            await HomiesModel.addMember(id, memberId, memberType);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async removeMember(req: Request, res: Response) {
        try {
            const { id, memberId } = req.params;
            await HomiesModel.removeMember(id, memberId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getTargetUserLists(req: Request, res: Response) {
        try {
            const viewerId = (req as any).user.id;
            const { userId } = req.params;
            const lists = await HomiesModel.getUserHomiesLists(viewerId, userId);
            res.json(lists);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
