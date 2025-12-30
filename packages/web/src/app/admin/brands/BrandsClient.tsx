'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { brandApi } from '@/lib/brandApi';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';

import { COUNTRIES, BRAND_TAGS } from '@/lib/constants';
import { MagnifyingGlassIcon as MagnifyingGlassOutlineIcon, FunnelIcon, ArrowsUpDownIcon, Squares2X2Icon, PencilSquareIcon } from '@heroicons/react/24/outline'; // Assumed imports
// (Make sure to import icons if they are missing or use available ones)

import { getImageUrl } from '@/lib/utils';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export default function AdminBrandsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [brands, setBrands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter/Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedTag, setSelectedTag] = useState('');



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
            // Fetch all brands (limit 1000) to ensure we see everything
            const response = await brandApi.getBrands({ limit: 1000, businessType: 'brand' });
            setBrands(Array.isArray(response) ? response : (response as any).brands || []);
            console.log('AdminBrandsPage: Fetched brands:', Array.isArray(response) ? response : (response as any).brands);
        } catch (error) {
            console.error('Failed to fetch brands', error);
            toast.error('Failed to load brands');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        if (url.startsWith('/api')) return url;

        // Normalize path: strip leading slash
        let path = url.startsWith('/') ? url.substring(1) : url;

        // Handle /storage prefix from backend
        if (path.startsWith('storage/')) {
            path = path.substring('storage/'.length);
        }

        return `/api/storage/${path}`;
    };

    // Filter & Sort Logic
    const processedBrands = brands.filter(brand => {
        const info = brand.brandInfo || {};
        const nameMatch = (info.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = (info.contactInfo?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const countryMatch = !selectedCountry || info.country === selectedCountry;
        // Tags check: if selectedTag is set, brand.tags must include it
        const tagMatch = !selectedTag || (info.tags && info.tags.includes(selectedTag));

        return (nameMatch || emailMatch) && countryMatch && tagMatch;
    }).sort((a, b) => {
        const nameA = (a.brandInfo?.name || '').toLowerCase();
        const nameB = (b.brandInfo?.name || '').toLowerCase();

        if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
        if (sortBy === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        return 0;
    });

    // Multi-select with keyboard shortcuts (Cmd/Ctrl+Click, Shift+Click, Cmd/Ctrl+A)
    const {
        selectedIds,
        handleItemClick,
        handleSelectAll,
        clearSelection,
        isSelected,
    } = useMultiSelect({
        items: processedBrands,
        getItemId: (brand) => brand.id,
    });

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage brand profiles and details. {processedBrands.length} brands found.</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                    <Link
                        href="/admin/brands/trash"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <TrashIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
                        Trash
                    </Link>
                    <Link
                        href="/admin/brands/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Brand
                    </Link>
                </div>
            </div>

            {/* Filter Bar and bulk select */}
            <div className="bg-white shadow rounded-lg p-4 mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-1" aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>

                    {/* Country Filter */}
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                        <option value="">All Countries</option>
                        {COUNTRIES.map(c => (
                            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                        ))}
                    </select>

                    {/* Tag Filter */}
                    <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                        <option value="">All Tags</option>
                        {BRAND_TAGS.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                        <option value="created_desc">Newest First</option>
                    </select>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                    <input
                        type="checkbox"
                        checked={processedBrands.length > 0 && selectedIds.size === processedBrands.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Select All ({processedBrands.length})</span>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {processedBrands.map((brand) => (
                        <li key={brand.id} className={selectedIds.has(brand.id) ? 'bg-blue-50' : ''}>
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="mr-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(brand.id)}
                                        onClick={(e) => handleItemClick(brand.id, e)}
                                        onChange={() => { }} // Controlled by onClick for keyboard modifiers
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        {brand.brandInfo?.logo ? (
                                            <img src={getImageUrl(brand.brandInfo.logo)} alt={brand.brandInfo.name} className="h-16 w-16 rounded-md mr-4 object-contain bg-white border border-gray-100" />
                                        ) : (
                                            <div className="h-16 w-16 rounded-md bg-gray-100 mr-4 flex items-center justify-center text-gray-400 font-bold border border-gray-200">
                                                {brand.brandInfo?.name?.substring(0, 2).toUpperCase() || '??'}
                                            </div>
                                        )}
                                        <div className="truncate">
                                            <div className="flex text-sm items-center gap-2">
                                                <p className="font-medium text-blue-600 truncate">{brand.brandInfo?.name || 'Unnamed Brand'}</p>
                                                {brand.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                                {brand.brandInfo?.country && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600 border border-gray-200">
                                                        {COUNTRIES.find(c => c.name === brand.brandInfo.country)?.flag} {brand.brandInfo.country}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500">
                                                <p className="truncate max-w-xs">{brand.brandInfo?.description || 'No description'}</p>
                                                {brand.brandInfo?.tags && brand.brandInfo.tags.length > 0 && (
                                                    <div className="hidden sm:flex flex-wrap gap-1 ml-2">
                                                        {brand.brandInfo.tags.map((t: string) => (
                                                            <span key={t} className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0 flex gap-2">
                                    <Link
                                        href={`/admin/brands/${brand.brandInfo?.slug || brand.id}`}
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
                    {processedBrands.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No brands found matching your criteria.
                        </li>
                    )}
                </ul>
            </div>

            <BulkActionsBar
                selectedCount={selectedIds.size}
                selectedIds={Array.from(selectedIds)}
                onClearSelection={clearSelection}
                onSuccess={() => { clearSelection(); fetchBrands(); }}
            />
        </div>
    );
}
