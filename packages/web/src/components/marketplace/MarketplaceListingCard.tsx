'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    HeartIcon,
    ShoppingBagIcon,
    TagIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { getImageUrl } from '@/utils/imageUrl';
import Link from 'next/link';

interface MarketplaceListingCardProps {
    listing: {
        id: string;
        itemCode?: string;
        title: string;
        price: number;
        currency: string;
        images: string[];
        condition: {
            status: string;
            label?: string;
        };
        likes?: number;
        views?: number;
        brand?: string;
    };
    isLiked?: boolean;
    onLike?: (id: string, e: React.MouseEvent) => void;
}

export function MarketplaceListingCard({
    listing,
    isLiked = false,
    onLike
}: MarketplaceListingCardProps) {
    const formatPrice = (price: number, currency: string = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const conditionColors: Record<string, string> = {
        new: 'bg-green-100 text-green-800',
        dswt: 'bg-purple-100 text-purple-800',
        excellent: 'bg-emerald-100 text-emerald-800',
        good: 'bg-yellow-100 text-yellow-800',
        fair: 'bg-orange-100 text-orange-800',
        poor: 'bg-red-100 text-red-800',
    };

    const conditionLabels: Record<string, string> = {
        new: 'Novo',
        dswt: 'Deadstock',
        excellent: 'Excelente',
        good: 'Bom',
        fair: 'Regular',
        poor: 'Desgastado',
    };

    const firstImage = listing.images?.[0];
    const imageUrl = getImageUrl(firstImage);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fashion-card group cursor-pointer relative"
        >
            <Link href={listing.itemCode ? `/marketplace/u/${listing.itemCode}` : `/marketplace/${listing.id}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <TagIcon className="h-12 w-12" />
                        </div>
                    )}

                    {/* Condition Badge */}
                    <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conditionColors[listing.condition.status] || 'bg-gray-100 text-gray-600'}`}>
                            {listing.condition.label || conditionLabels[listing.condition.status] || listing.condition.status}
                        </span>
                    </div>

                    {/* Like Button */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLike?.(listing.id, e);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-10"
                    >
                        {isLiked ? (
                            <HeartSolidIcon className="h-4 w-4 text-red-500" />
                        ) : (
                            <HeartIcon className="h-4 w-4 text-gray-600" />
                        )}
                    </button>

                    {/* Stats overlay on hover */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <div className="w-full bg-white/90 backdrop-blur-md py-2 px-3 rounded-lg flex items-center justify-between text-[10px] font-bold text-gray-900">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5">
                                    <EyeIcon className="h-3 w-3" />
                                    {listing.views || 0}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <HeartIcon className="h-3 w-3" />
                                    {listing.likes || 0}
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                Ver Detalhes
                                <ShoppingBagIcon className="h-3 w-3" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{listing.brand || 'Generic'}</span>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                            {listing.title}
                        </h3>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <span className="text-lg font-black text-gray-900">
                            {formatPrice(listing.price, listing.currency)}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
