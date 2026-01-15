
import 'dotenv/config';
import { db } from '../database/connection';

async function fixBrandLink() {
    try {
        console.log('--- Database Consistency Fix (ID Synchronization) ---');

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

        // 2. See what Brand ID the SKUs are currently using (the orphaned ID)
        const skuRes = await db.query("SELECT DISTINCT brand_id FROM sku_items WHERE name ILIKE '%Asphalt T-Shirt%' OR brand_id = '92d5e280-6e5a-49f4-95fa-0690ff85a960'");
        const orphanedId = skuRes.rows[0]?.brand_id || '92d5e280-6e5a-49f4-95fa-0690ff85a960';
        console.log('Current (orphaned) SKU brand_id:', orphanedId);

        // 3. The Fix Strategy: 
        // a. Create a brand record in the 'brands' table with the accountId IF it doesn't exist.
        // b. Update SKUs from orphanedId to accountId.
        // c. (Optional) Cleanup the old orphaned brand record.

        console.log('\nChecking "brands" table for both IDs...');
        const checkRes = await db.query('SELECT id, name FROM brands WHERE id IN ($1, $2)', [accountId, orphanedId]);
        console.log('Records found in brands table:', checkRes.rows.length);
        checkRes.rows.forEach(r => console.log(`- ${r.name} ID: ${r.id}`));

        const hasTargetId = checkRes.rows.some(r => r.id === accountId);

        if (!hasTargetId) {
            console.log('Creating new record in "brands" table for Account ID...');
            await db.query(
                "INSERT INTO brands (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())",
                [accountId, accountName + " (Active Account)"]
            );
            console.log('Brand record created successfully.');
        }

        console.log('Updating SKUs to point to Account ID:', accountId);
        const updateRes = await db.query(
            'UPDATE sku_items SET brand_id = $1 WHERE brand_id = $2 OR name ILIKE $3',
            [accountId, orphanedId, '%Asphalt T-Shirt%']
        );
        console.log('SKUs updated successfully! Rows affected:', updateRes.rowCount);

        // 4. Verify the Join for the UI
        const verifyRes = await db.query(`
            SELECT si.name, ba.brand_info->>'name' as brand_name
            FROM sku_items si
            JOIN brand_accounts ba ON si.brand_id = ba.id
            WHERE ba.id = $1
        `, [accountId]);

        console.log('\nFinal Verification for UI:');
        console.log('SKUs visible in UI join:', verifyRes.rows.length);
        verifyRes.rows.forEach(r => console.log(`- ${r.name} (Brand: ${r.brand_name})`));

    } catch (e) {
        console.error('Execution error:', e);
    } finally {
        await db.close();
    }
}

fixBrandLink();
