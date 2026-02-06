'use client';

import React, { useState, useEffect } from 'react';
import { brandApi } from '@/lib/brandApi';
import { useAuth } from '@/contexts/AuthContext';

interface FollowEntityButtonProps {
    entityType: string;
    entityId: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowEntityButton({ entityType, entityId, size = 'md', className = '', onFollowChange }: FollowEntityButtonProps) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!user || !entityId) {
            setIsChecking(false);
            return;
        }

        const checkStatus = async () => {
            try {
                const status = await brandApi.checkEntityFollowStatus(entityType, entityId);
                setIsFollowing(status.isFollowing);
            } catch (error) {
                console.error('Failed to check follow status:', error);
            } finally {
                setIsChecking(false);
            }
        };

        checkStatus();
    }, [user, entityId, entityType]);

    const handleToggleFollow = async () => {
        if (!user) return;

        setIsLoading(true);
        const originalState = isFollowing;

        // Optimistic update
        setIsFollowing(!originalState);

        try {
            if (originalState) {
                await brandApi.unfollowEntity(entityType, entityId);
            } else {
                await brandApi.followEntity(entityType, entityId);
            }
            // Trigger callback if provided
            if (onFollowChange) onFollowChange(!originalState);
        } catch (error) {
            // Revert on error
            setIsFollowing(originalState);
            console.error('Failed to toggle follow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return <div className={`animate-pulse bg-gray-200 rounded-lg ${size === 'sm' ? 'w-20 h-8' : 'w-24 h-10'} ${className}`} />;
    }

    const baseClasses = "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2";
    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    const activeClasses = isFollowing
        ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
        : "bg-gray-900 border border-transparent text-white hover:bg-gray-800 focus:ring-gray-900";

    return (
        <button
            onClick={handleToggleFollow}
            disabled={isLoading}
            className={`${baseClasses} ${sizeClasses[size]} ${activeClasses} ${className} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
            {isLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
        </button>
    );
}
