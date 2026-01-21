
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from '@/components/admin/MediaUploader';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, PhotoIcon, EyeIcon } from '@heroicons/react/24/outline';
import SearchableCombobox from '@/components/ui/Combobox';
import { getImageUrl } from '@/utils/imageUrl';

interface WardrobeManagementProps {
}

export default function WardrobeManagement({ }: WardrobeManagementProps) {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [openDropdown, setOpenDropdown] = useState<'sizes' | 'colors' | null>(null);

    // VUFS Data Options
    const [vufsBrands, setVufsBrands] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // All Categories
    const [patterns, setPatterns] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [genders, setGenders] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        brandId: '',
        lineId: '',
        collection: '',
        modelName: '',

        genderId: '',
        apparelId: '',
        styleId: '',

        patternId: '',
        materialId: '',
        fitId: '',

        selectedSizes: [] as string[],
        selectedColors: [] as string[],

        condition: 'good',
        description: '',
        images: [] as any[],

        generatedName: '',
        skuItemId: undefined as string | undefined
    });

    useEffect(() => {
        fetchAllVUFSData();
        fetchItems();
    }, []);

    useEffect(() => {
        fetchItems();
    }, [page, search, selectedCategory]);

    // Fetch lines/collections when brand changes
    useEffect(() => {
        if (formData.brandId) {
            fetchLines(formData.brandId);
            fetchCollections(formData.brandId);
        } else {
            setLines([]);
            setCollections([]);
        }
    }, [formData.brandId]);

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

    // Auto-generate Name logic
    useEffect(() => {
        if (!showModal) return;

        const brandName = vufsBrands.find(b => b.id === formData.brandId)?.name || '';
        const lineName = lines.find(l => l.id === formData.lineId)?.name || '';
        const modelName = formData.modelName;

        const apparelName = categories.find(c => c.id === formData.apparelId)?.name || '';
        const styleName = categories.find(c => c.id === formData.styleId)?.name || '';
        const patternName = patterns.find(p => p.id === formData.patternId)?.name || '';
        const materialName = materials.find(m => m.id === formData.materialId)?.name || '';
        const fitName = fits.find(f => f.id === formData.fitId)?.name || '';

        const prefix = lineName || brandName;

        const parts = [
            prefix,
            modelName,
            styleName,
            patternName,
            materialName,
            fitName,
            apparelName
        ].filter(Boolean);

        setFormData(prev => ({ ...prev, generatedName: parts.join(' ') }));

    }, [
        formData.brandId, formData.lineId, formData.modelName,
        formData.styleId, formData.patternId, formData.materialId,
        formData.fitId, formData.apparelId,
        vufsBrands, lines, categories, patterns, materials, fits
    ]);


    const fetchAllVUFSData = async () => {
        try {
            let gendersData = [];
            try {
                gendersData = await apiClient.getVUFSAttributeValues('gender');
            } catch (e) {
                gendersData = [
                    { id: 'Men', name: 'Men' },
                    { id: 'Women', name: 'Women' },
                    { id: 'Unisex', name: 'Unisex' },
                    { id: 'Kids', name: 'Kids' }
                ];
            }

            const [
                brandsRes, catsRes, patternsRes, materialsRes, fitsRes, colorsRes, sizesRes
            ] = await Promise.all([
                apiClient.getVUFSBrands(),
                apiClient.getVUFSCategories(),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSSizes()
            ]);

            setVufsBrands(brandsRes || []);
            setCategories(catsRes || []);
            setPatterns(patternsRes || []);
            setMaterials(materialsRes || []);
            setFits(fitsRes || []);
            setColors(colorsRes || []);
            setSizes(sizesRes || []);
            setGenders(Array.isArray(gendersData) ? gendersData : []);

        } catch (error) {
            console.error('Failed to fetch VUFS data', error);
            toast.error('Failed to load form data');
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (selectedCategory) {
                filters.category = { page: selectedCategory };
            }
            if (search) {
                filters.search = search;
            }

            const res = await apiClient.getWardrobeItems(filters);
            setItems(res.items || []);
            // Pagination handled by backend if supported
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch wardrobe items', error);
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    const fetchLines = async (brandId: string) => {
        try {
            const res = await apiClient.getBrandLines(brandId);
            setLines(res.lines || []);
        } catch (error) {
            console.error('Failed to fetch lines', error);
        }
    };

    const fetchCollections = async (brandId: string) => {
        try {
            const res = await apiClient.getBrandCollections(brandId);
            setCollections(res.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections', error);
        }
    };

    // Category Hierarchy Logic
    const apparelOptions = useMemo(() => categories.filter(c => !c.parentId), [categories]);

    const styleOptions = useMemo(() => {
        if (!formData.apparelId) {
            return categories.filter(c => !!c.parentId);
        }
        return categories.filter(c => c.parentId === formData.apparelId);
    }, [categories, formData.apparelId]);


    const openModal = (item?: any) => {
        if (item) {
            // Edit Mode - Map existing item data to form
            setEditingItem(item);
            setFormData({
                brandId: item.brand?.id || '',
                lineId: item.lineId || '',
                collection: item.collection || '',
                modelName: item.metadata?.name || item.name || '',
                genderId: item.metadata?.genderId || '',
                apparelId: item.metadata?.apparelId || '',
                styleId: item.metadata?.styleId || '',
                patternId: item.metadata?.patternId || '',
                materialId: item.metadata?.materialId || '',
                fitId: item.metadata?.fitId || '',
                selectedSizes: item.metadata?.sizeId ? [item.metadata.sizeId] : [],
                selectedColors: item.metadata?.colorId ? [item.metadata.colorId] : [],
                condition: item.condition?.status || 'good',
                description: item.metadata?.description || '',
                images: item.images || [],
                generatedName: item.metadata?.name || '',
                skuItemId: item.skuItemId
            });
        } else {
            setEditingItem(null);
            setFormData({
                brandId: '',
                lineId: '',
                collection: '',
                modelName: '',
                genderId: '',
                apparelId: '',
                styleId: '',
                patternId: '',
                materialId: '',
                fitId: '',
                selectedSizes: [],
                selectedColors: [],
                condition: 'good',
                description: '',
                images: [],
                generatedName: '',
                skuItemId: undefined
            });
            setLines([]);
            setCollections([]);
        }
        setShowModal(true);
    };

    const handleMultiSelect = (type: 'sizes' | 'colors', id: string) => {
        setFormData(prev => {
            const list = type === 'sizes' ? prev.selectedSizes : prev.selectedColors;
            const exists = list.includes(id);
            const newList = exists ? list.filter(item => item !== id) : [...list, id];
            return {
                ...prev,
                [type === 'sizes' ? 'selectedSizes' : 'selectedColors']: newList
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const colorName = formData.selectedColors[0] ? colors.find(c => c.id === formData.selectedColors[0])?.name : '';
            const sizeName = formData.selectedSizes[0] ? sizes.find(s => s.id === formData.selectedSizes[0])?.name : '';

            // Generate final name
            const nameParts = [formData.generatedName];
            if (colorName) nameParts.push('(' + colorName + ')');
            if (sizeName) nameParts.push('[' + sizeName + ']');
            const finalName = nameParts.join(' ') || formData.modelName || 'Wardrobe Item';

            const conditionMapping: Record<string, string> = {
                'new_with_tags': 'dswt',
                'new_without_tags': 'never_used',
                'excellent': 'used',
                'good': 'used',
                'fair': 'used',
                'poor': 'used'
            };

            const payload = {
                category: {
                    page: categories.find(c => c.id === formData.apparelId)?.name || 'Apparel',
                    blueSubcategory: categories.find(c => c.id === formData.styleId)?.name || categories.find(c => c.id === formData.apparelId)?.name || '',
                    whiteSubcategory: categories.find(c => c.id === formData.styleId)?.name || '',
                    graySubcategory: ''
                },
                brand: {
                    brand: vufsBrands.find(b => b.id === formData.brandId)?.name || 'Generic',
                    line: lines.find(l => l.id === formData.lineId)?.name || ''
                },
                metadata: {
                    name: finalName,
                    colors: formData.selectedColors.map(cid => ({
                        primary: colors.find(c => c.id === cid)?.name || '',
                        undertones: []
                    })),
                    composition: formData.materialId ? [{
                        material: materials.find(m => m.id === formData.materialId)?.name || '',
                        percentage: 100
                    }] : [],
                    size: sizeName || 'One Size',
                    pattern: patterns.find(p => p.id === formData.patternId)?.name || '',
                    fit: fits.find(f => f.id === formData.fitId)?.name || '',
                    description: formData.description || '',
                    careInstructions: [],
                    // Store IDs for edit mapping
                    genderId: formData.genderId,
                    apparelId: formData.apparelId,
                    styleId: formData.styleId,
                    patternId: formData.patternId,
                    materialId: formData.materialId,
                    fitId: formData.fitId,
                    sizeId: formData.selectedSizes[0],
                    colorId: formData.selectedColors[0]
                },
                condition: {
                    status: conditionMapping[formData.condition] || 'used',
                    defects: []
                },
                ownership: {
                    status: 'owned',
                    visibility: 'public'
                },
                skuItemId: formData.skuItemId
            };

            if (editingItem) {
                await apiClient.updateWardrobeItem(editingItem.id, payload);
                toast.success('Item updated');
            } else {
                // For new items with images, use multipart
                if (formData.images.length > 0 && formData.images[0]?.file) {
                    const formDataMultipart = new FormData();
                    formData.images.forEach(img => {
                        if (img.file) formDataMultipart.append('images', img.file);
                    });
                    formDataMultipart.append('data', JSON.stringify(payload));
                    await apiClient.createWardrobeItemMultipart(formDataMultipart);
                } else {
                    // Create without images or with URL-based images
                    await apiClient.createWardrobeItem(payload);
                }
                toast.success('Item created');
            }

            setShowModal(false);
            fetchItems();
        } catch (error) {
            console.error('Failed to save item', error);
            toast.error('Failed to save item');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await apiClient.deleteWardrobeItem(id);
            toast.success('Item deleted');
            fetchItems();
        } catch (error) {
            console.error('Failed to delete item', error);
            toast.error('Failed to delete item');
        }
    };

    const getItemImage = (item: any) => {
        if (item.images?.[0]?.url) {
            return getImageUrl(item.images[0].url);
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search items by name, brand..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Item
                </Button>
            </div>

            {/* Card Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map(item => (
                    <div
                        key={item.id}
                        className="group bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/wardrobe/${item.id}`)}
                    >
                        {/* Image Container - Large aspect ratio */}
                        <div className="relative aspect-square bg-gray-200">
                            {getItemImage(item) ? (
                                <img
                                    src={getItemImage(item)}
                                    alt={item.metadata?.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <PhotoIcon className="h-16 w-16" />
                                </div>
                            )}

                            {/* Status Badge */}
                            {item.ownership?.status && item.ownership.status !== 'owned' && (
                                <div className="absolute bottom-3 left-3">
                                    <span className="px-3 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-full text-gray-700 border border-gray-300">
                                        {item.ownership.status === 'borrowed' ? 'Emprestado' :
                                            item.ownership.status === 'sold' ? 'Vendido' :
                                                item.ownership.status}
                                    </span>
                                </div>
                            )}

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/wardrobe/${item.id}`); }}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-blue-600 hover:bg-white shadow-sm"
                                    title="View"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openModal(item); }}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-blue-600 hover:bg-white shadow-sm"
                                    title="Edit"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-600 hover:bg-white shadow-sm"
                                    title="Delete"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Item Info */}
                        <div className="p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900 uppercase tracking-wide truncate">
                                {item.brand?.brand || 'Unknown Brand'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {item.metadata?.name || item.category?.whiteSubcategory || 'Item'}
                            </p>
                            {item.metadata?.size && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Size: {item.metadata.size}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {items.length === 0 && !loading && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first wardrobe item.</p>
                    <div className="mt-6">
                        <Button onClick={() => openModal()}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New Item
                        </Button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-gray-100 rounded-lg overflow-hidden">
                            <div className="aspect-square bg-gray-300"></div>
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                    {editingItem ? 'Edit Wardrobe Item' : 'Add New Wardrobe Item'}
                                </h3>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                    {/* 1. Brand / Line / Collection Row */}
                                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Brand */}
                                        <div>
                                            <SearchableCombobox
                                                label="Brand"
                                                value={vufsBrands.find(b => b.id === formData.brandId)?.name || ''}
                                                onChange={(name) => {
                                                    const brand = vufsBrands.find(b => b.name === name);
                                                    setFormData({ ...formData, brandId: brand?.id || '', lineId: '', collection: '' });
                                                }}
                                                options={vufsBrands}
                                                placeholder="Select Brand..."
                                                freeSolo
                                            />
                                        </div>

                                        {/* Line */}
                                        <div>
                                            <SearchableCombobox
                                                label="Line"
                                                value={lines.find(l => l.id === formData.lineId)?.name || ''}
                                                onChange={(name) => {
                                                    const line = lines.find(l => l.name === name);
                                                    setFormData({ ...formData, lineId: line?.id || '' });
                                                }}
                                                options={lines}
                                                placeholder="Select Line (Optional)"
                                                disabled={!formData.brandId}
                                            />
                                        </div>

                                        {/* Collection */}
                                        <div>
                                            <SearchableCombobox
                                                label="Collection"
                                                value={formData.collection}
                                                onChange={(name) => setFormData({ ...formData, collection: name || '' })}
                                                options={collections}
                                                placeholder="Select Collection (Optional)"
                                                disabled={!formData.brandId}
                                                freeSolo={true}
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Model Name */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Model Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.modelName}
                                            onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {/* 3. Apparel, Style, Pattern, Material, Fit, Gender */}

                                    <div>
                                        <SearchableCombobox
                                            label="Apparel"
                                            value={categories.find(c => c.id === formData.apparelId)?.name || ''}
                                            onChange={(name) => {
                                                const cat = categories.find(c => c.name === name && !c.parentId);
                                                setFormData({ ...formData, apparelId: cat?.id || '', styleId: '' });
                                            }}
                                            options={apparelOptions}
                                            placeholder="Select Apparel..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Style"
                                            value={categories.find(c => c.id === formData.styleId)?.name || ''}
                                            onChange={(name) => {
                                                const cat = categories.find(c => c.name === name);
                                                if (cat) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        styleId: cat.id,
                                                        apparelId: cat.parentId || prev.apparelId || ''
                                                    }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, styleId: '' }));
                                                }
                                            }}
                                            options={styleOptions}
                                            placeholder="Select Style..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Pattern"
                                            value={patterns.find(p => p.id === formData.patternId)?.name || ''}
                                            onChange={(name) => {
                                                const item = patterns.find(p => p.name === name);
                                                setFormData({ ...formData, patternId: item?.id || '' });
                                            }}
                                            options={patterns}
                                            placeholder="Select Pattern..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Material"
                                            value={materials.find(m => m.id === formData.materialId)?.name || ''}
                                            onChange={(name) => {
                                                const item = materials.find(m => m.name === name);
                                                setFormData({ ...formData, materialId: item?.id || '' });
                                            }}
                                            options={materials}
                                            placeholder="Select Material..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Fit"
                                            value={fits.find(f => f.id === formData.fitId)?.name || ''}
                                            onChange={(name) => {
                                                const item = fits.find(f => f.name === name);
                                                setFormData({ ...formData, fitId: item?.id || '' });
                                            }}
                                            options={fits}
                                            placeholder="Select Fit..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Gender"
                                            value={genders.find(g => g.id === formData.genderId)?.name || ''}
                                            onChange={(name) => {
                                                const item = genders.find(g => g.name === name);
                                                setFormData({ ...formData, genderId: item?.id || '' });
                                            }}
                                            options={genders}
                                            placeholder="Select Gender..."
                                        />
                                    </div>

                                    {/* Size(s) - Multi-Select */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (Select all that apply)</label>
                                        <div className="relative">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {formData.selectedSizes.map((id: string) => {
                                                    const size = sizes.find(s => s.id === id);
                                                    return (
                                                        <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                                                            {size?.name || id}
                                                            <button type="button" onClick={() => handleMultiSelect('sizes', id)} className="ml-1 hover:text-blue-900 font-bold">&times;</button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search and Select Sizes..."
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
                                                onFocus={() => setOpenDropdown('sizes')}
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
                                            {openDropdown === 'sizes' && (
                                                <button type="button" onClick={() => setOpenDropdown(null)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                            <div
                                                className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
                                                style={{ display: openDropdown === 'sizes' ? 'block' : 'none' }}
                                            >
                                                <div className="dropdown-list">
                                                    {sizes.map(size => (
                                                        <label key={size.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.selectedSizes.includes(size.id)}
                                                                onChange={(e) => { e.stopPropagation(); handleMultiSelect('sizes', size.id); }}
                                                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                                            />
                                                            <span className="ml-3 text-sm text-gray-700">{size.name}</span>
                                                            {formData.selectedSizes.includes(size.id) && (
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

                                    {/* Color(s) - Multi-Select */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Colors (Select all that apply)</label>
                                        <div className="relative">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {formData.selectedColors.map((id: string) => {
                                                    const color = colors.find(c => c.id === id);
                                                    return (
                                                        <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs gap-1 border border-gray-200">
                                                            <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color?.hex }}></span>
                                                            {color?.name || id}
                                                            <button type="button" onClick={() => handleMultiSelect('colors', id)} className="ml-1 hover:text-gray-900 font-bold">&times;</button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search and Select Colors..."
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 text-sm"
                                                onFocus={() => setOpenDropdown('colors')}
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
                                            {openDropdown === 'colors' && (
                                                <button type="button" onClick={() => setOpenDropdown(null)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                            <div
                                                className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
                                                style={{ display: openDropdown === 'colors' ? 'block' : 'none' }}
                                            >
                                                <div className="dropdown-list">
                                                    {colors.map(color => (
                                                        <label key={color.id} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.selectedColors.includes(color.id)}
                                                                onChange={(e) => { e.stopPropagation(); handleMultiSelect('colors', color.id); }}
                                                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                                            />
                                                            <span className="ml-3 w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color.hex }}></span>
                                                            <span className="ml-2 text-sm text-gray-700">{color.name}</span>
                                                            {formData.selectedColors.includes(color.id) && (
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

                                    {/* Condition - Wardrobe Specific */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                                        <select
                                            value={formData.condition}
                                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="new_with_tags">New with tags</option>
                                            <option value="new_without_tags">New without tags</option>
                                            <option value="excellent">Excellent used condition</option>
                                            <option value="good">Good used condition</option>
                                            <option value="fair">Fair aspect</option>
                                            <option value="poor">Poor aspect</option>
                                        </select>
                                    </div>

                                    {/* Auto-Generated Preview */}
                                    <div className="col-span-2 bg-gray-50 p-4 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-900">Item Name Preview</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-semibold">Generated Name:</span> {formData.generatedName || '(Start selecting attributes)'} {formData.selectedColors.length > 0 ? `(${colors.find(c => c.id === formData.selectedColors[0])?.name || ''})` : ''} {formData.selectedSizes.length > 0 ? `[${sizes.find(s => s.id === formData.selectedSizes[0])?.name || ''}]` : ''}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Media Uploader */}
                                    <div className="col-span-2 space-y-6 border-t pt-6 mt-2">
                                        <MediaUploader
                                            type="image"
                                            media={formData.images}
                                            onChange={(images) => setFormData({ ...formData, images })}
                                            label="Item Photos"
                                            helperText="Upload photos of your wardrobe item."
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                    >
                                        {modalLoading ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
