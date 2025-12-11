import 'dotenv/config';
import { db } from '../database/connection';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    try {
        // Migration 1: create_vufs_custom_attributes.sql
        const customAttributesMigrationPath = path.join(__dirname, '../database/migrations/create_vufs_custom_attributes.sql');
        const customAttributesSql = fs.readFileSync(customAttributesMigrationPath, 'utf-8');

        console.log('Applying migration: create_vufs_custom_attributes.sql...');
        await db.query(customAttributesSql);
        console.log('Migration create_vufs_custom_attributes.sql applied successfully.');

        // Migration 2: create_vufs_category_attributes.sql
        const categoryAttributesMigrationPath = path.join(__dirname, '../database/migrations/create_vufs_category_attributes.sql');
        const categoryAttributesSql = fs.readFileSync(categoryAttributesMigrationPath, 'utf-8');

        console.log('Applying migration: create_vufs_category_attributes.sql...');
        await db.query(categoryAttributesSql);
        console.log('Migration create_vufs_category_attributes.sql applied successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

runMigration();
