'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { skuApi } from '@/lib/skuApi';
import { vufsApi, VUFSAttributeValue, VUFSMaterial, VUFSColor, VUFSSize } from '@/lib/vufsApi';
import { brandApi } from '@/lib/brandApi';
import {
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    XMarkIcon,
    ChevronDownIcon,
    TagIcon,
    UsersIcon,
    SparklesIcon,
    Square3Stack3DIcon,
    ArrowsPointingOutIcon,
    VariableIcon,
    QueueListIcon,
    CalendarIcon,
    SwatchIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { getImageUrl } from '@/lib/utils';
import { ApparelIcon, getPatternIcon, getGenderIcon } from '@/components/ui/ApparelIcons';


// Re-export Filters interface for consumers
export interface ItemsFilters {
    brandId?: string;
    styleId?: string;
    patternId?: string;
    fitId?: string;
    genderId?: string;
    subcategory1Id?: string;
    subcategory2Id?: string;
    subcategory3Id?: string;
    apparelId?: string;
    materialId?: string;
    sizeId?: string;
    lineId?: string;
    collection?: string;
    nationality?: string;
    years?: string;
    months?: string;
    days?: string;
    colorId?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    sortBy?: string;
    [key: string]: string | undefined;
}

export interface AvailableFacets {
    brands?: string[];
    departments?: string[];
    categories?: string[];
    subcategories?: string[];
    apparelTypes?: string[];
    colors?: string[];
    patterns?: string[];
    materials?: string[];
    lines?: string[];
    collections?: string[];
    sizes?: string[];
    genders?: string[];
    fits?: string[];
    styles?: string[];
    nationalities?: string[];
    years?: string[];
    months?: string[];
    days?: string[];
    conditions?: string[];
}

interface FilterOptions {
    brands: any[];
    subcategory1: VUFSAttributeValue[];
    subcategory2: VUFSAttributeValue[];
    subcategory3: VUFSAttributeValue[];
    apparelTypes: VUFSAttributeValue[];
    styles: VUFSAttributeValue[];
    patterns: any[];
    fits: any[];
    genders: any[];
    materials: VUFSMaterial[];
    colors: VUFSColor[];
    sizes: VUFSSize[];
    nationalities: string[];
    brandLines: any[];
    brandCollections: any[];
    years: number[];
    months: number[];
    days: number[];
}

interface ItemsFilterProps {
    filters: ItemsFilters;
    onChange: (filters: ItemsFilters | ((prev: ItemsFilters) => ItemsFilters)) => void;
    availableFacets?: AvailableFacets;
    useNameAsValue?: boolean;
    lockedFilters?: Partial<ItemsFilters>;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    children?: React.ReactNode;
    className?: string;
}

export const countryFlags: Record<string, string> = {
    "United States": "🇺🇸",
    "Germany": "🇩🇪",
    "Brazil": "🇧🇷",
    "Italy": "🇮🇹",
    "France": "🇫🇷",
    "Japan": "🇯🇵",
    "United Kingdom": "🇬🇧",
    "China": "🇨🇳",
    "South Korea": "🇰🇷",
    "Spain": "🇪🇸",
    "Portugal": "🇵🇹",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺"
};

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function ItemsFilter({
    filters,
    onChange,
    availableFacets,
    useNameAsValue = false,
    lockedFilters = {},
    searchQuery,
    onSearchChange,
    children,
    className = ''
}: ItemsFilterProps) {
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [brandSearch, setBrandSearch] = useState('');
    const [nationalitySearch, setNationalitySearch] = useState('');

    const [options, setOptions] = useState<FilterOptions>({
        brands: [],
        subcategory1: [],
        subcategory2: [],
        subcategory3: [],
        apparelTypes: [],
        styles: [],
        patterns: [],
        fits: [],
        genders: [],
        materials: [],
        colors: [],
        sizes: [],
        nationalities: [],
        brandLines: [],
        brandCollections: [],
        years: [],
        months: [],
        days: []
    });

    const [tierLabels, setTierLabels] = useState<Record<string, string>>({
        'subcategory-1': 'Department',
        'subcategory-2': 'Category',
        'subcategory-3': 'Subcategory',
        'apparel': 'Item'
    });

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        brands: false,
        nationality: false,
        nationalities: false, // Added for consistency
        brandLines: false,
        brandCollections: false,
        apparel: false,
        gender: false,
        genders: false, // Added for consistency
        colors: false,
        releaseDate: false,
        fits: false,
        styles: false,
        sizes: false,
        patterns: false,
        materials: false,
        years: false,
        months: false,
        days: false,
        headerSub1: false,
        headerSub2: false,
        headerSub3: false,
        headerApparel: false,
        headerNationality: false,
        headerBrand: false,
        headerLine: false,
        condition: false,
        price: false
    });

    const [categoryNameMap, setCategoryNameMap] = useState<Record<string, string>>({});

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const fetchFilterOptions = useCallback(async () => {
        try {
            const [
                brandsRes,
                categoriesData,
                stylesRes,
                patternsRes,
                fitsRes,
                gendersRes,
                materialsRes,
                colorsRes,
                sizesRes,
                releaseDateOptions,
                nationalitiesRes
            ] = await Promise.all([
                brandApi.getBrands({ limit: 50, businessType: 'brand' }),
                vufsApi.getCategories(),
                vufsApi.getAttributeValues('style'),
                vufsApi.getPatterns(),
                vufsApi.getFits(),
                vufsApi.getGenders(),
                vufsApi.getMaterials(),
                vufsApi.getColors(),
                vufsApi.getSizes(),
                skuApi.getReleaseDateOptions(),
                brandApi.getNationalities()
            ]);

            // Update tier labels from fetched data
            if (categoriesData.tierLabels) {
                const newLabels = { ...tierLabels };
                Object.entries(categoriesData.tierLabels).forEach(([slug, name]) => {
                    let val = name as string;
                    if (slug === 'subcategory-1' && (val === 'Subcategory 1' || !val)) val = 'Department';
                    if (slug === 'subcategory-2' && (val === 'Subcategory 2' || !val)) val = 'Category';
                    if (slug === 'subcategory-3' && (val === 'Subcategory 3' || !val)) val = 'Subcategory';
                    if (slug === 'apparel' && (val === 'Apparel' || val === 'Item' || !val)) val = 'Item';
                    newLabels[slug] = val;
                });
                setTierLabels(newLabels);
            }

            const sortByName = (a: any, b: any) => (a.name || '').localeCompare(b.name || '');
            const allCats = categoriesData.categories || [];

            // Build category name map for ID -> Name resolution
            const nameMap: Record<string, string> = {};
            allCats.forEach((c: any) => {
                nameMap[c.id] = c.name;
            });
            setCategoryNameMap(nameMap);

            setOptions(prev => ({
                ...prev,
                brands: (brandsRes || []).sort(sortByName),
                subcategory1: allCats.filter((c: any) => c.level === 'page').sort(sortByName),
                subcategory2: allCats.filter((c: any) => c.level === 'blue').sort(sortByName),
                subcategory3: allCats.filter((c: any) => c.level === 'white').sort(sortByName),
                apparelTypes: allCats.filter((c: any) => c.level === 'gray').sort(sortByName),
                styles: (stylesRes || []).sort(sortByName),
                patterns: (patternsRes || []).sort(sortByName),
                fits: (fitsRes || []).sort(sortByName),
                genders: (gendersRes || []).sort(sortByName),
                materials: (materialsRes || []).sort(sortByName),
                colors: (colorsRes || []).sort(sortByName),
                sizes: (sizesRes || []),
                nationalities: (nationalitiesRes || []).sort(),
                years: releaseDateOptions.years || [],
                months: releaseDateOptions.months || [],
                days: releaseDateOptions.days || []
            }));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching filter options:', error);
            setLoading(false);
        }
    }, [tierLabels]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);


    // Dynamic Brand Options (Lines & Collections)
    useEffect(() => {
        const fetchDynamicOptions = async () => {
            const effectiveBrandId = lockedFilters.brandId || filters.brandId;

            if (effectiveBrandId) {
                const brandIds = effectiveBrandId.split(',');
                try {
                    const [lines, collections] = await Promise.all([
                        brandApi.getBrandsLines(brandIds),
                        brandApi.getBrandsCollections(brandIds)
                    ]);
                    setOptions(prev => ({
                        ...prev,
                        brandLines: lines,
                        brandCollections: collections
                    }));
                } catch (error) {
                    console.error('Error fetching dynamic brand options:', error);
                }
            } else {
                setOptions(prev => ({
                    ...prev,
                    brandLines: [],
                    brandCollections: []
                }));
            }
        };

        fetchDynamicOptions();
    }, [filters.brandId, lockedFilters.brandId]);

    // Helper to check if an option should be shown based on available facets
    const shouldShowOption = (key: keyof AvailableFacets, value: string | any) => {
        if (!availableFacets) return true;
        const available = availableFacets[key];

        // If facet type not provided in availableFacets, show all (backward compat)
        // CRITICAL FIX: Ensure we treat empty arrays as "no restrictions" if that was the intent, 
        // OR only hide if we are sure the user has 0 items of that type.
        // For now, if 'available' is undefined, we return true.
        if (!available) return true;

        // If available is empty array, it might mean "no items in wardrobe have this property".
        // In that case, we should probably hide it. BUT, if the data extraction is flaky,
        // we might hide valid options.
        // Let's assume if available is present but length 0, it means "none available".
        // However, user complained filters disappeared. 
        // Let's stick to: if available has items, strict check. If empty, maybe let it pass?
        // No, if empty, it means we have no metadata for it. 

        // Let's make the matching looser for strings
        const valueToCheck = typeof value === 'string'
            ? value
            : (value.brandInfo?.name || value.brand || value.name || value.label || value.value || value.id);

        if (!valueToCheck) return true;

        const match = available.some(av => {
            if (!av) return false;
            const avLower = String(av).toLowerCase();
            const valLower = String(valueToCheck).toLowerCase();
            // Check exact string, ID, or partial match for safety
            return avLower === valLower || (value.id && avLower === String(value.id).toLowerCase());
        });
        return match;
    };

    const getFilteredOptions = (key: keyof AvailableFacets, allOptions: any[]) => {
        if (!availableFacets) return allOptions;
        const filtered = allOptions.filter(opt => shouldShowOption(key, opt));
        return filtered;
    };

    const [filteredBrandOptions, setFilteredBrandOptions] = useState<any[]>([]);

    useEffect(() => {
        setFilteredBrandOptions(options.brands);
    }, [options.brands]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (lockedFilters.brandId) return; // Don't allow searching if brand is locked

            try {
                const res = await brandApi.getBrands({
                    limit: 50,
                    search: brandSearch || undefined,
                    country: filters.nationality || undefined,
                    businessType: 'brand'
                });
                setFilteredBrandOptions(res);
            } catch (error) {
                console.error('Failed to fetch filtered brands:', error);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [brandSearch, filters.nationality, lockedFilters.brandId]);


    const handleFilterChange = (key: keyof ItemsFilters, value: string | undefined) => {
        if (lockedFilters[key] !== undefined) return;

        onChange((prev: ItemsFilters) => {
            const next = { ...prev };

            if (value === undefined || value === '') {
                delete next[key];

                // Close dropdown
                if (key === 'subcategory1Id') setExpandedGroups(p => ({ ...p, headerSub1: false }));
                if (key === 'subcategory2Id') setExpandedGroups(p => ({ ...p, headerSub2: false }));
                if (key === 'subcategory3Id') setExpandedGroups(p => ({ ...p, headerSub3: false }));
                if (key === 'apparelId') setExpandedGroups(p => ({ ...p, headerApparel: false }));
                if (key === 'nationality') setExpandedGroups(p => ({ ...p, headerNationality: false }));
                if (key === 'brandId') setExpandedGroups(p => ({ ...p, headerBrand: false }));
                if (key === 'lineId') setExpandedGroups(p => ({ ...p, headerLine: false }));
                if (key === 'collection') setExpandedGroups(p => ({ ...p, headerCollection: false }));
            } else {
                next[key] = value;
            }
            return next;
        });
    };

    const handleMultiFilterChange = (key: keyof ItemsFilters, value: string) => {
        if (lockedFilters[key] !== undefined) return;

        onChange((prev: ItemsFilters) => {
            const current = prev[key] || '';
            const currentValues = current ? current.split(',') : [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            const next = { ...prev };
            if (newValues.length > 0) {
                next[key] = newValues.join(',');
            } else {
                delete next[key];
            }
            return next;
        });
    };

    const getFilteredNationalities = () => {
        const validNationalities = options.nationalities.filter(n => n && n.trim() !== '');
        // Apply facet filtering if available
        const contextAwareNationalities = validNationalities.filter(nat => shouldShowOption('nationalities', nat));

        if (!nationalitySearch) return contextAwareNationalities;
        return contextAwareNationalities.filter(nat =>
            nat.toLowerCase().includes(nationalitySearch.toLowerCase())
        );
    };

    const FilterSection = ({ title, groupKey, items, filterKey, icon: Icon, labelKey = 'name', idKey = 'id' }: any) => {
        // Map filterKey to facetKey for filtering
        let facetKey: keyof AvailableFacets | undefined;
        if (filterKey === 'genderId') facetKey = 'genders';
        else if (filterKey === 'sizeId') facetKey = 'sizes';
        else if (filterKey === 'colorId') facetKey = 'colors';
        else if (filterKey === 'styleId') facetKey = 'styles';
        else if (filterKey === 'patternId') facetKey = 'patterns';
        else if (filterKey === 'materialId') facetKey = 'materials';
        else if (filterKey === 'fitId') facetKey = 'fits';

        const visibleItems = items.filter((item: any) => {
            if (facetKey) {
                return shouldShowOption(facetKey, item);
            }
            return true;
        });

        // Hide section if no items are visible and no filters are selected
        const filterVal = filters[filterKey as keyof ItemsFilters] as string;
        const selectedValues = filterVal ? filterVal.split(',') : [];

        if (visibleItems.length === 0 && selectedValues.length === 0 && availableFacets) {
            return null;
        }

        return (
            <div className="py-4 border-b border-gray-50 last:border-0">
                <button
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center justify-between w-full text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider group"
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />}
                        {title}
                        {selectedValues.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-gray-900 text-white rounded-full">
                                {selectedValues.length}
                            </span>
                        )}
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedGroups[groupKey] ? '' : '-rotate-90'}`} />
                </button>
                {expandedGroups[groupKey] && (
                    <div className="space-y-1 mt-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {visibleItems.map((item: any) => {
                            const isString = typeof item === 'string';
                            const id = isString ? item : (useNameAsValue ? item[labelKey] : item[idKey]);
                            const label = isString ? item : item[labelKey];
                            const isSelected = selectedValues.includes(String(id));
                            const image = !isString ? (item.logo || item.swatchUrl || item.iconUrl || item.coverImageUrl || item.cover_image_url) : null;
                            const color = !isString ? item.hex : null;
                            const flag = countryFlags[label];

                            let fallbackIcon = null;
                            if (!image && !color) {
                                if (filterKey === 'apparelId' || filterKey === 'styleId') {
                                    fallbackIcon = <ApparelIcon name={label} className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />;
                                } else if (filterKey === 'genderId') {
                                    const GenderIcon = getGenderIcon(label);
                                    fallbackIcon = <GenderIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />;
                                } else if (filterKey === 'patternId') {
                                    const PatternIcon = getPatternIcon(label);
                                    fallbackIcon = <PatternIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />;
                                }
                            }

                            return (
                                <button
                                    key={id}
                                    onClick={() => handleMultiFilterChange(filterKey as keyof ItemsFilters, id)}
                                    className={`flex items-center w-full px-2 py-1.5 rounded-md text-sm transition-colors ${isSelected
                                        ? 'bg-gray-900 text-white font-semibold shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-md mr-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-gray-900' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-grow min-w-0">
                                        {image ? (
                                            <div className="h-5 w-5 rounded-md overflow-hidden flex-shrink-0 bg-white border border-gray-100 flex items-center justify-center p-0.5">
                                                <img src={getImageUrl(image)} alt="" className="h-full w-full object-contain" />
                                            </div>
                                        ) : color ? (
                                            <div
                                                className="h-4 w-4 rounded-full flex-shrink-0 border border-gray-200 shadow-sm"
                                                style={{ backgroundColor: color }}
                                            />
                                        ) : flag ? (
                                            <span className="text-lg leading-none">{flag}</span>
                                        ) : fallbackIcon ? (
                                            <div className={`h-5 w-5 flex items-center justify-center flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                {fallbackIcon}
                                            </div>
                                        ) : null}
                                        <span className="truncate">{label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-white ${className}`}>
            {/* Top Bar Dropdowns */}
            <div className="bg-white sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Subcategory 1-3 & Apparel (Item) Dropdowns */}
                        {[
                            { key: 'subcategory1Id' as keyof ItemsFilters, label: tierLabels['subcategory-1'], header: 'headerSub1', options: getFilteredOptions('departments', options.subcategory1), facetKey: 'departments' },
                            { key: 'subcategory2Id' as keyof ItemsFilters, label: tierLabels['subcategory-2'], header: 'headerSub2', options: getFilteredOptions('categories', options.subcategory2), parentKey: 'subcategory1Id', facetKey: 'categories' },
                            { key: 'subcategory3Id' as keyof ItemsFilters, label: tierLabels['subcategory-3'], header: 'headerSub3', options: getFilteredOptions('subcategories', options.subcategory3), parentKey: 'subcategory2Id', facetKey: 'subcategories' },
                            { key: 'apparelId' as keyof ItemsFilters, label: tierLabels['apparel'], header: 'headerApparel', options: getFilteredOptions('apparelTypes', options.apparelTypes), parentKey: 'subcategory3Id', facetKey: 'apparelTypes' }
                        ].map((dropdown) => {
                            const filteredOptions = dropdown.options.filter(opt => {
                                if (!dropdown.parentKey || !filters[dropdown.parentKey]) return true;
                                const parentVal = filters[dropdown.parentKey] as string;
                                const selectedValues = parentVal ? parentVal.split(',') : [];

                                if (useNameAsValue) {
                                    // If using names, resolve opt.parentId to a name to check against selection
                                    const parentName = categoryNameMap[opt.parentId || ''];
                                    return selectedValues.includes(parentName);
                                }

                                return selectedValues.includes(opt.parentId || '');
                            });

                            // ALWAYS show certain dropdowns as requested
                            const alwaysShowKeys = ['subcategory1Id', 'subcategory2Id', 'subcategory3Id', 'apparelId'];
                            const isAlwaysShow = alwaysShowKeys.includes(dropdown.key as string);

                            // Hide if no options and not selected, ONLY if it's NOT a forced-show dropdown
                            if (!isAlwaysShow && filteredOptions.length === 0 && !filters[dropdown.key] && availableFacets && availableFacets.departments && availableFacets.departments.length > 0) {
                                if (availableFacets[dropdown.facetKey as keyof AvailableFacets]) {
                                    return null;
                                }
                            }

                            const val = filters[dropdown.key] as string;
                            const selectedCount = val ? val.split(',').length : 0;
                            const isDropdownExpanded = expandedGroups[dropdown.header];

                            return (
                                <div
                                    key={dropdown.key}
                                    className="relative group/filter"
                                    onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, [dropdown.header]: true }))}
                                    onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, [dropdown.header]: false }))}
                                >
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters[dropdown.key]
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span>{filters[dropdown.key] ? `${(filters[dropdown.key] as string).split(',').length} Selected` : dropdown.label}</span>
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                    {expandedGroups[dropdown.header] && (
                                        <>
                                            <div className="absolute top-full left-0 w-full h-2 z-40" />
                                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-40 max-h-96 overflow-y-auto custom-scrollbar p-1">
                                                <button
                                                    onClick={() => handleFilterChange(dropdown.key, undefined)}
                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
                                                >
                                                    All {dropdown.label}s
                                                </button>
                                                {filteredOptions.map(opt => {
                                                    const val = useNameAsValue ? opt.name : opt.id;
                                                    const isSelected = (filters[dropdown.key] as string)?.split(',').includes(val);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleMultiFilterChange(dropdown.key, val)}
                                                            className={`w-full px-4 py-2.5 text-left text-sm rounded-lg hover:bg-gray-50 ${isSelected ? 'bg-gray-100 font-bold' : ''}`}
                                                        >
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-2">
                                                                    {dropdown.key === 'apparelId' && (
                                                                        <ApparelIcon name={opt.name} className={`h-4 w-4 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`} />
                                                                    )}
                                                                    <span className="truncate">{opt.name}</span>
                                                                </div>
                                                                {isSelected && <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}

                        {/* Nationality & Brand also in Top Bar */}
                        {(() => {
                            const filteredNationalities = getFilteredNationalities();
                            if (filteredNationalities.length === 0 && !filters.nationality && availableFacets) return null;
                            return (
                                <div
                                    className="relative group/filter"
                                    onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerNationality: true }))}
                                    onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerNationality: false }))}
                                >
                                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.nationality ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                        <span>Nationality</span>
                                        {filters.nationality && <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">{filters.nationality.split(',').length}</span>}
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                    {expandedGroups.headerNationality && (
                                        <>
                                            <div className="absolute top-full left-0 w-full h-2 z-40" />
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl z-40 max-h-96 flex flex-col">
                                                <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
                                                    <div className="relative">
                                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search nationality..."
                                                            value={nationalitySearch}
                                                            onChange={(e) => setNationalitySearch(e.target.value)}
                                                            className="w-full bg-gray-50 border-none rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-gray-900"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto custom-scrollbar p-1">
                                                    {filteredNationalities.map(nat => {
                                                        const isSelected = (filters.nationality?.split(',') || []).includes(nat);
                                                        return (
                                                            <button key={nat} onClick={() => handleMultiFilterChange('nationality', nat)} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                                </div>
                                                                <span className="text-xl leading-none">{countryFlags[nat]}</span>
                                                                <span>{nat}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {(() => {
                            const brandsWithFacets = filteredBrandOptions.filter(brand => shouldShowOption('brands', brand));
                            if (!lockedFilters.brandId && brandsWithFacets.length === 0 && !filters.brandId && availableFacets) return null;
                            if (lockedFilters.brandId) return null;

                            return (
                                <div
                                    className="relative group/filter"
                                    onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerBrand: true }))}
                                    onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerBrand: false }))}
                                >
                                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.brandId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                        <span>Brand</span>
                                        {filters.brandId && <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">{filters.brandId.split(',').length}</span>}
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                    {expandedGroups.headerBrand && (
                                        <>
                                            <div className="absolute top-full left-0 w-full h-2 z-40" />
                                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-40 max-h-96 flex flex-col">
                                                <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
                                                    <div className="relative">
                                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search brands..."
                                                            value={brandSearch}
                                                            onChange={(e) => setBrandSearch(e.target.value)}
                                                            className="w-full bg-gray-50 border-none rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-gray-900"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto custom-scrollbar p-1">
                                                    {brandsWithFacets.map((brand: any) => {
                                                        const brandVal = useNameAsValue ? (brand.brandInfo?.name || brand.name) : brand.id;
                                                        const isSelected = filters.brandId?.split(',').includes(brandVal);
                                                        return (
                                                            <button key={brand.id} onClick={() => handleMultiFilterChange('brandId', brandVal)} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                                </div>
                                                                {brand.brandInfo?.logo ? <img src={brand.brandInfo.logo} alt="" className="h-6 w-6 rounded object-contain bg-gray-50 p-0.5" /> : <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold">{(brand.brandInfo?.name || brand.name || "??").substring(0, 2)}</div>}
                                                                <span className="truncate">{brand.brandInfo?.name || brand.name}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Brand Line Dropdown */}
                        {options.brandLines.length > 0 && (
                            <div
                                className="relative group/filter"
                                onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerLine: true }))}
                                onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerLine: false }))}
                            >
                                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.lineId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    <span>Line</span>
                                    {filters.lineId && <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">{filters.lineId.split(',').length}</span>}
                                    <ChevronDownIcon className="h-4 w-4" />
                                </button>
                                {expandedGroups.headerLine && (
                                    <>
                                        <div className="absolute top-full left-0 w-full h-2 z-40" />
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto custom-scrollbar p-1">
                                            {options.brandLines.map((line: any) => {
                                                const isSelected = (filters.lineId?.split(',') || []).includes(line.id);
                                                return (
                                                    <button key={line.id} onClick={() => handleMultiFilterChange('lineId', line.id)} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                        </div>
                                                        {line.logo && <img src={line.logo} alt="" className="h-6 w-6 rounded object-contain" />}
                                                        <span className="truncate">{line.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Collection Dropdown */}
                        {options.brandCollections.length > 0 && (
                            <div
                                className="relative group/filter"
                                onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerCollection: true }))}
                                onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerCollection: false }))}
                            >
                                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.collection ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    <span>Collection</span>
                                    {filters.collection && <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">{filters.collection.split(',').length}</span>}
                                    <ChevronDownIcon className="h-4 w-4" />
                                </button>
                                {expandedGroups.headerCollection && (
                                    <>
                                        <div className="absolute top-full left-0 w-full h-2 z-40" />
                                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto custom-scrollbar p-1">
                                            {options.brandCollections.map((col: any) => {
                                                const isSelected = (filters.collection?.split(',') || []).includes(col.name);
                                                const image = col.coverImageUrl || col.cover_image_url;
                                                return (
                                                    <button key={col.id} onClick={() => handleMultiFilterChange('collection', col.name)} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                        </div>
                                                        {image && <img src={getImageUrl(image)} alt="" className="h-6 w-6 rounded object-cover" />}
                                                        <span className="truncate">{col.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Condition Dropdown (Marketplace) */}
                        {availableFacets?.conditions && availableFacets.conditions.length > 0 && (
                            <div
                                className="relative group/filter"
                                onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerCondition: true }))}
                                onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerCondition: false }))}
                            >
                                <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filters.condition ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    <span>Condition</span>
                                    {filters.condition && <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">{filters.condition.split(',').length}</span>}
                                    <ChevronDownIcon className="h-4 w-4" />
                                </button>
                                {expandedGroups.headerCondition && (
                                    <>
                                        <div className="absolute top-full left-0 w-full h-2 z-40" />
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-40 max-h-64 overflow-y-auto custom-scrollbar p-1">
                                            {availableFacets.conditions.map((cond: string) => {
                                                const isSelected = (filters.condition?.split(',') || []).includes(cond);
                                                // Map condition codes to nice labels if needed, or assume they are passed as {value, label} or just strings
                                                // For now assuming strings as per availableFacets interface, but let's handle the mapping if we can
                                                const conditionLabels: Record<string, string> = {
                                                    new: 'New with Tags',
                                                    dswt: 'Deadstock',
                                                    never_used: 'Never Used',
                                                    excellent: 'Excellent',
                                                    good: 'Good',
                                                    fair: 'Fair',
                                                    poor: 'Poor'
                                                };
                                                const label = conditionLabels[cond] || cond;

                                                return (
                                                    <button key={cond} onClick={() => handleMultiFilterChange('condition', cond)} className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                        </div>
                                                        <span className="truncate">{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Sort Sort Dropdown */}
                        {availableFacets?.conditions && ( // HACK: reusing conditions presence to imply marketplace mode for now, or just show if sortBy is supported
                            <div className="relative group/filter">
                                <select
                                    value={filters.sortBy || ''}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="px-4 py-2 bg-gray-100 border-0 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-gray-900 cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    <option value="">Sort: Newest</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="most_watched">Most Popular</option>
                                </select>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="flex-grow flex items-center justify-end">
                            {onSearchChange && (
                                <div className="relative max-w-md w-full">
                                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search pieces, brands, codes..."
                                        value={searchQuery || ''}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-gray-900 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <button onClick={() => setShowMobileFilters(true)} className="lg:hidden p-3 bg-gray-100 rounded-xl">
                            <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-900" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-70 flex-shrink-0">
                        <div className="sticky top-20 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 custom-scrollbar">
                            <div className="flex items-center justify-end mb-2">
                                {Object.keys(filters).some(key => {
                                    const value = filters[key as keyof ItemsFilters];
                                    return value !== undefined && value !== '' && !lockedFilters[key as keyof ItemsFilters];
                                }) && (
                                        <button
                                            onClick={() => {
                                                const clearedFilters = { ...filters };
                                                Object.keys(clearedFilters).forEach(key => {
                                                    if (!lockedFilters[key as keyof ItemsFilters]) {
                                                        delete clearedFilters[key as keyof ItemsFilters];
                                                    }
                                                });
                                                onChange(clearedFilters);
                                            }}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                            </div>

                            {/* Categories in Sidebar too? Screenshot shows them */}
                            <FilterSection title="Genders" groupKey="gender" items={options.genders} filterKey="genderId" icon={UsersIcon} />



                            {(() => {
                                const visibleYears = options.years.filter(y => shouldShowOption('years', y.toString()));
                                if (visibleYears.length === 0 && !filters.years && availableFacets) return null;

                                return (
                                    <div className="py-4 border-b border-gray-50">
                                        <button
                                            onClick={() => toggleGroup('releaseDate')}
                                            className="flex items-center justify-between w-full text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                                Release Dates
                                            </div>
                                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedGroups.releaseDate ? '' : '-rotate-90'}`} />
                                        </button>
                                        {expandedGroups.releaseDate && (
                                            <div className="space-y-4 mt-4 pl-6">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Years</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {visibleYears.map(year => {
                                                            const isSelected = (filters.years?.split(',') || []).includes(year.toString());
                                                            return (
                                                                <button key={year} onClick={() => handleMultiFilterChange('years', year.toString())} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isSelected ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-transparent text-gray-600'}`}>{year}</button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                {(filters.years || availableFacets) && (
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Months</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {options.months
                                                                .filter(m => shouldShowOption('months', m.toString()))
                                                                .map(month => {
                                                                    const isSelected = (filters.months?.split(',') || []).includes(month.toString());
                                                                    return (
                                                                        <button key={month} onClick={() => handleMultiFilterChange('months', month.toString())} className={`px-3 py-1.5 rounded-lg text-xs font-bold border truncate text-left ${isSelected ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-transparent text-gray-600'}`}>{monthNames[month - 1]}</button>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <FilterSection title="Sizes" groupKey="sizes" items={options.sizes} filterKey="sizeId" icon={QueueListIcon} />
                            <FilterSection title="Colors" groupKey="colors" items={options.colors} filterKey="colorId" icon={SwatchIcon} />
                            <FilterSection title="Styles" groupKey="styles" items={options.styles} filterKey="styleId" icon={TagIcon} />
                            <FilterSection title="Patterns" groupKey="patterns" items={options.patterns} filterKey="patternId" icon={SparklesIcon} />
                            <FilterSection title="Materials" groupKey="materials" items={options.materials} filterKey="materialId" icon={VariableIcon} />
                            <FilterSection title="Fits" groupKey="fits" items={options.fits} filterKey="fitId" icon={ArrowsPointingOutIcon} />

                            {/* Price Range (Sidebar) */}
                            {availableFacets?.conditions && ( // Showing for marketplace
                                <div className="py-4 border-b border-gray-50">
                                    <button
                                        onClick={() => toggleGroup('price')}
                                        className="flex items-center justify-between w-full text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <TagIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                            Price Range
                                        </div>
                                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedGroups.price ? '' : '-rotate-90'}`} />
                                    </button>
                                    {expandedGroups.price && (
                                        <div className="mt-2 text-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={filters.minPrice || ''}
                                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                                                    />
                                                </div>
                                                <span className="text-gray-400">-</span>
                                                <div className="relative flex-1">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={filters.maxPrice || ''}
                                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                                        className="w-full pl-6 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-1 focus:ring-gray-900"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    <main className="flex-grow">
                        {children}
                    </main>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                    <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-black uppercase tracking-tight">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2"><XMarkIcon className="h-6 w-6 text-gray-900" /></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="space-y-4">
                                <FilterSection title="Genders" groupKey="gender" items={options.genders} filterKey="genderId" icon={UsersIcon} />
                                <FilterSection title="Sizes" groupKey="sizes" items={options.sizes} filterKey="sizeId" icon={QueueListIcon} />
                                <FilterSection title="Styles" groupKey="styles" items={options.styles} filterKey="styleId" icon={TagIcon} />
                                <FilterSection title="Brand Nationality" groupKey="nationalities" items={options.nationalities} filterKey="nationality" icon={CalendarIcon} labelKey="name" idKey="name" />
                                <FilterSection title="Colors" groupKey="colors" items={options.colors} filterKey="colorId" icon={SwatchIcon} />
                                <FilterSection title="Materials" groupKey="materials" items={options.materials} filterKey="materialId" icon={VariableIcon} />
                                <FilterSection title="Patterns" groupKey="patterns" items={options.patterns} filterKey="patternId" icon={SparklesIcon} />
                                <FilterSection title="Fits" groupKey="fits" items={options.fits} filterKey="fitId" icon={ArrowsPointingOutIcon} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button onClick={() => setShowMobileFilters(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">Show Results</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}</style>
        </div>
    );
}
