import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is required');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
        console.log('Cleaning failed migrations...');
        const result = await pool.query('DELETE FROM schema_migrations WHERE success = false');
        console.log(`Deleted ${result.rowCount} failed migration records.`);
    } catch (error) {
        console.error('Error cleaning migrations:', error);
    } finally {
        await pool.end();
    }
}

main();
