
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { db } from '../database/connection';
import { UserModel } from '../models/User';

async function restoreProfile() {
    try {
        const email = 'lvicentini10@gmail.com';
        const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.log('User not found');
            return;
        }

        const user = res.rows[0];
        let profile = typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile || {};

        // Restore data from screenshots
        profile.name = "vvd boy 17"; // Inferred from screenshot 1
        profile.avatarUrl = '/storage/images/profiles/manual_upload.jpg'; // Manual upload
        // Bio seems empty in screenshot 1 placeholder

        const socialLinks = [
            { platform: 'Instagram', url: 'https://www.instagram.com/lv.asc' },
            { platform: 'YouTube', url: 'https://www.youtube.com/@lv.mvicentini' },
            { platform: 'Snapchat', url: 'xlvicentinix' },
            { platform: 'Pinterest', url: 'https://pin.it/5udi6yDD4' },
            { platform: 'TikTok', url: 'https://www.tiktok.com/@lv.asc' },
            { platform: 'Facebook', url: 'https://web.facebook.com/profile.php?id=100094744442313' },
            { platform: 'YouTube Music', url: 'https://music.youtube.com/@lv.mvicentini' }
        ];

        // Update profile and social links in the JSON (schema might store socialLinks outside profile? check User model)
        // User model: socialLinks is usually mapped from profile or separate table?
        // In UserModel.update: ...(updateData.socialLinks && { socialLinks: updateData.socialLinks }) -> merged into profile JSON.
        // So socialLinks are inside the profile JSONb column.

        profile.socialLinks = socialLinks;

        // Roles
        // Screenshot 1 selected: Common User, Influencer, Brand Owner, Supplier (unchecked?), Stylist, Independent Reseller, Store Owner, Fashion Designer.
        // Screenshot 3 has them as badges/tags.
        // Roles are stored in user_roles table usually, handled by UserModel.setRoles.
        const roles = [
            'common_user',
            'influencer',
            'brand_owner',
            'stylist',
            'independent_reseller',
            'store_owner',
            'fashion_designer'
        ];


        // Update simple profile fields
        await db.query('UPDATE users SET profile = $1 WHERE email = $2', [JSON.stringify(profile), email]);

        // Update roles using UserModel (it handles the table)
        await UserModel.setRoles(user.id, roles);

        console.log('Profile restored successfully');

    } catch (error) {
        console.error('Error restoring profile:', error);
    } finally {
        process.exit(0);
    }
}

restoreProfile();
