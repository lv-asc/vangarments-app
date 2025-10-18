#!/usr/bin/env node

import { Pool } from 'pg';
import { AuthUtils } from '../utils/auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://lv@localhost:5432/vangarments',
  });

  try {
    console.log('🔐 Creating admin user "lv"...');

    // Hash the password
    const password = 'admin123';
    const passwordHash = await AuthUtils.hashPassword(password);

    // Check if user already exists
    const existingUser = await pool.query('SELECT id, email FROM users WHERE email = $1', ['lv@vangarments.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ Admin user already exists');
      const userId = existingUser.rows[0].id;
      
      // Ensure admin role exists
      await pool.query(`
        INSERT INTO user_roles (user_id, role) 
        VALUES ($1, 'admin') 
        ON CONFLICT (user_id, role) DO NOTHING
      `, [userId]);
      
      console.log('✅ Admin role ensured for existing user');
      return;
    }

    // Create the admin user
    const profile = {
      name: 'lv',
      birthDate: '1990-01-01',
      gender: 'other',
      location: {}
    };

    const userResult = await pool.query(`
      INSERT INTO users (cpf, email, password_hash, profile)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email
    `, ['00000000000', 'lv@vangarments.com', passwordHash, JSON.stringify(profile)]);

    const userId = userResult.rows[0].id;

    // Add admin role
    await pool.query(`
      INSERT INTO user_roles (user_id, role) 
      VALUES ($1, 'admin')
    `, [userId]);

    // Add consumer role for basic functionality
    await pool.query(`
      INSERT INTO user_roles (user_id, role) 
      VALUES ($1, 'consumer')
    `, [userId]);

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: lv@vangarments.com`);
    console.log(`   Password: admin123`);
    console.log(`   ID: ${userId}`);
    console.log(`   Roles: admin, consumer`);

  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdminUser().catch(console.error);