// Offline Storage Utilities for Web Application
// Implements IndexedDB for offline functionality and sync capabilities

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  color: string;
  size: string;
  condition: string;
  imageUrl?: string;
  localImageBlob?: Blob;
  tags: string[];
  isFavorite: boolean;
  wearCount: number;
  lastWorn?: string;
  vufsId?: string;
  lastModified: string;
  needsSync: boolean;
  isDeleted: boolean;
}

interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  itemId: string;
  data?: any;
  timestamp: string;
  retryCount: number;
}

class OfflineStorageManager {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'VangarmentsDB';
  private readonly dbVersion = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Wardrobe Items Store
        if (!db.objectStoreNames.contains('wardrobeItems')) {
          const itemsStore = db.createObjectStore('wardrobeItems', { keyPath: 'id' });
          itemsStore.createIndex('category', 'category', { unique: false });
          itemsStore.createIndex('needsSync', 'needsSync', { unique: false });
          itemsStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        // Images Store (for offline images)
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
        }

        // User Preferences Store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };
    });
  }

  // Wardrobe Items Management
  async saveWardrobeItem(item: WardrobeItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['wardrobeItems'], 'readwrite');
    const store = transaction.objectStore('wardrobeItems');

    const itemToSave = {
      ...item,
      lastModified: new Date().toISOString(),
      needsSync: true
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(itemToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Add to sync queue
    await this.addToSyncQueue('update', item.id, itemToSave);
  }

  async getWardrobeItems(filters?: {
    category?: string;
    searchQuery?: string;
    onlyFavorites?: boolean;
  }): Promise<WardrobeItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['wardrobeItems'], 'readonly');
    const store = transaction.objectStore('wardrobeItems');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let items = (request.result as WardrobeItem[]).filter(item => !item.isDeleted);

        // Apply filters
        if (filters) {
          if (filters.category && filters.category !== 'all') {
            items = items.filter(item => item.category === filters.category);
          }

          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            items = items.filter(item =>
              item.name.toLowerCase().includes(query) ||
              item.brand?.toLowerCase().includes(query) ||
              item.tags.some(tag => tag.toLowerCase().includes(query))
            );
          }

          if (filters.onlyFavorites) {
            items = items.filter(item => item.isFavorite);
          }
        }

        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getWardrobeItem(id: string): Promise<WardrobeItem | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['wardrobeItems'], 'readonly');
    const store = transaction.objectStore('wardrobeItems');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result;
        resolve(item && !item.isDeleted ? item : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWardrobeItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const item = await this.getWardrobeItem(id);
    if (!item) return;

    const deletedItem = {
      ...item,
      isDeleted: true,
      lastModified: new Date().toISOString(),
      needsSync: true
    };

    const transaction = this.db.transaction(['wardrobeItems'], 'readwrite');
    const store = transaction.objectStore('wardrobeItems');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(deletedItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    await this.addToSyncQueue('delete', id, deletedItem);
  }

  // Image Management
  async saveImage(id: string, blob: Blob): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');

    const imageData = {
      id,
      blob,
      timestamp: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(imageData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return `offline-image://${id}`;
  }

  async getImage(id: string): Promise<Blob | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Management
  private async addToSyncQueue(action: 'create' | 'update' | 'delete', itemId: string, data?: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const syncItem: SyncQueue = {
      id: `${action}-${itemId}-${Date.now()}`,
      action,
      itemId,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(syncItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(item: SyncQueue): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Preferences Management
  async savePreference(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['preferences'], 'readwrite');
    const store = transaction.objectStore('preferences');

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPreference(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['preferences'], 'readonly');
    const store = transaction.objectStore('preferences');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const storeNames = ['wardrobeItems', 'syncQueue', 'images', 'preferences'];
    const transaction = this.db.transaction(storeNames, 'readwrite');

    await Promise.all(
      storeNames.map(storeName => {
        return new Promise<void>((resolve, reject) => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      })
    );
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageManager();

// Sync Manager for handling online/offline synchronization
export class SyncManager {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
  private syncInProgress = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncNow();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  async startPeriodicSync(intervalMs = 30000): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncNow();
      }
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncNow(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const syncQueue = await offlineStorage.getSyncQueue();

      for (const syncItem of syncQueue) {
        try {
          await this.processSyncItem(syncItem);
          await offlineStorage.removeSyncQueueItem(syncItem.id);
        } catch (error) {
          console.error('Sync error for item:', syncItem.id, error);

          // Increment retry count
          syncItem.retryCount++;

          // Remove from queue if too many retries
          if (syncItem.retryCount >= 3) {
            await offlineStorage.removeSyncQueueItem(syncItem.id);
          } else {
            await offlineStorage.updateSyncQueueItem(syncItem);
          }
        }
      }
    } catch (error) {
      console.error('Sync process error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processSyncItem(syncItem: SyncQueue): Promise<void> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    switch (syncItem.action) {
      case 'create':
      case 'update':
        await fetch(`${API_BASE_URL}/wardrobe/items/${syncItem.itemId}`, {
          method: syncItem.action === 'create' ? 'POST' : 'PUT',
          headers,
          body: JSON.stringify(syncItem.data)
        });
        break;

      case 'delete':
        await fetch(`${API_BASE_URL}/wardrobe/items/${syncItem.itemId}`, {
          method: 'DELETE',
          headers
        });
        break;
    }
  }

  get isConnected(): boolean {
    return this.isOnline;
  }

  get isSyncing(): boolean {
    return this.syncInProgress;
  }
}

export const syncManager = new SyncManager();