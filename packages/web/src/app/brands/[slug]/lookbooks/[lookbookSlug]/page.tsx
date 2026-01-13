'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { brandApi, BrandLookbook } from '@/lib/brandApi';
import { getImageUrl } from '@/lib/utils';
import SKUCard from '@/components/ui/SKUCard';


export default function BrandLookbookPage() {
    const params = useParams();
    const router = useRouter();
    const { slug, lookbookSlug } = params as { slug: string; lookbookSlug: string };

    const [loading, setLoading] = useState(true);
    const [lookbook, setLookbook] = useState<BrandLookbook | null>(null);
    const [items, setItems] = useState<any[]>([]); // Lookbook items if needed
    const [brandName, setBrandName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!slug || !lookbookSlug) return;

            try {
                setLoading(true);
                // 1. Resolve Brand ID from Slug
                // We use getBrand because getLookbook requires UUID brandId, but URL has slug
                const brandData = await brandApi.getBrand(slug);
                if (!brandData) {
                    setError('Brand not found');
                    return;
                }
                setBrandName(brandData.brandInfo.name);

                // 2. Fetch Lookbook using real Brand ID and slug/id
                const { lookbook: loadedLookbook, items: loadedItems } = await brandApi.getLookbook(brandData.id, lookbookSlug);
                setLookbook(loadedLookbook);
                setItems(loadedItems || []);

            } catch (err: any) {
                console.error('Failed to load lookbook:', err);
                setError(err.message || 'Failed to load lookbook');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [slug, lookbookSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">

                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error || !lookbook) {
        return (
            <div className="min-h-screen bg-white">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Lookbook Not Found</h1>
                    <p className="text-gray-500 mb-8">{error || "The lookbook you're looking for doesn't exist or has been removed."}</p>
                    <Link
                        href={`/brands/${slug}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Back to Brand
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/brands/${slug}`}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to {brandName}
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{lookbook.name}</h1>
                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                                {lookbook.season && <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">{lookbook.season}</span>}
                                {lookbook.year && <span>{lookbook.year}</span>}
                            </div>
                        </div>
                    </div>

                    {lookbook.description && (
                        <p className="mt-4 text-gray-600 max-w-3xl">{lookbook.description}</p>
                    )}
                </div>

                {/* Images Grid */}
                <div className="space-y-8">
                    {lookbook.images && lookbook.images.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lookbook.images.map((image, index) => (
                                <div key={index} className="group relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <img
                                        src={getImageUrl(image)}
                                        alt={`${lookbook.name} - Image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-gray-500">No images in this lookbook.</p>
                        </div>
                    )}
                </div>

                {/* Lookbook Items Section */}
                {items && items.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-primary">Featured Items</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item, idx) => (
                                <SKUCard key={item.id || idx} item={item} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
