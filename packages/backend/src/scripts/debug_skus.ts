
import 'dotenv/config';
import { db } from '../database/connection';

async function debugSkus() {
    try {
        console.log('--- DEBUG SKUS START ---');

        // Check VUFS Brands
        const vufsBrands = await db.query('SELECT COUNT(*) FROM vufs_brands');
        console.log('VUFS Brands:', vufsBrands.rows[0].count);

        // Run the FULL Controller Query (adapted for script)
        console.log('Running FULL Controller Query...');

        const fullQuery = `
                SELECT 
                    si.id,
                    si.name,
                    ba.brand_info->>'name' as brand_name
                FROM sku_items si
                JOIN brand_accounts ba ON si.brand_id = ba.id
                LEFT JOIN brand_lines bl ON si.line_id = bl.id
                LEFT JOIN brand_collections bc ON si.collection = bc.name 
                    AND (
                        bc.brand_id = si.brand_id
                        OR
                        bc.brand_id IN (
                            SELECT id FROM brand_accounts sub_ba 
                            WHERE sub_ba.brand_info->>'name' = ba.brand_info->>'name'
                        )
                        OR
                        bc.brand_id IN (
                            SELECT id FROM vufs_brands vb
                            WHERE vb.name = ba.brand_info->>'name'
                        )
                    )
                WHERE si.deleted_at IS NULL
                ORDER BY si.created_at DESC
                LIMIT 5
        `;

        const res = await db.query(fullQuery);
        console.log('Full Query rows:', res.rows.length);
        console.log('Full Query Sample:', JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error('Debug Error:', e);
    } finally {
        await db.close();
        console.log('--- DEBUG SKUS END ---');
    }
}

debugSkus();
