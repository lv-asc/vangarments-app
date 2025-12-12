
import { db } from '../database/connection';

async function grantAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address');
        console.error('Usage: npx ts-node src/scripts/grantAdmin.ts <email>');
        process.exit(1);
    }

    try {
        console.log(`Searching for user with email: ${email}`);

        // Find user
        const userRes = await db.query('SELECT id, email, profile FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            console.error('User not found!');
            process.exit(1);
        }

        const user = userRes.rows[0];
        console.log(`Found user: ${user.email} (ID: ${user.id})`);

        // Check if already admin
        const roleRes = await db.query('SELECT * FROM user_roles WHERE user_id = $1 AND role = $2', [user.id, 'admin']);

        if (roleRes.rows.length > 0) {
            console.log('User already has admin role.');
        } else {
            console.log('Granting admin role...');
            await db.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [user.id, 'admin']);
            console.log('Success! Admin role granted.');
        }

    } catch (error) {
        console.error('Error granting admin role:', error);
    } finally {
        process.exit(0);
    }
}

grantAdmin();
