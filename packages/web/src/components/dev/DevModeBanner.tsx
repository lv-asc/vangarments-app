// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DevModeBanner() {
  const [devMode, setDevMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDev = localStorage.getItem('devMode') === 'true';
    setDevMode(isDev);

    const handleDevModeChange = (event: CustomEvent) => {
      setDevMode(event.detail.enabled);
    };

    window.addEventListener('devModeChange' as any, handleDevModeChange);

    return () => {
      window.removeEventListener('devModeChange' as any, handleDevModeChange);
    };
  }, []);

  // Disable development mode banner completely
  return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg"
      >
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Development Mode Active - Mock Authentication & Data Enabled</span>
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}