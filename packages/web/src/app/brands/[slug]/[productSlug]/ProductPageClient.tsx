'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { skuApi } from '@/lib/skuApi';
import { apiClient } from '@/lib/api';
import { tagApi } from '@/lib/tagApi';
import { getImageUrl } from '@/lib/utils';
import { ArrowLeftIcon, ShoppingBagIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, TagIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRecentVisits } from '@/hooks/useRecentVisits';

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
    const brandSlug = params.slug as string;
    const productSlug = params.productSlug as string;
    const variantId = searchParams.get('variant');

    const [product, setProduct] = useState<any>(null);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageTags, setImageTags] = useState<any[]>([]);
    const [showTagsList, setShowTagsList] = useState(false);
    const { addVisit } = useRecentVisits();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);

                // Search for product by code (slug) with parentsOnly=true
                // This should return parent SKUs with their variants grouped
                const result = await skuApi.searchSKUs(productSlug, undefined, true);

                if (result.skus && result.skus.length > 0) {
                    // Find the product that matches the brand slug
                    let matchingProduct = result.skus.find((sku: any) => {
                        const skuBrandSlug = sku.brand?.slug || slugify(sku.brand?.name || '');
                        return skuBrandSlug === brandSlug;
                    });

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

                        setProduct(matchingProduct);

                        // If a variant ID is specified or we can detect the size from the URL, select that variant
                        if (variantId && matchingProduct.variants) {
                            const variant = matchingProduct.variants.find((v: any) => v.id === variantId);
                            setSelectedVariant(variant || null);
                        }

                        // Fetch measurements for all variants of the product
                        // We need measurements from the parent or all its variants
                        try {
                            // First try to get measurements from the parent SKU ID
                            let measurementsData = await apiClient.getSKUMeasurements(matchingProduct.id);

                            // If no measurements from parent and we have variants, try to aggregate from variants
                            if ((!measurementsData || !Array.isArray(measurementsData) || measurementsData.length === 0)
                                && matchingProduct.variants && matchingProduct.variants.length > 0) {
                                const allMeasurements: Measurement[] = [];
                                for (const variant of matchingProduct.variants) {
                                    try {
                                        const variantMeasurements = await apiClient.getSKUMeasurements(variant.id);
                                        if (Array.isArray(variantMeasurements)) {
                                            allMeasurements.push(...variantMeasurements);
                                        }
                                    } catch (e) {
                                        // Continue to next variant
                                    }
                                }
                                measurementsData = allMeasurements;
                            }

                            if (Array.isArray(measurementsData)) {
                                setMeasurements(measurementsData);
                            }
                        } catch (e) {
                            console.log('No measurements found for this product');
                        }

                        // Track visit
                        addVisit({
                            id: matchingProduct.id,
                            name: matchingProduct.name,
                            logo: matchingProduct.images?.[0]?.url || matchingProduct.images?.[0]?.imageUrl,
                            businessType: 'item',
                            type: 'item',
                            slug: matchingProduct.code ? slugify(matchingProduct.code) : slugify(matchingProduct.name),
                            brandName: matchingProduct.brand?.name,
                            brandSlug: brandSlug || matchingProduct.brand?.slug || (matchingProduct.brand?.name ? slugify(matchingProduct.brand.name) : 'brand'),
                            visitedAt: Date.now()
                        });
                    } else {
                        toast.error('Product not found');
                        router.push('/search');
                    }
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
    }, [brandSlug, productSlug, variantId, router]);

    // Fetch tags for the current product/image
    useEffect(() => {
        const fetchTags = async () => {
            if (!product?.id) return;
            try {
                const tags = await tagApi.getTagsBySource('sku_image', product.id);
                setImageTags(tags);
            } catch (error) {
                console.error('Failed to fetch tags:', error);
            }
        };
        fetchTags();
    }, [product?.id]);

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
    const uniqueSizes = Array.from(new Map(measurements.map(m => [m.size_id, { id: m.size_id, name: m.size_name }])).values());

    // Get the size ID of the selected variant
    const selectedSizeId = selectedVariant?.sizeId;
    const selectedSizeName = selectedVariant?.size;

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

                                                {/* Tag Icon - Bottom Left */}
                                                {imageTags.length > 0 && (
                                                    <div className="absolute bottom-4 left-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowTagsList(!showTagsList); }}
                                                            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-sm transition-all"
                                                            title="View tagged people & entities"
                                                        >
                                                            <TagIcon className="h-5 w-5" />
                                                        </button>

                                                        {/* Tagged Entities Popup */}
                                                        {showTagsList && (
                                                            <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] max-w-[280px] max-h-[300px] overflow-y-auto z-20">
                                                                <div className="p-3 border-b border-gray-100">
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase">Tagged in this photo</p>
                                                                </div>
                                                                <div className="divide-y divide-gray-100">
                                                                    {imageTags.map((tag: any) => {
                                                                        const entity = tag.taggedEntity;
                                                                        const link = entity?.type === 'user'
                                                                            ? `/profile/${entity.slug || entity.id}`
                                                                            : entity?.type === 'brand'
                                                                                ? `/brands/${entity.slug || entity.id}`
                                                                                : entity?.type === 'store'
                                                                                    ? `/stores/${entity.slug || entity.id}`
                                                                                    : null;

                                                                        return (
                                                                            <Link
                                                                                key={tag.id}
                                                                                href={link || '#'}
                                                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                {entity?.imageUrl ? (
                                                                                    <img
                                                                                        src={getImageUrl(entity.imageUrl)}
                                                                                        alt={entity.name}
                                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                                                        <TagIcon className="w-4 h-4 text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                                        {entity?.name || 'Unknown'}
                                                                                    </p>
                                                                                    {tag.description && (
                                                                                        <p className="text-xs text-blue-600 font-medium">
                                                                                            {tag.description}
                                                                                        </p>
                                                                                    )}
                                                                                    <p className="text-xs text-gray-500 capitalize">
                                                                                        {entity?.type || tag.tagType}
                                                                                    </p>
                                                                                </div>
                                                                            </Link>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                                    </div>

                                    <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                                    {displayPrice && (
                                        <p className="text-2xl font-semibold text-gray-900 mt-4">{displayPrice}</p>
                                    )}
                                </div>

                                {/* Variant Selector */}
                                {product.variants && product.variants.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Select Size</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.variants.map((variant: any) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => setSelectedVariant(variant)}
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
                                </div>

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
                                            <div className="mt-4 space-y-3">
                                                {product.code && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Product Code</span>
                                                        <span className="text-sm text-gray-900 font-mono">{product.code}</span>
                                                    </div>
                                                )}

                                                {product.category && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Apparel</span>
                                                        <span className="text-sm text-gray-900">
                                                            {typeof product.category === 'string' ? product.category : (product.category.page || product.category.level3 || product.category.level2)}
                                                        </span>
                                                    </div>
                                                )}

                                                {product.materials && product.materials.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Material</span>
                                                        <span className="text-sm text-gray-900">{product.materials.join(', ')}</span>
                                                    </div>
                                                )}

                                                {product.style && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Style</span>
                                                        <span className="text-sm text-gray-900">{product.style}</span>
                                                    </div>
                                                )}

                                                {product.pattern && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Pattern</span>
                                                        <span className="text-sm text-gray-900">{product.pattern}</span>
                                                    </div>
                                                )}

                                                {product.fit && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Fit</span>
                                                        <span className="text-sm text-gray-900">{product.fit}</span>
                                                    </div>
                                                )}

                                                {product.gender && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <span className="text-sm text-gray-500">Gender</span>
                                                        <span className="text-sm text-gray-900 capitalize">{product.gender}</span>
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
