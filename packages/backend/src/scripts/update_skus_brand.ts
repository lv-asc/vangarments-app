
import 'dotenv/config';
import { db } from '../database/connection';

async function updateAndVerify() {
    try {
        // 1. Find Vivid Asc Brand ID from brands table
        const brandRes = await db.query("SELECT id, name FROM brands WHERE name ILIKE 'Vivid Asc%'");
        if (brandRes.rows.length === 0) {
            console.log('Brand "Vivid Asc" not found in brands');
            return;
        }
        const brandTableId = brandRes.rows[0].id;
        const brandTableName = brandRes.rows[0].name;
        console.log('Found ID in brands table:', brandTableId, 'Name:', brandTableName);

        // 2. Find matching Brand Account
        const accountRes = await db.query(
            "SELECT id, brand_info->>'name' as account_name FROM brand_accounts WHERE brand_info->>'name' = $1",
            [brandTableName]
        );
        if (accountRes.rows.length === 0) {
            console.log('No brand_account found with name:', brandTableName);
        } else {
            console.log('Found Brand Account ID:', accountRes.rows[0].id, 'Name:', accountRes.rows[0].account_name);
        }

        // 3. Update SKUs to use the Brand Account ID (this is what the Admin UI expects)
        // Note: We might need to handle the FK if it's strictly on the 'brands' table.
        // Let's check the FK constraint first if possible, or just try the update.
        if (accountRes.rows.length > 0) {
            const accountId = accountRes.rows[0].id;
            console.log('Attempting to update SKUs to Brand Account ID:', accountId);
            try {
                const updateRes = await db.query(
                    'UPDATE sku_items SET brand_id = $1 WHERE brand_id = $2 OR name ILIKE $3',
                    [accountId, brandTableId, '%Asphalt T-Shirt%']
                );
                console.log('UPDATE SUCCESS! Rows updated:', updateRes.rowCount);
            } catch (err) {
                console.error('Update failed. This is likely because the brand_id column enforces a FK to the BRANDS table, not BRAND_ACCOUNTS.');
                console.error('Error detail:', err.detail);

                console.log('\nPROPOSED FIX: We need to find the Brand ID in the BRANDS table that corresponds to the Brand Account being used in the UI.');
            }
        }

        // 3. Final Verification
        const verifyRes = await db.query(`
            SELECT count(*) 
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            WHERE si.deleted_at IS NULL
        `);
        console.log('SKUs with valid Brands count after update:', verifyRes.rows[0].count);

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

updateAndVerify();
