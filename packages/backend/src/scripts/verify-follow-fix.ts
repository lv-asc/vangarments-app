
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config(); // fallback to .env
}

import { EntityFollowModel } from '../models/EntityFollow';
import { db } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    try {
        console.log('🔄 Starting EntityFollow Verification...');

        // 1. Create a dummy Sport ORG ID (we don't strictly need it to exist in the DB for the check constraint, 
        //    but foreign keys might matter. Let's assume for a moment we pick an existing one if possible, 
        //    or just trust the check constraint validation first).
        //    Actually, let's grab a real sport org from the DB if possible, or create a fake one if FKs are loose 
        //    (Likely FKs exist).

        // Let's try to query a sport org first.
        const sportOrgRes = await db.query("SELECT id FROM sport_orgs LIMIT 1");
        let sportOrgId = sportOrgRes.rows[0]?.id;

        if (!sportOrgId) {
            console.log('⚠️ No Sport ORG found. creating a fake ID just to test check constraints (might fail FKs)...');
            sportOrgId = uuidv4();
        } else {
            console.log(`✅ Found Sport ORG ID: ${sportOrgId}`);
        }

        // 2. Create a dummy User ID (follower)
        const userRes = await db.query("SELECT id FROM users LIMIT 1");
        let userId = userRes.rows[0]?.id;
        if (!userId) throw new Error('No users found to test with');
        console.log(`✅ Found User ID: ${userId}`);

        // 3. Attempt to Follow
        console.log('🔄 Attempting to follow Sport ORG...');

        // First, ensure we aren't already following
        await EntityFollowModel.unfollow(userId, 'user', 'sport_org', sportOrgId);

        const follow = await EntityFollowModel.follow({
            followerId: userId,
            followerType: 'user',
            entityType: 'sport_org',
            entityId: sportOrgId
        });

        console.log('✅ Follow Successful!', follow);

        // 4. Clean up
        await EntityFollowModel.unfollow(userId, 'user', 'sport_org', sportOrgId);
        console.log('✅ Cleanup Successful');

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
        console.error(error);
    } finally {
        process.exit(0);
    }
}

main();
