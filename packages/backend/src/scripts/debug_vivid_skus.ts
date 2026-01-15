
import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        const res = await db.query(`
            SELECT si.id, si.name, si.code, si.parent_sku_id, ba.brand_info->>'name' as brand_name
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            WHERE ba.brand_info->>'name' ILIKE '%Vivid Asc%'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}
run();
