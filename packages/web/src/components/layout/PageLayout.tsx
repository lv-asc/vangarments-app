// @ts-nocheck
'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

export function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
  maxWidth = '7xl',
  className = '',
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header />}

      <main className={`flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full ${maxWidthClasses[maxWidth]} ${className}`}>
        {children}
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

