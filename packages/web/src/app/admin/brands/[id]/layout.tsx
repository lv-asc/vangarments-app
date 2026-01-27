'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/Modal';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import { BrandProvider, useBrand } from '@/components/admin/BrandProvider';
import { useEntityConfiguration } from '@/hooks/useEntityConfiguration';

function BrandLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const brandId = params.id as string;
    const { brand, loading } = useBrand();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { hasFeature } = useEntityConfiguration('brand');

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    // Update document title when brand is loaded
    useEffect(() => {
        if (brand?.brandInfo?.name) {
            document.title = `Admin | Brand @${brand.brandInfo.name}`;
        }
    }, [brand]);

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await brandApi.deleteBrand(brand?.id || brandId);
            toast.success('Brand moved to trash');
            router.push('/admin/brands');
        } catch (error: any) {
            console.error('Failed to delete brand', error);
            toast.error(error.message || 'Failed to delete brand');
        } finally {
            setDeleting(false);
        }
    };

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/[®™©]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const displaySlug = brand?.brandInfo?.slug || slugify(brand?.brandInfo?.name || '') || brandId;

    // Determine active tab from pathname
    const getActiveTab = () => {
        if (pathname?.includes('/details')) return 'details';
        if (pathname?.includes('/lines')) return 'lines';
        if (pathname?.includes('/collections')) return 'collections';
        if (pathname?.includes('/lookbooks')) return 'lookbooks';
        if (pathname?.includes('/skus')) return 'skus';
        if (pathname?.includes('/team')) return 'team';
        if (pathname?.includes('/silhouettes')) return 'silhouettes';
        return 'details';
    };

    const activeTab = getActiveTab();

    const tabClassName = (isActive: boolean) =>
        `${isActive
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/brands" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Brands
                </Link>
                <div className="flex space-x-3">
                    <a
                        href={`/brands/${displaySlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Brand
                    </a>
                </div>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Brand'}
                </button>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Brand"
            >
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete this brand? It will be moved to trash and can be restored later.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Brand</h1>
                        <p className="mt-1 text-sm text-gray-500">Update brand details, lines, collections and official SKUs.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 overflow-x-auto">
                    <nav className="-mb-px flex px-6 space-x-8" aria-label="Tabs">
                        <Link
                            href={`/admin/brands/${brandId}/details`}
                            className={tabClassName(activeTab === 'details')}
                        >
                            Details
                        </Link>
                        {hasFeature('lines') && (
                            <Link
                                href={`/admin/brands/${brandId}/lines`}
                                className={tabClassName(activeTab === 'lines')}
                            >
                                Lines
                            </Link>
                        )}
                        {hasFeature('collections') && (
                            <Link
                                href={`/admin/brands/${brandId}/collections`}
                                className={tabClassName(activeTab === 'collections')}
                            >
                                Collections
                            </Link>
                        )}
                        {hasFeature('lookbooks') && (
                            <Link
                                href={`/admin/brands/${brandId}/lookbooks`}
                                className={tabClassName(activeTab === 'lookbooks')}
                            >
                                Lookbooks
                            </Link>
                        )}
                        {hasFeature('skus') && (
                            <Link
                                href={`/admin/brands/${brandId}/skus`}
                                className={tabClassName(activeTab === 'skus')}
                            >
                                SKUs
                            </Link>
                        )}
                        {hasFeature('team') && (
                            <Link
                                href={`/admin/brands/${brandId}/team`}
                                className={tabClassName(activeTab === 'team')}
                            >
                                Team
                            </Link>
                        )}
                        <Link
                            href={`/admin/brands/${brandId}/silhouettes`}
                            className={tabClassName(activeTab === 'silhouettes')}
                        >
                            Silhouettes
                        </Link>
                    </nav>
                </div>

                {/* Page content */}
                {children}
            </div>
        </div>
    );
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const brandId = params.id as string;

    return (
        <BrandProvider brandId={brandId}>
            <BrandLayoutContent>{children}</BrandLayoutContent>
        </BrandProvider>
    );
}
