'use client';

import { useProfile } from '../ProfileLayoutClient';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export default function UserFollowersPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [followers, setFollowers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.id) {
            loadFollowers();
        }
    }, [profile?.id]);

    const loadFollowers = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getFollowers(profile!.id, 1, 100);
            setFollowers(data.users || []);
        } catch (err: any) {
            console.error('Failed to load followers:', err);
            setError('Failed to load followers');
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

    if (followers.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Followers</h2>
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-gray-500">No followers yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Followers</h2>
            </div>
            <div className="divide-y divide-gray-50">
                {followers.map((follower) => (
                    <div
                        key={follower.id}
                        className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                    >
                        <Link
                            href={`/u/${follower.username}`}
                            className="flex items-center flex-1 min-w-0"
                        >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-100 mr-4 flex-shrink-0">
                                {follower.personalInfo?.avatarUrl ? (
                                    <img
                                        src={getImageUrl(follower.personalInfo.avatarUrl)}
                                        alt={follower.personalInfo?.name || follower.username}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                                        {(follower.personalInfo?.name || follower.username || '').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-gray-900 truncate">{follower.personalInfo?.name || follower.username}</h3>
                                    {follower.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                </div>
                                <p className="text-sm text-gray-500 truncate">@{follower.username}</p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
