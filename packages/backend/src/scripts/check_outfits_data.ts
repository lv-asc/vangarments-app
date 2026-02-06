
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.development') });

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const res = await pool.query(`SELECT COUNT(*) FROM outfits;`);
        console.log('Row count:', res.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
