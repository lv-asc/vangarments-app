#!/usr/bin/env node

import { Pool } from 'pg';
import { UserModel } from '../models/User';
import { AuthUtils } from '../utils/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

interface AdminUserConfig {
  email: string;
  password: string;
  name: string;
  cpf?: string;
}

export class AdminUserInitializer {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createAdminUser(config: AdminUserConfig): Promise<void> {
    console.log(`🔐 Creating admin user: ${config.email}`);

    try {
      // Check if admin user already exists
      const existingUser = await UserModel.findByEmail(config.email);
      if (existingUser) {
        console.log(`⚠️ Admin user ${config.email} already exists`);
        
        // Ensure admin role is assigned
        const roles = await UserModel.getUserRoles(existingUser.id);
        if (!roles.includes('admin')) {
          await UserModel.addRole(existingUser.id, 'admin');
          console.log(`✅ Admin role added to existing user ${config.email}`);
        } else {
          console.log(`ℹ️ User ${config.email} already has admin role`);
        }
        return;
      }

      // Hash the password
      const passwordHash = await AuthUtils.hashPassword(config.password);

      // Create the admin user
      const adminUser = await UserModel.create({
        email: config.email,
        passwordHash,
        name: config.name,
        birthDate: new Date('1990-01-01'), // Default birth date for admin
        gender: 'other',
        cpf: config.cpf,
      });

      // Add admin role
      await UserModel.addRole(adminUser.id, 'admin');
      
      // Add consumer role as well (for basic functionality)
      await UserModel.addRole(adminUser.id, 'consumer');

      console.log(`✅ Admin user created successfully:`);
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.personalInfo.name}`);
      console.log(`   Roles: admin, consumer`);

    } catch (error) {
      console.error('❌ Failed to create admin user:', error.message);
      throw error;
    }
  }

  async initializeDefaultAdmin(): Promise<void> {
    const defaultAdminConfig: AdminUserConfig = {
      email: 'lv@vangarments.com',
      password: 'admin123', // This should be changed in production
      name: 'lv',
      cpf: '00000000000', // Default CPF for admin user
    };

    await this.createAdminUser(defaultAdminConfig);
  }

  async ensureAdminPrivileges(email: string): Promise<void> {
    console.log(`🔧 Ensuring admin privileges for: ${email}`);

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error(`User ${email} not found`);
    }

    const roles = await UserModel.getUserRoles(user.id);
    
    if (!roles.includes('admin')) {
      await UserModel.addRole(user.id, 'admin');
      console.log(`✅ Admin role granted to ${email}`);
    } else {
      console.log(`ℹ️ User ${email} already has admin privileges`);
    }
  }

  async listAdminUsers(): Promise<void> {
    console.log('👑 Current admin users:');
    
    const query = `
      SELECT u.id, u.email, u.profile, u.created_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role = 'admin'
      ORDER BY u.created_at
    `;

    const result = await this.pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('   No admin users found');
      return;
    }

    result.rows.forEach((row, index) => {
      const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;
      console.log(`   ${index + 1}. ${profile.name} (${row.email})`);
      console.log(`      ID: ${row.id}`);
      console.log(`      Created: ${new Date(row.created_at).toLocaleDateString()}`);
    });
  }
}

async function main() {
  const command = process.argv[2];
  const email = process.argv[3];

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const initializer = new AdminUserInitializer(pool);

  try {
    switch (command) {
      case 'create':
      case 'init':
        await initializer.initializeDefaultAdmin();
        break;
      
      case 'grant':
        if (!email) {
          console.error('❌ Email is required for grant command');
          process.exit(1);
        }
        await initializer.ensureAdminPrivileges(email);
        break;
      
      case 'list':
        await initializer.listAdminUsers();
        break;
      
      default:
        console.log(`
Usage: npm run create-admin <command> [options]

Commands:
  create, init         Create default admin user "lv"
  grant <email>        Grant admin privileges to existing user
  list                 List all admin users

Examples:
  npm run create-admin create
  npm run create-admin grant user@example.com
  npm run create-admin list
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Admin user operation failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}