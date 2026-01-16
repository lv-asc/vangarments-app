import React from 'react';
import Link from 'next/link';
import { getImageUrl, slugify } from '@/lib/utils';

interface ProductCardProps {
    item: any;
}

export default function ProductCard({ item }: ProductCardProps) {
    const productSlug = item.code ? slugify(item.code) : slugify(item.name);

    // Safety check for images
    let imageUrl = null;
    if (item.images) {
        const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
        if (imgs && imgs.length > 0) {
            imageUrl = getImageUrl(imgs[0].url || imgs[0].imageUrl);
        }
    }

    return (
        <Link href={`/items/${productSlug}`} className="group block h-full">
            <div className="aspect-[4/5] rounded-xl bg-[#EBEBEB] overflow-hidden relative mb-3 p-6">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                    />
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
