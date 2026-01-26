import * as dotenv from 'dotenv';
dotenv.config();
import { db } from './src/database/connection';

async function debugCollections() {
    try {
        console.log('Searching for collection "Aurora"...');
        const aurora = await db.query(`SELECT * FROM brand_collections WHERE name ILIKE '%Aurora%'`);
        console.log('Aurora Collections found:', aurora.rows);

        console.log('Searching for brand "Vivid Asc."...');
        const vivid = await db.query(`SELECT id, brand_info->>'name' as name, brand_info->>'slug' as slug FROM brand_accounts WHERE brand_info->>'name' ILIKE '%Vivid Asc.%'`);
        console.log('Vivid Asc. Brand found:', vivid.rows);

        if (vivid.rows.length > 0 && aurora.rows.length > 0) {
            const brandId = vivid.rows[0].id;
            const collection = aurora.rows[0];
            console.log(`Checking if Aurora collection (Brand ID: ${collection.brand_id}) matches Vivid Asc. Brand ID (${brandId})`);

            if (collection.brand_id !== brandId) {
                console.log('MISMATCH DETECTED: Collection is linked to a different brand.');

                // Check what that other brand is
                const otherBrand = await db.query(`SELECT id, brand_info->>'name' as name FROM brand_accounts WHERE id = $1`, [collection.brand_id]);
                console.log('Collection is linked to:', otherBrand.rows[0]);
            } else {
                console.log('Association seems correct in DB.');
            }
        }

    } catch (error) {
        console.error('Error debugging:', error);
    } finally {
        await db.close();
    }
}

debugCollections();
