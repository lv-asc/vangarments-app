/**
 * Cross-Platform Compatibility Tests
 * Tests for iOS, Android, and Web platform compatibility
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import request from 'supertest';
import { app } from '../testApp';

describe('Cross-Platform Compatibility Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        name: 'Cross Platform Test User',
        email: 'crossplatform@test.com',
        password: 'testpassword123',
        cpf: '12345678901'
      });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'crossplatform@test.com',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;
  });

  describe('API Response Format Consistency', () => {
    it('should return consistent response format across all endpoints', async () => {
      const endpoints = [
        '/auth/me',
        '/wardrobe/items',
        '/marketplace/listings',
        '/social/feed'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // All responses should have consistent structure
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.success).toBe('boolean');
      }
    });

    it('should handle different User-Agent headers for platform detection', async () => {
      const userAgents = {
        ios: 'Vangarments/1.0 (iPhone; iOS 17.0; Scale/3.0)',
        android: 'Vangarments/1.0 (Android 14; Mobile)',
        web: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      };

      for (const [platform, userAgent] of Object.entries(userAgents)) {
        const response = await request(app)
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('User-Agent', userAgent)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      }
    });

    it('should handle platform-specific headers correctly', async () => {
      const platformHeaders = {
        'X-Platform': 'ios',
        'X-App-Version': '1.0.0',
        'X-Device-ID': 'test-device-123'
      };

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .set(platformHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Image Upload Compatibility', () => {
    it('should handle different image formats from different platforms', async () => {
      const imageFormats = [
        { format: 'jpeg', mimeType: 'image/jpeg' },
        { format: 'png', mimeType: 'image/png' },
        { format: 'webp', mimeType: 'image/webp' },
        { format: 'heic', mimeType: 'image/heic' } // iOS specific
      ];

      for (const { format, mimeType } of imageFormats) {
        // Create a minimal test image buffer
        const testImageBuffer = Buffer.from('test-image-data');

        const response = await request(app)
          .post('/wardrobe/items/upload-image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImageBuffer, {
            filename: `test.${format}`,
            contentType: mimeType
          });

        // Should either succeed or return a specific error for unsupported formats
        expect([200, 201, 400, 415]).toContain(response.status);
        
        if (response.status === 200 || response.status === 201) {
          expect(response.body).toHaveProperty('success', true);
          expect(response.body.data).toHaveProperty('imageUrl');
        }
      }
    });

    it('should handle different image sizes and orientations', async () => {
      const imageSizes = [
        { width: 320, height: 240, name: 'small' },
        { width: 1080, height: 1920, name: 'mobile_portrait' },
        { width: 1920, height: 1080, name: 'mobile_landscape' },
        { width: 4032, height: 3024, name: 'high_res' }
      ];

      for (const size of imageSizes) {
        const testImageBuffer = Buffer.from(`test-image-${size.name}`);

        const response = await request(app)
          .post('/wardrobe/items/upload-image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImageBuffer, {
            filename: `test-${size.name}.jpg`,
            contentType: 'image/jpeg'
          });

        expect([200, 201, 413]).toContain(response.status);
      }
    });
  });

  describe('Data Synchronization Compatibility', () => {
    it('should handle concurrent requests from multiple platforms', async () => {
      const itemData = {
        name: 'Cross Platform Test Item',
        category: 'shirts',
        brand: 'Test Brand',
        color: 'blue',
        size: 'M',
        condition: 'new'
      };

      // Simulate concurrent requests from different platforms
      const platforms = ['ios', 'android', 'web'];
      const requests = platforms.map(platform =>
        request(app)
          .post('/wardrobe/items')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Platform', platform)
          .send({ ...itemData, name: `${itemData.name} ${platform}` })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toContain(platforms[index]);
      });
    });

    it('should maintain data consistency across platform updates', async () => {
      // Create item from web platform
      const createResponse = await request(app)
        .post('/wardrobe/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Platform', 'web')
        .send({
          name: 'Consistency Test Item',
          category: 'shirts',
          brand: 'Test Brand',
          color: 'red',
          size: 'L',
          condition: 'new'
        });

      expect(createResponse.status).toBe(201);
      const itemId = createResponse.body.data.id;

      // Update from iOS platform
      const updateResponse = await request(app)
        .put(`/wardrobe/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Platform', 'ios')
        .send({
          color: 'blue',
          condition: 'excellent'
        });

      expect(updateResponse.status).toBe(200);

      // Verify from Android platform
      const getResponse = await request(app)
        .get(`/wardrobe/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Platform', 'android');

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.color).toBe('blue');
      expect(getResponse.body.data.condition).toBe('excellent');
    });
  });

  describe('Authentication Token Compatibility', () => {
    it('should accept tokens from different platforms', async () => {
      const platforms = ['ios', 'android', 'web'];

      for (const platform of platforms) {
        const response = await request(app)
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Platform', platform)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(userId);
      }
    });

    it('should handle token refresh across platforms', async () => {
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Platform', 'ios')
        .expect(200);

      const newToken = refreshResponse.body.data.token;
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(authToken);

      // Verify new token works on different platform
      const verifyResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${newToken}`)
        .set('X-Platform', 'android')
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should return consistent error format across platforms', async () => {
      const platforms = ['ios', 'android', 'web'];

      for (const platform of platforms) {
        const response = await request(app)
          .get('/wardrobe/items/nonexistent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Platform', platform)
          .expect(404);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      }
    });

    it('should handle validation errors consistently', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        category: 'invalid-category', // Invalid category
        color: '',
        size: ''
      };

      const platforms = ['ios', 'android', 'web'];

      for (const platform of platforms) {
        const response = await request(app)
          .post('/wardrobe/items')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Platform', platform)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(response.body.error).toHaveProperty('details');
        expect(Array.isArray(response.body.error.details)).toBe(true);
      }
    });
  });

  describe('Content-Type Handling', () => {
    it('should handle different content types from platforms', async () => {
      const contentTypes = [
        'application/json',
        'application/json; charset=utf-8',
        'application/x-www-form-urlencoded'
      ];

      const testData = {
        name: 'Content Type Test',
        category: 'shirts',
        color: 'green',
        size: 'S',
        condition: 'new'
      };

      for (const contentType of contentTypes) {
        let requestBody;
        if (contentType.includes('form-urlencoded')) {
          requestBody = new URLSearchParams(testData as any).toString();
        } else {
          requestBody = testData;
        }

        const response = await request(app)
          .post('/wardrobe/items')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', contentType)
          .send(requestBody);

        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting Compatibility', () => {
    it('should apply rate limiting consistently across platforms', async () => {
      const platforms = ['ios', 'android', 'web'];
      
      for (const platform of platforms) {
        // Make multiple rapid requests
        const requests = Array(10).fill(null).map(() =>
          request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Platform', platform)
        );

        const responses = await Promise.all(requests);
        
        // All should succeed or some should be rate limited
        responses.forEach(response => {
          expect([200, 429]).toContain(response.status);
        });
      }
    });
  });
});