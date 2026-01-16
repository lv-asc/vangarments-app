'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { skuApi } from '@/lib/skuApi';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { ArrowLeftIcon, ShoppingBagIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon, SwatchIcon, RectangleGroupIcon, BeakerIcon, AdjustmentsHorizontalIcon, UserGroupIcon, HeartIcon, PlusIcon, CheckIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { ApparelIcon, getPatternIcon, getGenderIcon } from '@/components/ui/ApparelIcons';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { useAuth } from '@/hooks/useAuth';
import ItemCarousel from '@/components/ui/ItemCarousel';
import WishlistSelectionModal from '@/components/ui/WishlistSelectionModal';

interface Measurement {
    id: string;
    pom_id: string;
    size_id: string;
    value: number;
    tolerance: number | null;
    pom_code: string;
    pom_name: string;
    measurement_unit: string;
    is_half_measurement: boolean;
    size_name: string;
    size_sort_order?: number;
}

/**
 * Strip size suffix from product name (e.g., "Asphalt T-Shirt (Black) [S]" -> "Asphalt T-Shirt (Black)")
 */
function stripSizeSuffix(name: string): string {
    // Remove common size suffixes like [S], [M], [L], [XL], [XXL], [XS], [XXS], [XXXL] etc.
    return name.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim();
}

export default function ProductPageClient() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    // In the new route structure /items/[slug], params.slug is the product/item slug
    const productSlug = params.slug as string;
    const variantId = searchParams.get('variant');

    const [product, setProduct] = useState<any>(null);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [showCareInstructions, setShowCareInstructions] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isOnWishlist, setIsOnWishlist] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [collectionItems, setCollectionItems] = useState<any[]>([]);
    const [brandItems, setBrandItems] = useState<any[]>([]);
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
    const { addVisit } = useRecentVisits();
    const { user } = useAuth();

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error('Please log in to like items');
            return;
        }

        const previousState = isLiked;
        setIsLiked(!previousState);

        try {
            await apiClient.toggleLike(product.id);
        } catch (error) {
            setIsLiked(previousState);
            toast.error('Failed to update like status');
        }
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error('Please log in to add to wishlist');
            return;
        }
        setIsWishlistModalOpen(true);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);

                let searchSlug = productSlug;
                let detectedSizeSuffix = '';

                // Helper to slugify consistent with others
                const toSlug = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');

                // 1. First attempt: direct search
                // This handles:
                // - Normal parent/child SKU codes (if they match the slug)
                // - Standalone SKUs
                let result = await skuApi.searchSKUs(searchSlug, undefined, true);

                // 2. Second attempt: if no results, try stripping valid size suffixes
                // This handles: /items/product-name-size turned into search for "product-name"
                if (!result.skus || result.skus.length === 0) {
                    const parts = productSlug.split('-');
                    if (parts.length > 1) {
                        const potentialSize = parts.pop(); // e.g. "l", "xl"
                        const potentialBase = parts.join('-');

                        // Try searching for the base name/code
                        const baseResult = await skuApi.searchSKUs(potentialBase, undefined, true);
                        if (baseResult.skus && baseResult.skus.length > 0) {
                            result = baseResult;
                            detectedSizeSuffix = potentialSize || '';
                            searchSlug = potentialBase;
                        }
                    }
                }

                if (result.skus && result.skus.length > 0) {
                    // For now, we take the first match as the slug should be unique enough
                    // Ideally we could also check if slugify(sku.code) matches productSlug
                    let matchingProduct = result.skus[0];

                    if (matchingProduct) {
                        // Check if this is a variant (has parentSkuId but no variants)
                        // This can happen if the URL contains a variant's code
                        if (matchingProduct.parentSkuId && (!matchingProduct.variants || matchingProduct.variants.length === 0)) {
                            // Try to find the parent by searching without parentsOnly
                            // The parent should be in the same search result but grouped differently
                            const parentSearch = result.skus.find((sku: any) =>
                                sku.id === matchingProduct.parentSkuId ||
                                (sku.variants && sku.variants.some((v: any) => v.id === matchingProduct.id))
                            );
                            if (parentSearch) {
                                matchingProduct = parentSearch;
                            }
                        }

                    }

                    // FALLBACK: If we found a parent but no variants (because search by code didn't match children),
                    // try searching by name to find the variants.
                    if (matchingProduct && (!matchingProduct.variants || matchingProduct.variants.length === 0)) {
                        try {
                            // Search by name, parentsOnly=false to get everything
                            const variantSearch = await skuApi.searchSKUs(matchingProduct.name, undefined, false);

                            // Filter for items that are children of this parent
                            if (variantSearch.skus && variantSearch.skus.length > 0) {
                                const foundVariants = variantSearch.skus.filter((v: any) =>
                                    v.parentSkuId === matchingProduct.id
                                );

                                if (foundVariants.length > 0) {
                                    // Transform raw SKU data to match variant format
                                    const transformedVariants = foundVariants.map((v: any) => {
                                        const meta = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata || {};
                                        return {
                                            ...v,
                                            size: meta.sizeName || meta.size || v.name,
                                            sizeId: meta.sizeId,
                                            sizeSortOrder: v.sizeSortOrder || meta.sizeOrder || 999,
                                            color: meta.colorName || meta.color,
                                            retailPriceBrl: v.retailPriceBrl || v.retail_price_brl,
                                            images: typeof v.images === 'string' ? JSON.parse(v.images) : v.images || []
                                        };
                                    });

                                    // Sort variants by size order
                                    transformedVariants.sort((a, b) => (a.sizeSortOrder || 999) - (b.sizeSortOrder || 999));

                                    matchingProduct.variants = transformedVariants;
                                }
                            }
                        } catch (err) {
                            console.log('Failed to fetch variants by name fallback', err);
                        }
                    }

                    setProduct(matchingProduct);

                    // Variant Selection Logic
                    // 1. If variantId query param exists, use it (legacy support)
                    if (variantId && matchingProduct.variants) {
                        const variant = matchingProduct.variants.find((v: any) => v.id === variantId);
                        setSelectedVariant(variant || null);
                    }
                    // 2. If we detected a size suffix in the slug, try to match it
                    else if (detectedSizeSuffix && matchingProduct.variants) {
                        const matchedVariant = matchingProduct.variants.find((v: any) =>
                            toSlug(v.size || v.name) === detectedSizeSuffix
                        );
                        if (matchedVariant) {
                            setSelectedVariant(matchedVariant);
                        }
                    }

                    // Fetch measurements
                    try {
                        let measurementsData: Measurement[] = [];

                        // 1. If we have variants, aggregate measurements from ALL of them
                        if (matchingProduct.variants && matchingProduct.variants.length > 0) {
                            const allMeasurements: Measurement[] = [];
                            // Use Promise.all for parallel fetching
                            const variantPromises = matchingProduct.variants.map(async (variant: any) => {
                                try {
                                    const vm = await apiClient.getSKUMeasurements(variant.id);
                                    return Array.isArray(vm) ? vm : [];
                                } catch (e) {
                                    return [];
                                }
                            });

                            const results = await Promise.all(variantPromises);
                            results.forEach(res => allMeasurements.push(...res));
                            measurementsData = allMeasurements;
                        }

                        // 2. If no variants or no variant measurements found, try the main product ID
                        // (This covers standalone SKUs or if aggregation failed)
                        if (measurementsData.length === 0) {
                            const parentRes = await apiClient.getSKUMeasurements(matchingProduct.id);
                            if (Array.isArray(parentRes)) {
                                measurementsData = parentRes;
                            }
                        }

                        setMeasurements(measurementsData);
                    } catch (e) {
                        console.log('No measurements found for this product', e);
                    }

                    // Track visit
                    const bSlug = matchingProduct.brand?.slug || (matchingProduct.brand?.name ? slugify(matchingProduct.brand.name) : 'brand');
                    addVisit({
                        id: matchingProduct.id,
                        name: matchingProduct.name,
                        logo: matchingProduct.images?.[0]?.url || matchingProduct.images?.[0]?.imageUrl,
                        businessType: 'item',
                        type: 'item',
                        slug: matchingProduct.code ? slugify(matchingProduct.code) : slugify(matchingProduct.name),
                        brandName: matchingProduct.brand?.name,
                        brandSlug: bSlug,
                        visitedAt: Date.now()
                    });
                } else {
                    toast.error('Product not found');
                    router.push('/search');
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
                toast.error('Failed to load product');
                router.push('/search');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productSlug, variantId, router]); // Removed brandSlug from deps

    // Check like status when product loads
    useEffect(() => {
        if (product && user) {
            apiClient.getLikeStatus(product.id)
                .then((res) => setIsLiked(res.liked))
                .catch(() => { }); // Fail silently
        } else if (!user) {
            setIsLiked(false);
        }
    }, [product, user]);

    useEffect(() => {
        if (product && user) {
            apiClient.getWishlistStatus(product.id)
                .then((res) => setIsOnWishlist(res.onWishlist))
                .catch(() => { });
        } else if (!user) {
            setIsOnWishlist(false);
        }
    }, [product, user]);

    useEffect(() => {
        if (product) {
            // Fetch More from Collection
            skuApi.getRelatedSKUs(product.id, 'collection')
                .then(items => setCollectionItems(items))
                .catch(err => console.error('Error fetching collection items', err));

            // Fetch More from Brand
            skuApi.getRelatedSKUs(product.id, 'brand')
                .then(items => setBrandItems(items))
                .catch(err => console.error('Error fetching brand items', err));
        }
    }, [product]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading product...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const formatPrice = (price: number | undefined) => {
        if (!price) return null;
        return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const displayPrice = formatPrice(selectedVariant?.retailPriceBrl || product.retailPriceBrl);
    const displayImages = product.images || [];

    // Carousel handlers
    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };

    const selectImage = (index: number) => {
        setCurrentImageIndex(index);
    };

    const currentImage = displayImages[currentImageIndex] || displayImages.find((img: any) => img.isPrimary) || displayImages[0];

    // Strip size suffix from product name for display
    const displayName = stripSizeSuffix(product.name);

    // Organize measurements by POM and size
    const uniquePOMs = Array.from(new Map(measurements.map(m => [m.pom_id, { id: m.pom_id, name: m.pom_name, code: m.pom_code, unit: m.measurement_unit }])).values());
    const uniqueSizes = Array.from(new Map(measurements.map(m => [m.size_id, { id: m.size_id, name: m.size_name, sortOrder: m.size_sort_order || 999 }])).values());

    // Sort sizes by their sortOrder (S, M, L, XL, etc.)
    uniqueSizes.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

    // Get the size ID of the selected variant
    const selectedSizeId = selectedVariant?.sizeId;
    const selectedSizeName = selectedVariant?.size;

    // Derived brand slug for links
    const brandSlug = product.brand?.slug || (product.brand?.name ? slugify(product.brand.name) : 'brand');

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <Link href="/search" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to search
                </Link>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                        {/* Product Images */}
                        <div className="space-y-4">
                            <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden relative group">
                                {currentImage ? (
                                    <>
                                        <img
                                            src={getImageUrl(currentImage.url || currentImage.imageUrl)}
                                            alt={displayName}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => nextImage()}
                                        />

                                        {/* Carousel Navigation */}
                                        {displayImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronLeftIcon className="h-6 w-6" />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronRightIcon className="h-6 w-6" />
                                                </button>

                                                {/* Image Indicators */}
                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                                    {displayImages.map((_: any, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={(e) => { e.stopPropagation(); selectImage(idx); }}
                                                            className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex
                                                                ? 'bg-white w-4'
                                                                : 'bg-white/50 hover:bg-white/80'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ShoppingBagIcon className="h-24 w-24" />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail gallery */}
                            {displayImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {displayImages.slice(0, 4).map((img: any, idx: number) => (
                                        <div key={idx} className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                                            <button
                                                onClick={() => selectImage(idx)}
                                                className={`w-full h-full block transition-opacity ${currentImageIndex === idx ? 'opacity-100 ring-2 ring-gray-900' : 'opacity-70 hover:opacity-100'}`}
                                            >
                                                <img
                                                    src={getImageUrl(img.url || img.imageUrl)}
                                                    alt={`${displayName} ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="space-y-6">
                            <div>
                                <div>
                                    {/* Linked Entities Badges */}
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        {/* Brand Badge */}
                                        <Link
                                            href={`/brands/${brandSlug}`}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
                                        >
                                            {product.brand?.logo ? (
                                                <img
                                                    src={getImageUrl(product.brand.logo)}
                                                    alt={product.brand.name}
                                                    className="w-5 h-5 rounded-full object-contain bg-white"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {product.brand?.name?.charAt(0)}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {product.brand?.name}
                                            </span>
                                        </Link>

                                        {/* Line Badge */}
                                        {(product.lineInfo || product.line) && (
                                            <Link
                                                href={`/brands/${brandSlug}?line=${product.lineId || product.lineInfo?.id || slugify(product.lineInfo?.name || product.line)}`}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
                                            >
                                                {product.lineInfo?.logo ? (
                                                    <img
                                                        src={getImageUrl(product.lineInfo.logo)}
                                                        alt={product.lineInfo.name}
                                                        className="w-5 h-5 rounded-full object-contain bg-white"
                                                    />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                        L
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                                    {product.lineInfo?.name || product.line}
                                                </span>
                                            </Link>
                                        )}



                                        {/* Collection Badge */}
                                        {(product.collectionInfo || product.collection) && (
                                            <Link
                                                href={`/brands/${brandSlug}/collections/${slugify(product.collectionInfo?.name || product.collection)}`}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
                                            >
                                                {product.collectionInfo?.coverImage ? (
                                                    <img
                                                        src={getImageUrl(product.collectionInfo.coverImage)}
                                                        alt={product.collectionInfo.name}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                        C
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                                    {product.collectionInfo?.name || product.collection}
                                                </span>
                                            </Link>
                                        )}

                                        {/* Official Item Link Badge */}
                                        {product.officialItemLink && (
                                            <a
                                                href={product.officialItemLink.startsWith('http') ? product.officialItemLink : `https://${product.officialItemLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                            >
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${new URL(product.officialItemLink.startsWith('http') ? product.officialItemLink : `https://${product.officialItemLink}`).hostname}&sz=32`}
                                                    alt="Official"
                                                    className="w-4 h-4 rounded-full"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /%3E%3C/svg%3E'; }}
                                                />
                                                <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800 transition-colors">
                                                    Official Site
                                                </span>
                                            </a>
                                        )}
                                    </div>

                                    <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                                    {displayPrice && (
                                        <p className="text-2xl font-semibold text-gray-900 mt-4">
                                            <span className="text-sm font-normal text-gray-500 mr-1">Retail</span>
                                            {displayPrice}
                                        </p>
                                    )}
                                </div>

                                {/* Like & Wishlist Buttons */}
                                <div className="flex items-center gap-3 mt-6 mb-6">
                                    <button
                                        onClick={handleLikeToggle}
                                        className={`p-2 rounded-full transition-all ${isLiked ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                                    >
                                        {isLiked ? (
                                            <HeartIconSolid className="h-6 w-6 text-red-500 animate-like" />
                                        ) : (
                                            <HeartIcon className="h-6 w-6 text-gray-400" />
                                        )}
                                    </button>

                                    <button
                                        onClick={handleWishlistToggle}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${isOnWishlist
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {isOnWishlist ? (
                                            <>
                                                <CheckIcon className="h-4 w-4" />
                                                On Wishlist
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon className="h-4 w-4" />
                                                Wishlist
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Variant Selector */}
                                {product.variants && product.variants.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Size</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((variant: any) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => {
                                                        const newSlug = `${slugify(product.code ? product.code : product.name)}-${slugify(variant.size || variant.name)}`;
                                                        router.push(`/items/${newSlug}`);
                                                        setSelectedVariant(variant);
                                                    }}
                                                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${selectedVariant?.id === variant.id
                                                        ? 'border-gray-900 bg-gray-900 text-white'
                                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {variant.size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Product Info */}
                                <div className="border-t border-gray-200 pt-6 space-y-4">
                                    {product.description && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                                            <p className="text-sm text-gray-600">{product.description}</p>
                                        </div>
                                    )}

                                    {/* Measurements Section */}
                                    {measurements.length > 0 && (
                                        <div className="border-t border-gray-200 pt-6">
                                            <button
                                                onClick={() => setShowMeasurements(!showMeasurements)}
                                                className="flex items-center justify-between w-full text-left"
                                            >
                                                <h3 className="text-sm font-medium text-gray-900">Measurements</h3>
                                                {showMeasurements ? (
                                                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>

                                            {showMeasurements && (
                                                <div className="mt-4 overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-gray-200">
                                                                <th className="text-left py-2 pr-4 font-medium text-gray-700">POM</th>
                                                                {uniqueSizes.map(size => {
                                                                    const isSelected = size.id === selectedSizeId || size.name === selectedSizeName;
                                                                    return (
                                                                        <th
                                                                            key={size.id}
                                                                            className={`text-center py-2 px-3 ${isSelected ? 'font-bold text-gray-900 text-base' : 'font-medium text-gray-600'}`}
                                                                        >
                                                                            {size.name}
                                                                        </th>
                                                                    );
                                                                })}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {uniquePOMs.map(pom => (
                                                                <tr key={pom.id} className="border-b border-gray-100">
                                                                    <td className="py-2 pr-4 text-gray-700">
                                                                        {pom.name}
                                                                        <span className="text-gray-400 text-xs ml-1">({pom.unit})</span>
                                                                    </td>
                                                                    {uniqueSizes.map(size => {
                                                                        const measurement = measurements.find(
                                                                            m => m.pom_id === pom.id && m.size_id === size.id
                                                                        );
                                                                        const isSelected = size.id === selectedSizeId || size.name === selectedSizeName;
                                                                        return (
                                                                            <td
                                                                                key={size.id}
                                                                                className={`text-center py-2 px-3 ${isSelected ? 'font-bold text-gray-900 text-base bg-gray-50' : 'text-gray-600'}`}
                                                                            >
                                                                                {measurement ? measurement.value : '-'}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Care Instructions Section */}
                                    {product.careInstructions && (
                                        <div className="border-t border-gray-200 pt-6">
                                            <button
                                                onClick={() => setShowCareInstructions(!showCareInstructions)}
                                                className="flex items-center justify-between w-full text-left"
                                            >
                                                <h3 className="text-sm font-medium text-gray-900">Care Instructions</h3>
                                                {showCareInstructions ? (
                                                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>

                                            {showCareInstructions && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                                        {product.careInstructions}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {product.code && (
                                        <div className="border-t border-gray-200 pt-6">
                                            <button
                                                onClick={() => setShowDetails(!showDetails)}
                                                className="flex items-center justify-between w-full text-left"
                                            >
                                                <h3 className="text-sm font-medium text-gray-900">See More</h3>
                                                {showDetails ? (
                                                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>

                                            {showDetails && (
                                                <div className="mt-4 grid grid-cols-1 gap-y-4">
                                                    {product.releaseDate && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <CalendarIcon className="h-5 w-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Release Date</p>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {new Date(product.releaseDate).toLocaleDateString('pt-BR', {
                                                                        day: 'numeric',
                                                                        month: 'long',
                                                                        year: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {product.code && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <TagIcon className="h-5 w-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Product Code</p>
                                                                <p className="text-sm font-medium text-gray-900 font-mono">{product.code}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Apparel Section - Using ApparelIcon */}
                                                    {(product.apparel || product.category) && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <ApparelIcon
                                                                    name={product.apparel || (typeof product.category === 'string' ? product.category : (product.category.page || ''))}
                                                                    className="h-5 w-5 text-gray-600"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Apparel</p>
                                                                <p className="text-sm font-medium text-gray-900 capitalize">
                                                                    {product.apparel || (typeof product.category === 'string' ? product.category : (product.category.page || product.category.level3 || product.category.level2))}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {product.style && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <SwatchIcon className="h-5 w-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Style</p>
                                                                <p className="text-sm font-medium text-gray-900">{product.style}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {product.pattern && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                {React.createElement(getPatternIcon(product.pattern), { className: "h-5 w-5 text-gray-600" })}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Pattern</p>
                                                                <p className="text-sm font-medium text-gray-900">{product.pattern}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(product.materials?.length > 0 || product.materialName) && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <BeakerIcon className="h-5 w-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Material</p>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {product.materials?.length > 0 ? product.materials.join(', ') : product.materialName}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {product.fit && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Fit</p>
                                                                <p className="text-sm font-medium text-gray-900">{product.fit}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {product.gender && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                                {React.createElement(getGenderIcon(product.gender), { className: "h-5 w-5 text-gray-600" })}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500">Gender</p>
                                                                <p className="text-sm font-medium text-gray-900 capitalize">{product.gender}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Items Carousels */}
                {(collectionItems.length > 0 || brandItems.length > 0) && (
                    <div className="mt-12 space-y-12">
                        {collectionItems.length > 0 && (
                            <ItemCarousel
                                title={`More from ${product.collection || 'Collection'}`}
                                items={collectionItems}
                                seeAllLink={product.collectionInfo?.name && product.brand?.slug ? `/brands/${product.brand.slug}/collections/${slugify(product.collectionInfo.name)}` : undefined}
                            />
                        )}

                        {brandItems.length > 0 && (
                            <ItemCarousel
                                title={`More from ${product.brand?.name || 'Brand'}`}
                                items={brandItems}
                                seeAllLink={product.brand?.slug ? `/brands/${product.brand.slug}` : undefined}
                            />
                        )}
                    </div>
                )}
            </div>

            <WishlistSelectionModal
                isOpen={isWishlistModalOpen}
                onClose={() => setIsWishlistModalOpen(false)}
                skuItemId={product?.id}
                onStatusChange={(status) => setIsOnWishlist(status)}
            />
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
