
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env') });
import { db } from './src/database/connection';

async function checkUser() {
    try {
        const res = await db.query("SELECT * FROM users WHERE email = 'igowsant@gmail.com'");
        if (res.rows.length > 0) {
            console.log('USER_EXISTS');
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('USER_NOT_FOUND');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkUser();
