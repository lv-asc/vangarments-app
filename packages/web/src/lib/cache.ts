'use client';

// Client-side caching utilities
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void { // Default 5 minutes
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    });
  }
}

// Global memory cache instance
export const memoryCache = new MemoryCache(200);

// Cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 5 * 60 * 1000);
}

// LocalStorage cache with compression
export class LocalStorageCache {
  private prefix: string;

  constructor(prefix = 'vangarments_cache_') {
    this.prefix = prefix;
  }

  set<T>(key: string, data: T, ttl = 24 * 60 * 60 * 1000): void { // Default 24 hours
    if (typeof window === 'undefined') return;

    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const compressed = this.compress(JSON.stringify(item));
      localStorage.setItem(this.prefix + key, compressed);
    } catch (error) {
      console.warn('Failed to cache item in localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const compressed = localStorage.getItem(this.prefix + key);
      if (!compressed) return null;

      const decompressed = this.decompress(compressed);
      const item: CacheItem<T> = JSON.parse(decompressed);

      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached item from localStorage:', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Simple compression using base64 (for demo - in production use proper compression)
  private compress(data: string): string {
    return btoa(encodeURIComponent(data));
  }

  private decompress(data: string): string {
    return decodeURIComponent(atob(data));
  }

  // Get cache size
  getSize(): number {
    if (typeof window === 'undefined') return 0;

    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        size += localStorage.getItem(key)?.length || 0;
      }
    });
    return size;
  }

  // Cleanup expired items
  cleanup(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const compressed = localStorage.getItem(key);
          if (compressed) {
            const decompressed = this.decompress(compressed);
            const item: CacheItem<any> = JSON.parse(decompressed);

            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    });
  }
}

// Global localStorage cache instance
export const localStorageCache = new LocalStorageCache();

// IndexedDB cache for larger data
export class IndexedDBCache {
  private dbName: string;
  private version: number;
  private storeName: string;

  constructor(dbName = 'VangarmentsCache', version = 1, storeName = 'cache') {
    this.dbName = dbName;
    this.version = version;
    this.storeName = storeName;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(key: string, data: T, ttl = 7 * 24 * 60 * 60 * 1000): Promise<void> { // Default 7 days
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const item = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.warn('Failed to cache item in IndexedDB:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      const item = await new Promise<any>((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      if (!item) return null;

      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        await this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached item from IndexedDB:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.warn('Failed to delete cached item from IndexedDB:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();
    } catch (error) {
      console.warn('Failed to clear IndexedDB cache:', error);
    }
  }
}

// Global IndexedDB cache instance
export const indexedDBCache = new IndexedDBCache();

// Multi-level cache strategy
export class MultiLevelCache {
  async set<T>(key: string, data: T, options?: {
    memoryTTL?: number;
    localStorageTTL?: number;
    indexedDBTTL?: number;
  }): Promise<void> {
    const {
      memoryTTL = 5 * 60 * 1000, // 5 minutes
      localStorageTTL = 24 * 60 * 60 * 1000, // 24 hours
      indexedDBTTL = 7 * 24 * 60 * 60 * 1000, // 7 days
    } = options || {};

    // Store in memory cache for fastest access
    memoryCache.set(key, data, memoryTTL);

    // Store in localStorage for medium-term persistence
    localStorageCache.set(key, data, localStorageTTL);

    // Store in IndexedDB for long-term persistence
    await indexedDBCache.set(key, data, indexedDBTTL);
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    let data = memoryCache.get<T>(key);
    if (data !== null) {
      return data;
    }

    // Try localStorage (medium speed)
    data = localStorageCache.get<T>(key);
    if (data !== null) {
      // Restore to memory cache
      memoryCache.set(key, data);
      return data;
    }

    // Try IndexedDB (slowest but most persistent)
    data = await indexedDBCache.get<T>(key);
    if (data !== null) {
      // Restore to faster caches
      memoryCache.set(key, data);
      localStorageCache.set(key, data);
      return data;
    }

    return null;
  }

  async delete(key: string): Promise<void> {
    memoryCache.delete(key);
    localStorageCache.delete(key);
    await indexedDBCache.delete(key);
  }

  async clear(): Promise<void> {
    memoryCache.clear();
    localStorageCache.clear();
    await indexedDBCache.clear();
  }
}

// Global multi-level cache instance
export const cache = new MultiLevelCache();

// Cache key generators
export const cacheKeys = {
  wardrobeItems: (userId: string, filters?: any) =>
    `wardrobe_${userId}_${JSON.stringify(filters || {})}`,

  outfits: (userId: string, filters?: any) =>
    `outfits_${userId}_${JSON.stringify(filters || {})}`,

  socialFeed: (userId: string, page: number) =>
    `social_feed_${userId}_${page}`,

  marketplaceItems: (filters?: any, page?: number) =>
    `marketplace_${JSON.stringify(filters || {})}_${page || 0}`,

  userProfile: (userId: string) =>
    `user_profile_${userId}`,

  brandCatalog: (brandId: string) =>
    `brand_catalog_${brandId}`,
};

// Cache invalidation utilities
export const invalidateCache = {
  wardrobeItems: (userId: string) => {
    // Invalidate all wardrobe-related cache entries for user
    const patterns = [
      `wardrobe_${userId}`,
      `outfits_${userId}`,
      `social_feed_${userId}`,
    ];

    patterns.forEach(pattern => {
      // This is a simplified approach - in production you'd want more sophisticated pattern matching
      cache.delete(pattern);
    });
  },

  socialFeed: (userId: string) => {
    // Invalidate social feed cache
    for (let page = 0; page < 10; page++) { // Assume max 10 pages cached
      cache.delete(cacheKeys.socialFeed(userId, page));
    }
  },

  all: () => {
    cache.clear();
  },
};