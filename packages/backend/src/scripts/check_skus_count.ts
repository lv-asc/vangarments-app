
import 'dotenv/config';
import { db } from '../database/connection';

async function checkCount() {
    try {
        const skuCount = await db.query('SELECT count(*) FROM sku_items WHERE deleted_at IS NULL');
        console.log('Total SKU Items (including variants):', skuCount.rows[0].count);

        const parentSkuCount = await db.query('SELECT count(*) FROM sku_items WHERE parent_sku_id IS NULL AND deleted_at IS NULL');
        console.log('Unique "Items" (Parent SKUs):', parentSkuCount.rows[0].count);

        const variantCount = await db.query('SELECT count(*) FROM sku_items WHERE parent_sku_id IS NOT NULL AND deleted_at IS NULL');
        console.log('Total Variants (Child SKUs):', variantCount.rows[0].count);

        const brandCount = await db.query('SELECT count(*) FROM brand_accounts WHERE deleted_at IS NULL');
        console.log('Active Brand Accounts count:', brandCount.rows[0].count);

        const joinCheck = await db.query(`
            SELECT count(*) 
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
        `);
        console.log('SKUs with valid Brands count:', joinCheck.rows[0].count);

        // Check if there are SKUs with brand_ids that do not exist in brand_accounts
        const orphanedSkus = await db.query(`
            SELECT si.id, si.name, si.brand_id
            FROM sku_items si
            LEFT JOIN brand_accounts ba ON si.brand_id = ba.id
            WHERE ba.id IS NULL
        `);

        if (orphanedSkus.rows.length > 0) {
            console.log('Orphaned SKUs (brand_id not found in brand_accounts):', orphanedSkus.rows.length);
            console.log('Sample orphaned SKU:', orphanedSkus.rows[0]);
        } else {
            console.log('No orphaned SKUs found.');
        }

    } catch (e) {
        console.error('Error checking counts:', e);
    } finally {
        await db.close();
    }
}

checkCount();
