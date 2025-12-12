// @ts-nocheck
'use client';

import { useState } from 'react';

import {
  FireIcon,
  SparklesIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

export default function DiscoverPage() {
  const [activeView, setActiveView] = useState<'discovery' | 'feed'>('discovery');

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="py-8">
        {/* View Toggle */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-center space-x-1 bg-white rounded-lg p-1 border border-gray-200 w-fit mx-auto">
            <button
              onClick={() => setActiveView('discovery')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'discovery'
                  ? 'bg-[#00132d] text-[#fff7d7]'
                  : 'text-gray-700 hover:text-[#00132d]'
                }`}
            >
              <FireIcon className="h-4 w-4 inline mr-2" />
              Discover
            </button>
            <button
              onClick={() => setActiveView('feed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'feed'
                  ? 'bg-[#00132d] text-[#fff7d7]'
                  : 'text-gray-700 hover:text-[#00132d]'
                }`}
            >
              <SparklesIcon className="h-4 w-4 inline mr-2" />
              Your Feed
            </button>
          </div>
        </div>

        {/* Content */}
        {activeView === 'discovery' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[#00132d] mb-4">Discover Content</h2>
              <p className="text-gray-600 mb-6">
                Explore fashion content from our community. This feature is currently being developed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#fff7d7] p-6 rounded-lg">
                  <h3 className="font-semibold text-[#00132d] mb-2">Trending Looks</h3>
                  <p className="text-sm text-gray-600">See what's popular in fashion right now</p>
                </div>
                <div className="bg-[#fff7d7] p-6 rounded-lg">
                  <h3 className="font-semibold text-[#00132d] mb-2">Style Categories</h3>
                  <p className="text-sm text-gray-600">Browse by style, occasion, and season</p>
                </div>
                <div className="bg-[#fff7d7] p-6 rounded-lg">
                  <h3 className="font-semibold text-[#00132d] mb-2">Community</h3>
                  <p className="text-sm text-gray-600">Connect with fashion enthusiasts</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-[#00132d] mb-4">Your Personalized Feed</h2>
              <p className="text-gray-600 mb-6">
                Your personalized fashion feed based on your preferences and following. This feature is currently being developed.
              </p>
              <div className="bg-[#fff7d7] p-6 rounded-lg">
                <h3 className="font-semibold text-[#00132d] mb-2">Coming Soon</h3>
                <p className="text-sm text-gray-600">
                  We're working on creating an amazing personalized experience for you!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}