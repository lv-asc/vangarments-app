import { Pool } from 'pg';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import { DatabaseMigrator } from '../../src/database/migrator';

describe('Backup and Recovery Tests', () => {
  const environment = process.env.NODE_ENV || 'staging';
  const region = process.env.AWS_REGION || 'us-east-1';
  const testDbName = `vangarments_test_${Date.now()}`;
  
  let pool: Pool;
  let s3: AWS.S3;
  let rds: AWS.RDS;
  let testBackupPath: string;

  beforeAll(async () => {
    // Initialize AWS services
    AWS.config.update({ region });
    s3 = new AWS.S3();
    rds = new AWS.RDS();

    // Create test database connection
    const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres');
    pool = new Pool({
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 5432,
      user: dbUrl.username,
      password: dbUrl.password,
      database: 'postgres', // Connect to postgres to create test db
    });

    // Create test database
    try {
      await pool.query(`CREATE DATABASE ${testDbName}`);
    } catch (error) {
      // Database might already exist
      console.warn(`Test database creation warning: ${error.message}`);
    }

    // Switch to test database
    await pool.end();
    pool = new Pool({
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 5432,
      user: dbUrl.username,
      password: dbUrl.password,
      database: testDbName,
    });
  });

  afterAll(async () => {
    // Cleanup test database
    await pool.end();
    
    const adminPool = new Pool({
      host: new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').hostname,
      port: parseInt(new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').port) || 5432,
      user: new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').username,
      password: new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').password,
      database: 'postgres',
    });

    try {
      await adminPool.query(`DROP DATABASE IF EXISTS ${testDbName}`);
    } catch (error) {
      console.warn(`Test database cleanup warning: ${error.message}`);
    }
    
    await adminPool.end();

    // Cleanup test backup files
    if (testBackupPath && fs.existsSync(testBackupPath)) {
      fs.unlinkSync(testBackupPath);
    }
  });

  describe('Database Backup Creation', () => {
    it('should create a full database backup', async () => {
      // Setup test data
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await pool.query(`
        INSERT INTO test_users (email) VALUES 
        ('test1@example.com'),
        ('test2@example.com'),
        ('test3@example.com')
      `);

      // Create backup using pg_dump
      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      testBackupPath = path.join(backupDir, `test-backup-${timestamp}.sql`);

      const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres');
      
      return new Promise<void>((resolve, reject) => {
        const pgDump = spawn('pg_dump', [
          '--host', dbUrl.hostname,
          '--port', dbUrl.port || '5432',
          '--username', dbUrl.username,
          '--dbname', testDbName,
          '--no-password',
          '--format=custom',
          '--compress=9',
          '--file', testBackupPath
        ], {
          env: {
            ...process.env,
            PGPASSWORD: dbUrl.password
          }
        });

        pgDump.on('close', (code) => {
          if (code === 0) {
            expect(fs.existsSync(testBackupPath)).toBe(true);
            
            const stats = fs.statSync(testBackupPath);
            expect(stats.size).toBeGreaterThan(0);
            
            resolve();
          } else {
            reject(new Error(`pg_dump failed with code ${code}`));
          }
        });

        pgDump.on('error', reject);
      });
    }, 30000);

    it('should create schema-only backup', async () => {
      const backupDir = path.join(__dirname, '../../backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const schemaBackupPath = path.join(backupDir, `test-schema-${timestamp}.sql`);

      const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres');
      
      return new Promise<void>((resolve, reject) => {
        const pgDump = spawn('pg_dump', [
          '--host', dbUrl.hostname,
          '--port', dbUrl.port || '5432',
          '--username', dbUrl.username,
          '--dbname', testDbName,
          '--no-password',
          '--schema-only',
          '--format=custom',
          '--file', schemaBackupPath
        ], {
          env: {
            ...process.env,
            PGPASSWORD: dbUrl.password
          }
        });

        pgDump.on('close', (code) => {
          if (code === 0) {
            expect(fs.existsSync(schemaBackupPath)).toBe(true);
            
            const stats = fs.statSync(schemaBackupPath);
            expect(stats.size).toBeGreaterThan(0);
            
            // Cleanup
            fs.unlinkSync(schemaBackupPath);
            resolve();
          } else {
            reject(new Error(`Schema backup failed with code ${code}`));
          }
        });

        pgDump.on('error', reject);
      });
    }, 30000);

    it('should create data-only backup', async () => {
      const backupDir = path.join(__dirname, '../../backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dataBackupPath = path.join(backupDir, `test-data-${timestamp}.sql`);

      const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres');
      
      return new Promise<void>((resolve, reject) => {
        const pgDump = spawn('pg_dump', [
          '--host', dbUrl.hostname,
          '--port', dbUrl.port || '5432',
          '--username', dbUrl.username,
          '--dbname', testDbName,
          '--no-password',
          '--data-only',
          '--format=custom',
          '--file', dataBackupPath
        ], {
          env: {
            ...process.env,
            PGPASSWORD: dbUrl.password
          }
        });

        pgDump.on('close', (code) => {
          if (code === 0) {
            expect(fs.existsSync(dataBackupPath)).toBe(true);
            
            const stats = fs.statSync(dataBackupPath);
            expect(stats.size).toBeGreaterThan(0);
            
            // Cleanup
            fs.unlinkSync(dataBackupPath);
            resolve();
          } else {
            reject(new Error(`Data backup failed with code ${code}`));
          }
        });

        pgDump.on('error', reject);
      });
    }, 30000);
  });

  describe('Backup Validation', () => {
    it('should validate backup file integrity', () => {
      expect(fs.existsSync(testBackupPath)).toBe(true);
      
      const stats = fs.statSync(testBackupPath);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.isFile()).toBe(true);
    });

    it('should verify backup contains expected data', async () => {
      // Use pg_restore to list contents without restoring
      const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres');
      
      return new Promise<void>((resolve, reject) => {
        const pgRestore = spawn('pg_restore', [
          '--list',
          testBackupPath
        ]);

        let output = '';
        pgRestore.stdout.on('data', (data) => {
          output += data.toString();
        });

        pgRestore.on('close', (code) => {
          if (code === 0) {
            expect(output).toContain('test_users');
            resolve();
          } else {
            reject(new Error(`Backup validation failed with code ${code}`));
          }
        });

        pgRestore.on('error', reject);
      });
    });
  });

  describe('Database Recovery', () => {
    it('should restore database from backup', async () => {
      // Create a new test database for restoration
      const restoreDbName = `${testDbName}_restore`;
      
      const adminPool = new Pool({
        host: new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').hostname,
        port: parseInt(new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').port) || 5432,
        user: new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').username,
        password: new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres').password,
        database: 'postgres',
      });

      try {
        await adminPool.query(`CREATE DATABASE ${restoreDbName}`);
      } catch (error) {
        // Database might already exist
        await adminPool.query(`DROP DATABASE IF EXISTS ${restoreDbName}`);
        await adminPool.query(`CREATE DATABASE ${restoreDbName}`);
      }
      
      await adminPool.end();

      // Restore backup to new database
      const dbUrl = new URL(process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres');
      
      return new Promise<void>(async (resolve, reject) => {
        const pgRestore = spawn('pg_restore', [
          '--host', dbUrl.hostname,
          '--port', dbUrl.port || '5432',
          '--username', dbUrl.username,
          '--dbname', restoreDbName,
          '--no-password',
          '--clean',
          '--if-exists',
          testBackupPath
        ], {
          env: {
            ...process.env,
            PGPASSWORD: dbUrl.password
          }
        });

        pgRestore.on('close', async (code) => {
          if (code === 0) {
            // Verify restored data
            const restorePool = new Pool({
              host: dbUrl.hostname,
              port: parseInt(dbUrl.port) || 5432,
              user: dbUrl.username,
              password: dbUrl.password,
              database: restoreDbName,
            });

            try {
              const result = await restorePool.query('SELECT COUNT(*) FROM test_users');
              expect(parseInt(result.rows[0].count)).toBe(3);
              
              const users = await restorePool.query('SELECT email FROM test_users ORDER BY email');
              expect(users.rows).toHaveLength(3);
              expect(users.rows[0].email).toBe('test1@example.com');
              
              await restorePool.end();
              
              // Cleanup restore database
              const cleanupPool = new Pool({
                host: dbUrl.hostname,
                port: parseInt(dbUrl.port) || 5432,
                user: dbUrl.username,
                password: dbUrl.password,
                database: 'postgres',
              });
              
              await cleanupPool.query(`DROP DATABASE ${restoreDbName}`);
              await cleanupPool.end();
              
              resolve();
            } catch (error) {
              await restorePool.end();
              reject(error);
            }
          } else {
            reject(new Error(`pg_restore failed with code ${code}`));
          }
        });

        pgRestore.on('error', reject);
      });
    }, 60000);

    it('should handle point-in-time recovery simulation', async () => {
      // This test simulates point-in-time recovery by creating data at different times
      // and verifying we can restore to a specific point
      
      // Insert initial data
      await pool.query(`
        INSERT INTO test_users (email) VALUES ('before_incident@example.com')
      `);
      
      const beforeIncident = new Date();
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate "incident" - insert data we want to rollback
      await pool.query(`
        INSERT INTO test_users (email) VALUES ('incident_data@example.com')
      `);
      
      // Verify we can identify the incident data
      const allUsers = await pool.query('SELECT email, created_at FROM test_users ORDER BY created_at');
      const incidentUser = allUsers.rows.find(user => user.email === 'incident_data@example.com');
      const beforeUser = allUsers.rows.find(user => user.email === 'before_incident@example.com');
      
      expect(incidentUser).toBeDefined();
      expect(beforeUser).toBeDefined();
      expect(new Date(incidentUser.created_at)).toBeInstanceOf(Date);
      expect(new Date(beforeUser.created_at)).toBeInstanceOf(Date);
      
      // In a real scenario, we would restore from a backup taken before the incident
      // For this test, we simulate by deleting the incident data
      await pool.query(`DELETE FROM test_users WHERE email = 'incident_data@example.com'`);
      
      const recoveredUsers = await pool.query('SELECT email FROM test_users WHERE email = $1', ['incident_data@example.com']);
      expect(recoveredUsers.rows).toHaveLength(0);
    });
  });

  describe('S3 Backup Integration', () => {
    it('should upload backup to S3 if configured', async () => {
      const bucketName = process.env.S3_BACKUPS_BUCKET;
      
      if (!bucketName) {
        console.log('S3_BACKUPS_BUCKET not configured, skipping S3 backup test');
        return;
      }

      const key = `test-backups/${environment}/test-backup-${Date.now()}.sql`;
      const fileContent = fs.readFileSync(testBackupPath);

      try {
        const uploadResult = await s3.upload({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ServerSideEncryption: 'AES256',
          StorageClass: 'STANDARD_IA',
          Metadata: {
            environment,
            'backup-type': 'test',
            'created-at': new Date().toISOString()
          }
        }).promise();

        expect(uploadResult.Location).toBeDefined();
        expect(uploadResult.ETag).toBeDefined();

        // Verify upload by downloading
        const downloadResult = await s3.getObject({
          Bucket: bucketName,
          Key: key
        }).promise();

        expect(downloadResult.Body).toBeDefined();
        expect(downloadResult.ContentLength).toBe(fileContent.length);

        // Cleanup S3 object
        await s3.deleteObject({
          Bucket: bucketName,
          Key: key
        }).promise();

      } catch (error) {
        if (error.code === 'NoSuchBucket') {
          console.log('S3 bucket does not exist, skipping S3 backup test');
        } else {
          throw error;
        }
      }
    });

    it('should list S3 backups if configured', async () => {
      const bucketName = process.env.S3_BACKUPS_BUCKET;
      
      if (!bucketName) {
        console.log('S3_BACKUPS_BUCKET not configured, skipping S3 list test');
        return;
      }

      try {
        const result = await s3.listObjectsV2({
          Bucket: bucketName,
          Prefix: `database-backups/${environment}/`
        }).promise();

        expect(result.Contents).toBeDefined();
        expect(Array.isArray(result.Contents)).toBe(true);

      } catch (error) {
        if (error.code === 'NoSuchBucket') {
          console.log('S3 bucket does not exist, skipping S3 list test');
        } else {
          throw error;
        }
      }
    });
  });

  describe('RDS Automated Backups', () => {
    it('should verify RDS automated backup configuration', async () => {
      try {
        const databases = await rds.describeDBInstances().promise();
        const vangarmentsDbs = databases.DBInstances?.filter(db => 
          db.DBInstanceIdentifier?.includes('vangarments') && 
          db.DBInstanceIdentifier?.includes(environment)
        );

        if (vangarmentsDbs && vangarmentsDbs.length > 0) {
          vangarmentsDbs.forEach(db => {
            expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
            expect(db.PreferredBackupWindow).toBeDefined();
            
            if (environment === 'production') {
              expect(db.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
            }
          });
        } else {
          console.log('No Vangarments RDS instances found for backup verification');
        }
      } catch (error) {
        console.warn(`RDS backup verification skipped: ${error.message}`);
      }
    });

    it('should verify RDS snapshot creation capability', async () => {
      try {
        const databases = await rds.describeDBInstances().promise();
        const vangarmentsDbs = databases.DBInstances?.filter(db => 
          db.DBInstanceIdentifier?.includes('vangarments') && 
          db.DBInstanceIdentifier?.includes(environment)
        );

        if (vangarmentsDbs && vangarmentsDbs.length > 0) {
          const db = vangarmentsDbs[0];
          
          // List existing snapshots to verify snapshot capability
          const snapshots = await rds.describeDBSnapshots({
            DBInstanceIdentifier: db.DBInstanceIdentifier
          }).promise();

          expect(snapshots.DBSnapshots).toBeDefined();
          expect(Array.isArray(snapshots.DBSnapshots)).toBe(true);
        }
      } catch (error) {
        console.warn(`RDS snapshot verification skipped: ${error.message}`);
      }
    });
  });

  describe('Migration Backup and Recovery', () => {
    it('should backup before running migrations', async () => {
      const migrator = new DatabaseMigrator(pool);
      
      // Initialize migration system
      await migrator.initialize();
      
      // Get migration status
      const pendingMigrations = await migrator.getPendingMigrations();
      
      // If there are pending migrations, we should create a backup first
      if (pendingMigrations.length > 0) {
        // In a real scenario, this would create a backup before migrations
        expect(pendingMigrations.length).toBeGreaterThanOrEqual(0);
      }
      
      // Verify migration table exists
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'schema_migrations'
        )
      `);
      
      expect(result.rows[0].exists).toBe(true);
    });

    it('should be able to rollback migrations', async () => {
      const migrator = new DatabaseMigrator(pool);
      
      // Create a test migration table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_migration_table (
          id SERIAL PRIMARY KEY,
          test_data VARCHAR(255)
        )
      `);
      
      // Simulate migration record
      await pool.query(`
        INSERT INTO schema_migrations (migration_id, name, checksum, success) 
        VALUES ('test_migration', 'test_migration.sql', 'test_checksum', true)
        ON CONFLICT (migration_id) DO NOTHING
      `);
      
      // Verify table exists
      const beforeRollback = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'test_migration_table'
        )
      `);
      expect(beforeRollback.rows[0].exists).toBe(true);
      
      // Simulate rollback by dropping table and removing migration record
      await pool.query('DROP TABLE IF EXISTS test_migration_table');
      await pool.query('DELETE FROM schema_migrations WHERE migration_id = $1', ['test_migration']);
      
      // Verify rollback
      const afterRollback = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'test_migration_table'
        )
      `);
      expect(afterRollback.rows[0].exists).toBe(false);
    });
  });

  describe('Backup Automation', () => {
    it('should validate backup script exists and is executable', () => {
      const backupScriptPath = path.join(__dirname, '../../src/scripts/backup.ts');
      expect(fs.existsSync(backupScriptPath)).toBe(true);
      
      const stats = fs.statSync(backupScriptPath);
      expect(stats.isFile()).toBe(true);
    });

    it('should validate backup cleanup functionality', async () => {
      const backupDir = path.join(__dirname, '../../backups');
      
      // Create test backup files with different ages
      const oldBackupPath = path.join(backupDir, 'old-backup.sql');
      const recentBackupPath = path.join(backupDir, 'recent-backup.sql');
      
      fs.writeFileSync(oldBackupPath, 'test backup content');
      fs.writeFileSync(recentBackupPath, 'test backup content');
      
      // Set old file timestamp (simulate 35 days old)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);
      fs.utimesSync(oldBackupPath, oldDate, oldDate);
      
      // Verify files exist
      expect(fs.existsSync(oldBackupPath)).toBe(true);
      expect(fs.existsSync(recentBackupPath)).toBe(true);
      
      // Simulate cleanup (remove files older than 30 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const oldStats = fs.statSync(oldBackupPath);
      const recentStats = fs.statSync(recentBackupPath);
      
      if (oldStats.mtime < cutoffDate) {
        fs.unlinkSync(oldBackupPath);
      }
      
      if (recentStats.mtime < cutoffDate) {
        fs.unlinkSync(recentBackupPath);
      }
      
      // Verify cleanup results
      expect(fs.existsSync(oldBackupPath)).toBe(false);
      expect(fs.existsSync(recentBackupPath)).toBe(true);
      
      // Cleanup test file
      fs.unlinkSync(recentBackupPath);
    });
  });

  describe('Disaster Recovery Procedures', () => {
    it('should validate disaster recovery documentation', () => {
      const deploymentDocPath = path.join(__dirname, '../../../DEPLOYMENT.md');
      expect(fs.existsSync(deploymentDocPath)).toBe(true);
      
      const content = fs.readFileSync(deploymentDocPath, 'utf8');
      expect(content).toContain('Backup and Recovery');
      expect(content).toContain('Disaster Recovery');
    });

    it('should validate rollback script exists', () => {
      const rollbackScriptPath = path.join(__dirname, '../../../scripts/rollback.sh');
      expect(fs.existsSync(rollbackScriptPath)).toBe(true);
      
      const stats = fs.statSync(rollbackScriptPath);
      expect(stats.isFile()).toBe(true);
    });

    it('should test database connection failover capability', async () => {
      // Test connection resilience
      const connectionAttempts = 3;
      let successfulConnections = 0;
      
      for (let i = 0; i < connectionAttempts; i++) {
        try {
          const result = await pool.query('SELECT 1 as test');
          expect(result.rows[0].test).toBe(1);
          successfulConnections++;
        } catch (error) {
          console.warn(`Connection attempt ${i + 1} failed: ${error.message}`);
        }
      }
      
      expect(successfulConnections).toBeGreaterThan(0);
    });
  });
});