#!/usr/bin/env node

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import fs from 'fs/promises';

// Load environment configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

async function createSystemConfigurationsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Creating system_configurations table...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../database/migrations/create_system_configurations_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ system_configurations table created successfully');

    // Verify the table was created
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'system_configurations'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table verification successful');
      
      // Check initial data
      const dataCheck = await pool.query('SELECT COUNT(*) FROM system_configurations');
      console.log(`📊 Initial configuration entries: ${dataCheck.rows[0].count}`);
    } else {
      console.error('❌ Table verification failed');
    }

  } catch (error) {
    console.error('❌ Failed to create system_configurations table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createSystemConfigurationsTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { createSystemConfigurationsTable };