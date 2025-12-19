#!/usr/bin/env node

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import { Storage } from '@google-cloud/storage';

// Load environment configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

interface BackupOptions {
  type: 'full' | 'schema' | 'data';
  compress: boolean;
  encrypt: boolean;
  uploadToCloud: boolean;
  retentionDays: number;
}

class DatabaseBackup {
  private backupDir: string;
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BACKUPS_BUCKET || 'vangarments-backups';

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(options: BackupOptions): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `vangarments-${environment}-${options.type}-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    console.log(`🔄 Creating ${options.type} backup: ${filename}`);

    try {
      await this.runPgDump(filepath, options);

      if (options.compress) {
        await this.compressFile(filepath);
      }

      if (options.encrypt) {
        await this.encryptFile(filepath);
      }

      if (options.uploadToCloud) {
        await this.uploadToGCS(filepath);
      }

      console.log(`✅ Backup created successfully: ${filename}`);
      return filepath;
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      throw error;
    }
  }

  private async runPgDump(filepath: string, options: BackupOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbUrl = new URL(process.env.DATABASE_URL!);

      const args = [
        '--host', dbUrl.hostname,
        '--port', dbUrl.port || '5432',
        '--username', dbUrl.username,
        '--dbname', dbUrl.pathname.slice(1),
        '--no-password',
        '--verbose'
      ];

      // Add type-specific options
      switch (options.type) {
        case 'schema':
          args.push('--schema-only');
          break;
        case 'data':
          args.push('--data-only');
          break;
        case 'full':
          // Full backup includes both schema and data (default)
          break;
      }

      // Add format options
      args.push('--format=custom', '--compress=9');

      const pgDump = spawn('pg_dump', args, {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const writeStream = fs.createWriteStream(filepath);
      pgDump.stdout.pipe(writeStream);

      let errorOutput = '';
      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDump.on('close', (code) => {
        writeStream.end();
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on('error', (error) => {
        writeStream.end();
        reject(error);
      });
    });
  }

  private async compressFile(filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const gzip = spawn('gzip', [filepath]);

      gzip.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Compression failed with code ${code}`));
        }
      });

      gzip.on('error', reject);
    });
  }

  private async encryptFile(filepath: string): Promise<void> {
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('BACKUP_ENCRYPTION_KEY environment variable is required for encryption');
    }

    return new Promise((resolve, reject) => {
      const outputPath = `${filepath}.enc`;
      const openssl = spawn('openssl', [
        'enc', '-aes-256-cbc',
        '-salt',
        '-in', filepath,
        '-out', outputPath,
        '-pass', `pass:${encryptionKey}`
      ]);

      openssl.on('close', (code) => {
        if (code === 0) {
          // Remove unencrypted file
          fs.unlinkSync(filepath);
          resolve();
        } else {
          reject(new Error(`Encryption failed with code ${code}`));
        }
      });

      openssl.on('error', reject);
    });
  }

  private async uploadToGCS(filepath: string): Promise<void> {
    const filename = path.basename(filepath);
    const key = `database-backups/${environment}/${filename}`;

    console.log(`☁️ Uploading to GCS: ${this.bucketName}/${key}`);

    try {
      await this.storage.bucket(this.bucketName).upload(filepath, {
        destination: key,
        metadata: {
          contentType: 'application/octet-stream',
          metadata: {
            environment,
            'backup-type': 'database',
            'created-at': new Date().toISOString()
          }
        }
      });
      console.log('✅ Upload to GCS successful');
    } catch (error) {
      console.error(`❌ GCS upload failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups(): Promise<void> {
    console.log('\n📋 Local Backups:');
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.includes('vangarments'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('  No local backups found');
    } else {
      files.forEach(file => {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  - ${file} (${size} MB) - ${stats.mtime.toISOString()}`);
      });
    }

    // List Cloud backups if configured
    try {
      console.log('\n☁️ Cloud Backups (GCS):');
      const [files] = await this.storage.bucket(this.bucketName).getFiles({
        prefix: `database-backups/${environment}/`
      });

      if (files.length === 0) {
        console.log('  No cloud backups found');
      } else {
        files.forEach(file => {
          const rawSize = file.metadata.size?.toString() || '0';
          const size = (parseInt(rawSize) / 1024 / 1024).toFixed(2);
          console.log(`  - ${file.name} (${size} MB) - ${file.metadata.updated}`);
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not list cloud backups: ${error.message}`);
    }
  }

  async cleanupOldBackups(retentionDays: number): Promise<void> {
    console.log(`🧹 Cleaning up backups older than ${retentionDays} days...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Cleanup local backups
    const files = fs.readdirSync(this.backupDir);
    let localDeleted = 0;

    for (const file of files) {
      const filepath = path.join(this.backupDir, file);
      const stats = fs.statSync(filepath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filepath);
        localDeleted++;
        console.log(`🗑️ Deleted local backup: ${file}`);
      }
    }

    // Cleanup Cloud backups
    try {
      const [files] = await this.storage.bucket(this.bucketName).getFiles({
        prefix: `database-backups/${environment}/`
      });

      let cloudDeleted = 0;
      for (const file of files) {
        const updatedDate = new Date(file.metadata.updated || 0);
        if (updatedDate < cutoffDate) {
          await file.delete();
          cloudDeleted++;
          console.log(`🗑️ Deleted cloud backup: ${file.name}`);
        }
      }
      console.log(`✅ Cloud cleanup completed: ${cloudDeleted} backups deleted`);
    } catch (error) {
      console.warn(`⚠️ Cloud cleanup failed: ${error.message}`);
    }
  }

  async restoreBackup(backupPath: string, targetDatabase?: string): Promise<void> {
    console.log(`🔄 Restoring backup: ${backupPath}`);

    const dbUrl = new URL(process.env.DATABASE_URL!);
    const database = targetDatabase || dbUrl.pathname.slice(1);

    return new Promise((resolve, reject) => {
      const args = [
        '--host', dbUrl.hostname,
        '--port', dbUrl.port || '5432',
        '--username', dbUrl.username,
        '--dbname', database,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        backupPath
      ];

      const pgRestore = spawn('pg_restore', args, {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let errorOutput = '';
      pgRestore.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgRestore.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Backup restored successfully to database: ${database}`);
          resolve();
        } else {
          reject(new Error(`pg_restore failed with code ${code}: ${errorOutput}`));
        }
      });

      pgRestore.on('error', reject);
    });
  }
}

async function main() {
  const command = process.argv[2];
  const backup = new DatabaseBackup();

  try {
    switch (command) {
      case 'create':
        const type = (process.argv[3] as 'full' | 'schema' | 'data') || 'full';
        const options: BackupOptions = {
          type,
          compress: !process.argv.includes('--no-compress'),
          encrypt: process.argv.includes('--encrypt'),
          uploadToCloud: !process.argv.includes('--no-cloud'),
          retentionDays: parseInt(process.argv.find(arg => arg.startsWith('--retention='))?.split('=')[1] || '30')
        };
        await backup.createBackup(options);
        break;

      case 'list':
        await backup.listBackups();
        break;

      case 'cleanup':
        const retentionDays = parseInt(process.argv[3]) || 30;
        await backup.cleanupOldBackups(retentionDays);
        break;

      case 'restore':
        const backupPath = process.argv[3];
        const targetDb = process.argv[4];
        if (!backupPath) {
          console.error('❌ Backup path is required for restore command');
          process.exit(1);
        }
        await backup.restoreBackup(backupPath, targetDb);
        break;

      default:
        console.log(`
Usage: npm run backup <command> [options]

Commands:
  create [type] [options]    Create backup (type: full|schema|data)
  list                      List available backups
  cleanup [days]            Remove backups older than specified days (default: 30)
  restore <path> [db]       Restore backup to database

Options for create:
  --no-compress            Skip compression
  --encrypt               Encrypt backup file
  --no-cloud            Skip Cloud upload
  --retention=<days>      Set retention period (default: 30)

Examples:
  npm run backup create full
  npm run backup create schema --encrypt --retention=90
  npm run backup list
  npm run backup cleanup 7
  npm run backup restore ./backups/vangarments-production-full-2024-01-01.sql
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Backup operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}