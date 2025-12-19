'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthWrapper';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';

export default function FollowingPage() {
    const { user } = useAuth();
    const [following, setFollowing] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const loadFollowing = async () => {
            try {
                setLoading(true);
                const data = await apiClient.getFollowing(user.id);
                setFollowing(data.users || []);
            } catch (err: any) {
                console.error('Failed to load following:', err);
                setError(err.message || 'Failed to load following');
            } finally {
                setLoading(false);
            }
        };

        loadFollowing();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00132d]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="flex items-center mb-6">
                    <Link href="/profile" className="mr-4 text-gray-500 hover:text-gray-900">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Following</h1>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {following.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Not following anyone yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {following.map((followedUser) => (
                                <Link
                                    key={followedUser.id}
                                    href={`/u/${followedUser.username}`}
                                    className="flex items-center p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 mr-4">
                                        {followedUser.personalInfo?.avatarUrl ? (
                                            <img
                                                src={getImageUrl(followedUser.personalInfo.avatarUrl)}
                                                alt={followedUser.personalInfo?.name || followedUser.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-lg">
                                                {(followedUser.personalInfo?.name || followedUser.username || '').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{followedUser.personalInfo?.name || followedUser.username}</h3>
                                        <p className="text-sm text-gray-500">@{followedUser.username}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
