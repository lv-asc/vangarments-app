
import { db } from '../database/connection';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'packages/backend/.env.development' });

async function checkCategories() {
    try {
        const types = await db.query('SELECT slug, name FROM vufs_attribute_types WHERE slug IN ($1, $2, $3, $4)', ['subcategory-1', 'subcategory-2', 'subcategory-3', 'apparel']);
        console.log('Attribute Types:', JSON.stringify(types.rows, null, 2));

        const cats = await db.query('SELECT id, name, parent_id FROM vufs_categories LIMIT 5');
        console.log('Categories:', JSON.stringify(cats.rows, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        process.exit();
    }
}

checkCategories();
