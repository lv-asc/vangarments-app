import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env vars from backend package
const envPath = path.join(process.cwd(), 'packages/backend/.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function runMigration() {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { db } = await import('./packages/backend/src/database/connection');

        const sqlPath = path.join(process.cwd(), 'packages/backend/src/database/migrations/add_sku_ref_to_attribute_values.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
