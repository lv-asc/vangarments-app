
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchableCombobox from '../ui/Combobox';
import { ApparelIcon } from '../ui/ApparelIcons';
import { getImageUrl } from '@/lib/utils';

export default function SilhouetteManagement() {
    const [silhouettes, setSilhouettes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Data Options
    const [brands, setBrands] = useState<any[]>([]); // Brand accounts with logos
    const [apparels, setApparels] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<any[]>([]);
    const [pomCategories, setPomCategories] = useState<any[]>([]);

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [formData, setFormData] = useState({
        brandId: '',
        apparelId: '',
        fitId: '',
        selectedPomIds: [] as string[]
    });

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
                pomCatsRes
            ] = await Promise.all([
                apiClient.getSilhouettes(),
                brandApi.getBrands({ limit: 1000, businessType: 'brand' }),
                apiClient.getVUFSAttributeValues('apparel'),
                apiClient.getVUFSFits(),
                apiClient.getPOMDefinitions(),
                apiClient.getPOMCategories()
            ]);

            setSilhouettes(silhouettesRes.silhouettes || []);
            setBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes as any).brands || []);
            setApparels(apparelsRes || []);
            setFits(fitsRes || []);
            setPomDefinitions(Array.isArray(pomsRes) ? pomsRes : (pomsRes.definitions || []));
            setPomCategories(Array.isArray(pomCatsRes) ? pomCatsRes : (pomCatsRes.categories || []));
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

        // Approximate count (actual count is determined server-side)
        const count = silhouettes.filter(s =>
            s.brand_id === formData.brandId &&
            s.apparel_id === formData.apparelId &&
            s.fit_id === formData.fitId
        ).length;

        return `${brandName} ${fitName} ${apparelName} #${count + 1}`;
    }, [formData.brandId, formData.apparelId, formData.fitId, brands, apparels, fits, silhouettes]);

    const handleCreate = async () => {
        if (!formData.brandId || !formData.apparelId || !formData.fitId) {
            toast.error('Please select Brand, Apparel, and Fit');
            return;
        }

        setModalLoading(true);
        try {
            await apiClient.createSilhouette({
                brandId: formData.brandId,
                apparelId: formData.apparelId,
                fitId: formData.fitId,
                pomIds: formData.selectedPomIds
            });
            toast.success('Silhouette created successfully');
            setShowModal(false);
            setFormData({ brandId: '', apparelId: '', fitId: '', selectedPomIds: [] });
            fetchData();
        } catch (error: any) {
            console.error('Failed to create silhouette', error);
            toast.error(error.message || 'Failed to create silhouette');
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
            const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase());
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Silhouette Management</h1>
                    <p className="text-gray-500 text-sm">Manage default POM templates by brand, apparel, and fit.</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
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
                        value={selectedBrandFilter}
                        onChange={setSelectedBrandFilter}
                        placeholder="Filter by Brand"
                    />
                </div>
                <Button variant="secondary" onClick={fetchData} title="Refresh">
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Name</th>
                            <th className="px-6 py-4 font-semibold">Apparel</th>
                            <th className="px-6 py-4 font-semibold">Fit</th>
                            <th className="px-6 py-4 font-semibold">POMs</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredSilhouettes.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{s.name}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <ApparelIcon name={s.apparel_name} className="w-4 h-4 text-gray-400" />
                                        {s.apparel_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{s.fit_name}</td>
                                <td className="px-6 py-4 text-gray-600">{s.pom_ids?.length || 0} points</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredSilhouettes.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No silhouettes found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Create New Silhouette</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Brand Account</label>
                                    <SearchableCombobox
                                        options={brandOptions}
                                        value={formData.brandId}
                                        onChange={(val) => setFormData({ ...formData, brandId: val })}
                                        placeholder="Select Brand"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Apparel Type</label>
                                    <SearchableCombobox
                                        options={apparelOptions}
                                        value={formData.apparelId}
                                        onChange={(val) => setFormData({ ...formData, apparelId: val, selectedPomIds: [] })}
                                        placeholder="Select Apparel"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Fit</label>
                                    <SearchableCombobox
                                        options={fits.map(f => ({ id: f.id, name: f.name }))}
                                        value={formData.fitId}
                                        onChange={(val) => setFormData({ ...formData, fitId: val })}
                                        placeholder="Select Fit"
                                    />
                                </div>
                            </div>

                            {/* Output Preview */}
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Preview Output Name</span>
                                <div className="text-lg font-bold text-gray-900">{previewName}</div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Measurement Points (POMs)</label>
                                    {formData.apparelId && (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            {filteredPomDefinitions.length} relevant points found
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
                                    {filteredPomDefinitions.map(pom => (
                                        <label key={pom.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-200 hover:shadow-sm transition-all group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={formData.selectedPomIds.includes(pom.id)}
                                                onChange={(e) => {
                                                    const newIds = e.target.checked
                                                        ? [...formData.selectedPomIds, pom.id]
                                                        : formData.selectedPomIds.filter(id => id !== pom.id);
                                                    setFormData({ ...formData, selectedPomIds: newIds });
                                                }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold text-gray-900 truncate">{pom.name}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">{pom.category_name} • {pom.code}</span>
                                            </div>
                                        </label>
                                    ))}
                                    {filteredPomDefinitions.length === 0 && (
                                        <div className="col-span-2 text-center py-8">
                                            <p className="text-gray-400 text-sm">No measurement points available for this selection.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                                        {formData.selectedPomIds.length} POMs Selected
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-end gap-3 mt-auto">
                            <Button
                                variant="secondary"
                                onClick={() => setShowModal(false)}
                                className="sm:w-32"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                loading={modalLoading}
                                className="sm:w-48"
                                disabled={!formData.brandId || !formData.apparelId || !formData.fitId || formData.selectedPomIds.length === 0}
                            >
                                Create Silhouette
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
