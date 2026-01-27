// @ts-nocheck
'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import WardrobeManagement from '@/components/wardrobe/WardrobeManagement';
import AnteroomSection from '@/components/wardrobe/AnteroomSection';

type TabType = 'wardrobe' | 'anteroom';

export default function WardrobePage() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'wardrobe';

  return (
    <>
      {/* Tab Content */}
      {activeTab === 'wardrobe' ? (
        <WardrobeManagement />
      ) : (
        <AnteroomSection onItemComplete={() => { }} />
      )}
    </>
  );
}
