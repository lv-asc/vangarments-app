'use client';

import { useProfile } from '../ProfileLayoutClient';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export default function UserFollowingPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [following, setFollowing] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.id) {
            loadFollowing();
        }
    }, [profile?.id]);

    const loadFollowing = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getFollowing(profile!.id, 1, 100);
            setFollowing(data.users || []);
        } catch (err: any) {
            console.error('Failed to load following:', err);
            setError('Failed to load following');
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading || loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00132d]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg my-6">
                {error}
            </div>
        );
    }

    if (following.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Following</h2>
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-gray-500">Not following anyone yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Following</h2>
            </div>
            <div className="divide-y divide-gray-50">
                {following.map((followedUser) => (
                    <div
                        key={followedUser.id}
                        className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                    >
                        <Link
                            href={`/u/${followedUser.username}`}
                            className="flex items-center flex-1 min-w-0"
                        >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-100 mr-4 flex-shrink-0">
                                {followedUser.personalInfo?.avatarUrl ? (
                                    <img
                                        src={getImageUrl(followedUser.personalInfo.avatarUrl)}
                                        alt={followedUser.personalInfo?.name || followedUser.username}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                                        {(followedUser.personalInfo?.name || followedUser.username || '').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-gray-900 truncate">{followedUser.personalInfo?.name || followedUser.username}</h3>
                                    {followedUser.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                </div>
                                <p className="text-sm text-gray-500 truncate">@{followedUser.username}</p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
