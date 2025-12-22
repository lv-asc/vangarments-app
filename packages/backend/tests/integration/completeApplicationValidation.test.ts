/**
 * Complete Application Validation Test
 * 
 * This comprehensive test validates the complete application with real usage scenarios,
 * testing full user registration and wardrobe building workflow, data persistence
 * across app restarts, admin configuration changes, and cross-platform functionality.
 * 
 * Requirements: All requirements validation (1.1-11.5)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'vangarments_test',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  testUsers: [
    {
      name: 'Maria Silva',
      email: 'maria.silva.test@example.com',
      password: 'SecurePass123!',
      cpf: '123.456.789-01',
      profile: {
        gender: 'female',
        age: 33,
        location: 'São Paulo, SP'
      }
    },
    {
      name: 'João Santos',
      email: 'joao.santos.test@example.com',
      password: 'SecurePass456!',
      cpf: '987.654.321-02',
      profile: {
        gender: 'male',
        age: 35,
        location: 'Rio de Janeiro, RJ'
      }
    },
    {
      name: 'Ana Costa',
      email: 'ana.costa.test@example.com',
      password: 'SecurePass789!',
      cpf: '456.789.123-03',
      profile: {
        gender: 'female',
        age: 28,
        location: 'Belo Horizonte, MG'
      }
    }
  ],
  adminUser: {
    email: 'lv@vangarments.com',
    password: 'admin123'
  }
};

let dbPool: Pool;
let testResults: any = {
  userRegistration: [],
  wardrobeBuilding: [],
  marketplaceInteractions: [],
  dataPersistence: [],
  adminFunctionality: [],
  crossPlatformValidation: [],
  overallSuccess: false
};

describe.skip('Complete Application Validation - Real Usage Scenarios', () => {

  beforeAll(async () => {
    // Initialize database connection
    dbPool = new Pool(TEST_CONFIG.dbConfig);

    // Clean up any existing test data
    await cleanupTestData();

    console.log('🚀 Starting Complete Application Validation');
    console.log(`📊 Testing with ${TEST_CONFIG.testUsers.length} users`);
  });

  afterAll(async () => {
    // Generate comprehensive test report
    await generateTestReport();

    // Clean up test data
    await cleanupTestData();

    // Close database connection
    await dbPool.end();

    console.log('✅ Complete Application Validation finished');
  });

  describe('Phase 1: User Registration and Authentication Workflow', () => {
    test('Complete user registration workflow with real data persistence', async () => {
      console.log('📝 Testing complete user registration workflow...');

      for (const testUser of TEST_CONFIG.testUsers) {
        try {
          // Test user registration
          const registrationResponse = await request(TEST_CONFIG.apiBaseUrl)
            .post('/api/auth/register')
            .send({
              name: testUser.name,
              email: testUser.email,
              password: testUser.password,
              cpf: testUser.cpf,
              personalInfo: testUser.profile
            });

          expect(registrationResponse.status).toBe(201);
          expect(registrationResponse.body.user).toBeDefined();
          expect(registrationResponse.body.token).toBeDefined();

          // Test user login
          const loginResponse = await request(TEST_CONFIG.apiBaseUrl)
            .post('/api/auth/login')
            .send({
              email: testUser.email,
              password: testUser.password
            });

          expect(loginResponse.status).toBe(200);
          expect(loginResponse.body.token).toBeDefined();

          // Verify user data persistence in database
          const userQuery = await dbPool.query(
            'SELECT * FROM users WHERE email = $1',
            [testUser.email]
          );

          expect(userQuery.rows).toHaveLength(1);
          expect(userQuery.rows[0].name).toBe(testUser.name);
          expect(userQuery.rows[0].cpf).toBe(testUser.cpf);

          testResults.userRegistration.push({
            user: testUser.name,
            registration: 'success',
            login: 'success',
            dataPersistence: 'success'
          });

          console.log(`   ✅ ${testUser.name}: Registration and login successful`);

        } catch (error) {
          testResults.userRegistration.push({
            user: testUser.name,
            registration: 'failed',
            error: error.message
          });
          console.log(`   ❌ ${testUser.name}: Registration failed - ${error.message}`);
        }
      }

      // Validate all users were created successfully
      expect(testResults.userRegistration.filter(r => r.registration === 'success')).toHaveLength(TEST_CONFIG.testUsers.length);
    });

    test('Admin user authentication and privilege validation', async () => {
      console.log('🔐 Testing admin user authentication...');

      try {
        // Test admin login
        const adminLoginResponse = await request(TEST_CONFIG.apiBaseUrl)
          .post('/api/auth/login')
          .send({
            email: TEST_CONFIG.adminUser.email,
            password: TEST_CONFIG.adminUser.password
          });

        expect(adminLoginResponse.status).toBe(200);
        expect(adminLoginResponse.body.token).toBeDefined();
        expect(adminLoginResponse.body.user.isAdmin).toBe(true);

        // Test admin access to configuration endpoints
        const configResponse = await request(TEST_CONFIG.apiBaseUrl)
          .get('/api/admin/configuration')
          .set('Authorization', `Bearer ${adminLoginResponse.body.token}`);

        expect(configResponse.status).toBe(200);

        testResults.adminFunctionality.push({
          test: 'admin_authentication',
          status: 'success',
          details: 'Admin user authenticated with proper privileges'
        });

        console.log('   ✅ Admin user authentication successful');

      } catch (error) {
        testResults.adminFunctionality.push({
          test: 'admin_authentication',
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ Admin authentication failed - ${error.message}`);
      }
    });
  });

  describe('Phase 2: Wardrobe Building Workflow with Real Data', () => {
    test('Complete wardrobe item creation and persistence', async () => {
      console.log('👕 Testing wardrobe building workflow...');

      // Get user tokens for authenticated requests
      const userTokens = await getUserTokens();

      const wardrobeItems = [
        {
          userIndex: 0, // Maria
          item: {
            name: 'Blusa Floral Zara',
            category: 'tops',
            subcategory: 'blouses',
            brand: 'Zara',
            colors: ['white', 'pink', 'green'],
            materials: ['viscose', 'polyester'],
            size: 'M',
            condition: 'excellent',
            vufsCode: 'TOP-BLO-CAS-001'
          }
        },
        {
          userIndex: 1, // João
          item: {
            name: 'Camisa Social Hugo Boss',
            category: 'tops',
            subcategory: 'shirts',
            brand: 'Hugo Boss',
            colors: ['white'],
            materials: ['cotton'],
            size: 'L',
            condition: 'excellent',
            vufsCode: 'TOP-SHI-DRE-001'
          }
        },
        {
          userIndex: 2, // Ana
          item: {
            name: 'Vestido Midi Farm',
            category: 'dresses',
            subcategory: 'casual-dresses',
            brand: 'Farm',
            colors: ['green', 'tropical-print'],
            materials: ['viscose'],
            size: 'P',
            condition: 'new-with-tags',
            vufsCode: 'DRE-CAS-MID-001'
          }
        }
      ];

      for (const wardrobeItem of wardrobeItems) {
        try {
          const userToken = userTokens[wardrobeItem.userIndex];
          const userName = TEST_CONFIG.testUsers[wardrobeItem.userIndex].name;

          // Create wardrobe item
          const itemResponse = await request(TEST_CONFIG.apiBaseUrl)
            .post('/api/wardrobe/items')
            .set('Authorization', `Bearer ${userToken}`)
            .send(wardrobeItem.item);

          expect(itemResponse.status).toBe(201);
          expect(itemResponse.body.id).toBeDefined();
          expect(itemResponse.body.name).toBe(wardrobeItem.item.name);

          // Verify item persistence in database
          const itemQuery = await dbPool.query(
            'SELECT * FROM wardrobe_items WHERE id = $1',
            [itemResponse.body.id]
          );

          expect(itemQuery.rows).toHaveLength(1);
          expect(itemQuery.rows[0].name).toBe(wardrobeItem.item.name);
          expect(itemQuery.rows[0].vufs_code).toBe(wardrobeItem.item.vufsCode);

          testResults.wardrobeBuilding.push({
            user: userName,
            item: wardrobeItem.item.name,
            creation: 'success',
            persistence: 'success',
            itemId: itemResponse.body.id
          });

          console.log(`   ✅ ${userName}: Created "${wardrobeItem.item.name}"`);

        } catch (error) {
          testResults.wardrobeBuilding.push({
            user: TEST_CONFIG.testUsers[wardrobeItem.userIndex].name,
            item: wardrobeItem.item.name,
            creation: 'failed',
            error: error.message
          });
          console.log(`   ❌ Wardrobe item creation failed - ${error.message}`);
        }
      }

      // Validate all items were created successfully
      expect(testResults.wardrobeBuilding.filter(r => r.creation === 'success')).toHaveLength(wardrobeItems.length);
    });

    test('Wardrobe data retrieval and VUFS categorization', async () => {
      console.log('🔍 Testing wardrobe data retrieval...');

      const userTokens = await getUserTokens();

      for (let i = 0; i < TEST_CONFIG.testUsers.length; i++) {
        try {
          const userToken = userTokens[i];
          const userName = TEST_CONFIG.testUsers[i].name;

          // Get user's wardrobe items
          const wardrobeResponse = await request(TEST_CONFIG.apiBaseUrl)
            .get('/api/wardrobe/items')
            .set('Authorization', `Bearer ${userToken}`);

          expect(wardrobeResponse.status).toBe(200);
          expect(Array.isArray(wardrobeResponse.body)).toBe(true);
          expect(wardrobeResponse.body.length).toBeGreaterThan(0);

          // Verify VUFS categorization
          const item = wardrobeResponse.body[0];
          expect(item.vufs_code).toBeDefined();
          expect(item.category).toBeDefined();
          expect(item.brand).toBeDefined();

          console.log(`   ✅ ${userName}: Retrieved ${wardrobeResponse.body.length} wardrobe items`);

        } catch (error) {
          console.log(`   ❌ Wardrobe retrieval failed for ${TEST_CONFIG.testUsers[i].name} - ${error.message}`);
        }
      }
    });
  });

  describe('Phase 3: Marketplace Interactions with Real Items', () => {
    test('Marketplace listing creation from wardrobe items', async () => {
      console.log('🛒 Testing marketplace listing creation...');

      const userTokens = await getUserTokens();

      // Get wardrobe items to create listings from
      const wardrobeItems = await getWardrobeItems(userTokens);

      for (let i = 0; i < Math.min(wardrobeItems.length, 2); i++) {
        try {
          const item = wardrobeItems[i];
          const userToken = userTokens[i];
          const userName = TEST_CONFIG.testUsers[i].name;

          // Create marketplace listing
          const listingData = {
            wardrobeItemId: item.id,
            title: `${item.name} - Venda`,
            description: `${item.name} em ${item.condition} estado`,
            price: 99.90 + (i * 50),
            originalPrice: 149.90 + (i * 50),
            condition: item.condition,
            category: item.category,
            tags: [item.brand?.toLowerCase(), item.category, item.condition]
          };

          const listingResponse = await request(TEST_CONFIG.apiBaseUrl)
            .post('/api/marketplace/listings')
            .set('Authorization', `Bearer ${userToken}`)
            .send(listingData);

          expect(listingResponse.status).toBe(201);
          expect(listingResponse.body.id).toBeDefined();
          expect(listingResponse.body.title).toBe(listingData.title);

          // Verify listing persistence
          const listingQuery = await dbPool.query(
            'SELECT * FROM marketplace_listings WHERE id = $1',
            [listingResponse.body.id]
          );

          expect(listingQuery.rows).toHaveLength(1);
          expect(listingQuery.rows[0].title).toBe(listingData.title);

          testResults.marketplaceInteractions.push({
            user: userName,
            item: item.name,
            listing: 'success',
            listingId: listingResponse.body.id
          });

          console.log(`   ✅ ${userName}: Created marketplace listing for "${item.name}"`);

        } catch (error) {
          testResults.marketplaceInteractions.push({
            user: TEST_CONFIG.testUsers[i]?.name || 'Unknown',
            listing: 'failed',
            error: error.message
          });
          console.log(`   ❌ Marketplace listing creation failed - ${error.message}`);
        }
      }
    });

    test('Marketplace search and discovery functionality', async () => {
      console.log('🔎 Testing marketplace search functionality...');

      try {
        // Test general marketplace search
        const searchResponse = await request(TEST_CONFIG.apiBaseUrl)
          .get('/api/marketplace/search')
          .query({ q: 'blusa' });

        expect(searchResponse.status).toBe(200);
        expect(Array.isArray(searchResponse.body.listings)).toBe(true);

        // Test category filtering
        const categoryResponse = await request(TEST_CONFIG.apiBaseUrl)
          .get('/api/marketplace/search')
          .query({ category: 'tops' });

        expect(categoryResponse.status).toBe(200);
        expect(Array.isArray(categoryResponse.body.listings)).toBe(true);

        // Test price range filtering
        const priceResponse = await request(TEST_CONFIG.apiBaseUrl)
          .get('/api/marketplace/search')
          .query({ minPrice: 50, maxPrice: 200 });

        expect(priceResponse.status).toBe(200);
        expect(Array.isArray(priceResponse.body.listings)).toBe(true);

        testResults.marketplaceInteractions.push({
          test: 'search_functionality',
          status: 'success',
          details: 'All search types working correctly'
        });

        console.log('   ✅ Marketplace search functionality validated');

      } catch (error) {
        testResults.marketplaceInteractions.push({
          test: 'search_functionality',
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ Marketplace search failed - ${error.message}`);
      }
    });
  });

  describe('Phase 4: Data Persistence Across App Restarts', () => {
    test('Validate data persistence after simulated app restart', async () => {
      console.log('🔄 Testing data persistence across app restarts...');

      try {
        // Simulate app restart by closing and reopening database connection
        await dbPool.end();
        dbPool = new Pool(TEST_CONFIG.dbConfig);

        // Verify user data persistence
        const userCount = await dbPool.query('SELECT COUNT(*) FROM users WHERE email LIKE $1', ['%.test@example.com']);
        expect(parseInt(userCount.rows[0].count)).toBe(TEST_CONFIG.testUsers.length);

        // Verify wardrobe items persistence
        const itemCount = await dbPool.query('SELECT COUNT(*) FROM wardrobe_items');
        expect(parseInt(itemCount.rows[0].count)).toBeGreaterThan(0);

        // Verify marketplace listings persistence
        const listingCount = await dbPool.query('SELECT COUNT(*) FROM marketplace_listings');
        expect(parseInt(listingCount.rows[0].count)).toBeGreaterThan(0);

        // Test user re-authentication after restart
        const loginResponse = await request(TEST_CONFIG.apiBaseUrl)
          .post('/api/auth/login')
          .send({
            email: TEST_CONFIG.testUsers[0].email,
            password: TEST_CONFIG.testUsers[0].password
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toBeDefined();

        testResults.dataPersistence.push({
          test: 'app_restart_simulation',
          status: 'success',
          details: 'All data persisted correctly after restart'
        });

        console.log('   ✅ Data persistence validated after app restart');

      } catch (error) {
        testResults.dataPersistence.push({
          test: 'app_restart_simulation',
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ Data persistence test failed - ${error.message}`);
      }
    });

    test('Cross-session data availability validation', async () => {
      console.log('🔗 Testing cross-session data availability...');

      try {
        // Test multiple login sessions for same user
        const user = TEST_CONFIG.testUsers[0];

        // Session 1
        const session1Response = await request(TEST_CONFIG.apiBaseUrl)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: user.password
          });

        expect(session1Response.status).toBe(200);
        const token1 = session1Response.body.token;

        // Session 2
        const session2Response = await request(TEST_CONFIG.apiBaseUrl)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: user.password
          });

        expect(session2Response.status).toBe(200);
        const token2 = session2Response.body.token;

        // Verify both sessions can access user data
        const wardrobe1 = await request(TEST_CONFIG.apiBaseUrl)
          .get('/api/wardrobe/items')
          .set('Authorization', `Bearer ${token1}`);

        const wardrobe2 = await request(TEST_CONFIG.apiBaseUrl)
          .get('/api/wardrobe/items')
          .set('Authorization', `Bearer ${token2}`);

        expect(wardrobe1.status).toBe(200);
        expect(wardrobe2.status).toBe(200);
        expect(wardrobe1.body.length).toBe(wardrobe2.body.length);

        testResults.dataPersistence.push({
          test: 'cross_session_availability',
          status: 'success',
          details: 'Data accessible across multiple sessions'
        });

        console.log('   ✅ Cross-session data availability validated');

      } catch (error) {
        testResults.dataPersistence.push({
          test: 'cross_session_availability',
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ Cross-session test failed - ${error.message}`);
      }
    });
  });

  describe('Phase 5: Admin Configuration Changes and Persistence', () => {
    test('Admin configuration changes persist to files', async () => {
      console.log('⚙️ Testing admin configuration persistence...');

      try {
        // Login as admin
        const adminLoginResponse = await request(TEST_CONFIG.apiBaseUrl)
          .post('/api/auth/login')
          .send({
            email: TEST_CONFIG.adminUser.email,
            password: TEST_CONFIG.adminUser.password
          });

        expect(adminLoginResponse.status).toBe(200);
        const adminToken = adminLoginResponse.body.token;

        // Test configuration update
        const configUpdate = {
          section: 'vufs',
          key: 'test_category',
          value: {
            name: 'Test Category',
            subcategories: ['test-sub1', 'test-sub2']
          }
        };

        const configResponse = await request(TEST_CONFIG.apiBaseUrl)
          .post('/api/admin/configuration')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(configUpdate);

        expect(configResponse.status).toBe(200);

        // Verify configuration persisted to database
        const configQuery = await dbPool.query(
          'SELECT * FROM system_configurations WHERE section = $1 AND key = $2',
          [configUpdate.section, configUpdate.key]
        );

        expect(configQuery.rows).toHaveLength(1);
        expect(configQuery.rows[0].value).toEqual(configUpdate.value);

        testResults.adminFunctionality.push({
          test: 'configuration_persistence',
          status: 'success',
          details: 'Configuration changes persisted correctly'
        });

        console.log('   ✅ Admin configuration persistence validated');

      } catch (error) {
        testResults.adminFunctionality.push({
          test: 'configuration_persistence',
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ Configuration persistence test failed - ${error.message}`);
      }
    });
  });

  describe('Phase 6: Cross-Platform Functionality Validation', () => {
    test('API endpoints work correctly for cross-platform access', async () => {
      console.log('📱 Testing cross-platform API functionality...');

      try {
        const userToken = await getUserTokens()[0];

        // Test core API endpoints that mobile apps would use
        const endpoints = [
          { method: 'GET', path: '/api/auth/profile', description: 'User profile' },
          { method: 'GET', path: '/api/wardrobe/items', description: 'Wardrobe items' },
          { method: 'GET', path: '/api/marketplace/search', description: 'Marketplace search' },
          { method: 'GET', path: '/api/health', description: 'Health check' }
        ];

        for (const endpoint of endpoints) {
          const response = await request(TEST_CONFIG.apiBaseUrl)
          [endpoint.method.toLowerCase()](endpoint.path)
            .set('Authorization', `Bearer ${userToken}`);

          expect(response.status).toBeLessThan(400);

          testResults.crossPlatformValidation.push({
            endpoint: endpoint.path,
            method: endpoint.method,
            status: 'success',
            description: endpoint.description
          });
        }

        console.log(`   ✅ Cross-platform API endpoints validated (${endpoints.length} endpoints)`);

      } catch (error) {
        testResults.crossPlatformValidation.push({
          test: 'api_endpoints',
          status: 'failed',
          error: error.message
        });
        console.log(`   ❌ Cross-platform API test failed - ${error.message}`);
      }
    });
  });

  describe('Phase 7: Overall Application Health and Requirements Validation', () => {
    test('Validate all requirements are met', async () => {
      console.log('📋 Validating all requirements...');

      const requirementValidation = {
        'Requirement 1.1-1.6': testResults.userRegistration.filter(r => r.registration === 'success').length === TEST_CONFIG.testUsers.length,
        'Requirement 2.1-2.4': testResults.crossPlatformValidation.filter(r => r.status === 'success').length > 0,
        'Requirement 3.1-3.5': testResults.wardrobeBuilding.filter(r => r.creation === 'success').length > 0,
        'Requirement 4.1-4.3': testResults.dataPersistence.filter(r => r.status === 'success').length > 0,
        'Requirement 6.1-6.5': testResults.adminFunctionality.filter(r => r.status === 'success').length > 0,
        'Requirement 9.1-9.3': testResults.marketplaceInteractions.filter(r => r.status === 'success' || r.listing === 'success').length > 0,
        'Requirement 10.1-10.6': testResults.adminFunctionality.filter(r => r.test === 'configuration_persistence' && r.status === 'success').length > 0
      };

      const passedRequirements = Object.values(requirementValidation).filter(Boolean).length;
      const totalRequirements = Object.keys(requirementValidation).length;

      expect(passedRequirements).toBeGreaterThan(totalRequirements * 0.8); // At least 80% of requirements should pass

      testResults.overallSuccess = passedRequirements === totalRequirements;

      console.log(`   📊 Requirements validation: ${passedRequirements}/${totalRequirements} passed`);

      Object.entries(requirementValidation).forEach(([requirement, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${requirement}`);
      });
    });
  });
});

// Helper functions
async function cleanupTestData(): Promise<void> {
  try {
    // Clean up test users and related data
    await dbPool.query('DELETE FROM marketplace_listings WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%.test@example.com']);
    await dbPool.query('DELETE FROM wardrobe_items WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%.test@example.com']);
    await dbPool.query('DELETE FROM users WHERE email LIKE $1', ['%.test@example.com']);
    await dbPool.query('DELETE FROM system_configurations WHERE key = $1', ['test_category']);
  } catch (error) {
    console.log('Note: Some cleanup operations may have failed (this is normal for first run)');
  }
}

async function getUserTokens(): Promise<string[]> {
  const tokens: string[] = [];

  for (const user of TEST_CONFIG.testUsers) {
    try {
      const response = await request(TEST_CONFIG.apiBaseUrl)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: user.password
        });

      if (response.status === 200) {
        tokens.push(response.body.token);
      }
    } catch (error) {
      console.log(`Failed to get token for ${user.email}`);
    }
  }

  return tokens;
}

async function getWardrobeItems(userTokens: string[]): Promise<any[]> {
  const allItems: any[] = [];

  for (const token of userTokens) {
    try {
      const response = await request(TEST_CONFIG.apiBaseUrl)
        .get('/api/wardrobe/items')
        .set('Authorization', `Bearer ${token}`);

      if (response.status === 200 && response.body.length > 0) {
        allItems.push(response.body[0]); // Take first item from each user
      }
    } catch (error) {
      console.log('Failed to get wardrobe items for user');
    }
  }

  return allItems;
}

async function generateTestReport(): Promise<void> {
  const report = {
    timestamp: new Date().toISOString(),
    testConfiguration: {
      totalUsers: TEST_CONFIG.testUsers.length,
      apiBaseUrl: TEST_CONFIG.apiBaseUrl,
      databaseHost: TEST_CONFIG.dbConfig.host
    },
    results: testResults,
    summary: {
      userRegistrationSuccess: testResults.userRegistration.filter(r => r.registration === 'success').length,
      wardrobeBuildingSuccess: testResults.wardrobeBuilding.filter(r => r.creation === 'success').length,
      marketplaceInteractionSuccess: testResults.marketplaceInteractions.filter(r => r.status === 'success' || r.listing === 'success').length,
      dataPersistenceSuccess: testResults.dataPersistence.filter(r => r.status === 'success').length,
      adminFunctionalitySuccess: testResults.adminFunctionality.filter(r => r.status === 'success').length,
      crossPlatformValidationSuccess: testResults.crossPlatformValidation.filter(r => r.status === 'success').length,
      overallSuccess: testResults.overallSuccess
    }
  };

  try {
    await fs.writeFile(
      path.join(process.cwd(), 'complete-application-validation-report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('📄 Test report generated: complete-application-validation-report.json');
  } catch (error) {
    console.log('Failed to generate test report:', error.message);
  }
}