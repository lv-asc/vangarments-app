
import 'dotenv/config';
import { db } from '../database/connection';

async function inspect() {
    try {
        const res = await db.query(`
            SELECT id, parent_sku_id, name, code, metadata 
            FROM sku_items 
            WHERE brand_id = '7173af7c-90b3-4013-a7ba-016a3450c73e' 
            AND deleted_at IS NULL
            ORDER BY created_at ASC
        `);
        console.log('SKU_INSPECTION:', JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}

inspect();
