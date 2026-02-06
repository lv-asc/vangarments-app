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
    };
    images: string[];
    status: string;
    views: number;
    likes: number;
    category: string;
    sellerId: string;
    createdAt: string;
}

interface MarketplaceFilters {
    category?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
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

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const result = await apiClient.getMarketplaceListings({
                ...filters,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                sortBy: filters.sortBy as any,
                search: searchQuery || undefined,
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

                        <Link
                            href="/marketplace/sell"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Sell Item
                        </Link>
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
                    conditions: ['new', 'dswt', 'never_used', 'excellent', 'good', 'fair', 'poor'],
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
