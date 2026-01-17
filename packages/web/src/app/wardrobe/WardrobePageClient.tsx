// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ArchiveBoxIcon, ClockIcon } from '@heroicons/react/24/outline';
import WardrobeManagement from '@/components/wardrobe/WardrobeManagement';
import AnteroomSection from '@/components/wardrobe/AnteroomSection';
import { AnteroomAPI } from '@/lib/anteroomApi';

type TabType = 'wardrobe' | 'anteroom';

export default function WardrobePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('wardrobe');
  const [anteroomCount, setAnteroomCount] = useState(0);

  // Fetch anteroom count for badge
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await AnteroomAPI.getItemCount();
        setAnteroomCount(result.current);
      } catch (error) {
        console.error('Failed to fetch anteroom count:', error);
      }
    };
    fetchCount();
  }, [activeTab]);

  // Handle item completion (move from anteroom to wardrobe)
  const handleItemComplete = () => {
    setAnteroomCount(prev => Math.max(0, prev - 1));
  };

  const tabs = [
    {
      id: 'wardrobe' as TabType,
      label: 'Wardrobe',
      icon: ArchiveBoxIcon,
      badge: null,
    },
    {
      id: 'anteroom' as TabType,
      label: 'Anteroom',
      icon: ClockIcon,
      badge: anteroomCount > 0 ? anteroomCount : null,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'wardrobe'
                ? 'Manage all your wardrobe items.'
                : 'Complete item details before adding to wardrobe.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon
                className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              {tab.label}
              {tab.badge && (
                <span
                  className={`
                    ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                    ${activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'wardrobe' ? (
        <WardrobeManagement />
      ) : (
        <AnteroomSection onItemComplete={handleItemComplete} />
      )}
    </div>
  );
}
