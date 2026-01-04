'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

interface SKUCardProps {
    item: any;
    layout?: 'grid' | 'list';
}

/**
 * Strip size suffix from product name (e.g., "Asphalt T-Shirt (Black) [S]" -> "Asphalt T-Shirt (Black)")
 */
function stripSizeSuffix(name: string): string {
    return name.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim();
}

/**
 * Universal SKU Card Component
 * Displays SKU items with variant grouping and consistent styling
 */
export default function SKUCard({ item, layout = 'list' }: SKUCardProps) {
    const [showVariants, setShowVariants] = useState(false);

    const brandName = item.brand?.name || item.brand?.brand || 'Unknown Brand';
    const brandSlug = item.brand?.slug || slugify(brandName);
    const categoryName = item.category?.page || (typeof item.category === 'string' ? item.category : 'Item');
    const imageUrl = typeof item.images?.[0] === 'string'
        ? item.images[0]
        : (item.images?.[0]?.url || item.images?.[0]?.imageUrl);

    // Backend now returns variants sorted by size order from /admin/sizes
    const variants = item.variants || [];
    const hasVariants = variants.length > 0;

    // Generate product slug from code or name
    const productSlug = item.code ? slugify(item.code) : slugify(item.name);
    const productUrl = `/items/${productSlug}`;

    // Format price
    const formatPrice = (price: number | undefined) => {
        if (!price) return null;
        return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const mainPrice = formatPrice(item.retailPriceBrl);

    // Strip size suffix from display name
    const displayName = stripSizeSuffix(item.name);

    return (
        <div className="block p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                {/* Image Link */}
                <Link href={productUrl} className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {imageUrl ? (
                        <img src={getImageUrl(imageUrl)} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <ShoppingBagIcon className="h-6 w-6" />
                        </div>
                    )}
                </Link>

                <div className="min-w-0 flex-1">
                    {/* Brand/Line/Collection Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Brand Badge */}
                        <Link
                            href={`/brands/${brandSlug}`}
                            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        >
                            <div className="h-4 w-4 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                {item.brand?.logo ? (
                                    <img src={getImageUrl(item.brand.logo)} className="h-full w-full object-contain" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-gray-400">
                                        {brandName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{brandName}</span>
                        </Link>

                        {/* Line Badge */}
                        {(item.lineInfo?.name || item.line) && (
                            <Link
                                href={`/brands/${brandSlug}?line=${item.lineId || item.lineInfo?.id || slugify(item.lineInfo?.name || item.line)}`}
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                                <div className="h-4 w-4 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                    {item.lineInfo?.logo ? (
                                        <img src={getImageUrl(item.lineInfo.logo)} className="h-full w-full object-contain" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-gray-400">
                                            L
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-600 truncate max-w-[80px]">{item.lineInfo?.name || item.line}</span>
                            </Link>
                        )}

                        {/* Collection Badge */}
                        {(item.collectionInfo?.name || item.collection) && (
                            <Link
                                href={`/brands/${brandSlug}/collections/${slugify(item.collectionInfo?.name || item.collection)}`}
                                className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                            >
                                <div className="h-4 w-4 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                    {item.collectionInfo?.coverImage ? (
                                        <img src={getImageUrl(item.collectionInfo.coverImage)} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-gray-400">
                                            C
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-600 truncate max-w-[80px]">{item.collectionInfo?.name || item.collection}</span>
                            </Link>
                        )}
                    </div>

                    <Link href={productUrl}>
                        <p className="text-xs text-gray-500 truncate hover:text-blue-600">{displayName}</p>
                    </Link>

                    {mainPrice && <p className="text-xs font-medium text-gray-700 mt-0.5">{mainPrice}</p>}
                </div>
            </div>

            {/* Variant toggles */}
            {hasVariants && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={(e) => { e.preventDefault(); setShowVariants(!showVariants); }}
                        className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-gray-700"
                    >
                        <span>{variants.length} size{variants.length > 1 ? 's' : ''} available</span>
                        <span className="text-gray-400">{showVariants ? '▲' : '▼'}</span>
                    </button>

                    {showVariants && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {variants.map((v: any) => (
                                <Link
                                    key={v.id}
                                    href={`${productUrl}?variant=${v.id}`}
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 text-gray-700"
                                >
                                    {v.size}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Helper function to slugify strings for URLs
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
