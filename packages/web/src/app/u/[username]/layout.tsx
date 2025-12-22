'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
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

interface UserProfile {
    id: string;
    name: string;
    username: string;
    bio: string;
    profileImage: string;
    createdAt: string;
    personalInfo: {
        location?: {
            city?: string;
            state?: string;
            country?: string;
        };
    };
    stats: {
        wardrobeItems: number;
        followers: number;
        following: number;
        friendsCount: number;
        outfitsCreated: number;
    };
    measurements?: {
        height?: number;
        weight?: number;
    };
    socialLinks: { platform: string; url: string }[];
    roles: string[];
}

const ProfileContext = createContext<{
    profile: UserProfile | null;
    followStatus: { isFollowing: boolean; status?: 'pending' | 'accepted' };
    loading: boolean;
    followLoading: boolean;
    handleFollowClick: () => Promise<void>;
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

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [followStatus, setFollowStatus] = useState<{ isFollowing: boolean; status?: 'pending' | 'accepted' }>({ isFollowing: false });
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <ProfileContext.Provider value={{ profile, followStatus, loading, followLoading, handleFollowClick }}>
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
                        <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-200"></div>
                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-12 mb-6">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-md">
                                        {profile.profileImage ? (
                                            <Image
                                                src={getImageUrl(profile.profileImage)}
                                                alt={profile.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-3xl font-bold">
                                                {profile.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Navigation */}
                                <div className="flex gap-6 mb-2 hidden md:flex">
                                    <Link
                                        href={`/u/${profile.username}`}
                                        className={`text-center group ${isActive(`/u/${profile.username}`) ? 'opacity-100' : 'opacity-70'}`}
                                    >
                                        <div className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
                                            {profile.stats.wardrobeItems || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Items</div>
                                    </Link>
                                    <Link
                                        href={`/u/${profile.username}/outfits`}
                                        className={`text-center group ${isActive(`/u/${profile.username}/outfits`) ? 'opacity-100' : 'opacity-70'}`}
                                    >
                                        <div className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
                                            {profile.stats.outfitsCreated || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Outfits</div>
                                    </Link>
                                    <Link
                                        href={`/u/${profile.username}/followers`}
                                        className={`text-center group ${isActive(`/u/${profile.username}/followers`) ? 'opacity-100' : 'opacity-70'}`}
                                    >
                                        <div className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
                                            {profile.stats.followers || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
                                    </Link>
                                    <Link
                                        href={`/u/${profile.username}/following`}
                                        className={`text-center group ${isActive(`/u/${profile.username}/following`) ? 'opacity-100' : 'opacity-70'}`}
                                    >
                                        <div className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
                                            {profile.stats.following || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Following</div>
                                    </Link>
                                    <Link
                                        href={`/u/${profile.username}/friends`}
                                        className={`text-center group ${isActive(`/u/${profile.username}/friends`) ? 'opacity-100' : 'opacity-70'}`}
                                    >
                                        <div className="font-bold text-xl text-gray-900 group-hover:text-primary transition-colors">
                                            {profile.stats.friendsCount || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">Friends</div>
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            {profile.name}
                                            {profile.roles.includes('admin') && (
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-900 text-white">ADMIN</span>
                                            )}
                                        </h1>
                                        <p className="text-gray-500">@{profile.username}</p>
                                    </div>
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
                                                <SocialIcon platform={link.platform} size="sm" />
                                                {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </ProfileContext.Provider>
    );
}
