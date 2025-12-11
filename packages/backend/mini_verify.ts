
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const res = await pool.query('SELECT id, email, profile FROM users WHERE email = $1', ['lvicentini10@gmail.com']);
        console.log('---START_JSON---');
        console.log(JSON.stringify(res.rows, null, 2));
        console.log('---END_JSON---');
    } catch (e) {
        console.error('---ERROR---');
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
