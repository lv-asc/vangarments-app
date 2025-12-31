
import { UserModel } from '../models/User';
import { BrandAccountModel } from '../models/BrandAccount';
import { db } from '../database/connection';

async function verifyUserAndEntities() {
    try {
        console.log('Starting manual verification...');

        // 1. Verify User "lv"
        // Try finding by username first (assuming username is stored correctly or we can find by email) 
        // Based on AuthController, username is in personalInfo or root? 
        // UserModel.findByEmail('lv@vangarments.com')? Or find by query.

        // Let's try to find by username if possible, or list users to find "lv"
        // Actually, I'll use a raw query to find user where username = 'lv' or email starts with 'lv'
        const userRes = await db.query("SELECT * FROM users WHERE username = 'v'");

        if (userRes.rows.length > 0) {
            const user = userRes.rows[0];
            await UserModel.updateVerificationStatus(user.id, 'verified');
            console.log(`✅ Verified User: ${user.username || user.email} (${user.id})`);
        } else {
            console.log('❌ User "lv" not found');
        }

        // 2. Verify Entities "Vangarments" and "Vivid Asc."
        // I need to search inside the brand_info JSONB column
        // Query: SELECT * FROM brand_accounts WHERE brand_info->>'name' ILIKE 'Vangarments%'

        const entitiesToVerify = ['Vangarments', 'Vivid Asc.'];

        for (const name of entitiesToVerify) {
            // Flexible matching
            const res = await db.query(
                "SELECT * FROM brand_accounts WHERE brand_info->>'name' ILIKE $1",
                [`%${name}%`]
            );

            if (res.rows.length > 0) {
                for (const entity of res.rows) {
                    await BrandAccountModel.update(entity.id, { verificationStatus: 'verified' });
                    const brandName = entity.brand_info.name;
                    console.log(`✅ Verified Entity: ${brandName} (${entity.id})`);
                }
            } else {
                console.log(`❌ Entity "${name}" not found`);
            }
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        process.exit();
    }
}

verifyUserAndEntities();
