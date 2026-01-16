
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon, XMarkIcon, PencilIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import SearchableCombobox from '../ui/Combobox';
import { ApparelIcon } from '../ui/ApparelIcons';
import { getImageUrl } from '@/lib/utils';
import { Input } from '@/components/ui/Input';

export default function SilhouetteManagement() {
    const [silhouettes, setSilhouettes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Data Options
    const [brands, setBrands] = useState<any[]>([]); // Brand accounts with logos
    const [apparels, setApparels] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<any[]>([]);
    const [pomCategories, setPomCategories] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editingSilhouette, setEditingSilhouette] = useState<any>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [formData, setFormData] = useState({
        brandId: '',
        apparelId: '',
        fitId: '',
        variant: '',
        selectedSizeIds: [] as string[],
        selectedPomIds: [] as string[],
        measurements: {} as Record<string, Record<string, { value: number; tolerance?: number }>>
    });

    // Grade values per POM for the grading feature
    const [gradeValues, setGradeValues] = useState<Record<string, string>>({});

    const [search, setSearch] = useState('');
    const [selectedBrandFilter, setSelectedBrandFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                silhouettesRes,
                brandsRes,
                apparelsRes,
                fitsRes,
                pomsRes,
                pomCatsRes,
                sizesRes
            ] = await Promise.all([
                apiClient.getSilhouettes(),
                brandApi.getBrands({ limit: 1000, businessType: 'brand' }),
                apiClient.getVUFSAttributeValues('apparel'),
                apiClient.getVUFSFits(),
                apiClient.getPOMDefinitions(),
                apiClient.getPOMCategories(),
                apiClient.getVUFSSizes()
            ]);

            console.log('[Silhouettes] Fetched silhouettes:', silhouettesRes.silhouettes?.length);
            console.log('[Silhouettes] Fetched brands:', Array.isArray(brandsRes) ? brandsRes.length : (brandsRes as any).brands?.length);
            console.log('[Silhouettes] Fetched apparels:', apparelsRes?.length);
            console.log('[Silhouettes] Fetched fits:', fitsRes?.length);

            setSilhouettes(silhouettesRes.silhouettes || []);
            setBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).brands || []);
            setApparels(apparelsRes || []);
            setFits(fitsRes || []);
            setPomDefinitions(Array.isArray(pomsRes) ? pomsRes : (pomsRes.definitions || []));
            setPomCategories(Array.isArray(pomCatsRes) ? pomCatsRes : (pomCatsRes.categories || []));
            setSizes(sizesRes || []);
            console.log('[Silhouettes] Data loading complete');
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // Filter POMs based on selected apparel type
    const filteredPomDefinitions = useMemo(() => {
        if (!formData.apparelId) return pomDefinitions;

        const selectedApparel = apparels.find(a => a.id === formData.apparelId);
        if (!selectedApparel) return pomDefinitions;

        const apparelName = selectedApparel.name.toLowerCase();

        // 1. Try direct category match by name
        // Many apparel types correspond directly to a POM category (e.g., "Tops", "Bottoms", "Outerwear")
        // We'll use a mapping or simple inclusion check
        let targetCategoryName = '';
        if (apparelName.includes('t-shirt') || apparelName.includes('hoodie') || apparelName.includes('sweater') || apparelName.includes('top') || apparelName.includes('shirt') || apparelName.includes('polo')) {
            targetCategoryName = 'tops';
        } else if (apparelName.includes('pants') || apparelName.includes('jeans') || apparelName.includes('shorts') || apparelName.includes('skirt')) {
            targetCategoryName = 'bottoms';
        } else if (apparelName.includes('jacket') || apparelName.includes('coat')) {
            targetCategoryName = 'outerwear';
        } else if (apparelName.includes('dress') || apparelName.includes('jumpsuit')) {
            targetCategoryName = 'one-piece'; // or 'dresses'
        }

        if (targetCategoryName) {
            const cat = pomCategories.find(c => c.name.toLowerCase().includes(targetCategoryName));
            if (cat) {
                return pomDefinitions.filter(p => p.category_id === cat.id);
            }
        }

        // 2. Fallback: Generic matching
        return pomDefinitions.filter(p =>
            p.category_name?.toLowerCase().includes(apparelName.slice(0, 4)) ||
            apparelName.includes(p.category_name?.toLowerCase().replace(/s$/, ''))
        );
    }, [formData.apparelId, apparels, pomDefinitions, pomCategories]);

    // Generate preview name
    const previewName = useMemo(() => {
        if (!formData.brandId || !formData.apparelId || !formData.fitId) {
            return 'Select all fields for preview';
        }

        const brand = brands.find(b => b.id === formData.brandId);
        const apparel = apparels.find(a => a.id === formData.apparelId);
        const fit = fits.find(f => f.id === formData.fitId);

        if (!brand || !apparel || !fit) return 'Loading...';

        const brandName = brand.brandInfo?.name || brand.name || 'Unknown Brand';
        const apparelName = apparel.name || 'Unknown Apparel';
        const fitName = fit.name || 'Unknown Fit';

        // Format: Brand Name Apparel Fit (Variant)
        const baseName = `${brandName} ${apparelName} ${fitName}`;
        return formData.variant ? `${baseName} (${formData.variant})` : baseName;
    }, [formData.brandId, formData.apparelId, formData.fitId, formData.variant, brands, apparels, fits]);

    const handleSubmit = async () => {
        if (!formData.brandId || !formData.apparelId || !formData.fitId) {
            toast.error('Please select Brand, Apparel, and Fit');
            return;
        }

        setModalLoading(true);
        try {
            const payload = {
                brandId: formData.brandId,
                apparelId: formData.apparelId,
                fitId: formData.fitId,
                variant: formData.variant,
                pomIds: formData.selectedPomIds,
                sizeIds: formData.selectedSizeIds,
                measurements: formData.measurements
            };

            if (editingSilhouette) {
                await apiClient.updateSilhouette(editingSilhouette.id, payload);
                toast.success('Silhouette updated successfully');
            } else {
                await apiClient.createSilhouette(payload);
                toast.success('Silhouette created successfully');
            }

            setShowModal(false);
            setEditingSilhouette(null);
            setFormData({ brandId: '', apparelId: '', fitId: '', variant: '', selectedSizeIds: [], selectedPomIds: [], measurements: {} });
            fetchData();
        } catch (error: any) {
            console.error('Failed to save silhouette', error);
            toast.error(error.message || 'Failed to save silhouette');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this silhouette?')) return;

        try {
            await apiClient.deleteSilhouette(id);
            toast.success('Silhouette deleted');
            fetchData();
        } catch (error) {
            console.error('Failed to delete silhouette', error);
            toast.error('Failed to delete silhouette');
        }
    };

    const filteredSilhouettes = useMemo(() => {
        return silhouettes.filter(s => {
            const searchLower = search.toLowerCase();
            const matchesSearch = !search ||
                s.name?.toLowerCase().includes(searchLower) ||
                s.brand_name?.toLowerCase().includes(searchLower) ||
                s.apparel_name?.toLowerCase().includes(searchLower) ||
                s.fit_name?.toLowerCase().includes(searchLower);
            const matchesBrand = !selectedBrandFilter || s.brand_id === selectedBrandFilter;
            return matchesSearch && matchesBrand;
        });
    }, [silhouettes, search, selectedBrandFilter]);

    // Brand options with images
    const brandOptions = useMemo(() => {
        return brands.map(b => ({
            id: b.id,
            name: b.brandInfo?.name || b.name || 'Unknown',
            image: getImageUrl(b.brandInfo?.logo)
        }));
    }, [brands]);

    // Apparel options with icons
    const apparelOptions = useMemo(() => {
        return apparels.map(a => ({
            id: a.id,
            name: a.name,
            icon: <ApparelIcon name={a.name} className="w-5 h-5" />
        }));
    }, [apparels]);

    // Collect all unique POM IDs used across silhouettes for dynamic columns
    const allUsedPomIds = useMemo(() => {
        const pomIdSet = new Set<string>();
        silhouettes.forEach(s => {
            (s.pom_ids || []).forEach((id: string) => pomIdSet.add(id));
        });
        return Array.from(pomIdSet);
    }, [silhouettes]);

    // Helper to get POM definition by ID
    const getPomById = (pomId: string) => pomDefinitions.find((p: any) => p.id === pomId);

    // Helper to format measurements for a silhouette's POM - returns JSX with sorted sizes
    const renderPomMeasurements = (silhouette: any, pomId: string) => {
        const measurements = silhouette.measurements?.[pomId];
        if (!measurements || Object.keys(measurements).length === 0) return <span className="text-gray-400">—</span>;

        // Sort entries by the order of sizes in the sizes array
        const sortedEntries = Object.entries(measurements)
            .map(([sizeId, data]: [string, any]) => {
                const sizeIndex = sizes.findIndex((sz: any) => sz.id === sizeId);
                const size = sizes.find((sz: any) => sz.id === sizeId);
                return { sizeId, sizeName: size?.name || '?', value: data.value, sortOrder: sizeIndex >= 0 ? sizeIndex : 999 };
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);

        if (sortedEntries.length === 0) return <span className="text-gray-400">—</span>;

        return (
            <div className="flex flex-wrap gap-1">
                {sortedEntries.map(entry => (
                    <span key={entry.sizeId} className="inline-flex items-center border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50">
                        <span className="font-semibold text-gray-700 mr-1">{entry.sizeName}:</span>
                        <span className="text-gray-600">{entry.value}cm</span>
                    </span>
                ))}
            </div>
        );
    };

    // Helper to get brand logo URL by brand_id
    const getBrandLogo = (brandId: string) => {
        const brand = brands.find(b => b.id === brandId);
        return brand?.brandInfo?.logo ? getImageUrl(brand.brandInfo.logo) : null;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Silhouette Management</h1>
                    <p className="text-gray-500 text-sm">Manage default POM templates by brand, apparel, and fit.</p>
                </div>
                <Button onClick={() => { console.log('[Silhouettes] Opening modal, current brands count:', brands.length); setShowModal(true); }} className="flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    New Silhouette
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search silhouettes..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <SearchableCombobox
                        options={brandOptions}
                        value={brands.find(b => b.id === selectedBrandFilter)?.brandInfo?.name || brands.find(b => b.id === selectedBrandFilter)?.name || ''}
                        onChange={(val) => {
                            const brand = brands.find(b => (b.brandInfo?.name || b.name) === val);
                            setSelectedBrandFilter(brand?.id || '');
                        }}
                        placeholder="Filter by Brand"
                    />
                </div>
                <Button variant="secondary" onClick={fetchData} title="Refresh">
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-max">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-sm whitespace-nowrap">Brand</th>
                                <th className="px-4 py-3 font-semibold text-sm whitespace-nowrap">Apparel</th>
                                <th className="px-4 py-3 font-semibold text-sm whitespace-nowrap">Fit</th>
                                <th className="px-4 py-3 font-semibold text-sm whitespace-nowrap">Variant</th>
                                {allUsedPomIds.map(pomId => {
                                    const pom = getPomById(pomId);
                                    return (
                                        <th key={pomId} className="px-4 py-3 font-semibold text-sm whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1">
                                                <span className="text-xs font-bold bg-gray-200 px-1.5 py-0.5 rounded">{pom?.code || '?'}</span>
                                                <span className="text-gray-600 text-xs">{pom?.name || 'Unknown'}</span>
                                            </span>
                                        </th>
                                    );
                                })}
                                <th className="px-4 py-3 font-semibold text-sm text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredSilhouettes.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getBrandLogo(s.brand_id) ? (
                                                <img
                                                    src={getBrandLogo(s.brand_id)!}
                                                    alt={s.brand_name}
                                                    className="w-6 h-6 rounded object-contain bg-white border"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {s.brand_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                            <span>{s.brand_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <ApparelIcon name={s.apparel_name} className="w-4 h-4 text-gray-400" />
                                            {s.apparel_name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.fit_name}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.variant || '—'}</td>
                                    {allUsedPomIds.map(pomId => (
                                        <td key={pomId} className="px-4 py-3 text-gray-600 text-xs">
                                            {s.pom_ids?.includes(pomId) ? renderPomMeasurements(s, pomId) : <span className="text-gray-400">—</span>}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingSilhouette(s);
                                                    setFormData({
                                                        brandId: s.brand_id,
                                                        apparelId: s.apparel_id,
                                                        fitId: s.fit_id,
                                                        variant: s.variant || '',
                                                        selectedSizeIds: s.size_ids || [],
                                                        selectedPomIds: s.pom_ids || [],
                                                        measurements: s.measurements || {}
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSilhouettes.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5 + allUsedPomIds.length} className="px-6 py-12 text-center text-gray-500">
                                        No silhouettes found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">{editingSilhouette ? 'Edit Silhouette' : 'Create New Silhouette'}</h2>
                            <button onClick={() => {
                                setShowModal(false);
                                setEditingSilhouette(null);
                                setFormData({ brandId: '', apparelId: '', fitId: '', variant: '', selectedSizeIds: [], selectedPomIds: [], measurements: {} });
                            }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Base Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Brand Account</label>
                                    <SearchableCombobox
                                        options={brandOptions}
                                        value={brands.find(b => b.id === formData.brandId)?.brandInfo?.name || brands.find(b => b.id === formData.brandId)?.name || ''}
                                        onChange={(val) => {
                                            const brand = brands.find(b => (b.brandInfo?.name || b.name) === val);
                                            setFormData({ ...formData, brandId: brand?.id || '' });
                                        }}
                                        placeholder="Select Brand"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Apparel Type</label>
                                    <SearchableCombobox
                                        options={apparelOptions}
                                        value={apparels.find(a => a.id === formData.apparelId)?.name || ''}
                                        onChange={(val) => {
                                            const app = apparels.find(a => a.name === val);
                                            setFormData({ ...formData, apparelId: app?.id || '', selectedPomIds: [] });
                                        }}
                                        placeholder="Select Apparel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Fit</label>
                                    <SearchableCombobox
                                        options={fits.map(f => ({ id: f.id, name: f.name }))}
                                        value={fits.find(f => f.id === formData.fitId)?.name || ''}
                                        onChange={(val) => {
                                            const fit = fits.find(f => f.name === val);
                                            setFormData({ ...formData, fitId: fit?.id || '' });
                                        }}
                                        placeholder="Select Fit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Variant</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        placeholder="e.g., Essentials, Premium"
                                        value={formData.variant}
                                        onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Size Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Available Sizes</label>
                                <div className="flex flex-wrap gap-2 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                                    {sizes.map(size => (
                                        <label key={size.id} className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all
                                            ${formData.selectedSizeIds.includes(size.id)
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
                                        `}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.selectedSizeIds.includes(size.id)}
                                                onChange={(e) => {
                                                    const newIds = e.target.checked
                                                        ? [...formData.selectedSizeIds, size.id]
                                                        : formData.selectedSizeIds.filter(id => id !== size.id);
                                                    setFormData({ ...formData, selectedSizeIds: newIds });
                                                }}
                                            />
                                            <span className="text-sm">{size.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Output Preview */}
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Preview Output Name</span>
                                <div className="text-lg font-bold text-gray-900">{previewName}</div>
                            </div>

                            {/* Measurements Section (POMs) */}
                            {formData.apparelId && filteredPomDefinitions.length > 0 && formData.selectedSizeIds.length > 0 && (
                                <div className="border-t pt-6 mt-2">
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
                                                value=""
                                                onChange={(name) => {
                                                    const pom = filteredPomDefinitions.find(p => p.name === name);
                                                    if (pom && !formData.selectedPomIds.includes(pom.id)) {
                                                        setFormData({ ...formData, selectedPomIds: [...formData.selectedPomIds, pom.id] });
                                                    }
                                                }}
                                                options={filteredPomDefinitions
                                                    .filter(pom => !formData.selectedPomIds.includes(pom.id))
                                                    .map(pom => ({ id: pom.id, name: pom.name }))}
                                                placeholder="Search to add POM..."
                                            />
                                        </div>
                                        {formData.selectedPomIds.length === 0 && (
                                            <p className="text-xs text-gray-500 mt-2 italic">
                                                No measurements selected. Add one to start.
                                            </p>
                                        )}
                                        {formData.selectedPomIds.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                {formData.selectedPomIds.length} measurements active.
                                            </p>
                                        )}
                                    </div>

                                    {/* List of Selected POMs */}
                                    <div className="space-y-6">
                                        {formData.selectedPomIds.map((pomId) => {
                                            const pom = pomDefinitions.find(p => p.id === pomId);
                                            if (!pom) return null;

                                            const measurementKey = String(pomId);
                                            const isHalf = pom.is_half_measurement;

                                            return (
                                                <div key={pomId} className="bg-white rounded-xl border border-gray-200 shadow-sm relative z-0 hover:z-10 transition-shadow">
                                                    {/* POM Header */}
                                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between rounded-t-xl">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                                {pom.code}
                                                            </span>
                                                            <h4 className="font-semibold text-gray-900">{pom.name}</h4>
                                                            {isHalf && (
                                                                <span className="text-[10px] font-bold bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-100 uppercase">
                                                                    Half
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({
                                                                ...formData,
                                                                selectedPomIds: formData.selectedPomIds.filter(id => id !== pomId)
                                                            })}
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                            title="Remove Measurement"
                                                        >
                                                            <XMarkIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    {/* Sizes Grid */}
                                                    <div className="p-4 bg-white">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                            {formData.selectedSizeIds.map(sizeId => {
                                                                const size = sizes.find(s => s.id === sizeId);
                                                                const currentValue = formData.measurements[measurementKey]?.[sizeId];

                                                                return (
                                                                    <div key={`${pomId}-${sizeId}`}>
                                                                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase text-center">
                                                                            {size?.name || 'Unknown'}
                                                                        </label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="number"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-8 text-center"
                                                                                value={currentValue?.value || ''}
                                                                                onChange={(e) => {
                                                                                    const valStr = e.target.value;
                                                                                    const val = valStr === '' ? undefined : parseFloat(valStr);
                                                                                    const newMeasurements = { ...formData.measurements };

                                                                                    if (val === undefined) {
                                                                                        if (newMeasurements[measurementKey]) {
                                                                                            delete newMeasurements[measurementKey][sizeId];
                                                                                            if (Object.keys(newMeasurements[measurementKey]).length === 0) {
                                                                                                delete newMeasurements[measurementKey];
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        if (!newMeasurements[measurementKey]) newMeasurements[measurementKey] = {};
                                                                                        newMeasurements[measurementKey][sizeId] = {
                                                                                            value: val,
                                                                                            tolerance: currentValue?.tolerance || pom.default_tolerance || 0.5
                                                                                        };
                                                                                    }
                                                                                    setFormData({ ...formData, measurements: newMeasurements });
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

                                                            {/* Grade Increment Field */}
                                                            {formData.selectedSizeIds.length > 1 && (
                                                                <div className="flex flex-col justify-end min-w-[110px] group relative">
                                                                    <div className="flex items-center justify-center gap-1 mb-1 relative group">
                                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                                            Grade
                                                                        </label>
                                                                        <InformationCircleIcon
                                                                            className="w-3.5 h-3.5 text-gray-300 hover:text-blue-500 cursor-help transition-colors"
                                                                        />

                                                                        {/* Tooltip - Positioned ABOVE to avoid blocking input */}
                                                                        <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-52 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl z-[200] text-center font-normal leading-relaxed border border-slate-700 pointer-events-none">
                                                                            <p>Enter an increment (e.g. 1.0) to auto-fill measurements for all larger sizes, starting from the value in the first size.</p>
                                                                            <div className="absolute top-full right-5 border-[6px] border-transparent border-t-slate-900"></div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                                                                        <input
                                                                            type="number"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={gradeValues[pomId] || ''}
                                                                            onChange={(e) => setGradeValues({ ...gradeValues, [pomId]: e.target.value })}
                                                                            className="w-10 bg-transparent text-xs font-semibold text-gray-900 focus:outline-none text-center"
                                                                        />
                                                                        <div className="w-px h-4 bg-gray-300 mx-0.5" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const increment = parseFloat(gradeValues[pomId] || '0');
                                                                                if (!increment || formData.selectedSizeIds.length < 2) {
                                                                                    toast.error('Enter a grade increment value');
                                                                                    return;
                                                                                }

                                                                                // Get first size value
                                                                                const firstSizeId = formData.selectedSizeIds[0];
                                                                                const firstValue = formData.measurements[measurementKey]?.[firstSizeId]?.value;
                                                                                if (firstValue === undefined) {
                                                                                    toast.error('Enter the first size value first');
                                                                                    return;
                                                                                }

                                                                                // Apply grading to all subsequent sizes
                                                                                const newMeasurements = { ...formData.measurements };
                                                                                if (!newMeasurements[measurementKey]) newMeasurements[measurementKey] = {};

                                                                                formData.selectedSizeIds.forEach((sizeId, index) => {
                                                                                    if (index === 0) return; // Skip first size
                                                                                    const gradedValue = firstValue + (increment * index);
                                                                                    newMeasurements[measurementKey][sizeId] = {
                                                                                        value: Math.round(gradedValue * 10) / 10, // Round to 1 decimal
                                                                                        tolerance: pom.default_tolerance || 0.5
                                                                                    };
                                                                                });

                                                                                setFormData({ ...formData, measurements: newMeasurements });
                                                                                toast.success(`Applied +${increment}cm grading`);
                                                                            }}
                                                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider px-1"
                                                                        >
                                                                            Apply
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
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3 mt-auto">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingSilhouette(null);
                                    setFormData({ brandId: '', apparelId: '', fitId: '', variant: '', selectedSizeIds: [], selectedPomIds: [], measurements: {} });
                                }}
                                className="sm:w-32"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                loading={modalLoading}
                                className="sm:w-48"
                                disabled={!formData.brandId || !formData.apparelId || !formData.fitId || formData.selectedPomIds.length === 0}
                            >
                                {editingSilhouette ? 'Update Silhouette' : 'Create Silhouette'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
