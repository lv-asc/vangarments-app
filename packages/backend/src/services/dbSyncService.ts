import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleCloudService } from './googleCloudService';

const execAsync = promisify(exec);

// Full paths to PostgreSQL tools (Homebrew on macOS)
const PSQL_PATH = process.env.PSQL_PATH || '/opt/homebrew/opt/postgresql@15/bin/psql';
const PGDUMP_PATH = process.env.PGDUMP_PATH || '/opt/homebrew/opt/postgresql@15/bin/pg_dump';

interface DatabaseConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}

interface SyncResult {
    success: boolean;
    message: string;
    timestamp: Date;
    rowsCopied?: number;
}

export class DbSyncService {
    private localConfig: DatabaseConfig;
    private cloudConfig: DatabaseConfig;
    private backupDir: string;

    constructor() {
        // Local database config
        this.localConfig = {
            host: 'localhost',
            user: process.env.LOCAL_DB_USER || 'lv',
            password: process.env.LOCAL_DB_PASSWORD || '',
            database: process.env.LOCAL_DB_NAME || 'vangarments',
            port: 5432
        };

        // Cloud database config
        this.cloudConfig = {
            host: process.env.CLOUD_DB_HOST || '34.95.213.176',
            user: process.env.CLOUD_DB_USER || 'postgres',
            password: process.env.CLOUD_DB_PASSWORD || 'VangsCloud2026!',
            database: process.env.CLOUD_DB_NAME || 'vangarments',
            port: 5432
        };

        this.backupDir = path.join(__dirname, '../../backups/sync');
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    /**
     * Get current database mode based on DATABASE_URL
     */
    getCurrentMode(): 'local' | 'cloud' {
        const dbUrl = process.env.DATABASE_URL || '';
        if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
            return 'local';
        }
        return 'cloud';
    }

    /**
     * Get database status info
     */
    async getStatus(): Promise<{
        currentMode: 'local' | 'cloud';
        localConnected: boolean;
        cloudConnected: boolean;
        cloudHost: string;
    }> {
        const currentMode = this.getCurrentMode();

        // Test local connection
        let localConnected = false;
        try {
            const localTest = await this.testConnection(this.localConfig);
            localConnected = localTest;
        } catch (e) {
            localConnected = false;
        }

        // Test cloud connection
        let cloudConnected = false;
        try {
            const cloudTest = await this.testConnection(this.cloudConfig);
            cloudConnected = cloudTest;
        } catch (e) {
            cloudConnected = false;
        }

        return {
            currentMode,
            localConnected,
            cloudConnected,
            cloudHost: this.cloudConfig.host
        };
    }

    /**
     * Test database connection
     */
    private async testConnection(config: DatabaseConfig): Promise<boolean> {
        const env = this.getEnvForConfig(config);
        const cmd = `${PSQL_PATH} -h ${config.host} -U ${config.user} -d ${config.database} -c "SELECT 1" -q`;

        try {
            await execAsync(cmd, { env: { ...process.env, ...env }, timeout: 5000 });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Push local database to cloud
     */
    async pushToCloud(onProgress?: (step: number, totalSteps: number, description: string, details?: string) => void): Promise<SyncResult> {
        const progress = onProgress || (() => { });
        const TOTAL_STEPS = 5;

        console.log('='.repeat(50));
        console.log('[DbSync] PUSH TO CLOUD - STARTED');
        console.log(`[DbSync] Cloud target: ${this.cloudConfig.host}`);
        console.log('='.repeat(50));

        const timestamp = new Date();
        const dumpFile = path.join(this.backupDir, `local_dump_${Date.now()}.sql`);

        try {
            // Step 1: Dump local database
            progress(1, TOTAL_STEPS, 'Dumping local database...', `Exporting from ${this.localConfig.host}/${this.localConfig.database}`);
            console.log('[DbSync] Step 1/4: Dumping local database...');

            const localEnv = this.getEnvForConfig(this.localConfig);
            const dumpCmd = `${PGDUMP_PATH} -h ${this.localConfig.host} -U ${this.localConfig.user} --clean --if-exists ${this.localConfig.database} > "${dumpFile}"`;

            const dumpStart = Date.now();
            await execAsync(dumpCmd, { env: { ...process.env, ...localEnv }, timeout: 300000 });
            const dumpDuration = ((Date.now() - dumpStart) / 1000).toFixed(1);

            const dumpStats = fs.statSync(dumpFile);
            const dumpSizeBytes = dumpStats.size;
            const dumpSizeMB = (dumpSizeBytes / (1024 * 1024)).toFixed(3);
            const dumpSizeText = dumpSizeBytes < 1024 * 1024
                ? `${(dumpSizeBytes / 1024).toFixed(2)} KB`
                : `${dumpSizeMB} MB`;
            console.log(`[DbSync]   ✓ Dump complete! Size: ${dumpSizeText}, Time: ${dumpDuration}s`);

            // Step 2: Fix ownership in dump file
            progress(2, TOTAL_STEPS, 'Preparing dump file...', `Processing ${dumpSizeText} SQL dump`);
            console.log('[DbSync] Step 2/4: Preparing dump file for cloud...');

            let dumpContent = fs.readFileSync(dumpFile, 'utf-8');
            const ownerReplacements = (dumpContent.match(new RegExp(`OWNER TO ${this.localConfig.user}`, 'g')) || []).length;
            dumpContent = dumpContent.replace(new RegExp(`OWNER TO ${this.localConfig.user}`, 'g'), `OWNER TO ${this.cloudConfig.user}`);
            fs.writeFileSync(dumpFile, dumpContent);
            console.log(`[DbSync]   ✓ Fixed ${ownerReplacements} ownership statements`);

            // Step 3: Restore to cloud
            progress(3, TOTAL_STEPS, 'Uploading to cloud...', `Restoring to ${this.cloudConfig.host}`);
            console.log('[DbSync] Step 3/4: Restoring to cloud database...');

            const cloudEnv = this.getEnvForConfig(this.cloudConfig);
            const restoreCmd = `${PSQL_PATH} -h ${this.cloudConfig.host} -U ${this.cloudConfig.user} -d ${this.cloudConfig.database} < "${dumpFile}"`;

            const restoreStart = Date.now();
            await execAsync(restoreCmd, { env: { ...process.env, ...cloudEnv }, timeout: 600000 });
            const restoreDuration = ((Date.now() - restoreStart) / 1000).toFixed(1);
            console.log(`[DbSync]   ✓ Restore complete! Time: ${restoreDuration}s`);

            // Step 4: Sync Assets to Cloud
            progress(4, TOTAL_STEPS, 'Synchronizing assets...', 'Uploading local storage to GCS');
            console.log('[DbSync] Step 4/5: Synchronizing local assets to cloud...');
            const assetSyncResult = await this.syncLocalAssetsToCloud((current: number, total: number, file: string) => {
                progress(4, TOTAL_STEPS, 'Synchronizing assets...', `[${current}/${total}] ${path.basename(file)}`);
            });
            console.log(`[DbSync]   ✓ Asset sync complete! ${assetSyncResult.uploaded} uploaded, ${assetSyncResult.skipped} skipped.`);

            // Step 5: Cleanup
            progress(5, TOTAL_STEPS, 'Cleaning up...', 'Removing old backup files');
            console.log('[DbSync] Step 5/5: Cleanup...');
            this.cleanupOldBackups();

            const totalDuration = ((Date.now() - timestamp.getTime()) / 1000).toFixed(1);
            console.log('='.repeat(50));
            console.log(`[DbSync] PUSH TO CLOUD - COMPLETED in ${totalDuration}s`);
            console.log('='.repeat(50));

            return {
                success: true,
                message: `Pushed ${dumpSizeText} and ${assetSyncResult.uploaded} assets to cloud successfully.`,
                timestamp
            };
        } catch (error: any) {
            console.error('='.repeat(50));
            console.error('[DbSync] PUSH TO CLOUD - FAILED');
            console.error('[DbSync] Error:', error.message);
            console.error('='.repeat(50));
            return {
                success: false,
                message: `Push failed: ${error.message}`,
                timestamp
            };
        }
    }

    /**
     * Pull cloud database to local
     */
    async pullFromCloud(onProgress?: (step: number, totalSteps: number, description: string, details?: string) => void): Promise<SyncResult> {
        const progress = onProgress || (() => { });
        const TOTAL_STEPS = 4;

        console.log('[DbSync] Starting pull from cloud...');
        const timestamp = new Date();
        const dumpFile = path.join(this.backupDir, `cloud_dump_${Date.now()}.sql`);

        try {
            // Step 1: Dump cloud database
            progress(1, TOTAL_STEPS, 'Dumping cloud database...', `Exporting from ${this.cloudConfig.host}/${this.cloudConfig.database}`);
            console.log('[DbSync] Step 1/4: Dumping cloud database...');

            const cloudEnv = this.getEnvForConfig(this.cloudConfig);
            const dumpCmd = `${PGDUMP_PATH} -h ${this.cloudConfig.host} -U ${this.cloudConfig.user} --clean --if-exists ${this.cloudConfig.database} > "${dumpFile}"`;
            await execAsync(dumpCmd, { env: { ...process.env, ...cloudEnv }, timeout: 300000 });

            const dumpStats = fs.statSync(dumpFile);
            const dumpSizeBytes = dumpStats.size;
            const dumpSizeText = dumpSizeBytes < 1024 * 1024
                ? `${(dumpSizeBytes / 1024).toFixed(2)} KB`
                : `${(dumpSizeBytes / (1024 * 1024)).toFixed(3)} MB`;

            // Step 2: Fix ownership in dump file
            progress(2, TOTAL_STEPS, 'Preparing dump file...', `Processing ${dumpSizeText} SQL dump`);
            console.log('[DbSync] Step 2/4: Preparing dump file for local...');

            let dumpContent = fs.readFileSync(dumpFile, 'utf-8');
            dumpContent = dumpContent.replace(new RegExp(`OWNER TO ${this.cloudConfig.user}`, 'g'), `OWNER TO ${this.localConfig.user}`);
            fs.writeFileSync(dumpFile, dumpContent);

            // Step 3: Restore to local
            progress(3, TOTAL_STEPS, 'Restoring to local...', `Importing to ${this.localConfig.host}/${this.localConfig.database}`);
            console.log('[DbSync] Step 3/4: Restoring to local database...');

            const localEnv = this.getEnvForConfig(this.localConfig);
            const restoreCmd = `${PSQL_PATH} -h ${this.localConfig.host} -U ${this.localConfig.user} -d ${this.localConfig.database} < "${dumpFile}"`;
            await execAsync(restoreCmd, { env: { ...process.env, ...localEnv }, timeout: 600000 });

            // Step 4: Cleanup
            progress(4, TOTAL_STEPS, 'Complete!', 'Note: Assets are served via proxy fallback.');
            console.log('[DbSync] Pull from cloud completed successfully.');
            return {
                success: true,
                message: `Pulled ${dumpSizeText} from cloud. Local fallback enabled for assets.`,
                timestamp
            };
        } catch (error: any) {
            console.error('[DbSync] Pull failed:', error);
            return {
                success: false,
                message: `Pull failed: ${error.message}`,
                timestamp
            };
        }
    }

    /**
     * Switch database mode by updating .env file
     */
    async switchMode(targetMode: 'local' | 'cloud'): Promise<SyncResult> {
        const timestamp = new Date();
        const envPath = path.join(__dirname, '../../.env');

        try {
            let envContent = fs.readFileSync(envPath, 'utf-8');

            if (targetMode === 'local') {
                const localUrl = `postgresql://${this.localConfig.user}@${this.localConfig.host}:${this.localConfig.port}/${this.localConfig.database}`;
                envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${localUrl}`);
            } else {
                const cloudUrl = `postgresql://${this.cloudConfig.user}:${this.cloudConfig.password}@${this.cloudConfig.host}:${this.cloudConfig.port}/${this.cloudConfig.database}`;
                envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${cloudUrl}`);
            }

            fs.writeFileSync(envPath, envContent);

            return {
                success: true,
                message: `Switched to ${targetMode} database. Please restart the server.`,
                timestamp
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Switch failed: ${error.message}`,
                timestamp
            };
        }
    }

    private getEnvForConfig(config: DatabaseConfig): Record<string, string> {
        return {
            PGPASSWORD: config.password,
            PGHOST: config.host,
            PGUSER: config.user,
            PGDATABASE: config.database,
            PGPORT: config.port.toString()
        };
    }

    private cleanupOldBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(f => f.endsWith('.sql'))
                .map(f => ({ name: f, time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time);

            // Keep only last 5 backups
            files.slice(5).forEach(f => {
                fs.unlinkSync(path.join(this.backupDir, f.name));
            });
        } catch (e) {
            console.error('[DbSync] Failed to cleanup old backups:', e);
        }
    }

    /**
     * Synchronize all local assets from the storage directory to GCS
     */
    async syncLocalAssetsToCloud(onProgress?: (current: number, total: number, file: string) => void): Promise<{ uploaded: number, skipped: number }> {
        const storageRoot = path.join(process.cwd(), 'storage');
        if (!fs.existsSync(storageRoot)) {
            return { uploaded: 0, skipped: 0 };
        }

        const files: string[] = [];
        const walk = (dir: string) => {
            const list = fs.readdirSync(dir);
            list.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    walk(fullPath);
                } else {
                    files.push(fullPath);
                }
            });
        };

        walk(storageRoot);

        let uploaded = 0;
        let skipped = 0;

        for (let i = 0; i < files.length; i++) {
            const fullPath = files[i];
            const relativePath = path.relative(storageRoot, fullPath);

            // Skip temp files
            if (relativePath.startsWith('temp')) {
                skipped++;
                continue;
            }

            if (onProgress) {
                onProgress(i + 1, files.length, relativePath);
            }

            try {
                const exists = await GoogleCloudService.fileExists(relativePath);
                if (!exists) {
                    const buffer = fs.readFileSync(fullPath);
                    // Determine content type from extension
                    const ext = path.extname(fullPath).toLowerCase();
                    let contentType = 'application/octet-stream';
                    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                    else if (ext === '.png') contentType = 'image/png';
                    else if (ext === '.webp') contentType = 'image/webp';
                    else if (ext === '.psd') contentType = 'image/vnd.adobe.photoshop';
                    else if (ext === '.json') contentType = 'application/json';
                    else if (ext === '.txt') contentType = 'text/plain';
                    else if (ext === '.pdf') contentType = 'application/pdf';

                    await GoogleCloudService.uploadImage(buffer, relativePath, contentType);
                    uploaded++;
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`[DbSync] Failed to sync asset ${relativePath}:`, error);
                skipped++;
            }
        }

        return { uploaded, skipped };
    }
}

export const dbSyncService = new DbSyncService();
