'use client';

import React from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface FollowListProps {
    items: any[];
    emptyMessage?: string;
}

export function FollowList({ items, emptyMessage = "No items found." }: FollowListProps) {
    if (!items || items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => {
                // Try to determine the shape or fallback
                // Accessing potentially nested properties based on different return shapes
                const follower = item.follower || item.following || item; // sometimes wrapped

                // Normalize data
                const id = follower.id || idx;
                // Check if it's a User or Brand/Entity
                const isUser = !!follower.username; // simplistic check, might need robust typing

                const name = follower.name || follower.brandInfo?.name || "Unknown";
                const avatar = follower.avatarUrl || follower.brandInfo?.logo || follower.logo;
                const username = follower.username || follower.brandInfo?.slug || follower.slug;
                const type = follower.type || (isUser ? 'User' : 'Brand');
                const verificationStatus = follower.verificationStatus;

                // Construct link
                let href = '#';
                if (isUser && username) {
                    href = `/u/${username}`;
                } else if (!isUser && username) {
                    href = `/brands/${username}`;
                } else if (!isUser && follower.id) {
                    href = `/brand/${follower.id}`; // Fallback
                }

                return (
                    <Link
                        key={id}
                        href={href}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-300 transition-colors group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400 font-bold text-lg border border-gray-100">
                            {avatar ? (
                                <img src={getImageUrl(avatar)} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                name.charAt(0)
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                                <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">{name}</h4>
                                {verificationStatus === 'verified' && <VerifiedBadge size="xs" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {username && <span className="truncate">@{username}</span>}
                                {type && <span className="capitalize">• {type}</span>}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
