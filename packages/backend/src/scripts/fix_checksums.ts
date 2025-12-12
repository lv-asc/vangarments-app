import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const migrationsPath = path.join(__dirname, '../database/migrations');
    console.log(`Checking migrations in ${migrationsPath}`);

    const files = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'));

    for (const file of files) {
        const filePath = path.join(migrationsPath, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        const checksum = crypto.createHash('sha256').update(sql).digest('hex');
        const id = file.replace('.sql', '');

        console.log(`Updating checksum for ${id}...`);
        try {
            const result = await pool.query(
                'UPDATE schema_migrations SET checksum = $1 WHERE migration_id = $2',
                [checksum, id]
            );
            if ((result as any).rowCount > 0) {
                console.log(`✅ Updated checksum for ${id}`);
            } else {
                console.log(`ℹ️ Migration ${id} not found in DB (skipped)`);
            }
        } catch (e) {
            console.error(`❌ Failed to update ${id}`, e);
        }
    }

    await pool.end();
}

main().catch(console.error);
