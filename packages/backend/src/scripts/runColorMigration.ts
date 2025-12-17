
import { db } from '../database/connection';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    console.log('Running migration: add_complex_colors...');
    const migrationPath = path.join(__dirname, '../database/migrations/20251217150000_add_complex_colors.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    try {
        await db.query(sql);
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
    process.exit(0);
}

runMigration();
