
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { db } from '../database/connection';

async function updateAvatar() {
    try {
        const email = 'lvicentini10@gmail.com';
        // Use jsonb_set to update just the avatarUrl within the profile JSONB column
        // However, the profile column might be a string in the DB (based on User.ts mapToUserProfile: const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;)
        // If it's JSONB, we can use jsonb_set. If it's text, we have to fetch, parse, modify, update.

        // Simplest/safest way: fetch, modify in JS, update.

        const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            console.log('User not found');
            return;
        }

        const user = res.rows[0];
        let profile = user.profile;
        if (typeof profile === 'string') {
            profile = JSON.parse(profile);
        }

        profile.avatarUrl = '/storage/images/profiles/manual_upload.jpg';

        await db.query('UPDATE users SET profile = $1 WHERE email = $2', [JSON.stringify(profile), email]);
        console.log('Avatar updated successfully');

    } catch (error) {
        console.error('Error updating avatar:', error);
    } finally {
        process.exit(0);
    }
}

updateAvatar();
