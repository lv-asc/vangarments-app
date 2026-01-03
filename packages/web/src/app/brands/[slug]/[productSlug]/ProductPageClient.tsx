'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { skuApi } from '@/lib/skuApi';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { ArrowLeftIcon, ShoppingBagIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
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
    const primaryImage = displayImages.find((img: any) => img.isPrimary) || displayImages[0];

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
                            <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                                {primaryImage ? (
                                    <img
                                        src={getImageUrl(primaryImage.url || primaryImage.imageUrl)}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
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
                                            <img
                                                src={getImageUrl(img.url || img.imageUrl)}
                                                alt={`${displayName} ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="space-y-6">
                            <div>
                                <Link
                                    href={`/brands/${brandSlug}`}
                                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-3 transition-all duration-200 group inline-flex px-3 py-2 -ml-3 rounded-lg hover:bg-gray-100 hover:shadow-sm hover:scale-105"
                                >
                                    {product.brand?.logo && (
                                        <img
                                            src={getImageUrl(product.brand.logo)}
                                            alt={product.brand.name}
                                            className="w-8 h-8 rounded-full object-cover border border-gray-200 group-hover:border-gray-300 transition-colors"
                                        />
                                    )}
                                    <span className="text-lg font-medium group-hover:font-semibold transition-all">{product.brand?.name}</span>
                                </Link>
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

                                {product.materials && product.materials.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Materials</h3>
                                        <p className="text-sm text-gray-600">{product.materials.join(', ')}</p>
                                    </div>
                                )}

                                {product.code && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Product Code</h3>
                                        <p className="text-sm text-gray-600 font-mono">{product.code}</p>
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
