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
    const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'pending' | 'verified' | 'rejected'>('all');
    const [filterType, setFilterType] = useState<string>('all');

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
            // Import api client
            const { default: api } = await import('@/lib/api');
            // Fetch all entities (users, brands, pages, etc.)
            const data = await api.getAllEntities();
            setEntities(data);
        } catch (error) {
            console.error('Failed to fetch entities', error);
            toast.error('Failed to load entities');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (entity: any, status: 'not_started' | 'verified' | 'rejected' | 'pending') => {
        try {
            const { default: api } = await import('@/lib/api');
            await api.updateEntityVerification(entity.id, status, entity.entityType || entity.brandInfo?.businessType || 'BRAND');
            toast.success(`Entity ${status === 'not_started' ? 'reset' : status} successfully`);
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
        const matchesType = filterType === 'all' || (entity.brandInfo?.businessType || 'BRAND') === filterType;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Get unique types for the filter
    const entityTypes = Array.from(new Set(entities.map(e => e.brandInfo?.businessType || 'BRAND'))).filter(Boolean);

    // Group entities by type
    const groupedEntities = filteredEntities.reduce((acc: { [key: string]: any[] }, entity) => {
        const type = entity.brandInfo?.businessType || 'BRAND';
        if (!acc[type]) acc[type] = [];
        acc[type].push(entity);
        return acc;
    }, {});

    const sortedTypes = Object.keys(groupedEntities).sort();

    const getFilterLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            'all': 'All',
            'brand': 'Brands',
            'BRAND': 'Brands',
            'store': 'Stores',
            'STORE': 'Stores',
            'supplier': 'Suppliers',
            'SUPPLIER': 'Suppliers',
            'manufacturer': 'Suppliers',
            'MANUFACTURER': 'Suppliers',
            'non_profit': 'Non-Profits',
            'NON_PROFIT': 'Non-Profits',
            'designer': 'Designers',
            'DESIGNER': 'Designers',
            'user': 'Users',
            'USER': 'Users',
            'page': 'Pages',
            'PAGE': 'Pages'
        };
        return labels[type] || (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());
    };

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
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Type:</span>
                        <select
                            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pr-10"
                            value={filterType}
                            onChange={(e: any) => setFilterType(e.target.value)}
                        >
                            <option value="all">All</option>
                            {entityTypes.map(type => (
                                <option key={type} value={type}>{getFilterLabel(type)}</option>
                            ))}
                        </select>

                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap ml-2">Status:</span>
                        <select
                            className="rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 pr-10"
                            value={filterStatus}
                            onChange={(e: any) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="not_started">Not Started</option>
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
                            {sortedTypes.map((type) => (
                                <React.Fragment key={type}>
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={4} className="px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {getFilterLabel(type)} ({groupedEntities[type].length})
                                        </td>
                                    </tr>
                                    {groupedEntities[type].map((entity) => (
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
                                                    {getFilterLabel(entity.brandInfo?.businessType || 'brand')}
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
                                                    ) : entity.verificationStatus === 'pending' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <ClockIcon className="h-4 w-4 mr-1" />
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            Not Started
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    {entity.verificationStatus !== 'verified' && (
                                                        <button
                                                            onClick={() => handleVerify(entity, 'verified')}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                    {entity.verificationStatus !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleVerify(entity, 'rejected')}
                                                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                    {entity.verificationStatus !== 'not_started' && entity.verificationStatus !== 'pending' && (
                                                        <button
                                                            onClick={() => handleVerify(entity, 'not_started')}
                                                            className="text-gray-400 hover:text-gray-600 px-3 py-1"
                                                        >
                                                            Reset
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
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
