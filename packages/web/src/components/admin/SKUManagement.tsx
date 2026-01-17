'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from './MediaUploader';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import SearchableCombobox from '../ui/Combobox';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface SKUManagementProps {
    brandId: string;
}

export default function SKUManagement({ brandId }: SKUManagementProps) {
    const [skus, setSkus] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // VUFS Data Options
    const [lines, setLines] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [apparels, setApparels] = useState<any[]>([]);
    const [styles, setStyles] = useState<any[]>([]);
    const [patterns, setPatterns] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [genders, setGenders] = useState<any[]>([]);
    const [mediaLabels, setMediaLabels] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingSku, setEditingSku] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [editMode, setEditMode] = useState<'parent' | 'variant' | 'new'>('new');
    const [editingParentVariants, setEditingParentVariants] = useState<any[]>([]);
    const [originalParentSizes, setOriginalParentSizes] = useState<string[]>([]); // Track original sizes for comparison

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

    // Expanded variant groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState<'sizes' | 'colors' | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
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
        description: '',
        images: [] as any[],
        videos: [] as any[],
        nameConfig: {
            includeStyle: false,
            includePattern: false,
            includeMaterial: false,
            includeFit: false,
            brandLineDisplay: 'brand-only' as 'brand-only' | 'brand-and-line' | 'line-only' | 'none',
            showCollection: false
        },
        generatedName: '',
        generatedCode: '',
        retailPriceBrl: '' as string | number,
        retailPriceUsd: '' as string | number,
        retailPriceEur: '' as string | number,
        releaseDate: '',
        careInstructions: '',
        officialItemLink: ''
    });

    useEffect(() => {
        fetchAllVUFSData();
        fetchSkus();
    }, [brandId]);

    useEffect(() => {
        fetchSkus();
    }, [search]);

    // Handle clicking outside of dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.relative')) {
                setOpenDropdown(null);
            }
        };
        if (openDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const slugify = (text: string) => text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    const fetchAllVUFSData = async () => {
        try {
            // Fetch genders
            let gendersData: any[] = [];
            try {
                const genderRes = await apiClient.getVUFSGenders();
                gendersData = genderRes || [];
            } catch (e) {
                console.error("Failed to fetch genders", e);
                gendersData = [
                    { id: 'Men', name: 'Men' },
                    { id: 'Women', name: 'Women' },
                    { id: 'Unisex', name: 'Unisex' },
                    { id: 'Kids', name: 'Kids' }
                ];
            }

            const [
                apparelsRes,
                stylesRes,
                patternsRes,
                materialsRes,
                fitsRes,
                colorsRes,
                sizesRes,
                mediaLabelsRes
            ] = await Promise.all([
                apiClient.getVUFSAttributeValues('apparel'),
                apiClient.getVUFSAttributeValues('style'),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSSizes(),
                apiClient.getAllMediaLabels()
            ]);

            setApparels(apparelsRes || []);
            setStyles(stylesRes || []);
            setPatterns(patternsRes || []);
            setMaterials(materialsRes || []);
            setFits(fitsRes || []);
            setColors(colorsRes || []);
            setSizes(sizesRes || []);
            setMediaLabels(mediaLabelsRes || []);
            setGenders(Array.isArray(gendersData) ? gendersData : []);

            // Fetch lines and collections for this brand
            if (brandId) {
                const [linesRes, collectionsRes] = await Promise.all([
                    apiClient.getBrandLines(brandId),
                    apiClient.getBrandCollections(brandId)
                ]);
                setLines(linesRes.lines || []);
                setCollections(collectionsRes.collections || []);
            }
        } catch (error) {
            console.error('Failed to fetch VUFS data', error);
        }
    };

    const fetchSkus = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getBrandSKUs(brandId);
            setSkus(res.skus || []);
        } catch (error) {
            console.error('Failed to fetch SKUs', error);
        } finally {
            setLoading(false);
        }
    };

    // Use the backend's pre-grouped SKUs with variants
    // Backend now returns SKUs with variants array already populated
    const groupedSkus = useMemo(() => {
        return skus.map(sku => ({
            ...sku,
            variants: sku.variants || []
        }));
    }, [skus]);


    const toggleGroupExpansion = (skuId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(skuId)) next.delete(skuId);
            else next.add(skuId);
            return next;
        });
    };

    const styleOptions = useMemo(() => {
        if (!formData.apparelId) return styles;
        return styles.filter(s => s.parentId === formData.apparelId);
    }, [styles, formData.apparelId]);

    // Generate SKU name based on form data
    const generateSKUName = () => {
        const line = lines.find(l => l.id === formData.lineId);
        const apparel = apparels.find(c => c.id === formData.apparelId);
        const style = styles.find(c => c.id === formData.styleId);
        const pattern = patterns.find(p => p.id === formData.patternId);
        const material = materials.find(m => m.id === formData.materialId);
        const fit = fits.find(f => f.id === formData.fitId);

        const parts: string[] = [];
        if (line?.name) parts.push(line.name);
        if (formData.nameConfig.showCollection && formData.collection) parts.push(formData.collection);
        if (formData.modelName) parts.push(formData.modelName);
        if (apparel?.name) parts.push(apparel.name);
        if (formData.nameConfig.includeStyle && style?.name) parts.push(style.name);
        if (formData.nameConfig.includePattern && pattern?.name) parts.push(pattern.name);
        if (formData.nameConfig.includeMaterial && material?.name) parts.push(material.name);
        if (formData.nameConfig.includeFit && fit?.name) parts.push(fit.name);

        return parts.join(' ');
    };

    const generateSKUCode = (overrides: { colorId?: string | null; sizeId?: string | null } = {}) => {
        const line = lines.find(l => l.id === formData.lineId);
        const apparel = apparels.find(c => c.id === formData.apparelId);
        const gender = genders.find(g => g.id === formData.genderId);

        const colorId = overrides.colorId !== undefined ? overrides.colorId : formData.selectedColors[0];
        const sizeId = overrides.sizeId !== undefined ? overrides.sizeId : formData.selectedSizes[0];
        const color = colors.find(c => c.id === colorId);
        const size = sizes.find(s => s.id === sizeId);

        const parts: string[] = [];
        if (line?.name) parts.push(slugify(line.name));
        if (formData.collection) parts.push(slugify(formData.collection));
        if (gender?.name) parts.push(slugify(gender.name));
        if (apparel?.name) parts.push(slugify(apparel.name));
        if (formData.modelName) parts.push(slugify(formData.modelName));
        if (color?.name) parts.push(slugify(color.name));
        if (size?.name) parts.push(slugify(size.name));

        return parts.join('-') || 'sku';
    };

    // Update generated name/code when form changes
    useEffect(() => {
        const name = generateSKUName();
        const code = generateSKUCode();
        setFormData(prev => ({ ...prev, generatedName: name, generatedCode: code }));
    }, [
        formData.lineId, formData.collection, formData.modelName,
        formData.apparelId, formData.styleId, formData.patternId,
        formData.materialId, formData.fitId, formData.genderId,
        formData.selectedColors, formData.selectedSizes, formData.nameConfig
    ]);

    const openModal = async (sku?: any) => {
        if (sku) {
            setEditingSku(sku);
            setEditMode('variant');
            setEditingParentVariants([]);
            const metadata = sku.metadata || {};

            setFormData({
                lineId: sku.lineId || sku.lineInfo?.id || '',
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
                nameConfig: metadata.nameConfig || {
                    includeStyle: false, includePattern: false,
                    includeMaterial: false, includeFit: false,
                    brandLineDisplay: 'brand-only', showCollection: false
                },
                generatedName: sku.name,
                generatedCode: sku.code,
                retailPriceBrl: sku.retailPriceBrl || '',
                retailPriceUsd: sku.retailPriceUsd || '',
                retailPriceEur: sku.retailPriceEur || '',
                releaseDate: sku.releaseDate ? new Date(sku.releaseDate).toISOString().split('T')[0] : '',
                careInstructions: sku.careInstructions || '',
                officialItemLink: sku.officialItemLink || ''
            });
        } else {
            setEditingSku(null);
            setEditMode('new');
            setEditingParentVariants([]);
            setFormData({
                lineId: '', collection: '', modelName: '',
                genderId: '', apparelId: '', styleId: '',
                patternId: '', materialId: '', fitId: '',
                selectedSizes: [], selectedColors: [],
                description: '', images: [], videos: [],
                nameConfig: {
                    includeStyle: false, includePattern: false,
                    includeMaterial: false, includeFit: false,
                    brandLineDisplay: 'brand-only', showCollection: false
                },
                generatedName: '', generatedCode: 'To be generated',
                retailPriceBrl: '', retailPriceUsd: '', retailPriceEur: '',
                releaseDate: '', careInstructions: '', officialItemLink: ''
            });
        }
        setShowModal(true);
    };

    const openParentModal = async (parentSku: any) => {
        if (!parentSku.variants || parentSku.variants.length === 0) return;
        const firstVariant = parentSku.variants[0];
        const metadata = firstVariant.metadata || {};

        setEditingSku(parentSku);
        setEditMode('parent');
        setEditingParentVariants(parentSku.variants);

        // Extract and store original sizes for comparison during save
        const extractedSizes = Array.isArray(parentSku.variants)
            ? Array.from(new Set(parentSku.variants.map((v: any) => v.metadata?.sizeId || v.sizeId).filter(Boolean))) as string[]
            : [];
        setOriginalParentSizes(extractedSizes);

        setFormData({
            lineId: firstVariant.lineId || firstVariant.lineInfo?.id || '',
            collection: firstVariant.collection || '',
            modelName: metadata.modelName || parentSku.name,
            genderId: metadata.genderId || '',
            apparelId: metadata.apparelId || '',
            styleId: metadata.styleId || '',
            patternId: metadata.patternId || '',
            materialId: metadata.materialId || '',
            fitId: metadata.fitId || '',
            selectedSizes: Array.isArray(parentSku.variants)
                ? Array.from(new Set(parentSku.variants.map((v: any) => v.metadata?.sizeId || v.sizeId).filter(Boolean)))
                : [],
            selectedColors: [],
            description: firstVariant.description || '',
            images: [],
            videos: [],
            nameConfig: metadata.nameConfig || {
                includeStyle: false, includePattern: false,
                includeMaterial: false, includeFit: false,
                brandLineDisplay: 'brand-only', showCollection: false
            },
            generatedName: parentSku.name,
            generatedCode: parentSku.code,
            retailPriceBrl: firstVariant.retailPriceBrl || '',
            retailPriceUsd: firstVariant.retailPriceUsd || '',
            retailPriceEur: firstVariant.retailPriceEur || '',
            releaseDate: firstVariant.releaseDate ? new Date(firstVariant.releaseDate).toISOString().split('T')[0] : '',
            careInstructions: firstVariant.careInstructions || '',
            officialItemLink: firstVariant.officialItemLink || ''
        });
        setShowModal(true);
    };

    const buildSKUPayload = (colorId: string | null, sizeId: string | null, isEdit: boolean = false) => {
        const color = colors.find(c => c.id === colorId);
        const size = sizes.find(s => s.id === sizeId);
        const colorName = color?.name || '';
        const sizeName = size?.name || '';

        let baseName = formData.generatedName;
        if (!isEdit) {
            baseName = baseName.replace(/\s*\([^)]*\)\s*\[[^\]]*\]/g, '').trim();
        }

        const nameParts = [baseName];
        if (isEdit) {
            if (colorName && !baseName.includes(`(${colorName})`)) nameParts.push('(' + colorName + ')');
            if (sizeName && !baseName.includes(`[${sizeName}]`)) nameParts.push('[' + sizeName + ']');
        } else {
            if (colorName) nameParts.push('(' + colorName + ')');
            if (sizeName) nameParts.push('[' + sizeName + ']');
        }

        return {
            name: nameParts.join(' '),
            code: generateSKUCode({ colorId, sizeId }),
            brandId: brandId,
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
                genderName: genders.find(g => g.id === formData.genderId)?.name,
                apparelName: apparels.find(c => c.id === formData.apparelId)?.name,
                styleName: styles.find(c => c.id === formData.styleId)?.name,
                patternName: patterns.find(p => p.id === formData.patternId)?.name,
                fitName: fits.find(f => f.id === formData.fitId)?.name,
                sizeName, colorName,
                nameConfig: formData.nameConfig
            },
            retailPriceBrl: formData.retailPriceBrl ? Number(formData.retailPriceBrl) : null,
            retailPriceUsd: formData.retailPriceUsd ? Number(formData.retailPriceUsd) : null,
            retailPriceEur: formData.retailPriceEur ? Number(formData.retailPriceEur) : null,
            releaseDate: formData.releaseDate || null,
            careInstructions: formData.careInstructions || null,
            officialItemLink: formData.officialItemLink || null
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);

        try {
            if (editMode === 'parent' && editingParentVariants.length > 0) {
                // Calculate which sizes to add/remove
                const currentSizes = new Set(formData.selectedSizes);
                const originalSizes = new Set(originalParentSizes);
                const sizesToAdd = formData.selectedSizes.filter(s => !originalSizes.has(s));
                const sizesToRemove = originalParentSizes.filter(s => !currentSizes.has(s));
                const sizesToKeep = originalParentSizes.filter(s => currentSizes.has(s));

                let updatedCount = 0;
                let createdCount = 0;
                let deletedCount = 0;

                // Update existing variants that are being kept
                for (const variant of editingParentVariants) {
                    const variantSizeId = variant.metadata?.sizeId || variant.sizeId;
                    if (sizesToKeep.includes(variantSizeId)) {
                        const payload = {
                            lineId: formData.lineId || null,
                            collection: formData.collection || null,
                            description: formData.description,
                            materials: [materials.find(m => m.id === formData.materialId)?.name].filter(Boolean),
                            metadata: {
                                ...variant.metadata,
                                modelName: formData.modelName,
                                genderId: formData.genderId,
                                apparelId: formData.apparelId,
                                styleId: formData.styleId,
                                patternId: formData.patternId,
                                materialId: formData.materialId,
                                fitId: formData.fitId,
                                nameConfig: formData.nameConfig
                            },
                            retailPriceBrl: formData.retailPriceBrl ? Number(formData.retailPriceBrl) : null,
                            retailPriceUsd: formData.retailPriceUsd ? Number(formData.retailPriceUsd) : null,
                            retailPriceEur: formData.retailPriceEur ? Number(formData.retailPriceEur) : null,
                            releaseDate: formData.releaseDate || null,
                            careInstructions: formData.careInstructions || null,
                            officialItemLink: formData.officialItemLink || null
                        };
                        await apiClient.updateSKU(variant.id, payload);
                        updatedCount++;
                    }
                }

                // Delete variants for unselected sizes
                for (const variant of editingParentVariants) {
                    const variantSizeId = variant.metadata?.sizeId || variant.sizeId;
                    if (sizesToRemove.includes(variantSizeId)) {
                        await apiClient.deleteSKU(variant.id);
                        deletedCount++;
                    }
                }

                // Create new variants for newly selected sizes
                for (const sizeId of sizesToAdd) {
                    const colorId = formData.selectedColors[0] || null;
                    const payload = {
                        ...buildSKUPayload(colorId, sizeId, false),
                        parentSkuId: editingSku.id // Link to parent
                    };
                    await apiClient.createSKU(brandId, payload);
                    createdCount++;
                }

                const messages: string[] = [];
                if (updatedCount > 0) messages.push(`Updated ${updatedCount}`);
                if (createdCount > 0) messages.push(`Created ${createdCount}`);
                if (deletedCount > 0) messages.push(`Deleted ${deletedCount}`);
                toast.success(messages.length > 0 ? messages.join(', ') + ' variant(s)' : 'No changes made');
            } else if (editingSku && editMode === 'variant') {
                // Update single SKU
                const colorId = formData.selectedColors[0] || null;
                const sizeId = formData.selectedSizes[0] || null;
                const payload = buildSKUPayload(colorId, sizeId, true);
                await apiClient.updateSKU(editingSku.id, payload);
                toast.success('SKU updated');
            } else {
                // Create new SKUs
                const effectiveColors = formData.selectedColors.length > 0 ? formData.selectedColors : [null];
                const effectiveSizes = formData.selectedSizes.length > 0 ? formData.selectedSizes : [null];
                let createdCount = 0;

                for (const colorId of effectiveColors) {
                    for (const sizeId of effectiveSizes) {
                        const payload = buildSKUPayload(colorId, sizeId, false);
                        await apiClient.createSKU(brandId, payload);
                        createdCount++;
                    }
                }
                toast.success(`Created ${createdCount} SKU(s)`);
            }

            setShowModal(false);
            fetchSkus();
        } catch (error: any) {
            console.error('Failed to save SKU', error);
            toast.error(error.message || 'Failed to save SKU');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete SKU',
            message: 'Are you sure you want to delete this SKU?',
            variant: 'danger',
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    await apiClient.deleteSKU(id);
                    toast.success('SKU deleted');
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search SKUs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => openModal()}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Register New SKU
                </Button>
            </div>

            {/* SKU List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {groupedSkus.map(sku => (
                        <React.Fragment key={sku.id}>
                            <li className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Expand/Collapse */}
                                        {sku.variants && sku.variants.length > 0 ? (
                                            <button
                                                onClick={() => toggleGroupExpansion(sku.id)}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                <svg
                                                    className={`h-5 w-5 transition-transform ${expandedGroups.has(sku.id) ? 'rotate-90' : ''}`}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        ) : <div className="w-7" />}

                                        {/* Product Image */}
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
                                                {sku.variants && sku.variants.length > 0 && (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        +{sku.variants.length} variant{sku.variants.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {sku.collection && `Collection: ${sku.collection}`}
                                                {sku.retailPriceBrl && ` | R$ ${sku.retailPriceBrl}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {sku.isVirtualParent && (
                                            <button
                                                onClick={() => openParentModal(sku)}
                                                className="p-2 text-blue-500 hover:text-blue-700"
                                                title="Edit parent (updates all variants)"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                        {!sku.isVirtualParent && (
                                            <>
                                                <button onClick={() => openModal(sku)} className="p-2 text-gray-400 hover:text-blue-500">
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDelete(sku.id)} className="p-2 text-gray-400 hover:text-red-500">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </li>

                            {/* Variants */}
                            {sku.variants && sku.variants.length > 0 && expandedGroups.has(sku.id) && (
                                sku.variants.map((variant: any) => (
                                    <li key={variant.id} className="block hover:bg-blue-50/50 bg-gray-50 border-l-4 border-blue-200">
                                        <div className="px-4 py-3 sm:px-6 flex items-center justify-between pl-16">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                                    {variant.images?.[0]?.url ? (
                                                        <img src={variant.images[0].url} alt={variant.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <MagnifyingGlassIcon className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm text-gray-700 truncate">{variant.name}</p>
                                                        <span className="px-1.5 inline-flex text-xs leading-5 font-medium rounded bg-gray-100 text-gray-600">
                                                            {variant.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openModal(variant)} className="p-1.5 text-gray-400 hover:text-blue-500">
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(variant.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </React.Fragment>
                    ))}
                    {groupedSkus.length === 0 && !loading && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No SKUs registered yet.
                        </li>
                    )}
                </ul>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
                            <div className="mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {editMode === 'parent' ? `Edit Parent SKU (${editingParentVariants.length} variants)` :
                                        editingSku ? 'Edit Variant SKU' : 'Create New SKU(s)'}
                                </h3>
                                {editMode === 'parent' && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                        Changes will apply to all {editingParentVariants.length} variants.
                                    </div>
                                )}
                                {editMode === 'variant' && (
                                    <div className="mt-2 p-2 bg-amber-50 rounded text-sm text-amber-700">
                                        Editing individual variant. Size/color changes apply to this SKU only.
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-2">
                                    {/* Line & Collection - Hidden in variant mode */}
                                    {editMode !== 'variant' && (
                                        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <SearchableCombobox
                                                    label="Line"
                                                    value={lines.find(l => l.id === formData.lineId)?.name || ''}
                                                    onChange={(name) => {
                                                        const line = lines.find(l => l.name === name);
                                                        setFormData({ ...formData, lineId: line?.id || '' });
                                                    }}
                                                    options={lines}
                                                    placeholder="Select Line..."
                                                />
                                            </div>
                                            <div>
                                                <SearchableCombobox
                                                    label="Collection"
                                                    value={formData.collection}
                                                    onChange={(name) => setFormData({ ...formData, collection: name })}
                                                    options={collections}
                                                    placeholder="Select Collection..."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Model Name & Attributes - Hidden in variant mode */}
                                    {editMode !== 'variant' && (
                                        <React.Fragment>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Model Name</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    value={formData.modelName}
                                                    onChange={e => setFormData({ ...formData, modelName: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <SearchableCombobox
                                                    label="Apparel"
                                                    value={apparels.find(c => c.id === formData.apparelId)?.name || ''}
                                                    onChange={(name) => {
                                                        const cat = apparels.find(c => c.name === name);
                                                        setFormData({ ...formData, apparelId: cat?.id || '', styleId: '' });
                                                    }}
                                                    options={apparels}
                                                    placeholder="Select Apparel..."
                                                />
                                                <SearchableCombobox
                                                    label="Style"
                                                    value={styles.find(c => c.id === formData.styleId)?.name || ''}
                                                    onChange={(name) => {
                                                        const cat = styles.find(c => c.name === name);
                                                        setFormData({ ...formData, styleId: cat?.id || '' });
                                                    }}
                                                    options={styleOptions}
                                                    placeholder="Select Style..."
                                                    disabled={!formData.apparelId}
                                                />
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

                                            {/* Prices */}
                                            <div className="col-span-2 border-t pt-4 mt-2">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Retail Price</h4>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700">BRL R$</label>
                                                        <input
                                                            type="number" step="0.01" placeholder="0.00"
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                                            value={formData.retailPriceBrl}
                                                            onChange={e => {
                                                                const brl = e.target.value;
                                                                const usd = brl ? (Number(brl) / 5.80).toFixed(2) : '';
                                                                const eur = brl ? (Number(brl) / 6.10).toFixed(2) : '';
                                                                setFormData({ ...formData, retailPriceBrl: brl, retailPriceUsd: usd, retailPriceEur: eur });
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700">USD $</label>
                                                        <input
                                                            type="number" step="0.01" placeholder="0.00"
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                                            value={formData.retailPriceUsd}
                                                            onChange={e => setFormData({ ...formData, retailPriceUsd: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700">EUR €</label>
                                                        <input
                                                            type="number" step="0.01" placeholder="0.00"
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                                            value={formData.retailPriceEur}
                                                            onChange={e => setFormData({ ...formData, retailPriceEur: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )}

                                    {/* Sizes - Show in all modes, multi-select in new/parent mode */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {editMode === 'new' ? 'Sizes (Select all that apply)' :
                                                editMode === 'parent' ? 'Size Variants (Add/Remove sizes)' : 'Size'}
                                        </label>
                                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50">
                                            {sizes.map((size: any) => (
                                                <button
                                                    key={size.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (editMode === 'new' || editMode === 'parent') {
                                                            const isSelected = formData.selectedSizes.includes(size.id);
                                                            setFormData({
                                                                ...formData,
                                                                selectedSizes: isSelected
                                                                    ? formData.selectedSizes.filter(id => id !== size.id)
                                                                    : [...formData.selectedSizes, size.id]
                                                            });
                                                        } else {
                                                            setFormData({ ...formData, selectedSizes: [size.id] });
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${formData.selectedSizes.includes(size.id)
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {size.name}
                                                </button>
                                            ))}
                                        </div>
                                        {editMode === 'parent' && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Deselect sizes to delete variants, select new sizes to create variants.
                                            </p>
                                        )}
                                    </div>

                                    {/* Colors - Hidden in parent mode */}
                                    {editMode !== 'parent' && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {editMode === 'new' ? 'Colors (Select all that apply)' : 'Color'}
                                            </label>
                                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50">
                                                {colors.map((color: any) => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => {
                                                            if (editMode === 'new') {
                                                                const isSelected = formData.selectedColors.includes(color.id);
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedColors: isSelected
                                                                        ? formData.selectedColors.filter(id => id !== color.id)
                                                                        : [...formData.selectedColors, color.id]
                                                                });
                                                            } else {
                                                                setFormData({ ...formData, selectedColors: [color.id] });
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${formData.selectedColors.includes(color.id)
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {color.hexCode && (
                                                            <span
                                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                                style={{ backgroundColor: color.hexCode }}
                                                            />
                                                        )}
                                                        {color.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Additional Info - Release Date, Care Instructions, Official Link */}
                                    {editMode !== 'parent' && (
                                        <div className="col-span-2 border-t pt-4 mt-2">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Release Date</label>
                                                    <input
                                                        type="date"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                                        value={formData.releaseDate}
                                                        onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Care Instructions</label>
                                                    <textarea
                                                        rows={2}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                                        value={formData.careInstructions}
                                                        onChange={e => setFormData({ ...formData, careInstructions: e.target.value })}
                                                        placeholder="How to wash, dry, and maintain..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Official Item Link</label>
                                                    <input
                                                        type="url"
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                                        value={formData.officialItemLink}
                                                        onChange={e => setFormData({ ...formData, officialItemLink: e.target.value })}
                                                        placeholder="https://brand.com/products/item-slug"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preview - Only for new */}
                                    {editMode === 'new' && (
                                        <div className="col-span-2 bg-gray-50 p-4 rounded-md">
                                            <h4 className="text-sm font-medium text-gray-900">SKU Output Preview</h4>
                                            <div className="mt-2 text-sm text-gray-600">
                                                <p><span className="font-semibold">Format:</span> {formData.generatedName || '(Start selecting attributes)'} (Color) [Size]</p>
                                                <p className="mt-1"><span className="font-semibold">Code:</span> <code className="bg-gray-200 px-1 rounded text-blue-700">{formData.generatedCode || '(Start selecting attributes)'}</code></p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Based on selection, this will create <strong>{Math.max(1, formData.selectedColors.length) * Math.max(1, formData.selectedSizes.length)}</strong> distinct SKUs.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Media - Hidden in parent mode */}
                                    {editMode !== 'parent' && (
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
                                    )}
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
