// @ts-nocheck
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthWrapper';
import { LandingPage } from '@/components/landing/LandingPage';
import { MainFeed } from '@/components/content';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] w-full">
        <div className="flex flex-col items-center gap-4">
          {/* Logo Animation or Branded Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-[#00132d]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#00132d] border-t-transparent rounded-full animate-spin"></div>
          </div>
          {/* Optional: <p className="text-[#00132d]/60 font-medium text-sm animate-pulse">Loading...</p> */}
        </div>
      </div>
    );
  }

  if (user) {
    return <MainFeed />;
  }

  return <LandingPage />;
}