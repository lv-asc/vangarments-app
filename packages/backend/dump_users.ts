
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { db } from '../database/connection';
import fs from 'fs';

async function dump() {
    try {
        const res = await db.query('SELECT * FROM users');
        fs.writeFileSync('users_dump_direct.json', JSON.stringify(res.rows, null, 2));
        console.log('Dumped to users_dump_direct.json');
    } catch (e) {
        console.error(e);
        fs.writeFileSync('users_dump_error.txt', String(e));
    } finally {
        process.exit(0);
    }
}
dump();
