
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(process.cwd(), 'packages/backend/.env') });

async function checkCollections() {
    const { db } = await import('./packages/backend/src/database/connection');
    try {
        const res = await db.query(`SELECT * FROM brand_collections WHERE name ILIKE '%Aurora%'`);
        console.log('Collections matching Aurora:', res.rows);

        if (res.rows.length > 0) {
            const brandId = res.rows[0].brand_id;
            console.log('Brand ID for Aurora:', brandId);

            const brandRes = await db.query(`SELECT * FROM brand_accounts WHERE id = $1`, [brandId]);
            console.log('Brand for Aurora:', brandRes.rows[0]?.brand_info);
        }

        const skuRes = await db.query(`SELECT id, brand_id, collection FROM sku_items WHERE code LIKE '%aurora%' LIMIT 1`);
        console.log('SKU Sample:', skuRes.rows[0]);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkCollections();
