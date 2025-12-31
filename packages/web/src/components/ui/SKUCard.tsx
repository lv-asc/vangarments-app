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
 * Universal SKU Card Component
 * Displays SKU items with variant grouping and consistent styling
 */
export default function SKUCard({ item, layout = 'list' }: SKUCardProps) {
    const [showVariants, setShowVariants] = useState(false);

    const brandName = item.brand?.name || item.brand?.brand || 'Unknown Brand';
    const brandSlug = item.brand?.slug || slugify(brandName);
    const categoryName = item.category?.page || (typeof item.category === 'string' ? item.category : 'Item');
    const imageUrl = item.images?.[0]?.url || item.images?.[0]?.imageUrl;
    const variants = item.variants || [];
    const hasVariants = variants.length > 0;

    // Generate product slug from code or name
    const productSlug = item.code ? slugify(item.code) : slugify(item.name);
    const productUrl = `/brands/${brandSlug}/${productSlug}`;

    // Format price
    const formatPrice = (price: number | undefined) => {
        if (!price) return null;
        return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const mainPrice = formatPrice(item.retailPriceBrl);

    return (
        <div className="block p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <Link href={productUrl} className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {imageUrl ? (
                        <img src={getImageUrl(imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <ShoppingBagIcon className="h-6 w-6" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{brandName}</p>
                    <p className="text-xs text-gray-500 truncate">{item.name}</p>
                    {mainPrice && <p className="text-xs font-medium text-gray-700 mt-0.5">{mainPrice}</p>}
                </div>
            </Link>

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
