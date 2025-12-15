'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/20/solid';

export default function AdminBrandTrashPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            loadTrash();
        }
    }, [user, authLoading, router]);

    const loadTrash = async () => {
        try {
            setLoading(true);
            const trashBrands = await brandApi.getTrashBrands();
            setBrands(trashBrands);
        } catch (error) {
            console.error('Failed to load trash', error);
            toast.error('Failed to load trash items');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (brandId: string) => {
        try {
            setActionLoading(brandId);
            await brandApi.restoreBrand(brandId);
            toast.success('Brand restored successfully');
            setBrands(prev => prev.filter(b => b.id !== brandId));
        } catch (error: any) {
            console.error('Failed to restore brand', error);
            toast.error(error.message || 'Failed to restore brand');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermanentDelete = async (brandId: string) => {
        if (!window.confirm('Are you sure? This cannot be undone.')) {
            return;
        }

        try {
            setActionLoading(brandId);
            await brandApi.permanentDeleteBrand(brandId);
            toast.success('Brand permanently deleted');
            setBrands(prev => prev.filter(b => b.id !== brandId));
        } catch (error: any) {
            console.error('Failed to delete brand', error);
            toast.error(error.message || 'Failed to delete brand');
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading || loading) return <div className="p-10 flex justify-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                        <Link href="/admin/brands" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mr-4">
                            <ArrowLeftIcon className="h-4 w-4 mr-1" />
                            Back to Brands
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Brand Trash
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage deleted brands. Restore them or delete permenantly.
                    </p>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {brands.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500">
                            Trash is empty.
                        </li>
                    ) : (
                        brands.map((brand) => (
                            <li key={brand.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium text-blue-600 truncate">
                                            {brand.brandInfo?.name || 'Unnamed Brand'}
                                        </p>
                                        {brand.verificationStatus === 'verified' && (
                                            <ShieldCheckIcon className="ml-1.5 h-4 w-4 text-blue-500" aria-hidden="true" />
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center text-sm text-gray-500">
                                        <span className="truncate">
                                            Deleted: {brand.deletedAt ? new Date(brand.deletedAt).toLocaleDateString() : 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleRestore(brand.id)}
                                        disabled={actionLoading === brand.id}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <ArrowPathIcon className="h-3 w-3 mr-1" />
                                        Restore
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(brand.id)}
                                        disabled={actionLoading === brand.id}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <TrashIcon className="h-3 w-3 mr-1" />
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
