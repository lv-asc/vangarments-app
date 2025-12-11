'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';

import {
    PhotoIcon,
    ChevronLeftIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

// Map backend condition codes to frontend select values
const conditionBackendToFrontend: Record<string, string> = {
    'dswt': 'new_with_tags',
    'new': 'new_with_tags',
    'never_used': 'new_without_tags',
    'used': 'good' // Default 'used' to 'good' if not specific
};

interface EditWardrobeItemPageProps {
    params: {
        id: string;
    };
}

export default function EditWardrobeItemPage({ params }: EditWardrobeItemPageProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Existing item data
    const [item, setItem] = useState<any>(null);
    const [existingImages, setExistingImages] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        category: '',
        brand: '',
        color: '',
        material: '',
        size: '',
        condition: 'good',
        description: ''
    });

    const [vufsOptions, setVufsOptions] = useState<{
        categories: any[];
        brands: any[];
        colors: any[];
        materials: any[];
    }>({
        categories: [],
        brands: [],
        colors: [],
        materials: []
    });

    const [submitError, setSubmitError] = useState<string | null>(null);

    // Load Options
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [categories, brands, colors, materials] = await Promise.all([
                    apiClient.getVUFSCategories(),
                    apiClient.getVUFSBrands(),
                    apiClient.getVUFSColors(),
                    apiClient.getVUFSMaterials()
                ]);

                setVufsOptions({
                    categories: categories as any[],
                    brands: brands as any[],
                    colors: colors as any[],
                    materials: materials as any[]
                });
            } catch (error) {
                console.error('Failed to load VUFS options', error);
            }
        };
        if (isAuthenticated) {
            loadOptions();
        }
    }, [isAuthenticated]);

    // Load Item Data
    useEffect(() => {
        const loadItem = async () => {
            if (!params.id || !isAuthenticated) return;

            try {
                setLoading(true);
                const response = await apiClient.getWardrobeItem(params.id);
                const currentItem = response.item || response;

                setItem(currentItem);
                setExistingImages(currentItem.images || []);

                // Map backend data to form state
                const conditionCode = currentItem.condition?.status || 'used';

                setFormData({
                    category: currentItem.category?.whiteSubcategory || currentItem.category?.page || '',
                    brand: currentItem.brand?.brand || '',
                    color: currentItem.metadata?.colors?.[0]?.primary || '',
                    material: currentItem.metadata?.composition?.[0]?.material || '',
                    size: currentItem.metadata?.size || '',
                    condition: conditionBackendToFrontend[conditionCode] || 'good',
                    description: currentItem.metadata?.description || ''
                });

            } catch (error) {
                console.error('Failed to load item:', error);
                setSubmitError('Failed to load item data.');
            } finally {
                setLoading(false);
            }
        };

        loadItem();
    }, [params.id, isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setSaving(true);
        try {
            // Map condition back to valid backend values
            const conditionMapping: Record<string, string> = {
                'new_with_tags': 'dswt',
                'new_without_tags': 'never_used',
                'excellent': 'used',
                'good': 'used',
                'fair': 'used',
                'poor': 'used'
            };

            const mappedCondition = conditionMapping[formData.condition] || 'used';

            const updatePayload = {
                category: {
                    ...item.category,
                    page: formData.category,
                    whiteSubcategory: formData.category,
                    blueSubcategory: formData.category
                },
                brand: {
                    ...item.brand,
                    brand: formData.brand || 'Generic'
                },
                metadata: {
                    ...item.metadata,
                    colors: [{ primary: formData.color || 'Black', undertones: [] }],
                    composition: formData.material ? [{ material: formData.material, percentage: 100 }] : [],
                    size: formData.size || 'One Size',
                    description: formData.description || ''
                },
                condition: {
                    ...item.condition,
                    status: mappedCondition
                }
            };

            await apiClient.updateWardrobeItem(params.id, updatePayload);
            router.push(`/wardrobe/${params.id}`);
        } catch (error: any) {
            console.error('Failed to update item:', error);
            setSubmitError(`Failed to update item: ${error.message || 'Please check your inputs and try again.'}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading item...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        Cancel Editing
                    </button>
                </div>

                {submitError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center">
                            <span className="font-bold mr-2">Error:</span>
                            {submitError}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Type Details</h1>
                            <p className="text-gray-500 mt-1">Update information about your item</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Image Display Section (Read Only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Photos (Read Only)
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                {existingImages.map((img: any) => (
                                    <div key={img.id} className="relative aspect-square">
                                        <img
                                            src={getImageUrl(img.url)}
                                            alt={img.imageType}
                                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                                        />
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded text-center">
                                            {img.imageType}
                                        </div>
                                    </div>
                                ))}
                                {existingImages.length === 0 && (
                                    <div className="col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg aspect-video bg-gray-50 text-gray-400">
                                        <PhotoIcon className="h-10 w-10 mb-2" />
                                        <span>No photos found</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                * Photo editing is not currently supported.
                            </p>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    list="categories"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                                <datalist id="categories">
                                    {vufsOptions.categories
                                        .filter(c => c.level === 'blue')
                                        .map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))
                                    }
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    list="brands"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                                <datalist id="brands">
                                    {vufsOptions.brands.map(b => (
                                        <option key={b.id} value={b.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size
                                    </label>
                                    <input
                                        type="text"
                                        list="sizes"
                                        value={formData.size}
                                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                    <datalist id="sizes">
                                        {/* Populate sizes if available in utils/vufs options */}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Color
                                    </label>
                                    <input
                                        type="text"
                                        list="colors"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                    <datalist id="colors">
                                        {vufsOptions.colors.map(c => (
                                            <option key={c.id} value={c.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Material
                                </label>
                                <input
                                    type="text"
                                    list="materials"
                                    value={formData.material}
                                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                                <datalist id="materials">
                                    {vufsOptions.materials.map(m => (
                                        <option key={m.id} value={m.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Condition
                                </label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                    <option value="new_with_tags">New with tags</option>
                                    <option value="new_without_tags">New without tags</option>
                                    <option value="excellent">Excellent used condition</option>
                                    <option value="good">Good used condition</option>
                                    <option value="fair">Fair aspect</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
