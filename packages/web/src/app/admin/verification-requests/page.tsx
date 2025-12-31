'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthWrapper';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import {
    CheckBadgeIcon,
    XMarkIcon,
    ClockIcon,
    DocumentTextIcon,
    UserIcon,
    BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface VerificationRequest {
    id: string;
    userId?: string;
    entityId?: string;
    requestType: 'user' | 'entity';
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    supportingDocuments?: string[];
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    createdAt: string;
    updatedAt: string;
    // Populated data
    user?: any;
    entity?: any;
}

export default function VerificationRequestsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        if (!user?.roles?.includes('admin')) {
            router.push('/');
            return;
        }
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);

            const response = await apiClient.get(`/verification/requests?${params.toString()}`);
            setRequests(response.requests || []);
        } catch (error: any) {
            console.error('Failed to load verification requests:', error);
            toast.error(error.message || 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        try {
            await apiClient.put(`/verification/requests/${requestId}/approve`, {
                reviewNotes
            });
            toast.success('Verification request approved');
            setReviewingId(null);
            setReviewNotes('');
            loadRequests();
        } catch (error: any) {
            console.error('Failed to approve request:', error);
            toast.error(error.message || 'Failed to approve request');
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await apiClient.put(`/verification/requests/${requestId}/reject`, {
                reviewNotes
            });
            toast.success('Verification request rejected');
            setReviewingId(null);
            setReviewNotes('');
            loadRequests();
        } catch (error: any) {
            console.error('Failed to reject request:', error);
            toast.error(error.message || 'Failed to reject request');
        }
    };

    const getRequestName = (request: VerificationRequest) => {
        if (request.requestType === 'user' && request.user) {
            return request.user.personalInfo?.name || request.user.username || 'Unknown User';
        }
        if (request.requestType === 'entity' && request.entity) {
            return request.entity.brandName || request.entity.name || 'Unknown Entity';
        }
        return 'Unknown';
    };

    const getRequestLink = (request: VerificationRequest) => {
        if (request.requestType === 'user' && request.user) {
            return `/u/${request.user.username}`;
        }
        if (request.requestType === 'entity' && request.entity) {
            return `/brands/${request.entity.slug || request.entityId}`;
        }
        return '#';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <CheckBadgeIcon className="w-8 h-8 text-blue-500" />
                    <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${filter === status
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                                {requests.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {requests.length === 0 ? (
                <div className="text-center py-16">
                    <CheckBadgeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-gray-900 mb-2">No requests found</h2>
                    <p className="text-gray-500">
                        {filter === 'pending'
                            ? 'No pending verification requests at the moment'
                            : `No ${filter} verification requests`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {request.requestType === 'user' ? (
                                        <UserIcon className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <BuildingStorefrontIcon className="w-6 h-6 text-gray-400" />
                                    )}
                                    <div>
                                        <Link
                                            href={getRequestLink(request)}
                                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            {getRequestName(request)}
                                        </Link>
                                        <p className="text-sm text-gray-500">
                                            {request.requestType === 'user' ? 'User' : 'Entity'} Verification Request
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Reason */}
                            {request.reason && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-1">Reason:</h4>
                                    <p className="text-sm text-gray-600">{request.reason}</p>
                                </div>
                            )}

                            {/* Supporting Documents */}
                            {request.supportingDocuments && request.supportingDocuments.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Supporting Links:</h4>
                                    <div className="space-y-1">
                                        {request.supportingDocuments.map((doc, index) => (
                                            <a
                                                key={index}
                                                href={doc}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                <DocumentTextIcon className="w-4 h-4" />
                                                {doc}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review Notes */}
                            {request.reviewNotes && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-700 mb-1">Admin Notes:</h4>
                                    <p className="text-sm text-gray-600">{request.reviewNotes}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                                {request.reviewedAt && (
                                    <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                                )}
                            </div>

                            {/* Actions for Pending Requests */}
                            {request.status === 'pending' && (
                                <div className="border-t border-gray-200 pt-4">
                                    {reviewingId === request.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={reviewNotes}
                                                onChange={(e) => setReviewNotes(e.target.value)}
                                                placeholder="Add review notes (optional)"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(request.id)}
                                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setReviewingId(null);
                                                        setReviewNotes('');
                                                    }}
                                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setReviewingId(request.id)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Review Request
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
