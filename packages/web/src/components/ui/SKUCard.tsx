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
 * Strip color suffix from product name (e.g., "Asphalt T-Shirt (Black)" -> "Asphalt T-Shirt")
 */
function stripColorSuffix(name: string): string {
    return name.replace(/\s*\([^)]+\)\s*$/i, '').trim();
}

/**
 * Universal SKU Card Component
 * Displays SKU items with variant grouping and consistent styling
 */
export default function SKUCard({ item, layout = 'list' }: SKUCardProps) {
    const [showVariants, setShowVariants] = useState(false);

    if (!item) return null;

    const brandName = item.brand?.name || item.brand?.brand || 'Unknown Brand';
    const brandSlug = item.brand?.slug || slugify(brandName);

    // Line & Collection
    const lineName = item.lineInfo?.name || item.line;
    const lineLogo = item.lineInfo?.logo;
    const collectionName = item.collectionInfo?.name || item.collection;
    const collectionImage = item.collectionInfo?.coverImage;

    // Image handling - prioritize primary and handle JSON
    const getImgUrl = (img: any) => {
        if (!img) return null;
        if (typeof img === 'string') return img;
        return img.url || img.imageUrl;
    };

    let firstImage = null;
    let secondImage = null;

    // Ensure images are parsed if they come as a string
    const itemImages = Array.isArray(item.images)
        ? item.images
        : (typeof item.images === 'string' ? JSON.parse(item.images) : []);

    if (itemImages && itemImages.length > 0) {
        // Match ProductPage logic: Default to the first image (Order determines cover)
        // User workflow relies on dragging images to first position in Admin
        firstImage = getImgUrl(itemImages[0]);

        // Use second image for hover if available
        if (itemImages.length > 1) {
            secondImage = getImgUrl(itemImages[1]);
        }
    }

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
    let displayName = stripSizeSuffix(item.name);

    // Strip color suffix if product has variants but only 1 unique color
    // This handles the case where "Child SKUs" (variants) shouldn't show color if they are the only color available
    if (variants.length > 0) {
        const uniqueColors = new Set(variants.map((v: any) => {
            const match = v.name.match(/\(([^)]+)\)/);
            return match ? match[1] : null;
        }).filter(Boolean));

        if (uniqueColors.size <= 1) {
            displayName = stripColorSuffix(displayName);
        }
    }

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
                {/* Brand & Line Info */}
                <div className="flex flex-col gap-1">
                    {/* Brand */}
                    <Link
                        href={`/brands/${brandSlug}`}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity group/brand w-fit"
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

                    {/* Line (if exists) */}
                    {lineName && (
                        <div className="flex items-center gap-1.5 pl-0.5 opacity-80">
                            {lineLogo && (
                                <div className="h-3 w-3 rounded-full overflow-hidden bg-gray-50 flex-shrink-0">
                                    <img src={getImageUrl(lineLogo)} className="h-full w-full object-contain" />
                                </div>
                            )}
                            <span className="text-[10px] font-medium text-gray-500 truncate">{lineName}</span>
                        </div>
                    )}
                </div>

                {/* Collection Name */}
                {collectionName && (
                    <div className="flex items-center gap-1.5 pl-0.5 opacity-80 decoration-slice">
                        {collectionImage && (
                            <div className="h-3 w-3 rounded-full overflow-hidden bg-gray-50 flex-shrink-0">
                                <img src={getImageUrl(collectionImage)} className="h-full w-full object-contain" />
                            </div>
                        )}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-500">
                            {collectionName}
                        </span>
                    </div>
                )}

                <Link href={productUrl} className="block mt-1">
                    <div className="flex items-start gap-2 group/name">
                        {/* Optional: Add Apparel Icon back if desired, but might be cluttered now
                        <ApparelIcon
                            name={item.category?.level3 || item.category?.page || item.name}
                            className="h-4 w-4 text-gray-400 group-hover/name:text-gray-900 transition-colors flex-shrink-0 mt-0.5"
                        /> */}
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

                {/* Variant toggles */}
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
