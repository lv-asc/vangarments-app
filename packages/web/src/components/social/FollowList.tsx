import React from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/utils/imageUrl';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface FollowItem {
    id: string;
    type: string; // 'user', 'brand', 'store', etc.
    name?: string; // For Entity
    username?: string; // For User
    profile?: {
        name?: string;
        avatarUrl?: string;
    };
    logo?: string; // For Entity
    slug?: string; // For Entity
    verificationStatus?: 'verified' | 'rejected' | 'pending' | 'unverified';
    isFollowing?: boolean;
}

interface FollowListProps {
    items: FollowItem[];
    onFollow?: (item: FollowItem) => void;
    onUnfollow?: (item: FollowItem) => void;
    emptyMessage?: string;
}

export function FollowList({ items, onFollow, onUnfollow, emptyMessage = 'No items found.' }: FollowListProps) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-50 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {items.map((item) => {
                const isUser = item.type === 'user';
                const name = isUser ? (item.profile?.name || item.username) : item.name;
                const subText = isUser ? `@${item.username}` : (item.type.charAt(0).toUpperCase() + item.type.slice(1));
                const imageUrl = isUser ? item.profile?.avatarUrl : item.logo;
                const linkHref = isUser ? `/u/${item.username}` : `/${item.type === 'store' ? 'stores' : item.type === 'non_profit' ? 'non-profits' : 'brands'}/${item.slug}`;

                return (
                    <div key={`${item.type}-${item.id}`} className="flex items-center p-4 hover:bg-gray-50 transition-colors group">
                        <Link href={linkHref} className="flex items-center flex-1 min-w-0">
                            {/* Avatar/Logo */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-100 mr-4 flex-shrink-0">
                                {imageUrl ? (
                                    <img
                                        src={getImageUrl(imageUrl)}
                                        alt={name || ''}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg bg-gray-100">
                                        {(name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                                    {item.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{subText}</p>
                            </div>
                        </Link>

                        {/* Action Button (Future) */}
                        {/* 
                        <div>
                             <button className="...">Follow</button>
                        </div> 
                        */}
                    </div>
                );
            })}
        </div>
    );
}
