
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from './MediaUploader';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import SearchableCombobox from '../ui/Combobox';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface GlobalSKUManagementProps {
}

export default function GlobalSKUManagement({ }: GlobalSKUManagementProps) {
    const [skus, setSkus] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    // VUFS Data Options
    const [vufsBrands, setVufsBrands] = useState<any[]>([]);
    const [lines, setLines] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // Keep for backward compat if needed, or remove
    const [apparels, setApparels] = useState<any[]>([]);
    const [styles, setStyles] = useState<any[]>([]);
    const [patterns, setPatterns] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [genders, setGenders] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingSku, setEditingSku] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Trash State
    const [showTrash, setShowTrash] = useState(false);
    const [deletedSkus, setDeletedSkus] = useState<any[]>([]);
    const [trashLoading, setTrashLoading] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'danger' | 'primary';
        onConfirm: () => void;
        isLoading: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        onConfirm: () => { },
        isLoading: false
    });

    // Form Data
    const [formData, setFormData] = useState({
        brandId: '',
        lineId: '',
        collection: '', // Will store Name or ID
        modelName: '',

        // Hierarchy: Apparel -> Style
        // Gender is now separate attribute
        genderId: '',
        apparelId: '', // Root Category
        styleId: '', // Sub Category

        patternId: '',
        materialId: '',
        fitId: '',

        selectedSizes: [] as string[], // Array of Size IDs
        selectedColors: [] as string[], // Array of Color IDs

        description: '',
        images: [] as any[],
        videos: [] as any[],

        // Auto-generated fields for display
        generatedName: '',
        generatedCode: 'SYSTEM_GENERATED'
    });

    useEffect(() => {
        fetchAllVUFSData();
        fetchSkus();
    }, []);

    useEffect(() => {
        fetchSkus();
    }, [page, search, selectedBrand]);

    // Cleanup lines/collections when brand changes
    useEffect(() => {
        if (formData.brandId) {
            fetchLines(formData.brandId);
            fetchCollections(formData.brandId);
        } else {
            setLines([]);
            setCollections([]);
        }
    }, [formData.brandId]);

    // Auto-generate Name logic
    useEffect(() => {
        if (!showModal) return;

        const brandName = vufsBrands.find(b => b.id === formData.brandId)?.name || '';
        const lineName = lines.find(l => l.id === formData.lineId)?.name || '';
        const modelName = formData.modelName;

        const apparelName = apparels.find(c => c.id === formData.apparelId)?.name || '';
        const styleName = styles.find(c => c.id === formData.styleId)?.name || '';
        const patternName = patterns.find(p => p.id === formData.patternId)?.name || '';
        const materialName = materials.find(m => m.id === formData.materialId)?.name || '';
        const fitName = fits.find(f => f.id === formData.fitId)?.name || '';
        // Gender usually not in name unless specified, but user didn't explicitly ask for Gender in name parts in Step 677.
        // User said: "Line... Model Name... Style... Pattern... Material... Fit... Apparel (Color) [Size]"
        // Wait, user listed attributes: "Brand; Line; Collection; Model Name; Apparel; Style; Pattern; Material; Fit; Gender; Size(s); Color(s)"
        // And SKU Name: "Line ... Model ... Style ... Pattern ... Material ... Fit ... Apparel (Color) [Size]"
        // Gender is MISSING from auto-generated name format in user request.
        // I will exclude it from name to follow instructions exactly.

        const prefix = lineName || brandName;

        // Construct base name
        const parts = [
            prefix,
            modelName,
            styleName,
            patternName,
            materialName,
            fitName,
            apparelName
        ].filter(Boolean); // Remove empty strings

        setFormData(prev => ({ ...prev, generatedName: parts.join(' ') }));

    }, [
        formData.brandId, formData.lineId, formData.modelName,
        formData.styleId, formData.patternId, formData.materialId,
        formData.fitId, formData.apparelId,
        vufsBrands, lines, categories, patterns, materials, fits
    ]);


    const fetchAllVUFSData = async () => {
        try {
            // Fetch Genders from API (now fixed in backend)
            let gendersData = [];
            try {
                const genderRes = await apiClient.getVUFSGenders();
                gendersData = genderRes || [];
            } catch (e) {
                console.error("Failed to fetch genders", e);
                // Fallback if API fails (e.g. backend not updated yet)
                gendersData = [
                    { id: 'Men', name: 'Men' },
                    { id: 'Women', name: 'Women' },
                    { id: 'Unisex', name: 'Unisex' },
                    { id: 'Kids', name: 'Kids' }
                ];
            }

            const [
                brandsRes,
                apparelsRes,
                stylesRes,
                patternsRes,
                materialsRes,
                fitsRes,
                colorsRes,
                sizesRes
            ] = await Promise.all([
                apiClient.getVUFSBrands(),
                apiClient.getVUFSAttributeValues('apparel'),
                apiClient.getVUFSAttributeValues('style'),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSSizes()
            ]);

            setVufsBrands(brandsRes || []);
            setApparels(apparelsRes || []);
            setStyles(stylesRes || []);
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

    const fetchSkus = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getAllSKUs({
                page,
                limit: 20,
                search,
                brandId: selectedBrand
            });
            setSkus(res.skus);
            setTotalPages(res.totalPages);
        } catch (error) {
            console.error('Failed to fetch SKUs', error);
            toast.error('Failed to load SKUs');
        } finally {
            setLoading(false);
        }
    };

    const fetchLines = async (brandId: string) => {
        try {
            console.log('[GlobalSKUManagement] Fetching lines for brand:', brandId);
            const res = await apiClient.getBrandLines(brandId);
            console.log('[GlobalSKUManagement] Lines fetched:', res.lines);
            setLines(res.lines || []);
        } catch (error) {
            console.error('Failed to fetch lines', error);
        }
    };

    const fetchCollections = async (brandId: string) => {
        try {
            console.log('[GlobalSKUManagement] Fetching collections for brand:', brandId);
            const res = await apiClient.getBrandCollections(brandId);
            console.log('[GlobalSKUManagement] Collections fetched:', res.collections);
            setCollections(res.collections || []);
        } catch (error) {
            console.error('Failed to fetch collections', error);
        }
    };

    // Category Hierarchy Logic


    // Since I cannot rewrite whole function easily with replacement chunk, I will just fix the Promise.all and setters below
    // But I already messed up the ReplacementChunk for Promise.all.
    // Let me provide a cleaner replacement for the WHOLE fetchAllVUFSData function to be safe.

    // See separate chunk below.

    // Category Hierarchy Logic
    // Apparel -> Style
    // Link: Style items should have parentId = selectedApparelId
    // If no hierarchy in DB (separate types), we might show all styles or filter if we can establish a link.
    // Assuming 'Style' items have 'parent_id' pointing to 'Apparel' items even across types (since same table).
    const apparelOptions = apparels; // Root level apparels

    const styleOptions = useMemo(() => {
        if (!formData.apparelId) {
            return styles;
        }
        // Filter styles that are children of the selected apparel
        return styles.filter(s => s.parentId === formData.apparelId);
    }, [styles, formData.apparelId]);


    const openModal = (sku?: any) => {
        if (sku) {
            setEditingSku(sku);
            const metadata = sku.metadata || {};
            setFormData({
                brandId: sku.brandId,
                lineId: sku.lineId || '',
                collection: sku.collection || '',
                modelName: metadata.modelName || sku.name,
                genderId: metadata.genderId || '',
                apparelId: metadata.apparelId || '',
                styleId: metadata.styleId || '',
                patternId: metadata.patternId || '',
                materialId: metadata.materialId || '',
                fitId: metadata.fitId || '',
                selectedSizes: metadata.sizeId ? [metadata.sizeId] : [],
                selectedColors: metadata.colorId ? [metadata.colorId] : [],
                description: sku.description || '',
                images: sku.images || [],
                videos: sku.videos || [],
                generatedName: sku.name,
                generatedCode: sku.code
            });
        } else {
            setEditingSku(null);
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
                description: '',
                images: [],
                videos: [],
                generatedName: '',
                generatedCode: 'To be generated'
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
            if (editingSku) {
                // Update specific SKU
                const colorId = formData.selectedColors[0];
                const sizeId = formData.selectedSizes[0];

                const colorName = colorId ? colors.find(c => c.id === colorId)?.name : '';
                const sizeName = sizeId ? sizes.find(s => s.id === sizeId)?.name : '';

                const nameParts = [formData.generatedName];
                // Note: If we are editing, we usually don't want to re-append color/size if they are already in generatedName
                // But the preview shows generatedName WITHOUT color/size, and we append them.
                if (colorName && !formData.generatedName.includes(`(${colorName})`)) nameParts.push('(' + colorName + ')');
                if (sizeName && !formData.generatedName.includes(`[${sizeName}]`)) nameParts.push('[' + sizeName + ']');

                const finalName = nameParts.join(' ');

                const payload = {
                    name: finalName,
                    brandId: formData.brandId,
                    lineId: formData.lineId || null,
                    collection: formData.collection || null,
                    description: formData.description,
                    images: formData.images,
                    videos: formData.videos,
                    materials: [materials.find(m => m.id === formData.materialId)?.name].filter(Boolean),
                    category: { page: styles.find(c => c.id === formData.styleId)?.name || apparels.find(c => c.id === formData.apparelId)?.name || '' },
                    metadata: {
                        modelName: formData.modelName,
                        genderId: formData.genderId,
                        apparelId: formData.apparelId,
                        styleId: formData.styleId,
                        patternId: formData.patternId,
                        materialId: formData.materialId,
                        fitId: formData.fitId,
                        sizeId: sizeId,
                        colorId: colorId,
                        genderName: genders.find(g => g.id === formData.genderId)?.name || formData.genderId,
                        apparelName: apparels.find(c => c.id === formData.apparelId)?.name,
                        styleName: styles.find(c => c.id === formData.styleId)?.name,
                        patternName: patterns.find(p => p.id === formData.patternId)?.name,
                        fitName: fits.find(f => f.id === formData.fitId)?.name
                    }
                };

                await apiClient.updateSKU(editingSku.id, payload);
                toast.success('SKU updated successfully');
            } else {
                // Bulk Create Logic
                const sizesToCreate = formData.selectedSizes.length > 0 ? formData.selectedSizes : [null];
                const colorsToCreate = formData.selectedColors.length > 0 ? formData.selectedColors : [null];

                let createdCount = 0;

                for (const colorId of colorsToCreate) {
                    for (const sizeId of sizesToCreate) {
                        const colorName = colorId ? colors.find(c => c.id === colorId)?.name : '';
                        const sizeName = sizeId ? sizes.find(s => s.id === sizeId)?.name : '';

                        const nameParts = [formData.generatedName];
                        if (colorName) nameParts.push('(' + colorName + ')');
                        if (sizeName) nameParts.push('[' + sizeName + ']');

                        const finalName = nameParts.join(' ');

                        const payload = {
                            name: finalName,
                            code: 'TEMP-' + Date.now() + '-' + createdCount,
                            brandId: formData.brandId,
                            lineId: formData.lineId || undefined,
                            collection: formData.collection || undefined,
                            description: formData.description,
                            images: formData.images,
                            videos: formData.videos,
                            materials: [materials.find(m => m.id === formData.materialId)?.name].filter(Boolean),
                            category: { page: styles.find(c => c.id === formData.styleId)?.name || apparels.find(c => c.id === formData.apparelId)?.name || '' },
                            metadata: {
                                modelName: formData.modelName,
                                genderId: formData.genderId,
                                apparelId: formData.apparelId,
                                styleId: formData.styleId,
                                patternId: formData.patternId,
                                materialId: formData.materialId,
                                fitId: formData.fitId,
                                sizeId: sizeId,
                                colorId: colorId,
                                genderName: genders.find(g => g.id === formData.genderId)?.name || formData.genderId,
                                apparelName: apparels.find(c => c.id === formData.apparelId)?.name,
                                styleName: styles.find(c => c.id === formData.styleId)?.name,
                                patternName: patterns.find(p => p.id === formData.patternId)?.name,
                                fitName: fits.find(f => f.id === formData.fitId)?.name
                            }
                        };

                        await apiClient.createSKU(formData.brandId, payload);
                        createdCount++;
                    }
                }
                toast.success(`${createdCount} SKUs created`);
            }

            setShowModal(false);
            fetchSkus();
        } catch (error) {
            console.error('Failed to save SKU', error);
            toast.error('Failed to save SKU');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete SKU',
            message: 'Are you sure you want to delete this SKU? It will be moved to trash.',
            variant: 'danger',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await apiClient.deleteSKU(id);
                    toast.success('SKU moved to trash');
                    fetchSkus();
                } catch (error) {
                    console.error('Failed to delete SKU', error);
                    toast.error('Failed to delete SKU');
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                }
            }
        });
    };

    const fetchDeletedSkus = async () => {
        setTrashLoading(true);
        try {
            const res = await apiClient.getDeletedSKUs({ search });
            setDeletedSkus(res.skus || []);
        } catch (error) {
            console.error('Failed to fetch deleted SKUs', error);
            toast.error('Failed to load trash');
        } finally {
            setTrashLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Restore SKU',
            message: 'Are you sure you want to restore this SKU?',
            variant: 'primary',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await apiClient.restoreSKU(id);
                    toast.success('SKU restored');
                    fetchDeletedSkus();
                } catch (error) {
                    console.error('Failed to restore SKU', error);
                    toast.error('Failed to restore SKU');
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                }
            }
        });
    };

    const handlePermanentDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Permanently Delete SKU',
            message: 'This action cannot be undone. The SKU will be permanently removed.',
            variant: 'danger',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await apiClient.permanentDeleteSKU(id);
                    toast.success('SKU permanently deleted');
                    fetchDeletedSkus();
                } catch (error) {
                    console.error('Failed to permanently delete SKU', error);
                    toast.error('Failed to permanently delete SKU');
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
                }
            }
        });
    };

    // Fetch trash when switching to trash view
    useEffect(() => {
        if (showTrash) {
            fetchDeletedSkus();
        }
    }, [showTrash, search]);

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
                        placeholder="Search SKUs by name, code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {!showTrash && (
                        <Button onClick={() => openModal()}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New SKU
                        </Button>
                    )}
                    <button
                        onClick={() => setShowTrash(!showTrash)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showTrash
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <TrashIcon className="h-4 w-4 inline mr-1" />
                        {showTrash ? 'Back to SKUs' : 'Trash'}
                    </button>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setShowTrash(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${!showTrash
                        ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Active SKUs
                </button>
                <button
                    onClick={() => setShowTrash(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${showTrash
                        ? 'bg-white border-b-2 border-red-500 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <TrashIcon className="h-4 w-4 inline mr-1" />
                    Trash ({deletedSkus.length})
                </button>
            </div>

            {/* Active SKUs List */}
            {!showTrash && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {skus.map(sku => (
                            <li key={sku.id} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Image Thumbnail */}
                                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                            {sku.images?.[0]?.url ? (
                                                <img src={sku.images[0].url} alt={sku.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <MagnifyingGlassIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-blue-600 truncate">{sku.name}</p>
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {sku.code}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                {sku.brand?.name && (
                                                    <span className="mr-4">
                                                        Brand: <span className="font-medium text-gray-900">{sku.brand.name}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openModal(sku)} className="p-2 text-gray-400 hover:text-blue-500">
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(sku.id)} className="p-2 text-gray-400 hover:text-red-500">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {skus.length === 0 && !loading && (
                            <li className="px-4 py-8 text-center text-gray-500">
                                No SKUs found.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Trash List */}
            {showTrash && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {deletedSkus.map(sku => (
                            <li key={sku.id} className="block hover:bg-gray-50 bg-red-50/30">
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200 opacity-60">
                                            {sku.images?.[0]?.url ? (
                                                <img src={sku.images[0].url} alt={sku.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <MagnifyingGlassIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-600 truncate line-through">{sku.name}</p>
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Deleted
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                {sku.code} • {sku.brand?.name || 'Unknown Brand'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRestore(sku.id)}
                                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                            title="Restore"
                                        >
                                            <ArrowPathIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handlePermanentDelete(sku.id)}
                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                            title="Permanently Delete"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {deletedSkus.length === 0 && !trashLoading && (
                            <li className="px-4 py-8 text-center text-gray-500">
                                Trash is empty.
                            </li>
                        )}
                    </ul>
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
                                    {editingSku ? 'Edit SKU' : 'Create New SKU(s)'}
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
                                                disabled={!!editingSku}
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
                                                options={collections} // Assumes collections have {name: ...}
                                                placeholder="Select Collection (Optional)"
                                                disabled={!formData.brandId}
                                                freeSolo={true} // Allow new collection names? Maybe not if restricted. But API allows string.
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
                                        />
                                    </div>

                                    {/* 3. Apparel, Style, Pattern, Material, Fit, Gender */}

                                    <div>
                                        <SearchableCombobox
                                            label="Apparel"
                                            value={apparels.find(c => c.id === formData.apparelId)?.name || ''}
                                            onChange={(name) => {
                                                const cat = apparels.find(c => c.name === name);
                                                setFormData({ ...formData, apparelId: cat?.id || '', styleId: '' });
                                            }}
                                            options={apparelOptions}
                                            placeholder="Select Apparel..."
                                        />
                                    </div>

                                    <div>
                                        <SearchableCombobox
                                            label="Style"
                                            value={styles.find(c => c.id === formData.styleId)?.name || ''}
                                            onChange={(name) => {
                                                const cat = styles.find(c => c.name === name);
                                                if (cat) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        styleId: cat.id,
                                                        // Automatically set parent apparel if the found style has one and it matches
                                                        // or if we want to enforce reverse-selection (selecting style selects the parent apparel)
                                                        apparelId: cat.parentId || prev.apparelId || ''
                                                    }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, styleId: '' }));
                                                }
                                            }}
                                            options={styleOptions}
                                            placeholder="Select Style..."
                                            disabled={!formData.apparelId && styleOptions.length === 0}
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
                                                // If static gender list, id might be same as name.
                                                // genders structure: {id: 'Men', name: 'Men'}
                                                setFormData({ ...formData, genderId: item?.id || '' });
                                            }}
                                            options={genders}
                                            placeholder="Select Gender..."
                                        />
                                    </div>

                                    {/* Size(s) - Multi-Select */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (Select all that apply)</label>
                                        <div className="mb-2">
                                            <SearchableCombobox
                                                placeholder="Search and Select Sizes..."
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const size = sizes.find(s => s.name === name);
                                                    if (size && !formData.selectedSizes.includes(size.id)) {
                                                        handleMultiSelect('sizes', size.id);
                                                    }
                                                }}
                                                options={sizes.filter(s => !formData.selectedSizes.includes(s.id))}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.selectedSizes.map(sizeId => {
                                                const size = sizes.find(s => s.id === sizeId);
                                                return (
                                                    <span
                                                        key={sizeId}
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                                    >
                                                        {size?.name || sizeId}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMultiSelect('sizes', sizeId)}
                                                            className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Color(s) - Multi-Select */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Colors (Select all that apply)</label>
                                        <div className="mb-2">
                                            <SearchableCombobox
                                                placeholder="Search and Select Colors..."
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const color = colors.find(c => c.name === name);
                                                    if (color && !formData.selectedColors.includes(color.id)) {
                                                        handleMultiSelect('colors', color.id);
                                                    }
                                                }}
                                                options={colors.filter(c => !formData.selectedColors.includes(c.id)).map(c => ({
                                                    id: c.id,
                                                    name: c.name,
                                                    hex: c.hex // Pass hex code
                                                }))}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.selectedColors.map(colorId => {
                                                const color = colors.find(c => c.id === colorId);
                                                return (
                                                    <span
                                                        key={colorId}
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200"
                                                    >
                                                        {color?.hex && (
                                                            <span className="w-3 h-3 rounded-full mr-2 border border-gray-300" style={{ backgroundColor: color.hex }}></span>
                                                        )}
                                                        {color?.name || colorId}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMultiSelect('colors', colorId)}
                                                            className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Auto-Generated Preview */}
                                    <div className="col-span-2 bg-gray-50 p-4 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-900">SKU Output Preview</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><span className="font-semibold">Format:</span> {formData.generatedName || '(Start selecting attributes)'} (Color) [Size]</p>
                                            <p className="mt-1"><span className="font-semibold">Code:</span> System Generated</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Based on selection, this will create <strong>{Math.max(1, formData.selectedColors.length) * Math.max(1, formData.selectedSizes.length)}</strong> distinct SKUs.
                                            </p>
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

                                    {/* Media Uploaders */}
                                    <div className="col-span-2 space-y-6 border-t pt-6 mt-2">
                                        <MediaUploader
                                            type="image"
                                            media={formData.images}
                                            onChange={(images) => setFormData({ ...formData, images })}
                                            label="Product Images"
                                            helperText="Upload high-quality images of the product."
                                        />

                                        <MediaUploader
                                            type="video"
                                            media={formData.videos}
                                            onChange={(videos) => setFormData({ ...formData, videos })}
                                            label="Product Videos"
                                            helperText="Upload videos showing the product in motion."
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button
                                        type="submit"
                                        disabled={modalLoading}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                    >
                                        {modalLoading ? (editingSku ? 'Saving...' : 'Creating...') : (editingSku ? 'Save Changes' : 'Create SKUs')}
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

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                isLoading={confirmModal.isLoading}
                confirmText={confirmModal.variant === 'danger' ? 'Delete' : 'Confirm'}
            />
        </div>
    );
}
