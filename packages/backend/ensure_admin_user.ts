
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const candidateUrls = [
    "postgresql://macbookairm2@localhost:5432/vangarments",
    "postgresql://macbookairm2@localhost:5432/postgres",
    "postgresql://postgres:postgres@localhost:5432/vangarments",
    "postgresql://vangarments_admin:dev_password_123@localhost:5432/vangarments"
];

async function ensureAdminUser() {
    for (const url of candidateUrls) {
        console.log("---------------------------------------------------");
        console.log("Trying connection:", url);
        const loopPool = new Pool({ connectionString: url });

        try {
            const client = await loopPool.connect();
            console.log("CONNECTED successfully using:", url);

            try {
                await performUserSetup(client);
                // If we get here, setup was successful
                client.release();
                await loopPool.end();
                process.exit(0);
            } catch (setupError) {
                console.error("Connected but setup failed:", setupError);
                client.release();
                await loopPool.end();
                // Continue to next URL if it was a DB error (like table missing), 
                // but usually we might want to stop if we found the valid user/pass but the DB structure is wrong.
                // For now, let's treat it as a failure for this URL.
            }
        } catch (e: any) {
            console.log(`Failed to connect with ${url}`);
            console.log(`Error: ${e.message}`);
            await loopPool.end();
        }
    }
    console.error("ALL CONNECTION ATTEMPTS FAILED.");
    process.exit(1);
}

async function performUserSetup(client: any) {
    const email = 'igowsant@gmail.com';
    const password = 'I29/5j19@10MO!035';
    const username = 'igowsant';
    const name = 'Igor Santos';

    console.log(`Checking for user: ${email}`);
    // Check if table exists first? No, let it fail if table doesn't exist.
    const userRes = await client.query("SELECT * FROM users WHERE email = $1", [email]);

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (userRes.rows.length > 0) {
        console.log('User exists. Updating password...');
        const userId = userRes.rows[0].id;
        await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
        console.log('Password updated.');

        // Check roles
        const rolesRes = await client.query("SELECT role FROM user_roles WHERE user_id = $1", [userId]);
        const roles = rolesRes.rows.map((r: any) => r.role);
        if (!roles.includes('admin')) {
            console.log('Adding admin role...');
            await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')", [userId]);
        }
    } else {
        console.log('User does not exist. Creating...');

        // Insert user
        const insertRes = await client.query(`
            INSERT INTO users (username, email, password_hash, name, status, verification_status)
            VALUES ($1, $2, $3, $4, 'active', 'verified')
            RETURNING id
        `, [username, email, passwordHash, name]);

        const userId = insertRes.rows[0].id;
        console.log(`User created with ID: ${userId}`);

        // Add roles
        await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'consumer')", [userId]);
        await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')", [userId]);
        console.log('Roles assigned.');
    }

    console.log('SUCCESS: User setup complete.');
}

ensureAdminUser();
