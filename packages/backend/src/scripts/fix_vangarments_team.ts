import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        const userId = '6a0b5116-8b9c-4ea9-97c5-8cb7b484699a';
        const ghostBrandId = '92d5e280-6e5a-49f4-95fa-0690ff85a960';
        const vangarmentsBrandId = '099606c8-38eb-4108-b4fb-1c1cebb907d6';

        console.log('--- Fixing Vangarments Team Memberships ---\n');

        // 1. Delete ghost membership
        console.log(`Step 1: Deleting ghost membership for brand ID: ${ghostBrandId}`);
        const deleteResult = await db.query(
            'DELETE FROM brand_team_members WHERE brand_id = $1 AND user_id = $2',
            [ghostBrandId, userId]
        );
        console.log(`✓ Deleted ${deleteResult.rowCount} ghost record(s).\n`);

        // 2. Check if Vangarments exists in brands table
        console.log(`Step 2: Checking if Vangarments exists in brands table...`);
        const brandsCheck = await db.query('SELECT id, name FROM brands WHERE id = $1', [vangarmentsBrandId]);

        if (brandsCheck.rows.length === 0) {
            console.log(`Vangarments not found in brands table. Creating entry...`);
            // Get data from brand_accounts
            const baData = await db.query('SELECT brand_info FROM brand_accounts WHERE id = $1', [vangarmentsBrandId]);
            const brandInfo = baData.rows[0]?.brand_info;

            await db.query(`
                INSERT INTO brands (id, name, slug, logo_url, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [
                vangarmentsBrandId,
                brandInfo?.name || 'Vangarments®',
                brandInfo?.slug || 'vangarments',
                brandInfo?.logo || null,
                brandInfo?.description || 'Official Vangs. App Second Hand Curator'
            ]);
            console.log(`✓ Created Vangarments entry in brands table.\n`);
        } else {
            console.log(`✓ Vangarments already exists in brands table.\n`);
        }

        // 3. Check if user is already in Vangarments team
        console.log(`Step 3: Adding user to Vangarments team...`);
        const checkResult = await db.query(
            'SELECT * FROM brand_team_members WHERE brand_id = $1 AND user_id = $2',
            [vangarmentsBrandId, userId]
        );

        if (checkResult.rows.length === 0) {
            await db.query(`
                INSERT INTO brand_team_members (brand_id, user_id, roles, title, is_public, joined_at, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
            `, [vangarmentsBrandId, userId, ['Owner', 'Founder'], 'Owner', true]);
            console.log('✓ User added to Vangarments team.\n');
        } else {
            console.log('✓ User already in Vangarments team. Skipping.\n');
        }

        // 4. Verify final state
        console.log('--- Final Membership State ---');
        const finalResult = await db.query(`
            SELECT btm.id as membership_id, 
                   btm.brand_id, 
                   btm.roles, 
                   ba.brand_info->>'name' as brand_name,
                   ba.brand_info->>'businessType' as brand_type
            FROM brand_team_members btm
            LEFT JOIN brand_accounts ba ON btm.brand_id = ba.id
            WHERE btm.user_id = $1
        `, [userId]);

        console.log(`Total memberships: ${finalResult.rows.length}`);
        finalResult.rows.forEach(row => {
            console.log(`  - ${row.brand_name || 'Unknown'} (${row.brand_type || 'brand'})`);
        });

        console.log('\n✅ Fix completed successfully!');
        console.log('\nNext: Please refresh your profile page to verify the changes.');

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await db.close();
    }
}

run();
