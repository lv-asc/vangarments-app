
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { db } from '../database/connection';
import fs from 'fs';

async function verifyState() {
    try {
        const email = 'lvicentini10@gmail.com';
        console.log(`Checking DB for ${email}...`);
        const res = await db.query('SELECT id, email, profile, roles FROM users WHERE email = $1', [email]);

        if (res.rows.length === 0) {
            console.log('User not found');
            fs.writeFileSync('user_state_debug.txt', 'User not found');
            return;
        }

        const user = res.rows[0];
        const output = {
            id: user.id,
            email: user.email,
            profile_column_type: typeof user.profile,
            profile_content: user.profile,
            roles_column: user.roles // Check if roles are here or in a separate table? User model implies separate table usually but check row.
        };

        // Also check user_roles table if it exists
        const rolesRes = await db.query('SELECT * FROM user_roles WHERE user_id = $1', [user.id]);
        const rolesData = rolesRes.rows;

        const fullDebug = {
            user_table: output,
            user_roles_table: rolesData
        };

        console.log(JSON.stringify(fullDebug, null, 2));
        fs.writeFileSync('/tmp/user_state.json', JSON.stringify(fullDebug, null, 2));

    } catch (error) {
        console.error('Error verifying state:', error);
        fs.writeFileSync('/tmp/user_state_err.txt', `ERROR: ${error}`);
    } finally {
        process.exit(0);
    }
}

verifyState();
