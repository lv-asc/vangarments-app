import 'dotenv/config';
import { db } from '../database/connection';

async function identifyDuplicates() {
    try {
        console.log('--- Checking for cross-ID duplicates in brand_lines ---');
        // This query finds lines with the same name that belong to the same "canonical" brand
        // We consider the vufs_brand_id as canonical if it exists, otherwise the account ID
        const linesRes = await db.query(`
            WITH canonical_brands AS (
                SELECT id, COALESCE(vufs_brand_id, id) as canonical_id, brand_info->>'name' as brand_name
                FROM brand_accounts
            ),
            line_canonical AS (
                SELECT bl.*, cb.canonical_id, cb.brand_name
                FROM brand_lines bl
                JOIN canonical_brands cb ON bl.brand_id = cb.id OR bl.brand_id = cb.canonical_id
                WHERE bl.deleted_at IS NULL
            )
            SELECT name, canonical_id, brand_name, count(*), array_agg(id) as ids, array_agg(brand_id) as brand_ids
            FROM line_canonical
            GROUP BY name, canonical_id, brand_name
            HAVING count(*) > 1
        `);
        console.log(`Found ${linesRes.rows.length} duplicate groups in brand_lines.`);
        linesRes.rows.forEach(r => {
            console.log(`- "${r.name}" for brand "${r.brand_name}" (${r.canonical_id}): ${r.count} instances. IDs: ${r.ids.join(', ')}`);
        });

        console.log('\n--- Checking for cross-ID duplicates in brand_collections ---');
        const collectionsRes = await db.query(`
            WITH canonical_brands AS (
                SELECT id, COALESCE(vufs_brand_id, id) as canonical_id, brand_info->>'name' as brand_name
                FROM brand_accounts
            ),
            coll_canonical AS (
                SELECT bc.*, cb.canonical_id, cb.brand_name
                FROM brand_collections bc
                JOIN canonical_brands cb ON bc.brand_id = cb.id OR bc.brand_id = cb.canonical_id
            )
            SELECT name, canonical_id, brand_name, count(*), array_agg(id) as ids, array_agg(brand_id) as brand_ids
            FROM coll_canonical
            GROUP BY name, canonical_id, brand_name
            HAVING count(*) > 1
        `);
        console.log(`Found ${collectionsRes.rows.length} duplicate groups in brand_collections.`);
        collectionsRes.rows.forEach(r => {
            console.log(`- "${r.name}" for brand "${r.brand_name}" (${r.canonical_id}): ${r.count} instances. IDs: ${r.ids.join(', ')}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

identifyDuplicates();
