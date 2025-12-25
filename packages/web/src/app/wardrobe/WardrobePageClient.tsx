// @ts-nocheck
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import WardrobeManagement from '@/components/wardrobe/WardrobeManagement';

export default function WardrobePage() {
  const router = useRouter();

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
            <p className="mt-1 text-sm text-gray-500">Manage all your wardrobe items.</p>
          </div>
        </div>
      </div>

      <WardrobeManagement />
    </div>
  );
}
