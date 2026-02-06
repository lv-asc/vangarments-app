'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeftIcon,
    HeartIcon,
    ShareIcon,
    ShieldCheckIcon,
    TruckIcon,
    ClockIcon,
    StarIcon,
    ChatBubbleLeftIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { getImageUrl } from '@/utils/imageUrl';

interface ListingDetail {
    id: string;
    itemCode?: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    currency: string;
    condition: {
        status: string;
        description: string;
        authenticity: string;
    };
    shipping: {
        domestic: {
            available: boolean;
            cost: number;
            estimatedDays: number;
        };
        handlingTime: number;
    };
    images: string[];
    status: string;
    views: number;
    likes: number;
    category: string;
    tags: string[];
    sellerId: string;
    createdAt: string;
}

interface SellerProfile {
    userId: string;
    displayName: string;
    avatar?: string;
    rating: number;
    totalSales: number;
    memberSince: string;
}

interface ListingDetailViewProps {
    initialListing: ListingDetail;
    initialSeller: SellerProfile | null;
}

export default function ListingDetailView({ initialListing, initialSeller }: ListingDetailViewProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [listing, setListing] = useState<ListingDetail>(initialListing);
    const [seller, setSeller] = useState<SellerProfile | null>(initialSeller);
    const [isLiked, setIsLiked] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    const handleLike = async () => {
        try {
            const result = await apiClient.toggleMarketplaceLike(listing.id);
            setIsLiked(result.liked);
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    };

    const conditionLabels: Record<string, { label: string; color: string }> = {
        new: { label: 'New with Tags', color: 'bg-green-100 text-green-700' },
        dswt: { label: 'Deadstock', color: 'bg-purple-100 text-purple-700' },
        never_used: { label: 'Never Used', color: 'bg-blue-100 text-blue-700' },
        excellent: { label: 'Excellent', color: 'bg-teal-100 text-teal-700' },
        good: { label: 'Good', color: 'bg-yellow-100 text-yellow-700' },
        fair: { label: 'Fair', color: 'bg-orange-100 text-orange-700' },
        poor: { label: 'Poor', color: 'bg-red-100 text-red-700' }
    };

    const formatPrice = (price: number, currency: string = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const isOwner = user?.id === listing.sellerId;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                            Back
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLike}
                                className="p-2 rounded-full hover:bg-gray-100"
                            >
                                {isLiked ? (
                                    <HeartSolidIcon className="h-6 w-6 text-red-500" />
                                ) : (
                                    <HeartIcon className="h-6 w-6 text-gray-600" />
                                )}
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100">
                                <ShareIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                            {listing.images && listing.images.length > 0 ? (
                                <img
                                    src={getImageUrl(listing.images[selectedImage])}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <TagIcon className="h-24 w-24 text-gray-300" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {listing.images && listing.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {listing.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === idx ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        {/* Title and Price */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${conditionLabels[listing.condition?.status]?.color || 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {conditionLabels[listing.condition?.status]?.label || listing.condition?.status}
                                </span>
                                {listing.status === 'sold' && (
                                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                                        SOLD
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold text-gray-900">
                                    {formatPrice(listing.price, listing.currency)}
                                </span>
                                {listing.originalPrice && listing.originalPrice > listing.price && (
                                    <span className="text-lg text-gray-400 line-through">
                                        {formatPrice(listing.originalPrice, listing.currency)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {!isOwner && listing.status === 'active' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPurchaseModal(true)}
                                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                                >
                                    Buy Now
                                </button>
                                <button
                                    onClick={() => setShowOfferModal(true)}
                                    className="flex-1 py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Make Offer
                                </button>
                            </div>
                        )}

                        {isOwner && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-blue-700 text-sm">
                                    This is your listing. You can manage it from{' '}
                                    <Link href="/marketplace/my-listings" className="underline font-medium">
                                        My Listings
                                    </Link>
                                </p>
                            </div>
                        )}

                        {/* Shipping Info */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <TruckIcon className="h-5 w-5 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {listing.shipping?.domestic?.cost === 0
                                            ? 'Free Shipping'
                                            : `Shipping: ${formatPrice(listing.shipping?.domestic?.cost || 0)}`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Estimated {listing.shipping?.domestic?.estimatedDays || 5}-{(listing.shipping?.domestic?.estimatedDays || 5) + 3} business days
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ClockIcon className="h-5 w-5 text-gray-500" />
                                <p className="text-sm text-gray-600">
                                    Ships within {listing.shipping?.handlingTime || 2} business days
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                            </div>
                        )}

                        {/* Condition Details */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Condition</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                                    <span className="text-gray-600">
                                        Authenticity: {listing.condition?.authenticity || 'Unknown'}
                                    </span>
                                </div>
                                {listing.condition?.description && (
                                    <p className="text-gray-600">{listing.condition.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Seller Info */}
                        {seller && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Seller</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                        {seller.avatar ? (
                                            <img src={seller.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-semibold text-gray-500">
                                                {seller.displayName?.[0]?.toUpperCase() || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{seller.displayName}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <StarIcon className="h-4 w-4 text-yellow-500" />
                                                <span>{seller.rating?.toFixed(1) || 'New'}</span>
                                            </div>
                                            <span>·</span>
                                            <span>{seller.totalSales || 0} sales</span>
                                        </div>
                                    </div>
                                    <button className="p-2 rounded-full hover:bg-gray-100">
                                        <ChatBubbleLeftIcon className="h-6 w-6 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
                            <span>{listing.views} views</span>
                            <span>·</span>
                            <span>{listing.likes} likes</span>
                            <span>·</span>
                            <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Purchase Modal (placeholder) */}
            {showPurchaseModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Complete Purchase</h2>
                        <p className="text-gray-600 mb-6">
                            This is a demo. In production, you would enter your shipping address and payment details here.
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span>Item</span>
                                <span>{formatPrice(listing.price)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span>Shipping</span>
                                <span>{formatPrice(listing.shipping?.domestic?.cost || 0)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2 mt-2">
                                <span>Total</span>
                                <span>{formatPrice(listing.price + (listing.shipping?.domestic?.cost || 0))}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPurchaseModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast('Purchase feature coming soon!', { icon: '🛒' });
                                    setShowPurchaseModal(false);
                                }}
                                className="flex-1 py-2 bg-gray-900 text-white rounded-xl font-medium"
                            >
                                Confirm (Demo)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Offer Modal (placeholder) */}
            {showOfferModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Make an Offer</h2>
                        <p className="text-gray-600 mb-4">
                            Current price: <strong>{formatPrice(listing.price)}</strong>
                        </p>
                        <input
                            type="number"
                            placeholder="Your offer amount"
                            className="w-full p-3 border border-gray-300 rounded-xl mb-4"
                        />
                        <textarea
                            placeholder="Message to seller (optional)"
                            className="w-full p-3 border border-gray-300 rounded-xl mb-6 resize-none"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOfferModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast('Offer feature coming soon!', { icon: '🏷️' });
                                    setShowOfferModal(false);
                                }}
                                className="flex-1 py-2 bg-gray-900 text-white rounded-xl font-medium"
                            >
                                Send Offer (Demo)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
