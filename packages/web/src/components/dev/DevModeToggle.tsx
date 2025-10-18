'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockAuth, mockUsers } from '../../contexts/MockAuthContext';

export default function DevModeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const { user, setMockUser, logout, isAuthenticated } = useMockAuth();

  useEffect(() => {
    const isDev = localStorage.getItem('devMode') === 'true';
    setDevMode(isDev);
  }, []);

  const toggleDevMode = () => {
    const newDevMode = !devMode;
    setDevMode(newDevMode);
    localStorage.setItem('devMode', newDevMode.toString());
    
    // Dispatch custom event to notify auth wrapper
    window.dispatchEvent(new CustomEvent('devModeChange', { 
      detail: { enabled: newDevMode } 
    }));
    
    if (!newDevMode) {
      // Exit dev mode, logout
      logout();
    }
  };

  const loginAsUser = (email: string) => {
    const mockUser = mockUsers[email];
    if (mockUser) {
      setMockUser(mockUser);
      setIsOpen(false);
      
      // Redirect to wardrobe after login to avoid beta page issues
      setTimeout(() => {
        window.location.href = '/wardrobe';
      }, 100);
    }
  };

  // Disable development mode overlay completely
  return null;

  return (
    <>
      {/* Dev Mode Toggle Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-sm transition-all ${
            devMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Development Mode"
        >
          DEV
        </motion.button>
      </motion.div>

      {/* Dev Mode Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
            className="fixed bottom-20 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-40 w-80 max-h-[80vh] overflow-y-auto"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Development Mode</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleDevMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    devMode ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      devMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {devMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {devMode && (
              <div className="space-y-3">
                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Login</h4>
                  
                  {user ? (
                    <div className={`mb-3 p-3 rounded-lg border-2 ${
                      user.isDeveloper 
                        ? 'bg-[#fff7d7] border-[#00132d]/20' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`text-sm font-bold ${
                          user.isDeveloper 
                            ? 'text-[#00132d]' 
                            : 'text-green-800'
                        }`}>
                          ✅ {user.isDeveloper ? 'Master Developer' : 'Logged in as'}: {user.name}
                        </div>
                        {user.isDeveloper && (
                          <div className="w-4 h-4 bg-[#00132d] rounded-full flex items-center justify-center text-[#fff7d7] text-xs font-bold">
                            DEV
                          </div>
                        )}
                      </div>
                      <div className={`text-xs ${user.isDeveloper ? 'text-[#00132d]' : 'text-green-600'}`}>
                        {user.email}
                      </div>
                      {user.isDeveloper && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          🔧 Full Development Access • Admin Privileges • All Features Unlocked
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1">
                        Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                      </div>
                      <button
                        onClick={() => logout()}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 p-2 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-sm text-red-800">
                        <strong>❌ Not logged in</strong>
                      </div>
                      <div className="text-xs text-red-600">
                        Auth Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => loginAsUser('lvicentini10@gmail.com')}
                      className="w-full text-left p-3 rounded-lg hover:bg-[#fff7d7] border-2 border-[#00132d]/20 transition-all duration-300 shadow-sm"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="text-sm font-bold text-[#00132d]">
                          Leandro Martins Vicentini
                        </div>
                        <div className="w-4 h-4 bg-[#00132d] rounded-full flex items-center justify-center text-[#fff7d7] text-xs font-bold">
                          DEV
                        </div>
                      </div>
                      <div className="text-xs text-[#00132d] font-medium">lvicentini10@gmail.com</div>
                      <div className="text-xs text-blue-500 font-medium">Master Developer • Full Access • Admin</div>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        alert('Mock data system has been removed. Use real API endpoints now.');
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors opacity-50 cursor-not-allowed"
                    >
                      <div className="text-sm font-medium text-gray-900">Mock Data Removed</div>
                      <div className="text-xs text-gray-600">Use real API endpoints</div>
                    </button>
                    
                    <button
                      onClick={() => {
                        alert('Dev Mode Panel removed. Check console for debug info');
                        console.log('Dev Mode Active:', devMode);
                        console.log('Current User:', user);
                        console.log('Auth Status:', isAuthenticated);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors opacity-50 cursor-not-allowed"
                    >
                      <div className="text-sm font-medium text-gray-900">Dev Panel Removed</div>
                      <div className="text-xs text-gray-600">Console debug only</div>
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Navigation</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a href="/wardrobe" className="p-2 bg-blue-50 text-blue-700 rounded text-center hover:bg-blue-100">
                      Wardrobe
                    </a>
                    <a href="/profile" className="p-2 bg-[#fff7d7] text-[#00132d] rounded text-center hover:bg-[#fff7d7]/70">
                      Profile
                    </a>
                    <a href="/beta" className="p-2 bg-orange-50 text-orange-700 rounded text-center hover:bg-orange-100">
                      Beta
                    </a>
                    <a href="/marketplace" className="p-2 bg-green-50 text-green-700 rounded text-center hover:bg-green-100">
                      Market
                    </a>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Info</h4>
                  <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                    <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
                    <div><strong>Dev Mode:</strong> {devMode ? '✅ Active' : '❌ Inactive'}</div>
                    <div><strong>User:</strong> {user ? `✅ ${user.name}` : '❌ None'}</div>
                    <div><strong>Auth:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• Mock authentication (no server needed)</div>
                    <div>• Beta program with mock data</div>
                    <div>• VUFS wardrobe system with test data</div>
                    <div>• Profile management</div>
                    <div>• Persistent login state</div>
                    <div>• Direct page access (no auth blocking)</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}