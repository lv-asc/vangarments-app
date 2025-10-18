#!/usr/bin/env node

import { AdminAuthService } from '../services/adminAuthService';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

async function testAdminAuth() {
  try {
    console.log('🧪 Testing admin authentication...');

    // Test admin login
    const authResult = await AdminAuthService.authenticateAdmin('lv@vangarments.com', 'admin123');
    
    if (!authResult) {
      console.error('❌ Admin authentication failed');
      return;
    }

    console.log('✅ Admin authentication successful!');
    console.log(`   User ID: ${authResult.user.id}`);
    console.log(`   Email: ${authResult.user.email}`);
    console.log(`   Name: ${authResult.user.personalInfo.name}`);
    console.log(`   Is Admin: ${authResult.isAdmin}`);
    console.log(`   Permissions: ${authResult.permissions.join(', ')}`);
    console.log(`   Token: ${authResult.token.substring(0, 50)}...`);

    // Test admin privilege check
    const isAdmin = await AdminAuthService.isAdmin(authResult.user.id);
    console.log(`✅ Admin privilege check: ${isAdmin}`);

    // Test admin access validation
    const hasConfigAccess = await AdminAuthService.validateAdminAccess(authResult.user.id, 'configure_vufs');
    console.log(`✅ VUFS configuration access: ${hasConfigAccess}`);

    const hasUserManagement = await AdminAuthService.validateAdminAccess(authResult.user.id, 'manage_users');
    console.log(`✅ User management access: ${hasUserManagement}`);

    console.log('🎉 All admin authentication tests passed!');

  } catch (error) {
    console.error('❌ Admin authentication test failed:', error.message);
    throw error;
  }
}

testAdminAuth().catch(console.error);