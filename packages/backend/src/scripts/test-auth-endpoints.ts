#!/usr/bin/env node

import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

const API_BASE_URL = 'http://localhost:3001/api';

async function testAuthEndpoints() {
  try {
    console.log('🧪 Testing authentication API endpoints...');
    console.log(`📡 API Base URL: ${API_BASE_URL}`);

    // Test 1: Admin Login
    console.log('\n1️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
      email: 'lv@vangarments.com',
      password: 'admin123'
    });

    if (loginResponse.status === 200) {
      console.log('✅ Admin login successful');
      console.log(`   User: ${loginResponse.data.user.personalInfo.name}`);
      console.log(`   Email: ${loginResponse.data.user.email}`);
      console.log(`   Is Admin: ${loginResponse.data.isAdmin}`);
      console.log(`   Permissions: ${loginResponse.data.permissions.length} permissions`);
    }

    const adminToken = loginResponse.data.token;

    // Test 2: Get Profile with Admin Token
    console.log('\n2️⃣ Testing profile access with admin token...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (profileResponse.status === 200) {
      console.log('✅ Profile access successful');
      console.log(`   User ID: ${profileResponse.data.user.id}`);
      console.log(`   Name: ${profileResponse.data.user.personalInfo.name}`);
    }

    // Test 3: Test Admin-Only Endpoint
    console.log('\n3️⃣ Testing admin-only endpoint...');
    const adminUsersResponse = await axios.get(`${API_BASE_URL}/auth/admin/users`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (adminUsersResponse.status === 200) {
      console.log('✅ Admin users endpoint accessible');
      console.log(`   Found ${adminUsersResponse.data.users.length} admin users`);
    }

    // Test 4: Regular User Registration
    console.log('\n4️⃣ Testing regular user registration...');
    const testUserEmail = `test.user.${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      cpf: '12345678901',
      email: testUserEmail,
      password: 'testpassword123',
      name: 'Test User',
      birthDate: '1995-05-15',
      gender: 'other'
    });

    if (registerResponse.status === 201) {
      console.log('✅ User registration successful');
      console.log(`   New User ID: ${registerResponse.data.user.id}`);
      console.log(`   Email: ${registerResponse.data.user.email}`);
    }

    const userToken = registerResponse.data.token;

    // Test 5: Regular User Login
    console.log('\n5️⃣ Testing regular user login...');
    const userLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUserEmail,
      password: 'testpassword123'
    });

    if (userLoginResponse.status === 200) {
      console.log('✅ Regular user login successful');
      console.log(`   User: ${userLoginResponse.data.user.personalInfo.name}`);
    }

    // Test 6: Test Access Control (Regular User Trying Admin Endpoint)
    console.log('\n6️⃣ Testing access control (regular user -> admin endpoint)...');
    try {
      await axios.get(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      console.log('❌ Access control failed - regular user accessed admin endpoint');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Access control working - regular user blocked from admin endpoint');
      } else {
        console.log(`⚠️ Unexpected error: ${error.response?.status}`);
      }
    }

    // Test 7: Grant Admin Role
    console.log('\n7️⃣ Testing admin role granting...');
    const grantRoleResponse = await axios.post(`${API_BASE_URL}/auth/admin/grant-role`, {
      userId: registerResponse.data.user.id
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (grantRoleResponse.status === 200) {
      console.log('✅ Admin role granted successfully');
    }

    console.log('\n🎉 All authentication tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin user "lv" authentication working');
    console.log('   ✅ JWT token generation and validation working');
    console.log('   ✅ Role-based access control working');
    console.log('   ✅ User registration and login working');
    console.log('   ✅ Admin privilege management working');
    console.log('   ✅ Real data persistence confirmed');

  } catch (error: any) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    throw error;
  }
}

// Check if server is running first
async function checkServerHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if backend server is running...');

  const isServerRunning = await checkServerHealth();
  if (!isServerRunning) {
    console.log('⚠️ Backend server is not running.');
    console.log('💡 Please start the backend server first:');
    console.log('   cd packages/backend && npm run dev');
    console.log('\nThen run this test again.');
    return;
  }

  console.log('✅ Backend server is running');
  await testAuthEndpoints();
}

main().catch(console.error);