/**
 * Batch Upload and Progress Tracking Tests
 * Tests for batch operations and progress tracking functionality
 * Requirements: 13.3, 13.4
 */

import request from 'supertest';
import { app } from '../testApp';

describe('Batch Upload and Progress Tracking Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        name: 'Batch Upload Test User',
        email: 'batchupload@test.com',
        password: 'testpassword123',
        cpf: '11122233344'
      });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'batchupload@test.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;
  });

  describe('Batch Item Upload', () => {
    it('should handle batch upload of up to 10 items', async () => {
      const batchItems = Array(10).fill(null).map((_, index) => ({
        name: `Batch Item ${index + 1}`,
        category: index % 2 === 0 ? 'shirts' : 'pants',
        brand: `Brand ${index + 1}`,
        color: ['red', 'blue', 'green', 'yellow', 'black'][index % 5],
        size: ['S', 'M', 'L'][index % 3],
        condition: 'new',
        tags: [`tag${index}`, 'batch-upload']
      }));

      const batchResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: batchItems,
          batchId: `batch-${Date.now()}`
        });

      expect(batchResponse.status).toBe(201);
      expect(batchResponse.body.success).toBe(true);
      expect(batchResponse.body.data).toHaveProperty('batchId');
      expect(batchResponse.body.data).toHaveProperty('processedItems');
      expect(batchResponse.body.data.processedItems).toHaveLength(10);
    });

    it('should reject batch upload exceeding 10 items limit', async () => {
      const oversizedBatch = Array(15).fill(null).map((_, index) => ({
        name: `Oversized Batch Item ${index + 1}`,
        category: 'shirts',
        color: 'blue',
        size: 'M',
        condition: 'new'
      }));

      const oversizedResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: oversizedBatch,
          batchId: `oversized-batch-${Date.now()}`
        });

      expect(oversizedResponse.status).toBe(400);
      expect(oversizedResponse.body.success).toBe(false);
      expect(oversizedResponse.body.error).toHaveProperty('code', 'BATCH_SIZE_EXCEEDED');
    });

    it('should handle partial batch failures gracefully', async () => {
      const mixedBatch = [
        {
          name: 'Valid Item 1',
          category: 'shirts',
          color: 'blue',
          size: 'M',
          condition: 'new'
        },
        {
          name: '', // Invalid: empty name
          category: 'shirts',
          color: 'red',
          size: 'L',
          condition: 'new'
        },
        {
          name: 'Valid Item 2',
          category: 'pants',
          color: 'black',
          size: 'M',
          condition: 'excellent'
        },
        {
          name: 'Valid Item 3',
          category: 'invalid-category', // Invalid category
          color: 'green',
          size: 'S',
          condition: 'new'
        }
      ];

      const partialResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: mixedBatch,
          batchId: `partial-batch-${Date.now()}`
        });

      expect(partialResponse.status).toBe(207); // Multi-Status
      expect(partialResponse.body.success).toBe(true);
      expect(partialResponse.body.data).toHaveProperty('successfulItems');
      expect(partialResponse.body.data).toHaveProperty('failedItems');
      expect(partialResponse.body.data.successfulItems).toHaveLength(2);
      expect(partialResponse.body.data.failedItems).toHaveLength(2);
    });

    it('should validate batch item data before processing', async () => {
      const invalidBatch = [
        {
          // Missing required fields
          name: 'Incomplete Item'
        },
        {
          name: 'Item with Invalid Data',
          category: 'shirts',
          color: 'blue',
          size: 'InvalidSize', // Invalid size
          condition: 'invalid-condition' // Invalid condition
        }
      ];

      const validationResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: invalidBatch,
          batchId: `validation-batch-${Date.now()}`
        });

      expect(validationResponse.status).toBe(400);
      expect(validationResponse.body.success).toBe(false);
      expect(validationResponse.body.error).toHaveProperty('code', 'BATCH_VALIDATION_ERROR');
      expect(validationResponse.body.error).toHaveProperty('details');
    });
  });

  describe('Progress Tracking', () => {
    it('should track batch upload progress', async () => {
      const batchId = `progress-batch-${Date.now()}`;
      const batchItems = Array(5).fill(null).map((_, index) => ({
        name: `Progress Item ${index + 1}`,
        category: 'shirts',
        color: 'blue',
        size: 'M',
        condition: 'new'
      }));

      // Start batch upload
      const uploadResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: batchItems,
          batchId
        });

      expect(uploadResponse.status).toBe(201);

      // Check progress
      const progressResponse = await request(app)
        .get(`/wardrobe/items/batch/${batchId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(progressResponse.status).toBe(200);
      expect(progressResponse.body.success).toBe(true);
      expect(progressResponse.body.data).toHaveProperty('batchId', batchId);
      expect(progressResponse.body.data).toHaveProperty('status');
      expect(progressResponse.body.data).toHaveProperty('totalItems');
      expect(progressResponse.body.data).toHaveProperty('processedItems');
      expect(progressResponse.body.data).toHaveProperty('failedItems');
      expect(progressResponse.body.data).toHaveProperty('progress');
    });

    it('should provide real-time progress updates', async () => {
      const batchId = `realtime-batch-${Date.now()}`;
      const largeBatch = Array(8).fill(null).map((_, index) => ({
        name: `Realtime Item ${index + 1}`,
        category: 'shirts',
        color: 'red',
        size: 'L',
        condition: 'new'
      }));

      // Start batch upload (async processing)
      const uploadResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: largeBatch,
          batchId,
          async: true // Enable async processing
        });

      expect(uploadResponse.status).toBe(202); // Accepted for processing

      // Poll progress multiple times
      let progressComplete = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!progressComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

        const progressResponse = await request(app)
          .get(`/wardrobe/items/batch/${batchId}/progress`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(progressResponse.status).toBe(200);
        
        const progress = progressResponse.body.data;
        expect(progress).toHaveProperty('progress');
        expect(typeof progress.progress).toBe('number');
        expect(progress.progress).toBeGreaterThanOrEqual(0);
        expect(progress.progress).toBeLessThanOrEqual(100);

        if (progress.status === 'completed' || progress.progress === 100) {
          progressComplete = true;
          expect(progress.processedItems).toBe(largeBatch.length);
        }

        attempts++;
      }
    });

    it('should handle progress tracking for failed batches', async () => {
      const batchId = `failed-batch-${Date.now()}`;
      const failingBatch = [
        {
          name: 'Valid Item',
          category: 'shirts',
          color: 'blue',
          size: 'M',
          condition: 'new'
        },
        {
          name: '', // This will cause failure
          category: 'shirts',
          color: 'red',
          size: 'L',
          condition: 'new'
        }
      ];

      const uploadResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: failingBatch,
          batchId,
          async: true
        });

      expect([202, 207]).toContain(uploadResponse.status);

      // Check final progress
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for processing

      const progressResponse = await request(app)
        .get(`/wardrobe/items/batch/${batchId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(progressResponse.status).toBe(200);
      const progress = progressResponse.body.data;
      expect(progress.status).toBe('completed');
      expect(progress.failedItems).toBeGreaterThan(0);
      expect(progress.errors).toBeDefined();
      expect(Array.isArray(progress.errors)).toBe(true);
    });
  });

  describe('Batch Image Upload', () => {
    it('should handle batch image upload with progress tracking', async () => {
      const batchId = `image-batch-${Date.now()}`;
      
      // Create test image buffers
      const imageFiles = Array(3).fill(null).map((_, index) => ({
        fieldname: `image${index}`,
        originalname: `test-image-${index}.jpg`,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from(`test-image-data-${index}`),
        size: 1024
      }));

      const imageUploadResponse = await request(app)
        .post('/wardrobe/items/batch-images')
        .set('Authorization', `Bearer ${authToken}`)
        .field('batchId', batchId)
        .attach('images', imageFiles[0].buffer, imageFiles[0].originalname)
        .attach('images', imageFiles[1].buffer, imageFiles[1].originalname)
        .attach('images', imageFiles[2].buffer, imageFiles[2].originalname);

      expect([200, 201, 202]).toContain(imageUploadResponse.status);
      expect(imageUploadResponse.body.success).toBe(true);
      expect(imageUploadResponse.body.data).toHaveProperty('batchId');
    });

    it('should track image processing progress', async () => {
      const batchId = `image-progress-batch-${Date.now()}`;
      const testImageBuffer = Buffer.from('test-image-data-for-progress');

      // Upload images for processing
      const uploadResponse = await request(app)
        .post('/wardrobe/items/batch-images')
        .set('Authorization', `Bearer ${authToken}`)
        .field('batchId', batchId)
        .attach('images', testImageBuffer, 'progress-test.jpg');

      expect([200, 201, 202]).toContain(uploadResponse.status);

      // Check image processing progress
      const progressResponse = await request(app)
        .get(`/wardrobe/items/batch-images/${batchId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(progressResponse.status).toBe(200);
      expect(progressResponse.body.data).toHaveProperty('batchId');
      expect(progressResponse.body.data).toHaveProperty('totalImages');
      expect(progressResponse.body.data).toHaveProperty('processedImages');
      expect(progressResponse.body.data).toHaveProperty('processingStatus');
    });
  });

  describe('Batch Operation Limits and Validation', () => {
    it('should enforce concurrent batch limits per user', async () => {
      const concurrentBatches = Array(3).fill(null).map((_, index) => {
        const batchId = `concurrent-batch-${index}-${Date.now()}`;
        const items = Array(5).fill(null).map((_, itemIndex) => ({
          name: `Concurrent Item ${index}-${itemIndex}`,
          category: 'shirts',
          color: 'blue',
          size: 'M',
          condition: 'new'
        }));

        return request(app)
          .post('/wardrobe/items/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items,
            batchId,
            async: true
          });
      });

      const responses = await Promise.all(concurrentBatches);
      
      // Should accept some and reject others based on limits
      const acceptedCount = responses.filter(r => r.status === 202).length;
      const rejectedCount = responses.filter(r => r.status === 429).length;
      
      expect(acceptedCount + rejectedCount).toBe(3);
      expect(acceptedCount).toBeGreaterThan(0);
    });

    it('should validate batch metadata and constraints', async () => {
      const invalidBatchRequest = {
        items: [], // Empty items array
        batchId: '', // Empty batch ID
        metadata: {
          invalidField: 'invalid-value'
        }
      };

      const validationResponse = await request(app)
        .post('/wardrobe/items/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBatchRequest);

      expect(validationResponse.status).toBe(400);
      expect(validationResponse.body.success).toBe(false);
      expect(validationResponse.body.error).toHaveProperty('code', 'BATCH_VALIDATION_ERROR');
    });

    it('should handle batch timeout scenarios', async () => {
      const timeoutBatchId = `timeout-batch-${Date.now()}`;
      
      // Check batch status after timeout period
      const timeoutResponse = await request(app)
        .get(`/wardrobe/items/batch/${timeoutBatchId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(timeoutResponse.status).toBe(404);
      expect(timeoutResponse.body.error).toHaveProperty('code', 'BATCH_NOT_FOUND');
    });
  });

  describe('Batch History and Cleanup', () => {
    it('should maintain batch operation history', async () => {
      const historyResponse = await request(app)
        .get('/wardrobe/items/batch/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          limit: 10,
          offset: 0
        });

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.success).toBe(true);
      expect(historyResponse.body.data).toHaveProperty('batches');
      expect(historyResponse.body.data).toHaveProperty('pagination');
      expect(Array.isArray(historyResponse.body.data.batches)).toBe(true);
    });

    it('should clean up completed batch data', async () => {
      const cleanupResponse = await request(app)
        .delete('/wardrobe/items/batch/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          olderThan: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
          status: 'completed'
        });

      expect(cleanupResponse.status).toBe(200);
      expect(cleanupResponse.body.success).toBe(true);
      expect(cleanupResponse.body.data).toHaveProperty('cleanedBatches');
    });
  });
});