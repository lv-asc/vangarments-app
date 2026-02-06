
import { db } from '../database/connection';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

async function inspectCategoryHierarchy() {
    try {
        const ownerId = '6a0b5116-8b9c-4ea9-97c5-8cb7b484699a'; // Leandro
        const query = `
            SELECT id, category_hierarchy 
            FROM vufs_items 
            WHERE owner_id = $1 AND deleted_at IS NULL
        `;
        const result = await db.query(query, [ownerId]);
        console.log('--- Category Hierarchy Inspection ---');
        result.rows.forEach(row => {
            console.log(`Item ID: ${row.id}`);
            console.log(`Hierarchy: ${JSON.stringify(row.category_hierarchy, null, 2)}`);
        });
    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
}

inspectCategoryHierarchy();
