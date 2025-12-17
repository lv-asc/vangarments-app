'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

type EntityType = 'brand' | 'store' | 'supplier' | 'page';

interface FollowEntityButtonProps {
    entityType: EntityType;
    entityId: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowEntityButton({
    entityType,
    entityId,
    className = '',
    size = 'md',
    onFollowChange,
}: FollowEntityButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        checkFollowStatus();
    }, [entityType, entityId]);

    const checkFollowStatus = async () => {
        try {
            const following = await apiClient.isFollowingEntity(entityType, entityId);
            setIsFollowing(following);
        } catch (error) {
            console.error('Failed to check follow status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async () => {
        if (actionLoading) return;

        setActionLoading(true);
        try {
            if (isFollowing) {
                await apiClient.unfollowEntity(entityType, entityId);
                setIsFollowing(false);
                onFollowChange?.(false);
            } else {
                await apiClient.followEntity(entityType, entityId);
                setIsFollowing(true);
                onFollowChange?.(true);
            }
        } catch (error: any) {
            console.error('Failed to toggle follow:', error);
            // If unauthorized, user needs to log in
            if (error.status === 401) {
                // Could redirect to login or show modal
                alert('Please log in to follow');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base',
    };

    if (loading) {
        return (
            <button
                disabled
                className={`${sizeClasses[size]} rounded-lg border border-gray-300 bg-gray-100 text-gray-400 font-medium ${className}`}
            >
                ...
            </button>
        );
    }

    return (
        <button
            onClick={handleToggleFollow}
            disabled={actionLoading}
            className={`
                ${sizeClasses[size]}
                rounded-lg font-medium transition-all duration-200
                ${isFollowing
                    ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }
                ${actionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            {actionLoading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </span>
            ) : isFollowing ? (
                <span className="group-hover:hidden">Following</span>
            ) : (
                'Follow'
            )}
        </button>
    );
}

export default FollowEntityButton;
