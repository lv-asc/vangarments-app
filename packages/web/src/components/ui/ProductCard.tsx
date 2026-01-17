import React from 'react';
import Link from 'next/link';
import { getImageUrl, slugify } from '@/lib/utils';

interface ProductCardProps {
    item: any;
}

export default function ProductCard({ item }: ProductCardProps) {
    const productSlug = item.code ? slugify(item.code) : slugify(item.name);

    // Safety check for images
    let primaryImage = null;
    let secondaryImage = null;

    if (item.images) {
        const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
        if (imgs && Array.isArray(imgs)) {
            if (imgs.length > 0) {
                primaryImage = getImageUrl(imgs[0].url || imgs[0].imageUrl);
            }
            if (imgs.length > 1) {
                secondaryImage = getImageUrl(imgs[1].url || imgs[1].imageUrl);
            }
        }
    }

    return (
        <Link href={`/items/${productSlug}`} className="group block h-full">
            <div className="aspect-[4/5] rounded-xl bg-[#EBEBEB] overflow-hidden relative mb-3 p-6 grid place-items-center">
                {primaryImage ? (
                    <>
                        {/* Primary Image */}
                        <img
                            src={primaryImage}
                            alt={item.name}
                            className={`w-full h-full object-contain object-center transition-all duration-300 ${secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                                }`}
                        />
                        {/* Secondary Image (Hover) */}
                        {secondaryImage && (
                            <img
                                src={secondaryImage}
                                alt={`${item.name} - view 2`}
                                className="absolute inset-0 w-full h-full object-contain object-center transition-all duration-300 opacity-0 group-hover:opacity-100 p-6"
                            />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-2xl">👕</span>
                    </div>
                )}
            </div>
            <h4 className="font-medium text-gray-900 truncate text-sm">{item.name}</h4>
            {/* Brand Name */}
            {item.brand && (
                <p className="text-xs text-gray-500 truncate">{item.brand.name}</p>
            )}
            <p className="text-sm font-medium text-gray-900 mt-1">
                {item.retailPriceBrl
                    ? `R$ ${Number(item.retailPriceBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Price on request'}
            </p>
        </Link>
    );
}
