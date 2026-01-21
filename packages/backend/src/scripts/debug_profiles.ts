import 'dotenv/config';
import { db } from '../database/connection';

async function run() {
    try {
        console.log('Searching for users Alexandre and Camila...');
        const result = await db.query(
            "SELECT id, username, profile FROM users WHERE profile->>'name' ILIKE '%alexandre%' OR profile->>'name' ILIKE '%camila%'"
        );

        console.log(`Found ${result.rows.length} users.`);
        for (const row of result.rows) {
            console.log('------------------------------------------------');
            console.log(`User: ${row.username}`);
            console.log('Profile Name:', row.profile.name);
            console.log('Profile Keys:', Object.keys(row.profile));
            console.log('profile.profilePicture:', row.profile.profilePicture);
            console.log('profile.avatarUrl:', row.profile.avatarUrl);
            console.log('profile.image:', row.profile.image);
        }
        console.log('------------------------------------------------');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

run();
