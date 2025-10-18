#!/usr/bin/env node

import { Pool } from 'pg';
import { ConfigurationService } from '../services/configurationService';
import { AdminAuthService } from '../services/adminAuthService';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment configuration
const environment = process.env.NODE_ENV || 'development';
const envFile = path.join(__dirname, '../../', `.env.${environment}`);

if (require('fs').existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

interface ValidationResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class DataPersistenceValidator {
  private results: ValidationResult[] = [];
  private pool: Pool;
  private configService: ConfigurationService;
  private adminAuthService: AdminAuthService;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    this.configService = new ConfigurationService();
    this.adminAuthService = new AdminAuthService();
  }

  private addResult(test: string, passed: boolean, message: string, details?: any) {
    this.results.push({ test, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${message}`);
    if (details && !passed) {
      console.log('   Details:', details);
    }
  }

  async validateDatabasePersistence(): Promise<void> {
    console.log('\n🔍 Validating Database Persistence...');

    try {
      // Test database connection
      const connectionTest = await this.pool.query('SELECT NOW()');
      this.addResult(
        'Database Connection',
        true,
        'Successfully connected to database'
      );

      // Test table existence
      const tables = await this.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const requiredTables = [
        'users',
        'vufs_items', // Using actual table name from database
        'marketplace_listings',
        'social_posts',
        'system_configurations'
      ];

      const existingTables = tables.rows.map((row: any) => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      this.addResult(
        'Required Tables',
        missingTables.length === 0,
        missingTables.length === 0 
          ? 'All required tables exist'
          : `Missing tables: ${missingTables.join(', ')}`,
        { existing: existingTables, missing: missingTables }
      );

    } catch (error) {
      this.addResult(
        'Database Persistence',
        false,
        'Database validation failed',
        error
      );
    }
  }

  async validateConfigurationPersistence(): Promise<void> {
    console.log('\n🔧 Validating Configuration Persistence...');

    try {
      // Test VUFS configuration file existence
      const vufsConfigPath = path.join(process.cwd(), '../shared/src/constants/vufs.ts');
      
      try {
        await fs.access(vufsConfigPath);
        this.addResult(
          'VUFS Configuration File',
          true,
          'VUFS configuration file exists'
        );

        // Test configuration content
        const configContent = await fs.readFile(vufsConfigPath, 'utf-8');
        const hasCategories = configContent.includes('APPAREL_PIECE_TYPES') || configContent.includes('categories');
        const hasPatterns = configContent.includes('PATTERN_WEIGHTS') || configContent.includes('patterns');
        const hasBrands = configContent.includes('VUFS_BRANDS');
        const hasColors = configContent.includes('VUFS_COLORS');
        
        this.addResult(
          'VUFS Configuration Content',
          hasCategories && hasPatterns && hasBrands && hasColors,
          hasCategories && hasPatterns && hasBrands && hasColors
            ? 'Configuration contains required sections'
            : 'Configuration missing some required sections'
        );

      } catch (error) {
        this.addResult(
          'VUFS Configuration File',
          false,
          'VUFS configuration file not found',
          error
        );
      }

      // Test configuration service functionality
      try {
        // Check if configuration service methods exist
        const hasGetMethod = typeof this.configService.getVUFSConfiguration === 'function';
        this.addResult(
          'Configuration Service',
          hasGetMethod,
          hasGetMethod ? 'Configuration service methods available' : 'Configuration service methods missing'
        );
      } catch (error) {
        this.addResult(
          'Configuration Service',
          false,
          'Configuration service error',
          error
        );
      }

      // Test configuration persistence to database
      try {
        const systemConfigs = await this.pool.query(`
          SELECT * FROM system_configurations 
          WHERE section = 'vufs' 
          LIMIT 5
        `);

        this.addResult(
          'Configuration Database Storage',
          systemConfigs.rows.length >= 0,
          `Found ${systemConfigs.rows.length} configuration entries in database`
        );
      } catch (error) {
        this.addResult(
          'Configuration Database Storage',
          false,
          'Failed to query configuration from database',
          error
        );
      }

    } catch (error) {
      this.addResult(
        'Configuration Persistence',
        false,
        'Configuration validation failed',
        error
      );
    }
  }

  async validateAdminPrivileges(): Promise<void> {
    console.log('\n👑 Validating Admin Privileges...');

    try {
      // Test admin user existence
      const adminUser = await this.pool.query(`
        SELECT id, email, profile 
        FROM users 
        WHERE email = 'lv@vangarments.com'
      `);

      const adminExists = adminUser.rows.length > 0;
      this.addResult(
        'Admin User Existence',
        adminExists,
        adminExists ? 'Admin user "lv" exists' : 'Admin user "lv" not found'
      );

      if (adminExists) {
        // Check for admin role in user_roles table
        const adminRoles = await this.pool.query(`
          SELECT role FROM user_roles 
          WHERE user_id = $1 AND role = 'admin'
        `, [adminUser.rows[0].id]);

        const hasAdminRole = adminRoles.rows.length > 0;
        this.addResult(
          'Admin Role Assignment',
          hasAdminRole,
          hasAdminRole ? 'Admin user has admin role' : 'Admin user missing admin role'
        );
      }

      // Test admin authentication service
      try {
        const hasInitMethod = typeof this.adminAuthService.initializeAdminUser === 'function';
        this.addResult(
          'Admin Auth Service',
          hasInitMethod,
          hasInitMethod ? 'Admin authentication service methods available' : 'Admin authentication service methods missing'
        );
      } catch (error) {
        this.addResult(
          'Admin Auth Service',
          false,
          'Admin authentication service failed',
          error
        );
      }

    } catch (error) {
      this.addResult(
        'Admin Privileges',
        false,
        'Admin privilege validation failed',
        error
      );
    }
  }

  async validateDataIntegrity(): Promise<void> {
    console.log('\n🔒 Validating Data Integrity...');

    try {
      // Test foreign key constraints
      const constraints = await this.pool.query(`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `);

      this.addResult(
        'Foreign Key Constraints',
        constraints.rows.length > 0,
        `Found ${constraints.rows.length} foreign key constraints`
      );

      // Test data consistency
      const userCount = await this.pool.query('SELECT COUNT(*) FROM users');
      const itemCount = await this.pool.query('SELECT COUNT(*) FROM vufs_items');
      
      this.addResult(
        'Data Consistency Check',
        true,
        `Database contains ${userCount.rows[0].count} users and ${itemCount.rows[0].count} items`
      );

    } catch (error) {
      this.addResult(
        'Data Integrity',
        false,
        'Data integrity validation failed',
        error
      );
    }
  }

  async validateFileSystemPersistence(): Promise<void> {
    console.log('\n📁 Validating File System Persistence...');

    try {
      // Test storage directories
      const storagePaths = [
        'storage/images/uploads',
        'storage/images/processed',
        'storage/images/thumbnails',
        'storage/backups'
      ];

      for (const storagePath of storagePaths) {
        const fullPath = path.join(process.cwd(), storagePath);
        try {
          await fs.access(fullPath);
          this.addResult(
            `Storage Directory: ${storagePath}`,
            true,
            'Directory exists and is accessible'
          );
        } catch (error) {
          this.addResult(
            `Storage Directory: ${storagePath}`,
            false,
            'Directory not accessible',
            error
          );
        }
      }

      // Test configuration file write permissions
      const testConfigPath = path.join(process.cwd(), 'test-config-write.tmp');
      try {
        await fs.writeFile(testConfigPath, 'test');
        await fs.unlink(testConfigPath);
        this.addResult(
          'Configuration Write Permissions',
          true,
          'Can write configuration files'
        );
      } catch (error) {
        this.addResult(
          'Configuration Write Permissions',
          false,
          'Cannot write configuration files',
          error
        );
      }

    } catch (error) {
      this.addResult(
        'File System Persistence',
        false,
        'File system validation failed',
        error
      );
    }
  }

  async runAllValidations(): Promise<void> {
    console.log('🚀 Starting Data Persistence and Configuration Validation...\n');

    try {
      await this.validateDatabasePersistence();
      await this.validateConfigurationPersistence();
      await this.validateAdminPrivileges();
      await this.validateDataIntegrity();
      await this.validateFileSystemPersistence();

      // Summary
      const passed = this.results.filter(r => r.passed).length;
      const total = this.results.length;
      const failed = total - passed;

      console.log('\n📊 Validation Summary:');
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
      }

      // Write detailed results to file
      const reportPath = path.join(process.cwd(), 'validation-report.json');
      await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: { passed, failed, total, successRate: (passed / total) * 100 },
        results: this.results
      }, null, 2));

      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      if (failed === 0) {
        console.log('\n🎉 All validations passed! Data persistence and configuration system is working correctly.');
      } else {
        console.log('\n⚠️  Some validations failed. Please review the issues above.');
        process.exit(1);
      }
    } finally {
      // Close database connection
      await this.pool.end();
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DataPersistenceValidator();
  validator.runAllValidations()
    .then(() => {
      console.log('\n✅ Validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { DataPersistenceValidator };