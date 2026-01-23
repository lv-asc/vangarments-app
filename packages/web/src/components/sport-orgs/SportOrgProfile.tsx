'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SportOrg, SportDepartment, SportSquad } from '@vangarments/shared';
import { useAuth } from '@/contexts/AuthContext';
import { FollowEntityButton } from '@/components/social/FollowEntityButton';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { SocialIcon } from '@/components/ui/social-icons';
import { getSocialLinkLabel, isWebsitePlatform } from '@/lib/socialLinkUtils';
import {
    ChatBubbleLeftIcon,
    UsersIcon,
    UserGroupIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';

export interface SportOrgFullProfile {
    org: SportOrg & { departments?: SportDepartment[] };
    followerCount?: number;
    followingCount?: number;
}

interface SportOrgProfileProps {
    profile: SportOrgFullProfile;
    slug: string;
}

export default function SportOrgProfile({ profile, slug }: SportOrgProfileProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'squads'>('overview');
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    const { org } = profile;
    const orgInfo = org;

    // Resolve banners
    const banners = React.useMemo(() => {
        const rawBanners = org.banners || [];
        const singleBanner = org.banner;

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
    }, [org]);

    // Banner Slideshow
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const currentBanner = banners[currentBannerIndex];

    // Format Org Type Label
    const getOrgTypeLabel = (type: string) => {
        switch (type) {
            case 'professional_club': return 'Professional Club';
            case 'national_association': return 'National Association';
            case 'national_olympic_committee': return 'Olympic Committee';
            case 'esports_org': return 'Esports Org';
            case 'esports_federation': return 'Esports Federation';
            default: return 'Sport Org';
        }
    };

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
                    <div className="h-48 md:h-64 bg-gradient-to-r from-blue-800 to-blue-900" />
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
                                    {org.masterLogo ? (
                                        <img src={getImageUrl(org.masterLogo)} alt={org.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-4xl font-bold text-gray-400">{org.name.charAt(0)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="relative inline-flex">
                                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{org.name}</h1>
                                        {/* Verification Badge could be added here if SportOrg has status */}
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-4 bg-blue-100 text-blue-800">
                                        {getOrgTypeLabel(org.orgType)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <FollowEntityButton
                                            entityType="sport_org"
                                            entityId={org.id}
                                            size="sm"
                                        />
                                        {user && (
                                            <button
                                                onClick={() => {
                                                    router.push(`/messages/${org.id}`);
                                                }}
                                                className="inline-flex items-center gap-2 px-3 py-1 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                            >
                                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                                Message
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {org.description && (
                                    <p className="text-gray-600 mt-4 max-w-2xl text-sm leading-relaxed">
                                        {org.description}
                                    </p>
                                )}

                                {/* Social Links */}
                                {(() => {
                                    const rawLinks = org.socialLinks || [];
                                    const displayLinks = [...rawLinks];
                                    const hasWebsiteLink = displayLinks.some(l => isWebsitePlatform(l.platform));
                                    if (org.website && !hasWebsiteLink) {
                                        displayLinks.unshift({ platform: 'website' as any, url: org.website });
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
                                                    <span>{getSocialLinkLabel(link)}</span>
                                                </a>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* Metadata - Founded, Country */}
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-gray-500">
                                    {org.foundedDate && (
                                        <span className="flex items-center gap-1.5">
                                            <span>📅</span>
                                            Founded {new Date(org.foundedDate).getFullYear()}
                                        </span>
                                    )}
                                    {org.foundedBy && (
                                        <span className="flex items-center gap-1.5">
                                            <span>👤</span>
                                            By {org.foundedBy}
                                        </span>
                                    )}
                                    {org.foundedCountry && (
                                        <span className="flex items-center gap-1.5">
                                            <span>📍</span>
                                            {org.foundedCountry}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <UsersIcon className="w-4 h-4" />
                                        <span className="font-medium text-gray-900">{profile.followerCount || 0}</span> followers
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto mt-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex gap-8 overflow-x-auto pb-px" aria-label="Tabs">
                            {(['overview', 'departments', 'squads'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="py-8">
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Additional Logos / Assets */}
                                {org.logoMetadata && org.logoMetadata.length > 0 && (
                                    <section>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Official Assets</h2>
                                        <div className="flex flex-wrap gap-4">
                                            {org.logoMetadata.map((meta, index) => (
                                                <div key={index} className="flex flex-col gap-2 items-center group">
                                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-transparent group-hover:border-gray-200 transition-colors">
                                                        <img
                                                            src={getImageUrl(meta.url)}
                                                            alt={meta.name || `Logo ${index + 1}`}
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                    {meta.name && (
                                                        <span className="text-xs text-gray-500 font-medium">{meta.name}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Hierarchy Preview */}
                                {org.departments && org.departments.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-semibold text-gray-900">Departments</h2>
                                            <button onClick={() => setActiveTab('departments')} className="text-blue-600 hover:underline text-sm">
                                                View all →
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {org.departments.slice(0, 3).map((dept) => (
                                                <DepartmentCard key={dept.id} department={dept} />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === 'departments' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {org.departments?.map((dept) => (
                                    <DepartmentCard key={dept.id} department={dept} />
                                ))}
                                {(!org.departments || org.departments.length === 0) && (
                                    <p className="col-span-full text-center text-gray-500 py-12">No departments listed yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'squads' && (
                            <div className="space-y-8">
                                {org.departments?.map((dept) => (
                                    <section key={dept.id}>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs">
                                                {dept.sportType.charAt(0)}
                                            </span>
                                            {dept.name} Squads
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {dept.squads?.map((squad) => (
                                                <SquadCard key={squad.id} squad={squad} />
                                            ))}
                                            {(!dept.squads || dept.squads.length === 0) && (
                                                <p className="text-gray-500 text-sm ml-10">No squads managed under this department.</p>
                                            )}
                                        </div>
                                    </section>
                                ))}
                                {(!org.departments || org.departments.length === 0) && (
                                    <p className="text-center text-gray-500 py-12">No squads available.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DepartmentCard({ department }: { department: SportDepartment }) {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                    {department.logo ? (
                        <img src={getImageUrl(department.logo)} alt={department.name} className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-2xl font-bold text-gray-300">{department.sportType.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-500">{department.sportType} • {department.category}</p>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span>{department.squads?.length || 0} Squads</span>
                <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100 uppercase tracking-wider">{department.surfaceEnvironment}</span>
            </div>
        </div>
    );
}

function SquadCard({ squad }: { squad: SportSquad }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center shrink-0">
                    {squad.logo ? (
                        <img src={getImageUrl(squad.logo)} alt={squad.name} className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-sm font-bold text-gray-300">{squad.name.charAt(0)}</span>
                    )}
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{squad.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{squad.gender} • {squad.ageGroup}</p>
                </div>
            </div>
        </div>
    );
}
