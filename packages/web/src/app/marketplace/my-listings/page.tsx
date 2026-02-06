'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeftIcon,
    PlusIcon,
    EyeIcon,
    HeartIcon,
    PencilIcon,
    TrashIcon,
    TagIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getImageUrl } from '@/utils/imageUrl';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { toast } from 'react-hot-toast';

interface MyListing {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    images: string[];
    views: number;
    likes: number;
    createdAt: string;
}

export default function MyListingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: authLoading } = useAuth();
    const [listings, setListings] = useState<MyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'draft'>('all');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (searchParams.get('success') === '1') {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchListings = async () => {
            try {
                const status = filter === 'all' ? undefined : filter;
                const data = await apiClient.getMyMarketplaceListings(status);
                setListings(data);
            } catch (error) {
                console.error('Failed to fetch listings:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchListings();
        }
    }, [user, authLoading, router, filter]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        try {
            await apiClient.deleteMarketplaceListing(id);
            setListings(listings.filter(l => l.id !== id));
        } catch (error) {
            console.error('Failed to delete listing:', error);
            toast.error('Failed to delete listing');
        }
    };

    const formatPrice = (price: number, currency: string = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        sold: 'bg-blue-100 text-blue-700',
        draft: 'bg-gray-100 text-gray-600',
        expired: 'bg-red-100 text-red-700',
        reserved: 'bg-yellow-100 text-yellow-700'
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slideIn">
                    <CheckCircleIcon className="h-5 w-5" />
                    Listing published successfully!
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <ArrowLeftIcon className="h-5 w-5" />
                            </button>
                            <h1 className="text-xl font-bold">My Listings</h1>
                        </div>
                        <Link
                            href="/marketplace/sell"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800"
                        >
                            <PlusIcon className="h-4 w-4" />
                            New Listing
                        </Link>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="max-w-4xl mx-auto px-4 pb-3">
                    <div className="flex gap-2">
                        {(['all', 'active', 'sold', 'draft'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f);
                                    setLoading(true);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Listings */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-gray-200 rounded w-1/2" />
                                        <div className="h-6 bg-gray-200 rounded w-1/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-12">
                        <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600 mb-2">No listings yet</p>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all'
                                ? 'Start selling items from your wardrobe'
                                : `No ${filter} listings`}
                        </p>
                        <Link
                            href="/marketplace/sell"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Create your first listing
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {listings.map((listing) => (
                            <MarketplaceListingCard
                                key={listing.id}
                                listing={{
                                    ...listing,
                                    condition: { status: listing.status === 'sold' ? 'sold' : 'excellent' } // Simplified for MyListings
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
