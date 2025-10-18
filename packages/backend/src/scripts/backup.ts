#!/usr/bin/env node

import { Pool } from 'pg';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as dotenv from 'dotenv';

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
  uploadToS3: boolean;
  retentionDays: number;
}

class DatabaseBackup {
  private s3: AWS.S3;
  private backupDir: string;

  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.backupDir = path.join(__dirname, '../../backups');
    
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

      if (options.uploadToS3) {
        await this.uploadToS3(filepath, filename);
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

  private async uploadToS3(filepath: string, filename: string): Promise<void> {
    const bucketName = process.env.S3_BACKUPS_BUCKET;
    if (!bucketName) {
      throw new Error('S3_BACKUPS_BUCKET environment variable is required');
    }

    const fileContent = fs.readFileSync(filepath);
    const key = `database-backups/${environment}/${filename}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA',
      Metadata: {
        environment,
        'backup-type': 'database',
        'created-at': new Date().toISOString()
      }
    };

    await this.s3.upload(params).promise();
    console.log(`📤 Backup uploaded to S3: s3://${bucketName}/${key}`);
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

    // List S3 backups if configured
    const bucketName = process.env.S3_BACKUPS_BUCKET;
    if (bucketName) {
      try {
        console.log('\n☁️ S3 Backups:');
        const params = {
          Bucket: bucketName,
          Prefix: `database-backups/${environment}/`
        };

        const result = await this.s3.listObjectsV2(params).promise();
        
        if (!result.Contents || result.Contents.length === 0) {
          console.log('  No S3 backups found');
        } else {
          result.Contents
            .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0))
            .forEach(obj => {
              const size = ((obj.Size || 0) / 1024 / 1024).toFixed(2);
              console.log(`  - ${obj.Key} (${size} MB) - ${obj.LastModified?.toISOString()}`);
            });
        }
      } catch (error) {
        console.error('❌ Failed to list S3 backups:', error.message);
      }
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

    // Cleanup S3 backups
    const bucketName = process.env.S3_BACKUPS_BUCKET;
    if (bucketName) {
      try {
        const params = {
          Bucket: bucketName,
          Prefix: `database-backups/${environment}/`
        };

        const result = await this.s3.listObjectsV2(params).promise();
        let s3Deleted = 0;

        if (result.Contents) {
          for (const obj of result.Contents) {
            if (obj.LastModified && obj.LastModified < cutoffDate) {
              await this.s3.deleteObject({
                Bucket: bucketName,
                Key: obj.Key!
              }).promise();
              s3Deleted++;
              console.log(`🗑️ Deleted S3 backup: ${obj.Key}`);
            }
          }
        }

        console.log(`✅ Cleanup completed: ${localDeleted} local, ${s3Deleted} S3 backups deleted`);
      } catch (error) {
        console.error('❌ S3 cleanup failed:', error.message);
      }
    } else {
      console.log(`✅ Local cleanup completed: ${localDeleted} backups deleted`);
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
          uploadToS3: !process.argv.includes('--no-s3'),
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
  --no-s3                 Skip S3 upload
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