
import 'dotenv/config';
import { db } from '../database/connection';

async function migrate() {
    try {
        console.log('Adding size_ids and measurements to brand_silhouettes...');

        // Add size_ids column (array of UUIDs)
        await db.query(`
            ALTER TABLE brand_silhouettes 
            ADD COLUMN IF NOT EXISTS size_ids UUID[] DEFAULT '{}';
        `);

        // Add measurements column (JSONB for size-specific values)
        await db.query(`
            ALTER TABLE brand_silhouettes 
            ADD COLUMN IF NOT EXISTS measurements JSONB DEFAULT '{}';
        `);

        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await db.close();
    }
}

migrate();
