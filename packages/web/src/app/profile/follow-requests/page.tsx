'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon, BellIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import FollowRequestsList from '@/components/profile/FollowRequestsList';

export default function FollowRequestsPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [requestCount, setRequestCount] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        loadCount();
    }, [isAuthenticated]);

    const loadCount = async () => {
        try {
            const response = await apiClient.getFollowRequestCount();
            setRequestCount(response.count || 0);
        } catch (err) {
            // Ignore
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BellIcon className="h-6 w-6" />
                            Follow Requests
                            {requestCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-sm rounded-full">
                                    {requestCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            People who want to follow you
                        </p>
                    </div>
                </div>

                {/* Privacy Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Private Account:</strong> Since your account is private, people must request to follow you.
                        You can accept or decline requests here.
                    </p>
                    <Link
                        href="/profile"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                        Edit privacy settings →
                    </Link>
                </div>

                {/* Requests List */}
                <FollowRequestsList onRequestHandled={loadCount} />
            </div>
        </div>
    );
}
