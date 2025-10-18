#!/usr/bin/env node

import { Pool } from 'pg';
import { DatabaseMigrator } from '../database/migrator';
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
  const command = process.argv[2];
  const target = process.argv[3];

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const migrator = new DatabaseMigrator(pool);

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await migrator.migrate();
        break;
      
      case 'down':
      case 'rollback':
        await migrator.rollback(target);
        break;
      
      case 'status':
        await migrator.getStatus();
        break;
      
      case 'validate':
        await migrator.validateMigrations();
        console.log('✅ All migrations are valid');
        break;
      
      default:
        console.log(`
Usage: npm run migrate <command> [options]

Commands:
  up, migrate           Run all pending migrations
  down, rollback [id]   Rollback migrations (to specific migration if id provided)
  status               Show migration status
  validate             Validate migration checksums

Examples:
  npm run migrate up
  npm run migrate status
  npm run migrate rollback
  npm run migrate rollback 001_create_users_table
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}