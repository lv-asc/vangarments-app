'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthWrapper';
import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';

export default function FollowersPage() {
    const { user } = useAuth();
    const [followers, setFollowers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadFollowers = useCallback(async (query?: string) => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await apiClient.getFollowers(user.id, 1, 100, query);
            setFollowers(data.users || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load followers:', err);
            setError(err.message || 'Failed to load followers');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadFollowers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, loadFollowers]);

    const filteredFollowers = useMemo(() => {
        return followers; // Server-side search result
    }, [followers]);

    if (loading && followers.length === 0) {
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
                    <Link href="/profile" className="mr-4 text-gray-500 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Followers</h1>
                </div>

                {/* Search UI */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search followers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border-gray-200 rounded-lg py-2 pl-10 pr-10 focus:ring-2 focus:ring-[#00132d] focus:border-transparent transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Users</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {filteredFollowers.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 italic">
                                {searchQuery ? `No followers found matching "${searchQuery}"` : "No followers yet."}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredFollowers.map((follower) => (
                                    <Link
                                        key={follower.id}
                                        href={`/u/${follower.username}`}
                                        className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
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
                                            <h3 className="font-semibold text-gray-900 truncate">{follower.personalInfo?.name || follower.username}</h3>
                                            <p className="text-sm text-gray-500 truncate">@{follower.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

