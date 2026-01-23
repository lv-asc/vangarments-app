'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from './MediaUploader';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { tagApi } from '@/lib/tagApi';
import { ImageTagEditor } from '@/components/tagging';
import SearchableCombobox from '../ui/Combobox';
import { ApparelIcon, getPatternIcon, getGenderIcon } from '../ui/ApparelIcons';
import { getImageUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SKUFormProps {
    initialData?: any; // For edit mode
    isEditMode?: boolean;
}

export default function SKUForm({ initialData, isEditMode = false }: SKUFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Brand Accounts (these are the actual brand entities that SKUs reference)
    const [brandAccounts, setBrandAccounts] = useState<any[]>([]);
    const [vufsCategories, setVufsCategories] = useState<any[]>([]);
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
    // conditions removed
    const [mediaLabels, setMediaLabels] = useState<any[]>([]);

    // POM/Measurements State
    const [pomCategories, setPomCategories] = useState<any[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<any[]>([]);
    const [apparelPOMs, setApparelPOMs] = useState<any[]>([]);
    const [measurements, setMeasurements] = useState<Record<string, Record<string, { value: number; tolerance?: number }>>>({});
    const [selectedPomIds, setSelectedPomIds] = useState<string[]>([]);

    // Silhouette/Modeling State
    const [availableSilhouettes, setAvailableSilhouettes] = useState<any[]>([]);
    const [selectedSilhouetteId, setSelectedSilhouetteId] = useState<string>('');

    // Multi-select dropdown state
    const [openDropdown, setOpenDropdown] = useState<'sizes' | 'colors' | null>(null);

    // Image Tagging State
    const [taggingModal, setTaggingModal] = useState<{ isOpen: boolean; imageUrl: string; skuId: string }>({
        isOpen: false,
        imageUrl: '',
        skuId: ''
    });
    const [taggingTags, setTaggingTags] = useState<any[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        brandId: '',
        brandAccountId: '',
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
        officialSkuOrInstance: '',
        isGeneric: false,
        // conditionId removed
        description: '',
        images: [] as any[],
        videos: [] as any[],
        nameConfig: {
            includeBrand: true,
            includeLine: false,
            includeCollection: false,
            includeStyle: false,
            includePattern: false,
            includeMaterial: false,
            includeFit: false
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

    // Initialize form with data if present
    useEffect(() => {
        if (initialData) {
            initializeForm(initialData);
        }
        fetchAllVUFSData();
    }, [initialData]);

    const initializeForm = async (sku: any) => {
        const metadata = sku.metadata || {};

        // Populate standard fields
        setFormData(prev => ({
            ...prev,
            brandId: sku.brand?.id || sku.brandId || '', // Note: we ideally need to map to VUFS brand, but ID usually matches in this codebase context or requires lookup by name
            brandAccountId: sku.brandId || '',
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
            nameConfig: {
                includeBrand: metadata.nameConfig?.includeBrand ?? true,
                includeLine: metadata.nameConfig?.includeLine ?? false,
                includeCollection: metadata.nameConfig?.includeCollection ?? false,
                includeStyle: metadata.nameConfig?.includeStyle ?? false,
                includePattern: metadata.nameConfig?.includePattern ?? false,
                includeMaterial: metadata.nameConfig?.includeMaterial ?? false,
                includeFit: metadata.nameConfig?.includeFit ?? false
            },
            generatedName: sku.name,
            generatedCode: sku.code,
            retailPriceBrl: sku.retailPriceBrl || '',
            retailPriceUsd: sku.retailPriceUsd || '',
            retailPriceEur: sku.retailPriceEur || '',
            officialSkuOrInstance: metadata.officialSkuOrInstance || '',
            isGeneric: metadata.isGeneric || false,
            // conditionId removed
            releaseDate: sku.releaseDate ? new Date(sku.releaseDate).toISOString().split('T')[0] : '',
            careInstructions: sku.careInstructions || '',
            officialItemLink: sku.officialItemLink || ''
        }));

        // Fetch measurements
        try {
            const skuMeasurements = await apiClient.getSKUMeasurements(sku.id);
            const mState: Record<string, any> = {};
            skuMeasurements.forEach((m: any) => {
                const pomId = String(m.pom_id);
                if (!mState[pomId]) mState[pomId] = {};
                mState[pomId][m.size_id] = {
                    value: m.value,
                    tolerance: m.tolerance
                };
            });
            setMeasurements(mState);
            setSelectedPomIds(Object.keys(mState));
        } catch (e) {
            console.error('Failed to fetch SKU measurements', e);
        }

        // Trigger brand-dependent fetches if brandId exists
        const brandId = sku.brand?.id || sku.brandId;
        if (brandId) {
            fetchLines(brandId);
            fetchCollections(brandId);
        }
    };


    const fetchAllVUFSData = async () => {
        setLoading(true);
        try {
            // ... (Rest of fetch logic same as GlobalSKUManagement)
            // Simplified for brevity, will copy mostly mostly verbatim but cleaner
            let gendersData = [];
            try {
                const genderRes = await apiClient.getVUFSGenders();
                gendersData = genderRes || [];
            } catch (e) {
                gendersData = [
                    { id: 'Men', name: 'Men' },
                    { id: 'Women', name: 'Women' },
                    { id: 'Unisex', name: 'Unisex' },
                    { id: 'Kids', name: 'Kids' }
                ];
            }

            const [
                accountsRes,
                categoriesRes,
                apparelsRes,
                stylesRes,
                patternsRes,
                materialsRes,
                fitsRes,
                colorsRes,
                sizesRes,
                mediaLabelsRes
            ] = await Promise.all([
                apiClient.getSwitchableAccounts(),
                apiClient.getVUFSCategories(),
                apiClient.getVUFSAttributeValues('apparel'),
                apiClient.getVUFSAttributeValues('style'),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSSizes(),
                apiClient.getAllMediaLabels()
            ]);

            // Extract brand accounts from the switchable accounts response
            const brands = accountsRes?.accounts?.brands || [];
            setBrandAccounts(brands);
            setVufsCategories(categoriesRes || []);
            setApparels(apparelsRes || []);
            setStyles(stylesRes || []);
            setPatterns(patternsRes || []);
            setMaterials(materialsRes || []);
            setFits(fitsRes || []);
            setColors(colorsRes || []);
            setSizes(sizesRes || []);
            setMediaLabels(mediaLabelsRes || []);
            setGenders(Array.isArray(gendersData) ? gendersData : []);

            // POMs
            try {
                const [pomCats, pomDefs] = await Promise.all([
                    apiClient.getPOMCategories(),
                    apiClient.getPOMDefinitions()
                ]);
                setPomCategories(Array.isArray(pomCats) ? pomCats : []);
                setPomDefinitions(Array.isArray(pomDefs) ? pomDefs : []);
            } catch (e) {
                console.error('Failed to fetch POM data', e);
            }

        } catch (error) {
            console.error('Failed to fetch VUFS data', error);
            toast.error('Failed to load form data');
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

    // Effects for auto-fetching dependent data
    useEffect(() => {
        if (formData.brandId) {
            // Avoid double fetch if handled by initialData, but safe to re-fetch
            fetchLines(formData.brandId);
            fetchCollections(formData.brandId);
        } else {
            setLines([]);
            setCollections([]);
        }
    }, [formData.brandId]);

    // ... Implement logic for Name Generation and Slugify from GlobalSKUManagement ...
    // Note: I will need to copy the slugify and generateSKUCode logic here.

    const slugify = (text: string) => text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    const generateSKUCode = (overrides: { colorId?: string | null; sizeId?: string | null } = {}) => {
        // ... (Copy logic)
        const brand = brandAccounts.find(b => b.id === formData.brandId);
        const line = lines.find(l => l.id === formData.lineId);
        const collectionName = formData.collection || '';
        const modelName = formData.modelName;

        const apparel = apparels.find(c => c.id === formData.apparelId);
        const style = styles.find(c => c.id === formData.styleId);
        const pattern = patterns.find(p => p.id === formData.patternId);
        const material = materials.find(m => m.id === formData.materialId);
        const fit = fits.find(f => f.id === formData.fitId);
        const gender = genders.find(g => g.id === formData.genderId);

        const colorId = overrides.colorId !== undefined ? overrides.colorId : (formData.selectedColors[0] || null);
        const sizeId = overrides.sizeId !== undefined ? overrides.sizeId : (formData.selectedSizes[0] || null);
        const color = colors.find(c => c.id === colorId);
        const size = sizes.find(s => s.id === sizeId);

        const getSluggifiedOrRef = (item: any, fallback: string | undefined) => {
            if (!item && !fallback) return null;
            if (item && item.skuRef) return item.skuRef;
            if (item && item.name) return slugify(item.name);
            if (fallback) return slugify(fallback);
            return null;
        };

        const codeParts = [
            getSluggifiedOrRef(brand, undefined),
            getSluggifiedOrRef(line, undefined),
            slugify(collectionName),
            slugify(modelName),
            getSluggifiedOrRef(style, undefined),
            getSluggifiedOrRef(pattern, undefined),
            getSluggifiedOrRef(material, undefined),
            getSluggifiedOrRef(fit, undefined),
            getSluggifiedOrRef(gender, undefined),
            getSluggifiedOrRef(apparel, undefined),
            colorId ? getSluggifiedOrRef(color, undefined) : null,
            sizeId ? getSluggifiedOrRef(size, undefined) : null
        ];

        return codeParts.filter(Boolean).join('-');
    };

    // Auto-update name/code
    useEffect(() => {
        // ... (Copy logic)
        const brand = brandAccounts.find(b => b.id === formData.brandId);
        const line = lines.find(l => l.id === formData.lineId);
        const collectionName = formData.collection || '';
        const modelName = formData.modelName;

        const apparel = apparels.find(c => c.id === formData.apparelId);
        const style = styles.find(c => c.id === formData.styleId);
        const pattern = patterns.find(p => p.id === formData.patternId);
        const material = materials.find(m => m.id === formData.materialId);
        const fit = fits.find(f => f.id === formData.fitId);

        const nameParts: string[] = [];

        if (formData.nameConfig.includeBrand && brand?.name) nameParts.push(brand.name);
        if (formData.nameConfig.includeLine && line?.name) nameParts.push(line.name);
        if (formData.nameConfig.includeCollection && collectionName) nameParts.push(collectionName);

        if (modelName) nameParts.push(modelName);

        if (formData.nameConfig.includeStyle && style?.name) nameParts.push(style.name);
        if (formData.nameConfig.includePattern && pattern?.name) nameParts.push(pattern.name);
        if (formData.nameConfig.includeMaterial && material?.name) nameParts.push(material.name);
        if (formData.nameConfig.includeFit && fit?.name) nameParts.push(fit.name);

        if (apparel?.name) nameParts.push(apparel.name);

        const generatedName = nameParts.filter(Boolean).join(' ');
        const generatedCode = generateSKUCode(); // Basic code without variants for display

        setFormData(prev => ({ ...prev, generatedName, generatedCode }));
    }, [
        formData.brandId, formData.lineId, formData.collection, formData.modelName,
        formData.styleId, formData.patternId, formData.materialId,
        formData.fitId, formData.apparelId, formData.genderId,
        formData.nameConfig,
        formData.selectedColors, formData.selectedSizes,
        brandAccounts, lines, apparels, styles, patterns, materials, fits, genders
    ]);

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

        const finalName = nameParts.join(' ');
        const finalCode = generateSKUCode({ colorId, sizeId });

        return {
            name: finalName,
            code: finalCode,
            brandId: formData.brandId,
            lineId: formData.lineId || null,
            collection: formData.collection || null,
            description: formData.description,
            images: formData.images,
            videos: formData.videos,
            materials: [materials.find(m => m.id === formData.materialId)?.name].filter(Boolean),
            category: {
                page: styles.find(c => c.id === formData.styleId)?.name || apparels.find(c => c.id === formData.apparelId)?.name || '',
                styleId: formData.styleId || null,
                patternId: formData.patternId || null,
                fitId: formData.fitId || null,
                genderId: formData.genderId || null,
                apparelId: formData.apparelId || null,
                materialId: formData.materialId || null
            },
            metadata: {
                officialSkuOrInstance: formData.officialSkuOrInstance,
                isGeneric: formData.isGeneric,
                // conditionId removed
                modelName: formData.modelName,
                genderId: formData.genderId,
                apparelId: formData.apparelId,
                styleId: formData.styleId,
                patternId: formData.patternId,
                materialId: formData.materialId,
                fitId: formData.fitId,
                genderName: genders.find(g => g.id === formData.genderId)?.name || formData.genderId,
                apparelName: apparels.find(c => c.id === formData.apparelId)?.name,
                styleName: styles.find(c => c.id === formData.styleId)?.name,
                patternName: patterns.find(p => p.id === formData.patternId)?.name,
                fitName: fits.find(f => f.id === formData.fitId)?.name,
                nameConfig: formData.nameConfig,
                ...(sizeId ? { sizeId, sizeName } : {}),
                ...(colorId ? { colorId, colorName } : {})
            },
            retailPriceBrl: formData.retailPriceBrl ? Number(formData.retailPriceBrl) : null,
            retailPriceUsd: formData.retailPriceUsd ? Number(formData.retailPriceUsd) : null,
            retailPriceEur: formData.retailPriceEur ? Number(formData.retailPriceEur) : null,
            releaseDate: formData.releaseDate || null,
            careInstructions: formData.careInstructions || null,
            officialItemLink: formData.officialItemLink || null,
            parentSkuId: null as string | null
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditMode && initialData) {
                // Edit Logic (simplified: single variant edit for now, need to clarify robust parent/variant editing in page flow)
                // For page flow, we'll assume we are editing the SPECIFIC entity loaded by ID.
                // If ID is parent, update parent. If ID is variant, update variant.

                const colorId = formData.selectedColors[0] || null;
                const sizeId = formData.selectedSizes[0] || null;
                const payload = buildSKUPayload(colorId, sizeId, true);

                await apiClient.updateSKU(initialData.id, payload);
                // Save measurements
                if (sizeId && measurements) {
                    // ... (Measurement saving logic)
                }
                toast.success('SKU updated successfully');
                router.push('/admin/skus');
            } else {
                // Create Logic (Support Bulk Creation based on sizes/colors)
                const sizesToCreate = formData.selectedSizes.length > 0 ? formData.selectedSizes : [];
                const colorsToCreate = formData.selectedColors.length > 0 ? formData.selectedColors : [];

                // If multiple sizes/colors, create parent first
                const isBulk = sizesToCreate.length > 1 || colorsToCreate.length > 1;

                if (isBulk) {
                    // Create Parent
                    const parentPayload = buildSKUPayload(null, null, false);
                    const parentResult = await apiClient.createSKU(formData.brandId, parentPayload);
                    const parentId = parentResult?.sku?.id;

                    if (parentId) {
                        // Create Variants
                        for (const colorId of (colorsToCreate.length ? colorsToCreate : [null])) {
                            for (const sizeId of (sizesToCreate.length ? sizesToCreate : [null])) {
                                if (!sizeId && !colorId) continue;
                                const variantPayload = buildSKUPayload(colorId, sizeId, false);
                                variantPayload.parentSkuId = parentId;
                                await apiClient.createSKU(formData.brandId, variantPayload);
                                // Save measurements...
                            }
                        }
                        toast.success('SKUs created successfully');
                    }
                } else {
                    // Single Create
                    const colorId = colorsToCreate[0] || null;
                    const sizeId = sizesToCreate[0] || null;
                    const payload = buildSKUPayload(colorId, sizeId, false);
                    await apiClient.createSKU(formData.brandId, payload);
                    toast.success('SKU created successfully');
                }
                router.push('/admin/skus');
            }
        } catch (error) {
            console.error('Failed to submit SKU', error);
            toast.error('Failed to save SKU');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !initialData) {
        return <div className="p-8 text-center">Loading form data...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto bg-white p-6 rounded-lg shadow">

            {/* Header with Miniature */}
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <div className="h-16 w-16 bg-gray-100 rounded-md border border-gray-200 text-gray-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formData.images && formData.images.length > 0 ? (
                        <img src={formData.images[0].url} alt="SKU Preview" className="h-full w-full object-cover" />
                    ) : (
                        <MagnifyingGlassIcon className="h-8 w-8" />
                    )}
                </div>
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-gray-900 leading-none">
                        Edit {formData.modelName || 'SKU'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {formData.officialSkuOrInstance || 'Update SKU details and settings'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => router.push('/admin/skus')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Brand Selection - Autocomplete */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <SearchableCombobox
                        options={brandAccounts.map(b => ({ id: b.id, name: b.name, image: b.avatar }))}
                        value={brandAccounts.find(b => b.id === formData.brandId)?.name || ''}
                        onChange={(val) => {
                            const brand = brandAccounts.find(b => b.name === val);
                            setFormData(prev => ({
                                ...prev,
                                brandId: brand?.id || '',
                                lineId: '' // Clear line when brand changes
                            }));
                        }}
                        placeholder="Select Brand"
                    />
                </div>
                {/* Line */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                    <SearchableCombobox
                        options={lines.map(l => ({ ...l, image: l.logo }))}
                        value={lines.find(l => l.id === formData.lineId)?.name || ''}
                        onChange={(val) => {
                            const line = lines.find(l => l.name === val);
                            setFormData(prev => ({ ...prev, lineId: line?.id || '' }));
                        }}
                        placeholder="Select Line"
                        disabled={!formData.brandId}
                    />
                </div>
                {/* Collection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                    <SearchableCombobox
                        options={collections.map(c => ({ ...c, image: c.image || c.cover || c.logo }))}
                        value={formData.collection}
                        onChange={(val) => {
                            // Collection is a string, so val is correct if selected, but if custom?
                            // Logic in SearchableCombobox handles freeSolo if configured, but here it's likely name match.
                            // If collection relies on IDs from list:
                            // The original code was: value={formData.collection} setting name directly.
                            // Wait, if collection is just a string in DB but selected from list...
                            // If options have names, and value is name, it works.
                            // But usually collection might represent an ID if relation exists.
                            // Looking at init: collection: sku.collection || ''
                            // Looking at fetchCollections: returns objects.
                            // If user types custom name? SearchableCombobox prop freeSolo={true} needed if allow custom.
                            // Assuming for now standard behavior:
                            setFormData(prev => ({ ...prev, collection: val || '' }));
                        }}
                        placeholder="Select or Type Collection"
                        freeSolo={true}
                    />
                </div>
            </div>

            {/* Model Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                <input
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    value={formData.modelName}
                    onChange={e => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                />
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Apparel */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apparel</label>
                    <SearchableCombobox
                        options={apparels.map(a => ({ ...a, icon: <ApparelIcon name={a.name} className="w-5 h-5" /> }))}
                        value={apparels.find(a => a.id === formData.apparelId)?.name || ''}
                        onChange={(val) => {
                            const app = apparels.find(a => a.name === val);
                            setFormData(prev => ({ ...prev, apparelId: app?.id || '' }));
                        }}
                        placeholder="Select Category"
                    />
                </div>
                {/* Style */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                    <SearchableCombobox
                        options={styles}
                        value={styles.find(s => s.id === formData.styleId)?.name || ''}
                        onChange={(val) => {
                            const style = styles.find(s => s.name === val);
                            setFormData(prev => ({ ...prev, styleId: style?.id || '' }));
                        }}
                        placeholder="Select Style"
                    />
                </div>
            </div>

            {/* Attributes: Pattern, Material, Fit, Gender, Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                    <SearchableCombobox
                        options={patterns.map(p => ({ ...p, icon: React.createElement(getPatternIcon(p.name), { className: 'w-full h-full' }) }))}
                        value={patterns.find(p => p.id === formData.patternId)?.name || ''}
                        onChange={v => {
                            const p = patterns.find(item => item.name === v);
                            setFormData(prev => ({ ...prev, patternId: p?.id || '' }));
                        }}
                        placeholder="Select Pattern"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <SearchableCombobox
                        options={materials}
                        value={materials.find(m => m.id === formData.materialId)?.name || ''}
                        onChange={v => {
                            const m = materials.find(item => item.name === v);
                            setFormData(prev => ({ ...prev, materialId: m?.id || '' }));
                        }}
                        placeholder="Select Material"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
                    <SearchableCombobox
                        options={fits}
                        value={fits.find(f => f.id === formData.fitId)?.name || ''}
                        onChange={v => {
                            const f = fits.find(item => item.name === v);
                            setFormData(prev => ({ ...prev, fitId: f?.id || '' }));
                        }}
                        placeholder="Select Fit"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <SearchableCombobox
                        options={genders.map(g => ({ ...g, icon: React.createElement(getGenderIcon(g.name), { className: 'w-full h-full' }) }))}
                        value={genders.find(g => g.id === formData.genderId)?.name || ''}
                        onChange={v => {
                            const g = genders.find(item => item.name === v);
                            setFormData(prev => ({ ...prev, genderId: g?.id || '' }));
                        }}
                        placeholder="Select Gender"
                    />
                </div>

            </div>

            {/* Images & Video */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
                <div className="space-y-6">
                    <MediaUploader
                        type="image"
                        media={formData.images}
                        onChange={(imgs) => setFormData(prev => ({ ...prev, images: imgs }))}
                        label="Images"
                        onTagImage={(url, index) => {
                            const currentSkuId = initialData?.id || '';
                            if (!currentSkuId) {
                                toast.error('Please save the SKU first to enable tagging.');
                                return;
                            }

                            // Load existing tags for this image
                            setTaggingTags([]); // Reset
                            const convertedUrl = url; // In real app might need conversion if proxied
                            tagApi.getTagsBySource('sku_image', currentSkuId, convertedUrl)
                                .then(tags => setTaggingTags(tags))
                                .catch(err => console.error('Failed to fetch tags', err));

                            setTaggingModal({ isOpen: true, imageUrl: url, skuId: currentSkuId });
                        }}
                    />
                    <MediaUploader
                        type="video"
                        media={formData.videos}
                        onChange={(vids) => setFormData(prev => ({ ...prev, videos: vids }))}
                        label="Videos"
                    />
                </div>
            </div>

            {/* Image Tagging Modal */}
            {/* Image Tagging Modal */}
            {taggingModal.isOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="tagging-modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setTaggingModal({ isOpen: false, imageUrl: '', skuId: '' })} />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900" id="tagging-modal-title">
                                        Tag People & Entities
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setTaggingModal({ isOpen: false, imageUrl: '', skuId: '' })}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Click on the image to add tags.</p>
                                <ImageTagEditor
                                    imageUrl={taggingModal.imageUrl}
                                    sourceType="sku_image"
                                    sourceId={taggingModal.skuId}
                                    existingTags={taggingTags}
                                    className="max-h-[60vh] overflow-auto"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Variants (Sizes & Colors) - Simplified UI for full page */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Variants</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (Select all that apply)</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search and Select Sizes..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onFocus={() => setOpenDropdown('sizes')}
                                onChange={(e) => {
                                    const searchTerm = e.target.value.toLowerCase();
                                    setOpenDropdown('sizes');
                                    const dropdown = document.getElementById('sizes-dropdown-list');
                                    if (dropdown) {
                                        const labels = dropdown.querySelectorAll('label');
                                        labels.forEach(label => {
                                            const text = label.textContent?.toLowerCase() || '';
                                            (label as HTMLElement).style.display = text.includes(searchTerm) ? 'flex' : 'none';
                                        });
                                    }
                                }}
                            />
                            {openDropdown === 'sizes' && (
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdown(null)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            {openDropdown === 'sizes' && (
                                <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg">
                                    <div id="sizes-dropdown-list">
                                        {sizes.map(size => {
                                            const isSelected = formData.selectedSizes.includes(size.id);
                                            return (
                                                <label
                                                    key={size.id}
                                                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setFormData(prev => {
                                                                const list = prev.selectedSizes;
                                                                const exists = list.includes(size.id);
                                                                return { ...prev, selectedSizes: exists ? list.filter(i => i !== size.id) : [...list, size.id] };
                                                            });
                                                        }}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <span className="ml-3 text-sm text-gray-900">{size.name}</span>
                                                    {isSelected && (
                                                        <svg className="ml-auto h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setOpenDropdown(null)}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded shadow-sm"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {formData.selectedSizes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
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
                                                onClick={() => setFormData(prev => ({ ...prev, selectedSizes: prev.selectedSizes.filter(i => i !== sizeId) }))}
                                                className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Colors (Select all that apply)</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search and Select Colors..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onFocus={() => setOpenDropdown('colors')}
                                onChange={(e) => {
                                    const searchTerm = e.target.value.toLowerCase();
                                    setOpenDropdown('colors');
                                    const dropdown = document.getElementById('colors-dropdown-list');
                                    if (dropdown) {
                                        const labels = dropdown.querySelectorAll('label');
                                        labels.forEach(label => {
                                            const text = label.textContent?.toLowerCase() || '';
                                            (label as HTMLElement).style.display = text.includes(searchTerm) ? 'flex' : 'none';
                                        });
                                    }
                                }}
                            />
                            {openDropdown === 'colors' && (
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdown(null)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            {openDropdown === 'colors' && (
                                <div className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg">
                                    <div id="colors-dropdown-list">
                                        {colors.map(color => {
                                            const isSelected = formData.selectedColors.includes(color.id);
                                            return (
                                                <label
                                                    key={color.id}
                                                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setFormData(prev => {
                                                                const list = prev.selectedColors;
                                                                const exists = list.includes(color.id);
                                                                return { ...prev, selectedColors: exists ? list.filter(i => i !== color.id) : [...list, color.id] };
                                                            });
                                                        }}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <span className="w-4 h-4 rounded-full border border-gray-200 ml-3 flex-shrink-0" style={{ backgroundColor: color.hex || '#ccc' }} />
                                                    <span className="ml-2 text-sm text-gray-900">{color.name}</span>
                                                    {isSelected && (
                                                        <svg className="ml-auto h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
                                        <button
                                            type="button"
                                            onClick={() => setOpenDropdown(null)}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded shadow-sm"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {formData.selectedColors.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.selectedColors.map(colorId => {
                                    const color = colors.find(c => c.id === colorId);
                                    return (
                                        <span
                                            key={colorId}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                        >
                                            <span className="w-3 h-3 rounded-full border border-blue-200 mr-2" style={{ backgroundColor: color?.hex || '#ccc' }} />
                                            {color?.name || colorId}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, selectedColors: prev.selectedColors.filter(i => i !== colorId) }))}
                                                className="ml-2 text-blue-600 hover:text-blue-900 focus:outline-none"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Name Generation Config */}
            <div className="bg-gray-50 p-4 rounded text-sm border border-gray-200">
                <div className="flex flex-col gap-2 mb-4">
                    <span className="font-semibold text-gray-700">Name Configuration</span>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includeBrand} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeBrand: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Brand
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includeLine} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeLine: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Line
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includeCollection} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeCollection: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Collection
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includeStyle} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeStyle: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Style
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includePattern} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includePattern: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Pattern
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includeMaterial} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeMaterial: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Material
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.nameConfig.includeFit} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeFit: e.target.checked } }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            Include Fit
                        </label>
                    </div>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                    <div>
                        <p><strong>Generated Name:</strong> {formData.generatedName}</p>
                        <p><strong>Generated Code:</strong> {formData.generatedCode}</p>
                    </div>
                </div>
            </div>

            {/* Silhouettes & Measurements */}
            <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Measurements</h3>
                </div>

                {/* Silhouette Selection */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apply Silhouette Template</label>
                    <div className="flex gap-4">
                        <div className="flex-grow">
                            <SearchableCombobox
                                options={availableSilhouettes.map(s => ({ id: s.id, name: `${s.name} (${s.variant || 'Default'})` }))}
                                value={availableSilhouettes.find(s => s.id === selectedSilhouetteId)?.name || ''}
                                onChange={(name) => {
                                    const sil = availableSilhouettes.find(s => `${s.name} (${s.variant || 'Default'})` === name);
                                    if (sil) {
                                        setSelectedSilhouetteId(sil.id);
                                        // Apply silhouette
                                        if (sil.pom_ids) setSelectedPomIds(sil.pom_ids);
                                        if (sil.measurements) setMeasurements(sil.measurements);
                                        toast.success(`Applied silhouette: ${sil.name}`);
                                    }
                                }}
                                placeholder="Select a Silhouette to auto-fill measurements..."
                            />
                        </div>
                    </div>
                </div>

                {/* POM Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Measurement Point (POM)</label>
                    <SearchableCombobox
                        options={pomDefinitions.filter(pom => !selectedPomIds.includes(pom.id)).map(pom => ({ id: pom.id, name: pom.name }))}
                        value=""
                        onChange={(name) => {
                            const pom = pomDefinitions.find(p => p.name === name);
                            if (pom && !selectedPomIds.includes(pom.id)) {
                                setSelectedPomIds(prev => [...prev, pom.id]);
                            }
                        }}
                        placeholder="Search to add POM..."
                    />
                </div>

                {/* Measurements Grid */}
                {selectedPomIds.length > 0 && formData.selectedSizes.length > 0 ? (
                    <div className="space-y-6">
                        {selectedPomIds.map(pomId => {
                            const pom = pomDefinitions.find(p => p.id === pomId);
                            if (!pom) return null;
                            const measurementKey = String(pomId);

                            return (
                                <div key={pomId} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between rounded-t-xl">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{pom.code}</span>
                                            <h4 className="font-semibold text-gray-900">{pom.name}</h4>
                                        </div>
                                        <button type="button" onClick={() => setSelectedPomIds(prev => prev.filter(id => id !== pomId))} className="text-gray-400 hover:text-red-500">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                        {formData.selectedSizes.map(sizeId => {
                                            const size = sizes.find(s => s.id === sizeId);
                                            const currentValue = measurements[measurementKey]?.[sizeId];

                                            return (
                                                <div key={`${pomId}-${sizeId}`}>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1 uppercase text-center">{size?.name || '?'}</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number" step="any" placeholder="0"
                                                            className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center"
                                                            value={currentValue?.value || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                                                setMeasurements(prev => {
                                                                    const newM = { ...prev };
                                                                    if (!newM[measurementKey]) newM[measurementKey] = {};
                                                                    if (val === undefined) {
                                                                        delete newM[measurementKey][sizeId];
                                                                    } else {
                                                                        newM[measurementKey][sizeId] = { value: val, tolerance: currentValue?.tolerance || pom.default_tolerance || 0.5 };
                                                                    }
                                                                    return newM;
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Grading Tool */}
                                        {formData.selectedSizes.length > 1 && (
                                            <div className="flex flex-col justify-end">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 text-center mb-1">Grade</span>
                                                <div className="flex items-center border rounded bg-gray-50">
                                                    <input type="number" step="any" placeholder="+0.0" className="w-full text-xs bg-transparent border-none focus:ring-0 text-center p-1"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const inc = parseFloat(e.currentTarget.value);
                                                                if (!isNaN(inc)) {
                                                                    // Grading logic matches SilhouetteManagement
                                                                    const firstSizeId = formData.selectedSizes[0];
                                                                    const firstValue = measurements[measurementKey]?.[firstSizeId]?.value;
                                                                    if (firstValue !== undefined) {
                                                                        setMeasurements(prev => {
                                                                            const newM = { ...prev };
                                                                            if (!newM[measurementKey]) newM[measurementKey] = {};
                                                                            formData.selectedSizes.forEach((siz, idx) => {
                                                                                if (idx === 0) return;
                                                                                newM[measurementKey][siz] = {
                                                                                    value: Math.round((firstValue + (inc * idx)) * 10) / 10,
                                                                                    tolerance: pom.default_tolerance || 0.5
                                                                                };
                                                                            });
                                                                            return newM;
                                                                        });
                                                                        toast.success(`Applied grade +${inc}`);
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm italic">Select sizes and add POMs to start entering measurements.</p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    rows={4}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (BRL)</label>
                    <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.retailPriceBrl} onChange={e => setFormData(prev => ({ ...prev, retailPriceBrl: e.target.value }))} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (USD)</label>
                    <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.retailPriceUsd} onChange={e => setFormData(prev => ({ ...prev, retailPriceUsd: e.target.value }))} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (EUR)</label>
                    <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.retailPriceEur} onChange={e => setFormData(prev => ({ ...prev, retailPriceEur: e.target.value }))} />
                </div>
            </div>

            {/* Release Date */}
            <div>
                <label className="block text-xs font-medium text-gray-700 uppercase">Release Date</label>
                <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.releaseDate}
                    onChange={e => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                />
                <p className="mt-1 text-xs text-gray-500">When was this item released or will be released</p>
            </div>

            {/* Care Instructions */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 uppercase">Care Instructions</label>
                    <button
                        type="button"
                        onClick={() => {
                            const selectedMaterial = materials.find(m => m.id === formData.materialId);
                            if (selectedMaterial?.careInstructions) {
                                setFormData(prev => ({ ...prev, careInstructions: selectedMaterial.careInstructions }));
                            } else if (selectedMaterial?.name) {
                                const defaultInstructions: Record<string, string> = {
                                    'cotton': 'Machine wash cold or warm. Tumble dry low or medium. Iron on medium-high heat if needed.',
                                    'linen': 'Machine wash cold or warm. Tumble dry low or hang to dry. Iron while slightly damp on high heat.',
                                    'wool': 'Hand wash cold or dry clean. Lay flat to dry on a towel. Do not wring or twist.',
                                    'silk': 'Hand wash cold or dry clean. Do not wring. Air dry away from sunlight. Iron on low with a pressing cloth.',
                                    'polyester': 'Machine wash warm or cold. Tumble dry low. Remove promptly to avoid wrinkles.',
                                    'denim': 'Machine wash cold inside out. Tumble dry low or hang to dry to preserve color.',
                                    'leather': 'Wipe with damp cloth. Condition regularly with leather conditioner. Store away from heat and sunlight.'
                                };
                                const materialKey = selectedMaterial.name.toLowerCase();
                                const instructions = defaultInstructions[materialKey] || 'Check garment label for specific care instructions.';
                                setFormData(prev => ({ ...prev, careInstructions: instructions }));
                            }
                        }}
                        disabled={!formData.materialId}
                        className={`text-xs flex items-center gap-1 ${formData.materialId
                            ? 'text-indigo-600 hover:text-indigo-800 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                        </svg>
                        Use default based on material
                    </button>
                </div>
                <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.careInstructions}
                    onChange={e => setFormData(prev => ({ ...prev, careInstructions: e.target.value }))}
                    placeholder="How to wash, dry, and maintain this item..."
                />
            </div>

            {/* Official Item Link */}
            <div>
                <label className="block text-xs font-medium text-gray-700 uppercase">Official Item Link</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                    <div className="relative flex items-stretch flex-grow focus-within:z-10">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {formData.officialItemLink ? (
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(formData.officialItemLink.startsWith('http') ? formData.officialItemLink : `https://${formData.officialItemLink}`).hostname; } catch { return ''; } })()}&sz=32`}
                                    alt=""
                                    className="h-4 w-4"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            )}
                        </div>
                        <input
                            type="url"
                            className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border border-gray-300 py-2"
                            placeholder="https://brand.com/products/item-slug"
                            value={formData.officialItemLink}
                            onChange={e => setFormData(prev => ({ ...prev, officialItemLink: e.target.value }))}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => formData.officialItemLink && window.open(formData.officialItemLink.startsWith('http') ? formData.officialItemLink : `https://${formData.officialItemLink}`, '_blank')}
                        className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <span>Test</span>
                    </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Link to the official product page on the brand's website</p>
            </div>

        </form>
    );
}
