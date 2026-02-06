'use client';

import { useState, useEffect } from 'react';
import { useProfile } from './ProfileLayoutClient';
import Link from 'next/link';
import { LockClosedIcon, Squares2X2Icon, TagIcon } from '@heroicons/react/24/outline';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { apiClient } from '@/lib/api';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { Switch } from '@/components/ui/Switch';
import { useRouter } from 'next/navigation';
import { useContent, MotionFeed, FeedGallery } from '@/components/content';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

export default function PublicUserProfilePage() {
    const { profile, loading, canViewSection, followStatus } = useProfile();
    const { addVisit } = useRecentVisits();
    const router = useRouter();
    const [wardrobeItems, setWardrobeItems] = useState<any[]>([]);
    const [loadingWardrobe, setLoadingWardrobe] = useState(false);

    // Initialize from localStorage, default to false (show No BG) - Synced with WardrobeManagement
    const [showOriginalBackgrounds, setShowOriginalBackgrounds] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wardrobe-show-original-bg');
            return saved === 'true';
        }
        return false;
    });

    // Sync to localStorage when changed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('wardrobe-show-original-bg', String(showOriginalBackgrounds));
        }
    }, [showOriginalBackgrounds]);

    useEffect(() => {
        if (profile) {
            addVisit({
                id: profile.id,
                name: profile.name,
                logo: profile.profileImage,
                businessType: 'user',
                type: 'user',
                username: profile.username,
                verificationStatus: profile.verificationStatus
            });

            if (canViewSection('wardrobe')) {
                fetchWardrobePreview();
            }
        }
    }, [profile?.id]);

    const fetchWardrobePreview = async () => {
        if (!profile) return;
        setLoadingWardrobe(true);
        try {
            const res = await apiClient.getPublicWardrobeItems(profile.username, { limit: 4 });
            setWardrobeItems(res.items || []);
        } catch (error) {
            console.error('Failed to fetch wardrobe preview', error);
        } finally {
            setLoadingWardrobe(false);
        }
    };

    if (loading || !profile) {
        return null; // Layout handles loading/error
    }

    const [activeMainTab, setActiveMainTab] = useState<'wardrobe' | 'feed' | 'motion' | 'listings'>('wardrobe');
    const { fetchFeed, feedPosts, feedLoading } = useContent();
    const [listings, setListings] = useState<any[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);

    useEffect(() => {
        if (profile?.id && (activeMainTab === 'feed' || activeMainTab === 'motion')) {
            fetchFeed(activeMainTab === 'motion' ? 'motion' : 'feed', true, profile.id);
        }
        if (profile?.id && activeMainTab === 'listings') {
            fetchListings();
        }
    }, [activeMainTab, profile?.id, fetchFeed]);

    const fetchListings = async () => {
        if (!profile) return;
        setLoadingListings(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketplace/seller/${profile.id}`);
            const data = await res.json();
            setListings(data.data?.listings || []);
        } catch (error) {
            console.error('Failed to fetch listings', error);
        } finally {
            setLoadingListings(false);
        }
    };

    const isPrivateAndNotFollowed = profile.privacySettings?.isPrivate &&
        (!followStatus.isFollowing || followStatus.status !== 'accepted');

    // If account is private, show the private account wall if not followed
    if (isPrivateAndNotFollowed) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockClosedIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">This profile is private</h2>
                    <p className="text-gray-500 mb-6">
                        Follow this user to see their photos, items and updates.
                    </p>
                    {followStatus.isFollowing && followStatus.status === 'pending' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            Request Pending
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const profilePosts = feedPosts.filter(p =>
        p.userId === profile.id &&
        (activeMainTab === 'feed' ? p.contentType === 'feed' : p.contentType === 'motion')
    );

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href={`/u/${profile.username}/followers`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#00132d] transition-colors block">
                    <div className="text-2xl font-bold text-[#00132d] mb-1">{profile.stats.followers}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                </Link>
                <Link href={`/u/${profile.username}/following`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#00132d] transition-colors block">
                    <div className="text-2xl font-bold text-[#00132d] mb-1">{profile.stats.following}</div>
                    <div className="text-sm text-gray-600">Following</div>
                </Link>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveMainTab('wardrobe')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeMainTab === 'wardrobe' ? 'border-[#00132d] text-[#00132d]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Wardrobe
                        </button>
                        <button
                            onClick={() => setActiveMainTab('feed')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeMainTab === 'feed' ? 'border-[#00132d] text-[#00132d]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Feed
                        </button>
                        <button
                            onClick={() => setActiveMainTab('motion')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeMainTab === 'motion' ? 'border-[#00132d] text-[#00132d]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Motion
                        </button>
                        <button
                            onClick={() => setActiveMainTab('listings')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeMainTab === 'listings' ? 'border-[#00132d] text-[#00132d]' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Listings
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeMainTab === 'wardrobe' ? (
                        <>
                            {/* Wardrobe Header with See All */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Squares2X2Icon className="h-5 w-5 text-gray-400" />
                                        Public Items
                                    </h3>
                                    {/* Switch Control */}
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <span className={`text-[10px] font-bold transition-colors ${showOriginalBackgrounds ? 'text-gray-900' : 'text-gray-400'}`}>Original</span>
                                        <Switch
                                            checked={!showOriginalBackgrounds}
                                            onCheckedChange={(checked) => setShowOriginalBackgrounds(!checked)}
                                            className="scale-75"
                                        />
                                        <span className={`text-[10px] font-bold transition-colors ${!showOriginalBackgrounds ? 'text-indigo-600' : 'text-gray-400'}`}>No BG</span>
                                    </div>
                                </div>
                                {wardrobeItems.length > 0 && (
                                    <Link
                                        href={`/u/${profile.username}/wardrobe`}
                                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                    >
                                        See All
                                    </Link>
                                )}
                            </div>

                            {loadingWardrobe ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="animate-pulse bg-gray-50 rounded-xl aspect-[3/4] border border-gray-100" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {wardrobeItems.length > 0 ? (
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            {wardrobeItems.map(item => {
                                                const isProcessed = (img: any) => img.type === 'background_removed' || img.imageType === 'background_removed';
                                                const sortedImages = [...(item.images || [])].sort((a: any, b: any) =>
                                                    (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
                                                );
                                                const originalImages = sortedImages.filter((img: any) => !isProcessed(img));
                                                const cardImages = originalImages.map(orig => {
                                                    const noBgVersion = sortedImages.find((img: any) =>
                                                        isProcessed(img) &&
                                                        (img.aiAnalysis?.originalImageId === orig.id || img.originalImageId === orig.id)
                                                    );
                                                    return noBgVersion || orig;
                                                });
                                                const cardItem = { ...item, images: cardImages };
                                                return (
                                                    <WardrobeItemCard
                                                        key={item.id}
                                                        item={cardItem}
                                                        onToggleFavorite={() => { }}
                                                        onToggleForSale={() => { }}
                                                        onView={() => router.push(`/u/${profile.username}/wardrobe/${item.vufsCode}`)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                                            <p className="text-gray-500">No public items found.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : activeMainTab === 'feed' ? (
                        <FeedGallery posts={profilePosts} />
                    ) : activeMainTab === 'motion' ? (
                        <div className="h-[600px] rounded-xl overflow-hidden bg-black">
                            <MotionFeed posts={profilePosts} />
                        </div>
                    ) : activeMainTab === 'listings' ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <TagIcon className="h-5 w-5 text-gray-400" />
                                    For Sale
                                </h3>
                            </div>

                            {loadingListings ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="animate-pulse bg-gray-50 rounded-xl aspect-[3/4] border border-gray-100" />
                                    ))}
                                </div>
                            ) : listings.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {listings.map(listing => (
                                        <MarketplaceListingCard
                                            key={listing.id}
                                            listing={{
                                                id: listing.id,
                                                title: listing.title,
                                                price: listing.price,
                                                currency: listing.currency || 'BRL',
                                                images: listing.images || [],
                                                condition: listing.condition || { status: 'good' },
                                                likes: listing.likes || 0,
                                                views: listing.views || 0,
                                                brand: listing.brand
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                                    <TagIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No items for sale.</p>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
