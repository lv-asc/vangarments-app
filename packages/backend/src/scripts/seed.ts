#!/usr/bin/env node

import { Pool } from 'pg';
import { DatabaseSeeder } from '../database/seeder';
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
  const force = process.argv.includes('--force');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const seeder = new DatabaseSeeder(pool);

  try {
    switch (command) {
      case 'all':
        await seeder.seedAll(force);
        break;

      case 'structural':
        await seeder.seedStructuralData();
        break;

      case 'file':
        const filename = process.argv[3];
        if (!filename) {
          console.error('❌ Filename is required for file command');
          process.exit(1);
        }
        await seeder.seedFile(filename);
        break;

      default:
        console.log(`
Usage: npm run seed <command> [options]

Commands:
  all [--force]    Run all seed files (skip already seeded unless --force)
  structural      Create structural data (categories, etc.)
  file <name>     Run specific seed file

Examples:
  npm run seed all
  npm run seed all --force
  npm run seed sample
  npm run seed file users.json
        `);
        break;
    }
  } catch (error: any) {
    console.error('❌ Seeding failed:', error?.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}