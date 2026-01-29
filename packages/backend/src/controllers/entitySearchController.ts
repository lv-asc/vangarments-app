import { Request, Response } from 'express';
import { db } from '../database/connection';
import { AuthenticatedRequest } from '../utils/auth';

export class EntitySearchController {

    /**
     * Search for entities (Users, Brands, Stores, etc.)
     * Returns a unified list of entities matching the search query.
     */
    static async searchEntities(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { q, limit = 20, types } = req.query;

            if (!q || typeof q !== 'string' || q.length < 2) {
                res.json({ results: [] });
                return;
            }

            const searchTerm = `%${q}%`;
            const maxResults = Math.min(Number(limit) || 20, 50);
            const results: any[] = [];

            const includeUsers = !types || (types as string).includes('user');
            const includeBrands = !types || (types as string).includes('brand') || (types as string).includes('store');

            // 1. Search Users
            if (includeUsers) {
                const userQuery = `
          SELECT 
            id, 
            username, 
            profile->>'name' as name, 
            profile->>'avatarUrl' as image,
            profile->>'profilePicture' as image_alt,
            'user' as type
          FROM users
          WHERE 
            (username ILIKE $1 OR profile->>'name' ILIKE $1)
            AND status = 'active'
          LIMIT $2
        `;

                const userRes = await db.query(userQuery, [searchTerm, maxResults]);
                results.push(...userRes.rows.map(row => ({
                    id: row.id,
                    type: 'user',
                    name: row.name || row.username, // Fallback to username if name missing
                    username: row.username,
                    image: row.image || row.image_alt || null
                })));
            }

            // 2. Search Brand Accounts (Brands, Stores, Non-Profits)
            if (includeBrands) {
                const brandQuery = `
          SELECT 
            id, 
            brand_info->>'name' as name, 
            brand_info->>'logo' as image,
            COALESCE(brand_info->>'businessType', 'brand') as business_type
          FROM brand_accounts
          WHERE 
            brand_info->>'name' ILIKE $1
            AND deleted_at IS NULL
          LIMIT $2
        `;

                const brandRes = await db.query(brandQuery, [searchTerm, maxResults]);
                results.push(...brandRes.rows.map(row => ({
                    id: row.id,
                    type: row.business_type === 'store' ? 'store' : (row.business_type === 'non_profit' ? 'organization' : 'brand'),
                    name: row.name,
                    image: row.image || null
                })));
            }

            // Sort by best match (exact match first, then starts with, then inclusion)
            results.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                const queryLower = q.toLowerCase();

                // Exact match priority
                if (nameA === queryLower && nameB !== queryLower) return -1;
                if (nameB === queryLower && nameA !== queryLower) return 1;

                // Starts with priority
                const aStarts = nameA.startsWith(queryLower);
                const bStarts = nameB.startsWith(queryLower);
                if (aStarts && !bStarts) return -1;
                if (bStarts && !aStarts) return 1;

                return 0;
            });

            // Slice to absolute limit
            const finalResults = results.slice(0, maxResults);

            res.json({ results: finalResults });

        } catch (error) {
            console.error('Entity search error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
