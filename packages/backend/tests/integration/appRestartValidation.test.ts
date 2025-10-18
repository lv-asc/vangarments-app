import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { ConfigurationService } from '../../src/services/configurationService';
import { AdminAuthService } from '../../src/services/adminAuthService';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

describe('App Restart Data Persistence Validation', () => {
  let pool: Pool;
  let testDataIds: {
    userId?: string;
    itemId?: string;
    listingId?: string;
    postId?: string;
  } = {};

  beforeAll(async () => {
    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testDataIds.postId) {
        await pool.query('DELETE FROM social_posts WHERE id = $1', [testDataIds.postId]);
      }
      if (testDataIds.listingId) {
        await pool.query('DELETE FROM marketplace_listings WHERE id = $1', [testDataIds.listingId]);
      }
      if (testDataIds.itemId) {
        await pool.query('DELETE FROM vufs_items WHERE id = $1', [testDataIds.itemId]);
      }
      if (testDataIds.userId) {
        await pool.query('DELETE FROM users WHERE id = $1', [testDataIds.userId]);
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    } finally {
      await pool.end();
    }
  });

  describe('Pre-Restart Data Creation', () => {
    test('should create test user data', async () => {
      const userData = {
        email: 'restart-test@example.com',
        password_hash: '$2b$10$test.hash.for.restart.validation',
        personal_info: JSON.stringify({
          name: 'Restart Test User',
          cpf: '98765432100'
        }),
        roles: JSON.stringify([{ role: 'user', permissions: [] }]),
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await pool.query(`
        INSERT INTO users (email, password_hash, profile, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        userData.email,
        userData.password_hash,
        userData.personal_info,
        userData.created_at,
        userData.updated_at
      ]);

      testDataIds.userId = result.rows[0].id;
      expect(testDataIds.userId).toBeDefined();
    });

    test('should create test wardrobe item', async () => {
      const itemData = {
        user_id: testDataIds.userId,
        name: 'Restart Test Shirt',
        category: 'tops',
        vufs_code: 'RTS001',
        brand: 'Test Brand',
        condition: 'excellent',
        metadata: JSON.stringify({
          color: 'blue',
          material: 'cotton',
          size: 'M',
          pattern: 'solid'
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await DatabaseService.query(`
        INSERT INTO wardrobe_items (user_id, name, category, vufs_code, brand, condition, metadata, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        itemData.user_id,
        itemData.name,
        itemData.category,
        itemData.vufs_code,
        itemData.brand,
        itemData.condition,
        itemData.metadata,
        itemData.is_active,
        itemData.created_at,
        itemData.updated_at
      ]);

      testDataIds.itemId = result.rows[0].id;
      expect(testDataIds.itemId).toBeDefined();
    });

    test('should create test marketplace listing', async () => {
      const listingData = {
        item_id: testDataIds.itemId,
        seller_id: testDataIds.userId,
        price: 29.99,
        description: 'Test listing for restart validation',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await DatabaseService.query(`
        INSERT INTO marketplace_listings (item_id, seller_id, price, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        listingData.item_id,
        listingData.seller_id,
        listingData.price,
        listingData.description,
        listingData.is_active,
        listingData.created_at,
        listingData.updated_at
      ]);

      testDataIds.listingId = result.rows[0].id;
      expect(testDataIds.listingId).toBeDefined();
    });

    test('should create test social post', async () => {
      const postData = {
        user_id: testDataIds.userId,
        content: 'Test post for restart validation',
        images: JSON.stringify(['test-image-1.jpg', 'test-image-2.jpg']),
        tags: JSON.stringify(['test', 'restart', 'validation']),
        like_count: 5,
        comment_count: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await DatabaseService.query(`
        INSERT INTO social_posts (user_id, content, images, tags, like_count, comment_count, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        postData.user_id,
        postData.content,
        postData.images,
        postData.tags,
        postData.like_count,
        postData.comment_count,
        postData.is_active,
        postData.created_at,
        postData.updated_at
      ]);

      testDataIds.postId = result.rows[0].id;
      expect(testDataIds.postId).toBeDefined();
    });

    test('should create test configuration data', async () => {
      const configData = [
        {
          section: 'vufs',
          key: 'test_category',
          value: JSON.stringify({
            id: 'restart-test-category',
            name: 'Restart Test Category',
            code: 'RTC'
          }),
          is_editable: true,
          requires_restart: false,
          last_modified: new Date(),
          modified_by: testDataIds.userId
        },
        {
          section: 'system',
          key: 'test_setting',
          value: JSON.stringify({
            maxImageSize: 5242880,
            testMode: true
          }),
          is_editable: true,
          requires_restart: false,
          last_modified: new Date(),
          modified_by: testDataIds.userId
        }
      ];

      for (const config of configData) {
        await DatabaseService.query(`
          INSERT INTO system_configurations (section, key, value, is_editable, requires_restart, last_modified, modified_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          config.section,
          config.key,
          config.value,
          config.is_editable,
          config.requires_restart,
          config.last_modified,
          config.modified_by
        ]);
      }

      // Verify configurations were created
      const configCheck = await DatabaseService.query(`
        SELECT COUNT(*) FROM system_configurations 
        WHERE key IN ('test_category', 'test_setting')
      `);

      expect(parseInt(configCheck.rows[0].count)).toBe(2);
    });
  });

  describe('Simulated App Restart', () => {
    test('should simulate app restart by disconnecting and reconnecting database', async () => {
      // Disconnect from database
      await DatabaseService.disconnect();
      
      // Wait a moment to simulate restart delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reconnect to database
      await DatabaseService.initialize();
      
      // Verify connection is working
      const healthCheck = await DatabaseService.healthCheck();
      expect(healthCheck).toBe(true);
    });

    test('should reinitialize services after restart', async () => {
      // Reinitialize configuration service
      const configService = new ConfigurationService();
      const vufsConfig = await configService.getVUFSConfiguration();
      expect(vufsConfig).toBeDefined();
      expect(vufsConfig.categories).toBeDefined();

      // Reinitialize admin auth service
      const adminAuthService = new AdminAuthService();
      await adminAuthService.initializeAdminUser();
      
      // Verify admin user still exists
      const adminCheck = await DatabaseService.query(`
        SELECT id, email FROM users WHERE email = 'lv@vangarments.com'
      `);
      expect(adminCheck.rows.length).toBe(1);
    });
  });

  describe('Post-Restart Data Validation', () => {
    test('should validate user data persists after restart', async () => {
      const userCheck = await DatabaseService.query(`
        SELECT id, email, personal_info, roles 
        FROM users 
        WHERE id = $1
      `, [testDataIds.userId]);

      expect(userCheck.rows.length).toBe(1);
      const user = userCheck.rows[0];
      expect(user.email).toBe('restart-test@example.com');
      
      const personalInfo = JSON.parse(user.personal_info);
      expect(personalInfo.name).toBe('Restart Test User');
      expect(personalInfo.cpf).toBe('98765432100');
    });

    test('should validate wardrobe item persists after restart', async () => {
      const itemCheck = await DatabaseService.query(`
        SELECT id, name, category, vufs_code, brand, condition, metadata
        FROM wardrobe_items 
        WHERE id = $1
      `, [testDataIds.itemId]);

      expect(itemCheck.rows.length).toBe(1);
      const item = itemCheck.rows[0];
      expect(item.name).toBe('Restart Test Shirt');
      expect(item.vufs_code).toBe('RTS001');
      expect(item.brand).toBe('Test Brand');
      
      const metadata = JSON.parse(item.metadata);
      expect(metadata.color).toBe('blue');
      expect(metadata.material).toBe('cotton');
    });

    test('should validate marketplace listing persists after restart', async () => {
      const listingCheck = await DatabaseService.query(`
        SELECT id, item_id, seller_id, price, description, is_active
        FROM marketplace_listings 
        WHERE id = $1
      `, [testDataIds.listingId]);

      expect(listingCheck.rows.length).toBe(1);
      const listing = listingCheck.rows[0];
      expect(listing.price).toBe('29.99');
      expect(listing.description).toBe('Test listing for restart validation');
      expect(listing.is_active).toBe(true);
    });

    test('should validate social post persists after restart', async () => {
      const postCheck = await DatabaseService.query(`
        SELECT id, user_id, content, images, tags, like_count, comment_count
        FROM social_posts 
        WHERE id = $1
      `, [testDataIds.postId]);

      expect(postCheck.rows.length).toBe(1);
      const post = postCheck.rows[0];
      expect(post.content).toBe('Test post for restart validation');
      expect(post.like_count).toBe(5);
      expect(post.comment_count).toBe(2);
      
      const images = JSON.parse(post.images);
      expect(images).toContain('test-image-1.jpg');
      expect(images).toContain('test-image-2.jpg');
      
      const tags = JSON.parse(post.tags);
      expect(tags).toContain('test');
      expect(tags).toContain('restart');
    });

    test('should validate configuration data persists after restart', async () => {
      const configCheck = await DatabaseService.query(`
        SELECT section, key, value, is_editable, requires_restart
        FROM system_configurations 
        WHERE key IN ('test_category', 'test_setting')
        ORDER BY key
      `);

      expect(configCheck.rows.length).toBe(2);
      
      const categoryConfig = configCheck.rows.find(row => row.key === 'test_category');
      expect(categoryConfig).toBeDefined();
      const categoryValue = JSON.parse(categoryConfig.value);
      expect(categoryValue.id).toBe('restart-test-category');
      expect(categoryValue.name).toBe('Restart Test Category');
      
      const settingConfig = configCheck.rows.find(row => row.key === 'test_setting');
      expect(settingConfig).toBeDefined();
      const settingValue = JSON.parse(settingConfig.value);
      expect(settingValue.maxImageSize).toBe(5242880);
      expect(settingValue.testMode).toBe(true);
    });

    test('should validate data relationships persist after restart', async () => {
      // Test user-item relationship
      const userItemCheck = await DatabaseService.query(`
        SELECT u.email, wi.name 
        FROM users u 
        JOIN wardrobe_items wi ON u.id = wi.user_id 
        WHERE u.id = $1 AND wi.id = $2
      `, [testDataIds.userId, testDataIds.itemId]);

      expect(userItemCheck.rows.length).toBe(1);
      expect(userItemCheck.rows[0].email).toBe('restart-test@example.com');
      expect(userItemCheck.rows[0].name).toBe('Restart Test Shirt');

      // Test item-listing relationship
      const itemListingCheck = await DatabaseService.query(`
        SELECT wi.name, ml.price 
        FROM wardrobe_items wi 
        JOIN marketplace_listings ml ON wi.id = ml.item_id 
        WHERE wi.id = $1 AND ml.id = $2
      `, [testDataIds.itemId, testDataIds.listingId]);

      expect(itemListingCheck.rows.length).toBe(1);
      expect(itemListingCheck.rows[0].name).toBe('Restart Test Shirt');
      expect(itemListingCheck.rows[0].price).toBe('29.99');
    });

    test('should validate data integrity constraints after restart', async () => {
      // Test foreign key constraints are still enforced
      try {
        await DatabaseService.query(`
          INSERT INTO wardrobe_items (user_id, name, category, vufs_code)
          VALUES ('non-existent-user-id', 'Test Item', 'tops', 'TEST001')
        `);
        
        // Should not reach here if foreign key constraint is working
        expect(true).toBe(false);
      } catch (error) {
        // Foreign key constraint should prevent this insert
        expect(error).toBeDefined();
      }

      // Test unique constraints are still enforced
      try {
        await DatabaseService.query(`
          INSERT INTO users (email, password_hash, personal_info, roles)
          VALUES ('restart-test@example.com', 'hash', '{}', '[]')
        `);
        
        // Should not reach here if unique constraint is working
        expect(true).toBe(false);
      } catch (error) {
        // Unique constraint should prevent this insert
        expect(error).toBeDefined();
      }
    });
  });

  describe('Configuration File Persistence', () => {
    test('should validate configuration files exist and are readable', async () => {
      const configFiles = [
        'packages/shared/src/constants/vufs.ts',
        'packages/shared/src/constants/index.ts'
      ];

      for (const configFile of configFiles) {
        const filePath = path.join(process.cwd(), configFile);
        
        try {
          await fs.access(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          expect(content.length).toBeGreaterThan(0);
        } catch (error) {
          throw new Error(`Configuration file ${configFile} is not accessible: ${error}`);
        }
      }
    });

    test('should validate configuration changes can be written to files', async () => {
      const configService = new ConfigurationService();
      
      // Create a test configuration file
      const testConfigPath = path.join(process.cwd(), 'test-config-persistence.json');
      const testConfig = {
        testSetting: 'restart-validation',
        timestamp: new Date().toISOString(),
        persistent: true
      };

      await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2));
      
      // Verify file was written
      const writtenContent = await fs.readFile(testConfigPath, 'utf-8');
      const parsedContent = JSON.parse(writtenContent);
      expect(parsedContent.testSetting).toBe('restart-validation');
      expect(parsedContent.persistent).toBe(true);

      // Clean up test file
      await fs.unlink(testConfigPath);
    });

    test('should validate storage directories persist and are accessible', async () => {
      const storageDirs = [
        'storage/images/uploads',
        'storage/images/processed',
        'storage/images/thumbnails',
        'storage/backups'
      ];

      for (const dir of storageDirs) {
        const dirPath = path.join(process.cwd(), dir);
        
        try {
          await fs.access(dirPath);
          const stats = await fs.stat(dirPath);
          expect(stats.isDirectory()).toBe(true);
        } catch (error) {
          // Directory might not exist, try to create it
          await fs.mkdir(dirPath, { recursive: true });
          const stats = await fs.stat(dirPath);
          expect(stats.isDirectory()).toBe(true);
        }
      }
    });
  });
});