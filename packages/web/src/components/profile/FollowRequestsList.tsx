'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import Link from 'next/link';
import {
    CheckIcon,
    XMarkIcon,
    UserIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface FollowRequest {
    id: string;
    username: string;
    personalInfo?: {
        name?: string;
        avatarUrl?: string;
    };
    requestedAt?: string;
}

interface FollowRequestsListProps {
    onRequestHandled?: () => void;
}

export function FollowRequestsList({ onRequestHandled }: FollowRequestsListProps) {
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getFollowRequests() as any;
            setRequests(response.requests || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load follow requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requesterId: string) => {
        try {
            setProcessingId(requesterId);
            await apiClient.acceptFollowRequest(requesterId);
            setRequests(prev => prev.filter(r => r.id !== requesterId));
            onRequestHandled?.();
        } catch (err: any) {
            toast.error(err.message || 'Failed to accept request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (requesterId: string) => {
        try {
            setProcessingId(requesterId);
            await apiClient.declineFollowRequest(requesterId);
            setRequests(prev => prev.filter(r => r.id !== requesterId));
            onRequestHandled?.();
        } catch (err: any) {
            toast.error(err.message || 'Failed to decline request');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                {error}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No pending follow requests</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {requests.map((request) => (
                <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                    <Link
                        href={`/u/${request.username}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                    >
                        {request.personalInfo?.avatarUrl ? (
                            <img
                                src={getImageUrl(request.personalInfo.avatarUrl)}
                                alt={request.personalInfo?.name || request.username}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                                {request.personalInfo?.name || request.username}
                            </p>
                            <p className="text-sm text-gray-500 truncate">@{request.username}</p>
                            {request.requestedAt && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <ClockIcon className="h-3 w-3" />
                                    {new Date(request.requestedAt).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </Link>

                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={() => handleAccept(request.id)}
                            disabled={processingId === request.id}
                            className="flex items-center gap-1 px-4 py-2 bg-[#00132d] text-white rounded-lg hover:bg-[#00132d]/90 transition-colors disabled:opacity-50"
                        >
                            {processingId === request.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <CheckIcon className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">Accept</span>
                        </button>
                        <button
                            onClick={() => handleDecline(request.id)}
                            disabled={processingId === request.id}
                            className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">Decline</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default FollowRequestsList;
