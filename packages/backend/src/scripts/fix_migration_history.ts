import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

async function fixMigrationHistory() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const migrationsDir = path.join(__dirname, '../database/migrations');

    try {
        console.log('🔄 Checking migration history consistency...');

        // Get all migration files
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql') && !f.endsWith('.rollback.sql'));

        // Get all executed migrations from DB
        const dbResult = await pool.query("SELECT migration_id FROM schema_migrations");
        const executedMigrations = dbResult.rows.map(row => row.migration_id);

        let fixCount = 0;

        for (const executedId of executedMigrations) {
            // Check if exact file exists
            const exactMatch = files.find(f => f.replace('.sql', '') === executedId);

            if (!exactMatch) {
                let match = files.find(f => f.endsWith(`${executedId}.sql`) || f.includes(executedId));

                // Try fuzzy matching (ignore timestamp)
                if (!match) {
                    // Extract potential name part (everything after first 14 digits + underscore, or just after first underscore)
                    // Pattern: YYYYMMDDHHMMSS_name
                    const executedNamePart = executedId.replace(/^\d{14}_/, '');

                    if (executedNamePart && executedNamePart !== executedId) {
                        match = files.find(f => f.includes(executedNamePart));
                        if (match) {
                            console.log(`🔍 Fuzzy match found: '${executedId}' -> '${match}' (matched on '${executedNamePart}')`);
                        }
                    }
                }

                if (match) {
                    const newId = match.replace('.sql', '');
                    console.log(`⚠️ Mismatch found: DB '${executedId}' vs File '${match}'`);
                    console.log(`   -> Updating DB record...`);

                    await pool.query(
                        "UPDATE schema_migrations SET migration_id = $1 WHERE migration_id = $2",
                        [newId, executedId]
                    );
                    fixCount++;
                } else {
                    console.log(`❌ Executed migration '${executedId}' not found in files (fuzzy match failed).`);
                }
            }
        }

        if (fixCount > 0) {
            console.log(`✅ Successfully fixed ${fixCount} migration records.`);
        } else {
            console.log('✨ No migration history issues found.');
        }

    } catch (error) {
        console.error('❌ Failed to fix migration history:', error);
    } finally {
        await pool.end();
    }
}

fixMigrationHistory();
