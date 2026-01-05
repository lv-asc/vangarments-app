import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

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
        const cmd = `psql -h ${config.host} -U ${config.user} -d ${config.database} -c "SELECT 1" -q`;

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
    async pushToCloud(): Promise<SyncResult> {
        console.log('[DbSync] Starting push to cloud...');
        const timestamp = new Date();
        const dumpFile = path.join(this.backupDir, `local_dump_${Date.now()}.sql`);

        try {
            // Step 1: Dump local database
            console.log('[DbSync] Dumping local database...');
            const localEnv = this.getEnvForConfig(this.localConfig);
            const dumpCmd = `pg_dump -h ${this.localConfig.host} -U ${this.localConfig.user} --clean --if-exists ${this.localConfig.database} > "${dumpFile}"`;
            await execAsync(dumpCmd, { env: { ...process.env, ...localEnv }, timeout: 300000 });

            // Step 2: Fix ownership in dump file (replace local user with cloud user)
            console.log('[DbSync] Preparing dump file for cloud...');
            let dumpContent = fs.readFileSync(dumpFile, 'utf-8');
            dumpContent = dumpContent.replace(new RegExp(`OWNER TO ${this.localConfig.user}`, 'g'), `OWNER TO ${this.cloudConfig.user}`);
            fs.writeFileSync(dumpFile, dumpContent);

            // Step 3: Restore to cloud
            console.log('[DbSync] Restoring to cloud database...');
            const cloudEnv = this.getEnvForConfig(this.cloudConfig);
            const restoreCmd = `psql -h ${this.cloudConfig.host} -U ${this.cloudConfig.user} -d ${this.cloudConfig.database} < "${dumpFile}"`;
            await execAsync(restoreCmd, { env: { ...process.env, ...cloudEnv }, timeout: 600000 });

            // Cleanup old dump files (keep last 5)
            this.cleanupOldBackups();

            console.log('[DbSync] Push to cloud completed successfully.');
            return {
                success: true,
                message: 'Successfully pushed local database to cloud',
                timestamp
            };
        } catch (error: any) {
            console.error('[DbSync] Push failed:', error);
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
    async pullFromCloud(): Promise<SyncResult> {
        console.log('[DbSync] Starting pull from cloud...');
        const timestamp = new Date();
        const dumpFile = path.join(this.backupDir, `cloud_dump_${Date.now()}.sql`);

        try {
            // Step 1: Dump cloud database
            console.log('[DbSync] Dumping cloud database...');
            const cloudEnv = this.getEnvForConfig(this.cloudConfig);
            const dumpCmd = `pg_dump -h ${this.cloudConfig.host} -U ${this.cloudConfig.user} --clean --if-exists ${this.cloudConfig.database} > "${dumpFile}"`;
            await execAsync(dumpCmd, { env: { ...process.env, ...cloudEnv }, timeout: 300000 });

            // Step 2: Fix ownership in dump file (replace cloud user with local user)
            console.log('[DbSync] Preparing dump file for local...');
            let dumpContent = fs.readFileSync(dumpFile, 'utf-8');
            dumpContent = dumpContent.replace(new RegExp(`OWNER TO ${this.cloudConfig.user}`, 'g'), `OWNER TO ${this.localConfig.user}`);
            fs.writeFileSync(dumpFile, dumpContent);

            // Step 3: Restore to local
            console.log('[DbSync] Restoring to local database...');
            const localEnv = this.getEnvForConfig(this.localConfig);
            const restoreCmd = `psql -h ${this.localConfig.host} -U ${this.localConfig.user} -d ${this.localConfig.database} < "${dumpFile}"`;
            await execAsync(restoreCmd, { env: { ...process.env, ...localEnv }, timeout: 600000 });

            // Cleanup old dump files
            this.cleanupOldBackups();

            console.log('[DbSync] Pull from cloud completed successfully.');
            return {
                success: true,
                message: 'Successfully pulled cloud database to local',
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
}

export const dbSyncService = new DbSyncService();
