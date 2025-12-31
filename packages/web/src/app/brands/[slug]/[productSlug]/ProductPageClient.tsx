'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { skuApi } from '@/lib/skuApi';
import { getImageUrl } from '@/lib/utils';
import { ArrowLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRecentVisits } from '@/hooks/useRecentVisits';

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
    const { addVisit } = useRecentVisits();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);

                // Search for product by code (slug)
                // The productSlug is generated from the SKU code, so we search by code
                const result = await skuApi.searchSKUs(productSlug, undefined, true);

                if (result.skus && result.skus.length > 0) {
                    // Find the product that matches the brand slug
                    const matchingProduct = result.skus.find((sku: any) => {
                        const skuBrandSlug = sku.brand?.slug || slugify(sku.brand?.name || '');
                        return skuBrandSlug === brandSlug;
                    });

                    if (matchingProduct) {
                        setProduct(matchingProduct);

                        // If a variant ID is specified, select that variant
                        if (variantId && matchingProduct.variants) {
                            const variant = matchingProduct.variants.find((v: any) => v.id === variantId);
                            setSelectedVariant(variant || null);
                            setSelectedVariant(variant || null);
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
                                        alt={product.name}
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
                                                alt={`${product.name} ${idx + 1}`}
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
                                <p className="text-sm text-gray-500 mb-1">{product.brand?.name}</p>
                                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
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
