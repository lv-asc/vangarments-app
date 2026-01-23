'use client';

import { useProfile } from '../ProfileLayoutClient';
import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export default function UserFollowersPage() {
    const { profile, loading: profileLoading } = useProfile();
    const [followers, setFollowers] = useState<any[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
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
            setEntities(data.entities || []);
        } catch (err: any) {
            console.error('Failed to load followers:', err);
            setError('Failed to load followers');
        } finally {
            setLoading(false);
        }
    };

    const groupedContent = useMemo(() => {
        const normalizedUsers = followers.map(u => ({
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
            type: e.type,
            name: e.name || 'Unnamed Entity',
            subtitle: e.type.charAt(0).toUpperCase() + e.type.slice(1).replace('_', '-'),
            image: e.logo,
            link: `/${e.type === 'brand' ? 'brands' : e.type === 'store' ? 'stores' : e.type === 'non_profit' ? 'non-profits' : e.type === 'sport_org' ? 'sport-orgs' : 'pages'}/${e.slug || e.id}`,
            verificationStatus: e.verificationStatus
        }));

        const results = [...normalizedUsers, ...normalizedEntities];
        const grouped: Record<string, any[]> = {};

        results.forEach(item => {
            const typeLabel = item.type === 'user' ? 'Users' :
                item.type === 'brand' ? 'Brands' :
                    item.type === 'store' ? 'Stores' :
                        item.type === 'supplier' ? 'Suppliers' :
                            item.type === 'non_profit' ? 'Non-Profits' :
                                item.type === 'sport_org' ? 'Sport ORGs' : 'Pages';

            if (!grouped[typeLabel]) grouped[typeLabel] = [];
            grouped[typeLabel].push(item);
        });

        return grouped;
    }, [followers, entities]);

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

    if (Object.keys(groupedContent).length === 0) {
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
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 px-1">Followers</h2>
            {Object.entries(groupedContent).map(([groupName, items]) => (
                <div key={groupName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{groupName}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {items.map((item) => (
                            <Link
                                key={`${item.type}-${item.id}`}
                                href={item.link}
                                className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 mr-4 flex-shrink-0" style={{ borderRadius: item.type === 'user' ? '9999px' : '0.5rem' }}>
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
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
