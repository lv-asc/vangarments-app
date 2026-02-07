'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
    HeartIcon,
    ShoppingBagIcon,
    TagIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { getImageUrl } from '@/utils/imageUrl';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import ItemsFilter from '@/components/common/ItemsFilter';

interface Condition {
    id: string;
    name: string;
    rating: number;
    group: 'new' | 'used';
    isActive: boolean;
}

interface MarketplaceListing {
    id: string;
    itemCode?: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    condition: {
        status: string;
        description: string;
        label?: string;
    };
    images: string[];
    status: string;
    views: number;
    likes: number;
    category: string;
    brand?: string;
    sellerId: string;
    createdAt: string;
}

interface MarketplaceFilters {
    category?: string;
    brand?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    groupBy?: string;
    [key: string]: string | undefined;
}

export default function MarketplacePageClient() {
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<MarketplaceFilters>({});
    const [showFilters, setShowFilters] = useState(false);
    const [total, setTotal] = useState(0);
    const [likedListings, setLikedListings] = useState<Set<string>>(new Set());
    const [availableConditions, setAvailableConditions] = useState<Condition[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const conditions = await apiClient.getAllConditions();
                setAvailableConditions(conditions);
            } catch (error) {
                console.error('Failed to fetch conditions:', error);
            }
        };
        fetchMetadata();
    }, []);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiClient.getMarketplaceListings({
                ...filters,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                sortBy: filters.sortBy as any,
                search: searchQuery || undefined,
                limit: filters.groupBy ? 1000 : 40,
            });
            setListings(result.data);
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchListings();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchListings]);

    const toggleLike = async (listingId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const result = await apiClient.toggleMarketplaceLike(listingId);
            setLikedListings(prev => {
                const newSet = new Set(prev);
                if (result.liked) {
                    newSet.add(listingId);
                } else {
                    newSet.delete(listingId);
                }
                return newSet;
            });
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    const conditionLabels: Record<string, string> = {
        new: 'New with Tags',
        dswt: 'Deadstock',
        never_used: 'Never Used',
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
    };

    const formatPrice = (price: number, currency: string = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShoppingBagIcon className="h-7 w-7 text-gray-900" />
                            <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
                            <span className="text-sm text-gray-500">({total} items)</span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Sort & Group Controls */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={filters.sortBy || 'newest'}
                                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block p-2.5 font-medium"
                                >
                                    <option value="newest">Sort: Newest</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="most_watched">Most Popular</option>
                                </select>

                                <select
                                    value={filters.groupBy || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                                    className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-gray-900 focus:border-gray-900 block p-2.5 font-medium"
                                >
                                    <option value="">No Grouping</option>
                                    <option value="brand">Brand</option>
                                    <option value="category">Category</option>
                                    <option value="condition">Condition</option>
                                </select>
                            </div>

                            <Link
                                href="/marketplace/sell"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors h-[42px]"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Sell Item
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <ItemsFilter
                filters={filters}
                onChange={setFilters}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                useNameAsValue={true}
                availableFacets={{
                    conditions: availableConditions.map(c => c.id),
                    // Enable other facets if needed, or leave empty to hide them
                    brands: [], // We want brands
                    categories: [], // We want categories (subcategories)
                    departments: [],
                    subcategories: [],
                    apparelTypes: [],
                    colors: [], // Marketplace listings might not have structured color data easily filterable yet?
                    sizes: []   // Same for sizes?
                    // If we pass empty arrays, ItemsFilter might hide them. 
                    // Let's pass undefined for things we want to rely on the hook to fetch, OR
                    // since ItemsFilter fetches its own options, we just need to ENABLE them.
                    // ItemsFilter logic: "if (!available) return true;" -> shows if undefined.
                    // "if available is empty array" -> might hide.
                    // Let's pass undefined for standard facets so ItemsFilter fetches them.
                    // But we MUST pass 'conditions' to enable the condition filter we just added.
                }}
            >
                <div>
                    {/* Active Filters Summary (Optional, ItemsFilter has its own visual cues but maybe we want chips?) */}
                    {/* ItemsFilter Sidebar handles filters. We just render the grid here. */}

                    <div className="py-6">
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="bg-gray-200 rounded-2xl aspect-square mb-3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <ShoppingBagIcon className="h-16 w-16 mb-4 opacity-30" />
                                <p className="text-lg font-medium text-gray-600">No listings found</p>
                                <p className="text-sm text-gray-400 mb-6">Try adjusting your filters or search</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={clearFilters}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
                                    >
                                        Clear filters
                                    </button>
                                    <Link
                                        href="/marketplace/sell"
                                        className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
                                    >
                                        Sell your first item
                                    </Link>
                                </div>
                            </div>
                        ) : filters.groupBy ? (
                            <div className="space-y-12">
                                {Object.entries(
                                    listings.reduce((acc: Record<string, MarketplaceListing[]>, listing) => {
                                        let key = 'Unspecified';
                                        switch (filters.groupBy) {
                                            case 'brand':
                                                key = listing.brand || 'Generic';
                                                break;
                                            case 'category':
                                                key = listing.category || 'Unspecified';
                                                break;
                                            case 'condition':
                                                const cond = availableConditions.find(c => c.id === listing.condition.status);
                                                key = cond?.name || listing.condition.label || listing.condition.status || 'Unspecified';
                                                break;
                                        }
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(listing);
                                        return acc;
                                    }, {})
                                ).sort((a, b) => a[0].localeCompare(b[0])).map(([groupName, groupItems]) => (
                                    <div key={groupName}>
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                            {groupName}
                                            <span className="ml-3 text-sm font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                                {groupItems.length}
                                            </span>
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {groupItems.map((listing) => (
                                                <MarketplaceListingCard
                                                    key={listing.id}
                                                    listing={listing}
                                                    isLiked={likedListings.has(listing.id)}
                                                    onLike={toggleLike}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {listings.map((listing) => (
                                    <MarketplaceListingCard
                                        key={listing.id}
                                        listing={listing}
                                        isLiked={likedListings.has(listing.id)}
                                        onLike={toggleLike}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ItemsFilter>

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
        </div>
    );
}
