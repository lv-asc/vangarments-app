import { Request, Response } from 'express';
import { db } from '../database/connection';
import { JWTPayload } from '../utils/auth';

interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export class POMController {
    /**
     * Get all POM categories
     */
    static async getCategories(req: Request, res: Response): Promise<void> {
        try {
            const result = await db.query(`
                SELECT id, name, description, sort_order, is_active
                FROM pom_categories
                WHERE is_active = true
                ORDER BY sort_order
            `);
            res.json({ categories: result.rows });
        } catch (error) {
            console.error('Get POM categories error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get all POMs, optionally filtered by category
     */
    static async getDefinitions(req: Request, res: Response): Promise<void> {
        try {
            const { categoryId } = req.query;

            let query = `
                SELECT 
                    pd.id, pd.category_id, pd.code, pd.name, pd.description,
                    pd.measurement_unit, pd.is_half_measurement, pd.default_tolerance,
                    pd.sort_order, pd.is_active,
                    pc.name as category_name
                FROM pom_definitions pd
                JOIN pom_categories pc ON pd.category_id = pc.id
                WHERE pd.is_active = true
            `;
            const values: any[] = [];

            if (categoryId) {
                query += ` AND pd.category_id = $1`;
                values.push(categoryId);
            }

            query += ` ORDER BY pc.sort_order, pd.sort_order`;

            const result = await db.query(query, values);
            res.json({ definitions: result.rows });
        } catch (error) {
            console.error('Get POM definitions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get POMs mapped to a specific apparel type
     */
    static async getApparelPOMs(req: Request, res: Response): Promise<void> {
        try {
            const { apparelId } = req.params;

            const result = await db.query(`
                SELECT 
                    pd.id, pd.code, pd.name, pd.description,
                    pd.measurement_unit, pd.is_half_measurement, pd.default_tolerance,
                    apm.is_required, apm.sort_order,
                    pc.name as category_name
                FROM apparel_pom_mappings apm
                JOIN pom_definitions pd ON apm.pom_id = pd.id
                JOIN pom_categories pc ON pd.category_id = pc.id
                WHERE apm.apparel_id = $1
                ORDER BY apm.sort_order, pd.sort_order
            `, [apparelId]);

            res.json({ poms: result.rows });
        } catch (error) {
            console.error('Get apparel POMs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Map POMs to an apparel type
     */
    static async setApparelPOMs(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { apparelId } = req.params;
            const { pomIds } = req.body; // Array of { pomId, isRequired, sortOrder }

            if (!Array.isArray(pomIds)) {
                res.status(400).json({ error: 'pomIds must be an array' });
                return;
            }

            // Delete existing mappings
            await db.query('DELETE FROM apparel_pom_mappings WHERE apparel_id = $1', [apparelId]);

            // Insert new mappings
            for (const item of pomIds) {
                await db.query(`
                    INSERT INTO apparel_pom_mappings (apparel_id, pom_id, is_required, sort_order)
                    VALUES ($1, $2, $3, $4)
                `, [apparelId, item.pomId, item.isRequired || false, item.sortOrder || 0]);
            }

            res.json({ message: 'Apparel POMs updated successfully' });
        } catch (error) {
            console.error('Set apparel POMs error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get measurements for a SKU
     */
    static async getSKUMeasurements(req: Request, res: Response): Promise<void> {
        try {
            const { skuId } = req.params;

            const result = await db.query(`
                SELECT 
                    sm.id, sm.pom_id, sm.size_id, sm.value, sm.tolerance,
                    pd.code as pom_code, pd.name as pom_name, pd.measurement_unit,
                    pd.is_half_measurement,
                    vs.name as size_name,
                    vs.sort_order as size_sort_order
                FROM sku_measurements sm
                JOIN pom_definitions pd ON sm.pom_id = pd.id
                JOIN vufs_sizes vs ON sm.size_id = vs.id
                WHERE sm.sku_id = $1
                ORDER BY vs.sort_order, pd.sort_order
            `, [skuId]);

            res.json({ measurements: result.rows });
        } catch (error) {
            console.error('Get SKU measurements error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Save measurements for a SKU
     */
    static async saveSKUMeasurements(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { skuId } = req.params;
            const { measurements } = req.body; // Array of { pomId, sizeId, value, tolerance? }

            if (!Array.isArray(measurements)) {
                res.status(400).json({ error: 'measurements must be an array' });
                return;
            }

            // Upsert measurements
            for (const m of measurements) {
                await db.query(`
                    INSERT INTO sku_measurements (sku_id, pom_id, size_id, value, tolerance)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (sku_id, pom_id, size_id) 
                    DO UPDATE SET value = $4, tolerance = $5, updated_at = NOW()
                `, [skuId, m.pomId, m.sizeId, m.value, m.tolerance || null]);
            }

            res.json({ message: 'SKU measurements saved successfully' });
        } catch (error) {
            console.error('Save SKU measurements error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get package measurement types
     */
    static async getPackageMeasurementTypes(req: Request, res: Response): Promise<void> {
        try {
            const result = await db.query(`
                SELECT id, name, description, unit, sort_order
                FROM package_measurement_types
                WHERE is_active = true
                ORDER BY sort_order
            `);
            res.json({ types: result.rows });
        } catch (error) {
            console.error('Get package measurement types error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Get user measurement types
     */
    static async getUserMeasurementTypes(req: Request, res: Response): Promise<void> {
        try {
            const result = await db.query(`
                SELECT id, name, description, unit, sort_order
                FROM user_measurement_types
                WHERE is_active = true
                ORDER BY sort_order
            `);
            res.json({ types: result.rows });
        } catch (error) {
            console.error('Get user measurement types error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Admin: Create or update a POM definition
     */
    static async upsertPOMDefinition(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id, categoryId, code, name, description, measurementUnit, isHalfMeasurement, defaultTolerance, sortOrder } = req.body;

            if (id) {
                // Update
                await db.query(`
                    UPDATE pom_definitions 
                    SET category_id = $2, code = $3, name = $4, description = $5, 
                        measurement_unit = $6, is_half_measurement = $7, default_tolerance = $8,
                        sort_order = $9, updated_at = NOW()
                    WHERE id = $1
                `, [id, categoryId, code, name, description, measurementUnit || 'cm', isHalfMeasurement || false, defaultTolerance || 0.5, sortOrder || 0]);
                res.json({ message: 'POM updated successfully' });
            } else {
                // Insert
                const result = await db.query(`
                    INSERT INTO pom_definitions (category_id, code, name, description, measurement_unit, is_half_measurement, default_tolerance, sort_order)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `, [categoryId, code, name, description, measurementUnit || 'cm', isHalfMeasurement || false, defaultTolerance || 0.5, sortOrder || 0]);
                res.json({ message: 'POM created successfully', id: result.rows[0].id });
            }
        } catch (error) {
            console.error('Upsert POM definition error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Admin: Delete a POM definition
     */
    static async deletePOMDefinition(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await db.query('UPDATE pom_definitions SET is_active = false WHERE id = $1', [id]);
            res.json({ message: 'POM deleted successfully' });
        } catch (error) {
            console.error('Delete POM definition error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Admin: Update package measurement type
     */
    static async upsertPackageMeasurementType(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id, name, description, unit, sortOrder } = req.body;

            if (id) {
                await db.query(`
                    UPDATE package_measurement_types 
                    SET name = $2, description = $3, unit = $4, sort_order = $5, updated_at = NOW()
                    WHERE id = $1
                `, [id, name, description, unit || 'cm', sortOrder || 0]);
                res.json({ message: 'Package measurement type updated' });
            } else {
                const result = await db.query(`
                    INSERT INTO package_measurement_types (name, description, unit, sort_order)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [name, description, unit || 'cm', sortOrder || 0]);
                res.json({ message: 'Package measurement type created', id: result.rows[0].id });
            }
        } catch (error) {
            console.error('Upsert package measurement type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Admin: Update user measurement type
     */
    static async upsertUserMeasurementType(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { id, name, description, unit, sortOrder } = req.body;

            if (id) {
                await db.query(`
                    UPDATE user_measurement_types 
                    SET name = $2, description = $3, unit = $4, sort_order = $5, updated_at = NOW()
                    WHERE id = $1
                `, [id, name, description, unit || 'cm', sortOrder || 0]);
                res.json({ message: 'User measurement type updated' });
            } else {
                const result = await db.query(`
                    INSERT INTO user_measurement_types (name, description, unit, sort_order)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [name, description, unit || 'cm', sortOrder || 0]);
                res.json({ message: 'User measurement type created', id: result.rows[0].id });
            }
        } catch (error) {
            console.error('Upsert user measurement type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
