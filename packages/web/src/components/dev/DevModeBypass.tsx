// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';

interface DevModeBypassProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function DevModeBypass({ children, fallback }: DevModeBypassProps) {
  const [mounted, setMounted] = useState(false);
  const [devMode, setDevMode] = useState(false);

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

  // Always render children in development mode or when not mounted yet
  if (!mounted || devMode || process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }

  // In production mode without dev mode, render fallback or children
  return <>{fallback || children}</>;
}