'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl, getUserAvatarUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import ProfilePageClient from '@/app/profile/ProfilePageClient';
import {
    ArrowLeftIcon,
    MapPinIcon,
    CalendarIcon,
    ChatBubbleLeftIcon,
    UserPlusIcon,
    CheckIcon,
    GlobeAltIcon,
    ScaleIcon,
    ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { SocialIcon } from '@/components/ui/social-icons';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getSocialLinkLabel } from '@/lib/socialLinkUtils';
import { Modal } from '@/components/ui/Modal';

interface UserProfile {
    id: string;
    name: string;
    username: string;
    bio: string;
    profileImage: string;
    bannerImage?: string;
    bannerImages?: string[];
    createdAt: string;
    personalInfo: {
        location?: {
            city?: string;
            state?: string;
            country?: string;
        };
        gender?: string;
    };
    stats: {
        wardrobeItems: number;
        followers: number;
        following: number;
        friendsCount: number;
        pendingFollowRequests?: number;
    };
    measurements?: {
        height?: number;
        weight?: number;
    };
    socialLinks: { platform: string; url: string }[];
    roles: string[];
    verificationStatus?: string;
    privacySettings?: {
        isPrivate?: boolean;
        wardrobe?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
        activity?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
        marketplace?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
    };
}

const ProfileContext = createContext<{
    profile: UserProfile | null;
    followStatus: { isFollowing: boolean; isFollower?: boolean; status?: 'pending' | 'accepted' };
    loading: boolean;
    followLoading: boolean;
    handleFollowClick: () => Promise<void>;
    canViewSection: (section: 'wardrobe' | 'activity' | 'marketplace') => boolean;
} | null>(null);

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) throw new Error('useProfile must be used within a ProfileProvider');
    return context;
};

export default function UserProfileLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const username = params.username as string;

    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [followStatus, setFollowStatus] = useState<{ isFollowing: boolean; isFollower?: boolean; status?: 'pending' | 'accepted' }>({ isFollowing: false });
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [mutualConnections, setMutualConnections] = useState<any[]>([]);
    const [mutualConnectionsTotal, setMutualConnectionsTotal] = useState(0);
    const [isMutualsModalOpen, setIsMutualsModalOpen] = useState(false);
    const [allMutualConnections, setAllMutualConnections] = useState<any[]>([]);
    const [loadingMutuals, setLoadingMutuals] = useState(false);

    const isOwnProfile = user?.id === profile?.id;



    useEffect(() => {
        async function loadProfile() {
            if (!username) return;

            try {
                setLoading(true);
                const data = await apiClient.getPublicProfile(username);
                setProfile(data.profile);

                // Fetch follow status if logged in
                try {
                    const status = await apiClient.getFollowRelationship(data.profile.id);
                    setFollowStatus(status);
                } catch (e) {
                    // Not logged in or error, ignore
                }
            } catch (err: any) {
                console.error('Failed to load profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [username]);

    // Load mutual connections
    useEffect(() => {
        async function loadMutuals() {
            // Only load if we have a logged in user, a profile loaded, and it's not our own profile
            if (user?.id && profile?.id && !isOwnProfile) {
                try {
                    const data = await apiClient.getMutualConnections(profile.id, 3);
                    setMutualConnections(data.users || []);
                    setMutualConnectionsTotal(data.total || 0);
                } catch (e) {
                    console.error('Failed to load mutual connections:', e);
                }
            }
        }
        loadMutuals();
    }, [user?.id, profile?.id, isOwnProfile]);

    // Banner slideshow - auto-rotate every 5 seconds (same as brands/stores)
    useEffect(() => {
        const banners = profile?.bannerImages || [];
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentBannerIndex(prev => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [profile?.bannerImages]);

    const handleFollowClick = async () => {
        if (!profile) return;

        try {
            setFollowLoading(true);
            if (followStatus.isFollowing) {
                await apiClient.unfollowUser(profile.id);
                setFollowStatus({ isFollowing: false });
            } else {
                const response = await apiClient.followUser(profile.id);
                setFollowStatus({
                    isFollowing: true,
                    status: response.data?.follow?.status || 'accepted'
                });
            }
        } catch (err: any) {
            if (err.status === 401) {
                router.push('/login');
            } else {
                alert(err.message || 'Failed to update follow status');
            }
        } finally {
            setFollowLoading(false);
        }
    };

    const handleOpenMutualsModal = async () => {
        setIsMutualsModalOpen(true);
        if (allMutualConnections.length === 0 && profile) {
            try {
                setLoadingMutuals(true);
                const data = await apiClient.getMutualConnections(profile.id, 50); // Fetch more for modal
                setAllMutualConnections(data.users || []);
            } catch (e: any) {
                console.error('Failed to load all mutual connections:', e);
                if (e.details) {
                    console.error('Validation details:', e.details);
                }
            } finally {
                setLoadingMutuals(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
                    <p className="text-gray-500">{error || "The user you are looking for does not exist."}</p>
                </div>
            </div>
        );
    }

    const getFollowButtonText = () => {
        if (followStatus.isFollowing) {
            if (followStatus.isFollower && followStatus.status === 'accepted') {
                return 'Friends';
            }
            return followStatus.status === 'pending' ? 'Requested' : 'Following';
        }
        return 'Follow';
    };

    const isActive = (path: string) => {
        if (path === `/u/${username}`) {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    // If viewing own profile, render the full editable profile UI (Instagram-style)
    if (isOwnProfile) {
        return <ProfilePageClient />;
    }

    /**
     * Check if the current viewer can see a specific section based on privacy settings
     */
    const canViewSection = (section: 'wardrobe' | 'activity' | 'marketplace'): boolean => {
        // If profile doesn't have privacy settings, default to public
        if (!profile?.privacySettings) return true;

        const sectionSettings = profile.privacySettings[section];
        if (!sectionSettings) return true;

        const visibility = sectionSettings.visibility || 'public';

        // Check based on visibility level
        switch (visibility) {
            case 'public':
                return true;
            case 'followers':
                // Only accepted followers can see
                return followStatus.isFollowing && followStatus.status === 'accepted';
            case 'custom':
                // Check if current user is in the exception list
                if (!user?.id) return false;
                return sectionSettings.exceptUsers?.includes(user.id) || false;
            case 'hidden':
                return false;
            default:
                return true;
        }
    };

    return (
        <ProfileContext.Provider value={{ profile, followStatus, loading, followLoading, handleFollowClick, canViewSection }}>
            <div className="container mx-auto px-4 py-8">
                <Link
                    href=".."
                    onClick={(e) => {
                        e.preventDefault();
                        router.back();
                    }}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors cursor-pointer"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back
                </Link>

                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        {/* Banner Slideshow */}
                        <div className="relative h-48 md:h-64 bg-gradient-to-r from-gray-800 to-gray-900 overflow-hidden">
                            {(() => {
                                const banners = profile.bannerImages || [];
                                const currentBanner = banners[currentBannerIndex] || profile.bannerImage;

                                if (currentBanner) {
                                    return (
                                        <>
                                            <div
                                                key={currentBannerIndex}
                                                className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                                                style={{
                                                    backgroundImage: `url(${getImageUrl(currentBanner)})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            />
                                            {banners.length > 1 && (
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
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
                                        </>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-md relative">
                                        {getUserAvatarUrl(profile) ? (
                                            <Image
                                                src={getImageUrl(getUserAvatarUrl(profile))}
                                                alt={profile.name}
                                                fill
                                                className="object-cover rounded-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-3xl font-bold">
                                                {profile.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Navigation */}
                                {/* Stats Navigation removed to match private profile design */}
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            {profile.name}
                                            {profile.verificationStatus === 'verified' && (
                                                <VerifiedBadge size="md" />
                                            )}
                                            {profile.roles.includes('admin') && (
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-900 text-white">ADMIN</span>
                                            )}
                                        </h1>
                                        <p className="text-gray-500">@{profile.username}</p>
                                    </div>
                                    {!isOwnProfile && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleFollowClick}
                                                disabled={followLoading}
                                                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all font-medium ${followStatus.isFollowing
                                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                                                    }`}
                                            >
                                                {followLoading ? (
                                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                ) : followStatus.isFollowing ? (
                                                    <>
                                                        <CheckIcon className="w-5 h-5" />
                                                        {getFollowButtonText()}
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlusIcon className="w-5 h-5" />
                                                        Follow
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    router.push(`/messages/u/${profile.username}`);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                                Message
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {profile.bio && (
                                    <p className="text-gray-700 max-w-2xl mb-6 leading-relaxed">
                                        {profile.bio}
                                    </p>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-500 mb-6">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex items-center">
                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                            Joined {new Date(profile.createdAt).toLocaleDateString()}
                                        </div>
                                        {profile.personalInfo.location?.city && (
                                            <div className="flex items-center">
                                                <MapPinIcon className="w-4 h-4 mr-2" />
                                                {[
                                                    profile.personalInfo.location.city,
                                                    profile.personalInfo.location.state,
                                                    profile.personalInfo.location.country
                                                ].filter(Boolean).join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        {profile.measurements?.height && (
                                            <div className="flex items-center">
                                                <ArrowsUpDownIcon className="w-4 h-4 mr-2" />
                                                {profile.measurements.height} cm
                                            </div>
                                        )}
                                        {profile.measurements?.weight && (
                                            <div className="flex items-center">
                                                <ScaleIcon className="w-4 h-4 mr-2" />
                                                {profile.measurements.weight} kg
                                            </div>
                                        )}
                                        {/* Gender icons - only show for male/female */}
                                        {profile.personalInfo?.gender === 'male' && (
                                            <div className="flex items-center">
                                                <span className="text-blue-500 font-medium text-lg">♂</span>
                                            </div>
                                        )}
                                        {profile.personalInfo?.gender === 'female' && (
                                            <div className="flex items-center">
                                                <span className="text-pink-500 font-medium text-lg">♀</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {profile.socialLinks && profile.socialLinks.length > 0 && (
                                    <div className="flex flex-wrap gap-4 border-t border-gray-50 pt-6">
                                        {profile.socialLinks.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                                            >
                                                <SocialIcon platform={link.platform} url={link.url} size="sm" />
                                                {getSocialLinkLabel(link)}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Mutual Connections */}
                                {mutualConnections.length > 0 && (
                                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-50">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {mutualConnections.map((conn) => (
                                                <div key={conn.id} className="relative inline-block h-6 w-6 rounded-full ring-2 ring-white bg-white">
                                                    {getUserAvatarUrl(conn) ? (
                                                        <img
                                                            className="h-full w-full rounded-full object-cover"
                                                            src={getImageUrl(getUserAvatarUrl(conn))}
                                                            alt={conn.username}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                            {(conn.username || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Followed by <Link href={`/u/${mutualConnections[0].username}`} className="font-semibold text-gray-900 hover:underline">{mutualConnections[0].username}</Link>
                                            {mutualConnections.length > 1 && (
                                                <>
                                                    , <Link href={`/u/${mutualConnections[1].username}`} className="font-semibold text-gray-900 hover:underline">{mutualConnections[1].username}</Link>
                                                </>
                                            )}
                                            {mutualConnectionsTotal > mutualConnections.length && (
                                                <> and <button onClick={handleOpenMutualsModal} className="font-semibold text-gray-900 hover:underline cursor-pointer">{mutualConnectionsTotal - mutualConnections.length} others</button></>
                                            )}
                                            <span className="text-gray-400"> you follow</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {children}
                </div>
            </div>

            {/* Mutual Connections Modal */}
            <Modal
                isOpen={isMutualsModalOpen}
                onClose={() => setIsMutualsModalOpen(false)}
                title="Mutual Connections"
                size="md"
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    {loadingMutuals ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allMutualConnections.map((conn) => (
                                <div key={conn.id} className="flex items-center justify-between group">
                                    <Link
                                        href={`/u/${conn.username}`}
                                        className="flex items-center gap-3"
                                        onClick={() => setIsMutualsModalOpen(false)}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                            {getUserAvatarUrl(conn) ? (
                                                <img
                                                    className="h-full w-full object-cover"
                                                    src={getImageUrl(getUserAvatarUrl(conn))}
                                                    alt={conn.username}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-gray-400">
                                                    {conn.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 group-hover:underline">
                                                {conn.personalInfo?.name || conn.username}
                                            </p>
                                            <p className="text-xs text-gray-500">@{conn.username}</p>
                                        </div>
                                    </Link>
                                    <Link
                                        href={`/u/${conn.username}`}
                                        className="text-xs font-medium text-primary hover:underline"
                                        onClick={() => setIsMutualsModalOpen(false)}
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            ))}
                            {allMutualConnections.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No mutual connections found.</p>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </ProfileContext.Provider>
    );
}
