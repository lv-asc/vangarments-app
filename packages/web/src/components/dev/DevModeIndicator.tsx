// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DevModeIndicator() {
  const [devMode, setDevMode] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const checkDevMode = () => {
      const isDev = localStorage.getItem('devMode') === 'true';
      setDevMode(isDev);
      setShowIndicator(isDev);
    };

    checkDevMode();

    // Listen for dev mode changes
    const handleStorageChange = () => checkDevMode();
    const handleDevModeChange = () => checkDevMode();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('devModeChange', handleDevModeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('devModeChange', handleDevModeChange);
    };
  }, []);

  // Disable development mode indicator completely
  return null;

  return (
    <AnimatePresence>
      {devMode && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Development Mode Active</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}