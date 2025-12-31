
import { BrandTeamModel } from '../models/BrandTeam';
import { UserModel } from '../models/User';
import { db } from '../database/connection';

async function testMemberships() {
    try {
        console.log('Testing memberships query...');

        // Find user "v"
        const userRes = await db.query("SELECT * FROM users WHERE username = 'v'");
        if (userRes.rows.length === 0) {
            console.error('User v not found');
            return;
        }
        const user = userRes.rows[0];
        console.log(`Found user: ${user.username} (${user.id})`);

        // Get memberships
        const memberships = await BrandTeamModel.getUserMembershipsWithDetails(user.id);
        console.log('Memberships:', JSON.stringify(memberships, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

testMemberships();
