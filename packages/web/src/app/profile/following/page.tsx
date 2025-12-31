'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthWrapper';
import { ArrowLeftIcon, ArrowRightIcon, MagnifyingGlassIcon, XMarkIcon, UsersIcon, BuildingStorefrontIcon, FireIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';
import { debounce } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

type EntityTypeFilter = 'all' | 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';

export default function FollowingPage() {
    const { user } = useAuth();

    // State
    const [users, setUsers] = useState<any[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<EntityTypeFilter>('all');

    const loadFollowing = useCallback(async (query?: string, type?: EntityTypeFilter) => {
        if (!user) return;
        try {
            setLoading(true);

            const promises: Promise<any>[] = [];
            const fetchUsers = type === 'all' || type === 'user';
            const fetchEntities = type === 'all' || ['brand', 'store', 'supplier', 'non_profit', 'page'].includes(type as string);

            if (fetchUsers) {
                promises.push(apiClient.getFollowing(user.id, 1, 100, query));
            } else {
                promises.push(Promise.resolve({ users: [] }));
            }

            if (fetchEntities) {
                const entityTypeHeader = type !== 'all' && type !== 'user' ? type : undefined;
                promises.push(apiClient.getFollowingEntities(user.id, entityTypeHeader, 1, 100, query));
            } else {
                promises.push(Promise.resolve({ entities: [] }));
            }

            const [userData, entityData] = await Promise.all(promises);
            setUsers(userData.users || []);
            setEntities(entityData.entities || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load following:', err);
            setError(err.message || 'Failed to load following');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadFollowing(searchQuery, filterType);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterType, loadFollowing]);

    // Grouping and normalization
    const filteredContent = useMemo(() => {
        const normalizedUsers = users.map(u => ({
            id: u.id,
            type: 'user',
            name: u.personalInfo?.name || u.username,
            subtitle: `@${u.username}`,
            image: u.personalInfo?.avatarUrl,
            link: `/u/${u.username}`,
            verificationStatus: u.verificationStatus
        }));

        const normalizedEntities = entities.map(e => ({
            id: e.id,
            type: e.entityType,
            name: e.entityName || 'Unnamed Entity',
            subtitle: e.entityType.charAt(0).toUpperCase() + e.entityType.slice(1).replace('_', '-'),
            image: e.entityLogo,
            link: `/${e.entityType === 'brand' ? 'brands' : e.entityType === 'store' ? 'stores' : e.entityType === 'non_profit' ? 'non-profits' : 'pages'}/${e.entitySlug || e.entityId}`,
            verificationStatus: e.verificationStatus
        }));

        const results = [...normalizedUsers, ...normalizedEntities];
        const grouped: Record<string, any[]> = {};

        results.forEach(item => {
            const typeLabel = item.type === 'user' ? 'Users' :
                item.type === 'brand' ? 'Brands' :
                    item.type === 'store' ? 'Stores' :
                        item.type === 'supplier' ? 'Suppliers' :
                            item.type === 'non_profit' ? 'Non-Profits' : 'Pages';

            if (!grouped[typeLabel]) grouped[typeLabel] = [];
            grouped[typeLabel].push(item);
        });

        return grouped;
    }, [users, entities]);

    if (loading && users.length === 0 && entities.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00132d]"></div>
            </div>
        );
    }

    const filters = [
        { id: 'all', label: 'All', icon: null },
        { id: 'user', label: 'Users', icon: UsersIcon },
        { id: 'brand', label: 'Brands', icon: FireIcon },
        { id: 'store', label: 'Stores', icon: BuildingStorefrontIcon },
        { id: 'supplier', label: 'Suppliers', icon: BuildingStorefrontIcon },
        { id: 'non_profit', label: 'Non-Profits', icon: BuildingStorefrontIcon },
        { id: 'page', label: 'Pages', icon: RectangleStackIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="flex items-center mb-6">
                    <Link href="/profile" className="mr-4 text-gray-500 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Following</h1>
                </div>

                {/* Search and Filter UI */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name..."
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

                    <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setFilterType(filter.id as EntityTypeFilter)}
                                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === filter.id
                                    ? 'bg-[#00132d] text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {filter.icon && <filter.icon className="w-4 h-4" />}
                                <span>{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    {Object.keys(filteredContent).length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-100 italic">
                            {searchQuery ? `No results found for "${searchQuery}"` : "Not following anyone or anything yet."}
                        </div>
                    ) : (
                        Object.entries(filteredContent).map(([groupName, items]) => (
                            <div key={groupName}>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{groupName}</h2>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                    {items.map((item) => (
                                        <Link
                                            key={`${item.type}-${item.id}`}
                                            href={item.link}
                                            className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 mr-4 flex-shrink-0">
                                                {item.image ? (
                                                    <img
                                                        src={getImageUrl(item.image)}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                                                        {item.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                                                    {item.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
                                            </div>
                                            <div className="text-gray-300 group-hover:text-[#00132d] transition-colors">
                                                <ArrowRightIcon className="w-5 h-5" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

