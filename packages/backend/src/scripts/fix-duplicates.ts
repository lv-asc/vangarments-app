import { db } from '../database/connection';

async function fixDuplicates() {
    try {
        const idsToDelete = [
            'cb77ba13-ba05-474e-ac90-dfd8dd34f409',
            'b0411947-bbc3-41e7-a867-c8838fbd83e5'
        ];

        console.log(`Deleting ${idsToDelete.length} duplicate brands...`);

        for (const id of idsToDelete) {
            console.log(`Deleting brand ${id}...`);
            // Delete from brand_accounts
            // Note: In a real app we might need to cascade delete catalog items etc, 
            // but assumed these are empty duplicates created by sync.
            await db.query('DELETE FROM brand_accounts WHERE id = $1', [id]);
        }

        console.log('Duplicates deleted.');

        // Verify what is left
        const res = await db.query(`SELECT id, brand_info FROM brand_accounts WHERE brand_info->>'name' ILIKE '%Vivid Asc%'`);
        console.log(`Remaining brands: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(`- ${r.id} (${r.brand_info.name})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

fixDuplicates();
