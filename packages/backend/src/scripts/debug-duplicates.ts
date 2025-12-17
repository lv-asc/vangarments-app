import { db } from '../database/connection';

async function verifyDuplicates() {
    try {
        console.log('Checking for brands with name like Vivid Asc...');

        // Search by name
        const res = await db.query(`SELECT id, brand_info, created_at FROM brand_accounts WHERE brand_info->>'name' ILIKE '%Vivid Asc%'`);

        console.log(`Found ${res.rows.length} records.`);
        res.rows.forEach((row, i) => {
            console.log(`--- Record ${i + 1} ---`);
            console.log('ID:', row.id);
            console.log('Name:', row.brand_info.name);
            console.log('Slug:', row.brand_info.slug);
            console.log('Created At:', row.created_at);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

verifyDuplicates();
