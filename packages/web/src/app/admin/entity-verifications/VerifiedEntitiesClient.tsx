'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { brandApi } from '@/lib/brandApi';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';

export default function VerifiedEntitiesClient() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [entities, setEntities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            fetchEntities();
        }
    }, [user, authLoading, router]);

    const fetchEntities = async () => {
        try {
            setLoading(true);
            // Fetch all brands/entities
            const data = await brandApi.getBrands({ limit: 1000 });
            setEntities(data);
        } catch (error) {
            console.error('Failed to fetch entities', error);
            toast.error('Failed to load entities');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (entityId: string, status: 'verified' | 'rejected' | 'pending') => {
        try {
            // Backend verifyBrand expects 'verified' or 'rejected'
            // If we want to reset to pending, we might need a different endpoint or updateBrand
            // For now, let's treat 'pending' as a manual reset if possible, 
            // but verifyBrand explicitly checks for ['verified', 'rejected']

            if (status === 'pending') {
                // Fallback to updateBrand if we need to reset to pending
                await brandApi.updateBrand(entityId, { verificationStatus: 'pending' } as any);
            } else {
                await brandApi.verifyBrand(entityId, status, 'Admin action');
            }

            toast.success(`Entity ${status} successfully`);
            fetchEntities();
        } catch (error: any) {
            console.error('Failed to update verification status', error);
            toast.error(error.message || 'Failed to update status');
        }
    };

    const filteredEntities = entities.filter(entity => {
        const name = entity.brandInfo?.name?.toLowerCase() || '';
        const matchesSearch = name.includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || entity.verificationStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-sm text-gray-500 hover:text-blue-600 flex items-center mb-2">
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Entity Verifications</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage the verification status of brands, stores, and suppliers.
                    </p>
                </div>
            </div>

            <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative max-w-xs w-full">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search entities..."
                            className="pl-10 block w-full rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter:</span>
                        <select
                            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pr-10"
                            value={filterStatus}
                            onChange={(e: any) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEntities.map((entity) => (
                                <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 p-1">
                                                {entity.brandInfo?.logo ? (
                                                    <img src={getImageUrl(entity.brandInfo.logo)} alt="" className="h-full w-full object-contain" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">
                                                        {entity.brandInfo?.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                                    {entity.brandInfo?.name}
                                                    {entity.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                                </div>
                                                <div className="text-sm text-gray-500">@{entity.brandInfo?.slug || entity.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 uppercase">
                                            {entity.brandInfo?.businessType || 'brand'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            {entity.verificationStatus === 'verified' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                    Verified
                                                </span>
                                            ) : entity.verificationStatus === 'rejected' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                                    Rejected
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <ClockIcon className="h-4 w-4 mr-1" />
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {entity.verificationStatus !== 'verified' && (
                                                <button
                                                    onClick={() => handleVerify(entity.id, 'verified')}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            {entity.verificationStatus !== 'rejected' && (
                                                <button
                                                    onClick={() => handleVerify(entity.id, 'rejected')}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Reject
                                                </button>
                                            )}
                                            {entity.verificationStatus !== 'pending' && (
                                                <button
                                                    onClick={() => handleVerify(entity.id, 'pending')}
                                                    className="text-gray-400 hover:text-gray-600 px-3 py-1"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredEntities.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                                        No entities found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
