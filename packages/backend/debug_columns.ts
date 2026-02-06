import { db } from './src/database/connection';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function debug() {
    try {
        console.log('--- DB Debug ---');
        console.log('DATABASE_URL:', process.env.DATABASE_URL);

        const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'content_posts' 
      ORDER BY ordinal_position;
    `);

        console.log('Columns in content_posts:');
        res.rows.forEach(row => {
            console.log(` - ${row.column_name} (${row.data_type})`);
        });

        if (res.rows.length === 0) {
            console.log('!!! Table content_posts NOT FOUND !!!');
        }
    } catch (error) {
        console.error('Debug error:', error);
    } finally {
        process.exit();
    }
}

debug();
