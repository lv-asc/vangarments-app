
import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        console.log('--- 1. Vivid Asc. Analysis ---');
        // Find Vivid Asc
        const vividRes = await db.query(`SELECT id, user_id, brand_info->>'name' as name FROM brand_accounts WHERE brand_info->>'name' ILIKE '%Vivid Asc%'`);

        if (vividRes.rows.length === 0) {
            console.log('Vivid Asc. not found.');
        } else {
            const vivid = vividRes.rows[0];
            console.log('Brand Found:', vivid);

            // Check Team Members
            const teamRes = await db.query(`SELECT * FROM brand_team_members WHERE brand_id = $1`, [vivid.id]);
            console.log(`Team Members Count: ${teamRes.rows.length}`);
            console.log('Team Members:', teamRes.rows);
        }

        console.log('\n--- 2. Duplicate Vangarments Analysis ---');
        const vangarmentsRes = await db.query(`
            SELECT id, user_id, 
                   brand_info->>'name' as name, 
                   brand_info->>'businessType' as type, 
                   created_at 
            FROM brand_accounts 
            WHERE brand_info->>'name' ILIKE '%Vangarments%'
        `);
        console.log('Vangarments Entities:', vangarmentsRes.rows);

        // Check if user exists (to assign ownership if needed)
        const userRes = await db.query(`SELECT id, email FROM users WHERE email = 'lvicentini10@gmail.com'`);
        if (userRes.rows.length > 0) {
            console.log('\nUser Found:', userRes.rows[0]);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await db.close();
    }
}

run();
