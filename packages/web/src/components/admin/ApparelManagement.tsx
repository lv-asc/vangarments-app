'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SmartCombobox } from '@/components/ui/SmartCombobox';
import { MagnifyingGlassIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ApparelIcon, ICON_MAP, ICON_GROUPS } from '@/components/ui/ApparelIcons';

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
    { slug: 'possible-fits', name: 'Possible Fits' },
    { slug: 'icon-slug', name: 'Icon' }
];

export default function ApparelManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [subcategory1Values, setSubcategory1Values] = useState<any[]>([]);
    const [subcategory2Values, setSubcategory2Values] = useState<any[]>([]);
    const [subcategory3Values, setSubcategory3Values] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [search, setSearch] = useState('');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Record<string, any>>({});

    // POM State
    const [pomCategories, setPomCategories] = useState<any[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<any[]>([]);
    const [selectedPOMs, setSelectedPOMs] = useState<string[]>([]);
    const [expandedPOMCategories, setExpandedPOMCategories] = useState<Set<string>>(new Set());

    // Package Measurement Types (from /admin/measurements)
    const [packageMeasurementTypes, setPackageMeasurementTypes] = useState<any[]>([]);

    useEffect(() => {
        init();
    }, []);



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
            const [cats, matrix, sizeRes, fitRes, pomCats, pomDefs, pkgTypes, sub1Vals, sub2Vals, sub3Vals] = await Promise.all([
                apiClient.getVUFSCategories(),
                apiClient.getAllCategoryAttributes(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSFits(),
                apiClient.getPOMCategories().catch(() => []),
                apiClient.getPOMDefinitions().catch(() => []),
                apiClient.getPackageMeasurementTypes().catch(() => []),
                apiClient.getVUFSAttributeValues('subcategory-1').catch(() => []),
                apiClient.getVUFSAttributeValues('subcategory-2').catch(() => []),
                apiClient.getVUFSAttributeValues('subcategory-3').catch(() => [])
            ]);
            setCategories(cats || []);
            setCategoryAttributes(matrix || []);
            setSizes(sizeRes || []);
            setFits(fitRes || []);
            setPomCategories(Array.isArray(pomCats) ? pomCats : []);
            setPomDefinitions(Array.isArray(pomDefs) ? pomDefs : []);
            setPackageMeasurementTypes(Array.isArray(pkgTypes) ? pkgTypes : []);
            setSubcategory1Values(Array.isArray(sub1Vals) ? sub1Vals : []);
            setSubcategory2Values(Array.isArray(sub2Vals) ? sub2Vals : []);
            setSubcategory3Values(Array.isArray(sub3Vals) ? sub3Vals : []);
            // Expand all POM categories by default
            if (Array.isArray(pomCats)) {
                setExpandedPOMCategories(new Set(pomCats.map((c: any) => c.id)));
            }
        } catch (error) {
            console.error('Failed to init', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Comprehensive Google Shopping Categories mapping
    const GOOGLE_SHOPPING_MAP: Record<string, { category: string; code: string }> = {
        // Tops
        't-shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'baby tee': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'long-sleeved t-shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'polo shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Polos', code: '5388' },
        'button-up shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'tank top': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'crop top': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'blouse': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'henley': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        'jersey': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
        // Sweaters & Hoodies
        'sweater': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweaters', code: '5441' },
        'hoodie': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts', code: '5365' },
        'sweatshirt': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts', code: '5365' },
        'cardigan': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweaters', code: '5441' },
        'pullover': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweaters', code: '5441' },
        // Outerwear
        'jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'bomber jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'button-up jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'zip-up jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'coat': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'puffer jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'windbreaker': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'trench coat': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
        'vest': { category: 'Apparel & Accessories > Clothing > Outerwear > Vests', code: '5506' },
        // Bottoms
        'jeans': { category: 'Apparel & Accessories > Clothing > Pants > Jeans', code: '204' },
        'pants': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
        'trousers': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
        'chinos': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
        'cargo pants': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
        'joggers': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatpants', code: '5463' },
        'sweatpants': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatpants', code: '5463' },
        'leggings': { category: 'Apparel & Accessories > Clothing > Pants > Leggings', code: '5460' },
        'shorts': { category: 'Apparel & Accessories > Clothing > Shorts', code: '207' },
        'skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
        'mini skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
        'midi skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
        'maxi skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
        // One-Pieces
        'dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
        'maxi dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
        'midi dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
        'mini dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
        'jumpsuit': { category: 'Apparel & Accessories > Clothing > One-Pieces > Jumpsuits & Rompers', code: '5250' },
        'romper': { category: 'Apparel & Accessories > Clothing > One-Pieces > Jumpsuits & Rompers', code: '5250' },
        'overalls': { category: 'Apparel & Accessories > Clothing > One-Pieces > Overalls', code: '5322' },
        'bodysuit': { category: 'Apparel & Accessories > Clothing > One-Pieces', code: '184' },
        // Suits & Formal
        'suit': { category: 'Apparel & Accessories > Clothing > Suits', code: '5466' },
        'blazer': { category: 'Apparel & Accessories > Clothing > Suits > Suit Jackets', code: '5427' },
        'sport coat': { category: 'Apparel & Accessories > Clothing > Suits > Suit Jackets', code: '5427' },
        // Swimwear
        'swimsuit': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
        'bikini': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
        'swim trunks': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
        'board shorts': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
        // Underwear
        'underwear': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Underwear', code: '213' },
        'boxers': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Underwear', code: '213' },
        'briefs': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Underwear', code: '213' },
        'bra': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Bras', code: '214' },
        'socks': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Socks', code: '209' },
        // Footwear
        'shoes': { category: 'Apparel & Accessories > Shoes', code: '187' },
        'sneakers': { category: 'Apparel & Accessories > Shoes > Athletic Shoes', code: '187' },
        'boots': { category: 'Apparel & Accessories > Shoes > Boots', code: '187' },
        'sandals': { category: 'Apparel & Accessories > Shoes > Sandals', code: '187' },
        'loafers': { category: 'Apparel & Accessories > Shoes > Flats & Loafers', code: '187' },
        'heels': { category: 'Apparel & Accessories > Shoes > Heels', code: '187' },
        'slippers': { category: 'Apparel & Accessories > Shoes > Slippers', code: '187' },
        // Headwear
        'hat': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        'cap': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        'beanie': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        'bucket hat': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        'fedora': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        'beret': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        'visor': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
        // Bags
        'bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '6551' },
        'backpack': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Backpacks', code: '110' },
        'tote': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Totes', code: '6551' },
        'crossbody bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '6551' },
        'clutch': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Clutches & Special Occasion Bags', code: '178' },
        'shoulder bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '6551' },
        'duffle bag': { category: 'Apparel & Accessories > Luggage & Bags > Duffel Bags', code: '110' },
        'messenger bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Messenger Bags', code: '110' },
        'fanny pack': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '110' },
        // Wallets & Small Leather Goods
        'wallet': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips', code: '6169' },
        'card holder': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips', code: '6169' },
        // Accessories
        'belt': { category: 'Apparel & Accessories > Clothing Accessories > Belts', code: '174' },
        'scarf': { category: 'Apparel & Accessories > Clothing Accessories > Scarves & Shawls', code: '175' },
        'gloves': { category: 'Apparel & Accessories > Clothing Accessories > Gloves & Mittens', code: '2020' },
        'tie': { category: 'Apparel & Accessories > Clothing Accessories > Neckties', code: '176' },
        'bow tie': { category: 'Apparel & Accessories > Clothing Accessories > Neckties', code: '176' },
        'sunglasses': { category: 'Apparel & Accessories > Clothing Accessories > Sunglasses', code: '178' },
        'watch': { category: 'Apparel & Accessories > Jewelry > Watches', code: '201' },
        'jewelry': { category: 'Apparel & Accessories > Jewelry', code: '188' },
        'necklace': { category: 'Apparel & Accessories > Jewelry > Necklaces', code: '196' },
        'bracelet': { category: 'Apparel & Accessories > Jewelry > Bracelets', code: '191' },
        'ring': { category: 'Apparel & Accessories > Jewelry > Rings', code: '200' },
        'earrings': { category: 'Apparel & Accessories > Jewelry > Earrings', code: '194' },
        'keychain': { category: 'Apparel & Accessories > Clothing Accessories > Keychains', code: '3081' },
    };

    // Get Google Shopping info for a category name
    const getGoogleShoppingInfo = (categoryName: string): { category: string; code: string } => {
        const name = categoryName.toLowerCase();
        // Exact match first
        if (GOOGLE_SHOPPING_MAP[name]) {
            return GOOGLE_SHOPPING_MAP[name];
        }
        // Partial match
        for (const [key, value] of Object.entries(GOOGLE_SHOPPING_MAP)) {
            if (name.includes(key) || key.includes(name)) {
                return value;
            }
        }
        // Default
        return { category: 'Apparel & Accessories > Clothing', code: '1604' };
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

    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        const loadCategoryData = async () => {
            if (selectedCategory) {
                setCategoryName(selectedCategory.name);
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

                // Auto-fill Google Shopping fields if empty
                if (!newForm['google-shopping-category'] || !newForm['google-shopping-code']) {
                    const googleInfo = getGoogleShoppingInfo(selectedCategory.name);
                    if (!newForm['google-shopping-category']) {
                        newForm['google-shopping-category'] = googleInfo.category;
                    }
                    if (!newForm['google-shopping-code']) {
                        newForm['google-shopping-code'] = googleInfo.code;
                    }
                }

                setFormData(newForm);

                // Fetch POMs linked to this apparel type
                try {
                    const linkedPOMs = await apiClient.getApparelPOMs(selectedCategory.id);
                    setSelectedPOMs(Array.isArray(linkedPOMs) ? linkedPOMs.map((p: any) => p.id) : []);
                } catch (e) {
                    console.error('Failed to fetch apparel POMs', e);
                    setSelectedPOMs([]);
                }
            } else {
                setFormData({});
                setCategoryName('');
                setSelectedPOMs([]);
            }
        };

        loadCategoryData();
    }, [selectedCategory, categoryAttributes]);

    const handleSave = async () => {
        if (!selectedCategory) return;
        setSaving(true);
        try {
            // Update name if changed
            if (categoryName !== selectedCategory.name) {
                await apiClient.updateVUFSCategory(selectedCategory.id, { name: categoryName });
            }

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

            // Save apparel-POM mappings
            await apiClient.setApparelPOMs(
                selectedCategory.id,
                selectedPOMs.map((pomId, index) => ({
                    pomId,
                    isRequired: false,
                    sortOrder: index + 1
                }))
            );
            toast.success('Changes saved');

            // Refresh categories list to reflect name change
            const cats = await apiClient.getVUFSCategories();
            setCategories(cats || []);

            // Update selected category reference to avoid reverting name
            const updatedCat = cats.find((c: any) => c.id === selectedCategory.id);
            if (updatedCat) setSelectedCategory(updatedCat);

            // Refresh matrix
            const matrix = await apiClient.getAllCategoryAttributes();
            setCategoryAttributes(matrix);
        } catch (error) {
            console.error('Failed to save', error);
            toast.error('Failed to save changes');
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
                    {filteredCategories.map(cat => {
                        const iconAttr = categoryAttributes.find((a: any) => a.category_id === cat.id && a.attribute_slug === 'icon-slug');
                        const iconSlug = iconAttr?.value;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group ${selectedCategory?.id === cat.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <ApparelIcon name={cat.name} icon={iconSlug} className={`w-5 h-5 ${selectedCategory?.id === cat.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className={`text-sm ${selectedCategory?.id === cat.id ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                                        {cat.name}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main: Form */}
            <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
                {selectedCategory ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2 group/title">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        className="text-xl font-bold text-gray-900 border-b-2 border-dashed border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:border-solid focus:outline-none bg-transparent px-1 py-0.5 min-w-[150px] transition-all pr-8"
                                        placeholder="Category Name"
                                        title="Click to rename"
                                    />
                                    <PencilIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover/title:text-blue-500 transition-colors" />
                                </div>
                                <span className="text-xl font-bold text-gray-900">Attributes</span>
                            </div>
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
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Classification</h3>
                                    <a
                                        href="/admin/categories"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Manage Categories →
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 1</label>
                                        <SmartCombobox
                                            value={formData['subcategory-1'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory-1': val })}
                                            options={subcategory1Values.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 2</label>
                                        <SmartCombobox
                                            value={formData['subcategory-2'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory-2': val })}
                                            options={subcategory2Values.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Subcategory 3</label>
                                        <SmartCombobox
                                            value={formData['subcategory-3'] || ''}
                                            onChange={(val) => setFormData({ ...formData, 'subcategory-3': val })}
                                            options={subcategory3Values.map((v: any) => ({ id: v.id, name: v.name }))}
                                            placeholder="Select or type..."
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
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                            <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto bg-white/50">
                                {Object.entries(ICON_GROUPS).map(([groupName, icons]) => (
                                    <div key={groupName} className="mb-4 last:mb-0">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{groupName}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {icons.map((iconKey) => {
                                                const isSelected = formData['icon-slug'] === iconKey;
                                                return (
                                                    <button
                                                        key={iconKey}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, 'icon-slug': iconKey })}
                                                        className={`p-2 rounded-md border flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isSelected
                                                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-500'
                                                            : 'bg-white border-gray-200 hover:border-blue-300 text-gray-400 hover:text-gray-600'
                                                            }`}
                                                        title={iconKey.replace(/-/g, ' ')}
                                                    >
                                                        <ApparelIcon name="" icon={iconKey} className="w-5 h-5" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Package Measurements */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Package Measurements</h3>
                                <a
                                    href="/admin/measurements"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Manage Types →
                                </a>
                            </div>
                            <p className="text-xs text-gray-500 -mt-2">Default package dimensions for this apparel type (used for shipping calculations)</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={formData['height-cm'] || ''}
                                        onChange={(e) => setFormData({ ...formData, 'height-cm': e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        value={formData['length-cm'] || ''}
                                        onChange={(e) => setFormData({ ...formData, 'length-cm': e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                                    <input
                                        type="number"
                                        step="1"
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

                        {/* Measurements (POMs) */}
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Measurements (POMs)</h3>
                            <p className="text-xs text-gray-500">Select the measurement points that apply to this apparel type.</p>

                            <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
                                {pomCategories.map(category => {
                                    const categoryPOMs = pomDefinitions.filter(p => p.category_id === category.id);
                                    const isExpanded = expandedPOMCategories.has(category.id);

                                    return (
                                        <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setExpandedPOMCategories(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(category.id)) {
                                                            next.delete(category.id);
                                                        } else {
                                                            next.add(category.id);
                                                        }
                                                        return next;
                                                    });
                                                }}
                                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                                    )}
                                                    <span className="font-medium text-gray-700">{category.name}</span>
                                                    <span className="text-xs text-gray-500">({categoryPOMs.length})</span>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="bg-gray-50 px-4 py-2 space-y-2">
                                                    {categoryPOMs.map(pom => (
                                                        <label key={pom.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPOMs.includes(pom.id)}
                                                                onChange={() => {
                                                                    setSelectedPOMs(prev =>
                                                                        prev.includes(pom.id)
                                                                            ? prev.filter(id => id !== pom.id)
                                                                            : [...prev, pom.id]
                                                                    );
                                                                }}
                                                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-xs font-bold text-blue-600">{pom.code}</span>
                                                                    <span className="text-sm text-gray-900">{pom.name}</span>
                                                                    {pom.is_half_measurement && (
                                                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">HALF</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 truncate max-w-md">{pom.description}</p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedPOMs.length > 0 && (
                                <div className="text-sm text-gray-600">
                                    <strong>{selectedPOMs.length}</strong> measurement(s) selected
                                </div>
                            )}
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
    );
}
