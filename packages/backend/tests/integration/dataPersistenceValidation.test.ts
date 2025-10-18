import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/database/connection';
import { ConfigurationService } from '../../src/services/configurationService';
import { AdminAuthService } from '../../src/services/adminAuthService';
import fs from 'fs/promises';
import path from 'path';

describe('Data Persistence and Configuration Validation', () => {
  let adminToken: string;
  let testUserId: string;
  let testItemId: string;
  let configBackupPath: string;

  beforeAll(async () => {
    // Initialize database connection
    await DatabaseService.initialize();
    
    // Create admin user "lv" for testing
    const adminAuthService = new AdminAuthService();
    await adminAuthService.initializeAdminUser();
    
    // Login as admin to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'lv@vangarments.com',
        password: 'admin123'
      });
    
    adminToken = loginResponse.body.token;
    
    // Create backup path for configuration files
    configBackupPath = path.join(__dirname, '../temp/config-backup');
    await fs.mkdir(configBackupPath, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test data and restore configurations
    try {
      await fs.rm(configBackupPath, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up backup directory:', error);
    }
  });

  describe('Data Persistence Validation', () => {
    test('should persist user data across app restarts', async () => {
      // Create a test user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'testpass123',
          personalInfo: {
            name: 'Test User',
            cpf: '12345678901'
          }
        });

      expect(userResponse.status).toBe(201);
      testUserId = userResponse.body.user.id;

      // Simulate app restart by reconnecting to database
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      // Verify user data persists
      const userCheck = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(userCheck.status).toBe(200);
      expect(userCheck.body.email).toBe('testuser@example.com');
      expect(userCheck.body.personalInfo.name).toBe('Test User');
    });

    test('should persist wardrobe items across app restarts', async () => {
      // Create a wardrobe item
      const itemResponse = await request(app)
        .post('/api/wardrobe/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Shirt',
          category: 'tops',
          vufsCode: 'TS001',
          brand: 'Test Brand',
          condition: 'excellent',
          metadata: {
            color: 'blue',
            material: 'cotton',
            size: 'M'
          }
        });

      expect(itemResponse.status).toBe(201);
      testItemId = itemResponse.body.id;

      // Simulate app restart
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      // Verify item persists
      const itemCheck = await request(app)
        .get(`/api/wardrobe/items/${testItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(itemCheck.status).toBe(200);
      expect(itemCheck.body.name).toBe('Test Shirt');
      expect(itemCheck.body.vufsCode).toBe('TS001');
      expect(itemCheck.body.metadata.color).toBe('blue');
    });

    test('should persist marketplace listings across app restarts', async () => {
      // Create a marketplace listing
      const listingResponse = await request(app)
        .post('/api/marketplace/listings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: testItemId,
          price: 29.99,
          description: 'Great condition test shirt',
          isActive: true
        });

      expect(listingResponse.status).toBe(201);
      const listingId = listingResponse.body.id;

      // Simulate app restart
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      // Verify listing persists
      const listingCheck = await request(app)
        .get(`/api/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listingCheck.status).toBe(200);
      expect(listingCheck.body.price).toBe(29.99);
      expect(listingCheck.body.description).toBe('Great condition test shirt');
    });

    test('should persist social posts and interactions across app restarts', async () => {
      // Create a social post
      const postResponse = await request(app)
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Check out my new outfit!',
          images: ['test-image.jpg'],
          tags: ['fashion', 'style']
        });

      expect(postResponse.status).toBe(201);
      const postId = postResponse.body.id;

      // Add a like to the post
      const likeResponse = await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(likeResponse.status).toBe(200);

      // Simulate app restart
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      // Verify post and interactions persist
      const postCheck = await request(app)
        .get(`/api/social/posts/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(postCheck.status).toBe(200);
      expect(postCheck.body.content).toBe('Check out my new outfit!');
      expect(postCheck.body.likeCount).toBe(1);
    });
  });

  describe('Configuration Persistence Validation', () => {
    test('should persist VUFS configuration changes to actual files', async () => {
      const configService = new ConfigurationService();
      
      // Backup original configuration
      const originalConfig = await configService.getVUFSConfiguration();
      
      // Make configuration changes
      const newCategory = {
        id: 'test-category',
        name: 'Test Category',
        code: 'TC',
        description: 'Test category for validation'
      };

      const updateResponse = await request(app)
        .put('/api/configuration/vufs/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: [...originalConfig.categories, newCategory]
        });

      expect(updateResponse.status).toBe(200);

      // Verify changes are written to configuration files
      const configFilePath = path.join(process.cwd(), 'packages/shared/src/constants/vufs.ts');
      const configFileContent = await fs.readFile(configFilePath, 'utf-8');
      expect(configFileContent).toContain('Test Category');
      expect(configFileContent).toContain('test-category');

      // Simulate app restart and verify configuration persists
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      const configCheck = await request(app)
        .get('/api/configuration/vufs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(configCheck.status).toBe(200);
      const updatedConfig = configCheck.body;
      expect(updatedConfig.categories).toContainEqual(
        expect.objectContaining({
          id: 'test-category',
          name: 'Test Category'
        })
      );

      // Restore original configuration
      await request(app)
        .put('/api/configuration/vufs/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: originalConfig.categories
        });
    });

    test('should persist system settings changes to configuration files', async () => {
      // Update system settings
      const settingsUpdate = {
        maxImageSize: 10485760, // 10MB
        allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
        enableAIProcessing: true,
        maxItemsPerUser: 1000
      };

      const updateResponse = await request(app)
        .put('/api/configuration/system/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(settingsUpdate);

      expect(updateResponse.status).toBe(200);

      // Verify changes persist in database
      const settingsCheck = await request(app)
        .get('/api/configuration/system/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(settingsCheck.status).toBe(200);
      expect(settingsCheck.body.maxImageSize).toBe(10485760);
      expect(settingsCheck.body.enableAIProcessing).toBe(true);

      // Simulate app restart
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      // Verify settings persist after restart
      const persistenceCheck = await request(app)
        .get('/api/configuration/system/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(persistenceCheck.status).toBe(200);
      expect(persistenceCheck.body.maxImageSize).toBe(10485760);
      expect(persistenceCheck.body.enableAIProcessing).toBe(true);
    });

    test('should persist feature toggles and business rules', async () => {
      // Update feature toggles
      const featureToggles = {
        enableMarketplace: true,
        enableSocialFeatures: true,
        enableAIRecommendations: false,
        enablePremiumFeatures: true
      };

      const toggleResponse = await request(app)
        .put('/api/configuration/features/toggles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(featureToggles);

      expect(toggleResponse.status).toBe(200);

      // Update business rules
      const businessRules = {
        marketplaceFeePercentage: 5.0,
        minimumItemPrice: 10.00,
        maximumItemPrice: 10000.00,
        allowInternationalShipping: true
      };

      const rulesResponse = await request(app)
        .put('/api/configuration/business/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(businessRules);

      expect(rulesResponse.status).toBe(200);

      // Simulate app restart
      await DatabaseService.disconnect();
      await DatabaseService.initialize();

      // Verify feature toggles persist
      const toggleCheck = await request(app)
        .get('/api/configuration/features/toggles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(toggleCheck.status).toBe(200);
      expect(toggleCheck.body.enableMarketplace).toBe(true);
      expect(toggleCheck.body.enableAIRecommendations).toBe(false);

      // Verify business rules persist
      const rulesCheck = await request(app)
        .get('/api/configuration/business/rules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(rulesCheck.status).toBe(200);
      expect(rulesCheck.body.marketplaceFeePercentage).toBe(5.0);
      expect(rulesCheck.body.allowInternationalShipping).toBe(true);
    });
  });

  describe('Admin Functionality and Privilege System Validation', () => {
    test('should validate admin user "lv" has full system privileges', async () => {
      // Test admin access to user management
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usersResponse.status).toBe(200);
      expect(Array.isArray(usersResponse.body)).toBe(true);

      // Test admin access to system configuration
      const configResponse = await request(app)
        .get('/api/admin/configuration')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(configResponse.status).toBe(200);

      // Test admin access to system monitoring
      const monitoringResponse = await request(app)
        .get('/api/admin/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(monitoringResponse.status).toBe(200);
    });

    test('should validate admin can modify any user data', async () => {
      // Admin should be able to update any user's information
      const userUpdateResponse = await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          personalInfo: {
            name: 'Updated by Admin',
            cpf: '12345678901'
          }
        });

      expect(userUpdateResponse.status).toBe(200);

      // Verify the update was applied
      const userCheck = await request(app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(userCheck.status).toBe(200);
      expect(userCheck.body.personalInfo.name).toBe('Updated by Admin');
    });

    test('should validate admin can access and modify all system configurations', async () => {
      // Test access to all configuration sections
      const configSections = [
        'vufs',
        'system/settings',
        'features/toggles',
        'business/rules',
        'ui/settings'
      ];

      for (const section of configSections) {
        const response = await request(app)
          .get(`/api/configuration/${section}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      }
    });

    test('should validate admin privileges persist across sessions', async () => {
      // Logout and login again
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'lv@vangarments.com',
          password: 'admin123'
        });

      expect(loginResponse.status).toBe(200);
      const newAdminToken = loginResponse.body.token;

      // Verify admin privileges are maintained
      const privilegeCheck = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${newAdminToken}`);

      expect(privilegeCheck.status).toBe(200);

      // Update admin token for cleanup
      adminToken = newAdminToken;
    });

    test('should validate non-admin users cannot access admin functions', async () => {
      // Create a regular user
      const regularUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'regular@example.com',
          password: 'regular123',
          personalInfo: {
            name: 'Regular User'
          }
        });

      expect(regularUserResponse.status).toBe(201);

      // Login as regular user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'regular@example.com',
          password: 'regular123'
        });

      expect(loginResponse.status).toBe(200);
      const regularToken = loginResponse.body.token;

      // Test that regular user cannot access admin endpoints
      const adminAccessAttempts = [
        '/api/admin/users',
        '/api/admin/configuration',
        '/api/admin/monitoring/health',
        '/api/configuration/vufs/categories'
      ];

      for (const endpoint of adminAccessAttempts) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403); // Forbidden
      }
    });
  });

  describe('Configuration Rollback and Recovery', () => {
    test('should support configuration rollback on errors', async () => {
      const configService = new ConfigurationService();
      
      // Get current configuration
      const originalConfig = await configService.getVUFSConfiguration();
      
      // Attempt to make an invalid configuration change
      const invalidUpdateResponse = await request(app)
        .put('/api/configuration/vufs/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categories: null // Invalid data
        });

      expect(invalidUpdateResponse.status).toBe(400);

      // Verify original configuration is preserved
      const configCheck = await request(app)
        .get('/api/configuration/vufs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(configCheck.status).toBe(200);
      expect(configCheck.body.categories).toEqual(originalConfig.categories);
    });

    test('should maintain configuration integrity during concurrent updates', async () => {
      // Simulate concurrent configuration updates
      const updates = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .put('/api/configuration/system/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            maxImageSize: 5242880 + i * 1000000, // Different values
            testField: `concurrent-test-${i}`
          })
      );

      const results = await Promise.allSettled(updates);
      
      // At least one update should succeed
      const successfulUpdates = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Verify final configuration is consistent
      const finalConfig = await request(app)
        .get('/api/configuration/system/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(finalConfig.status).toBe(200);
      expect(typeof finalConfig.body.maxImageSize).toBe('number');
    });
  });
});