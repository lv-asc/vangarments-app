import path from 'path';
import fs from 'fs';

export interface LocalConfig {
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
    idleTimeout: number;
  };
  storage: {
    enabled: boolean;
    basePath: string;
    paths: {
      images: string;
      uploads: string;
      processed: string;
      thumbnails: string;
      temp: string;
      backups: string;
    };
  };
  server: {
    port: number;
    host: string;
    environment: string;
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    filePath: string;
  };
}

class LocalConfigManager {
  private config: LocalConfig;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'local.json');
    this.config = this.loadConfig();
    this.ensureDirectories();
  }

  private loadConfig(): LocalConfig {
    const defaultConfig: LocalConfig = {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://lv@localhost:5432/vangarments',
        maxConnections: 20,
        connectionTimeout: 2000,
        idleTimeout: 30000,
      },
      storage: {
        enabled: process.env.LOCAL_STORAGE_ENABLED === 'true',
        basePath: process.env.LOCAL_STORAGE_PATH || './storage',
        paths: {
          images: process.env.LOCAL_IMAGES_PATH || './storage/images',
          uploads: process.env.LOCAL_UPLOADS_PATH || './storage/images/uploads',
          processed: process.env.LOCAL_PROCESSED_PATH || './storage/images/processed',
          thumbnails: process.env.LOCAL_THUMBNAILS_PATH || './storage/images/thumbnails',
          temp: process.env.LOCAL_TEMP_PATH || './storage/temp',
          backups: process.env.LOCAL_BACKUPS_PATH || './storage/backups',
        },
      },
      server: {
        port: parseInt(process.env.PORT || '3001'),
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: process.env.LOG_TO_FILE === 'true',
        filePath: process.env.LOG_FILE_PATH || './logs/app.log',
      },
    };

    // Try to load from file if it exists
    if (fs.existsSync(this.configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { ...defaultConfig, ...fileConfig };
      } catch (error) {
        console.warn('Failed to load local config file, using defaults:', error);
      }
    }

    return defaultConfig;
  }

  private ensureDirectories(): void {
    if (this.config.storage.enabled) {
      Object.values(this.config.storage.paths).forEach(dirPath => {
        const fullPath = path.resolve(dirPath);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`📁 Created directory: ${fullPath}`);
        }
      });
    }

    // Ensure logs directory exists if file logging is enabled
    if (this.config.logging.enableFile) {
      const logDir = path.dirname(path.resolve(this.config.logging.filePath));
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(`📁 Created log directory: ${logDir}`);
      }
    }
  }

  public getConfig(): LocalConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<LocalConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.ensureDirectories();
  }

  private saveConfig(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    console.log(`💾 Local configuration saved to: ${this.configPath}`);
  }

  public validateConfig(): boolean {
    try {
      // Validate database connection string
      if (!this.config.database.url) {
        throw new Error('Database URL is required');
      }

      // Validate storage paths if enabled
      if (this.config.storage.enabled) {
        Object.entries(this.config.storage.paths).forEach(([key, path]) => {
          if (!path) {
            throw new Error(`Storage path for ${key} is required`);
          }
        });
      }

      // Validate server configuration
      if (!this.config.server.port || this.config.server.port < 1 || this.config.server.port > 65535) {
        throw new Error('Valid server port is required');
      }

      console.log('✅ Local configuration validation passed');
      return true;
    } catch (error) {
      console.error('❌ Local configuration validation failed:', error);
      return false;
    }
  }

  public getStoragePath(type: keyof LocalConfig['storage']['paths']): string {
    return path.resolve(this.config.storage.paths[type]);
  }

  public isDevelopment(): boolean {
    return this.config.server.environment === 'development';
  }

  public isLocalStorageEnabled(): boolean {
    return this.config.storage.enabled;
  }
}

export const localConfig = new LocalConfigManager();
export default localConfig;