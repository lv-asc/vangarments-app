#!/usr/bin/env ts-node

/**
 * Test script for the configuration management system
 * This script tests the basic functionality of the configuration system
 */

import { ConfigurationService } from '../services/configurationService';
import { FilePersistenceService } from '../services/filePersistenceService';
import { configurationWatcher } from '../services/configurationWatcherService';

async function testConfigurationSystem() {
  console.log('🧪 Testing Configuration Management System...\n');

  try {
    // Test 1: Get all configurations
    console.log('1. Testing configuration retrieval...');
    const configurations = await ConfigurationService.getAllConfigurations();
    console.log(`✅ Retrieved ${configurations.length} configuration sections`);
    configurations.forEach(config => {
      console.log(`   - ${config.name} (${config.type})`);
    });
    console.log();

    // Test 2: Get VUFS standards
    console.log('2. Testing VUFS standards retrieval...');
    const vufsStandards = await ConfigurationService.getVUFSStandards();
    console.log(`✅ Retrieved VUFS standards:`);
    console.log(`   - Categories: ${vufsStandards.categories.length}`);
    console.log(`   - Brands: ${vufsStandards.brands.length}`);
    console.log(`   - Colors: ${vufsStandards.colors.length}`);
    console.log(`   - Materials: ${vufsStandards.materials.length}`);
    console.log();

    // Test 3: Add a new VUFS color
    console.log('3. Testing VUFS color addition...');
    const newColor = await ConfigurationService.addVUFSColor({
      name: 'Test Color',
      hex: '#FF5733',
      undertones: ['warm', 'vibrant'],
    }, 'test-user');
    console.log(`✅ Added new color: ${newColor.name} (${newColor.hex})`);
    console.log();

    // Test 4: Test backup system
    console.log('4. Testing backup system...');
    const backups = await ConfigurationService.getBackupHistory();
    console.log(`✅ Retrieved ${backups.length} backups`);
    if (backups.length > 0) {
      console.log(`   Latest backup: ${backups[0].description} (${backups[0].timestamp})`);
    }
    console.log();

    // Test 5: Test file persistence initialization
    console.log('5. Testing file persistence system...');
    await FilePersistenceService.initializeBackupDirectory();
    const backupList = await FilePersistenceService.getBackupList();
    console.log(`✅ File persistence system working, ${backupList.length} file backups found`);
    console.log();

    // Test 6: Test configuration watcher
    console.log('6. Testing configuration watcher...');
    const watchedFiles = configurationWatcher.getWatchedFiles();
    console.log(`✅ Configuration watcher monitoring ${watchedFiles.length} files:`);
    watchedFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log();

    // Test 7: Test configuration reload
    console.log('7. Testing configuration reload...');
    const reloadResult = await ConfigurationService.reloadConfiguration();
    console.log(`✅ Configuration reload: ${reloadResult.message}`);
    console.log();

    console.log('🎉 All configuration system tests passed!\n');

    // Display summary
    console.log('📊 Configuration System Summary:');
    console.log(`   • Configuration sections: ${configurations.length}`);
    console.log(`   • VUFS categories: ${vufsStandards.categories.length}`);
    console.log(`   • VUFS brands: ${vufsStandards.brands.length}`);
    console.log(`   • VUFS colors: ${vufsStandards.colors.length}`);
    console.log(`   • VUFS materials: ${vufsStandards.materials.length}`);
    console.log(`   • Configuration backups: ${backups.length}`);
    console.log(`   • Watched files: ${watchedFiles.length}`);
    console.log();

  } catch (error) {
    console.error('❌ Configuration system test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testConfigurationSystem()
    .then(() => {
      console.log('✅ Configuration system test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Configuration system test failed:', error);
      process.exit(1);
    });
}

export { testConfigurationSystem };