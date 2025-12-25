'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SmartCombobox } from '@/components/ui/SmartCombobox';
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';


interface AttributeType {
    slug: string;
    name: string;
}

const REQUIRED_ATTRIBUTES: AttributeType[] = [
    { slug: 'subcategory_1', name: 'Subcategory 1' },
    { slug: 'subcategory_2', name: 'Subcategory 2' },
    { slug: 'google_shopping_category', name: 'Google Shopping Category' },
    { slug: 'google_shopping_code', name: 'Google Shopping Code' },
    { slug: 'height_cm', name: 'Height (cm)' },
    { slug: 'length_cm', name: 'Length (cm)' },
    { slug: 'width_cm', name: 'Width (cm)' },
    { slug: 'weight_kg', name: 'Weight (kg)' },
    { slug: 'possible_sizes', name: 'Possible Sizes' },
    { slug: 'possible_fits', name: 'Possible Fits' }
];

export default function ApparelManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [subcategory1Values, setSubcategory1Values] = useState<any[]>([]);
    const [subcategory2Values, setSubcategory2Values] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [search, setSearch] = useState('');

    // Form State
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            // Load attributes for this category
            const attrs = categoryAttributes.filter((ca: any) => ca.category_id == selectedCategory.id);
            const newForm: Record<string, any> = {};
            REQUIRED_ATTRIBUTES.forEach(attr => {
                const found = attrs.find((a: any) => a.attribute_slug === attr.slug);
                let val = found?.value || '';
                // Handle JSON fields (arrays)
                if (attr.slug === 'possible_sizes' || attr.slug === 'possible_fits') {
                    try {
                        val = val ? JSON.parse(val) : [];
                    } catch (e) {
                        val = [];
                    }
                }
                newForm[attr.slug] = val;
            });
            setFormData(newForm);
        } else {
            setFormData({});
        }
    }, [selectedCategory, categoryAttributes]);

    const init = async () => {
        setLoading(true);
        try {
            await ensureAttributeTypes();
            const [cats, matrix, sizeRes, fitRes, sub1Res, sub2Res] = await Promise.all([
                apiClient.getVUFSCategories(),
                apiClient.getAllCategoryAttributes(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSAttributeValues('subcategory-1'),
                apiClient.getVUFSAttributeValues('subcategory-2')
            ]);
            setCategories(cats || []);
            setCategoryAttributes(matrix || []);
            setSizes(sizeRes || []);
            setFits(fitRes || []);
            setSubcategory1Values(Array.isArray(sub1Res) ? sub1Res : []);
            setSubcategory2Values(Array.isArray(sub2Res) ? sub2Res : []);
        } catch (error) {
            console.error('Failed to init', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const ensureAttributeTypes = async () => {
        try {
            const existingTypes = await apiClient.getVUFSAttributeTypes();
            for (const required of REQUIRED_ATTRIBUTES) {
                if (!existingTypes.find((t: any) => t.slug === required.slug)) {
                    await apiClient.addVUFSAttributeType(required.slug, required.name);
                }
            }
        } catch (e) {
            console.error('Failed to ensure attribute types', e);
        }
    };

    const handleSave = async () => {
        if (!selectedCategory) return;
        setSaving(true);
        try {
            for (const attr of REQUIRED_ATTRIBUTES) {
                let value = formData[attr.slug];
                if (Array.isArray(value)) {
                    value = JSON.stringify(value);
                }
                // Upsert handles it.
                await apiClient.setCategoryAttribute(
                    selectedCategory.id,
                    attr.slug,
                    value !== undefined ? String(value) : ''
                );
            }
            toast.success('Attributes saved');
            // Refresh matrix
            const matrix = await apiClient.getAllCategoryAttributes();
            setCategoryAttributes(matrix);
        } catch (error) {
            console.error('Failed to save', error);
            toast.error('Failed to save attributes');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = () => {
        if (!selectedCategory) return;
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCategory) return;

        setDeleting(true);
        try {
            await apiClient.deleteVUFSCategory(selectedCategory.id);
            toast.success('Category deleted successfully');
            setSelectedCategory(null);
            setShowDeleteConfirm(false);
            // Refresh categories
            const cats = await apiClient.getVUFSCategories();
            setCategories(cats || []);
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete category');
        } finally {
            setDeleting(false);
        }
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [categories, search]);

    const handleMultiSelect = (slug: string, id: string) => {
        setFormData(prev => {
            const current = (prev[slug] as string[]) || [];
            if (current.includes(id)) {
                return { ...prev, [slug]: current.filter(x => x !== id) };
            } else {
                return { ...prev, [slug]: [...current, id] };
            }
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Apparel Data...</div>;

    return (
        <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
            {/* Sidebar: Categories */}
            <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-4 flex flex-col">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Select Apparel</h2>
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto max-h-[600px] border-t border-gray-100 divide-y divide-gray-100">
                    {filteredCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group ${selectedCategory?.id === cat.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                        >
                            <span className={`text-sm ${selectedCategory?.id === cat.id ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                                {cat.name}
                            </span>
                            {cat.parentId && <span className="text-xs text-gray-400">Child</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main: Form */}
            <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
                {selectedCategory ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name} Attributes</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleDeleteClick}
                                    disabled={saving || deleting}
                                    className="flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                                    title="Delete Category"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                                <Button onClick={handleSave} disabled={saving || deleting}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Classification */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Classification</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 1</label>
                                        <SmartCombobox
                                            value={formData['subcategory_1'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory_1': val })}
                                            options={subcategory1Values.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type subcategory..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 2</label>
                                        <SmartCombobox
                                            value={formData['subcategory_2'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory_2': val })}
                                            options={subcategory2Values.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type subcategory..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Google Shopping */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Google Shopping</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Google Shopping Category</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['google_shopping_category'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'google_shopping_category': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Google Shopping Code</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['google_shopping_code'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'google_shopping_code': e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dimensions & Weight */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Physical Properties</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['height_cm'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'height_cm': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['length_cm'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'length_cm': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['width_cm'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'width_cm': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['weight_kg'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'weight_kg': e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Possible Sizes */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Configuration</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Possible Sizes</label>
                                    <div className="flex flex-wrap gap-2 border rounded-md p-4 bg-gray-50 max-h-40 overflow-y-auto">
                                        {sizes.map(size => (
                                            <button
                                                key={size.id}
                                                type="button"
                                                onClick={() => handleMultiSelect('possible_sizes', size.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${(formData['possible_sizes'] || []).includes(size.id)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {size.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Possible Fits */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Possible Fits</label>
                                    <div className="flex flex-wrap gap-2 border rounded-md p-4 bg-gray-50 max-h-40 overflow-y-auto">
                                        {fits.map(fit => (
                                            <button
                                                key={fit.id}
                                                type="button"
                                                onClick={() => handleMultiSelect('possible_fits', fit.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${(formData['possible_fits'] || []).includes(fit.id)
                                                    ? 'bg-purple-600 text-white border-purple-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {fit.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <TagIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Select an Apparel Category to manage attributes</p>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Category"
                message={`Are you sure you want to delete "${selectedCategory?.name}"? This will also delete ALL subcategories. This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={deleting}
            />
        </div>
    );
}

// Helper Icon
function TagIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.593l6.202-2.073c1.192-.399 1.547-1.939.754-2.731l-9.822-9.822A2.25 2.25 0 0011.528 3h-1.96z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.75a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
        </svg>
    )
}
