import * as dotenv from 'dotenv';
dotenv.config();
import { db } from './src/database/connection';

async function fixAurora() {
    try {
        const wrongBrandId = '92d5e280-6e5a-49f4-95fa-0690ff85a960';
        const correctBrandId = '7173af7c-90b3-4013-a7ba-016a3450c73e';

        console.log('Fixing Aurora Collection...');
        const result = await db.query(
            `UPDATE brand_collections 
         SET brand_id = $1 
         WHERE name ILIKE '%Aurora%' AND brand_id = $2
         RETURNING id, name, brand_id`,
            [correctBrandId, wrongBrandId]
        );

        if ((result.rowCount || 0) > 0) {
            console.log('SUCCESS: Aurora collection re-linked to Vivid Asc.', result.rows[0]);
        } else {
            console.log('WARNING: No collection updated. Maybe it was already fixed or IDs do not match.');
        }

    } catch (error) {
        console.error('Error fixing collection:', error);
    } finally {
        await db.close();
    }
}

fixAurora();
