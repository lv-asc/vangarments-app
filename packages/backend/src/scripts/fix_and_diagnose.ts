
import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        const userId = '6a0b5116-8b9c-4ea9-97c5-8cb7b484699a'; // Leandro's ID

        console.log('--- 1. Fixing Vivid Asc. Ownership & Team ---');
        // 1. Get Vivid Asc ID
        const vividRes = await db.query(`SELECT id FROM brand_accounts WHERE brand_info->>'name' ILIKE '%Vivid Asc%'`);

        if (vividRes.rows.length > 0) {
            const brandId = vividRes.rows[0].id;
            console.log(`Found Vivid Asc. ID: ${brandId}`);

            // 2. Update Owner
            await db.query(`UPDATE brand_accounts SET user_id = $1 WHERE id = $2`, [userId, brandId]);
            console.log('Updated brand_accounts user_id.');

            // 3. Add to Team (if not exists)
            const teamCheck = await db.query(`SELECT 1 FROM brand_team_members WHERE brand_id = $1 AND user_id = $2`, [brandId, userId]);
            if (teamCheck.rows.length === 0) {
                await db.query(`
                    INSERT INTO brand_team_members (brand_id, user_id, roles, title, is_public, joined_at, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
                `, [brandId, userId, ['Founder', 'CEO'], 'Owner', true]);
                console.log('Added user to brand_team_members.');
            } else {
                console.log('User already in brand_team_members.');
            }
        } else {
            console.log('Vivid Asc. not found!');
        }

        console.log('\n--- 2. Checking for Duplicate Entites (Stores/Non-Profits) ---');

        // Check Stores table
        try {
            const storesRes = await db.query(`SELECT * FROM stores WHERE name ILIKE '%Vangarments%'`);
            console.log('In `stores` table:', storesRes.rows);
        } catch (e) {
            console.log('Could not query `stores` table (might not exist or different schema).');
        }

        // Check Non-Profits table
        try {
            const npRes = await db.query(`SELECT * FROM non_profits WHERE name ILIKE '%Vangarments%'`);
            console.log('In `non_profits` table:', npRes.rows);
        } catch (e) {
            console.log('Could not query `non_profits` table.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await db.close();
    }
}

run();
