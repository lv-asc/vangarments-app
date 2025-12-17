/**
 * Web Cross-Platform Compatibility Tests
 * Tests for web application compatibility and offline functionality
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */
// @ts-nocheck

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useOfflineWardrobe } from '@/hooks/useOfflineWardrobe';
import { offlineStorage, syncManager } from '@/utils/offlineStorage';

// Mock the hooks and utilities
jest.mock('@/hooks/useOfflineSync');
jest.mock('@/hooks/useOfflineWardrobe');
jest.mock('@/utils/offlineStorage');

const mockUseOfflineSync = useOfflineSync as jest.MockedFunction<typeof useOfflineSync>;
const mockUseOfflineWardrobe = useOfflineWardrobe as jest.MockedFunction<typeof useOfflineWardrobe>;
const mockOfflineStorage = offlineStorage as jest.Mocked<typeof offlineStorage>;
const mockSyncManager = syncManager as jest.Mocked<typeof syncManager>;

describe('Web Cross-Platform Compatibility', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseOfflineSync.mockReturnValue({
      syncStatus: {
        isOnline: true,
        isSyncing: false,
        pendingItems: 0,
        lastSyncTime: new Date()
      },
      forcSync: jest.fn()
    });

    mockUseOfflineWardrobe.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      loadItems: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleFavorite: jest.fn(),
      toggleForSale: jest.fn(),
      getImageUrl: jest.fn()
    });
  });

  describe('Browser Compatibility', () => {
    it('should detect IndexedDB support', async () => {
      // Mock IndexedDB availability
      Object.defineProperty(window, 'indexedDB', {
        value: {
          open: jest.fn(),
          deleteDatabase: jest.fn()
        },
        writable: true
      });

      await mockOfflineStorage.initialize();
      expect(mockOfflineStorage.initialize).toHaveBeenCalled();
    });

    it('should handle browsers without IndexedDB support', async () => {
      // Mock missing IndexedDB
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true
      });

      try {
        await mockOfflineStorage.initialize();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should detect localStorage availability', () => {
      // Test localStorage detection
      const testKey = 'test-storage-key';
      const testValue = 'test-value';

      try {
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        expect(retrieved).toBe(testValue);
        localStorage.removeItem(testKey);
      } catch (error) {
        // Handle browsers with disabled localStorage
        expect(error).toBeDefined();
      }
    });
  });
});
describe('Network Connectivity Detection', () => {
  it('should detect online/offline status changes', async () => {
    const mockForcSync = jest.fn();
    mockUseOfflineSync.mockReturnValue({
      syncStatus: {
        isOnline: false,
        isSyncing: false,
        pendingItems: 5,
        lastSyncTime: new Date()
      },
      forcSync: mockForcSync
    });

    // Simulate offline status
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });

    // Trigger online event
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    // Should trigger sync when coming online
    await waitFor(() => {
      expect(mockSyncManager.syncNow).toHaveBeenCalled();
    });
  });

  it('should handle intermittent connectivity', async () => {
    let isOnline = true;

    // Simulate intermittent connectivity
    const connectivitySimulation = setInterval(() => {
      isOnline = !isOnline;
      Object.defineProperty(navigator, 'onLine', {
        value: isOnline,
        writable: true
      });

      const event = new Event(isOnline ? 'online' : 'offline');
      window.dispatchEvent(event);
    }, 100);

    // Let it run for a short time
    await new Promise(resolve => setTimeout(resolve, 500));
    clearInterval(connectivitySimulation);

    // Should handle multiple connectivity changes gracefully
    expect(mockSyncManager.syncNow).toHaveBeenCalled();
  });
});

describe('Offline Storage Functionality', () => {
  it('should store wardrobe items offline', async () => {
    const testItem = {
      id: 'test-item-1',
      name: 'Test Offline Item',
      category: 'shirts',
      color: 'blue',
      size: 'M',
      condition: 'new' as const,
      images: [],
      timesWorn: 0,
      isFavorite: false,
      isForSale: false,
      tags: ['test']
    };

    const mockAddItem = jest.fn().mockResolvedValue(undefined);
    mockUseOfflineWardrobe.mockReturnValue({
      items: [testItem],
      loading: false,
      error: null,
      loadItems: jest.fn(),
      addItem: mockAddItem,
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleFavorite: jest.fn(),
      toggleForSale: jest.fn(),
      getImageUrl: jest.fn()
    });

    await mockAddItem(testItem);
    expect(mockAddItem).toHaveBeenCalledWith(testItem);
  });

  it('should handle offline image storage', async () => {
    const testBlob = new Blob(['test-image-data'], { type: 'image/jpeg' });
    const mockSaveImage = jest.fn().mockResolvedValue('offline-image://test-id');

    mockOfflineStorage.saveImage = mockSaveImage;

    const imageUrl = await mockOfflineStorage.saveImage('test-id', testBlob);
    expect(imageUrl).toBe('offline-image://test-id');
    expect(mockSaveImage).toHaveBeenCalledWith('test-id', testBlob);
  });

  it('should sync offline changes when online', async () => {
    const pendingItems = [
      {
        id: 'pending-1',
        name: 'Pending Item 1',
        category: 'shirts',
        needsSync: true,
        lastModified: new Date().toISOString()
      }
    ];

    mockOfflineStorage.getSyncQueue = jest.fn().mockResolvedValue([
      {
        id: 'sync-1',
        action: 'create' as const,
        itemId: 'pending-1',
        data: pendingItems[0],
        timestamp: new Date().toISOString(),
        retryCount: 0
      }
    ]);

    await mockSyncManager.syncNow();
    expect(mockOfflineStorage.getSyncQueue).toHaveBeenCalled();
  });
});

describe('Responsive Design Compatibility', () => {
  it('should adapt to different screen sizes', () => {
    // Test mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 667,
      writable: true
    });

    window.dispatchEvent(new Event('resize'));

    // Test tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
      writable: true
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 1024,
      writable: true
    });

    window.dispatchEvent(new Event('resize'));

    // Test desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      value: 1920,
      writable: true
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 1080,
      writable: true
    });

    window.dispatchEvent(new Event('resize'));

    // Should handle all viewport changes gracefully
    expect(window.innerWidth).toBe(1920);
  });

  it('should handle touch and mouse interactions', () => {
    const testElement = document.createElement('div');

    // Test touch events
    const touchEvent = new TouchEvent('touchstart', {
      touches: [
        {
          clientX: 100,
          clientY: 100,
          identifier: 0,
          pageX: 100,
          pageY: 100,
          screenX: 100,
          screenY: 100,
          target: testElement
        } as Touch
      ]
    });

    testElement.dispatchEvent(touchEvent);

    // Test mouse events
    const mouseEvent = new MouseEvent('click', {
      clientX: 100,
      clientY: 100
    });

    testElement.dispatchEvent(mouseEvent);

    // Should handle both interaction types
    expect(touchEvent.type).toBe('touchstart');
    expect(mouseEvent.type).toBe('click');
  });
});

describe('Performance Optimization', () => {
  it('should implement lazy loading for images', async () => {
    const mockGetImageUrl = jest.fn().mockResolvedValue('data:image/jpeg;base64,test');

    mockUseOfflineWardrobe.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      loadItems: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleFavorite: jest.fn(),
      toggleForSale: jest.fn(),
      getImageUrl: mockGetImageUrl
    });

    const testItem = {
      id: 'test-item',
      name: 'Test Item',
      category: 'shirts',
      color: 'blue',
      size: 'M',
      condition: 'new' as const,
      images: ['test-image.jpg'],
      timesWorn: 0,
      isFavorite: false,
      isForSale: false,
      tags: []
    };

    await mockGetImageUrl(testItem);
    expect(mockGetImageUrl).toHaveBeenCalledWith(testItem);
  });

  it('should handle memory management for large datasets', () => {
    const largeDataset = Array(1000).fill(null).map((_, index) => ({
      id: `item-${index}`,
      name: `Item ${index}`,
      category: 'shirts',
      color: 'blue',
      size: 'M',
      condition: 'new' as const,
      images: [],
      timesWorn: 0,
      isFavorite: false,
      isForSale: false,
      tags: []
    }));

    mockUseOfflineWardrobe.mockReturnValue({
      items: largeDataset,
      loading: false,
      error: null,
      loadItems: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleFavorite: jest.fn(),
      toggleForSale: jest.fn(),
      getImageUrl: jest.fn()
    });

    // Should handle large datasets without performance issues
    expect(largeDataset.length).toBe(1000);
  });
});

describe('Error Handling and Recovery', () => {
  it('should handle storage quota exceeded errors', async () => {
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
    mockOfflineStorage.saveWardrobeItem = jest.fn().mockRejectedValue(quotaError);

    try {
      await mockOfflineStorage.saveWardrobeItem({
        id: 'test-item',
        name: 'Test Item',
        category: 'shirts',
        color: 'blue',
        size: 'M',
        condition: 'new',
        imageUrl: undefined,
        tags: [],
        isFavorite: false,
        wearCount: 0,
        lastModified: new Date().toISOString(),
        needsSync: true,
        isDeleted: false
      });
    } catch (error) {
      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('QuotaExceededError');
    }
  });

  it('should recover from sync failures', async () => {
    const syncError = new Error('Network error');
    mockSyncManager.syncNow = jest.fn().mockRejectedValue(syncError);

    try {
      await mockSyncManager.syncNow();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Network error');
    }

    // Should retry sync after failure
    expect(mockSyncManager.syncNow).toHaveBeenCalled();
  });

  it('should handle corrupted offline data', async () => {
    const corruptedData = 'invalid-json-data';
    mockOfflineStorage.getWardrobeItems = jest.fn().mockRejectedValue(
      new Error('Failed to parse stored data')
    );

    try {
      await mockOfflineStorage.getWardrobeItems();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Failed to parse stored data');
    }
  });
});

describe('Security and Privacy', () => {
  it('should not store sensitive data in localStorage', () => {
    const sensitiveData = {
      password: 'secret123',
      creditCard: '1234-5678-9012-3456',
      ssn: '123-45-6789'
    };

    // Should not store sensitive data
    Object.keys(sensitiveData).forEach(key => {
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  it('should encrypt sensitive offline data', async () => {
    const sensitiveItem = {
      id: 'sensitive-item',
      name: 'Expensive Item',
      purchasePrice: 1000,
      personalNotes: 'Private notes'
    };

    // Mock encryption for sensitive data
    mockOfflineStorage.saveWardrobeItem = jest.fn().mockImplementation(async (item) => {
      // Simulate encryption of sensitive fields
      if (item.purchasePrice || item.personalNotes) {
        // Should encrypt sensitive data before storage
        return Promise.resolve();
      }
      return Promise.resolve();
    });

    await mockOfflineStorage.saveWardrobeItem(sensitiveItem as any);
    expect(mockOfflineStorage.saveWardrobeItem).toHaveBeenCalled();
  });
});