'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    brandApi,
    BrandFullProfile,
    BrandTeamMember,
    BrandLookbook,
    BrandCollection,
    BrandProfileData
} from '@/lib/brandApi';

export default function BrandProfilePage() {
    const params = useParams();
    const router = useRouter();
    const brandId = params.id as string;

    const [profile, setProfile] = useState<BrandFullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'lookbooks' | 'collections' | 'items'>('overview');

    useEffect(() => {
        if (brandId) {
            loadProfile();
        }
    }, [brandId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await brandApi.getFullProfile(brandId);
            setProfile(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load brand profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand Not Found</h1>
                    <p className="text-gray-600 mb-4">{error || 'The brand profile could not be loaded.'}</p>
                    <Link href="/brands" className="text-blue-600 hover:underline">
                        ← Back to Brands
                    </Link>
                </div>
            </div>
        );
    }

    const { brand, team, lookbooks, collections } = profile;
    const brandInfo = brand.brandInfo;
    const profileData = brand.profileData || {} as BrandProfileData;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative">
                {/* Banner */}
                <div
                    className="h-48 md:h-64 bg-gradient-to-r from-gray-800 to-gray-900"
                    style={brandInfo.banner ? { backgroundImage: `url(${brandInfo.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                />

                {/* Brand Info Overlay */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-20 sm:-mt-24">
                        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Logo */}
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gray-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                        {brandInfo.logo ? (
                                            <img src={brandInfo.logo} alt={brandInfo.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-bold text-gray-400">{brandInfo.name.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Brand Details */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{brandInfo.name}</h1>
                                        {brand.verificationStatus === 'verified' && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                ✓ Verified
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${brand.partnershipTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                                                brand.partnershipTier === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {brand.partnershipTier.charAt(0).toUpperCase() + brand.partnershipTier.slice(1)}
                                        </span>
                                    </div>

                                    {/* Bio */}
                                    <p className="text-gray-600 mb-4 max-w-2xl">
                                        {profileData.bio || brandInfo.description || 'No description available.'}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        {brandInfo.website && (
                                            <a href={brandInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                                                <span>🌐</span>
                                                <span>Website</span>
                                            </a>
                                        )}
                                        {profileData.foundedDate && (
                                            <span className="flex items-center gap-1">
                                                <span>📅</span>
                                                <span>Founded {new Date(profileData.foundedDate).getFullYear()}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Social Links */}
                                    <div className="flex gap-3 mt-4">
                                        {profileData.instagram && (
                                            <a
                                                href={profileData.instagram.startsWith('http') ? profileData.instagram : `https://instagram.com/${profileData.instagram.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                                                title="Instagram"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                                </svg>
                                            </a>
                                        )}
                                        {profileData.tiktok && (
                                            <a
                                                href={profileData.tiktok.startsWith('http') ? profileData.tiktok : `https://tiktok.com/@${profileData.tiktok.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                                                title="TikTok"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                                </svg>
                                            </a>
                                        )}
                                        {profileData.youtube && (
                                            <a
                                                href={profileData.youtube.startsWith('http') ? profileData.youtube : `https://youtube.com/@${profileData.youtube.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white hover:opacity-90 transition-opacity"
                                                title="YouTube"
                                            >
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex md:flex-col gap-6 md:gap-2 text-center md:text-right">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{brand.analytics.totalCatalogItems}</div>
                                        <div className="text-sm text-gray-500">Items</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{team.length}</div>
                                        <div className="text-sm text-gray-500">Team</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">{collections.length}</div>
                                        <div className="text-sm text-gray-500">Collections</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-8" aria-label="Tabs">
                        {(['overview', 'team', 'lookbooks', 'collections'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                            {/* Additional Logos */}
                            {profileData.additionalLogos && profileData.additionalLogos.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Assets</h2>
                                    <div className="flex flex-wrap gap-4">
                                        {profileData.additionalLogos.map((logo, index) => (
                                            <div key={index} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                                <img src={logo} alt={`Logo ${index + 1}`} className="w-full h-full object-contain" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Quick Team Preview */}
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

                            {/* Quick Lookbooks Preview */}
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
                                            <LookbookCard key={lookbook.id} lookbook={lookbook} brandId={brandId} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Quick Collections Preview */}
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
                                            <CollectionCard key={collection.id} collection={collection} brandId={brandId} />
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
                                <LookbookCard key={lookbook.id} lookbook={lookbook} brandId={brandId} />
                            ))}
                            {lookbooks.length === 0 && (
                                <p className="col-span-full text-center text-gray-500 py-12">No lookbooks published yet.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'collections' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {collections.map((collection) => (
                                <CollectionCard key={collection.id} collection={collection} brandId={brandId} />
                            ))}
                            {collections.length === 0 && (
                                <p className="col-span-full text-center text-gray-500 py-12">No collections published yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============ SUB-COMPONENTS ============

function TeamMemberCard({ member }: { member: BrandTeamMember }) {
    return (
        <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gray-200 overflow-hidden">
                {member.user?.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                        {member.user?.name?.charAt(0) || '?'}
                    </div>
                )}
            </div>
            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {member.user?.name || 'Unknown'}
            </div>
            <div className="text-sm text-gray-500">{member.title || member.role}</div>
        </div>
    );
}

function LookbookCard({ lookbook, brandId }: { lookbook: BrandLookbook; brandId: string }) {
    return (
        <Link href={`/brands/${brandId}/lookbooks/${lookbook.id}`} className="group">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-100">
                    {lookbook.coverImageUrl ? (
                        <img src={lookbook.coverImageUrl} alt={lookbook.name} className="w-full h-full object-cover" />
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
                    {lookbook.itemCount !== undefined && lookbook.itemCount > 0 && (
                        <div className="text-sm text-gray-400 mt-1">{lookbook.itemCount} items</div>
                    )}
                </div>
            </div>
        </Link>
    );
}

function CollectionCard({ collection, brandId }: { collection: BrandCollection; brandId: string }) {
    return (
        <Link href={`/brands/${brandId}/collections/${collection.id}`} className="group">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-100">
                    {collection.coverImageUrl ? (
                        <img src={collection.coverImageUrl} alt={collection.name} className="w-full h-full object-cover" />
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
                        {collection.collectionType && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{collection.collectionType}</span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        {collection.season && <span>{collection.season}</span>}
                        {collection.season && collection.year && <span> • </span>}
                        {collection.year && <span>{collection.year}</span>}
                    </div>
                    {collection.itemCount !== undefined && collection.itemCount > 0 && (
                        <div className="text-sm text-gray-400 mt-1">{collection.itemCount} items</div>
                    )}
                </div>
            </div>
        </Link>
    );
}
