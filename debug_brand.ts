import { db } from './packages/backend/src/database/connection';

async function debug() {
    try {
        const brandSlug = 'vivid-asc';
        const brandResult = await db.query('SELECT * FROM brand_accounts WHERE slug = $1 OR id::text = $1 OR vufs_brand_id = $1', [brandSlug]);
        console.log('Brand Account:', JSON.stringify(brandResult.rows, null, 2));

        if (brandResult.rows.length > 0) {
            const brandId = brandResult.rows[0].id;
            const collectionsResult = await db.query('SELECT * FROM brand_collections WHERE brand_id = $1', [brandId]);
            console.log('Collections:', JSON.stringify(collectionsResult.rows, null, 2));
        }
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        process.exit();
    }
}

debug();
