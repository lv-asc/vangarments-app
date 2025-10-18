'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthWrapper';

export function DevIndicator() {
  const [devMode, setDevMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setDevMode(true);
    }
  }, []);

  if (!devMode) return null;

  return (
    <div className="fixed top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-50">
      DEV MODE: {user ? `${user.name} (@${user.username || user.email?.split('@')[0]})` : 'No User'}
    </div>
  );
}