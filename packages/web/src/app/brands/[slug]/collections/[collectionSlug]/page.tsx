'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { brandApi, BrandCollection, BrandLookbook } from '@/lib/brandApi';
import { getImageUrl } from '@/lib/utils';
import SKUCard from '@/components/ui/SKUCard';


export default function BrandCollectionPage() {
    const params = useParams();
    const router = useRouter();
    const { slug, collectionSlug } = params as { slug: string; collectionSlug: string };

    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<BrandCollection | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [lookbooks, setLookbooks] = useState<BrandLookbook[]>([]);
    const [brandName, setBrandName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!slug || !collectionSlug) return;

            try {
                setLoading(true);
                // 1. Resolve Brand from Slug
                const brandData = await brandApi.getBrand(slug);
                if (!brandData) {
                    setError('Brand not found');
                    return;
                }
                setBrandName(brandData.brandInfo.name);

                // 2. Fetch Collection using Brand ID and slug/id
                const data = await brandApi.getCollection(brandData.id, collectionSlug);
                setCollection(data.collection);
                setItems(data.items || []);
                setLookbooks((data as any).lookbooks || []);

            } catch (err: any) {
                console.error('Failed to load collection:', err);
                setError(err.message || 'Failed to load collection');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [slug, collectionSlug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Collection Not Found</h1>
                    <p className="text-gray-500 mb-8">{error || "The collection you're looking for doesn't exist or has been removed."}</p>
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
                            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                                {collection.collectionType && (
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">{collection.collectionType}</span>
                                )}
                                {collection.season && <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">{collection.season}</span>}
                                {collection.year && <span>{collection.year}</span>}
                            </div>
                        </div>
                    </div>

                    {collection.description && (
                        <p className="mt-4 text-gray-600 max-w-3xl">{collection.description}</p>
                    )}
                </div>

                {/* Cover Image */}
                {collection.coverImageUrl && (
                    <div className="mb-12">
                        <div className="aspect-[3/1] bg-gray-100 rounded-xl overflow-hidden">
                            <img
                                src={getImageUrl(collection.coverImageUrl)}
                                alt={collection.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Items Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 font-primary">Items</h2>
                    {items && items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item: any, idx: number) => (
                                <SKUCard key={item.id || idx} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 font-primary">
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-gray-500">No items in this collection yet.</p>
                        </div>
                    )}
                </section>

                {/* Lookbooks Section */}
                {lookbooks.length > 0 && (
                    <section className="mb-12 pt-8 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Lookbooks</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lookbooks.map((lookbook) => (
                                <Link
                                    key={lookbook.id}
                                    href={`/brands/${slug}/lookbooks/${lookbook.slug || lookbook.id}`}
                                    className="group"
                                >
                                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="aspect-[4/3] bg-gray-100">
                                            {lookbook.coverImageUrl ? (
                                                <img
                                                    src={getImageUrl(lookbook.coverImageUrl)}
                                                    alt={lookbook.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{lookbook.name}</h3>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {lookbook.season && <span>{lookbook.season}</span>}
                                                {lookbook.season && lookbook.year && <span> • </span>}
                                                {lookbook.year && <span>{lookbook.year}</span>}
                                            </div>
                                            {lookbook.description && (
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{lookbook.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
