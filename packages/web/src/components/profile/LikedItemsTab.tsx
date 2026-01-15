import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import { HeartIcon } from '@heroicons/react/24/solid';

// Helper for slugifying (if not available globally)
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export function LikedItemsTab() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikes = async () => {
            try {
                const res = await apiClient.getUserLikes(100, 0);
                setItems(res.items);
            } catch (error) {
                console.error('Failed to fetch likes', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLikes();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00132d] mx-auto"></div>
                <p className="text-gray-500 mt-3">Loading liked items...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <HeartIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">No Liked Items</h3>
                <p className="text-gray-600 mb-6">Items you like will appear here.</p>
                <Link href="/search" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00132d] hover:bg-[#00132d]/90">
                    Browse Items
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Liked Items</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((like) => {
                    const item = like.skuItem;
                    // Handle images
                    let imageUrl = null;
                    if (item.images) {
                        const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                        if (imgs && imgs.length > 0) {
                            imageUrl = getImageUrl(imgs[0].url || imgs[0].imageUrl);
                        }
                    }

                    const linkSlug = item.code ? slugify(item.code) : slugify(item.name);

                    return (
                        <Link
                            key={like.likeId}
                            href={`/items/${linkSlug}`}
                            className="group block"
                        >
                            <div className="aspect-[3/4] rounded-lg bg-gray-100 overflow-hidden relative mb-3">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={item.name}
                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <span className="text-2xl">👕</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-500 shadow-sm">
                                    <HeartIcon className="h-4 w-4" />
                                </div>
                            </div>
                            <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                {item.retailPriceBrl ? `R$ ${Number(item.retailPriceBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Price on request'}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
