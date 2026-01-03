'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pageApi, IPage, PageTeamMember } from '@/lib/pageApi';
import Link from 'next/link';
import { getImageUrl, getUserAvatarUrl } from '@/lib/utils';
import {
    GlobeAltIcon,
    CalendarIcon,
    ChatBubbleLeftIcon,
    UserGroupIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { FollowEntityButton } from '@/components/social/FollowEntityButton';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { useEntityConfiguration } from '@/hooks/useEntityConfiguration';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { SocialIcon } from '@/components/ui/social-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getSocialLinkLabel, isWebsitePlatform } from '@/lib/socialLinkUtils';

export default function StaticPage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const slug = params.slug as string;

    const [page, setPage] = useState<IPage | null>(null);
    const [team, setTeam] = useState<PageTeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    const { addVisit } = useRecentVisits();
    const { hasFeature, getLabel, displayName } = useEntityConfiguration('page');

    useEffect(() => {
        if (slug) loadPage();
    }, [slug]);

    useEffect(() => {
        if (page) {
            addVisit({
                id: page.id,
                name: page.name,
                logo: page.logoUrl,
                businessType: 'page',
                type: 'page',
                slug: page.slug || page.id,
                verificationStatus: page.verificationStatus || (page.isVerified ? 'verified' : 'unverified')
            });
            loadTeam();
        }
    }, [page?.id]);

    // Update document title when page is loaded
    useEffect(() => {
        if (page) {
            document.title = `${displayName} @${page.name}`;
        }
    }, [page, displayName]);

    const loadPage = async () => {
        try {
            setLoading(true);
            const data = await pageApi.getPage(slug);
            setPage(data);
        } catch (err: any) {
            console.error(err);
            setError('Page not found.');
        } finally {
            setLoading(false);
        }
    };

    const loadTeam = async () => {
        if (!page) return;
        try {
            const members = await pageApi.getTeamMembers(page.id, true);
            setTeam(members);
        } catch (err) {
            console.error('Failed to load team:', err);
        }
    };

    // Resolve banners
    const banners = useMemo(() => {
        if (!page) return [];
        const metadata = page.bannerMetadata || [];
        if (metadata.length > 0) {
            return metadata.map(b => ({ url: b.url, positionY: b.positionY ?? 50 }));
        }
        if (page.bannerUrl) {
            return [{ url: page.bannerUrl, positionY: 50 }];
        }
        return [];
    }, [page]);

    // Banner Slideshow
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );

    if (error || !page) return (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
        </div>
    );

    const currentBanner = banners[currentBannerIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative">
                {/* Banner */}
                {hasFeature('banners') && (
                    currentBanner ? (
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
                    )
                )}
            </div>

            {/* Info Overlay */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20">
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Logo */}
                            {hasFeature('logos') && (
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                        {page.logoUrl ? (
                                            <img src={getImageUrl(page.logoUrl)} alt={page.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-4xl font-bold text-gray-300">{page.name.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="relative inline-flex items-center gap-2">
                                        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">{page.name}</h1>
                                        {(page.verificationStatus === 'verified' || page.isVerified) && (
                                            <VerifiedBadge size="md" />
                                        )}
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 ml-2">
                                        {displayName}
                                    </span>

                                    <div className="flex items-center gap-2 md:ml-auto">
                                        <FollowEntityButton
                                            entityType="page"
                                            entityId={page.id}
                                            size="sm"
                                        />
                                        <button
                                            onClick={() => {
                                                router.push(`/messages/${page.id}`);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold active:scale-95 shadow-sm"
                                        >
                                            <ChatBubbleLeftIcon className="w-4 h-4" />
                                            Message
                                        </button>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-gray-500">
                                    {page.websiteUrl && (
                                        <a
                                            href={page.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 hover:text-gray-900 transition-colors font-medium"
                                        >
                                            <GlobeAltIcon className="w-4 h-4" />
                                            Website
                                        </a>
                                    )}
                                    {hasFeature('foundedInfo') && page.foundedDate && (
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <CalendarIcon className="w-4 h-4" />
                                            Founded {page.foundedDate.split('-')[0]}
                                            {page.foundedBy && ` by ${page.foundedBy}`}
                                        </div>
                                    )}
                                </div>

                                {/* Social Links */}
                                {hasFeature('socialLinks') && (() => {
                                    const rawLinks = page.socialLinks || [];
                                    const displayLinks = [...rawLinks];

                                    // Add legacy fields if they exist and aren't in socialLinks (case-insensitive)
                                    if (page.websiteUrl && !displayLinks.some(l => isWebsitePlatform(l.platform))) {
                                        displayLinks.unshift({ platform: 'website', url: page.websiteUrl });
                                    }
                                    if (page.instagramUrl && !displayLinks.some(l => l.platform.toLowerCase() === 'instagram')) {
                                        displayLinks.push({ platform: 'Instagram', url: page.instagramUrl });
                                    }
                                    if (page.twitterUrl && !displayLinks.some(l => l.platform.toLowerCase() === 'twitter' || l.platform.toLowerCase() === 'x')) {
                                        displayLinks.push({ platform: 'X (Twitter)', url: page.twitterUrl });
                                    }
                                    if (page.facebookUrl && !displayLinks.some(l => l.platform.toLowerCase() === 'facebook')) {
                                        displayLinks.push({ platform: 'Facebook', url: page.facebookUrl });
                                    }

                                    if (displayLinks.length === 0) return null;

                                    return (
                                        <div className="flex flex-wrap gap-2.5 mt-5">
                                            {displayLinks.map((link, idx) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-all border border-gray-100 hover:border-gray-200"
                                                >
                                                    <SocialIcon platform={link.platform} url={link.url} size="sm" />
                                                    <span>{getSocialLinkLabel(link)}</span>
                                                </a>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pb-12">
                    {/* Sidebar / Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        {page.description && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                                    <h2 className="text-lg font-bold text-gray-900">About</h2>
                                </div>
                                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed">
                                    <p>{page.description}</p>
                                </div>
                            </div>
                        )}

                        {/* Assets / Multiple Logos */}
                        {hasFeature('logos') && page.logoMetadata && page.logoMetadata.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">{getLabel('logos', 'label', 'Assets')}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                    {page.logoMetadata.map((logo, index) => (
                                        <div key={index} className="flex flex-col gap-3 items-center group">
                                            <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-gray-100 group-hover:border-gray-300 transition-all shadow-sm group-hover:shadow-md">
                                                <img
                                                    src={getImageUrl(logo.url)}
                                                    alt={logo.name || `Variant ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            {hasFeature('logoNames') && logo.name && (
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider text-center">{logo.name}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Team Section */}
                        {hasFeature('team') && team.length > 0 && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-6">
                                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                                    <h2 className="text-lg font-bold text-gray-900">Team</h2>
                                </div>
                                <div className="space-y-5">
                                    {team.map((member) => (
                                        <div key={member.id} className="flex items-center gap-3 group">
                                            <Link href={member.user?.username ? `/u/${member.user.username}` : '#'} className="flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-transparent group-hover:border-black transition-all">
                                                    {member.user?.avatarUrl ? (
                                                        <img src={getImageUrl(member.user.avatarUrl)} alt={member.user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                                            {member.user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="min-w-0 flex-1">
                                                <Link href={member.user?.username ? `/u/${member.user.username}` : '#'} className="font-bold text-gray-900 hover:underline block truncate">
                                                    {member.user?.name || 'Unknown'}
                                                </Link>
                                                <div className="text-xs text-gray-500 font-medium truncate">
                                                    {member.title || (member.roles && member.roles.join(', ')) || 'Member'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sidebar info */}
                        <div className="p-1 px-4 text-xs text-gray-400 italic">
                            Last updated {new Date(page.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
