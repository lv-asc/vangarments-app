import 'dotenv/config';
import { db } from '../database/connection';

async function cleanupDuplicates() {
    try {
        console.log('--- Cleaning up duplicates in brand_lines ---');

        // 1. Identify groups of duplicates
        const linesGroupsRes = await db.query(`
            WITH canonical_brands AS (
                SELECT id, COALESCE(vufs_brand_id, id) as canonical_id, brand_info->>'name' as brand_name
                FROM brand_accounts
            ),
            line_canonical AS (
                SELECT bl.id, bl.name, bl.brand_id, cb.canonical_id, cb.brand_name
                FROM brand_lines bl
                JOIN canonical_brands cb ON bl.brand_id = cb.id OR bl.brand_id = cb.canonical_id
                WHERE bl.deleted_at IS NULL
            )
            SELECT name, canonical_id, array_agg(id ORDER BY (CASE WHEN brand_id = canonical_id THEN 0 ELSE 1 END), id) as ids
            FROM line_canonical
            GROUP BY name, canonical_id
            HAVING count(*) > 1
        `);

        console.log(`Found ${linesGroupsRes.rows.length} duplicate groups in brand_lines.`);

        for (const group of linesGroupsRes.rows) {
            const { name, ids } = group;
            const canonicalId = ids[0];
            const duplicateIds = ids.slice(1);

            console.log(`Consolidating "${name}": Picking ${canonicalId} as canonical. Removing ${duplicateIds.join(', ')}`);

            // 2. Update SKUs to point to canonical ID
            const skuUpdate = await db.query(`
                UPDATE sku_items 
                SET line_id = $1 
                WHERE line_id = ANY($2)
            `, [canonicalId, duplicateIds]);
            console.log(`  - Updated ${skuUpdate.rowCount} SKUs.`);

            // 3. Physically delete the duplicates
            const deleteRes = await db.query(`
                DELETE FROM brand_lines 
                WHERE id = ANY($1)
            `, [duplicateIds]);
            console.log(`  - Deleted ${deleteRes.rowCount} redundant line records.`);
        }

        console.log('\n--- Cleaning up duplicates in brand_collections ---');
        // Note: Earlier check showed 0 duplicates in collections, but keeping logic for completeness
        const collectionsGroupsRes = await db.query(`
            WITH canonical_brands AS (
                SELECT id, COALESCE(vufs_brand_id, id) as canonical_id, brand_info->>'name' as brand_name
                FROM brand_accounts
            ),
            coll_canonical AS (
                SELECT bc.id, bc.name, bc.brand_id, cb.canonical_id, cb.brand_name
                FROM brand_collections bc
                JOIN canonical_brands cb ON bc.brand_id = cb.id OR bc.brand_id = cb.canonical_id
            )
            SELECT name, canonical_id, array_agg(id ORDER BY (CASE WHEN brand_id = canonical_id THEN 0 ELSE 1 END), id) as ids
            FROM coll_canonical
            GROUP BY name, canonical_id
            HAVING count(*) > 1
        `);

        console.log(`Found ${collectionsGroupsRes.rows.length} duplicate groups in brand_collections.`);

        for (const group of collectionsGroupsRes.rows) {
            const { name, ids } = group;
            const canonicalId = ids[0];
            const duplicateIds = ids.slice(1);

            console.log(`Consolidating "${name}": Picking ${canonicalId} as canonical. Removing ${duplicateIds.join(', ')}`);

            // Update collection items to point to canonical collection
            await db.query(`
                UPDATE brand_collection_items 
                SET collection_id = $1 
                WHERE collection_id = ANY($2)
                ON CONFLICT (collection_id, item_id) DO NOTHING
            `, [canonicalId, duplicateIds]);

            // Update lookbooks
            await db.query(`
                UPDATE brand_lookbooks 
                SET collection_id = $1 
                WHERE collection_id = ANY($2)
            `, [canonicalId, duplicateIds]);

            // Update SKUs metadata/collection if needed? 
            // In sku_items, collection is usually a string, but sometimes we might store collection_id in metadata.
            // Based on earlier code, we usually match by name string in sku_items.

            const deleteRes = await db.query(`
                DELETE FROM brand_collections 
                WHERE id = ANY($1)
            `, [duplicateIds]);
            console.log(`  - Deleted ${deleteRes.rowCount} redundant collection records.`);
        }

        console.log('\nCleanup completed successully.');

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        process.exit();
    }
}

cleanupDuplicates();
