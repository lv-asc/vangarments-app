'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { skuApi, SKUItem } from '@/lib/skuApi';
import { vufsApi, VUFSAttributeValue, VUFSBrand, VUFSColor, VUFSMaterial, VUFSSize } from '@/lib/vufsApi';
import SKUCard from '@/components/ui/SKUCard';
import {
    ShoppingBagIcon,
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
    QueueListIcon
} from '@heroicons/react/24/outline';
import { brandApi } from '@/lib/brandApi';
import { ApparelIcon, getPatternIcon, getGenderIcon } from '@/components/ui/ApparelIcons';

interface Filters {
    brandId?: string;
    styleId?: string;
    patternId?: string;
    fitId?: string;
    genderId?: string;
    apparelId?: string;
    materialId?: string;
    sizeId?: string;
    lineId?: string;
    collection?: string;
    nationality?: string;
    years?: string;
    months?: string;
    days?: string;
}

export default function ItemsPageClient() {
    const [skus, setSkus] = useState<SKUItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<Filters>({});
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filter Options
    const [options, setOptions] = useState({
        brands: [] as any[],
        apparelTypes: [] as VUFSAttributeValue[],
        styles: [] as VUFSAttributeValue[],
        patterns: [] as any[],
        fits: [] as any[],
        genders: [] as any[],
        materials: [] as VUFSMaterial[],
        colors: [] as VUFSColor[],
        sizes: [] as VUFSSize[],
        nationalities: [] as string[],
        brandLines: [] as any[],
        brandCollections: [] as any[],
        years: [] as number[],
        months: [] as number[],
        days: [] as number[]
    });

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        brands: true,
        nationality: false,
        brandLines: true,
        brandCollections: true,
        apparel: true,
        gender: true,
        releaseDate: false
    });

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const fetchFilterOptions = useCallback(async () => {
        try {
            const [
                brandsRes,
                apparelRes,
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
                brandApi.getBrands({ limit: 50, businessType: 'brand' }), // Real brand accounts
                vufsApi.getAttributeValues('apparel'),
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

            const sortByName = (a: any, b: any) => (a.name || '').localeCompare(b.name || '');

            setOptions({
                brands: (brandsRes || []).sort(sortByName),
                brandLines: [],
                brandCollections: [],
                apparelTypes: (apparelRes || []).sort(sortByName),
                styles: (stylesRes || []).sort(sortByName),
                patterns: (patternsRes || []).sort(sortByName),
                fits: (fitsRes || []).sort(sortByName),
                genders: (gendersRes || []).sort(sortByName),
                materials: (materialsRes || []).sort(sortByName),
                colors: (colorsRes || []).sort(sortByName),
                sizes: (sizesRes || []).sort((a, b) => {
                    // Custom sort for sizes might be better, but alphabetical for now
                    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                }),
                nationalities: (nationalitiesRes || []).sort(),
                years: releaseDateOptions.years || [],
                months: releaseDateOptions.months || [],
                days: releaseDateOptions.days || []
            });
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    }, []);

    const fetchSKUs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await skuApi.searchSKUs(searchQuery, {
                ...filters,
                limit: 50,
                parentsOnly: true
            });
            setSkus(response.skus || []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSKUs();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchSKUs]);

    // Fetch dynamic lines and collections when brands are selected
    useEffect(() => {
        const fetchDynamicOptions = async () => {
            if (filters.brandId) {
                const brandIds = filters.brandId.split(',');
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
                // Clear filters if brands are removed
                if (filters.lineId || filters.collection) {
                    setFilters(prev => ({
                        ...prev,
                        lineId: undefined,
                        collection: undefined
                    }));
                }
            }
        };

        fetchDynamicOptions();
    }, [filters.brandId]);

    const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key] === value ? undefined : value
        }));
    };

    const handleMultiFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => {
            const current = (prev[key] as string) || '';
            const values = current ? current.split(',') : [];
            const newValues = values.includes(value)
                ? values.filter(v => v !== value)
                : [...values, value];

            return {
                ...prev,
                [key]: newValues.length > 0 ? newValues.join(',') : undefined
            };
        });
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    const FilterSection = ({ title, groupKey, items, filterKey, icon: Icon, labelKey = 'name', idKey = 'id' }: any) => {
        const isExpanded = expandedGroups[groupKey];
        const selectedValues = (filters[filterKey as keyof Filters] as string)?.split(',') || [];

        return (
            <div className="border-b border-gray-100 py-4">
                <button
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center justify-between w-full text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider group"
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />}
                        {title}
                        {selectedValues.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-gray-900 text-white rounded-full font-bold">
                                {selectedValues.length}
                            </span>
                        )}
                    </div>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
                {isExpanded && (
                    <div className="space-y-1 mt-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item: any) => {
                            const id = item[idKey];
                            const label = item[labelKey];
                            const isSelected = selectedValues.includes(id);
                            const image = item.logo || item.swatchUrl || item.iconUrl || item.coverImageUrl || item.cover_image_url;
                            const color = item.hex;
                            const flag = countryFlags[label]; // Check for flag if it's a nationality

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
                                    onClick={() => handleMultiFilterChange(filterKey as keyof Filters, id)}
                                    className={`flex items-center w-full px-2 py-1.5 rounded-md text-sm transition-colors ${isSelected
                                        ? 'bg-gray-900 text-white font-semibold shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left'
                                        }`}
                                >
                                    {/* Checkbox indicator */}
                                    <div className={`w-4 h-4 rounded border mr-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-gray-300'}`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-grow min-w-0">
                                        {image ? (
                                            <div className="h-5 w-5 rounded-md overflow-hidden flex-shrink-0 bg-white border border-gray-100 flex items-center justify-center p-0.5">
                                                <img src={image} alt="" className="h-full w-full object-contain" />
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

    const [brandSearch, setBrandSearch] = useState('');
    const [nationalitySearch, setNationalitySearch] = useState('');

    const countryFlags: Record<string, string> = {
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

    const [filteredBrandOptions, setFilteredBrandOptions] = useState<any[]>([]);

    // Initialize filtered options with initial loaded brands
    useEffect(() => {
        setFilteredBrandOptions(options.brands);
    }, [options.brands]);

    // Fetch brands dynamically when search or nationality filter changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // If no search and no nationality, we can fall back to initial options or fetch default
                // But robust way is to always fetch based on current criteria
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
    }, [brandSearch, filters.nationality]);

    const getFilteredNationalities = () => {
        // Filter out blank/null values first
        const validNationalities = options.nationalities.filter(n => n && n.trim() !== '');

        if (!nationalitySearch) return validNationalities;
        return validNationalities.filter(nat =>
            nat.toLowerCase().includes(nationalitySearch.toLowerCase())
        );
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Brand Filters Header */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                        {/* Brand Filter Dropdowns */}
                        <div className="flex flex-wrap items-start gap-10 flex-grow">
                            {/* Nationality Dropdown */}
                            <div
                                className="relative group/filter"
                                onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerNationality: true }))}
                                onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerNationality: false }))}
                            >
                                <button
                                    onClick={() => toggleGroup('headerNationality')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.nationality
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    <span>Nationality</span>
                                    {filters.nationality && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">
                                            {filters.nationality.split(',').length}
                                        </span>
                                    )}
                                    <ChevronDownIcon className="h-4 w-4" />
                                </button>
                                {expandedGroups.headerNationality && (
                                    <>
                                        {/* Hover bridge to prevent closing on gap */}
                                        <div className="absolute top-full left-0 w-full h-2 z-40" />
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-40 max-h-96 flex flex-col">
                                            <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search nationality..."
                                                        value={nationalitySearch}
                                                        onChange={(e) => setNationalitySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full bg-gray-50 border-none rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-gray-900"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto custom-scrollbar p-1">
                                                {getFilteredNationalities().map(nat => {
                                                    const isSelected = (filters.nationality?.split(',') || []).includes(nat);
                                                    return (
                                                        <button
                                                            key={nat}
                                                            onClick={() => handleMultiFilterChange('nationality', nat)}
                                                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                                {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                            </div>
                                                            <span className="text-xl leading-none">{countryFlags[nat]}</span>
                                                            <span>{nat}</span>
                                                        </button>
                                                    );
                                                })}
                                                {getFilteredNationalities().length === 0 && (
                                                    <div className="p-4 text-center text-sm text-gray-500">
                                                        No results found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Brand Dropdown */}
                            <div
                                className="relative group/filter"
                                onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerBrand: true }))}
                                onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerBrand: false }))}
                            >
                                <button
                                    onClick={() => toggleGroup('headerBrand')}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.brandId
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    <span>Brand</span>
                                    {filters.brandId && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">
                                            {filters.brandId.split(',').length}
                                        </span>
                                    )}
                                    <ChevronDownIcon className="h-4 w-4" />
                                </button>
                                {expandedGroups.headerBrand && (
                                    <>
                                        {/* Hover bridge to prevent closing on gap */}
                                        <div className="absolute top-full left-0 w-full h-2 z-40" />
                                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-40 max-h-96 flex flex-col">
                                            <div className="p-3 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search brands..."
                                                        value={brandSearch}
                                                        onChange={(e) => setBrandSearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full bg-gray-50 border-none rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-1 focus:ring-gray-900"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto custom-scrollbar p-1">
                                                {(() => {
                                                    const selectedIds = filters.brandId?.split(',') || [];
                                                    const sortedBrands = [...filteredBrandOptions].sort((a, b) => {
                                                        const aSelected = selectedIds.includes(a.id);
                                                        const bSelected = selectedIds.includes(b.id);
                                                        if (aSelected && !bSelected) return -1;
                                                        if (!aSelected && bSelected) return 1;
                                                        const nameA = a.brandInfo?.name || a.name || '';
                                                        const nameB = b.brandInfo?.name || b.name || '';
                                                        return nameA.localeCompare(nameB);
                                                    });

                                                    return sortedBrands.map((brand: any) => {
                                                        const isSelected = selectedIds.includes(brand.id);
                                                        return (
                                                            <button
                                                                key={brand.id}
                                                                onClick={() => handleMultiFilterChange('brandId', brand.id)}
                                                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 rounded-lg transition-colors ${isSelected ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                                </div>
                                                                {brand.brandInfo?.logo ? (
                                                                    <img src={brand.brandInfo.logo} alt="" className="h-6 w-6 rounded object-contain bg-gray-50 p-0.5" />
                                                                ) : (
                                                                    <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-bold">
                                                                        {(brand.brandInfo?.name || "??").substring(0, 2)}
                                                                    </div>
                                                                )}
                                                                <span className="truncate">{brand.brandInfo?.name || "Unknown"}</span>
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                                {filteredBrandOptions.length === 0 && (
                                                    <div className="p-4 text-center text-sm text-gray-500">
                                                        No brands found matching your criteria
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Brand Line Dropdown - Only show when brands selected */}
                            {options.brandLines.length > 0 && (
                                <div
                                    className="relative group/filter"
                                    onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerLine: true }))}
                                    onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerLine: false }))}
                                >
                                    <button
                                        onClick={() => toggleGroup('headerLine')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.lineId
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                            }`}
                                    >
                                        <span>Brand Line</span>
                                        {filters.lineId && (
                                            <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">
                                                {filters.lineId.split(',').length}
                                            </span>
                                        )}
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                    {expandedGroups.headerLine && (
                                        <>
                                            {/* Hover bridge to prevent closing on gap */}
                                            <div className="absolute top-full left-0 w-full h-2 z-40" />
                                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-40 max-h-64 overflow-y-auto">
                                                {options.brandLines.map((line: any) => {
                                                    const isSelected = (filters.lineId?.split(',') || []).includes(line.id);
                                                    return (
                                                        <button
                                                            key={line.id}
                                                            onClick={() => handleMultiFilterChange('lineId', line.id)}
                                                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isSelected ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                                {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                            </div>
                                                            {line.logo && (
                                                                <img src={line.logo} alt="" className="h-5 w-5 rounded object-contain" />
                                                            )}
                                                            <span className="truncate">{line.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Collection Dropdown - Only show when brands selected */}
                            {options.brandCollections.length > 0 && (
                                <div
                                    className="relative group/filter"
                                    onMouseEnter={() => setExpandedGroups(prev => ({ ...prev, headerCollection: true }))}
                                    onMouseLeave={() => setExpandedGroups(prev => ({ ...prev, headerCollection: false }))}
                                >
                                    <button
                                        onClick={() => toggleGroup('headerCollection')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.collection
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                                            }`}
                                    >
                                        <span>Collection</span>
                                        {filters.collection && (
                                            <span className="px-1.5 py-0.5 text-[10px] bg-white text-gray-900 rounded-full">
                                                {filters.collection.split(',').length}
                                            </span>
                                        )}
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </button>
                                    {expandedGroups.headerCollection && (
                                        <>
                                            {/* Hover bridge to prevent closing on gap */}
                                            <div className="absolute top-full left-0 w-full h-2 z-40" />
                                            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-40 max-h-64 overflow-y-auto">
                                                {options.brandCollections.map((col: any) => {
                                                    const isSelected = (filters.collection?.split(',') || []).includes(col.name);
                                                    const image = col.coverImageUrl || col.cover_image_url;
                                                    return (
                                                        <button
                                                            key={col.name}
                                                            onClick={() => handleMultiFilterChange('collection', col.name)}
                                                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 ${isSelected ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
                                                                {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                            </div>
                                                            {image && (
                                                                <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                                                    <img src={image} alt="" className="h-full w-full object-cover" />
                                                                </div>
                                                            )}
                                                            <span className="truncate">{col.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Clear filters button */}
                            {Object.keys(filters).length > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {/* Search & Mobile Filter Toggle */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-grow lg:w-72">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search pieces, brands, codes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="md:hidden p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-900" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-10">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-72 flex-shrink-0 space-y-2 sticky top-[120px] h-[calc(100vh-150px)] overflow-y-auto pr-4 custom-scrollbar">

                        {/* Release Date Filters */}
                        <div className="border-b border-gray-100 py-4">
                            <button
                                onClick={() => toggleGroup('releaseDate')}
                                className="flex items-center justify-between w-full text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider group"
                            >
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                                    Release Date
                                </div>
                                <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedGroups.releaseDate ? '' : '-rotate-90'}`} />
                            </button>

                            {expandedGroups.releaseDate && (
                                <div className="mt-4 space-y-6">
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Years</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {options.years.map(year => {
                                                const isSelected = (filters.years?.split(',') || []).includes(year.toString());
                                                return (
                                                    <button
                                                        key={year}
                                                        onClick={() => handleMultiFilterChange('years', year.toString())}
                                                        className={`px-2 py-2 rounded-lg text-xs font-bold transition-all border ${isSelected
                                                            ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                                                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                                                            }`}
                                                    >
                                                        {year}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Months</h3>
                                            {!filters.years && (
                                                <span className="text-[9px] text-gray-400 italic">Select year first</span>
                                            )}
                                        </div>
                                        <div className={`space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar ${!filters.years ? 'opacity-40 pointer-events-none' : ''}`}>
                                            {options.months.map(month => {
                                                const isSelected = (filters.months?.split(',') || []).includes(month.toString());
                                                return (
                                                    <button
                                                        key={month}
                                                        disabled={!filters.years}
                                                        onClick={() => handleMultiFilterChange('months', month.toString())}
                                                        className={`flex items-center w-full px-2 py-1.5 rounded-md text-sm transition-colors ${isSelected
                                                            ? 'bg-gray-900 text-white font-semibold'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-left'
                                                            }`}
                                                    >
                                                        {monthNames[month - 1]}
                                                        {isSelected && <XMarkIcon className="h-3 w-3 ml-auto" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Days</h3>
                                            {(!filters.years || !filters.months) && (
                                                <span className="text-[9px] text-gray-400 italic">Select year & month first</span>
                                            )}
                                        </div>
                                        <div className={`grid grid-cols-4 gap-1 max-h-32 overflow-y-auto pr-2 custom-scrollbar ${(!filters.years || !filters.months) ? 'opacity-40 pointer-events-none' : ''}`}>
                                            {options.days.map(day => {
                                                const isSelected = (filters.days?.split(',') || []).includes(day.toString());
                                                return (
                                                    <button
                                                        key={day}
                                                        disabled={!filters.years || !filters.months}
                                                        onClick={() => handleMultiFilterChange('days', day.toString())}
                                                        className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-bold transition-all border ${isSelected
                                                            ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                                                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-900'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <FilterSection
                            title="Apparel Type"
                            groupKey="apparel"
                            items={options.apparelTypes}
                            filterKey="apparelId"
                            icon={ShoppingBagIcon}
                        />
                        <FilterSection
                            title="Styles"
                            groupKey="styles"
                            items={options.styles}
                            filterKey="styleId"
                            icon={Square3Stack3DIcon}
                        />
                        <FilterSection
                            title="Genders"
                            groupKey="gender"
                            items={options.genders}
                            filterKey="genderId"
                            icon={UsersIcon}
                        />
                        <FilterSection
                            title="Sizes"
                            groupKey="sizes"
                            items={options.sizes}
                            filterKey="sizeId"
                            icon={QueueListIcon}
                        />
                        <FilterSection
                            title="Fits"
                            groupKey="fits"
                            items={options.fits}
                            filterKey="fitId"
                            icon={ArrowsPointingOutIcon}
                        />
                        <FilterSection
                            title="Materials"
                            groupKey="materials"
                            items={options.materials}
                            filterKey="materialId"
                            icon={VariableIcon}
                        />
                        <FilterSection
                            title="Patterns"
                            groupKey="patterns"
                            items={options.patterns}
                            filterKey="patternId"
                            icon={SparklesIcon}
                        />
                    </aside>

                    {/* Product Grid */}
                    <main className="flex-grow">
                        {loading && skus.length === 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="aspect-[3/4] bg-gray-100 rounded-2xl mb-4" />
                                        <div className="h-4 bg-gray-100 rounded-full w-2/3 mb-2" />
                                        <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                                    </div>
                                ))}
                            </div>
                        ) : skus.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                {skus.map((item) => (
                                    <div key={item.id} className="animate-fadeIn">
                                        <SKUCard item={item} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-300 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No pieces found</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">We couldn't find any items matching your current filters. Try adjusting them.</p>
                                <button
                                    onClick={clearFilters}
                                    className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filters Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                    <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-black uppercase tracking-tight">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2">
                                <XMarkIcon className="h-6 w-6 text-gray-900" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div className="space-y-4">

                                {/* Mobile Release Date */}
                                <div className="space-y-4 py-2 border-b border-gray-100">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                        <SparklesIcon className="h-4 w-4 text-gray-400" />
                                        Release Date
                                    </h3>

                                    <div className="space-y-4 pl-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Years</p>
                                            <div className="flex flex-wrap gap-2">
                                                {options.years.map(year => {
                                                    const isSelected = (filters.years?.split(',') || []).includes(year.toString());
                                                    return (
                                                        <button
                                                            key={year}
                                                            onClick={() => handleMultiFilterChange('years', year.toString())}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isSelected
                                                                ? 'bg-gray-900 border-gray-900 text-white'
                                                                : 'bg-gray-50 border-transparent text-gray-600'
                                                                }`}
                                                        >
                                                            {year}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Months</p>
                                                {!filters.years && (
                                                    <span className="text-[9px] text-gray-400 italic">Select year first</span>
                                                )}
                                            </div>
                                            <div className={`grid grid-cols-2 gap-2 ${!filters.years ? 'opacity-40 pointer-events-none' : ''}`}>
                                                {options.months.map(month => {
                                                    const isSelected = (filters.months?.split(',') || []).includes(month.toString());
                                                    return (
                                                        <button
                                                            key={month}
                                                            disabled={!filters.years}
                                                            onClick={() => handleMultiFilterChange('months', month.toString())}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border truncate text-left ${isSelected
                                                                ? 'bg-gray-900 border-gray-900 text-white'
                                                                : 'bg-gray-50 border-transparent text-gray-600'
                                                                }`}
                                                        >
                                                            {monthNames[month - 1]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <FilterSection title="Apparel Type" groupKey="apparel" items={options.apparelTypes} filterKey="apparelId" icon={ShoppingBagIcon} />
                                <FilterSection title="Genders" groupKey="gender" items={options.genders} filterKey="genderId" icon={UsersIcon} />
                                <FilterSection title="Sizes" groupKey="sizes" items={options.sizes} filterKey="sizeId" icon={QueueListIcon} />
                                <FilterSection title="Styles" groupKey="styles" items={options.styles} filterKey="styleId" icon={Square3Stack3DIcon} />
                                <FilterSection title="Fits" groupKey="fits" items={options.fits} filterKey="fitId" icon={ArrowsPointingOutIcon} />
                                <FilterSection title="Materials" groupKey="materials" items={options.materials} filterKey="materialId" icon={VariableIcon} />
                                <FilterSection title="Patterns" groupKey="patterns" items={options.patterns} filterKey="patternId" icon={SparklesIcon} />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold"
                            >
                                Show Results
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </div >
    );
}

// Minimal slugify for fallback
function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}
