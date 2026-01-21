'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { brandApi } from '../../lib/brandApi';
import { getImageUrl } from '../../lib/utils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import EntityFilterBar from '../../components/ui/EntityFilterBar';

const MotionDiv = motion.div as any;

// Helper for slugs (fallback)
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/[®™©]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export default function StoresDirectoryPage() {
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({
        verificationStatus: '',
        partnershipTier: '',
        country: ''
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load stores
    useEffect(() => {
        loadStores();
    }, [debouncedSearch, filters]);

    const loadStores = async () => {
        try {
            setLoading(true);
            const data = await brandApi.getBrands({
                search: debouncedSearch,
                businessType: 'store',
                verificationStatus: filters.verificationStatus,
                partnershipTier: filters.partnershipTier,
                country: filters.country,
                limit: 50
            });

            setStores(data);
        } catch (error) {
            console.error('Failed to load stores', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                        Discover Stores
                    </h1>
                    <p className="max-w-xl mx-auto text-xl text-gray-500 mb-8">
                        Explore boutiques, resellers, and vintage shops on Vangarments.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stores..."
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-shadow hover:shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <EntityFilterBar
                filters={filters}
                onFilterChange={setFilters}
                showTier={true}
                showCountry={true}
            />

            {/* Stores Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : stores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {stores.map((store) => (
                            <StoreCard key={store.id} store={store} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-medium text-gray-900">No stores found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your search terms.</p>
                    </div>
                )}
            </div>

            {/* CTA for Stores */}
            <div className="bg-gray-900 text-white py-12 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Are you a store owner?</h2>
                    <p className="text-gray-300 mb-6">Join Vangarments and showcase your curated collection.</p>
                    <Link href="/stores/dashboard" className="inline-block bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StoreCard({ store }: { store: any }) {
    const info = store.brandInfo || {};
    // Use saved slug or compute it
    const slug = info.slug || slugify(info.name || '') || store.id;

    // Use first banner if available, or 'banner' field
    const bannerUrl = (info.banners && info.banners.length > 0)
        ? (typeof info.banners[0] === 'string' ? info.banners[0] : info.banners[0].url)
        : info.banner;

    return (
        <Link href={`/stores/${slug}`} className="group block h-full">
            <MotionDiv
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-gray-100 flex flex-col"
            >
                {/* Banner Header */}
                <div className="h-32 bg-gray-200 relative">
                    {bannerUrl ? (
                        <img
                            src={getImageUrl(bannerUrl)}
                            alt={`${info.name} banner`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400 transition-colors" />
                    )}

                    {/* Logo Overlay */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md border border-gray-100">
                            {info.logo ? (
                                <img
                                    src={getImageUrl(info.logo)}
                                    alt={`${info.name} logo`}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-gray-400">
                                    {info.name ? info.name.charAt(0) : '?'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-10 pb-6 px-4 text-center flex-1 flex flex-col">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {info.name}
                        </h3>
                        {store.verificationStatus === 'verified' && (
                            <VerifiedBadge size="sm" />
                        )}
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                        {info.description || 'No description available'}
                    </p>

                    <div className="text-xs text-gray-400 flex items-center justify-center gap-4 border-t border-gray-50 pt-3 mt-auto">
                        <span>{store.analytics?.totalCatalogItems || 0} Items</span>
                        <span>•</span>
                        <span>{info.country || 'Global'}</span>
                    </div>
                </div>
            </MotionDiv>
        </Link>
    );
}
