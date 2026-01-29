'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { getImageUrl, debounce } from '../../lib/utils';
import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import EntityFilterBar from '../../components/ui/EntityFilterBar';

const MotionDiv = motion.div as any;

export default function UsersDirectoryPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({
        verificationStatus: '',
        roles: [] as string[]
    });

    // Debounce search
    const debouncedSearchHandler = useCallback(
        debounce((query: string) => {
            setDebouncedSearch(query);
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearchHandler(searchTerm);
    }, [searchTerm, debouncedSearchHandler]);

    // Load users
    useEffect(() => {
        loadUsers();
    }, [debouncedSearch, filters]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.append('search', debouncedSearch);
            if (filters.verificationStatus) queryParams.append('verificationStatus', filters.verificationStatus);
            if (filters.roles && filters.roles.length > 0) {
                filters.roles.forEach(role => queryParams.append('roles', role));
            }
            queryParams.append('limit', '50');

            const response = await apiClient.get<any>(`/users/search?${queryParams.toString()}`);
            setUsers(response.users || response.data?.users || []);
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-3"
                    >
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <UsersIcon className="h-10 w-10 text-blue-600" />
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-2"
                    >
                        Community Directory
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-xl mx-auto text-xl text-gray-500 mb-4"
                    >
                        Discover and connect with fashion enthusiasts, designers, and stylists on Vangarments.
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-md mx-auto relative"
                    >
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or username..."
                            className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm shadow-sm transition-all hover:shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </motion.div>
                </div>
            </div>

            <EntityFilterBar
                filters={filters}
                onFilterChange={setFilters}
                showRoles={true}
            />

            {/* Users Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium">Loading community...</p>
                    </div>
                ) : users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {users.map((user, index) => (
                                <UserCard key={user.id} user={user} index={index} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200"
                    >
                        <div className="mb-4 flex justify-center">
                            <UsersIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No users found</h3>
                        <p className="mt-1 text-gray-500">We couldn't find anyone matching your search.</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-blue-600 font-semibold hover:text-blue-700 underline-offset-4 hover:underline"
                        >
                            Clear search
                        </button>
                    </motion.div>
                )}
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gray-900 rounded-[2rem] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent" />
                    <div className="relative px-8 py-12 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Complete your profile</h2>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto">Stand out in the community by adding your bio, style preferences, and verified status.</p>
                        <Link
                            href="/settings"
                            className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            Edit My Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserCard({ user, index }: { user: any, index: number }) {
    const username = user.username || `user-${user.id.substring(0, 8)}`;
    const avatarUrl = user.personalInfo?.avatarUrl || user.avatar;
    const name = user.name || user.personalInfo?.name || 'Anonymous User';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
        >
            <Link href={`/u/${username}`} className="group block h-full">
                <MotionDiv
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full border border-gray-100 flex flex-col p-4"
                >
                    {/* Avatar Container */}
                    <div className="relative mb-4 flex justify-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-gray-50 group-hover:ring-blue-50 transition-all duration-300">
                            {avatarUrl ? (
                                <img
                                    src={getImageUrl(avatarUrl)}
                                    alt={`${name}'s avatar`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400">
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {user.verificationStatus === 'verified' && (
                            <div className="absolute bottom-0 right-1/2 translate-x-10">
                                <div className="bg-white rounded-full p-0.5 shadow-sm">
                                    <VerifiedBadge size="sm" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-center flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-0.5">
                            {name}
                        </h3>
                        <p className="text-sm font-medium text-gray-400 mb-3 truncate">
                            @{username}
                        </p>

                        {user.bio && (
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1 italic">
                                "{user.bio}"
                            </p>
                        )}

                        <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-center gap-4">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Followers</p>
                                <p className="text-sm font-bold text-gray-900">{user.stats?.followers || 0}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-100" />
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Posts</p>
                                <p className="text-sm font-bold text-gray-900">{user.stats?.posts || 0}</p>
                            </div>
                        </div>
                    </div>
                </MotionDiv>
            </Link>
        </motion.div>
    );
}
