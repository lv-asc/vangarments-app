'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import MediaUploader from './MediaUploader';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon, InformationCircleIcon, UserCircleIcon, ChevronDownIcon, ChevronUpIcon, CubeIcon } from '@heroicons/react/24/outline';
import { tagApi } from '@/lib/tagApi';
import { sportOrgApi } from '@/lib/sportOrgApi';
import { ImageTagEditor } from '@/components/tagging';
import SearchableCombobox from '../ui/Combobox';
import { ApparelIcon, getPatternIcon, getGenderIcon } from '../ui/ApparelIcons';
import { getImageUrl } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserEntitySelect } from '@/components/ui/UserEntitySelect';
import { EntityRef } from '@vangarments/shared/types/vufs';

interface ItemCreationProps {
    initialData?: any; // For edit mode
    isEditMode?: boolean;
    mode: 'sku' | 'wardrobe';
    onCancel?: () => void;
    onSuccess?: () => void;
}

export default function ItemCreation({ initialData, isEditMode = false, mode, onCancel, onSuccess }: ItemCreationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryBrandId = searchParams.get('brandId');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Brand Accounts (these are the actual brand entities that SKUs reference)
    const [brandAccounts, setBrandAccounts] = useState<any[]>([]);
    const [vufsBrands, setVufsBrands] = useState<any[]>([]);
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
    const [conditions, setConditions] = useState<any[]>([]);
    const [mediaLabels, setMediaLabels] = useState<any[]>([]);

    // Sport ORG State
    const [sportOrgs, setSportOrgs] = useState<any[]>([]);
    const [sportDepartments, setSportDepartments] = useState<any[]>([]);
    const [sportSquads, setSportSquads] = useState<any[]>([]);
    const [hasSponsorRestriction, setHasSponsorRestriction] = useState(false);

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
    const [currentUser, setCurrentUser] = useState<EntityRef | null>(null);

    // Image Tagging State
    const [taggingModal, setTaggingModal] = useState<{ isOpen: boolean; imageUrl: string; skuId: string }>({
        isOpen: false,
        imageUrl: '',
        skuId: ''
    });
    const [taggingTags, setTaggingTags] = useState<any[]>([]);
    const [showVufsDetails, setShowVufsDetails] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        brandId: '',
        brandAccountId: '',
        lineId: '',
        line: '',
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
        // Sport Context
        sportOrgId: '',
        sportDepartmentId: '',
        sportSquadId: '',
        apparelLine: 'match', // match, training, replica, casual
        jerseyNumber: '',
        playerName: '', // or Gamertag
        status: 'licensed', // licensed, fan-made, sponsor-issued
        conditionId: '',
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
            includeFit: false,
            includeColor: true,
            includeSize: true
        },
        generatedName: '',
        generatedCode: '',
        retailPriceBrl: '' as string | number,
        retailPriceUsd: '' as string | number,
        retailPriceEur: '' as string | number,
        paidPriceBrl: '' as string | number,
        sellingPriceBrl: '' as string | number,
        releaseDate: '',
        careInstructions: '',

        officialItemLink: '',
        // Ownership & Lending
        owner: undefined as EntityRef | undefined,
        lentTo: undefined as EntityRef | undefined,
        lentBy: undefined as EntityRef | undefined,
        ownershipStatus: 'owned' as 'owned' | 'loaned' | 'borrowed' | 'sold',
        ownershipVisibility: 'public' as 'public' | 'private' | 'friends'
    });

    // Special effect to pre-fill brandId from query if not in edit mode
    useEffect(() => {
        if (!isEditMode && queryBrandId && brandAccounts.length > 0) {
            const matchingAccount = brandAccounts.find(ba => ba.id === queryBrandId);
            if (matchingAccount) {
                setFormData(prev => ({
                    ...prev,
                    brandId: queryBrandId,
                    brandAccountId: queryBrandId // Usually these match in the context of creating a new one from a brand page
                }));
            }
        }
    }, [isEditMode, queryBrandId, brandAccounts]);

    // Initialize form with data if present
    useEffect(() => {
        if (initialData) {
            initializeForm(initialData);
        }
        fetchAllVUFSData();
    }, [initialData]);

    // Re-run initializeForm once VUFS data is loaded (for wardrobe items that need name-to-ID resolution)
    useEffect(() => {
        if (initialData && !loading && brandAccounts.length > 0) {
            // Check if this is a wardrobe item needing re-initialization
            // Wardrobe items typically have string brand names or we are in edit mode for wardrobe
            // If initialData has 'ownership', it's likely a wardrobe item
            const isWardrobeItem = (initialData.brand?.brand && typeof initialData.brand.brand === 'string') || initialData.ownership;

            if (isWardrobeItem) {
                initializeForm(initialData);
            }
        }
    }, [loading, brandAccounts, apparels, colors, materials, sizes, conditions]);

    const initializeForm = async (sku: any) => {
        const metadata = sku.metadata || {};

        // Detect if this is a wardrobe item (has brand.brand as string name) vs SKU (has brandId UUID)
        const isWardrobeItem = sku.brand?.brand && typeof sku.brand.brand === 'string' && !sku.brandId;

        // Helper to find ID by name from an options array
        const findIdByName = (options: any[], name: string | undefined): string => {
            if (!name) return '';
            const match = options.find(o =>
                o.name?.toLowerCase() === name.toLowerCase() ||
                o.id?.toLowerCase() === name.toLowerCase()
            );
            return match?.id || '';
        };

        // For wardrobe items, we need to wait for VUFS data to be loaded to resolve names to IDs
        // This function will be called again after fetchAllVUFSData completes if needed
        // For now, set what we can and handle ID resolution in a follow-up effect

        let resolvedBrandId = sku.brand?.id || sku.brandId || '';
        let resolvedLineId = sku.lineId || sku.lineInfo?.id || '';
        let resolvedLineName = sku.line || sku.lineInfo?.name || sku.brand?.line || '';
        let resolvedApparelId = metadata.apparelId || '';
        let resolvedStyleId = metadata.styleId || '';
        let resolvedPatternId = metadata.patternId || '';
        let resolvedMaterialId = metadata.materialId || '';
        let resolvedFitId = metadata.fitId || '';
        let resolvedSizeIds: string[] = metadata.sizeId ? [metadata.sizeId] : [];
        let resolvedColorIds: string[] = metadata.colorId ? [metadata.colorId] : [];
        let resolvedConditionId = sku.conditionId || metadata.conditionId || '';
        let resolvedModelName = metadata.modelName || metadata.name || sku.name || '';

        // Fix for Name Duplication: If falling back to sku.name, strip existing brand and variants
        if (!metadata.modelName && !metadata.name && sku.name) {
            // 1. Strip Variants: Remove any trailing (...) or [...] groups
            resolvedModelName = resolvedModelName.replace(/(\s*[\(\[][^)\]]+[\)\]])+$/, '').trim();

            // 2. Strip Brand: If we know the brand name, strip it from start
            const brandName = sku.brand?.brand;
            if (brandName) {
                const brandRegex = new RegExp(`^${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
                resolvedModelName = resolvedModelName.replace(brandRegex, '').trim();
                // Double check for repeated brand
                resolvedModelName = resolvedModelName.replace(brandRegex, '').trim();
            }

            // 3. Strip Apparel: If we know the apparel/category name, strip it from end
            const apparelName = sku.category?.page;
            if (apparelName) {
                const apparelRegex = new RegExp(`\\s*${apparelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
                resolvedModelName = resolvedModelName.replace(apparelRegex, '').trim();
            }
        }

        let resolvedDescription = metadata.description || sku.description || '';

        // Preserve the raw URL/path from API - MediaUploader.getUrl will handle normalization
        // Using getImageUrl here would double-process paths, causing broken URLs
        let resolvedImages = (sku.images || sku.media || []).map((img: any) => ({
            ...img,
            url: img.url || img.imageUrl || img.path || '', // Keep raw path, let MediaUploader normalize
            type: 'image' as const
        }));

        // If it's a wardrobe item, we need to resolve names to IDs
        if (isWardrobeItem) {
            // Try to resolve brand by name
            if (sku.brand?.brand && brandAccounts.length > 0) {
                const brandMatch = brandAccounts.find(b =>
                    b.name?.toLowerCase() === sku.brand.brand.toLowerCase()
                );
                if (brandMatch) {
                    resolvedBrandId = brandMatch.id;
                }
            }

            // Resolve apparel from category.page
            if (sku.category?.page && apparels.length > 0) {
                resolvedApparelId = findIdByName(apparels, sku.category.page);
            }

            // Resolve style from category.blueSubcategory or whiteSubcategory
            if ((sku.category?.blueSubcategory || sku.category?.whiteSubcategory) && styles.length > 0) {
                resolvedStyleId = findIdByName(styles, sku.category.blueSubcategory || sku.category.whiteSubcategory);
            }

            // Resolve color from metadata.colors
            if (metadata.colors?.[0]?.primary && colors.length > 0) {
                const colorId = findIdByName(colors, metadata.colors[0].primary);
                if (colorId) resolvedColorIds = [colorId];
            }

            // Resolve material from metadata.composition
            if (metadata.composition?.[0]?.material && materials.length > 0) {
                resolvedMaterialId = findIdByName(materials, metadata.composition[0].material);
            }

            // Resolve size from metadata.size
            if (metadata.size && sizes.length > 0) {
                const sizeId = findIdByName(sizes, metadata.size);
                if (sizeId) resolvedSizeIds = [sizeId];
            }

            // Resolve pattern
            if (metadata.pattern && patterns.length > 0) {
                resolvedPatternId = findIdByName(patterns, metadata.pattern);
            }

            // Resolve fit
            if (metadata.fit && fits.length > 0) {
                resolvedFitId = findIdByName(fits, metadata.fit);
            }

            // Resolve condition from condition.status or look up by name
            if (sku.condition?.status && conditions.length > 0) {
                // Map status codes to condition names
                const statusToConditionName: Record<string, string> = {
                    'dswt': 'New w/ Tag',
                    'never_used': 'New',
                    'used': 'Good'
                };
                const conditionName = statusToConditionName[sku.condition.status] || sku.condition.status;
                const condMatch = conditions.find(c =>
                    c.name?.toLowerCase().includes(conditionName.toLowerCase())
                );
                if (condMatch) resolvedConditionId = condMatch.id;
            }

            // Line is stored as brand.line (name) for wardrobe items
            resolvedLineName = sku.brand?.line || '';
        }

        // Populate standard fields
        setFormData(prev => ({
            ...prev,
            brandId: resolvedBrandId,
            brandAccountId: resolvedBrandId,
            lineId: resolvedLineId,
            line: resolvedLineName,
            collection: sku.collection || metadata.collection || '',
            modelName: resolvedModelName,
            genderId: metadata.genderId || '',
            apparelId: resolvedApparelId,
            styleId: resolvedStyleId,
            patternId: resolvedPatternId,
            materialId: resolvedMaterialId,
            fitId: resolvedFitId,
            selectedSizes: resolvedSizeIds,
            selectedColors: resolvedColorIds,
            description: resolvedDescription,
            images: resolvedImages,
            videos: sku.videos || [],
            nameConfig: {
                includeBrand: metadata.nameConfig?.includeBrand ?? true,
                includeLine: metadata.nameConfig?.includeLine ?? false,
                includeCollection: metadata.nameConfig?.includeCollection ?? false,
                includeStyle: metadata.nameConfig?.includeStyle ?? false,
                includePattern: metadata.nameConfig?.includePattern ?? false,
                includeMaterial: metadata.nameConfig?.includeMaterial ?? false,
                includeFit: metadata.nameConfig?.includeFit ?? false,
                includeColor: metadata.nameConfig?.includeColor ?? true,
                includeSize: metadata.nameConfig?.includeSize ?? true
            },
            generatedName: sku.name || metadata.name || '',
            generatedCode: sku.code || sku.vufsCode || '',
            retailPriceBrl: sku.retailPriceBrl || metadata.pricing?.retailPrice || '',
            retailPriceUsd: sku.retailPriceUsd || '',
            retailPriceEur: sku.retailPriceEur || '',
            paidPriceBrl: metadata.acquisitionInfo?.purchasePrice || '',
            sellingPriceBrl: metadata.pricing?.currentValue || '',
            officialSkuOrInstance: metadata.officialSkuOrInstance || '',
            isGeneric: metadata.isGeneric || false,
            // Sport Context initialization
            sportOrgId: metadata.sportContext?.orgId || '',
            sportDepartmentId: metadata.sportContext?.departmentId || '',
            sportSquadId: metadata.sportContext?.squadId || '',
            apparelLine: metadata.sportContext?.apparelLine || 'match',
            jerseyNumber: metadata.sportContext?.jerseyNumber || '',
            playerName: metadata.sportContext?.playerName || '',
            status: metadata.sportContext?.status || 'licensed',
            conditionId: resolvedConditionId,
            releaseDate: sku.releaseDate ? new Date(sku.releaseDate).toISOString().split('T')[0] : '',
            careInstructions: sku.careInstructions || metadata.careInstructions?.join(', ') || '',
            officialItemLink: sku.officialItemLink || '',
            // Ownership initialization
            owner: sku.ownership?.owner || (mode === 'wardrobe' && !isEditMode ? currentUser : undefined),
            lentTo: sku.ownership?.lentTo,
            lentBy: sku.ownership?.lentBy,
            ownershipStatus: sku.ownership?.status || 'owned',
            ownershipVisibility: sku.ownership?.visibility || 'public'
        }));

        // Fetch measurements (only for SKUs, not wardrobe items)
        if (!isWardrobeItem && sku.id) {
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
        }

        // Trigger brand-dependent fetches if brandId exists
        if (resolvedBrandId) {
            fetchLines(resolvedBrandId);
            fetchCollections(resolvedBrandId);
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
                mediaLabelsRes,
                silhouettesRes,
                brandsRes,
                conditionsRes
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
                apiClient.getAllMediaLabels(),
                apiClient.getSilhouettes(),
                apiClient.getVUFSBrands(),
                apiClient.getAllConditions()
            ]);

            // Check if user is admin
            let isAdmin = false;
            try {
                const userRes = await apiClient.getCurrentUser();
                isAdmin = userRes?.roles?.includes('admin');
                if (userRes) {
                    const mappedUser: EntityRef = {
                        id: userRes.id,
                        type: 'user',
                        name: userRes.name || userRes.firstName + (userRes.lastName ? ' ' + userRes.lastName : ''),
                        image: userRes.profilePicture || userRes.avatarUrl || userRes.image
                    };
                    setCurrentUser(mappedUser);
                    // If not in edit mode and creating a wardrobe item, default the owner immediately if formData.owner is empty
                    if (mode === 'wardrobe' && !isEditMode) {
                        setFormData(prev => ({ ...prev, owner: prev.owner || mappedUser }));
                    }
                }
            } catch (e) {
                console.error('Failed to check admin status', e);
            }

            // Extract brand accounts from the switchable accounts response
            const switchable = accountsRes?.accounts || {};
            const brands = switchable.brands || [];

            // Set Brand Accounts for the dropdown
            // Admins and Wardrobe items use the curated global brands list (brandsRes)
            // Regular users creating SKUs see only their managed brand accounts
            if (isAdmin || mode === 'wardrobe') {
                setBrandAccounts(brandsRes || []);
            } else {
                setBrandAccounts(brands || []);
            }

            setVufsCategories(categoriesRes || []);
            setApparels(apparelsRes || []);
            setStyles(stylesRes || []);
            setPatterns(patternsRes || []);
            setMaterials(materialsRes || []);
            setFits(fitsRes || []);
            setColors(colorsRes || []);
            setSizes(sizesRes || []);
            // Process conditions: Deduplicate by name and Sort (New w/ Tag first)
            const uniqueConditions = conditionsRes ? Array.from(new Map(conditionsRes.map((c: any) => [c.name, c])).values()) : [];
            uniqueConditions.sort((a: any, b: any) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                if (nameA.includes('new w/ tag')) return -1;
                if (nameB.includes('new w/ tag')) return 1;
                if (nameA === 'new') return -1;
                if (nameB === 'new') return 1;
                return 0;
            });
            setConditions(uniqueConditions);
            setMediaLabels(mediaLabelsRes || []);
            setGenders(Array.isArray(gendersData) ? gendersData : []);
            const silhouettes = Array.isArray(silhouettesRes) ? silhouettesRes : (silhouettesRes as any)?.silhouettes || (silhouettesRes as any)?.data || [];
            setVufsBrands(brandsRes || []);
            setAvailableSilhouettes(silhouettes);

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

    // Sport ORG Fetchers
    const fetchSportOrgs = async () => {
        try {
            const orgs = await sportOrgApi.listOrgs();
            setSportOrgs(orgs);
        } catch (error) {
            console.error('Failed to fetch sport orgs', error);
        }
    };

    const fetchSportDepartments = async (orgId: string) => {
        try {
            const res = await sportOrgApi.listDepartments(orgId);
            setSportDepartments(res.data);
        } catch (error) {
            console.error('Failed to fetch departments', error);
        }
    };

    const fetchSportSquads = async (orgId: string, deptId: string) => {
        try {
            // Note: Api expects orgId/departments/deptId/squads? Or implies flat?
            // Checking sportOrgApi: listDepartments uses /orgId/departments.
            // Squads creation uses /orgId/departments/deptId/squads
            // We need a listSquads? Or we can use getOrg full hierarchy if needed, but lets assume we added list endpoints or can use hierarchy.
            // Actually, querying the Org details gives departments and squads nested if we use getOrg.
            // But for dropdowns better to have simple lists.
            // Let's rely on cascading load or getting full org?
            // Getting full org might be heavy if many squads.
            // Based on sportOrgApi.ts (Step 80), there is NO listSquads.
            // We should use the nested structure from getOrg? Or add listSquads?
            // Let's use getOrg for now as it returns everything nested.
            // Correction: getOrg returns { departments: [ { squads: [] } ] }
            // So if we have orgId, we can get everything.

            // Wait, we need to fetch departments when org connects.
            // listDepartments exists.
            // For squads: typically dependent on department.
            // Let's implement fetchSquads by fetching the specific department?
            // Backend SportDepartmentModel doesn't showing 'get' with squads.
            // Service getFullHierarchy does.
            // We can fetch the ORG and extract the departments/squads from it to populate local state.

            // Actually, let's just fetch the full Org when Org is selected, and populate the cascades from that.
            if (!orgId) return;
            const orgData = await sportOrgApi.getOrg(orgId);
            setSportDepartments(orgData.departments || []);

            // If deptId provided, filter squads
            if (deptId && orgData.departments) {
                const dept = orgData.departments.find((d: any) => d.id === deptId);
                setSportSquads(dept?.squads || []);
            }
        } catch (error) {
            console.error('Failed to fetch sport context', error);
        }
    };

    // Effects for Sport Context
    useEffect(() => {
        if (formData.sportOrgId) {
            // Fetch Org Hierarchy to populate departments and potential squads
            fetchSportSquads(formData.sportOrgId, formData.sportDepartmentId);

            // Check sponsor restriction
            const checkRestriction = async () => {
                const org = sportOrgs.find(o => o.id === formData.sportOrgId);
                if (org) {
                    const isRestricted = org.orgType === 'national_olympic_committee' || org.orgType === 'national_association';
                    setHasSponsorRestriction(isRestricted);
                }
            };
            checkRestriction();

        } else {
            setSportDepartments([]);
            setSportSquads([]);
            setHasSponsorRestriction(false);
        }
    }, [formData.sportOrgId, sportOrgs]);

    useEffect(() => {
        // When department changes, update squads list from the already fetched departments (if we stored them fully)
        // Or re-fetch if needed.
        if (formData.sportDepartmentId && utilHasDepartments(sportDepartments)) {
            const dept = sportDepartments.find(d => d.id === formData.sportDepartmentId);
            setSportSquads(dept?.squads || []);
        } else {
            setSportSquads([]);
        }
    }, [formData.sportDepartmentId, sportDepartments]);

    const utilHasDepartments = (depts: any[]): depts is any[] => {
        return depts && depts.length > 0;
    };

    // Auto-update Sponsor Restriction based on Apparel Line
    useEffect(() => {
        // Condition: Restricted Org + Match Line = Show Warning/Disable Sponsor logos?
        // Logic: If hasSponsorRestriction and apparelLine === 'match', logic flag is active.
        // We can just use these variables in render.
    }, [hasSponsorRestriction, formData.apparelLine]);
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

    const slugify = (text: string | null | undefined) => {
        if (!text) return '';
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const generateSKUCode = (overrides: { colorId?: string | null; sizeId?: string | null } = {}) => {
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

        // Join and truncate to 50 chars (DB constraint on vufs_code column)
        const fullCode = codeParts.filter(Boolean).join('-');
        return fullCode.substring(0, 50);
    };

    // Auto-update name/code
    useEffect(() => {
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

        if (modelName) {
            let cleanModelName = modelName;
            if (cleanModelName) {
                // Robust Brand Stripping: Check if brand name is present at start, ignoring case and special chars
                if (formData.nameConfig.includeBrand && brand?.name) {
                    const normBrand = brand.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const normModel = cleanModelName.toLowerCase().replace(/[^a-z0-9]/g, '');

                    if (normModel.startsWith(normBrand)) {
                        // Find where the brand name ends in the original string by length estimation or regex? 
                        // Simpler: just match case-insensitive startsWith of the raw strings too
                        if (cleanModelName.toLowerCase().startsWith(brand.name.toLowerCase())) {
                            cleanModelName = cleanModelName.substring(brand.name.length).trim();
                        } else {
                            // Fallback: if normalized matched but raw didn't (due to special chars), try to strip roughly length
                            // Or better: Use regex to remove brand name
                            const brandRegex = new RegExp(`^${brand.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
                            cleanModelName = cleanModelName.replace(brandRegex, '').trim();
                        }
                    }
                }

                // Secondary check: if cleanModelName still looks like it starts with brand (e.g. repeated brand)
                if (brand?.name && cleanModelName.toLowerCase().startsWith(brand.name.toLowerCase())) {
                    cleanModelName = cleanModelName.substring(brand.name.length).trim();
                }

                if (cleanModelName) nameParts.push(cleanModelName);
            }
        }

        if (formData.nameConfig.includeStyle && style?.name) nameParts.push(style.name);
        if (formData.nameConfig.includePattern && pattern?.name) nameParts.push(pattern.name);
        if (formData.nameConfig.includeMaterial && material?.name) nameParts.push(material.name);
        if (formData.nameConfig.includeFit && fit?.name) nameParts.push(fit.name);

        if (apparel?.name) nameParts.push(apparel.name);

        // Append Color and Size if configured (for visualization and Wardrobe/Single SKU final name)
        // Note: For bulk SKU creation, these might be stripped and re-added per variant, but we want the preview to be accurate
        if (formData.nameConfig.includeColor) {
            // For wardrobe, use selectedColors[0] if available (single item)
            // For SKU (multi-select), usually we don't show all colors in the base name, but maybe we show the first one?
            // Actually, for Wardrobe it's single select usually.
            const colorId = formData.selectedColors[0];
            const color = colors.find(c => c.id === colorId);
            if (color) nameParts.push(`(${color.name})`);
        }

        if (formData.nameConfig.includeSize) {
            const sizeId = formData.selectedSizes[0];
            const size = sizes.find(s => s.id === sizeId);
            if (size) nameParts.push(`[${size.name}]`);
        }

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
            if (formData.nameConfig.includeColor && colorName && !baseName.includes(`(${colorName})`)) nameParts.push('(' + colorName + ')');
            if (formData.nameConfig.includeSize && sizeName && !baseName.includes(`[${sizeName}]`)) nameParts.push('[' + sizeName + ']');
        } else {
            if (formData.nameConfig.includeColor && colorName) nameParts.push('(' + colorName + ')');
            if (formData.nameConfig.includeSize && sizeName) nameParts.push('[' + sizeName + ']');
        }

        const finalName = nameParts.join(' ');
        const finalCode = generateSKUCode({ colorId, sizeId });

        return {
            name: finalName,
            code: finalCode,
            brandId: formData.brandId,
            lineId: formData.lineId || null,
            line: formData.line || null,
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
                genderName: genders.find(g => g.id === formData.genderId)?.name || formData.genderId,
                apparelName: apparels.find(c => c.id === formData.apparelId)?.name,
                styleName: styles.find(c => c.id === formData.styleId)?.name,
                patternName: patterns.find(p => p.id === formData.patternId)?.name,
                fitName: fits.find(f => f.id === formData.fitId)?.name,
                nameConfig: formData.nameConfig,
                ...(sizeId ? { sizeId, sizeName } : {}),
                ...(colorId ? { colorId, colorName } : {}),
                // Sport Context Metadata
                sportContext: {
                    orgId: formData.sportOrgId,
                    departmentId: formData.sportDepartmentId,
                    squadId: formData.sportSquadId,
                    apparelLine: formData.apparelLine,
                    jerseyNumber: formData.jerseyNumber,
                    playerName: formData.playerName,
                    status: formData.status,
                    sponsorRestriction: hasSponsorRestriction
                }
            },
            retailPriceBrl: formData.retailPriceBrl ? Number(formData.retailPriceBrl) : null,
            retailPriceUsd: formData.retailPriceUsd ? Number(formData.retailPriceUsd) : null,
            retailPriceEur: formData.retailPriceEur ? Number(formData.retailPriceEur) : null,
            releaseDate: formData.releaseDate || null,
            careInstructions: formData.careInstructions || null,
            officialItemLink: formData.officialItemLink || null,
            conditionId: formData.conditionId || null,
            parentSkuId: null as string | null
        };
    };

    const buildWardrobePayload = (colorId: string | null, sizeId: string | null) => {
        const color = colors.find(c => c.id === colorId);
        const size = sizes.find(s => s.id === sizeId);
        const colorName = color?.name || '';
        const sizeName = size?.name || '';

        const brand = brandAccounts.find(b => b.id === formData.brandId);
        const line = lines.find(l => l.id === formData.lineId);
        const apparel = apparels.find(c => c.id === formData.apparelId);
        const style = styles.find(c => c.id === formData.styleId);
        const pattern = patterns.find(p => p.id === formData.patternId);
        const material = materials.find(m => m.id === formData.materialId);
        const fit = fits.find(f => f.id === formData.fitId);
        const selectedCondition = conditions.find(c => c.id === formData.conditionId);

        const nameParts = [formData.generatedName];
        // We rely on generatedName already including checking checks for includeColor/Size via useEffect
        // But if generatedName was edited manually or is empty, we fall back.
        // Actually, generatedName now includes them if checked. If unchecked, we shouldn't add them.
        // So we just use generatedName.
        const finalName = nameParts.join(' ') || formData.modelName || 'Wardrobe Item';

        const conditionMapping: Record<string, string> = {
            'New w/ Tag (New)': 'dswt',
            'New (New)': 'never_used',
            'Excellent (used)': 'used',
            'Good (used)': 'used',
            'Fair (used)': 'used',
            'Poor (used)': 'used'
        };

        const mappedStatus = selectedCondition ? (conditionMapping[selectedCondition.name] || 'used') : 'used';

        const payload: any = {
            category: {
                page: apparel?.name || 'Apparel',
                blueSubcategory: style?.name || apparel?.name || '',
                whiteSubcategory: style?.name || '',
                graySubcategory: ''
            },
            brand: {
                brand: brand?.name || 'Generic',
                line: line?.name || formData.line || ''
            },
            metadata: {
                name: finalName,
                colors: colorId ? [{
                    primary: colorName,
                    undertones: []
                }] : [],
                composition: material ? [{
                    material: material.name,
                    percentage: 100
                }] : [],
                size: sizeName || 'One Size',
                pattern: pattern?.name || '',
                fit: fit?.name || '',
                description: formData.description || '',
                careInstructions: formData.careInstructions ? [formData.careInstructions] : [],
                pricing: {
                    retailPrice: formData.retailPriceBrl ? Number(formData.retailPriceBrl) : 0,
                    currentValue: formData.sellingPriceBrl ? Number(formData.sellingPriceBrl) : (formData.retailPriceBrl ? Number(formData.retailPriceBrl) : 0),
                    currency: 'BRL'
                },
                acquisitionInfo: {
                    purchaseDate: formData.releaseDate || new Date().toISOString(),
                    purchasePrice: formData.paidPriceBrl ? Number(formData.paidPriceBrl) : 0,
                    store: brand?.name || 'Generic'
                },
                modelName: formData.modelName,
                nameConfig: formData.nameConfig,
                // Store IDs for edit mapping
                genderId: formData.genderId,
                apparelId: formData.apparelId,
                styleId: formData.styleId,
                patternId: formData.patternId,
                materialId: formData.materialId,
                fitId: formData.fitId,
                sizeId: sizeId,
                colorId: colorId
            },
            condition: {
                status: mappedStatus,
                defects: []
            },
            ownership: {
                status: formData.ownershipStatus || 'owned',
                visibility: formData.ownershipVisibility || 'public',
                owner: formData.owner,
                lentTo: formData.lentTo,
                lentBy: formData.lentBy,
                loanDate: (formData.lentTo || formData.lentBy) ? new Date() : undefined
            },
            images: formData.images,
            code: formData.generatedCode
        };

        // Add officialItemLink to metadata if present
        if (formData.officialItemLink) {
            // @ts-ignore
            payload.metadata.officialItemLink = formData.officialItemLink;
        }

        return payload;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (mode === 'wardrobe') {
                const colorId = formData.selectedColors[0] || null;
                const sizeId = formData.selectedSizes[0] || null;
                const payload = buildWardrobePayload(colorId, sizeId);

                if (isEditMode && initialData) {
                    await apiClient.updateWardrobeItem(initialData.id, payload);
                    toast.success('Wardrobe item updated successfully');
                } else {
                    await apiClient.createWardrobeItem(payload);
                    toast.success('Wardrobe item created successfully');
                }
                if (onSuccess) {
                    onSuccess();
                    return;
                }
                // Redirect to the item page using the code (generated or existing)
                // Use payload.code or fallback to formData.generatedCode
                const redirectCode = payload.code || formData.generatedCode;
                router.push(redirectCode ? `/wardrobe/${redirectCode}` : '/wardrobe');
                return;
            }

            if (isEditMode && initialData) {
                // Edit Logic (simplified: single variant edit for now, need to clarify robust parent/variant editing in page flow)
                // For page flow, we'll assume we are editing the SPECIFIC entity loaded by ID.
                // If ID is parent, update parent. If ID is variant, update variant.

                const colorId = formData.selectedColors[0] || null;
                const sizeId = formData.selectedSizes[0] || null;
                const payload = buildSKUPayload(colorId, sizeId, true);

                await apiClient.updateSKU(initialData.id, payload);
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
            console.error('Failed to submit item', error);
            toast.error('Failed to save item');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !initialData) {
        return <div className="p-8 text-center">Loading form data...</div>;
    }

    const renderSizeSelector = (label: string, placeholder: string) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <SearchableCombobox
                multiple={mode !== 'wardrobe'}
                options={sizes.map(s => ({ id: s.id, name: s.name }))}
                value={formData.selectedSizes.map(id => sizes.find(s => s.id === id)?.name).filter(Boolean) as string[]}
                onChange={(val: string[] | string) => {
                    const names = Array.isArray(val) ? val : [val];
                    const selectedIds = names.map(name => sizes.find(s => s.name === name)?.id).filter(Boolean) as string[];
                    setFormData(prev => ({ ...prev, selectedSizes: selectedIds }));
                }}
                placeholder={placeholder}
            />
            {formData.selectedSizes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {formData.selectedSizes.map(sizeId => {
                        const size = sizes.find(s => s.id === sizeId);
                        return (
                            <span
                                key={sizeId}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm"
                            >
                                {size?.name || sizeId}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, selectedSizes: prev.selectedSizes.filter(i => i !== sizeId) }))}
                                    className="ml-2 text-blue-400 hover:text-blue-600 focus:outline-none transition-colors"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderColorSelector = (label: string, placeholder: string) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <SearchableCombobox
                multiple={mode !== 'wardrobe'}
                options={colors.map(c => ({ id: c.id, name: c.name, hex: c.hex }))}
                value={formData.selectedColors.map(id => colors.find(c => c.id === id)?.name).filter(Boolean) as string[]}
                onChange={(val: string[] | string) => {
                    const names = Array.isArray(val) ? val : [val];
                    const selectedIds = names.map(name => colors.find(c => c.name === name)?.id).filter(Boolean) as string[];
                    setFormData(prev => ({ ...prev, selectedColors: selectedIds }));
                }}
                placeholder={placeholder}
            />
            {formData.selectedColors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {formData.selectedColors.map(colorId => {
                        const color = colors.find(c => c.id === colorId);
                        return (
                            <span
                                key={colorId}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-100 shadow-sm"
                            >
                                <span className="w-3 h-3 rounded-full border border-gray-200 mr-2 flex-shrink-0" style={{ backgroundColor: color?.hex || '#ccc' }} />
                                {color?.name || colorId}
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, selectedColors: prev.selectedColors.filter(i => i !== colorId) }))}
                                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto bg-white p-6 rounded-lg shadow">

            {/* Header with Miniature - Centered */}
            <div className="flex flex-col items-center text-center gap-4 mb-8 border-b pb-6 relative">
                <div className="absolute left-0 top-0">
                    <Button type="button" variant="secondary" onClick={() => {
                        if (onCancel) {
                            onCancel();
                        } else {
                            router.push(mode === 'sku' ? '/admin/skus' : '/wardrobe');
                        }
                    }}>
                        Cancel
                    </Button>
                </div>
                <div className="absolute right-0 top-0">
                    <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                <div className="h-24 w-24 bg-gray-100 rounded-xl border border-gray-200 text-gray-400 flex items-center justify-center overflow-hidden shadow-sm">
                    {formData.images && formData.images.length > 0 ? (
                        <img src={getImageUrl(formData.images[0].url)} alt="Item Preview" className="h-full w-full object-cover" />
                    ) : (
                        <ApparelIcon name={apparels.find(a => a.id === formData.apparelId)?.name || 'T-Shirt'} className="h-12 w-12" />
                    )}
                </div>
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                        {isEditMode ? 'Edit' : 'Create'} {mode === 'sku' ? (formData.modelName || 'SKU') : 'Wardrobe Item'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-lg">
                        {formData.officialSkuOrInstance || (mode === 'sku' ? 'Update SKU details and settings for this product.' : 'Define the details of the item in your wardrobe.')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Brand Selection - Autocomplete */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <SearchableCombobox
                        options={brandAccounts.map(b => ({ id: b.id, name: b.name, image: getImageUrl(b.avatar || b.logo || b.masterLogo) }))}
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
                        options={lines.map(l => ({ ...l, name: l.name, image: getImageUrl(l.logo) }))}
                        value={formData.line}
                        onChange={(val) => {
                            const line = lines.find(l => l.name === val);
                            setFormData(prev => ({
                                ...prev,
                                lineId: line?.id || '',
                                line: val || ''
                            }));
                        }}
                        placeholder="Select Line"
                        disabled={!formData.brandId}
                        freeSolo={true}
                    />
                </div>
                {/* Collection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
                    <SearchableCombobox
                        options={collections.map(c => ({ ...c, image: getImageUrl(c.coverImage || c.coverImageUrl || c.image || c.logo) }))}
                        value={formData.collection}
                        onChange={(val) => {
                            setFormData(prev => ({ ...prev, collection: val || '' }));
                        }}
                        placeholder="Select or Type Collection"
                        freeSolo={true}
                    />
                </div>
                {/* Sport ORG - Organization Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sport ORG</label>
                    <SearchableCombobox
                        options={sportOrgs.map(o => ({ id: o.id, name: o.name, image: o.masterLogo }))}
                        value={sportOrgs.find(o => o.id === formData.sportOrgId)?.name || ''}
                        onChange={(val) => {
                            const org = sportOrgs.find(o => o.name === val);
                            setFormData(prev => ({
                                ...prev,
                                sportOrgId: org?.id || '',
                                sportDepartmentId: '',
                                sportSquadId: ''
                            }));
                        }}
                        placeholder="Select Sport Org"
                    />
                </div>

                {/* Condition - Only for Wardrobe */}
                {mode === 'wardrobe' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                        <select
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            value={formData.conditionId}
                            onChange={(e) => setFormData(prev => ({ ...prev, conditionId: e.target.value }))}
                        >
                            <option value="">Select Condition</option>
                            {conditions.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>


            {/* Sport ORG Context */}
            {formData.sportOrgId && (
                <div className="p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Sport ORG Context</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <SearchableCombobox
                                options={sportDepartments.map(d => ({ id: d.id, name: d.name }))}
                                value={sportDepartments.find(d => d.id === formData.sportDepartmentId)?.name || ''}
                                onChange={(val) => {
                                    const dept = sportDepartments.find(d => d.name === val);
                                    setFormData(prev => ({ ...prev, sportDepartmentId: dept?.id || '', sportSquadId: '' }));
                                }}
                                placeholder="Select Department"
                                disabled={!formData.sportOrgId}
                            />
                        </div>
                        {/* Squad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Squad</label>
                            <SearchableCombobox
                                options={sportSquads.map(s => ({ id: s.id, name: s.name }))}
                                value={sportSquads.find(s => s.id === formData.sportSquadId)?.name || ''}
                                onChange={(val) => {
                                    const squad = sportSquads.find(s => s.name === val);
                                    setFormData(prev => ({ ...prev, sportSquadId: squad?.id || '' }));
                                }}
                                placeholder="Select Squad"
                                disabled={!formData.sportDepartmentId}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Apparel Line</label>
                            <select
                                value={formData.apparelLine}
                                onChange={(e) => setFormData(prev => ({ ...prev, apparelLine: e.target.value }))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="match">Match (Competition)</option>
                                <option value="training">Training</option>
                                <option value="replica">Replica (Fan)</option>
                                <option value="casual">Casual / Lifestyle</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            >
                                <option value="licensed">Licensed</option>
                                <option value="sponsor-issued">Sponsor Issued</option>
                                <option value="fan-made">Fan Made</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                            <input
                                type="text"
                                value={formData.jerseyNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                                placeholder="#"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Player Name / Gamertag</label>
                            <input
                                type="text"
                                value={formData.playerName}
                                onChange={(e) => setFormData(prev => ({ ...prev, playerName: e.target.value }))}
                                placeholder="e.g. Neymar Jr"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>

                    {hasSponsorRestriction && formData.apparelLine === 'match' && (
                        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-bold">Attention:</span> This Organization has commercial sponsor restrictions for Match items (e.g. Olympic Committee rules). Ensure logos comply with regulations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
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
            {/* Detailed VUFS Attributes Section */}
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                <button
                    type="button"
                    onClick={() => setShowVufsDetails(!showVufsDetails)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <CubeIcon className="w-5 h-5 text-gray-500" />
                        <h3 className="text-md font-bold text-gray-700 uppercase tracking-tight">See More / Detailed Attributes</h3>
                    </div>
                    {showVufsDetails ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
                </button>

                {showVufsDetails && (
                    <div className="p-6 space-y-6 bg-white border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Apparel */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Apparel</label>
                                <SearchableCombobox
                                    options={apparels.map(a => ({ id: a.id, name: a.name, icon: <ApparelIcon name={a.name} className="w-5 h-5" /> }))}
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
                                    options={styles.map(s => ({ id: s.id, name: s.name }))}
                                    value={styles.find(s => s.id === formData.styleId)?.name || ''}
                                    onChange={(val) => {
                                        const style = styles.find(s => s.name === val);
                                        setFormData(prev => ({ ...prev, styleId: style?.id || '' }));
                                    }}
                                    placeholder="Select Style"
                                />
                            </div>
                        </div>

                        {/* Attributes: Pattern, Material, Fit, Gender */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pattern</label>
                                <SearchableCombobox
                                    options={patterns.map(p => ({ id: p.id, name: p.name, icon: React.createElement(getPatternIcon(p.name), { className: 'w-full h-full' }) }))}
                                    value={patterns.find(p => p.id === formData.patternId)?.name || ''}
                                    onChange={v => {
                                        const p = patterns.find(item => item.name === v);
                                        setFormData(prev => ({ ...prev, patternId: p?.id || '' }));
                                    }}
                                    placeholder="Select Pattern"
                                />
                                {mode === 'wardrobe' && (
                                    <div className="mt-4">
                                        {renderSizeSelector('Size', 'Select Size')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                                <SearchableCombobox
                                    options={materials.map(m => ({ id: m.id, name: m.name }))}
                                    value={materials.find(m => m.id === formData.materialId)?.name || ''}
                                    onChange={v => {
                                        const m = materials.find(item => item.name === v);
                                        setFormData(prev => ({ ...prev, materialId: m?.id || '' }));
                                    }}
                                    placeholder="Select Material"
                                />
                                {mode === 'wardrobe' && (
                                    <div className="mt-4">
                                        {renderColorSelector('Color', 'Select Color')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
                                <SearchableCombobox
                                    options={fits.map(f => ({ id: f.id, name: f.name }))}
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
                                    options={genders.map(g => ({ id: g.id, name: g.name, icon: React.createElement(getGenderIcon(g.name), { className: 'w-full h-full' }) }))}
                                    value={genders.find(g => g.id === formData.genderId)?.name || ''}
                                    onChange={v => {
                                        const g = genders.find(item => item.name === v);
                                        setFormData(prev => ({ ...prev, genderId: g?.id || '' }));
                                    }}
                                    placeholder="Select Gender"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Ownership & Lending Section - Wardrobe Mode Only */}
            {mode === 'wardrobe' && (
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <UserCircleIcon className="w-5 h-5 text-blue-500" />
                        Ownership & Lending
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <SearchableCombobox
                                options={[
                                    { id: 'owned', name: 'Owned' },
                                    { id: 'loaned', name: 'Lent Out' },
                                    { id: 'borrowed', name: 'Borrowed' },
                                    { id: 'sold', name: 'Sold' }
                                ]}
                                value={[
                                    { id: 'owned', name: 'Owned' },
                                    { id: 'loaned', name: 'Lent Out' },
                                    { id: 'borrowed', name: 'Borrowed' },
                                    { id: 'sold', name: 'Sold' }
                                ].find(opt => opt.id === formData.ownershipStatus)?.name || ''}
                                onChange={(val) => {
                                    const status = [
                                        { id: 'owned', name: 'Owned' },
                                        { id: 'loaned', name: 'Lent Out' },
                                        { id: 'borrowed', name: 'Borrowed' },
                                        { id: 'sold', name: 'Sold' }
                                    ].find(opt => opt.name === val)?.id;
                                    if (status) {
                                        setFormData(prev => ({ ...prev, ownershipStatus: status as any }));
                                    }
                                }}
                                placeholder="Select Status"
                            />
                        </div>
                        {/* Owner */}
                        <div>
                            <UserEntitySelect
                                label="Owner (Who owns this item?)"
                                placeholder="Search users or brands..."
                                value={formData.owner}
                                onChange={(val) => setFormData(prev => ({ ...prev, owner: val }))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave unchanged if you are the owner.</p>
                        </div>
                        {/* Lent To */}
                        {formData.ownershipStatus === 'loaned' && (
                            <div className="md:col-span-2">
                                <UserEntitySelect
                                    label="Lent To (Who currently has this item?)"
                                    placeholder="Search users or brands..."
                                    value={formData.lentTo}
                                    onChange={(val) => setFormData(prev => ({ ...prev, lentTo: val }))}
                                    excludeIds={formData.owner ? [formData.owner.id] : []}
                                />
                            </div>
                        )}
                        {/* Lent By */}
                        {formData.ownershipStatus === 'borrowed' && (
                            <div className="md:col-span-2">
                                <UserEntitySelect
                                    label="Lent By (Who did you borrow this from?)"
                                    placeholder="Search users or brands..."
                                    value={formData.lentBy}
                                    onChange={(val) => setFormData(prev => ({ ...prev, lentBy: val }))}
                                    excludeIds={formData.owner ? [formData.owner.id] : []}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}


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
            {
                taggingModal.isOpen && (
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
                )
            }

            {/* Variants (Sizes & Colors) - Enhanced Multi-Select UI */}
            {
                mode !== 'wardrobe' && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Variants</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderSizeSelector('Sizes (Select multiple)', 'Search and Select Sizes...')}
                            {renderColorSelector('Colors (Select multiple)', 'Search and Select Colors...')}
                        </div>
                    </div>
                )
            }

            {/* Name Generation Config */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b pb-3 mb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Name Generation Engine</h3>
                        <div className="text-right">
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Dynamic</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeBrand} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeBrand: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Brand</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeLine} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeLine: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Line</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeCollection} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeCollection: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Collection</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeStyle} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeStyle: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Style</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includePattern} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includePattern: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Pattern</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeMaterial} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeMaterial: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Material</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeFit} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeFit: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Fit</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeColor} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeColor: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Color</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input type="checkbox" checked={formData.nameConfig.includeSize} onChange={e => setFormData(p => ({ ...p, nameConfig: { ...p.nameConfig, includeSize: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Size</span>
                        </label>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated Name</p>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{formData.generatedName || '—'}</p>
                        </div>
                        <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Generated Code</p>
                            <p className="text-sm font-mono font-bold text-blue-600 leading-tight uppercase tracking-tight">{formData.generatedCode || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Silhouettes & Measurements */}
            <div className="border-t pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Silhouettes and Measurements</h3>
                    <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* Silhouette Selection */}
                <div className="mb-8 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-4">
                        <InformationCircleIcon className="w-5 h-5 text-indigo-500" />
                        <label className="block text-sm font-bold text-gray-700">Apply Design Template (Silhouette)</label>
                    </div>
                    <div className="max-w-xl">
                        <SearchableCombobox
                            options={availableSilhouettes.map(s => ({ id: s.id, name: `${s.name} (${s.variant || 'Default'})` }))}
                            value={(() => {
                                const sil = availableSilhouettes.find(s => s.id === selectedSilhouetteId);
                                return sil ? `${sil.name} (${sil.variant || 'Default'})` : '';
                            })()}
                            onChange={(name) => {
                                const sil = availableSilhouettes.find(s => `${s.name} (${s.variant || 'Default'})` === name);
                                if (sil) {
                                    setSelectedSilhouetteId(sil.id);
                                    if (sil.pom_ids) setSelectedPomIds(sil.pom_ids);
                                    if (sil.measurements) setMeasurements(sil.measurements);
                                    toast.success(`Applied silhouette: ${sil.name}`);
                                }
                            }}
                            placeholder="Select a Silhouette to auto-fill measurements..."
                        />
                        <p className="mt-2 text-xs text-indigo-500 font-medium italic">Selecting a silhouette will automatically populate the measurement points and values based on the brand's standard.</p>
                    </div>
                </div>

                {/* POM Selector */}
                <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                        <PlusIcon className="w-5 h-5 text-blue-500" />
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-tight">Add Specific POM</label>
                    </div>
                    <div className="max-w-xl">
                        <SearchableCombobox
                            options={pomDefinitions.filter(pom => !selectedPomIds.includes(pom.id)).map(pom => ({ id: pom.id, name: pom.name }))}
                            value=""
                            onChange={(name) => {
                                const pom = pomDefinitions.find(p => p.name === name);
                                if (pom && !selectedPomIds.includes(pom.id)) {
                                    setSelectedPomIds(prev => [...prev, pom.id]);
                                }
                            }}
                            placeholder="Search to add POM definition..."
                        />
                    </div>
                </div>

                {/* Measurements Grid */}
                {selectedPomIds.length > 0 && formData.selectedSizes.length > 0 ? (
                    <div className="space-y-8">
                        {selectedPomIds.map(pomId => {
                            const pom = pomDefinitions.find(p => p.id === pomId);
                            if (!pom) return null;
                            const measurementKey = String(pomId);

                            return (
                                <div key={pomId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                                    <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex items-center justify-between group-hover:bg-blue-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 shadow-sm tracking-tighter uppercase">{pom.code}</span>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm leading-none">{pom.name}</h4>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">{pom.category_name || 'Design Reference'}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPomIds(prev => prev.filter(id => id !== pomId))}
                                            className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                                            title="Delete measurement point"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                                            {formData.selectedSizes.map((sizeId, idx) => {
                                                const size = sizes.find(s => s.id === sizeId);
                                                const currentValue = measurements[measurementKey]?.[sizeId];

                                                return (
                                                    <div key={`${pomId}-${sizeId}`} className="relative group/size">
                                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase text-center tracking-widest">{size?.name || '?'}</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number" step="any" placeholder="0.0"
                                                                className="block w-full text-sm font-bold border-gray-100 rounded-xl bg-gray-50/50 py-3 focus:ring-blue-500 focus:border-blue-500 text-center transition-all hover:bg-white hover:border-gray-300 shadow-inner"
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
                                                            <span className="absolute bottom-1 right-2 text-[8px] font-bold text-gray-300 uppercase">{pom.measurement_unit || 'cm'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Grading Tool - Premium UI */}
                                            {formData.selectedSizes.length > 1 && (
                                                <div className="flex flex-col justify-end bg-blue-50/50 p-2 rounded-xl border border-blue-100 border-dashed">
                                                    <div className="flex items-center justify-center gap-1 mb-1">
                                                        <span className="text-[9px] uppercase font-black text-blue-500 tracking-tighter">Grading</span>
                                                        <InformationCircleIcon className="w-3 h-3 text-blue-300" />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            id={`grade-${pomId}`}
                                                            type="number"
                                                            step="any"
                                                            placeholder="+0.0"
                                                            className="w-full text-xs font-bold bg-white border border-blue-100 rounded-lg focus:ring-blue-500 text-center p-1 shadow-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const incValue = parseFloat(e.currentTarget.value);
                                                                    if (!isNaN(incValue)) {
                                                                        const firstSizeId = formData.selectedSizes[0];
                                                                        const firstValue = measurements[measurementKey]?.[firstSizeId]?.value;
                                                                        if (firstValue !== undefined) {
                                                                            setMeasurements(prev => {
                                                                                const newM = { ...prev };
                                                                                if (!newM[measurementKey]) newM[measurementKey] = {};
                                                                                formData.selectedSizes.forEach((siz, idx) => {
                                                                                    if (idx === 0) return;
                                                                                    newM[measurementKey][siz] = {
                                                                                        value: Math.round((firstValue + (incValue * idx)) * 10) / 10,
                                                                                        tolerance: pom.default_tolerance || 0.5
                                                                                    };
                                                                                });
                                                                                return newM;
                                                                            });
                                                                            toast.success(`Applied +${incValue} grading to ${pom.name}`);
                                                                        } else {
                                                                            toast.error('Enter base size value first');
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const input = document.getElementById(`grade-${pomId}`) as HTMLInputElement;
                                                                const incValue = parseFloat(input.value);
                                                                if (!isNaN(incValue)) {
                                                                    const firstSizeId = formData.selectedSizes[0];
                                                                    const firstValue = measurements[measurementKey]?.[firstSizeId]?.value;
                                                                    if (firstValue !== undefined) {
                                                                        setMeasurements(prev => {
                                                                            const newM = { ...prev };
                                                                            if (!newM[measurementKey]) newM[measurementKey] = {};
                                                                            formData.selectedSizes.forEach((siz, idx) => {
                                                                                if (idx === 0) return;
                                                                                newM[measurementKey][siz] = {
                                                                                    value: Math.round((firstValue + (incValue * idx)) * 10) / 10,
                                                                                    tolerance: pom.default_tolerance || 0.5
                                                                                };
                                                                            });
                                                                            return newM;
                                                                        });
                                                                        toast.success(`Applied +${incValue} grading`);
                                                                    } else {
                                                                        toast.error('Enter base size value first');
                                                                    }
                                                                }
                                                            }}
                                                            className="text-[9px] font-black bg-blue-500 text-white rounded p-1 hover:bg-blue-600 transition-colors uppercase px-2 shadow-sm"
                                                        >
                                                            Fill
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 border-dashed p-10 text-center">
                        <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                            <PlusIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Select sizes above and add POMs to start defining garment measurements.</p>
                        <p className="text-gray-400 text-xs mt-1">Measurements are crucial for technical packs and virtual wardrobe fit prediction.</p>
                    </div>
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
                {mode === 'wardrobe' ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paid Price (BRL)</label>
                            <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.paidPriceBrl} onChange={e => setFormData(prev => ({ ...prev, paidPriceBrl: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (BRL)</label>
                            <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.sellingPriceBrl} onChange={e => setFormData(prev => ({ ...prev, sellingPriceBrl: e.target.value }))} />
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (USD)</label>
                            <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.retailPriceUsd} onChange={e => setFormData(prev => ({ ...prev, retailPriceUsd: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (EUR)</label>
                            <input type="number" step="0.01" className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border" value={formData.retailPriceEur} onChange={e => setFormData(prev => ({ ...prev, retailPriceEur: e.target.value }))} />
                        </div>
                    </>
                )}
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

            {/* Bottom Actions */}
            <div className="pt-6 border-t flex justify-between items-center">
                <Button type="button" variant="secondary" onClick={() => router.push(mode === 'sku' ? '/admin/skus' : '/wardrobe')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="px-10">
                    {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

        </form >
    );
}
