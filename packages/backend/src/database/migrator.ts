import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  checksum: string;
}

export class DatabaseMigrator {
  private pool: Pool;
  private migrationsPath: string;

  constructor(pool: Pool, migrationsPath: string = path.join(__dirname, 'migrations')) {
    this.pool = pool;
    this.migrationsPath = migrationsPath;
  }

  async initialize(): Promise<void> {
    // Create migrations table if it doesn't exist
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT true
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_migration_id 
      ON schema_migrations(migration_id);
    `;

    await this.pool.query(createMigrationsTable);
  }

  async getMigrationFiles(): Promise<Migration[]> {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = this.calculateChecksum(sql);

      migrations.push({
        id: file.replace('.sql', ''),
        name: file,
        sql,
        checksum
      });
    }

    return migrations;
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT migration_id FROM schema_migrations WHERE success = true ORDER BY executed_at'
    );
    return result.rows.map(row => row.migration_id);
  }

  async validateMigrations(): Promise<void> {
    const migrations = await this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();

    for (const executedId of executed) {
      const migration = migrations.find(m => m.id === executedId);
      if (!migration) {
        throw new Error(`Executed migration ${executedId} not found in migration files`);
      }

      // Check if checksum matches
      const result = await this.pool.query(
        'SELECT checksum FROM schema_migrations WHERE migration_id = $1',
        [executedId]
      );

      if (result.rows[0]?.checksum !== migration.checksum) {
        throw new Error(`Migration ${executedId} checksum mismatch. Migration file may have been modified after execution.`);
      }
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const allMigrations = await this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();

    return allMigrations.filter(migration => !executed.includes(migration.id));
  }

  async executeMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');

      // Execute the migration
      await client.query(migration.sql);

      // Record the migration - use ON CONFLICT to avoid failing if record exists
      await client.query(
        `INSERT INTO schema_migrations (migration_id, name, checksum, execution_time_ms) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (migration_id) DO UPDATE 
         SET success = true, 
             checksum = EXCLUDED.checksum, 
             execution_time_ms = EXCLUDED.execution_time_ms,
             executed_at = CURRENT_TIMESTAMP`,
        [migration.id, migration.name, migration.checksum, Date.now() - startTime]
      );

      await client.query('COMMIT');
      console.log(`✅ Migration ${migration.id} executed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');

      // Record failed migration if it doesn't already exist or update it
      try {
        await client.query(
          `INSERT INTO schema_migrations (migration_id, name, checksum, execution_time_ms, success) 
           VALUES ($1, $2, $3, $4, false)
           ON CONFLICT (migration_id) DO UPDATE 
           SET success = false,
               checksum = EXCLUDED.checksum,
               execution_time_ms = EXCLUDED.execution_time_ms`,
          [migration.id, migration.name, migration.checksum, Date.now() - startTime]
        );
      } catch (recordError) {
        console.error('Failed to record migration failure:', recordError);
      }


      throw new Error(`Migration ${migration.id} failed: ${(error as any).message}`);
    } finally {
      client.release();
    }
  }

  async migrate(): Promise<void> {
    console.log('🔄 Starting database migration...');

    await this.initialize();
    await this.validateMigrations();

    const pendingMigrations = await this.getPendingMigrations();

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      console.log(`🔄 Executing migration: ${migration.id}`);
      await this.executeMigration(migration);
    }

    console.log('🎉 All migrations completed successfully');
  }

  async rollback(targetMigrationId?: string): Promise<void> {
    console.log('🔄 Starting rollback...');

    const executed = await this.getExecutedMigrations();

    if (executed.length === 0) {
      console.log('ℹ️ No migrations to rollback');
      return;
    }

    let migrationsToRollback: string[];

    if (targetMigrationId) {
      const targetIndex = executed.indexOf(targetMigrationId);
      if (targetIndex === -1) {
        throw new Error(`Target migration ${targetMigrationId} not found in executed migrations`);
      }
      migrationsToRollback = executed.slice(targetIndex + 1).reverse();
    } else {
      // Rollback only the last migration
      migrationsToRollback = [executed[executed.length - 1]];
    }

    for (const migrationId of migrationsToRollback) {
      await this.rollbackMigration(migrationId);
    }

    console.log('🎉 Rollback completed successfully');
  }

  private async rollbackMigration(migrationId: string): Promise<void> {
    // Look for rollback file
    const rollbackFile = path.join(this.migrationsPath, `${migrationId}.rollback.sql`);

    if (!fs.existsSync(rollbackFile)) {
      throw new Error(`Rollback file not found for migration ${migrationId}`);
    }

    const rollbackSql = fs.readFileSync(rollbackFile, 'utf8');
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(rollbackSql);
      await client.query(
        'DELETE FROM schema_migrations WHERE migration_id = $1',
        [migrationId]
      );
      await client.query('COMMIT');
      console.log(`✅ Migration ${migrationId} rolled back successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Rollback failed for migration ${migrationId}: ${(error as any).message}`);
    } finally {
      client.release();
    }
  }

  async getStatus(): Promise<void> {
    const allMigrations = await this.getMigrationFiles();
    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();

    console.log('\n📊 Migration Status:');
    console.log(`Total migrations: ${allMigrations.length}`);
    console.log(`Executed: ${executed.length}`);
    console.log(`Pending: ${pending.length}`);

    if (pending.length > 0) {
      console.log('\n📋 Pending migrations:');
      pending.forEach(migration => {
        console.log(`  - ${migration.id}`);
      });
    }

    if (executed.length > 0) {
      console.log('\n✅ Executed migrations:');
      const result = await this.pool.query(
        'SELECT migration_id, executed_at FROM schema_migrations WHERE success = true ORDER BY executed_at'
      );
      result.rows.forEach(row => {
        console.log(`  - ${row.migration_id} (${row.executed_at})`);
      });
    }
  }

  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}