'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/hooks/useNavigation';

export function NavigationTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const router = useRouter();
  const { navigate, currentPath, goBack, refresh, debugNavigation } = useNavigation();

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testNavigation = async () => {
    try {
      addResult('✅ Testing navigation service...');
      addResult(`Current path: ${currentPath}`);

      const success = await navigate('/search');
      if (success) {
        addResult('✅ Navigation service executed successfully');
      } else {
        addResult('❌ Navigation service failed');
      }
    } catch (error) {
      addResult(`❌ Navigation service error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testWindowLocation = async () => {
    try {
      addResult('✅ Testing window.location fallback...');
      const success = await navigate('/wardrobe');
      if (success) {
        addResult('✅ Navigation to wardrobe executed successfully');
      } else {
        addResult('❌ Navigation to wardrobe failed');
      }
    } catch (error) {
      addResult(`❌ Window.location error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testDirectNavigation = async () => {
    try {
      addResult('✅ Testing direct navigation...');
      const testUrl = '/test';

      const success = await navigate(testUrl);
      if (success) {
        addResult(`✅ Navigation to ${testUrl} executed successfully`);
      } else {
        addResult(`❌ Navigation to ${testUrl} failed`);
      }
    } catch (error) {
      addResult(`❌ Direct navigation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testBackNavigation = async () => {
    try {
      addResult('✅ Testing back navigation...');
      const success = await goBack();
      if (success) {
        addResult('✅ Back navigation executed successfully');
      } else {
        addResult('❌ Back navigation failed');
      }
    } catch (error) {
      addResult(`❌ Back navigation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testRefresh = () => {
    try {
      addResult('✅ Testing page refresh...');
      refresh();
      addResult('✅ Page refresh executed');
    } catch (error) {
      addResult(`❌ Refresh error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testConsole = () => {
    console.log('🔧 Navigation Test - Console working');
    debugNavigation();
    addResult('✅ Console.log working - check browser console for debug info');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-[#00132d]/20 mb-6">
      <h3 className="text-lg font-semibold text-[#00132d] mb-4">Navigation Diagnostic</h3>

      <div className="space-y-3 mb-4">
        <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
          <strong>Current Path:</strong> {currentPath}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testNavigation}
            className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Test Navigation Service
          </button>

          <button
            onClick={testWindowLocation}
            className="bg-[#00132d]/80 text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/70 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Test Wardrobe Navigation
          </button>

          <button
            onClick={testDirectNavigation}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Test Direct Navigation
          </button>

          <button
            onClick={testBackNavigation}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Test Back Navigation
          </button>

          <button
            onClick={testRefresh}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Test Refresh
          </button>

          <button
            onClick={testConsole}
            className="bg-[#00132d]/60 text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/50 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            Debug Console
          </button>

          <button
            onClick={clearResults}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 hover:shadow-md hover:scale-105 col-span-2"
          >
            Clear Results
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
        <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-sm">No tests run yet. Click a button above to test.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}