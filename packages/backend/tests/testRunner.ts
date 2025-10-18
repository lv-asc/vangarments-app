/**
 * Test runner script to validate all authentication and user management tests
 * This script can be used to run tests programmatically and verify coverage
 */

import { execSync } from 'child_process';
import path from 'path';

const runTests = async () => {
  console.log('🧪 Running Authentication and User Management Tests...\n');

  try {
    // Change to backend directory
    const backendDir = path.resolve(__dirname, '..');
    process.chdir(backendDir);

    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    console.log('\n🔧 Running unit tests...');
    execSync('npm test -- --testPathPattern="tests/(utils|models)" --verbose', { stdio: 'inherit' });

    console.log('\n🔗 Running integration tests...');
    execSync('npm test -- --testPathPattern="tests/(controllers|integration)" --verbose', { stdio: 'inherit' });

    console.log('\n📊 Generating coverage report...');
    execSync('npm test -- --coverage --testPathPattern="tests/" --verbose', { stdio: 'inherit' });

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };