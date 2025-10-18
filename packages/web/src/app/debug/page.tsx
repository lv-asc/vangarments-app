'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthWrapper';
import { NavigationTest } from '@/components/debug/NavigationTest';
import Link from 'next/link';

export default function DebugPage() {
  const [mounted, setMounted] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
    const isDev = localStorage.getItem('devMode') === 'true';
    setDevMode(isDev);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const pages = [
    { name: 'Test Page', href: '/test' },
    { name: 'Simple Wardrobe', href: '/wardrobe-simple' },
    { name: 'Simple Profile', href: '/profile-simple' },
    { name: 'Home', href: '/' },
    { name: 'Discover', href: '/discover' },
    { name: 'Wardrobe (Full)', href: '/wardrobe' },
    { name: 'Outfits', href: '/outfits' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Advertising', href: '/advertising' },
    { name: 'Beta', href: '/beta' },
    { name: 'Profile (Full)', href: '/profile' },
    { name: 'Login', href: '/login' },
    { name: 'Register', href: '/register' },
  ];

  return (
    <div className="min-h-screen bg-[#fff7d7]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#00132d] mb-8">Debug Information</h1>
        
        {/* System Status */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-[#00132d]/20">
          <h2 className="text-xl font-semibold text-[#00132d] mb-4">System Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Development Mode:</strong> {devMode ? '✅ Enabled' : '❌ Disabled'}
            </div>
            <div>
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
            <div>
              <strong>Auth Loading:</strong> {isLoading ? '⏳ Loading' : '✅ Ready'}
            </div>
            <div>
              <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>User:</strong> {user ? `✅ ${user.name} (${user.email})` : '❌ None'}
            </div>
            <div>
              <strong>Mounted:</strong> {mounted ? '✅ Yes' : '❌ No'}
            </div>
          </div>
        </div>

        {/* Navigation Diagnostic */}
        <NavigationTest />

        {/* Navigation Test */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-[#00132d]/20">
          <h2 className="text-xl font-semibold text-[#00132d] mb-4">Navigation Test</h2>
          <p className="text-gray-600 mb-4">Click on any page below to test navigation:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pages.map((page) => (
              <div key={page.href} className="relative">
                <Link
                  href={page.href}
                  className="navigation-link block p-3 bg-[#fff7d7] border border-[#00132d]/20 rounded-lg text-center text-[#00132d] hover:bg-[#fff7d7]/70 transition-all duration-200 hover:shadow-md hover:scale-105"
                >
                  {page.name}
                </Link>
                <button
                  onClick={() => {
                    console.log(`Attempting to navigate to: ${page.href}`);
                    window.location.href = page.href;
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-[#00132d] text-[#fff7d7] rounded-full text-xs hover:bg-[#00132d]/80 transition-colors"
                  title="Force navigate"
                >
                  →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Local Storage Debug */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-[#00132d]/20">
          <h2 className="text-xl font-semibold text-[#00132d] mb-4">Local Storage</h2>
          <div className="text-sm space-y-2">
            <div><strong>devMode:</strong> {localStorage.getItem('devMode')}</div>
            <div><strong>language:</strong> {localStorage.getItem('language')}</div>
            <div><strong>mockUser:</strong> {localStorage.getItem('mockUser')}</div>
            <div><strong>token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not found'}</div>
          </div>
        </div>

        {/* Console Test */}
        <div className="bg-white rounded-lg p-6 border border-[#00132d]/20">
          <h2 className="text-xl font-semibold text-[#00132d] mb-4">Console Test</h2>
          <p className="text-gray-600 mb-4">Check your browser console for any errors. Click the button below to test console logging:</p>
          <button
            onClick={() => {
              console.log('🔧 Debug Test:', {
                devMode,
                user,
                isAuthenticated,
                isLoading,
                mounted,
                localStorage: {
                  devMode: localStorage.getItem('devMode'),
                  language: localStorage.getItem('language'),
                  mockUser: localStorage.getItem('mockUser'),
                }
              });
              alert('Debug info logged to console. Check your browser developer tools.');
            }}
            className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90 transition-colors"
          >
            Log Debug Info to Console
          </button>
        </div>

        {/* Error Information */}
        <div className="bg-white rounded-lg p-6 border border-[#00132d]/20">
          <h2 className="text-xl font-semibold text-[#00132d] mb-4">Common Issues & Solutions</h2>
          <div className="space-y-4 text-sm">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ "Element type is invalid" Error</h3>
              <p className="text-red-700">This usually means a component import is broken. I've fixed the discover page by simplifying it.</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Navigation Not Working</h3>
              <p className="text-yellow-700">Try refreshing the page (Ctrl+F5) or clearing browser cache.</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ What Should Work Now</h3>
              <p className="text-green-700">The discover page should load without errors. Other pages might still have issues.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}