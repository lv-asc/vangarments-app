import '../env'; // Load env vars first
import { db } from '../database/connection';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../database/migrations/create_vufs_brand_attributes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying migration...');
        await db.query(sql);
        console.log('Migration applied successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
