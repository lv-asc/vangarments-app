
import { config } from 'dotenv';
config();

async function run() {
    const { db } = await import('../database/connection');
    try {
        console.log('Checking if table exists...');
        const tableCheck = await db.query(`
      SELECT exists(
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vufs_global_settings'
      );
    `);
        console.log('Table exists:', tableCheck.rows[0].exists);

        if (!tableCheck.rows[0].exists) {
            console.error('Table vufs_global_settings DOES NOT EXIST.');
            process.exit(1);
        }

        console.log('Attempting to insert array into JSONB column...');
        const key = 'test_key_' + Date.now();
        const value = ['col1', 'col2', 'col3'];

        try {
            await db.query(
                `INSERT INTO vufs_global_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
                [key, value]
            );
            console.log('Javscript Array insertion: SUCCESS');
        } catch (err: any) {
            console.error('Javscript Array insertion: FAILED');
            console.error(err.message);
        }

        console.log('Attempting to insert JSON stringified array...');
        const key2 = 'test_key_json_' + Date.now();
        const value2 = JSON.stringify(['col1', 'col2', 'col3']);

        try {
            await db.query(
                `INSERT INTO vufs_global_settings (key, value)
           VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
                [key2, value2]
            );
            console.log('JSON Stringified insertion: SUCCESS');
        } catch (err: any) {
            console.error('JSON Stringified insertion: FAILED');
            console.error(err.message);
        }

    } catch (err) {
        console.error('Script failed:', err);
    } finally {
        process.exit(0);
    }
}

run();
