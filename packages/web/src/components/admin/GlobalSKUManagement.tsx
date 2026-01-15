
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from './MediaUploader';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import SearchableCombobox from '../ui/Combobox';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { ApparelIcon, getPatternIcon, getGenderIcon } from '../ui/ApparelIcons';
import { ImageTagEditor } from '@/components/tagging';

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
    const [vufsCategories, setVufsCategories] = useState<any[]>([]);
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
    const [conditions, setConditions] = useState<any[]>([]);
    const [mediaLabels, setMediaLabels] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingSku, setEditingSku] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [editMode, setEditMode] = useState<'parent' | 'variant' | 'new'>('new');
    const [editingParentVariants, setEditingParentVariants] = useState<any[]>([]); // Variants to update when editing parent

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

    // Variant selection for editing
    const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
    const [relatedVariants, setRelatedVariants] = useState<any[]>([]);

    // Expanded variant groups in list view
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Dropdown state for sizes/colors
    const [openDropdown, setOpenDropdown] = useState<'sizes' | 'colors' | null>(null);

    // POM/Measurements State
    const [pomCategories, setPomCategories] = useState<any[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<any[]>([]);
    const [apparelPOMs, setApparelPOMs] = useState<any[]>([]);
    const [measurements, setMeasurements] = useState<Record<string, Record<string, { value: number; tolerance?: number }>>>({});
    const [showAsCircumference, setShowAsCircumference] = useState<Set<string>>(new Set());
    const [selectedPomIds, setSelectedPomIds] = useState<string[]>([]);

    // Image Tagging State
    const [taggingModal, setTaggingModal] = useState<{ isOpen: boolean; imageUrl: string; skuId: string }>({
        isOpen: false,
        imageUrl: '',
        skuId: ''
    });

    // Silhouette/Modeling State
    const [availableSilhouettes, setAvailableSilhouettes] = useState<any[]>([]);
    const [selectedSilhouetteId, setSelectedSilhouetteId] = useState<string>('');

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

        officialSkuOrInstance: '',
        isGeneric: false,
        conditionId: '',

        description: '',
        images: [] as any[],
        videos: [] as any[],

        // Name configuration options
        nameConfig: {
            includeStyle: false,
            includePattern: false,
            includeMaterial: false,
            includeFit: false,
            brandLineDisplay: 'brand-only' as 'brand-only' | 'brand-and-line' | 'line-only' | 'none',
            showCollection: false
        },

        // Auto-generated fields for display
        generatedName: '',
        generatedCode: '',
        retailPriceBrl: '' as string | number,
        retailPriceUsd: '' as string | number,
        retailPriceEur: '' as string | number,
        releaseDate: '',
        careInstructions: ''
    });

    useEffect(() => {
        fetchAllVUFSData();
        fetchSkus();
    }, []);

    useEffect(() => {
        fetchSkus();
    }, [page, search, selectedBrand]);

    // Handle clicking outside of dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // If the click is not on a dropdown related element, close any open dropdown
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

    // Fetch apparel-specific POMs when apparel changes
    useEffect(() => {
        const fetchApparelPOMs = async () => {
            if (!formData.apparelId) {
                setApparelPOMs([]);
                setSelectedPomIds([]);
                return;
            }

            try {
                // 1. Detect category of the selected apparel value
                const selectedApparel = apparels.find(a => a.id === formData.apparelId);
                let poms = [];
                let matchedCategory = null;

                if (selectedApparel) {
                    matchedCategory = vufsCategories.find(c =>
                        c.name.toLowerCase() === selectedApparel.name.toLowerCase()
                    );

                    if (matchedCategory) {
                        // 2. Try to get explicit mappings for this category
                        poms = await apiClient.getApparelPOMs(matchedCategory.id);
                    }
                }

                if (Array.isArray(poms) && poms.length > 0) {
                    setApparelPOMs(poms);
                } else {
                    // 3. Fallback: Detect category and show all items from that category based on name
                    if (selectedApparel && pomCategories.length > 0) {
                        const name = selectedApparel.name.toLowerCase();
                        // Find a category that matches the apparel name (e.g. "Tops", "Shirts" -> "Tops")
                        const matchedCat = pomCategories.find(c =>
                            name.includes(c.name.toLowerCase().replace('ies', 'y')) || // Accessories -> Accessory
                            c.name.toLowerCase().includes(name.replace(/s$/, '')) // T-Shirts -> T-Shirt
                        );

                        if (matchedCat) {
                            const catPoms = pomDefinitions.filter(p => p.category_id === matchedCat.id);
                            setApparelPOMs(catPoms.map(p => ({
                                ...p,
                                pom_id: p.id,
                                category_name: matchedCat.name
                            })));
                        } else {
                            setApparelPOMs([]);
                        }
                    } else {
                        setApparelPOMs([]);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch apparel POMs', e);
                setApparelPOMs([]);
            }
        };

        fetchApparelPOMs();
    }, [formData.apparelId, pomCategories, pomDefinitions, apparels, vufsCategories]);

    // Fetch silhouettes when brand, apparel, or fit changes
    useEffect(() => {
        const fetchSilhouettes = async () => {
            if (!formData.brandId || !formData.apparelId || !formData.fitId) {
                setAvailableSilhouettes([]);
                setSelectedSilhouetteId('');
                return;
            }

            try {
                const res = await apiClient.getSilhouettes({
                    brandId: formData.brandId,
                    apparelId: formData.apparelId,
                    fitId: formData.fitId
                });
                setAvailableSilhouettes(res.silhouettes || []);
            } catch (e) {
                console.error('Failed to fetch silhouettes', e);
            }
        };

        fetchSilhouettes();
    }, [formData.brandId, formData.apparelId, formData.fitId]);

    // Apply silhouette POMs when selected
    useEffect(() => {
        if (!selectedSilhouetteId) return;

        const sil = availableSilhouettes.find(s => s.id === selectedSilhouetteId);
        if (sil && sil.pom_ids) {
            setSelectedPomIds(sil.pom_ids);
            toast.success(`Applied silhouette: ${sil.name}`);
        }
    }, [selectedSilhouetteId, availableSilhouettes]);

    // Helper to slugify strings for SKU codes
    const slugify = (text: string) => text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    // Function to generate individual SKU code for variants
    const generateSKUCode = (overrides: { colorId?: string | null; sizeId?: string | null } = {}) => {
        const brand = vufsBrands.find(b => b.id === formData.brandId);
        const line = lines.find(l => l.id === formData.lineId);
        const collectionName = formData.collection || '';
        const modelName = formData.modelName;

        const apparel = apparels.find(c => c.id === formData.apparelId);
        const style = styles.find(c => c.id === formData.styleId);
        const pattern = patterns.find(p => p.id === formData.patternId);
        const material = materials.find(m => m.id === formData.materialId);
        const fit = fits.find(f => f.id === formData.fitId);
        const gender = genders.find(g => g.id === formData.genderId);
        const condition = conditions.find(c => c.id === formData.conditionId);

        // Variant attributes
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
            getSluggifiedOrRef(color, undefined),
            getSluggifiedOrRef(size, undefined)
        ];

        return codeParts
            .filter(Boolean)
            .join('-');
    };

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

    // Auto-generate Name & Code logic
    useEffect(() => {
        if (!showModal) return;

        const brand = vufsBrands.find(b => b.id === formData.brandId);
        const line = lines.find(l => l.id === formData.lineId);
        const collectionName = formData.collection || '';
        const modelName = formData.modelName;

        const apparel = apparels.find(c => c.id === formData.apparelId);
        const style = styles.find(c => c.id === formData.styleId);
        const pattern = patterns.find(p => p.id === formData.patternId);
        const material = materials.find(m => m.id === formData.materialId);
        const fit = fits.find(f => f.id === formData.fitId);

        // Name Generation
        let prefix = '';
        switch (formData.nameConfig.brandLineDisplay) {
            case 'none':
                prefix = '';
                break;
            case 'brand-only':
                prefix = brand?.name || '';
                break;
            case 'line-only':
                prefix = line?.name || brand?.name || '';
                break;
            case 'brand-and-line':
            default:
                prefix = line?.name ? `${brand?.name || ''} ${line.name}`.trim() : (brand?.name || '');
                break;
        }

        const nameParts = [prefix];
        if (formData.nameConfig.showCollection && collectionName) nameParts.push(collectionName);
        if (modelName) nameParts.push(modelName);
        if (formData.nameConfig.includeStyle && style?.name) nameParts.push(style.name);
        if (formData.nameConfig.includePattern && pattern?.name) nameParts.push(pattern.name);
        if (formData.nameConfig.includeMaterial && material?.name) nameParts.push(material.name);
        if (formData.nameConfig.includeFit && fit?.name) nameParts.push(fit.name);
        if (apparel?.name) nameParts.push(apparel.name);

        const generatedName = nameParts.filter(Boolean).join(' ');
        const generatedCode = generateSKUCode();

        setFormData(prev => ({ ...prev, generatedName, generatedCode }));

    }, [
        formData.brandId, formData.lineId, formData.collection, formData.modelName,
        formData.styleId, formData.patternId, formData.materialId,
        formData.fitId, formData.apparelId, formData.genderId,
        formData.nameConfig,
        formData.selectedColors, formData.selectedSizes,
        vufsBrands, lines, apparels, styles, patterns, materials, fits, genders, conditions
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
                categoriesRes,
                apparelsRes,
                stylesRes,
                patternsRes,
                materialsRes,
                fitsRes,
                colorsRes,
                sizesRes,
                conditionsRes,
                mediaLabelsRes
            ] = await Promise.all([
                apiClient.getVUFSBrands(),
                apiClient.getVUFSCategories(),
                apiClient.getVUFSAttributeValues('apparel'),
                apiClient.getVUFSAttributeValues('style'),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSSizes(),
                apiClient.getAllConditions(),
                apiClient.getAllMediaLabels()
            ]);

            console.log('[GlobalSKUManagement] VUFS data fetched:', {
                brands: brandsRes?.length || 0,
                apparels: apparelsRes?.length || 0,
                styles: stylesRes?.length || 0,
                patterns: patternsRes?.length || 0,
                materials: materialsRes?.length || 0,
                fits: fitsRes?.length || 0,
                colors: colorsRes?.length || 0,
                sizes: sizesRes?.length || 0,
                conditions: conditionsRes?.length || 0,
                mediaLabels: mediaLabelsRes?.length || 0,
                sizesRaw: sizesRes
            });

            setVufsBrands(brandsRes || []);
            setVufsCategories(categoriesRes || []);
            setApparels(apparelsRes || []);
            console.log('[GlobalSKUManagement] Styles fetched:', stylesRes?.length || 0, stylesRes);
            setStyles(stylesRes || []);
            setPatterns(patternsRes || []);
            setMaterials(materialsRes || []);
            setFits(fitsRes || []);
            setColors(colorsRes || []);
            setSizes(sizesRes || []);
            setConditions(conditionsRes || []);
            setMediaLabels(mediaLabelsRes || []);
            setGenders(Array.isArray(gendersData) ? gendersData : []);

            // Fetch POM categories and definitions
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

    const fetchLines = async (brandId: string): Promise<any[]> => {
        try {
            console.log('[GlobalSKUManagement] Fetching lines for brand:', brandId);
            const res = await apiClient.getBrandLines(brandId);
            console.log('[GlobalSKUManagement] Lines fetched:', res.lines);
            const fetchedLines = res.lines || [];
            setLines(fetchedLines);
            return fetchedLines;
        } catch (error) {
            console.error('Failed to fetch lines', error);
            return [];
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
    const apparelOptions = useMemo(() => apparels.map(a => ({
        ...a,
        icon: <ApparelIcon name={a.name} className="w-full h-full" />
    })), [apparels]);


    const styleOptions = useMemo(() => {
        return styles;
    }, [styles]);

    // Use SKUs directly from backend - they already have variants array populated
    // Backend handles all grouping by explicit parent_sku_id relationships
    const groupedSkus = useMemo(() => {
        // SKUs from backend already have variants array - just pass through
        return skus.map(sku => ({
            ...sku,
            variants: sku.variants || []
        }));
    }, [skus]);


    // Toggle expansion of a SKU group
    const toggleGroupExpansion = (skuId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(skuId)) {
                next.delete(skuId);
            } else {
                next.add(skuId);
            }
            return next;
        });
    };


    const fetchRelatedVariants = async (sku: any) => {
        try {
            // Extract base name by removing color (in parentheses) and size (in brackets)
            const baseName = sku.name.replace(/\s*\([^)]*\)\s*\[[^\]]*\]/g, '').trim();

            // Search for SKUs with similar base name
            const result = await apiClient.searchSKUs({
                term: baseName,
                brandId: sku.brandId
            });

            // Filter to only include variants (same base name but different size/color)
            const variants = result.skus.filter((v: any) => {
                if (v.id === sku.id) return false; // Exclude current SKU
                const vBaseName = v.name.replace(/\s*\([^)]*\)\s*\[[^\]]*\]/g, '').trim();
                return vBaseName === baseName;
            });

            setRelatedVariants(variants);
            setSelectedVariants([]); // Reset selection
        } catch (error) {
            console.error('Failed to fetch related variants:', error);
            setRelatedVariants([]);
        }
    };

    const openModal = async (sku?: any) => {
        if (sku) {
            setEditingSku(sku);
            // Check if this is a variant (has parentSkuId) or a parent SKU
            const isVariant = !!sku.parentSkuId;
            setEditMode(isVariant ? 'variant' : 'edit'); // 'variant' for variants, 'edit' for parent SKUs
            setEditingParentVariants([]);
            const metadata = sku.metadata || {};

            // Resolve brandId - SKUs use brand_accounts.id, but dropdown shows vufs_brands
            // We need to find the VUFS brand by name to get the correct ID for the dropdown
            const brandName = sku.brand?.name || '';
            const matchingVufsBrand = vufsBrands.find(b => b.name === brandName);
            const resolvedBrandId = matchingVufsBrand?.id || sku.brandId || sku.brand?.id || '';

            console.log('[openModal] Brand resolution:', {
                skuBrandName: brandName,
                matchingVufsBrand,
                resolvedBrandId,
                vufsBrandsCount: vufsBrands.length,
                isVariant,
                parentSkuId: sku.parentSkuId
            });

            // Fetch lines and collections for the brand first
            let fetchedLines: any[] = [];
            if (resolvedBrandId) {
                [fetchedLines] = await Promise.all([
                    fetchLines(resolvedBrandId),
                    fetchCollections(resolvedBrandId),
                    isVariant ? fetchRelatedVariants(sku) : Promise.resolve() // Only fetch related variants if editing a variant
                ]) as [any[], void, void];
            }

            // Resolve lineId - try multiple approaches
            const lineName = sku.lineInfo?.name || sku.line || '';
            let resolvedLineId = sku.lineId || sku.lineInfo?.id || '';

            // If we have a line name but no ID, try to find it in the fetched lines
            if (!resolvedLineId && lineName && fetchedLines.length > 0) {
                const matchingLine = fetchedLines.find(l => l.name === lineName);
                if (matchingLine) {
                    resolvedLineId = matchingLine.id;
                }
            }

            console.log('[openModal] Line resolution:', {
                skuLineName: lineName,
                resolvedLineId,
                linesCount: fetchedLines.length
            });

            setFormData({
                brandId: resolvedBrandId,
                lineId: resolvedLineId,
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
                    includeStyle: false,
                    includePattern: false,
                    includeMaterial: false,
                    includeFit: false,
                    brandLineDisplay: 'brand-only',
                    showCollection: false
                },
                generatedName: sku.name,
                generatedCode: sku.code,
                retailPriceBrl: sku.retailPriceBrl || '',
                retailPriceUsd: sku.retailPriceUsd || '',
                retailPriceEur: sku.retailPriceEur || '',
                releaseDate: sku.releaseDate ? new Date(sku.releaseDate).toISOString().split('T')[0] : '',
                careInstructions: sku.careInstructions || ''
            });

            // Fetch measurements for this SKU
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
                setMeasurements({});
                setSelectedPomIds([]);
            }
        } else {
            setEditingSku(null);
            setEditMode('new'); // Creating new SKU
            setEditingParentVariants([]);
            setRelatedVariants([]);
            setSelectedVariants([]);
            setSelectedPomIds([]);
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
                nameConfig: {
                    includeStyle: false,
                    includePattern: false,
                    includeMaterial: false,
                    includeFit: false,
                    brandLineDisplay: 'brand-only',
                    showCollection: false
                },
                generatedName: '',
                generatedCode: 'To be generated',
                retailPriceBrl: '',
                retailPriceUsd: '',
                retailPriceEur: '',
                releaseDate: '',
                careInstructions: ''
            });
            setLines([]);
            setCollections([]);
        }
        setShowModal(true);
    };

    // Open modal for editing a PARENT SKU (virtual parent with variants)
    const openParentModal = async (parentSku: any) => {
        if (!parentSku.variants || parentSku.variants.length === 0) return;

        // Use the first variant as the base for form data (except size/color)
        const firstVariant = parentSku.variants[0];
        const metadata = firstVariant.metadata || {};

        setEditingSku(parentSku); // Store the parent object
        setEditMode('parent'); // Parent editing mode
        setEditingParentVariants(parentSku.variants); // Store all variants for batch update
        setRelatedVariants([]);
        setSelectedVariants([]);

        // Resolve brandId - using first variant's data
        // Resolve brandId - using parent data first, fall back to variant
        // The parent row from searchSKUs has { brand: { name: ... } }
        const brandName = parentSku.brand?.name || firstVariant.brand?.name || '';
        const matchingVufsBrand = vufsBrands.find(b => b.name === brandName);
        const resolvedBrandId = matchingVufsBrand?.id || parentSku.brandId || firstVariant.brandId || firstVariant.brand?.id || '';

        // Fetch lines and collections for the brand
        let fetchedLines: any[] = [];
        if (resolvedBrandId) {
            [fetchedLines] = await Promise.all([
                fetchLines(resolvedBrandId),
                fetchCollections(resolvedBrandId)
            ]) as [any[], void];
        }

        // Resolve lineId
        const lineName = parentSku.lineInfo?.name || parentSku.line || firstVariant.lineInfo?.name || firstVariant.line || '';
        let resolvedLineId = parentSku.lineId || parentSku.lineInfo?.id || firstVariant.lineId || firstVariant.lineInfo?.id || '';
        if (!resolvedLineId && lineName && fetchedLines.length > 0) {
            const matchingLine = fetchedLines.find(l => l.name === lineName);
            if (matchingLine) {
                resolvedLineId = matchingLine.id;
            }
        }

        // Set form data from first variant (without size/color which are variant-specific)
        // DEBUG: Check if variants have sizeId
        console.log('[openParentModal] parentSku.variants:', parentSku.variants);
        console.log('[openParentModal] Extracted sizeIds:', parentSku.variants?.map((v: any) => ({ name: v.name, sizeId: v.sizeId, metadataSizeId: v.metadata?.sizeId })));

        setFormData({
            brandId: resolvedBrandId,
            lineId: resolvedLineId,
            collection: parentSku.collection || firstVariant.collection || '',
            modelName: metadata.modelName || parentSku.name, // Use parent's base name
            genderId: metadata.genderId || '',
            apparelId: metadata.apparelId || '',
            styleId: metadata.styleId || '',
            patternId: metadata.patternId || '',
            materialId: metadata.materialId || '',
            fitId: metadata.fitId || '',
            selectedSizes: Array.isArray(parentSku.variants)
                ? Array.from(new Set(parentSku.variants.map((v: any) => v.metadata?.sizeId || v.sizeId).filter(Boolean)))
                : [], // Populate with all unique sizes from variants
            selectedColors: [], // Don't show colors for parent editing
            description: parentSku.description || firstVariant.description || '',
            images: [], // Don't edit images from parent
            videos: [],
            nameConfig: metadata.nameConfig || {
                includeStyle: false,
                includePattern: false,
                includeMaterial: false,
                includeFit: false,
                brandLineDisplay: 'brand-only',
                showCollection: false
            },
            generatedName: parentSku.name,
            generatedCode: parentSku.code,
            retailPriceBrl: parentSku.retailPriceBrl || firstVariant.retailPriceBrl || '',
            retailPriceUsd: parentSku.retailPriceUsd || firstVariant.retailPriceUsd || '',
            retailPriceEur: parentSku.retailPriceEur || firstVariant.retailPriceEur || '',
            releaseDate: parentSku.releaseDate ? new Date(parentSku.releaseDate).toISOString().split('T')[0] : '',
            careInstructions: parentSku.careInstructions || ''
        });

        // Fetch measurements - for now, fetch for the first variant to have some data
        try {
            const firstMeasurements = await apiClient.getSKUMeasurements(firstVariant.id);
            const mState: Record<string, any> = {};
            firstMeasurements.forEach((m: any) => {
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
            console.error('Failed to fetch parent variant measurements', e);
            setMeasurements({});
            setSelectedPomIds([]);
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

    // Helper function to build SKU payload - unified for both create and edit
    const buildSKUPayload = (colorId: string | null, sizeId: string | null, isEdit: boolean = false) => {
        const color = colors.find(c => c.id === colorId);
        const size = sizes.find(s => s.id === sizeId);
        const colorName = color?.name || '';
        const sizeName = size?.name || '';

        // Clean up the base name to ensure it doesn't already contain color/size info
        // This is crucial for multi-creation
        let baseName = formData.generatedName;
        if (!isEdit) {
            // Remove any existing (color) or [size] patterns if they somehow got in
            baseName = baseName.replace(/\s*\([^)]*\)\s*\[[^\]]*\]/g, '').trim();
        }

        const nameParts = [baseName];
        // For edit mode, check if color/size already in name to avoid duplication
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
                conditionId: formData.conditionId,
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
                fitName: fits.find(f => f.id === formData.fitId)?.name,
                sizeName: sizeName, // Add explicit names
                colorName: colorName,
                nameConfig: formData.nameConfig
            },
            retailPriceBrl: formData.retailPriceBrl ? Number(formData.retailPriceBrl) : null,
            retailPriceUsd: formData.retailPriceUsd ? Number(formData.retailPriceUsd) : null,
            retailPriceEur: formData.retailPriceEur ? Number(formData.retailPriceEur) : null,
            releaseDate: formData.releaseDate || null,
            careInstructions: formData.careInstructions || null
        };
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode === 'parent' && editingParentVariants.length > 0) {
                // ... (existing logic)
                let updatedCount = 0;
                let failedCount = 0;

                for (const variant of editingParentVariants) {
                    try {
                        const variantMetadata = variant.metadata || {};
                        const parentPayload = {
                            // ... (existing fields)
                            name: variant.name,
                            code: variant.code,
                            brandId: formData.brandId,
                            lineId: formData.lineId || null,
                            collection: formData.collection || null,
                            description: formData.description,
                            images: variant.images,
                            videos: variant.videos,
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
                                ...variantMetadata,
                                modelName: formData.modelName,
                                genderId: formData.genderId,
                                apparelId: formData.apparelId,
                                styleId: formData.styleId,
                                patternId: formData.patternId,
                                materialId: formData.materialId,
                                fitId: formData.fitId,
                                nameConfig: formData.nameConfig,
                                releaseDate: formData.releaseDate ? new Date(formData.releaseDate) : null,
                                careInstructions: formData.careInstructions
                            }
                        };
                        await apiClient.updateSKU(variant.id, parentPayload as any);

                        // Also update measurements for this variant if relevant
                        const variantSizeId = variantMetadata.sizeId || variant.sizeId;
                        if (variantSizeId && measurements) {
                            const sizeMeasurements = Object.entries(measurements).map(([pomId, sizeValues]) => {
                                const m = (sizeValues as any)[variantSizeId];
                                if (!m || m.value === undefined) return null;
                                return { pomId, sizeId: variantSizeId, value: m.value, tolerance: m.tolerance };
                            }).filter(Boolean);
                            if (sizeMeasurements.length > 0) {
                                await apiClient.saveSKUMeasurements(variant.id, sizeMeasurements as any);
                            }
                        }

                        updatedCount++;
                    } catch (error) {
                        console.error(`Failed to update variant ${variant.id}:`, error);
                        failedCount++;
                    }
                }
                toast.success(`Updated ${updatedCount} variant SKU(s)`);
            } else if (editingSku) {
                // Update main SKU
                const colorId = formData.selectedColors[0] || null;
                const sizeId = formData.selectedSizes[0] || null;
                const payload = buildSKUPayload(colorId, sizeId, true);
                await apiClient.updateSKU(editingSku.id, payload);

                // Save measurements for this specific SKU
                if (sizeId && measurements) {
                    const sizeMeasurements = Object.entries(measurements).map(([pomId, sizeValues]) => {
                        const m = (sizeValues as any)[sizeId];
                        if (!m || m.value === undefined) return null;
                        return { pomId, sizeId, value: m.value, tolerance: m.tolerance };
                    }).filter(Boolean);
                    if (sizeMeasurements.length > 0) {
                        await apiClient.saveSKUMeasurements(editingSku.id, sizeMeasurements as any);
                    }
                }
                toast.success('SKU updated successfully');
            } else {
                // Bulk Create
                const sizesToCreate = formData.selectedSizes.length > 0 ? formData.selectedSizes : [];
                const colorsToCreate = formData.selectedColors.length > 0 ? formData.selectedColors : [];
                const parentPayload = buildSKUPayload(null, null, false);
                const parentResult = await apiClient.createSKU(formData.brandId, parentPayload);
                const parentId = parentResult?.sku?.id;

                if (!parentId) {
                    throw new Error('Failed to create parent SKU');
                }

                // Track variant creation results
                let createdVariants = 0;
                let failedVariants = 0;

                if (sizesToCreate.length > 0 || colorsToCreate.length > 0) {
                    const effectiveSizes = sizesToCreate.length > 0 ? sizesToCreate : [null];
                    const effectiveColors = colorsToCreate.length > 0 ? colorsToCreate : [null];

                    for (const colorId of effectiveColors) {
                        for (const sizeId of effectiveSizes) {
                            if (!sizeId && !colorId) continue;
                            try {
                                const variantPayload = buildSKUPayload(colorId, sizeId, false);
                                variantPayload.parentSkuId = parentId;
                                const variantResult = await apiClient.createSKU(formData.brandId, variantPayload);

                                // Save measurements for this variant if size matches
                                if (variantResult?.sku?.id && sizeId && measurements) {
                                    const sizeMeasurements = Object.entries(measurements).map(([pomId, sizeValues]) => {
                                        const m = (sizeValues as any)[sizeId];
                                        if (!m || m.value === undefined) return null;
                                        return { pomId, sizeId, value: m.value, tolerance: m.tolerance };
                                    }).filter(Boolean);
                                    if (sizeMeasurements.length > 0) {
                                        await apiClient.saveSKUMeasurements(variantResult.sku.id, sizeMeasurements as any);
                                    }
                                }
                                createdVariants++;
                            } catch (variantError) {
                                console.error('Failed to create variant:', { colorId, sizeId, error: variantError });
                                failedVariants++;
                            }
                        }
                    }
                }

                // Show appropriate message based on results
                if (failedVariants > 0 && createdVariants > 0) {
                    toast.success(`Created ${createdVariants} variant(s), but ${failedVariants} failed`);
                } else if (failedVariants > 0 && createdVariants === 0) {
                    toast.error(`Parent SKU created but all ${failedVariants} variants failed`);
                } else {
                    toast.success('SKUs created successfully');
                }
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

    // Fetch trash count initially and when search changes
    useEffect(() => {
        fetchDeletedSkus();
    }, [search]);

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
                        {groupedSkus.map(sku => (
                            <React.Fragment key={sku.id}>
                                {/* Parent SKU Row */}
                                <li className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Expand/Collapse Button (only if has variants) */}
                                            {sku.variants && sku.variants.length > 0 ? (
                                                <button
                                                    onClick={() => toggleGroupExpansion(sku.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-transform"
                                                >
                                                    <svg
                                                        className={`h-5 w-5 transition-transform ${expandedGroups.has(sku.id) ? 'rotate-90' : ''}`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <div className="w-7" /> /* Spacer */
                                            )}
                                            {/* Image Thumbnail */}
                                            <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative">
                                                {sku.images?.[0]?.url ? (
                                                    <>
                                                        <img src={sku.images[0].url} alt={sku.name} className="h-full w-full object-cover" />
                                                        {sku.images[0].labelId && (
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white px-1 py-0.5 truncate text-center leading-tight">
                                                                {mediaLabels.find(l => l.id === sku.images[0].labelId)?.name || 'Label'}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <MagnifyingGlassIcon className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/items/${slugify(sku.code)}`}
                                                        className="text-sm font-medium text-blue-600 truncate hover:underline"
                                                    >
                                                        {sku.name}
                                                    </Link>
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {sku.code}
                                                    </span>
                                                    {sku.variants && sku.variants.length > 0 && (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            +{sku.variants.length} variant{sku.variants.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                    {sku.brand?.name && (
                                                        <span className="flex items-center gap-1">
                                                            {sku.brand.logo && (
                                                                <img src={sku.brand.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                                                            )}
                                                            Brand: <span className="font-medium text-gray-900">{sku.brand.name}</span>
                                                        </span>
                                                    )}
                                                    {(sku.lineInfo?.name || sku.line) && (
                                                        <span className="flex items-center gap-1">
                                                            {sku.lineInfo?.logo && (
                                                                <img src={sku.lineInfo.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                                                            )}
                                                            Line: <span className="font-medium text-gray-900">{sku.lineInfo?.name || sku.line}</span>
                                                        </span>
                                                    )}
                                                    {sku.collection && (
                                                        <span className="flex items-center gap-1">
                                                            {sku.collectionInfo?.coverImage && (
                                                                <img src={sku.collectionInfo.coverImage} alt="" className="w-4 h-4 rounded-full object-cover" />
                                                            )}
                                                            Collection: <span className="font-medium text-gray-900">{sku.collection}</span>
                                                        </span>
                                                    )}

                                                    {sku.retailPriceBrl && (
                                                        <span>
                                                            R$ <span className="font-medium text-gray-900">{Number(sku.retailPriceBrl).toFixed(2)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Show edit button for virtual parents */}
                                            {sku.isVirtualParent && (
                                                <>
                                                    <button
                                                        onClick={() => openParentModal(sku)}
                                                        className="p-2 text-blue-500 hover:text-blue-700"
                                                        title="Edit parent (updates all variants)"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sku.id)}
                                                        className="p-2 text-red-500 hover:text-red-700"
                                                        title="Delete parent and all variants"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                            {/* Show edit/delete for real SKUs, not virtual parents */}
                                            {!sku.isVirtualParent && (
                                                <>
                                                    <button onClick={() => openModal(sku)} className="p-2 text-blue-500 hover:text-blue-700">
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(sku.id)} className="p-2 text-red-500 hover:text-red-700">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                                {/* Variant Rows (when expanded) */}
                                {sku.variants && sku.variants.length > 0 && expandedGroups.has(sku.id) && (
                                    sku.variants.map((variant: any) => (
                                        <li key={variant.id} className="block hover:bg-blue-50/50 bg-gray-50 border-l-4 border-blue-200">
                                            <div className="px-4 py-3 sm:px-6 flex items-center justify-between pl-16">
                                                <div className="flex items-center gap-4">
                                                    {/* Variant Image Thumbnail */}
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
                                                    <button onClick={() => handleDelete(variant.id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete variant">
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
                                    {editMode === 'parent'
                                        ? `Edit Parent SKU (${editingParentVariants.length} variants)`
                                        : editMode === 'variant'
                                            ? 'Edit Variant SKU'
                                            : 'Create New SKU(s)'}
                                </h3>

                                {/* Mode indicator for parent edit */}
                                {editMode === 'parent' && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-sm text-blue-800">
                                            <strong>Parent Edit Mode:</strong> Changes will be applied to all {editingParentVariants.length} variant(s).
                                            Size, Color, Images and Videos are variant-specific and won't be changed.
                                        </p>
                                    </div>
                                )}

                                {/* Mode indicator for variant edit */}
                                {editMode === 'variant' && (
                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-sm text-amber-800">
                                            <strong>Variant Edit Mode:</strong> Only Size, Color, Description, Images and Videos can be edited.
                                            To change other fields, edit the parent SKU.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">



                                    {/* 1. Brand / Line / Collection Row - Hidden in variant mode */}
                                    {editMode !== 'variant' && (
                                        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Brand */}
                                            <div>
                                                <SearchableCombobox
                                                    label="Brand"
                                                    value={vufsBrands.find(b => b.id === formData.brandId)?.name || ''}
                                                    onChange={(name) => {
                                                        const brand = vufsBrands.find(b => b.name === name);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            brandId: brand?.id || '',
                                                            lineId: '',
                                                            collection: ''
                                                        }));
                                                    }}
                                                    options={vufsBrands.map(b => ({ ...b, image: b.logo }))}
                                                    placeholder="Select Brand..."
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
                                                    options={lines.map(l => ({ ...l, image: l.logo }))}
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
                                                    options={collections.map(c => ({ ...c, image: getImageUrl(c.coverImageUrl) }))}
                                                    placeholder="Select Collection (Optional)"
                                                    disabled={!formData.brandId}
                                                    freeSolo={true} // Allow new collection names? Maybe not if restricted. But API allows string.
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Model Name & VUFS Attributes - Hidden in variant mode */}
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

                                            {/* 3. Apparel, Style, Pattern, Material, Fit, Gender - Hidden in variant mode */}
                                            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                        options={patterns.map(p => ({
                                                            ...p,
                                                            icon: React.createElement(getPatternIcon(p.name), { className: 'w-full h-full' })
                                                        }))}
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

                                                {/* Silhouette / Modeling Selection */}
                                                <div>
                                                    <SearchableCombobox
                                                        label="Silhouette"
                                                        value={availableSilhouettes.find(s => s.id === selectedSilhouetteId)?.name || ''}
                                                        onChange={(name) => {
                                                            const sil = availableSilhouettes.find(s => s.name === name);
                                                            setSelectedSilhouetteId(sil?.id || '');
                                                        }}
                                                        options={availableSilhouettes}
                                                        placeholder={availableSilhouettes.length > 0 ? "Select Silhouette (Modeling)..." : "No Silhouettes found for this combo"}
                                                        disabled={availableSilhouettes.length === 0}
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
                                                        options={genders.map(g => ({
                                                            ...g,
                                                            icon: React.createElement(getGenderIcon(g.name), { className: 'w-full h-full' })
                                                        }))}
                                                        placeholder="Select Gender..."
                                                    />
                                                </div>

                                                <div className="col-span-2 border-t pt-6 mt-4">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider text-xs">Retail Price</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 uppercase">Price (BRL R$)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                                            <label className="block text-xs font-medium text-gray-700 uppercase">Price (USD $)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                value={formData.retailPriceUsd}
                                                                onChange={e => setFormData({ ...formData, retailPriceUsd: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 uppercase">Price (EUR €)</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                value={formData.retailPriceEur}
                                                                onChange={e => setFormData({ ...formData, retailPriceEur: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Release Date */}
                                                    <div className="col-span-2 sm:col-span-1 mt-4">
                                                        <label className="block text-xs font-medium text-gray-700 uppercase">Release Date</label>
                                                        <input
                                                            type="date"
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                            value={formData.releaseDate}
                                                            onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                                        />
                                                        <p className="mt-1 text-xs text-gray-500">When was this item released or will be released</p>
                                                    </div>

                                                    {/* Care Instructions */}
                                                    <div className="col-span-2 mt-4">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="block text-xs font-medium text-gray-700 uppercase">Care Instructions</label>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    // Get care instructions from selected material
                                                                    const selectedMaterial = materials.find(m => m.id === formData.materialId);
                                                                    if (selectedMaterial?.careInstructions) {
                                                                        setFormData({ ...formData, careInstructions: selectedMaterial.careInstructions });
                                                                    } else if (selectedMaterial?.name) {
                                                                        // Fallback to default care instructions based on material name
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
                                                                        setFormData({ ...formData, careInstructions: instructions });
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
                                                            onChange={e => setFormData({ ...formData, careInstructions: e.target.value })}
                                                            placeholder="How to wash, dry, and maintain this item..."
                                                        />
                                                    </div>



                                                    {/* SKU Name Configuration Section */}
                                                    <div className="col-span-2 border-t pt-6 mt-4">
                                                        <h4 className="text-sm font-semibold text-gray-900 mb-4">SKU Name Configuration</h4>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {/* Include Fields Checkboxes */}
                                                            <div className="space-y-3">
                                                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Include in Name:</label>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="includeStyle"
                                                                        checked={formData.nameConfig.includeStyle}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, includeStyle: e.target.checked }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor="includeStyle" className="ml-2 text-sm text-gray-700">Style</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="includePattern"
                                                                        checked={formData.nameConfig.includePattern}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, includePattern: e.target.checked }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor="includePattern" className="ml-2 text-sm text-gray-700">Pattern</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="includeMaterial"
                                                                        checked={formData.nameConfig.includeMaterial}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, includeMaterial: e.target.checked }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor="includeMaterial" className="ml-2 text-sm text-gray-700">Material</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="includeFit"
                                                                        checked={formData.nameConfig.includeFit}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, includeFit: e.target.checked }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor="includeFit" className="ml-2 text-sm text-gray-700">Fit</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="showCollection"
                                                                        checked={formData.nameConfig.showCollection}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, showCollection: e.target.checked }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    <label htmlFor="showCollection" className="ml-2 text-sm text-gray-700">Collection</label>
                                                                </div>
                                                            </div>

                                                            {/* Brand/Line Display Options */}
                                                            <div className="space-y-3">
                                                                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Brand/Line Display:</label>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        id="brandOnly"
                                                                        name="brandLineDisplay"
                                                                        value="brand-only"
                                                                        checked={formData.nameConfig.brandLineDisplay === 'brand-only'}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, brandLineDisplay: e.target.value as any }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                    />
                                                                    <label htmlFor="brandOnly" className="ml-2 text-sm text-gray-700">Brand Only</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        id="brandAndLine"
                                                                        name="brandLineDisplay"
                                                                        value="brand-and-line"
                                                                        checked={formData.nameConfig.brandLineDisplay === 'brand-and-line'}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, brandLineDisplay: e.target.value as any }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                    />
                                                                    <label htmlFor="brandAndLine" className="ml-2 text-sm text-gray-700">Brand + Line</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        id="lineOnly"
                                                                        name="brandLineDisplay"
                                                                        value="line-only"
                                                                        checked={formData.nameConfig.brandLineDisplay === 'line-only'}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, brandLineDisplay: e.target.value as any }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                    />
                                                                    <label htmlFor="lineOnly" className="ml-2 text-sm text-gray-700">Line Only</label>
                                                                </div>

                                                                <div className="flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        id="noBrandLine"
                                                                        name="brandLineDisplay"
                                                                        value="none"
                                                                        checked={formData.nameConfig.brandLineDisplay === 'none'}
                                                                        onChange={(e) => setFormData(prev => ({
                                                                            ...prev,
                                                                            nameConfig: { ...prev.nameConfig, brandLineDisplay: e.target.value as any }
                                                                        }))}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                                    />
                                                                    <label htmlFor="noBrandLine" className="ml-2 text-sm text-gray-700">None</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )}

                                    {/* Size(s) - Multi-Select - Hidden in parent mode */}
                                    {editMode !== 'parent' && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (Select all that apply)</label>
                                            <div className="relative">
                                                {/* Search Input */}
                                                <input
                                                    type="text"
                                                    placeholder="Search and Select Sizes..."
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    onFocus={() => setOpenDropdown('sizes')}
                                                    onChange={(e) => {
                                                        const searchTerm = e.target.value.toLowerCase();
                                                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (dropdown) dropdown.style.display = 'block'; // Ensure open on search
                                                        setOpenDropdown('sizes');

                                                        const list = dropdown?.querySelector('.dropdown-list') as HTMLElement;
                                                        if (list) {
                                                            const labels = list.querySelectorAll('label');
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
                                                {/* Dropdown List */}
                                                <div
                                                    className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
                                                    style={{ display: openDropdown === 'sizes' ? 'block' : 'none' }}
                                                >
                                                    <div className="dropdown-list">
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
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleMultiSelect('sizes', size.id);
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
                                                        {sizes.length === 0 && (
                                                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                                No sizes available
                                                            </div>
                                                        )}
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
                                                                    onClick={() => handleMultiSelect('sizes', sizeId)}
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
                                    )}

                                    {/* Color(s) - Multi-Select - Also hidden in parent mode */}
                                    {editMode !== 'parent' && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Colors (Select all that apply)</label>
                                            <div className="relative">
                                                {/* Search Input */}
                                                <input
                                                    type="text"
                                                    placeholder="Search and Select Colors..."
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    onFocus={() => setOpenDropdown('colors')}
                                                    onChange={(e) => {
                                                        const searchTerm = e.target.value.toLowerCase();
                                                        const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (dropdown) dropdown.style.display = 'block';
                                                        setOpenDropdown('colors');

                                                        const list = dropdown?.querySelector('.dropdown-list') as HTMLElement;
                                                        if (list) {
                                                            const labels = list.querySelectorAll('label');
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
                                                {/* Dropdown List */}
                                                <div
                                                    className="absolute z-10 w-full mt-1 border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg"
                                                    style={{ display: openDropdown === 'colors' ? 'block' : 'none' }}
                                                >
                                                    <div className="dropdown-list">
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
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleMultiSelect('colors', color.id);
                                                                        }}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    {color.hex && (
                                                                        <span
                                                                            className="ml-3 w-4 h-4 rounded-full border border-gray-300"
                                                                            style={{ backgroundColor: color.hex }}
                                                                        />
                                                                    )}
                                                                    <span className="ml-2 text-sm text-gray-900">{color.name}</span>
                                                                    {isSelected && (
                                                                        <svg className="ml-auto h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                        {colors.length === 0 && (
                                                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                                No colors available
                                                            </div>
                                                        )}
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
                                            </div>
                                            {formData.selectedColors.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
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
                                            )}
                                        </div>
                                    )}

                                    {/* Auto-Generated Preview - Only for new SKUs */}
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

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            rows={3}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>

                                    {/* Measurements Section (Refactored: POM -> Sizes) */}
                                    {formData.apparelId && apparelPOMs.length > 0 && formData.selectedSizes.length > 0 && (
                                        <div className="col-span-2 border-t pt-6 mt-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">Measurements (POMs)</h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Select the Points of Measure you want to define.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* POM Selector */}
                                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Add Measurement Point
                                                </label>
                                                <div className="max-w-md">
                                                    <SearchableCombobox
                                                        label=""
                                                        value=""
                                                        onChange={(name) => {
                                                            const pom = apparelPOMs.find(p => p.name === name);
                                                            if (pom && !selectedPomIds.includes(pom.pom_id || pom.id)) {
                                                                setSelectedPomIds(prev => [...prev, pom.pom_id || pom.id]);
                                                            }
                                                        }}
                                                        options={apparelPOMs
                                                            .filter(pom => !selectedPomIds.includes(pom.pom_id || pom.id))
                                                            .map(pom => ({ ...pom, id: pom.pom_id || pom.id }))} // SearchableCombobox needs id/name
                                                        placeholder="Search to add POM..."
                                                    />
                                                </div>
                                                {selectedPomIds.length === 0 && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">
                                                        No measurements selected. Add one to start.
                                                    </p>
                                                )}
                                                {selectedPomIds.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {selectedPomIds.length} measurements active.
                                                    </p>
                                                )}
                                            </div>

                                            {/* List of Selected POMs */}
                                            <div className="space-y-6">
                                                {selectedPomIds.map((pomId, index) => {
                                                    const pom = apparelPOMs.find(p => (p.pom_id || p.id) === pomId);
                                                    if (!pom) return null; // Should not happen

                                                    const measurementKey = String(pomId);
                                                    const isHalf = pom.is_half_measurement;
                                                    const showCirc = showAsCircumference.has(measurementKey);

                                                    return (
                                                        <div key={pomId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                                            {/* POM Header */}
                                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                                        {pom.code}
                                                                    </span>
                                                                    <h4 className="font-semibold text-gray-900">{pom.name}</h4>
                                                                    {isHalf && (
                                                                        <div className="flex items-center gap-2 ml-2">
                                                                            <span className="text-[10px] font-bold bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-100 uppercase">
                                                                                Half
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setShowAsCircumference(prev => {
                                                                                        const next = new Set(prev);
                                                                                        if (next.has(measurementKey)) next.delete(measurementKey);
                                                                                        else next.add(measurementKey);
                                                                                        return next;
                                                                                    });
                                                                                }}
                                                                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold whitespace-nowrap underline"
                                                                            >
                                                                                Switch to {showCirc ? 'FLAT' : 'CIRCULAR'} Input
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedPomIds(prev => prev.filter(id => id !== pomId))}
                                                                    className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                                    title="Remove Measurement"
                                                                >
                                                                    <XMarkIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>

                                                            {/* Sizes Grid */}
                                                            <div className="p-4 bg-white">
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                                    {formData.selectedSizes.map(sizeId => {
                                                                        const size = sizes.find(s => s.id === sizeId);
                                                                        const currentValue = measurements[measurementKey]?.[sizeId];
                                                                        const displayValue = isHalf && showCirc && currentValue?.value
                                                                            ? currentValue.value * 2
                                                                            : currentValue?.value || '';

                                                                        return (
                                                                            <div key={`${pomId}-${sizeId}`}>
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase text-center">
                                                                                    {size?.name || 'Unknown'}
                                                                                </label>
                                                                                <div className="relative">
                                                                                    <input
                                                                                        type="number"
                                                                                        step="0.1"
                                                                                        placeholder="0.00"
                                                                                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-8 text-center"
                                                                                        value={displayValue}
                                                                                        onChange={(e) => {
                                                                                            const valStr = e.target.value;
                                                                                            const val = valStr === '' ? undefined : parseFloat(valStr);

                                                                                            setMeasurements(prev => {
                                                                                                const next = { ...prev };
                                                                                                if (!next[measurementKey]) next[measurementKey] = {};

                                                                                                if (val === undefined) {
                                                                                                    delete next[measurementKey][sizeId];
                                                                                                    if (Object.keys(next[measurementKey]).length === 0) delete next[measurementKey];
                                                                                                } else {
                                                                                                    const flatVal = isHalf && showCirc ? val / 2 : val;
                                                                                                    next[measurementKey][sizeId] = {
                                                                                                        value: flatVal,
                                                                                                        tolerance: currentValue?.tolerance || pom.default_tolerance || 0.5
                                                                                                    };
                                                                                                }
                                                                                                return next;
                                                                                            });
                                                                                        }}
                                                                                    />
                                                                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                                                                        <span className="text-[10px] text-gray-400">
                                                                                            {pom.measurement_unit || 'cm'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Variant Selector - Only show when editing and variants exist */}
                                    {editingSku && relatedVariants.length > 0 && (
                                        <div className="col-span-2 border-t border-b border-gray-200 py-4 bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-900">
                                                        Apply changes to related variants
                                                    </label>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Select which size/color variants should receive the same updates
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (selectedVariants.length === relatedVariants.length) {
                                                            setSelectedVariants([]);
                                                        } else {
                                                            setSelectedVariants(relatedVariants.map(v => v.id));
                                                        }
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    {selectedVariants.length === relatedVariants.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {relatedVariants.map(variant => (
                                                    <label key={variant.id} className="flex items-center p-2 hover:bg-blue-100 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedVariants.includes(variant.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedVariants([...selectedVariants, variant.id]);
                                                                } else {
                                                                    setSelectedVariants(selectedVariants.filter(id => id !== variant.id));
                                                                }
                                                            }}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-900">{variant.name}</span>
                                                        <span className="ml-auto text-xs text-gray-500">{variant.code}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Media Uploaders - Hidden in parent mode */}
                                    {editMode !== 'parent' && (
                                        <div className="col-span-2 space-y-6 border-t pt-6 mt-2">
                                            <MediaUploader
                                                type="image"
                                                media={formData.images}
                                                onChange={(images) => setFormData({ ...formData, images })}
                                                label="Product Images"
                                                helperText="Upload high-quality images of the product."
                                                onTagImage={(imageUrl) => {
                                                    if (editingSku?.id) {
                                                        // Convert URL using same logic as MediaUploader's getUrl
                                                        let convertedUrl = imageUrl;
                                                        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/api')) {
                                                            let path = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
                                                            if (path.startsWith('storage/')) {
                                                                path = path.substring('storage/'.length);
                                                            }
                                                            convertedUrl = `/api/storage/${path}`;
                                                        }
                                                        setTaggingModal({ isOpen: true, imageUrl: convertedUrl, skuId: editingSku.id });
                                                    } else {
                                                        toast.error('Please save the SKU first before tagging images');
                                                    }
                                                }}
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

            {/* Image Tagging Modal */}
            {taggingModal.isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="tagging-modal-title" role="dialog" aria-modal="true">
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
                                <p className="text-sm text-gray-500 mb-4">Click on the image to add tags. Click the + button to enter edit mode.</p>
                                <ImageTagEditor
                                    imageUrl={taggingModal.imageUrl}
                                    sourceType="sku_image"
                                    sourceId={taggingModal.skuId}
                                    className="max-h-[60vh] overflow-auto"
                                />
                            </div>
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

/**
 * Helper function to slugify strings for URLs
 */
function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
