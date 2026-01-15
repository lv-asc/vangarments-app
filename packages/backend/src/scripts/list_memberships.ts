
import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        const userId = '6a0b5116-8b9c-4ea9-97c5-8cb7b484699a'; // Leandro's ID

        console.log(`Checking memberships for User: ${userId}`);

        const res = await db.query(`
            SELECT btm.id as membership_id, 
                   btm.brand_id, 
                   btm.roles, 
                   ba.brand_info->>'name' as brand_name,
                   ba.brand_info->>'businessType' as brand_type
            FROM brand_team_members btm
            LEFT JOIN brand_accounts ba ON btm.brand_id = ba.id
            WHERE btm.user_id = $1
        `, [userId]);

        console.log('Memberships found:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await db.close();
    }
}
run();
