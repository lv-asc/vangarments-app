
import 'dotenv/config';
import { db } from '../database/connection';

async function fixBrandLink() {
    try {
        console.log('--- Database Consistency Fix (Safe Mode) ---');

        // 1. Identify the Brand Account being used in the UI
        const accountRes = await db.query(
            "SELECT id, brand_info->>'name' as account_name FROM brand_accounts WHERE brand_info->>'name' ILIKE 'Vivid Asc%'"
        );

        if (accountRes.rows.length === 0) {
            console.log('No brand_account found for Vivid Asc');
            return;
        }

        const accountId = accountRes.rows[0].id;
        const accountName = accountRes.rows[0].account_name;
        console.log('Found Brand Account:', accountName, '\nID:', accountId);

        // 2. See what Brand ID the SKUs are currently using (orphaned ID)
        const skuRes = await db.query("SELECT DISTINCT brand_id FROM sku_items WHERE name ILIKE '%Asphalt T-Shirt%' OR brand_id = '92d5e280-6e5a-49f4-95fa-0690ff85a960'");
        const orphanedId = skuRes.rows[0]?.brand_id;
        console.log('Current (orphaned) SKU brand_id:', orphanedId);

        // 3. Multi-step transaction to bypass FK catch-22
        console.log('Starting transaction for safe ID synchronization...');
        await db.transaction(async (client) => {
            // Step 1: Temporarily unlink SKUs from any brand ID
            // We set them to NULL. If the schema doesn't allow NULL, we'd use a dummy record.
            console.log('Step 1: Unlinking SKUs from old brand ID...');
            await client.query('UPDATE sku_items SET brand_id = NULL WHERE brand_id = $1 OR name ILIKE $2', [orphanedId, '%Asphalt T-Shirt%']);

            // Step 2: Ensure the brands table has a record with the correct Account ID
            const existingBrand = await client.query("SELECT id FROM brands WHERE name = $1", [accountName]);
            if (existingBrand.rows.length > 0) {
                console.log('Step 2: Updating existing brand record ID in "brands" table to match account ID...');
                await client.query("UPDATE brands SET id = $1 WHERE name = $2", [accountId, accountName]);
            } else {
                console.log('Step 2: Inserting new brand record in "brands" table linked to account ID...');
                await client.query("INSERT INTO brands (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())", [accountId, accountName]);
            }

            // Step 3: Link SKUs to the correct ID that works for both FK and UI Join
            console.log('Step 3: Relinking SKUs to the correct brand/account ID...');
            await client.query('UPDATE sku_items SET brand_id = $1 WHERE brand_id IS NULL AND name ILIKE $2', [accountId, '%Asphalt T-Shirt%']);
        });

        console.log('Transaction completed successfully!');

        // 4. Verify the Join for the UI
        const verifyRes = await db.query(`
            SELECT si.name, ba.brand_info->>'name' as brand_name
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            WHERE ba.id = $1
        `, [accountId]);

        console.log('\nVerification:');
        console.log('SKUs visible in UI join:', verifyRes.rows.length);
        verifyRes.rows.forEach(r => console.log(`- ${r.name} (Brand: ${r.brand_name})`));

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

fixBrandLink();
