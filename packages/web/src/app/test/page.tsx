'use client';

import { Header } from '@/components/layout/Header';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-[#fff7d7]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-[#00132d] mb-4">
            🎉 Navigation Test Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            If you can see this page, navigation is working correctly.
          </p>
          
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="font-semibold text-green-800 mb-2">✅ What's Working</h2>
              <p className="text-green-700 text-sm">
                You successfully navigated to this test page, which means routing is functional.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Link
                href="/"
                className="navigation-link bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg hover:bg-[#00132d]/90 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                ← Back to Home
              </Link>
              
              <Link
                href="/debug"
                className="navigation-link bg-[#fff7d7] text-[#00132d] border border-[#00132d]/20 px-4 py-2 rounded-lg hover:bg-[#fff7d7]/70 transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                Debug Page →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}