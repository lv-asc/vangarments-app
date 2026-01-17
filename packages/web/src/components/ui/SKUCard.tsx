'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { ApparelIcon } from '@/components/ui/ApparelIcons';

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

    // Image handling
    const getImgUrl = (img: any) => {
        if (!img) return null;
        if (typeof img === 'string') return img;
        return img.url || img.imageUrl;
    };

    const firstImage = getImgUrl(item.images?.[0]);
    const secondImage = getImgUrl(item.images?.[1]);

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
        <div className="group block bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all duration-300">
            {/* Image Container */}
            <Link href={productUrl} className="block relative aspect-[3/4] rounded-xl overflow-hidden bg-[#f7f7f7] p-6 mb-3">
                {firstImage ? (
                    <>
                        {/* First Image - Always visible initially */}
                        <img
                            src={getImageUrl(firstImage)}
                            alt={displayName}
                            className={`w-full h-full object-contain transition-opacity duration-500 ease-in-out ${secondImage ? 'group-hover:opacity-0' : ''}`}
                        />
                        {/* Second Image - Visible on hover */}
                        {secondImage && (
                            <img
                                src={getImageUrl(secondImage)}
                                alt={`${displayName} - Alternate View`}
                                className="absolute inset-0 w-full h-full object-contain p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
                            />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBagIcon className="h-12 w-12" />
                    </div>
                )}
            </Link>

            <div className="px-1 space-y-2">
                {/* Brand & Badges */}
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/brands/${brandSlug}`}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group/brand"
                    >
                        <div className="h-4 w-4 rounded-full overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                            {item.brand?.logo ? (
                                <img src={getImageUrl(item.brand.logo)} className="h-full w-full object-contain" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-gray-400">
                                    {brandName.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">{brandName}</span>
                    </Link>
                </div>

                <Link href={productUrl} className="block">
                    <div className="flex items-center gap-2 group/name">
                        <ApparelIcon
                            name={item.category?.level3 || item.category?.page || item.name}
                            className="h-4 w-4 text-gray-400 group-hover/name:text-gray-900 transition-colors flex-shrink-0"
                        />
                        <h3 className="text-sm text-gray-600 font-medium truncate leading-tight group-hover/name:text-gray-900 transition-colors">
                            {displayName}
                        </h3>
                    </div>
                </Link>

                {/* Price */}
                <div className="flex items-center justify-between pb-2">
                    {mainPrice ? (
                        <p className="text-sm font-semibold text-gray-900">{mainPrice}</p>
                    ) : (
                        <p className="text-xs text-gray-400 font-medium">Price upon request</p>
                    )}
                </div>

                {/* Variant toggles - Optional: Only show if needed or make it cleaner */}
                {hasVariants && (
                    <div className="pt-2 border-t border-gray-50/50">
                        <div className="flex flex-wrap gap-1">
                            {variants.slice(0, 5).map((v: any) => (
                                <Link
                                    key={v.id}
                                    href={`${productUrl}-${slugify(v.size || v.name)}`}
                                    className="px-1.5 py-0.5 text-[10px] bg-gray-50 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 transition-all font-medium"
                                >
                                    {v.size}
                                </Link>
                            ))}
                            {variants.length > 5 && (
                                <span className="text-[10px] text-gray-400 flex items-center">+{variants.length - 5}</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
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
