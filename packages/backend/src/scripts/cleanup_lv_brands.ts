
require('dotenv').config();

const main = async () => {
    try {
        // Dynamic import to ensure env vars are loaded first
        const { db } = await import('../database/connection');

        console.log('Connecting to database...');

        // 1. Find the user
        const userResult = await db.query(
            `SELECT id, email FROM users WHERE email = $1`,
            ['lv@vangarments.com']
        );

        if (userResult.rows.length === 0) {
            console.log('User lv@vangarments.com not found.');
            process.exit(0);
        }

        const userId = userResult.rows[0].id;
        console.log(`Found user: ${userResult.rows[0].email} (${userId})`);

        // 2. Count existing brands
        const countResult = await db.query(
            `SELECT count(*) FROM brand_accounts WHERE user_id = $1`,
            [userId]
        );
        console.log(`User has ${countResult.rows[0].count} linked brands.`);

        // 3. Delete linked brands
        if (parseInt(countResult.rows[0].count) > 0) {
            const deleteResult = await db.query(
                `DELETE FROM brand_accounts WHERE user_id = $1`,
                [userId]
            );
            console.log(`Successfully deleted ${deleteResult.rowCount} brand accounts linked to user.`);
        } else {
            console.log('No brands to delete.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error running cleanup script:', error);
        process.exit(1);
    }
};

main();
