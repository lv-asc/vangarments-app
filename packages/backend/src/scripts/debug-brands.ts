
import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else
const envPath = path.join(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function debugBrands() {
    try {
        // Import DB dynamically AFTER env vars are loaded
        const { db } = await import('../database/connection');

        console.log('--- Debugging Brands ---');

        console.log('Checking VUFS connection...');
        const vufsCount = await db.query('SELECT COUNT(*) FROM vufs_brands');
        console.log(`VUFS Brands Count: ${vufsCount.rows[0].count}`);

        console.log('Checking Brand Accounts...');
        const accountsCount = await db.query('SELECT COUNT(*) FROM brand_accounts');
        console.log(`Brand Accounts Count: ${accountsCount.rows[0].count}`);

        if (parseInt(accountsCount.rows[0].count) > 0) {
            // Inspect the actual rows
            const brands = await db.query('SELECT id, brand_info, user_id, verification_status, deleted_at FROM brand_accounts LIMIT 5');
            console.log('Sample Brand Accounts:');
            brands.rows.forEach(b => {
                console.log('--------------------------------------------------');
                console.log(`ID: ${b.id}`);
                console.log(`Deleted At: ${b.deleted_at}`);
                console.log(`Type in Info: ${b.brand_info.businessType}`);
            });
        } else {
            console.log('No brand accounts found. Sync definitely failed or empty.');
        }

        console.log('\n--- Testing Model Logic ---');
        const { BrandAccountModel } = await import('../models/BrandAccount');

        console.log('Calling BrandAccountModel.findMany({ businessType: "brand" })...');
        const result = await BrandAccountModel.findMany({ businessType: 'brand' }, 5, 0);
        console.log(`Model returned ${result.brands.length} brands`);
        console.log(`Total count: ${result.total}`);

        if (result.brands.length > 0) {
            console.log('First returned brand:', result.brands[0].id, result.brands[0].brandInfo.name);
        } else {
            console.log('Model returned NO brands. Use debug output to see why.');
        }

        console.log('\n--- Checking Specific ID: 0894ffc2-9824-441d-af6b-e2472e1f0571 ---');
        const specificId = '0894ffc2-9824-441d-af6b-e2472e1f0571';

        // Check in brand_accounts
        const specificBrand = await db.query('SELECT * FROM brand_accounts WHERE id = $1', [specificId]);
        if (specificBrand.rows.length > 0) {
            console.log('Found in brand_accounts:', specificBrand.rows[0].brand_info.name);
            console.log('Deleted At:', specificBrand.rows[0].deleted_at);
            console.log('Owner ID:', specificBrand.rows[0].user_id);
        } else {
            console.log('Not found in brand_accounts.');
        }

        // Check in vufs_brands (just in case)
        try {
            const specificVufs = await db.query('SELECT * FROM vufs_brands WHERE id = $1', [specificId]);
            if (specificVufs.rows.length > 0) {
                console.log('Found in vufs_brands (as UUID):', specificVufs.rows[0].name);
            } else {
                console.log('Not found in vufs_brands (as UUID).');
            }
        } catch (e) {
            console.log('Not a valid UUID for vufs_brands or table structure differs.');
        }

    } catch (error) {
        console.error('Debug script failed:', error);
    } finally {
        process.exit();
    }
}

debugBrands();
