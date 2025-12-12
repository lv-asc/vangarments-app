'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { brandApi } from '@/lib/brandApi';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminBrandsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            fetchBrands();
        }
    }, [user, authLoading, router]);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            // Assuming brandApi has a method to get all brands or using existing one
            const response = await brandApi.getBrands(); // Function name might need adjust based on existing API
            setBrands(Array.isArray(response) ? response : (response as any).brands || []);
        } catch (error) {
            console.error('Failed to fetch brands', error);
            toast.error('Failed to load brands');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this brand?')) return;

        try {
            // Implement delete if available, otherwise just warn
            // await brandApi.deleteBrand(id); 
            // toast.success('Brand deleted');
            // fetchBrands();
            toast.error('Delete function not yet implemented in API wrapper');
        } catch (error) {
            toast.error('Failed to delete brand');
        }
    };

    if (authLoading || (loading && !brands.length)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage brand profiles and details.</p>
                </div>
                <Link
                    href="/brands/new" // Or modal add
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Brand
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {brands.map((brand) => (
                        <li key={brand.id}>
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        {brand.logoUrl ? (
                                            <img src={brand.logoUrl} alt={brand.name} className="h-10 w-10 rounded-full mr-4 object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-200 mr-4 flex items-center justify-center text-gray-500 font-bold">
                                                {brand.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="truncate">
                                            <div className="flex text-sm">
                                                <p className="font-medium text-blue-600 truncate">{brand.name}</p>
                                            </div>
                                            <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <p className="truncate">{brand.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0 flex gap-2">
                                    <Link
                                        href={`/brands/${brand.id}/edit`}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                                    </Link>
                                    {/*
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  */}
                                </div>
                            </div>
                        </li>
                    ))}
                    {brands.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No brands found.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
