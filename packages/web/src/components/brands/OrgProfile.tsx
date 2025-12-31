'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BrandFullProfile,
    BrandTeamMember,
    BrandLookbook,
    BrandCollection,
    BrandProfileData
} from '@/lib/brandApi';
import { useAuth } from '@/contexts/AuthContext';
import { FollowEntityButton } from '@/components/social/FollowEntityButton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { SocialIcon } from '@/components/ui/social-icons';
import {
    ChatBubbleLeftIcon,
    ShoppingBagIcon,
    UsersIcon,
    UserGroupIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

// Helper to resolve image URLs
const getImageUrl = (url: string | undefined | null) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/api')) return url;

    let path = url.startsWith('/') ? url.substring(1) : url;
    if (path.startsWith('storage/')) {
        path = path.substring('storage/'.length);
    }
    return `/api/storage/${path}`;
};

interface OrgProfileProps {
    profile: BrandFullProfile;
    slug: string;
    orgTypeLabel?: string; // e.g. "Non-Profit", "Brand", "Store"
}

export default function OrgProfile({ profile, slug, orgTypeLabel }: OrgProfileProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'lookbooks' | 'collections' | 'items' | 'followers'>('overview');
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    const { brand, team, lookbooks, collections, followerCount } = profile;
    const brandInfo = brand.brandInfo;
    const profileData = brand.profileData || {} as BrandProfileData;
    const businessType = brandInfo.businessType || 'brand';

    // Determine default label if not provided
    const displayTypeLabel = orgTypeLabel || (
        businessType === 'non_profit' ? 'Non-Profit' :
            businessType === 'store' ? 'Store' :
                businessType === 'designer' ? 'Designer' :
                    businessType === 'manufacturer' ? 'Manufacturer' : 'Brand'
    );

    // Resolve banners
    const banners = React.useMemo(() => {
        const rawBanners = brandInfo.banners || [];
        const singleBanner = brandInfo.banner;

        if (rawBanners.length > 0) {
            return rawBanners.map(b => {
                if (typeof b === 'string') return { url: b, positionY: 50 };
                return { url: b.url, positionY: b.positionY ?? 50 };
            });
        }

        if (singleBanner) {
            return [{ url: singleBanner, positionY: 50 }];
        }

        return [];
    }, [brandInfo]);

    // Banner Slideshow
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const currentBanner = banners[currentBannerIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative">
                {/* Banner */}
                {currentBanner ? (
                    <div className="relative h-48 md:h-64 bg-gray-900 overflow-hidden">
                        <div
                            key={currentBanner.url}
                            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                            style={{
                                backgroundImage: `url(${getImageUrl(currentBanner.url)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: `center ${currentBanner.positionY}%`
                            }}
                        />
                        {banners.length > 1 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                {banners.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentBannerIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentBannerIndex
                                            ? 'bg-white w-4'
                                            : 'bg-white/50 hover:bg-white/80'
                                            }`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-48 md:h-64 bg-gradient-to-r from-gray-800 to-gray-900" />
                )}
            </div>

            {/* Info Overlay */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-20 sm:-mt-24">
                    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gray-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                    {brandInfo.logo ? (
                                        <img src={getImageUrl(brandInfo.logo)} alt={brandInfo.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-4xl font-bold text-gray-400">{brandInfo.name.charAt(0)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="relative inline-flex">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{brandInfo.name}</h1>
                                        {brand.verificationStatus === 'verified' && (
                                            <div className="absolute -right-6 -top-1">
                                                <VerifiedBadge size="md" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-4 ${brand.partnershipTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                        brand.partnershipTier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {displayTypeLabel}
                                    </span>
                                    {user ? (
                                        <div className="flex items-center gap-2">
                                            {team.some(member => member.userId === user.id) && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    Team Member
                                                </span>
                                            )}
                                            <FollowEntityButton
                                                entityType={businessType === 'store' ? 'store' : 'brand'}
                                                entityId={brand.id}
                                                size="sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    // Route to entity DM
                                                    // For entities, we use the brand ID or slug if conversation already exists
                                                    // but startConversation works with usernames. 
                                                    // For now, consistent with how UserProfileLayout does it or use entity path.
                                                    router.push(`/messages/${brand.id}`);
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                            >
                                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                                Message
                                            </button>
                                        </div>
                                    ) : (
                                        <a
                                            href="/login"
                                            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                                        >
                                            Follow
                                        </a>
                                    )}
                                </div>

                                {/* Bio */}
                                <p className="text-gray-600 mb-4 max-w-2xl">
                                    {profileData.bio || brandInfo.description || `No description available for this ${displayTypeLabel.toLowerCase()}.`}
                                </p>

                                {/* Meta Info */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    {profileData.foundedDate && (
                                        <span className="flex items-center gap-1">
                                            <span>📅</span>
                                            <span>Founded {new Date(profileData.foundedDate).getFullYear()}</span>
                                        </span>
                                    )}
                                    {profileData.foundedBy && (
                                        <span className="flex items-center gap-1">
                                            <span>👤</span>
                                            <span>by {profileData.foundedBy}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Social Links */}
                                {(() => {
                                    const rawLinks = (profileData.socialLinks && profileData.socialLinks.length > 0)
                                        ? profileData.socialLinks
                                        : (brandInfo.socialLinks || []);

                                    const displayLinks = [...rawLinks];
                                    if (brandInfo.website && !displayLinks.some(l => l.platform === 'website')) {
                                        displayLinks.unshift({ platform: 'website' as any, url: brandInfo.website });
                                    }

                                    if (displayLinks.length === 0) return null;

                                    return (
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {displayLinks.map((link, idx) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-100 hover:border-gray-200"
                                                >
                                                    <SocialIcon platform={link.platform} url={link.url} size="sm" />
                                                    <span>{link.platform}</span>
                                                </a>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Stats */}
                            <div className="flex md:flex-col gap-6 md:gap-4 text-center md:text-right">
                                <button onClick={() => setActiveTab('followers')} className="group text-center md:text-right">
                                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-2xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                        <UsersIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                        {followerCount || 0}
                                    </div>
                                    <div className="text-sm text-gray-500">Followers</div>
                                </button>
                                <button onClick={() => setActiveTab('items')} className="group text-center md:text-right">
                                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-2xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                        <ShoppingBagIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                        {brand.analytics.totalCatalogItems}
                                    </div>
                                    <div className="text-sm text-gray-500">Items</div>
                                </button>
                                <button onClick={() => setActiveTab('team')} className="group text-center md:text-right">
                                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-2xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                        <UserGroupIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                        {team.length}
                                    </div>
                                    <div className="text-sm text-gray-500">Team</div>
                                </button>
                                <button onClick={() => setActiveTab('collections')} className="group text-center md:text-right">
                                    <div className="flex items-center md:justify-end gap-1.5 font-bold text-2xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                        <Squares2X2Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                        {collections.length}
                                    </div>
                                    <div className="text-sm text-gray-500">Collections</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-8" aria-label="Tabs">
                        {(['overview', 'items', 'followers', 'team', 'lookbooks', 'collections'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {tab === 'followers' && <span className="ml-2 text-gray-400">({followerCount || 0})</span>}
                                {tab === 'items' && <span className="ml-2 text-gray-400">({brand.analytics.totalCatalogItems})</span>}
                                {tab === 'team' && <span className="ml-2 text-gray-400">({team.length})</span>}
                                {tab === 'lookbooks' && <span className="ml-2 text-gray-400">({lookbooks.length})</span>}
                                {tab === 'collections' && <span className="ml-2 text-gray-400">({collections.length})</span>}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="py-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Assets */}
                            {profileData.additionalLogos && profileData.additionalLogos.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Assets</h2>
                                    <div className="flex flex-wrap gap-4">
                                        {profileData.additionalLogos.map((logoUrl, index) => {
                                            const meta = profileData.logoMetadata?.find(m => m.url === logoUrl);
                                            return (
                                                <div key={index} className="flex flex-col gap-2 items-center group">
                                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-transparent group-hover:border-gray-200 transition-colors">
                                                        <img
                                                            src={getImageUrl(logoUrl)}
                                                            alt={meta?.name || `Logo ${index + 1}`}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                    {meta?.name && (
                                                        <span className="text-xs text-gray-500 font-medium">{meta.name}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Team Preview */}
                            {team.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900">Team</h2>
                                        <button onClick={() => setActiveTab('team')} className="text-blue-600 hover:underline text-sm">
                                            View all →
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {team.slice(0, 6).map((member) => (
                                            <TeamMemberCard key={member.id} member={member} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Lookbooks Preview */}
                            {lookbooks.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900">Lookbooks</h2>
                                        <button onClick={() => setActiveTab('lookbooks')} className="text-blue-600 hover:underline text-sm">
                                            View all →
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {lookbooks.slice(0, 3).map((lookbook) => (
                                            <LookbookCard key={lookbook.id} lookbook={lookbook} slug={slug} businessType={businessType} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Collections Preview */}
                            {collections.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900">Collections</h2>
                                        <button onClick={() => setActiveTab('collections')} className="text-blue-600 hover:underline text-sm">
                                            View all →
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {collections.slice(0, 3).map((collection) => (
                                            <CollectionCard key={collection.id} collection={collection} slug={slug} businessType={businessType} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {team.map((member) => (
                                <TeamMemberCard key={member.id} member={member} />
                            ))}
                            {team.length === 0 && (
                                <p className="col-span-full text-center text-gray-500 py-12">No team members listed yet.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'lookbooks' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lookbooks.map((lookbook) => (
                                <LookbookCard key={lookbook.id} lookbook={lookbook} slug={slug} businessType={businessType} />
                            ))}
                            {lookbooks.length === 0 && (
                                <p className="col-span-full text-center text-gray-500 py-12">No lookbooks published yet.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'collections' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {collections.map((collection) => (
                                <CollectionCard key={collection.id} collection={collection} slug={slug} businessType={businessType} />
                            ))}
                            {collections.length === 0 && (
                                <p className="col-span-full text-center text-gray-500 py-12">No collections published yet.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900">Items Catalog</h3>
                            <p className="text-gray-500 mt-2">The full product catalog is being loaded...</p>
                        </div>
                    )}

                    {activeTab === 'followers' && (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900">Followers</h3>
                            <p className="text-gray-500 mt-2">Explore the community following this {displayTypeLabel.toLowerCase()}.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============ SUB-COMPONENTS ============

function TeamMemberCard({ member }: { member: BrandTeamMember }) {
    const content = (
        <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-200 overflow-hidden border-2 border-transparent group-hover:border-blue-600 transition-all">
                {member.user?.avatarUrl ? (
                    <img src={getImageUrl(member.user.avatarUrl)} alt={member.user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400 bg-gray-100">
                        {member.user?.name?.charAt(0) || '?'}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-center gap-1">
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {member.user?.name || 'Unknown'}
                </div>
                {member.user?.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
            </div>
            <div className="text-sm text-gray-500">
                {member.roles?.join(', ') || (member as any).role}
                {member.title && (
                    <span className="block text-xs text-gray-400 mt-0.5">{member.title}</span>
                )}
            </div>
        </div>
    );

    if (member.user?.username) {
        return (
            <Link href={`/u/${member.user.username}`} className="block">
                {content}
            </Link>
        );
    }

    return <div>{content}</div>;
}

function LookbookCard({ lookbook, slug, businessType }: { lookbook: BrandLookbook; slug: string; businessType: string }) {
    const lookbookIdentifier = lookbook.slug || lookbook.id;
    const basePath = businessType === 'non_profit' ? 'non-profits' : 'brands';

    return (
        <Link href={`/${basePath}/${slug}/lookbooks/${lookbookIdentifier}`} className="group">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-100">
                    {lookbook.coverImageUrl ? (
                        <img src={getImageUrl(lookbook.coverImageUrl)} alt={lookbook.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{lookbook.name}</h3>
                    <div className="text-sm text-gray-500 mt-1">
                        {lookbook.season && <span>{lookbook.season}</span>}
                        {lookbook.season && lookbook.year && <span> • </span>}
                        {lookbook.year && <span>{lookbook.year}</span>}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function CollectionCard({ collection, slug, businessType }: { collection: BrandCollection; slug: string; businessType: string }) {
    const collectionIdentifier = collection.slug || collection.id;
    const basePath = businessType === 'non_profit' ? 'non-profits' : 'brands';

    return (
        <Link href={`/${basePath}/${slug}/collections/${collectionIdentifier}`} className="group">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-100">
                    {collection.coverImageUrl ? (
                        <img src={getImageUrl(collection.coverImageUrl)} alt={collection.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{collection.name}</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                        {collection.season && <span>{collection.season}</span>}
                        {collection.season && collection.year && <span> • </span>}
                        {collection.year && <span>{collection.year}</span>}
                    </div>
                </div>
            </div>
        </Link>
    );
}
