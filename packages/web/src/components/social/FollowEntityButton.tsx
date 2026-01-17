'use client';

import { useState, useEffect } from 'react';
import { brandApi } from '@/lib/brandApi';
import { CheckIcon, UserPlusIcon } from '@heroicons/react/24/outline';

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
    const [status, setStatus] = useState<{ isFollowing: boolean; isFollower: boolean }>({
        isFollowing: false,
        isFollower: false
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        checkFollowStatus();
    }, [entityType, entityId]);

    const checkFollowStatus = async () => {
        if (!entityId || !entityType) return;

        try {
            // Using brandApi because it has the updated signature, assuming apiClient maps to it or is similar
            // But verify if we should use brandApi or apiClient. 
            // The file imported apiClient before. brandApi wraps it. 
            // The updated method is in brandApi.
            const result = await brandApi.checkEntityFollowStatus(entityType, entityId);
            setStatus(result);
        } catch (error) {
            console.error('[FollowEntityButton] Failed to check status:', error);
            setStatus({ isFollowing: false, isFollower: false });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (actionLoading) return;

        setActionLoading(true);
        try {
            if (status.isFollowing) {
                await brandApi.unfollowEntity(entityType, entityId);
                setStatus(prev => ({ ...prev, isFollowing: false }));
                onFollowChange?.(false);
            } else {
                await brandApi.followEntity(entityType, entityId);
                setStatus(prev => ({ ...prev, isFollowing: true }));
                onFollowChange?.(true);
            }
        } catch (error: any) {
            console.error('[FollowEntityButton] Toggle failed:', error);
            if (error.status === 401) {
                // TODO: Trigger login modal
                alert('Please log in to follow');
            } else {
                alert('Action failed. Please try again.');
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

    const isMutual = status.isFollowing && status.isFollower;
    const buttonText = isMutual ? 'Friends' : status.isFollowing ? 'Following' : 'Follow';

    return (
        <button
            onClick={handleToggleFollow}
            disabled={actionLoading}
            className={`
                flex items-center gap-1.5
                ${sizeClasses[size]}
                rounded-lg font-medium transition-all duration-200
                ${status.isFollowing
                    ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }
                ${actionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            {actionLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : status.isFollowing ? (
                <>
                    <CheckIcon className="w-4 h-4" />
                    <span>{buttonText}</span>
                </>
            ) : (
                <>
                    <UserPlusIcon className="w-4 h-4" />
                    <span>{buttonText}</span>
                </>
            )}
        </button>
    );
}

export default FollowEntityButton;
