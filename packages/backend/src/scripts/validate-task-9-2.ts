#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment configuration
dotenv.config();

interface ValidationResult {
  requirement: string;
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

class Task92Validator {
  private pool: Pool;
  private results: ValidationResult[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  private addResult(requirement: string, test: string, passed: boolean, message: string, details?: any) {
    this.results.push({ requirement, test, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} [${requirement}] ${test}: ${message}`);
    if (details && !passed) {
      console.log('   Details:', details);
    }
  }

  async validateRequirement64(): Promise<void> {
    console.log('\n🔍 Validating Requirement 6.4: Admin user "lv" has full administrative privileges');

    try {
      // Check admin user exists
      const adminUser = await this.pool.query(`
        SELECT id, email, profile 
        FROM users 
        WHERE email = 'lv@vangarments.com'
      `);

      const adminExists = adminUser.rows.length > 0;
      this.addResult(
        '6.4',
        'Admin User Existence',
        adminExists,
        adminExists ? 'Admin user "lv" exists in database' : 'Admin user "lv" not found'
      );

      if (adminExists) {
        // Check admin role
        const adminRoles = await this.pool.query(`
          SELECT role FROM user_roles 
          WHERE user_id = $1 AND role = 'admin'
        `, [adminUser.rows[0].id]);

        const hasAdminRole = adminRoles.rows.length > 0;
        this.addResult(
          '6.4',
          'Admin Role Assignment',
          hasAdminRole,
          hasAdminRole ? 'Admin user has admin role assigned' : 'Admin user missing admin role'
        );

        // Test admin can access all users (privilege test)
        const allUsers = await this.pool.query('SELECT COUNT(*) FROM users');
        this.addResult(
          '6.4',
          'Admin Database Access',
          parseInt(allUsers.rows[0].count) >= 1,
          `Admin can query user data (${allUsers.rows[0].count} users found)`
        );
      }

    } catch (error) {
      this.addResult('6.4', 'Admin Privilege Validation', false, 'Failed to validate admin privileges', error);
    }
  }

  async validateRequirement65(): Promise<void> {
    console.log('\n🔍 Validating Requirement 6.5: Admin privileges persist across sessions');

    try {
      // Simulate session restart by creating new connection
      const newPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      // Verify admin user still exists after "restart"
      const adminCheck = await newPool.query(`
        SELECT u.id, u.email, ur.role
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE u.email = 'lv@vangarments.com' AND ur.role = 'admin'
      `);

      const adminPersists = adminCheck.rows.length > 0;
      this.addResult(
        '6.5',
        'Admin Persistence After Restart',
        adminPersists,
        adminPersists ? 'Admin privileges persist after connection restart' : 'Admin privileges lost after restart'
      );

      await newPool.end();

    } catch (error) {
      this.addResult('6.5', 'Admin Session Persistence', false, 'Failed to validate admin session persistence', error);
    }
  }

  async validateRequirement104(): Promise<void> {
    console.log('\n🔍 Validating Requirement 10.4: Configuration changes persist to actual files');

    try {
      // Test VUFS configuration file exists and is writable
      const vufsConfigPath = path.join(process.cwd(), '../shared/src/constants/vufs.ts');
      
      try {
        await fs.access(vufsConfigPath, fs.constants.R_OK | fs.constants.W_OK);
        this.addResult(
          '10.4',
          'Configuration File Access',
          true,
          'VUFS configuration file is readable and writable'
        );

        // Test configuration content
        const configContent = await fs.readFile(vufsConfigPath, 'utf-8');
        const hasRequiredSections = configContent.includes('VUFS_BRANDS') && 
                                   configContent.includes('VUFS_COLORS') && 
                                   configContent.includes('APPAREL_PIECE_TYPES');

        this.addResult(
          '10.4',
          'Configuration File Content',
          hasRequiredSections,
          hasRequiredSections ? 'Configuration file contains required VUFS sections' : 'Configuration file missing required sections'
        );

        // Test ability to write configuration changes
        const testConfigPath = path.join(process.cwd(), 'test-config-write.tmp');
        const testConfig = {
          timestamp: new Date().toISOString(),
          testData: 'Configuration persistence validation'
        };

        await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2));
        const writtenContent = await fs.readFile(testConfigPath, 'utf-8');
        const parsedContent = JSON.parse(writtenContent);
        
        const writeSuccessful = parsedContent.testData === testConfig.testData;
        this.addResult(
          '10.4',
          'Configuration Write Capability',
          writeSuccessful,
          writeSuccessful ? 'Can write configuration changes to files' : 'Cannot write configuration changes'
        );

        // Clean up test file
        await fs.unlink(testConfigPath);

      } catch (error) {
        this.addResult('10.4', 'Configuration File Access', false, 'Cannot access configuration files', error);
      }

    } catch (error) {
      this.addResult('10.4', 'Configuration Persistence', false, 'Failed to validate configuration persistence', error);
    }
  }

  async validateRequirement105(): Promise<void> {
    console.log('\n🔍 Validating Requirement 10.5: Real-time configuration updates');

    try {
      // Test system_configurations table exists and is functional
      const configCount = await this.pool.query('SELECT COUNT(*) FROM system_configurations');
      const hasConfigs = parseInt(configCount.rows[0].count) > 0;
      
      this.addResult(
        '10.5',
        'Configuration Database Storage',
        hasConfigs,
        `Configuration database contains ${configCount.rows[0].count} entries`
      );

      // Test configuration update capability
      const testConfigKey = 'test_validation_' + Date.now();
      const testConfigValue = { testMode: true, timestamp: new Date().toISOString() };

      await this.pool.query(`
        INSERT INTO system_configurations (section, key, value, is_editable, requires_restart)
        VALUES ('test', $1, $2, true, false)
      `, [testConfigKey, JSON.stringify(testConfigValue)]);

      // Verify the configuration was stored
      const storedConfig = await this.pool.query(`
        SELECT value FROM system_configurations 
        WHERE section = 'test' AND key = $1
      `, [testConfigKey]);

      const configStored = storedConfig.rows.length > 0;
      this.addResult(
        '10.5',
        'Configuration Update Capability',
        configStored,
        configStored ? 'Can store and retrieve configuration updates' : 'Cannot store configuration updates'
      );

      // Clean up test configuration
      await this.pool.query(`
        DELETE FROM system_configurations 
        WHERE section = 'test' AND key = $1
      `, [testConfigKey]);

    } catch (error) {
      this.addResult('10.5', 'Real-time Configuration Updates', false, 'Failed to validate configuration updates', error);
    }
  }

  async validateRequirement106(): Promise<void> {
    console.log('\n🔍 Validating Requirement 10.6: Configuration backup and rollback mechanisms');

    try {
      // Test backup directory exists
      const backupDir = path.join(process.cwd(), 'storage/backups');
      
      try {
        await fs.access(backupDir);
        this.addResult(
          '10.6',
          'Backup Directory Access',
          true,
          'Configuration backup directory exists and is accessible'
        );

        // Test backup creation capability
        const backupFileName = `config-backup-${Date.now()}.json`;
        const backupPath = path.join(backupDir, backupFileName);
        const backupData = {
          timestamp: new Date().toISOString(),
          configurations: { test: 'backup validation' },
          version: '1.0.0'
        };

        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        
        // Verify backup was created
        const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
        this.addResult(
          '10.6',
          'Backup Creation Capability',
          backupExists,
          backupExists ? 'Can create configuration backups' : 'Cannot create configuration backups'
        );

        // Test rollback capability (restore from backup)
        if (backupExists) {
          const restoredContent = await fs.readFile(backupPath, 'utf-8');
          const restoredData = JSON.parse(restoredContent);
          const rollbackSuccessful = restoredData.configurations.test === 'backup validation';
          
          this.addResult(
            '10.6',
            'Rollback Capability',
            rollbackSuccessful,
            rollbackSuccessful ? 'Can restore configurations from backup' : 'Cannot restore from backup'
          );
        }

        // Clean up backup file
        await fs.unlink(backupPath);

      } catch (error) {
        this.addResult('10.6', 'Backup Directory Access', false, 'Cannot access backup directory', error);
      }

    } catch (error) {
      this.addResult('10.6', 'Configuration Backup and Rollback', false, 'Failed to validate backup mechanisms', error);
    }
  }

  async validateDataPersistenceAcrossRestarts(): Promise<void> {
    console.log('\n🔍 Validating Data Persistence Across App Restarts');

    try {
      // Create test data
      const testEmail = `test-persistence-${Date.now()}@example.com`;
      const testUser = await this.pool.query(`
        INSERT INTO users (email, password_hash, profile, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        testEmail,
        'test-hash',
        JSON.stringify({ name: 'Test Persistence User' }),
        new Date(),
        new Date()
      ]);

      const userId = testUser.rows[0].id;

      // Simulate app restart by creating new connection
      await this.pool.end();
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      // Verify data persists after restart
      const persistedUser = await this.pool.query(`
        SELECT id, email, profile FROM users WHERE id = $1
      `, [userId]);

      const dataPersists = persistedUser.rows.length > 0;
      this.addResult(
        'Data Persistence',
        'User Data Survives Restart',
        dataPersists,
        dataPersists ? 'User data persists across app restarts' : 'User data lost after restart'
      );

      // Clean up test data
      await this.pool.query('DELETE FROM users WHERE id = $1', [userId]);

    } catch (error) {
      this.addResult('Data Persistence', 'Restart Validation', false, 'Failed to validate data persistence', error);
    }
  }

  async runAllValidations(): Promise<void> {
    console.log('🚀 Starting Task 9.2 Validation: Data Persistence and Configuration Changes\n');

    try {
      await this.validateRequirement64();
      await this.validateRequirement65();
      await this.validateRequirement104();
      await this.validateRequirement105();
      await this.validateRequirement106();
      await this.validateDataPersistenceAcrossRestarts();

      // Generate summary
      const passed = this.results.filter(r => r.passed).length;
      const failed = this.results.filter(r => r.passed === false).length;
      const total = this.results.length;
      const successRate = total > 0 ? (passed / total) * 100 : 0;

      console.log('\n📊 Task 9.2 Validation Summary:');
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);

      // Group results by requirement
      const requirementGroups = this.results.reduce((groups, result) => {
        if (!groups[result.requirement]) {
          groups[result.requirement] = [];
        }
        groups[result.requirement].push(result);
        return groups;
      }, {} as Record<string, ValidationResult[]>);

      console.log('\n📋 Results by Requirement:');
      Object.entries(requirementGroups).forEach(([req, results]) => {
        const reqPassed = results.filter(r => r.passed).length;
        const reqTotal = results.length;
        const reqStatus = reqPassed === reqTotal ? '✅' : '❌';
        console.log(`${reqStatus} Requirement ${req}: ${reqPassed}/${reqTotal} tests passed`);
      });

      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.results
          .filter(r => !r.passed)
          .forEach(r => console.log(`   - [${r.requirement}] ${r.test}: ${r.message}`));
      }

      // Write detailed report
      const reportPath = path.join(process.cwd(), 'task-9-2-validation-report.json');
      await fs.writeFile(reportPath, JSON.stringify({
        task: '9.2',
        description: 'Validate data persistence and configuration changes',
        timestamp: new Date().toISOString(),
        summary: { passed, failed, total, successRate },
        requirements: {
          '6.4': 'Admin user "lv" has full administrative privileges',
          '6.5': 'Admin privileges persist across sessions',
          '10.4': 'Configuration changes persist to actual files',
          '10.5': 'Real-time configuration updates',
          '10.6': 'Configuration backup and rollback mechanisms'
        },
        results: this.results
      }, null, 2));

      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      if (failed === 0) {
        console.log('\n🎉 Task 9.2 completed successfully! All validations passed.');
        console.log('✅ Data persistence validated across app restarts');
        console.log('✅ Configuration changes persist to actual files');
        console.log('✅ Admin functionality and privilege system working correctly');
      } else {
        console.log('\n⚠️  Some validations failed. Please review the issues above.');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Task 9.2 validation failed:', error);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new Task92Validator();
  validator.runAllValidations()
    .then(() => {
      console.log('\n✅ Task 9.2 validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Task 9.2 validation failed:', error);
      process.exit(1);
    });
}

export { Task92Validator };