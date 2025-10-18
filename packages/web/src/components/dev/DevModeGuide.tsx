'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DevModeGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const hasSeenBefore = localStorage.getItem('hasSeenDevGuide') === 'true';
    const devMode = localStorage.getItem('devMode') === 'true';
    
    setHasSeenGuide(hasSeenBefore);
    
    // Show guide if user hasn't seen it and dev mode is not enabled
    if (!hasSeenBefore && !devMode) {
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 2000); // Show after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem('hasSeenDevGuide', 'true');
    setHasSeenGuide(true);
  };

  const enableDevMode = () => {
    localStorage.setItem('devMode', 'true');
    window.dispatchEvent(new CustomEvent('devModeChange', { 
      detail: { enabled: true } 
    }));
    dismissGuide();
  };

  // Don't show if in production or user has seen it
  if (process.env.NODE_ENV === 'production' || hasSeenGuide) {
    return null;
  }

  return (
    <AnimatePresence>
      {showGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={dismissGuide}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">

              <h2 className="text-2xl font-bold text-[#00132d] mb-2">
                Welcome to Vangarments!
              </h2>
              <p className="text-[#00132d]/70">
                You're in development mode. Enable the dev tools to test all features without a backend server.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium text-[#00132d]">Enable Development Mode</div>
                  <div className="text-sm text-[#00132d]/70">
                    Click the button below or use the DEV button in the bottom-right corner
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium text-[#00132d]">Quick Login</div>
                  <div className="text-sm text-[#00132d]/70">
                    Use the dev panel to instantly login as different user types
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-[#fff7d7] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#00132d] text-sm font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium text-[#00132d]">Test Beta Features</div>
                  <div className="text-sm text-[#00132d]/70">
                    Login as a beta user and explore /beta for full functionality
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={dismissGuide}
                className="flex-1 px-4 py-2 border border-[#00132d]/20 rounded-lg text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={enableDevMode}
                className="flex-1 px-4 py-2 bg-[#00132d] text-[#fff7d7] rounded-lg hover:bg-[#00132d]/90 transition-colors font-medium"
              >
                Enable Dev Mode
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-[#00132d]/50">
                This guide only appears in development mode
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}