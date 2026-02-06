
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.development') });

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'outfits';
    `);
        console.log('Columns in outfits table:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
