import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { BrandLineModel } from '../models/BrandLine';
import { BrandAccountModel } from '../models/BrandAccount';

export class BrandLineController {
    static async createBrandLine(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;
            const { name, logo, description, collabBrandId, designerId, tags } = req.body;
            const userId = req.user?.userId;

            // Verify Brand Ownership
            const brand = await BrandAccountModel.findById(brandId);
            if (!brand) {
                res.status(404).json({ error: { code: 'BRAND_NOT_FOUND', message: 'Brand not found' } });
                return;
            }

            if (brand.userId !== userId && !req.user?.roles.includes('admin')) {
                res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to manage this brand' } });
                return;
            }

            const line = await BrandLineModel.create({
                brandId,
                name,
                logo,
                description,
                collabBrandId,
                designerId,
                tags
            });
            res.status(201).json({ message: 'Brand line created successfully', line });
        } catch (error: any) {
            console.error('Create brand line error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create brand line' } });
        }
    }

    static async getBrandLines(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId } = req.params;

            // First try direct lookup by brand_accounts.id
            let lines = await BrandLineModel.findByBrandId(brandId);

            // If no lines found, try looking up by vufs_brand_id
            // This supports the case where frontend sends a vufs_brands.id
            if (lines.length === 0) {
                lines = await BrandLineModel.findByVufsBrandId(brandId);
            }

            res.json({ lines });
        } catch (error: any) {
            console.error('Get brand lines error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch brand lines' } });
        }
    }

    static async updateBrandLine(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, logo, description, collabBrandId, designerId, tags } = req.body;
            const userId = req.user?.userId;

            const existingLine = await BrandLineModel.findById(id);
            if (!existingLine) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Brand line not found' } });
                return;
            }

            // Verify ownership via brand lookup
            const brand = await BrandAccountModel.findById(existingLine.brandId);
            if (brand?.userId !== userId && !req.user?.roles.includes('admin')) {
                res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
                return;
            }

            const line = await BrandLineModel.update(id, {
                name,
                logo,
                description,
                collabBrandId,
                designerId,
                tags
            });
            res.json({ message: 'Brand line updated successfully', line });
        } catch (error: any) {
            console.error('Update brand line error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update brand line' } });
        }
    }

    static async deleteBrandLine(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;

            const existingLine = await BrandLineModel.findById(id);
            if (!existingLine) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Brand line not found' } });
                return;
            }

            // Verify ownership via brand lookup
            const brand = await BrandAccountModel.findById(existingLine.brandId);
            if (brand?.userId !== userId && !req.user?.roles.includes('admin')) {
                res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
                return;
            }

            await BrandLineModel.delete(id);
            res.json({ message: 'Brand line deleted successfully' });
        } catch (error: any) {
            console.error('Delete brand line error:', error);
            res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete brand line' } });
        }
    }
}
