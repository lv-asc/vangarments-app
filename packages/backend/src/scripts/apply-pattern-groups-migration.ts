import 'dotenv/config';
import { db } from '../database/connection';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../migrations/add_pattern_groups.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('Applying migration: add_pattern_groups.sql...');
        await db.query(sql);
        console.log('Migration add_pattern_groups.sql applied successfully.');

        // Verify the results
        const groupsResult = await db.query('SELECT id, emoji, name, slug FROM vufs_pattern_groups ORDER BY sort_order');
        console.log('\nCreated Pattern Groups:');
        groupsResult.rows.forEach((g: any) => {
            console.log(`  ${g.emoji} ${g.name} (${g.slug})`);
        });

        const subcatsResult = await db.query(`
            SELECT s.name, g.name as group_name 
            FROM vufs_pattern_subcategories s 
            JOIN vufs_pattern_groups g ON s.group_id = g.id 
            ORDER BY g.sort_order, s.sort_order
        `);
        console.log('\nCreated Subcategories:');
        subcatsResult.rows.forEach((s: any) => {
            console.log(`  - ${s.name} (in ${s.group_name})`);
        });

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

runMigration();
