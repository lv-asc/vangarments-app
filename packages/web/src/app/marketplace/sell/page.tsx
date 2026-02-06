'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeftIcon,
    PhotoIcon,
    CurrencyDollarIcon,
    TruckIcon,
    TagIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getImageUrl } from '@/utils/imageUrl';
import { WardrobeItemCard } from '@/components/wardrobe/WardrobeItemCard';
import { Switch } from '@/components/ui/Switch';
import { processImagesForCard } from '@/utils/wardrobeImages';
import toast from 'react-hot-toast';

interface WardrobeItem {
    id: string;
    name: string;
    category: string;
    brand?: string;
    color: string;
    size?: string;
    condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
    images: any[];
    purchasePrice?: number;
    estimatedValue?: number;
    timesWorn: number;
    lastWorn?: Date;
    isFavorite: boolean;
    isForSale: boolean;
    tags: string[];
    vufsCode: string;
    brandInfo?: any;
    lineInfo?: any;
    collectionInfo?: any;
    metadata?: any;
}

export default function SellItemPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        condition: 'excellent',
        conditionDescription: '',
        authenticity: 'guaranteed',
        shippingCost: '0',
        shippingDays: '5',
        handlingTime: '2'
    });

    // Toggle for No BG
    const [showOriginalBackgrounds, setShowOriginalBackgrounds] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wardrobe-show-original-bg');
            return saved === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('wardrobe-show-original-bg', String(showOriginalBackgrounds));
        }
    }, [showOriginalBackgrounds]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchWardrobeItems = async () => {
            try {
                const response = await apiClient.getWardrobeItems() || { items: [] };
                // Transform API response to match card expectations if needed
                const items = (response.items || []).map((item: any) => ({
                    ...item,
                    name: item.metadata?.name || item.name || 'Unnamed Item',
                    brand: item.brandInfo?.name || item.brand?.name || item.brand,
                    vufsCode: item.vufsCode || item.code,
                }));
                setWardrobeItems(items);
            } catch (error) {
                console.error('Failed to fetch wardrobe items:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchWardrobeItems();
        }
    }, [user, authLoading, router]);

    const handleSubmit = async () => {
        if (!selectedItem) return;

        setSubmitting(true);
        try {
            await apiClient.createMarketplaceListing({
                itemId: selectedItem.id,
                title: formData.title || selectedItem.name,
                description: formData.description,
                price: parseFloat(formData.price),
                condition: {
                    status: formData.condition,
                    description: formData.conditionDescription,
                    authenticity: formData.authenticity
                },
                shipping: {
                    domestic: {
                        available: true,
                        cost: parseFloat(formData.shippingCost),
                        estimatedDays: parseInt(formData.shippingDays)
                    },
                    handlingTime: parseInt(formData.handlingTime)
                },
                images: selectedItem.images.map(img => typeof img === 'string' ? img : img.url),
                category: selectedItem.category,
                tags: selectedItem.brand ? [selectedItem.brand] : []
            });

            toast.success('Listing created successfully!');
            router.push('/marketplace/my-listings?success=1');
        } catch (error: any) {
            console.error('Failed to create listing:', error);
            const errorMessage = error.message || 'Failed to create listing. Please try again.';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const conditions = [
        { value: 'new', label: 'New with Tags', description: 'Never worn, original tags attached' },
        { value: 'dswt', label: 'Deadstock', description: 'Never worn, no tags but perfect condition' },
        { value: 'never_used', label: 'Never Used', description: 'Never worn but may have minor imperfections' },
        { value: 'excellent', label: 'Excellent', description: 'Worn 1-2 times, no visible wear' },
        { value: 'good', label: 'Good', description: 'Light wear, no major flaws' },
        { value: 'fair', label: 'Fair', description: 'Visible wear or minor flaws' }
    ];

    if (authLoading || (!user && !authLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                            {step > 1 ? 'Back' : 'Cancel'}
                        </button>
                        <h1 className="text-lg font-semibold">Sell Item</h1>
                        <div className="w-16" /> {/* Spacer */}
                    </div>
                </div>

                {/* Progress */}
                <div className="max-w-2xl mx-auto px-4 pb-4">
                    <div className="flex gap-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-gray-900' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Step 1: Select Item */}
                {step === 1 && (
                    <div>
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Select an item to sell</h2>
                                <p className="text-gray-600">Choose from your wardrobe</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold transition-colors ${showOriginalBackgrounds ? 'text-gray-900' : 'text-gray-400'}`}>Original</span>
                                    <Switch
                                        checked={!showOriginalBackgrounds}
                                        onCheckedChange={(checked) => setShowOriginalBackgrounds(!checked)}
                                    />
                                    <span className={`text-xs font-bold transition-colors ${!showOriginalBackgrounds ? 'text-indigo-600' : 'text-gray-400'}`}>No BG</span>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="aspect-square bg-gray-200 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : wardrobeItems.length === 0 ? (
                            <div className="text-center py-12">
                                <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">No items in your wardrobe yet</p>
                                <Link href="/wardrobe" className="text-gray-900 underline font-medium">
                                    Add items to your wardrobe first
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-6">
                                {wardrobeItems.map((item) => {
                                    const cardItem = processImagesForCard(item, showOriginalBackgrounds);

                                    return (
                                        <div key={item.id} className="relative">
                                            <WardrobeItemCard
                                                item={cardItem}
                                                onView={() => {
                                                    setSelectedItem(item);
                                                    setFormData({ ...formData, title: item.name });
                                                    setStep(2);
                                                }}
                                                isSelected={selectedItem?.id === item.id}
                                                onSelect={() => {
                                                    setSelectedItem(item);
                                                    setFormData({ ...formData, title: item.name });
                                                }}
                                                isCompact={true}
                                                onToggleFavorite={() => { }}
                                                onToggleForSale={() => { }}
                                            />
                                            {selectedItem?.id === item.id && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className="bg-gray-900 text-white p-1 rounded-full">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Demo: If no items, show sample */}
                        {!loading && wardrobeItems.length === 0 && (
                            <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <p className="text-yellow-800 text-sm mb-3">
                                    <strong>Demo Mode:</strong> No wardrobe items found. Click below to test with a sample item.
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedItem({
                                            id: 'demo-item',
                                            name: 'Sample Fashion Item',
                                            images: [],
                                            brand: 'Demo Brand',
                                            category: 'Apparel',
                                            color: 'Black',
                                            condition: 'excellent',
                                            timesWorn: 0,
                                            isFavorite: false,
                                            isForSale: false,
                                            tags: [],
                                            vufsCode: 'DEMO123'
                                        });
                                        setFormData({ ...formData, title: 'Sample Fashion Item' });
                                        setStep(2);
                                    }}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                                >
                                    Use Demo Item
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Pricing & Details */}
                {step === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Set your price</h2>
                        <p className="text-gray-600 mb-6">Add pricing and condition details</p>

                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="e.g., Nike Air Max 90 - Size 42"
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price (R$)</label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* Condition */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {conditions.map((cond) => (
                                        <button
                                            key={cond.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, condition: cond.value })}
                                            className={`p-3 rounded-xl text-left border-2 transition-colors ${formData.condition === cond.value
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-medium text-sm">{cond.label}</p>
                                            <p className="text-xs text-gray-500">{cond.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                                    rows={4}
                                    placeholder="Describe any details, flaws, or special features..."
                                />
                            </div>

                            <button
                                onClick={() => setStep(3)}
                                disabled={!formData.price}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Shipping & Review */}
                {step === 3 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Shipping & Review</h2>
                        <p className="text-gray-600 mb-6">Set shipping options and publish</p>

                        <div className="space-y-6">
                            {/* Shipping Cost */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost (R$)</label>
                                <div className="relative">
                                    <TruckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="number"
                                        value={formData.shippingCost}
                                        onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                                        className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="0 for free shipping"
                                        min="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter 0 for free shipping</p>
                            </div>

                            {/* Handling Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Handling Time (days)</label>
                                <select
                                    value={formData.handlingTime}
                                    onChange={(e) => setFormData({ ...formData, handlingTime: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                >
                                    <option value="1">1 business day</option>
                                    <option value="2">2 business days</option>
                                    <option value="3">3 business days</option>
                                    <option value="5">5 business days</option>
                                </select>
                            </div>

                            {/* Review Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold mb-3">Listing Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Item</span>
                                        <span className="font-medium">{formData.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price</span>
                                        <span className="font-medium">R$ {formData.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Condition</span>
                                        <span className="font-medium">
                                            {conditions.find(c => c.value === formData.condition)?.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-medium">
                                            {parseFloat(formData.shippingCost) === 0 ? 'Free' : `R$ ${formData.shippingCost}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-5 w-5" />
                                        Publish Listing
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
