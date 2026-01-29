'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TaggedContentResponse, TagType } from '@vangarments/shared';
import { tagApi } from '@/lib/tagApi';
import Link from 'next/link';
import { PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface TaggedContentGridProps {
    entityType: TagType;
    entityId: string;
    initialData?: TaggedContentResponse;
    className?: string;
}

export default function TaggedContentGrid({
    entityType,
    entityId,
    initialData,
    className = '',
}: TaggedContentGridProps) {
    const [data, setData] = useState<TaggedContentResponse | null>(initialData || null);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Load tagged content
    const loadContent = useCallback(async (pageNum: number, append = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await tagApi.getTaggedContent(entityType, entityId, pageNum, 20);
            if (append && data) {
                setData({
                    ...response,
                    items: [...data.items, ...response.items],
                });
            } else {
                setData(response);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load tagged content');
        } finally {
            setIsLoading(false);
        }
    }, [entityType, entityId, data]);

    // Initial load
    useEffect(() => {
        if (!initialData) {
            loadContent(1);
        }
    }, [entityType, entityId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load more
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadContent(nextPage, true);
    };

    // Get link for source
    const getSourceLink = (source: any): string => {
        switch (source.type) {
            case 'lookbook_image':
                return `/lookbooks/${source.id}`;
            case 'post_image':
                return `/social/posts/${source.id}`;
            case 'wardrobe_image':
                return `/wardrobe/${source.vufsCode || source.id}`;
            default:
                return '#';
        }
    };

    // Get source type label
    const getSourceTypeLabel = (sourceType: string): string => {
        switch (sourceType) {
            case 'lookbook_image':
                return 'Lookbook';
            case 'post_image':
                return 'Post';
            case 'wardrobe_image':
                return 'Wardrobe';
            default:
                return 'Media';
        }
    };

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => loadContent(1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    if (!data || data.items.length === 0) {
        if (isLoading) {
            return (
                <div className={`grid grid-cols-3 gap-1 ${className}`}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded" />
                    ))}
                </div>
            );
        }

        return (
            <div className={`flex flex-col items-center justify-center py-12 text-gray-500 ${className}`}>
                <PhotoIcon className="w-12 h-12 mb-4 text-gray-300" />
                <p>No tagged content yet</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Grid of tagged content */}
            <div className="grid grid-cols-3 gap-1">
                {data.items.map((item) => (
                    <Link
                        key={item.tag.id}
                        href={getSourceLink(item.source)}
                        className="relative aspect-square group"
                    >
                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.source.imageUrl}
                            alt={item.source.title || 'Tagged content'}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                            <p className="text-xs font-medium uppercase tracking-wide">
                                {getSourceTypeLabel(item.source.type)}
                            </p>
                            {item.source.title && (
                                <p className="text-sm font-semibold text-center line-clamp-2 mt-1">
                                    {item.source.title}
                                </p>
                            )}
                            {item.source.owner && (
                                <p className="text-xs mt-2 opacity-80">
                                    by {item.source.owner.name}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Load more button */}
            {data.hasMore && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>Load more</>
                        )}
                    </button>
                </div>
            )}

            {/* Total count */}
            <p className="text-center text-sm text-gray-500 mt-4">
                {data.total} tagged {data.total === 1 ? 'photo' : 'photos'}
            </p>
        </div>
    );
}
