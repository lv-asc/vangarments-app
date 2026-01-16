import { Request, Response } from 'express';
import { db } from '../database/connection';
import { JWTPayload } from '../utils/auth';

interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export class SilhouetteController {
    /**
     * Get all silhouettes, optionally filtered by brand, apparel, or fit
     */
    static async listSilhouettes(req: Request, res: Response): Promise<void> {
        try {
            const { brandId, apparelId, fitId } = req.query;
            let query = `
                SELECT s.*, b.brand_info->>'name' as brand_name, 
                       a.name as apparel_name, f.name as fit_name
                FROM brand_silhouettes s
                JOIN brand_accounts b ON s.brand_id = b.id
                JOIN vufs_attribute_values a ON s.apparel_id = a.id
                JOIN vufs_fits f ON s.fit_id = f.id
                WHERE s.deleted_at IS NULL
                  AND s.variant IS NOT NULL
                  AND s.name NOT LIKE '%#%'
            `;
            const values: any[] = [];
            let paramIndex = 1;

            let targetBrandId = brandId as string;

            if (brandId) {
                // Check if this ID exists in brand_accounts
                const brandCheck = await db.query('SELECT id FROM brand_accounts WHERE id = $1', [brandId]);

                if (brandCheck.rows.length === 0) {
                    // It might be a VUFS Brand ID (reference data). 
                    // Try to find the Brand Account by name from the VUFS Brand.
                    const vufsBrandRes = await db.query('SELECT name FROM vufs_brands WHERE id = $1', [brandId]);

                    if (vufsBrandRes.rows.length > 0) {
                        const vufsName = vufsBrandRes.rows[0].name;
                        // Try to find existing Brand Account by Name
                        const accountRes = await db.query("SELECT id FROM brand_accounts WHERE brand_info->>'name' = $1", [vufsName]);

                        if (accountRes.rows.length > 0) {
                            targetBrandId = accountRes.rows[0].id;
                        } else {
                            // If no brand account exists for this VUFS brand, we can't return silhouettes 
                            // (silhouettes are always linked to a Brand Account)
                            res.json({ silhouettes: [] });
                            return;
                        }
                    }
                }
            }

            if (targetBrandId) {
                query += ` AND s.brand_id = $${paramIndex++}`;
                values.push(targetBrandId);
            }
            if (apparelId) {
                query += ` AND s.apparel_id = $${paramIndex++}`;
                values.push(apparelId);
            }
            if (fitId) {
                query += ` AND s.fit_id = $${paramIndex++}`;
                values.push(fitId);
            }

            query += ` ORDER BY s.created_at DESC`;

            const result = await db.query(query, values);
            res.json({ silhouettes: result.rows });
        } catch (error) {
            console.error('List silhouettes error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Create a new silhouette with auto-naming
     */
    static async createSilhouette(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { brandId, apparelId, fitId, variant, pomIds, sizeIds, measurements } = req.body;

            if (!brandId || !apparelId || !fitId) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            // Get brand, apparel, and fit names for auto-naming
            const brandResult = await db.query(`SELECT brand_info->>'name' as name FROM brand_accounts WHERE id = $1`, [brandId]);
            const apparelResult = await db.query(`SELECT name FROM vufs_attribute_values WHERE id = $1`, [apparelId]);
            const fitResult = await db.query(`SELECT name FROM vufs_fits WHERE id = $1`, [fitId]);

            if (brandResult.rows.length === 0 || apparelResult.rows.length === 0 || fitResult.rows.length === 0) {
                res.status(404).json({ error: 'Invalid brand, apparel, or fit ID' });
                return;
            }

            const brandName = brandResult.rows[0].name;
            const apparelName = apparelResult.rows[0].name;
            const fitName = fitResult.rows[0].name;

            // Find how many silhouettes already exist for this combination to determine the number
            const countResult = await db.query(`
                SELECT COUNT(*) FROM brand_silhouettes 
                WHERE brand_id = $1 AND apparel_id = $2 AND fit_id = $3
            `, [brandId, apparelId, fitId]);

            const nextNumber = parseInt(countResult.rows[0].count) + 1;
            const name = `${brandName} ${fitName} ${apparelName} #${nextNumber}`;

            const result = await db.query(`
                INSERT INTO brand_silhouettes (brand_id, apparel_id, fit_id, name, variant, pom_ids, size_ids, measurements)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [brandId, apparelId, fitId, name, variant || null, pomIds || [], sizeIds || [], measurements || {}]);

            res.status(201).json({ silhouette: result.rows[0] });
        } catch (error) {
            console.error('Create silhouette error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Update an existing silhouette
     */
    static async updateSilhouette(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, variant, pomIds, sizeIds, measurements } = req.body;

            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (name) {
                updates.push(`name = $${paramIndex++}`);
                values.push(name);
            }
            if (variant !== undefined) {
                updates.push(`variant = $${paramIndex++}`);
                values.push(variant);
            }
            if (pomIds) {
                updates.push(`pom_ids = $${paramIndex++}`);
                values.push(pomIds);
            }
            if (sizeIds) {
                updates.push(`size_ids = $${paramIndex++}`);
                values.push(sizeIds);
            }
            if (measurements) {
                updates.push(`measurements = $${paramIndex++}`);
                values.push(measurements);
            }

            if (updates.length === 0) {
                res.status(400).json({ error: 'No fields to update' });
                return;
            }

            values.push(id);
            const query = `
                UPDATE brand_silhouettes 
                SET ${updates.join(', ')}, updated_at = NOW()
                WHERE id = $${paramIndex} AND deleted_at IS NULL
                RETURNING *
            `;

            const result = await db.query(query, values);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Silhouette not found' });
                return;
            }

            res.json({ silhouette: result.rows[0] });
        } catch (error) {
            console.error('Update silhouette error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Soft-delete a silhouette
     */
    static async deleteSilhouette(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const result = await db.query(`
                UPDATE brand_silhouettes 
                SET deleted_at = NOW() 
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING id
            `, [id]);

            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Silhouette not found' });
                return;
            }

            res.json({ message: 'Silhouette deleted successfully' });
        } catch (error) {
            console.error('Delete silhouette error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
