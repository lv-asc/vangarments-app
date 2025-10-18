/**
 * Cross-Platform Test Runner
 * Orchestrates cross-platform compatibility tests
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import { execSync } from 'child_process';
import path from 'path';

interface TestSuite {
  name: string;
  path: string;
  platform: 'backend' | 'web' | 'mobile';
  description: string;
}

class CrossPlatformTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Backend Cross-Platform API Tests',
      path: 'packages/backend/tests/integration/crossPlatformCompatibility.test.ts',
      platform: 'backend',
      description: 'Tests API compatibility across different client platforms'
    },
    {
      name: 'Backend Offline Sync Tests',
      path: 'packages/backend/tests/integration/offlineFunctionalitySync.test.ts',
      platform: 'backend',
      description: 'Tests offline functionality and synchronization mechanisms'
    },
    {
      name: 'Backend Batch Upload Tests',
      path: 'packages/backend/tests/integration/batchUploadProgress.test.ts',
      platform: 'backend',
      description: 'Tests batch upload and progress tracking functionality'
    },
    {
      name: 'Web Cross-Platform Tests',
      path: 'packages/web/src/__tests__/crossPlatformCompatibility.test.tsx',
      platform: 'web',
      description: 'Tests web application cross-platform compatibility'
    },
    {
      name: 'Mobile Cross-Platform Tests',
      path: 'vangarments-mobile/__tests__/crossPlatformCompatibility.test.tsx',
      platform: 'mobile',
      description: 'Tests mobile application iOS/Android compatibility'
    }
  ];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Cross-Platform Compatibility Test Suite');
    console.log('=' .repeat(60));

    const results: { suite: TestSuite; success: boolean; error?: string }[] = [];

    for (const suite of this.testSuites) {
      console.log(`\n📱 Running: ${suite.name}`);
      console.log(`📍 Platform: ${suite.platform}`);
      console.log(`📝 Description: ${suite.description}`);
      console.log('-'.repeat(40));

      try {
        await this.runTestSuite(suite);
        results.push({ suite, success: true });
        console.log(`✅ ${suite.name} - PASSED`);
      } catch (error) {
        results.push({ 
          suite, 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`❌ ${suite.name} - FAILED`);
        console.log(`Error: ${error}`);
      }
    }

    this.printSummary(results);
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    const workspaceRoot = process.cwd();
    
    switch (suite.platform) {
      case 'backend':
        execSync('npm test -- --testPathPattern=crossPlatformCompatibility', {
          cwd: path.join(workspaceRoot, 'packages/backend'),
          stdio: 'inherit'
        });
        execSync('npm test -- --testPathPattern=offlineFunctionalitySync', {
          cwd: path.join(workspaceRoot, 'packages/backend'),
          stdio: 'inherit'
        });
        execSync('npm test -- --testPathPattern=batchUploadProgress', {
          cwd: path.join(workspaceRoot, 'packages/backend'),
          stdio: 'inherit'
        });
        break;

      case 'web':
        execSync('npm test -- --testPathPattern=crossPlatformCompatibility', {
          cwd: path.join(workspaceRoot, 'packages/web'),
          stdio: 'inherit'
        });
        break;

      case 'mobile':
        execSync('npm test -- --testPathPattern=crossPlatformCompatibility', {
          cwd: path.join(workspaceRoot, 'vangarments-mobile'),
          stdio: 'inherit'
        });
        break;

      default:
        throw new Error(`Unknown platform: ${suite.platform}`);
    }
  }

  private printSummary(results: { suite: TestSuite; success: boolean; error?: string }[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  • ${result.suite.name}`);
          if (result.error) {
            console.log(`    Error: ${result.error}`);
          }
        });
    }

    console.log('\n🎯 COVERAGE AREAS TESTED:');
    console.log('  • API Response Format Consistency');
    console.log('  • Platform-Specific Header Handling');
    console.log('  • Image Upload Compatibility');
    console.log('  • Data Synchronization');
    console.log('  • Authentication Token Compatibility');
    console.log('  • Error Handling Consistency');
    console.log('  • Offline Storage and Sync');
    console.log('  • Batch Upload and Progress Tracking');
    console.log('  • Network Connectivity Detection');
    console.log('  • Browser/Device Compatibility');
    console.log('  • Performance Optimization');
    console.log('  • Security and Privacy');

    if (failed === 0) {
      console.log('\n🎉 All cross-platform compatibility tests passed!');
      console.log('✨ The application is ready for multi-platform deployment.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
      process.exit(1);
    }
  }

  async runSpecificPlatform(platform: 'backend' | 'web' | 'mobile'): Promise<void> {
    const platformSuites = this.testSuites.filter(suite => suite.platform === platform);
    
    if (platformSuites.length === 0) {
      throw new Error(`No test suites found for platform: ${platform}`);
    }

    console.log(`🚀 Running ${platform.toUpperCase()} Cross-Platform Tests`);
    console.log('='.repeat(50));

    for (const suite of platformSuites) {
      try {
        await this.runTestSuite(suite);
        console.log(`✅ ${suite.name} - PASSED`);
      } catch (error) {
        console.log(`❌ ${suite.name} - FAILED`);
        throw error;
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new CrossPlatformTestRunner();
  const platform = process.argv[2] as 'backend' | 'web' | 'mobile' | undefined;

  if (platform && ['backend', 'web', 'mobile'].includes(platform)) {
    runner.runSpecificPlatform(platform).catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
  } else {
    runner.runAllTests().catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
  }
}

export { CrossPlatformTestRunner };