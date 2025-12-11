
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';


dotenv.config();


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const logPath = '/tmp/restore_v2.log';
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logPath, msg + '\n');
    };

    try {
        log('Starting restoration v2...');
        const email = 'lvicentini10@gmail.com';

        // 1. Check current state
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            log('User not found!');
            return;
        }
        const user = res.rows[0];
        log(`Current Profile: ${JSON.stringify(user.profile)}`);

        // 2. Prepare update
        let profile = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile || {};

        // FORCE overwrite critical fields
        profile.name = "vvd boy 17";
        profile.avatarUrl = "/storage/images/profiles/manual_upload.jpg";
        profile.socialLinks = [
            { platform: 'Instagram', url: 'https://www.instagram.com/lv.asc' },
            { platform: 'YouTube', url: 'https://www.youtube.com/@lv.mvicentini' },
            { platform: 'Snapchat', url: 'xlvicentinix' },
            { platform: 'Pinterest', url: 'https://pin.it/5udi6yDD4' },
            { platform: 'TikTok', url: 'https://www.tiktok.com/@lv.asc' },
            { platform: 'Facebook', url: 'https://web.facebook.com/profile.php?id=100094744442313' },
            { platform: 'YouTube Music', url: 'https://music.youtube.com/@lv.mvicentini' }
        ];

        log(`New Profile Payload: ${JSON.stringify(profile)}`);

        // 3. Execute Update
        await pool.query('UPDATE users SET profile = $1 WHERE email = $2', [JSON.stringify(profile), email]);

        // 4. Roles
        const roles = [
            'common_user',
            'influencer',
            'brand_owner',
            'stylist',
            'independent_reseller',
            'store_owner',
            'fashion_designer'
        ];

        // 4.1 Delete existing roles
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [user.id]);

        // 4.2 Insert new roles
        for (const role of roles) {
            await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [user.id, role]);
        }
        log('Roles updated.');

        log('Restoration V2 Complete.');

    } catch (e) {
        log(`ERROR: ${e}`);
    } finally {
        pool.end();
        process.exit(0);
    }
}

run();
