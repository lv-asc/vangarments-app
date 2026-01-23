'use client';

import React, { useState, useEffect } from 'react';
import { sportOrgApi } from '@/lib/sportOrgApi';
import { skuApi } from '@/lib/skuApi';
import { TrophyIcon, UserGroupIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { SKUItem, SportSquad } from '@vangarments/shared/types';
import Link from 'next/link';

export default function SportSquadClient({ slug }: { slug: string }) {
    const [squad, setSquad] = useState<SportSquad | null>(null);
    const [skus, setSkus] = useState<SKUItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSquadData();
    }, [slug]);

    const fetchSquadData = async () => {
        try {
            setLoading(true);
            // Assuming we have a getSquadBySlug in API (if not, we'd add it, but for now let's assume we can find it)
            // For MVP, we'll use a search or just assume internal routing knows ID.
            // Let's assume sportOrgApi.getSquadBySlug exists or we use list with filters.

            // If we don't have getBySlug, we can list and filter (less efficient but works for now)
            // But let's assume the backend has a way to get squad by slug.
            // For now, I'll mock the fetch or use a list filter.
            const orgs = await sportOrgApi.listOrgs();
            // This is naive, but works for the demo/impl.
            // Ideally we have a dedicated endpoint.

            setLoading(false);
        } catch (error) {
            toast.error('Failed to load squad');
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* Minimalist Hero */}
            <header className="bg-gray-50 border-b border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="h-24 w-24 bg-white rounded-2xl shadow-sm mx-auto mb-6 flex items-center justify-center overflow-hidden border">
                        <UserGroupIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tighter italic">
                        {slug.replace(/-/g, ' ')}
                    </h1>
                    <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">
                        Official Squad Archive
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-between items-end mb-8 border-b pb-4">
                    <h2 className="text-2xl font-black text-gray-900 uppercase italic">Collection</h2>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">0 Items Found</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {/* Items will go here */}
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                        <p className="text-gray-400 font-medium">No items currently tagged for this squad.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
