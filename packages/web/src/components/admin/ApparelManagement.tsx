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
    { slug: 'subcategory-1', name: 'Subcategory 1' },
    { slug: 'subcategory-2', name: 'Subcategory 2' },
    { slug: 'subcategory-3', name: 'Subcategory 3' },
    { slug: 'google-shopping-category', name: 'Google Shopping Category' },
    { slug: 'google-shopping-code', name: 'Google Shopping Code' },
    { slug: 'height-cm', name: 'Height (cm)' },
    { slug: 'length-cm', name: 'Length (cm)' },
    { slug: 'width-cm', name: 'Width (cm)' },
    { slug: 'weight-kg', name: 'Weight (kg)' },
    { slug: 'possible-sizes', name: 'Possible Sizes' },
    { slug: 'possible-fits', name: 'Possible Fits' }
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
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
                if (attr.slug === 'possible-sizes' || attr.slug === 'possible-fits') {
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

    // Handle clicking outside of dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.relative')) {
                setOpenDropdown(null);
            }
        };

        if (openDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDropdown]);

    const init = async () => {
        setLoading(true);
        try {
            await ensureAttributeTypes();
            const [cats, matrix, sizeRes, fitRes] = await Promise.all([
                apiClient.getVUFSCategories(),
                apiClient.getAllCategoryAttributes(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSFits()
            ]);
            setCategories(cats || []);
            setCategoryAttributes(matrix || []);
            setSizes(sizeRes || []);
            setFits(fitRes || []);
        } catch (error) {
            console.error('Failed to init', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuggestion = () => {
        if (!selectedCategory) return;
        const name = selectedCategory.name.toLowerCase();

        // Basic mapping for Google Shopping Categories
        // Full list at: https://www.google.com/base/taxonomy-with-ids.en-US.txt
        const mapping: Record<string, { category: string, code: string }> = {
            'dresses': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
            't-shirts': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
            'pants': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
            'shorts': { category: 'Apparel & Accessories > Clothing > Shorts', code: '207' },
            'skirts': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
            'outerwear': { category: 'Apparel & Accessories > Clothing > Outerwear', code: '203' },
            'jackets': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
            'jeans': { category: 'Apparel & Accessories > Clothing > Pants > Jeans', code: '204' },
            'headwear': { category: 'Apparel & Accessories > Clothing Accessories > Headwear', code: '173' },
            'shoes': { category: 'Apparel & Accessories > Shoes', code: '187' }
        };

        const found = Object.entries(mapping).find(([key]) => name.includes(key));
        if (found) {
            setFormData(prev => ({
                ...prev,
                'google-shopping-category': found[1].category,
                'google-shopping-code': found[1].code
            }));
            toast.success(`Suggested Google Shopping info for ${found[0]}`);
        } else {
            setFormData(prev => ({
                ...prev,
                'google-shopping-category': 'Apparel & Accessories > Clothing',
                'google-shopping-code': '1604'
            }));
            toast.success('Used default Apparel & Accessories category');
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 1</label>
                                        <SmartCombobox
                                            value={formData['subcategory-1'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory-1': val })}
                                            options={categories.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 2</label>
                                        <SmartCombobox
                                            value={formData['subcategory-2'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory-2': val })}
                                            options={categories.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 3</label>
                                        <SmartCombobox
                                            value={formData['subcategory-3'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory-3': val })}
                                            options={categories.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Google Shopping */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Google Shopping</h3>
                                    <button
                                        onClick={handleGoogleSuggestion}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Suggest Info
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Google Shopping Category</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['google-shopping-category'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'google-shopping-category': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Google Shopping Code</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['google-shopping-code'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'google-shopping-code': e.target.value })}
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
                                            value={formData['height-cm'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'height-cm': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['length-cm'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'length-cm': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['width-cm'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'width-cm': e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData['weight-kg'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'weight-kg': e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Possible Sizes */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Configuration</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Possible Sizes</label>
                                    <div className="relative">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData['possible-sizes'] || []).map((id: string) => {
                                                const size = sizes.find(s => s.id === id);
                                                return (
                                                    <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                                                        {size?.name || id}
                                                        <button onClick={() => handleMultiSelect('possible-sizes', id)} className="ml-1 hover:text-blue-900 font-bold">&times;</button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search and Select Sizes..."
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
                                            onFocus={() => setOpenDropdown('possible-sizes')}
                                            onChange={(e) => {
                                                const term = e.target.value.toLowerCase();
                                                const list = e.currentTarget.nextElementSibling?.nextElementSibling;
                                                if (list) {
                                                    const labels = list.querySelectorAll('label');
                                                    labels.forEach(l => {
                                                        const txt = l.textContent?.toLowerCase() || '';
                                                        (l as HTMLElement).style.display = txt.includes(term) ? 'flex' : 'none';
                                                    });
                                                }
                                            }}
                                        />
                                        {openDropdown === 'possible-sizes' && (
                                            <button onClick={() => setOpenDropdown(null)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                        <div
                                            className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
                                            style={{ display: openDropdown === 'possible-sizes' ? 'block' : 'none' }}
                                        >
                                            <div className="dropdown-list">
                                                {sizes.map(size => (
                                                    <label key={size.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData['possible-sizes'] || []).includes(size.id)}
                                                            onChange={(e) => { e.stopPropagation(); handleMultiSelect('possible-sizes', size.id); }}
                                                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-700">{size.name}</span>
                                                        {(formData['possible-sizes'] || []).includes(size.id) && (
                                                            <svg className="ml-auto h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
                                                <button type="button" onClick={() => setOpenDropdown(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded">Done</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Possible Fits</label>
                                    <div className="relative">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(formData['possible-fits'] || []).map((id: string) => {
                                                const fit = fits.find(f => f.id === id);
                                                return (
                                                    <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs">
                                                        {fit?.name || id}
                                                        <button onClick={() => handleMultiSelect('possible-fits', id)} className="ml-1 hover:text-purple-900 font-bold">&times;</button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search and Select Fits..."
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
                                            onFocus={() => setOpenDropdown('possible-fits')}
                                            onChange={(e) => {
                                                const term = e.target.value.toLowerCase();
                                                const list = e.currentTarget.nextElementSibling?.nextElementSibling;
                                                if (list) {
                                                    const labels = list.querySelectorAll('label');
                                                    labels.forEach(l => {
                                                        const txt = l.textContent?.toLowerCase() || '';
                                                        (l as HTMLElement).style.display = txt.includes(term) ? 'flex' : 'none';
                                                    });
                                                }
                                            }}
                                        />
                                        {openDropdown === 'possible-fits' && (
                                            <button onClick={() => setOpenDropdown(null)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                        <div
                                            className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
                                            style={{ display: openDropdown === 'possible-fits' ? 'block' : 'none' }}
                                        >
                                            <div className="dropdown-list">
                                                {fits.map(fit => (
                                                    <label key={fit.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData['possible-fits'] || []).includes(fit.id)}
                                                            onChange={(e) => { e.stopPropagation(); handleMultiSelect('possible-fits', fit.id); }}
                                                            className="h-4 w-4 text-purple-600 rounded border-gray-300"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-700">{fit.name}</span>
                                                        {(formData['possible-fits'] || []).includes(fit.id) && (
                                                            <svg className="ml-auto h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
                                                <button type="button" onClick={() => setOpenDropdown(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded">Done</button>
                                            </div>
                                        </div>
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
