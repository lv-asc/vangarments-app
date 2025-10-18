/**
 * Offline Functionality and Sync Tests
 * Tests for offline storage, sync mechanisms, and data consistency
 * Requirements: 13.2, 13.3, 13.4
 */

import request from 'supertest';
import { app } from '../testApp';

describe('Offline Functionality and Sync Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        name: 'Offline Test User',
        email: 'offline@test.com',
        password: 'testpassword123',
        cpf: '98765432101'
      });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'offline@test.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;
  });

  describe('Sync Queue Management', () => {
    it('should handle sync queue operations for offline changes', async () => {
      // Simulate offline item creation
      const offlineItems = [
        {
          id: 'offline-item-1',
          name: 'Offline Created Item 1',
          category: 'shirts',
          color: 'blue',
          size: 'M',
          condition: 'new',
          lastModified: new Date().toISOString(),
          needsSync: true
        },
        {
          id: 'offline-item-2', 
          name: 'Offline Created Item 2',
          category: 'pants',
          color: 'black',
          size: 'L',
          condition: 'excellent',
          lastModified: new Date().toISOString(),
          needsSync: true
        }
      ];

      // Test sync endpoint for batch operations
      const syncResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: offlineItems,
          syncTimestamp: new Date().toISOString()
        });

      expect([200, 201]).toContain(syncResponse.status);
      expect(syncResponse.body.success).toBe(true);
      expect(syncResponse.body.data).toHaveProperty('syncedItems');
      expect(Array.isArray(syncResponse.body.data.syncedItems)).toBe(true);
    });

    it('should handle conflict resolution during sync', async () => {
      // Create item on server
      const serverItem = await request(app)
        .post('/wardrobe/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Conflict Test Item',
          category: 'shirts',
          color: 'red',
          size: 'M',
          condition: 'new'
        });

      const itemId = serverItem.body.data.id;
      const serverTimestamp = serverItem.body.data.lastModified;

      // Simulate offline modification with older timestamp
      const offlineModification = {
        id: itemId,
        name: 'Offline Modified Item',
        color: 'blue',
        lastModified: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        needsSync: true
      };

      // Attempt sync with conflict
      const conflictResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [offlineModification],
          syncTimestamp: new Date().toISOString()
        });

      expect(conflictResponse.status).toBe(200);
      expect(conflictResponse.body.data).toHaveProperty('conflicts');
      expect(Array.isArray(conflictResponse.body.data.conflicts)).toBe(true);
    });

    it('should handle incremental sync with timestamps', async () => {
      const baseTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      // Get incremental changes since timestamp
      const incrementalResponse = await request(app)
        .get(`/sync/wardrobe-items/incremental?since=${baseTimestamp}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(incrementalResponse.status).toBe(200);
      expect(incrementalResponse.body.success).toBe(true);
      expect(incrementalResponse.body.data).toHaveProperty('items');
      expect(incrementalResponse.body.data).toHaveProperty('lastSyncTimestamp');
      expect(Array.isArray(incrementalResponse.body.data.items)).toBe(true);
    });

    it('should handle sync retry mechanisms', async () => {
      const failingItem = {
        id: 'failing-sync-item',
        name: '', // Invalid data to cause sync failure
        category: 'invalid-category',
        lastModified: new Date().toISOString(),
        needsSync: true,
        retryCount: 2
      };

      const retryResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [failingItem],
          syncTimestamp: new Date().toISOString()
        });

      expect(retryResponse.status).toBe(400);
      expect(retryResponse.body.success).toBe(false);
      expect(retryResponse.body.error).toHaveProperty('code', 'SYNC_VALIDATION_ERROR');
    });
  });

  describe('Offline Data Consistency', () => {
    it('should maintain referential integrity during offline operations', async () => {
      // Create outfit with items
      const item1Response = await request(app)
        .post('/wardrobe/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Outfit Item 1',
          category: 'shirts',
          color: 'white',
          size: 'M',
          condition: 'new'
        });

      const item2Response = await request(app)
        .post('/wardrobe/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Outfit Item 2',
          category: 'pants',
          color: 'blue',
          size: 'M',
          condition: 'new'
        });

      const outfitData = {
        name: 'Test Outfit',
        items: [item1Response.body.data.id, item2Response.body.data.id],
        occasion: 'casual',
        season: 'summer'
      };

      const outfitResponse = await request(app)
        .post('/outfits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(outfitData);

      expect(outfitResponse.status).toBe(201);
      expect(outfitResponse.body.data.items).toHaveLength(2);
    });

    it('should handle orphaned references during sync', async () => {
      // Simulate sync with missing referenced items
      const orphanedOutfit = {
        id: 'orphaned-outfit',
        name: 'Orphaned Outfit',
        items: ['nonexistent-item-1', 'nonexistent-item-2'],
        lastModified: new Date().toISOString(),
        needsSync: true
      };

      const orphanResponse = await request(app)
        .post('/sync/outfits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          outfits: [orphanedOutfit],
          syncTimestamp: new Date().toISOString()
        });

      expect(orphanResponse.status).toBe(400);
      expect(orphanResponse.body.error).toHaveProperty('code', 'REFERENCE_ERROR');
    });
  });

  describe('Network Connectivity Simulation', () => {
    it('should handle intermittent connectivity during sync', async () => {
      const items = Array(5).fill(null).map((_, index) => ({
        id: `intermittent-item-${index}`,
        name: `Intermittent Item ${index}`,
        category: 'shirts',
        color: 'red',
        size: 'M',
        condition: 'new',
        lastModified: new Date().toISOString(),
        needsSync: true
      }));

      // Simulate partial sync success
      const partialSyncResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Simulate-Network-Error', 'partial') // Custom header for testing
        .send({
          items,
          syncTimestamp: new Date().toISOString()
        });

      // Should handle partial failures gracefully
      expect([200, 207]).toContain(partialSyncResponse.status); // 207 = Multi-Status
    });

    it('should queue operations when offline', async () => {
      const offlineOperations = [
        {
          type: 'create',
          data: {
            name: 'Queued Item 1',
            category: 'shirts',
            color: 'green',
            size: 'S',
            condition: 'new'
          }
        },
        {
          type: 'update',
          itemId: 'existing-item-id',
          data: {
            color: 'blue'
          }
        },
        {
          type: 'delete',
          itemId: 'item-to-delete'
        }
      ];

      const queueResponse = await request(app)
        .post('/sync/queue-operations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operations: offlineOperations,
          queueTimestamp: new Date().toISOString()
        });

      expect(queueResponse.status).toBe(200);
      expect(queueResponse.body.success).toBe(true);
      expect(queueResponse.body.data).toHaveProperty('queuedOperations');
    });
  });

  describe('Data Validation During Sync', () => {
    it('should validate data integrity during sync operations', async () => {
      const invalidItems = [
        {
          id: 'invalid-item-1',
          name: '', // Invalid: empty name
          category: 'shirts',
          lastModified: new Date().toISOString(),
          needsSync: true
        },
        {
          id: 'invalid-item-2',
          name: 'Valid Name',
          category: 'invalid-category', // Invalid category
          lastModified: new Date().toISOString(),
          needsSync: true
        }
      ];

      const validationResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: invalidItems,
          syncTimestamp: new Date().toISOString()
        });

      expect(validationResponse.status).toBe(400);
      expect(validationResponse.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(validationResponse.body.error).toHaveProperty('details');
    });

    it('should handle data transformation during sync', async () => {
      const legacyFormatItem = {
        id: 'legacy-item',
        itemName: 'Legacy Format Item', // Old field name
        itemCategory: 'shirts', // Old field name
        itemColor: 'purple', // Old field name
        lastModified: new Date().toISOString(),
        needsSync: true,
        dataVersion: '1.0' // Indicates legacy format
      };

      const transformResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [legacyFormatItem],
          syncTimestamp: new Date().toISOString()
        });

      expect([200, 201]).toContain(transformResponse.status);
      if (transformResponse.status === 200 || transformResponse.status === 201) {
        expect(transformResponse.body.data.syncedItems[0]).toHaveProperty('name');
        expect(transformResponse.body.data.syncedItems[0]).toHaveProperty('category');
      }
    });
  });

  describe('Sync Performance and Optimization', () => {
    it('should handle large sync payloads efficiently', async () => {
      const largeItemSet = Array(100).fill(null).map((_, index) => ({
        id: `bulk-item-${index}`,
        name: `Bulk Item ${index}`,
        category: index % 2 === 0 ? 'shirts' : 'pants',
        color: ['red', 'blue', 'green', 'yellow'][index % 4],
        size: ['S', 'M', 'L', 'XL'][index % 4],
        condition: 'new',
        lastModified: new Date().toISOString(),
        needsSync: true
      }));

      const bulkSyncResponse = await request(app)
        .post('/sync/wardrobe-items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: largeItemSet,
          syncTimestamp: new Date().toISOString()
        });

      expect([200, 201]).toContain(bulkSyncResponse.status);
      expect(bulkSyncResponse.body.success).toBe(true);
    });

    it('should implement sync pagination for large datasets', async () => {
      const paginatedSyncResponse = await request(app)
        .get('/sync/wardrobe-items/paginated')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 50,
          since: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
        });

      expect(paginatedSyncResponse.status).toBe(200);
      expect(paginatedSyncResponse.body.data).toHaveProperty('items');
      expect(paginatedSyncResponse.body.data).toHaveProperty('pagination');
      expect(paginatedSyncResponse.body.data.pagination).toHaveProperty('page');
      expect(paginatedSyncResponse.body.data.pagination).toHaveProperty('limit');
      expect(paginatedSyncResponse.body.data.pagination).toHaveProperty('total');
    });
  });
});