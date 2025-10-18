import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface ConfigurationChangeEvent {
  type: 'vufs' | 'system' | 'ui' | 'business' | 'features';
  filePath: string;
  timestamp: Date;
  userId?: string;
}

export class ConfigurationWatcherService extends EventEmitter {
  private static instance: ConfigurationWatcherService;
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private readonly SHARED_DIR = path.join(process.cwd(), 'packages/shared/src');

  private constructor() {
    super();
    this.setupWatchers();
  }

  static getInstance(): ConfigurationWatcherService {
    if (!ConfigurationWatcherService.instance) {
      ConfigurationWatcherService.instance = new ConfigurationWatcherService();
    }
    return ConfigurationWatcherService.instance;
  }

  private setupWatchers(): void {
    const filesToWatch = [
      {
        path: path.join(this.SHARED_DIR, 'constants/vufs.ts'),
        type: 'vufs' as const,
      },
      {
        path: path.join(this.SHARED_DIR, 'types/vufs.ts'),
        type: 'vufs' as const,
      },
      {
        path: path.join(this.SHARED_DIR, 'config/system.json'),
        type: 'system' as const,
      },
    ];

    for (const file of filesToWatch) {
      this.watchFile(file.path, file.type);
    }
  }

  private watchFile(filePath: string, type: ConfigurationChangeEvent['type']): void {
    try {
      // Check if file exists before watching
      if (!fs.existsSync(filePath)) {
        console.log(`Configuration file ${filePath} does not exist, will watch for creation`);
        
        // Watch the directory for file creation
        const dir = path.dirname(filePath);
        if (fs.existsSync(dir)) {
          const dirWatcher = fs.watch(dir, (eventType, filename) => {
            if (filename === path.basename(filePath) && eventType === 'rename') {
              // File was created, start watching it
              this.watchFile(filePath, type);
              dirWatcher.close();
            }
          });
          this.watchers.set(`${filePath}-dir`, dirWatcher);
        }
        return;
      }

      const watcher = fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          const event: ConfigurationChangeEvent = {
            type,
            filePath,
            timestamp: new Date(),
          };

          console.log(`Configuration file changed: ${filePath}`);
          this.emit('configurationChanged', event);
          
          // Emit specific event type
          this.emit(`${type}ConfigurationChanged`, event);
        }
      });

      this.watchers.set(filePath, watcher);
      console.log(`Watching configuration file: ${filePath}`);
    } catch (error) {
      console.error(`Error setting up watcher for ${filePath}:`, error);
    }
  }

  /**
   * Manually trigger a configuration reload
   */
  triggerReload(type: ConfigurationChangeEvent['type'], userId?: string): void {
    const event: ConfigurationChangeEvent = {
      type,
      filePath: 'manual-trigger',
      timestamp: new Date(),
      userId,
    };

    this.emit('configurationChanged', event);
    this.emit(`${type}ConfigurationChanged`, event);
  }

  /**
   * Stop watching all files
   */
  stopWatching(): void {
    for (const [filePath, watcher] of this.watchers) {
      try {
        watcher.close();
        console.log(`Stopped watching: ${filePath}`);
      } catch (error) {
        console.error(`Error stopping watcher for ${filePath}:`, error);
      }
    }
    this.watchers.clear();
  }

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchers.keys()).filter(key => !key.endsWith('-dir'));
  }

  /**
   * Check if a file is being watched
   */
  isWatching(filePath: string): boolean {
    return this.watchers.has(filePath);
  }

  /**
   * Add a new file to watch
   */
  addWatcher(filePath: string, type: ConfigurationChangeEvent['type']): void {
    if (!this.isWatching(filePath)) {
      this.watchFile(filePath, type);
    }
  }

  /**
   * Remove a file from watching
   */
  removeWatcher(filePath: string): void {
    const watcher = this.watchers.get(filePath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(filePath);
      console.log(`Removed watcher for: ${filePath}`);
    }
  }
}

// Export singleton instance
export const configurationWatcher = ConfigurationWatcherService.getInstance();

// Setup event handlers for configuration changes
configurationWatcher.on('configurationChanged', (event: ConfigurationChangeEvent) => {
  console.log(`Configuration changed: ${event.type} at ${event.timestamp}`);
  
  // Here you could implement additional logic like:
  // - Notifying connected clients via WebSocket
  // - Updating in-memory caches
  // - Triggering dependent service reloads
  // - Logging configuration changes for audit
});

configurationWatcher.on('vufsConfigurationChanged', (event: ConfigurationChangeEvent) => {
  console.log('VUFS configuration changed, clearing related caches...');
  
  // Clear any VUFS-related caches
  // Notify VUFS management service of changes
});

configurationWatcher.on('systemConfigurationChanged', (event: ConfigurationChangeEvent) => {
  console.log('System configuration changed, updating runtime settings...');
  
  // Update system-wide settings
  // Notify relevant services of configuration changes
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down configuration watcher...');
  configurationWatcher.stopWatching();
});

process.on('SIGTERM', () => {
  console.log('Shutting down configuration watcher...');
  configurationWatcher.stopWatching();
});