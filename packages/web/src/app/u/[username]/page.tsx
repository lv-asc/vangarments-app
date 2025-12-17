'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon, MapPinIcon, CalendarIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

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
        outfitsCreated: number;
    };
    roles: string[];
}

export default function PublicUserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            if (!username) return;

            try {
                setLoading(true);
                const data = await apiClient.getPublicProfile(username);
                setProfile(data.profile);
            } catch (err: any) {
                console.error('Failed to load profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [username]);

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

    return (
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

                            {/* Stats - using the stats object from response */}
                            <div className="flex gap-8 mb-2 hidden md:flex">
                                <div className="text-center">
                                    <div className="font-bold text-xl text-gray-900">{profile.stats.wardrobeItems || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Items</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-xl text-gray-900">{profile.stats.outfitsCreated || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Outfits</div>
                                </div>
                                {/* Followers/Following placeholder */}
                                <div className="text-center">
                                    <div className="font-bold text-xl text-gray-900">{profile.stats.followers || 0}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.name}
                                {profile.roles.includes('admin') && (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-900 text-white">ADMIN</span>
                                )}
                            </h1>
                            <p className="text-gray-500 mb-4">@{profile.username}</p>

                            {/* Action buttons */}
                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={async () => {
                                        try {
                                            const conv = await apiClient.startConversation(profile.id);
                                            router.push(`/messages/${conv.id}`);
                                        } catch (err: any) {
                                            if (err.status === 401) {
                                                router.push('/login');
                                            } else {
                                                alert(err.message || 'Failed to start conversation');
                                            }
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <ChatBubbleLeftIcon className="w-4 h-4" />
                                    Message
                                </button>
                            </div>

                            {profile.bio && (
                                <p className="text-gray-700 max-w-2xl mb-6 leading-relaxed">
                                    {profile.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
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
                        </div>
                    </div>
                </div>

                {/* Content Placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Can add wardrobe or lookbooks here later */}
                    <div className="md:col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <p className="text-gray-500">No public items found.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
