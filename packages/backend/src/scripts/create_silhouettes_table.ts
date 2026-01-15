
import 'dotenv/config';
import { db } from '../database/connection';

async function createSilhouettesTable() {
    try {
        console.log('Creating brand_silhouettes table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS brand_silhouettes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                brand_id UUID NOT NULL REFERENCES brand_accounts(id) ON DELETE CASCADE,
                apparel_id UUID NOT NULL REFERENCES vufs_attribute_values(id),
                fit_id UUID NOT NULL REFERENCES vufs_fits(id),
                name TEXT NOT NULL,
                pom_ids UUID[] NOT NULL DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                deleted_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(brand_id, apparel_id, fit_id, name)
            );
        `);
        console.log('Table brand_silhouettes created successfully.');

        // Add index for faster searching
        await db.query(`CREATE INDEX IF NOT EXISTS idx_brand_silhouettes_brand_apparel_fit ON brand_silhouettes(brand_id, apparel_id, fit_id);`);
        console.log('Index created successfully.');

    } catch (e) {
        console.error('Error creating table:', e);
    } finally {
        await db.close();
    }
}

createSilhouettesTable();
