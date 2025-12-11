'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface VUFSItem {
    id: string;
    name: string;
    [key: string]: any;
}

interface AttributeType {
    slug: string;
    name: string;
    isActive: boolean;
}

export default function AdminVUFSPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Data states
    const [categories, setCategories] = useState<VUFSItem[]>([]);
    const [brands, setBrands] = useState<VUFSItem[]>([]);
    const [colors, setColors] = useState<VUFSItem[]>([]);
    const [materials, setMaterials] = useState<VUFSItem[]>([]);
    const [patterns, setPatterns] = useState<VUFSItem[]>([]);
    const [fits, setFits] = useState<VUFSItem[]>([]);
    const [sizes, setSizes] = useState<VUFSItem[]>([]);

    // Dynamic Attributes State
    const [customTypes, setCustomTypes] = useState<AttributeType[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, VUFSItem[]>>({});

    // Matrix State
    const [matrixValues, setMatrixValues] = useState<Record<string, string>>({}); // Key: "catId:attrSlug" -> Value
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.roles || !user.roles.includes('admin')) {
                router.push('/');
                return;
            }
            fetchAllData();
        }
    }, [user, authLoading, router]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [
                catsRes,
                brandsRes,
                colorsRes,
                matsRes,
                patsRes,
                fitsRes,
                sizesRes,
                typesRes,
                matrixRes
            ] = await Promise.all([
                apiClient.getVUFSCategories(),
                apiClient.getVUFSBrands(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSAttributeTypes(),
                apiClient.getAllCategoryAttributes()
            ]);

            // Handle Categories
            const catsData = Array.isArray(catsRes) ? catsRes : (catsRes?.categories || []);
            setCategories(catsData.filter((c: any) => c.level === 'page'));

            // Handle Standard Collections
            setBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes?.brands || []));
            setColors(Array.isArray(colorsRes) ? colorsRes : (colorsRes?.colors || []));
            setMaterials(Array.isArray(matsRes) ? matsRes : (matsRes?.materials || []));
            setPatterns(Array.isArray(patsRes) ? patsRes : (patsRes?.patterns || []));
            setFits(Array.isArray(fitsRes) ? fitsRes : (fitsRes?.fits || []));
            setSizes(Array.isArray(sizesRes) ? sizesRes : (sizesRes?.sizes || []));

            // Handle Custom Attributes
            const typesData: AttributeType[] = Array.isArray(typesRes) ? typesRes : (typesRes?.types || []);
            setCustomTypes(typesData);

            // Fetch values for each custom type (for dropdowns in grid view)
            const valuesMap: Record<string, VUFSItem[]> = {};
            await Promise.all(typesData.map(async (type) => {
                try {
                    const valuesRes = await apiClient.getVUFSAttributeValues(type.slug);
                    valuesMap[type.slug] = Array.isArray(valuesRes) ? valuesRes : (valuesRes?.values || []);
                } catch (e) {
                    console.error(`Failed to fetch values for ${type.name}`, e);
                    valuesMap[type.slug] = [];
                }
            }));
            setCustomValues(valuesMap);

            // Handle Matrix Values
            const matrixData = Array.isArray(matrixRes) ? matrixRes : (matrixRes?.attributes || []);
            const matrixMap: Record<string, string> = {};
            matrixData.forEach((item: any) => {
                matrixMap[`${item.category_id}:${item.attribute_slug}`] = item.value;
            });
            setMatrixValues(matrixMap);

        } catch (err) {
            console.error('Failed to fetch VUFS data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMatrixChange = async (categoryId: string, attributeSlug: string, value: string) => {
        // Optimistic update
        const key = `${categoryId}:${attributeSlug}`;
        setMatrixValues(prev => ({ ...prev, [key]: value }));

        try {
            await apiClient.setCategoryAttribute(categoryId, attributeSlug, value);
        } catch (err) {
            console.error('Failed to save attribute', err);
            // Revert on error? For now just log
            alert('Failed to save value');
        }
    };

    const [modalAction, setModalAction] = useState<'add' | 'delete' | 'bulk' | 'addColumn' | 'deleteColumn' | 'renameColumn' | 'renameItem' | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedSlug, setSelectedSlug] = useState<string>('');
    const [selectedId, setSelectedId] = useState<string>('');
    const [inputValue, setInputValue] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Handlers
    const initiateDelete = (type: string, id: string, slug?: string) => {
        setModalAction('delete');
        setSelectedType(type);
        setSelectedId(id);
        if (slug) setSelectedSlug(slug);
    };

    const initiateAdd = (type: string, slug?: string) => {
        setModalAction('add');
        setSelectedType(type);
        if (slug) setSelectedSlug(slug);
        setInputValue('');
    };

    const initiateBulk = (type: string) => {
        if (!['Style / Category', 'Brand', 'Color', 'Material', 'Pattern', 'Fit', 'Size'].includes(type)) {
            alert('Bulk add coming soon for custom columns.');
            return;
        }
        setModalAction('bulk');
        setSelectedType(type);
        setBulkInput('');
    };

    const initiateRenameColumn = (type: AttributeType) => {
        setModalAction('renameColumn');
        setSelectedSlug(type.slug);
        setInputValue(type.name);
    };

    const initiateRenameItem = (item: VUFSItem, typeName: string, typeSlug?: string) => {
        setModalAction('renameItem');
        setSelectedId(item.id);
        setSelectedType(typeName); // Store column name for display
        if (typeSlug) setSelectedSlug(typeSlug);
        setInputValue(item.name);
    };

    const confirmRenameColumn = async () => {
        if (!selectedSlug || !inputValue.trim()) return;
        setActionLoading(true);
        try {
            await apiClient.updateVUFSAttributeType(selectedSlug, inputValue.trim());
            await fetchAllData();
            closeModal();
        } catch (error) {
            console.error('Failed to rename column', error);
            alert('Failed to rename column');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmRenameItem = async () => {
        if (!selectedId || !inputValue.trim()) return;
        setActionLoading(true);
        try {
            // Check if it's a custom attribute value (has slug)
            if (selectedSlug && customTypes.some(t => t.slug === selectedSlug)) {
                await apiClient.updateVUFSAttributeValue(selectedId, inputValue.trim());
            } else {
                // Standard types
                switch (selectedType) {
                    case 'Style / Category': await apiClient.updateVUFSCategory(selectedId, inputValue.trim()); break;
                    case 'Brand': await apiClient.updateVUFSBrand(selectedId, inputValue.trim()); break;
                    case 'Color': await apiClient.updateVUFSColor(selectedId, inputValue.trim()); break;
                    case 'Material': await apiClient.updateVUFSMaterial(selectedId, inputValue.trim()); break;
                    case 'Pattern': await apiClient.updateVUFSPattern(selectedId, inputValue.trim()); break;
                    case 'Fit': await apiClient.updateVUFSFit(selectedId, inputValue.trim()); break;
                    case 'Size': await apiClient.updateVUFSSize(selectedId, inputValue.trim()); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (error) {
            console.error('Failed to rename item', error);
            alert('Failed to rename item');
        } finally {
            setActionLoading(false);
        }
    };

    const initiateAddColumn = () => {
        setModalAction('addColumn');
        setInputValue('');
    };

    const initiateDeleteColumn = (slug: string, name: string) => {
        setModalAction('deleteColumn');
        setSelectedSlug(slug);
        setSelectedType(name);
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setBulkInput(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    const confirmDelete = async () => {
        setActionLoading(true);
        try {
            // Check if it's a custom attribute value
            const customType = customTypes.find(t => t.slug === selectedSlug);
            if (customType || selectedSlug) {
                await apiClient.deleteVUFSAttributeValue(selectedId);
            } else {
                // Standard types
                switch (selectedType) {
                    case 'Style / Category': await apiClient.deleteVUFSCategory(selectedId); break;
                    case 'Brand': await apiClient.deleteVUFSBrand(selectedId); break;
                    case 'Color': await apiClient.deleteVUFSColor(selectedId); break;
                    case 'Material': await apiClient.deleteVUFSMaterial(selectedId); break;
                    case 'Pattern': await apiClient.deleteVUFSPattern(selectedId); break;
                    case 'Fit': await apiClient.deleteVUFSFit(selectedId); break;
                    case 'Size': await apiClient.deleteVUFSSize(selectedId); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete item.');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmAdd = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);

        try {
            // Check if it's a custom attribute value
            const customType = customTypes.find(t => t.name === selectedType || t.slug === selectedSlug);

            if (selectedSlug && customTypes.some(t => t.slug === selectedSlug)) {
                await apiClient.addVUFSAttributeValue(selectedSlug, inputValue);
            } else {
                switch (selectedType) {
                    case 'Style / Category': await apiClient.addVUFSCategory({ name: inputValue, level: 'page' }); break;
                    case 'Brand': await apiClient.addVUFSBrand(inputValue); break;
                    case 'Color': await apiClient.addVUFSColor(inputValue); break;
                    case 'Material': await apiClient.addVUFSMaterial(inputValue); break;
                    case 'Pattern': await apiClient.addVUFSPattern(inputValue); break;
                    case 'Fit': await apiClient.addVUFSFit(inputValue); break;
                    case 'Size': await apiClient.addVUFSSize(inputValue); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            console.error('Add failed', err);
            alert(`Failed: ${err.message || 'Error adding item'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmAddColumn = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);
        try {
            await apiClient.addVUFSAttributeType(inputValue);
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            alert(`Failed to add column: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDeleteColumn = async () => {
        setActionLoading(true);
        try {
            await apiClient.deleteVUFSAttributeType(selectedSlug);
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            alert(`Failed to delete column: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmBulkAdd = async () => {
        if (!bulkInput.trim()) return;
        setActionLoading(true);
        const items = bulkInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
        if (!items.length) { setActionLoading(false); return; }

        try {
            const res = await apiClient.bulkAddVUFSItems(selectedType, items);
            // @ts-ignore
            const { added, duplicates } = res.result || {};
            alert(`Bulk Add Completed!\nAdded: ${added}\nDuplicates Skipped: ${duplicates}`);
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            alert('Failed to bulk add items.');
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setModalAction(null);
        setSelectedType('');
        setSelectedSlug('');
        setSelectedId('');
        setInputValue('');
        setBulkInput('');
        setActionLoading(false);
    };

    if (authLoading || loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );

    const renderList = (title: string, items: VUFSItem[], bgClass: string, textClass: string, slug?: string, isCustomColumn = false) => (
        <div className="flex flex-col min-w-[220px] bg-white border-r last:border-r-0 h-full w-[250px]">
            <div className={`p-4 font-bold text-center border-b uppercase text-sm tracking-wider flex justify-between items-center group/header ${bgClass} ${textClass}`}>
                <span className="truncate" title={title}>{title}</span>
                <div className="flex gap-1">
                    {!isCustomColumn && (
                        <button
                            onClick={() => initiateBulk(title)}
                            className="text-[10px] bg-white/50 hover:bg-white text-gray-700 px-1.5 py-1 rounded transition-colors"
                            title="Bulk Add"
                        >
                            + Bulk
                        </button>
                    )}
                    {isCustomColumn && (
                        <button
                            onClick={() => initiateDeleteColumn(slug!, title)}
                            className="opacity-0 group-hover/header:opacity-100 text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-1 rounded transition-all"
                            title="Delete Column"
                        >
                            Trash
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-y-auto flex-1">
                {items.sort((a, b) => a.name.localeCompare(b.name)).map((item, idx) => (
                    <div key={item.id} className={`group p-3 border-b text-sm max-w-xs hover:bg-gray-100 flex justify-between items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="flex items-center overflow-hidden mr-2">
                            {/* Edit Icon Button for Custom Columns */}
                            {isCustomColumn && (
                                <button
                                    onClick={() => initiateRenameItem(item, title, slug)}
                                    className="mr-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity focus:opacity-100"
                                    title="Rename"
                                >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                            <span className="truncate font-medium text-gray-700">{item.name}</span>
                        </div>
                        <button
                            onClick={() => initiateDelete(title, item.id, slug)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 font-bold px-1 rounded transition-all duration-200 focus:opacity-100"
                        >
                            &times;
                        </button>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-4 text-gray-400 text-center italic text-xs">No items found</div>
                )}
            </div>
            <div className="p-3 border-t bg-gray-50">
                <button
                    onClick={() => initiateAdd(title, slug)}
                    className="w-full py-2 text-xs font-bold text-gray-600 hover:text-white hover:bg-blue-600 border border-gray-300 hover:border-blue-600 rounded transition-all duration-200 shadow-sm uppercase tracking-wide"
                >
                    + Add Item
                </button>
            </div>
        </div>
    );

    const renderGridView = () => (
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="bg-white border rounded shadow-sm overflow-hidden min-w-max">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                        <tr>
                            <th className="px-4 py-3 font-bold border-r w-48 sticky left-0 bg-gray-100 z-10">Apparel</th>
                            {customTypes.map(type => (
                                <th key={type.slug} className="px-4 py-3 border-r min-w-[200px]">
                                    <div className="flex items-center justify-between group">
                                        <span>{type.name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => initiateRenameColumn(type)}
                                                className="text-gray-500 hover:text-blue-600 p-1"
                                                title="Rename Column"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => initiateDeleteColumn(type.slug, type.name)}
                                                className="text-gray-400 hover:text-red-500 p-1 font-bold"
                                                title="Delete Column"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.sort((a, b) => a.name.localeCompare(b.name)).map((cat, idx) => (
                            <tr key={cat.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900 border-r bg-white sticky left-0 z-10 font-bold group">
                                    <div className="flex items-center justify-between">
                                        <span>{cat.name}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => initiateRenameItem(cat, 'Style / Category')}
                                                className="text-gray-400 hover:text-blue-600 p-1"
                                                title="Rename Item"
                                            >
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => initiateDelete('Style / Category', cat.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 font-bold text-lg leading-none"
                                                title="Delete Item"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                {customTypes.map(type => {
                                    const key = `${cat.id}:${type.slug}`;
                                    const currentVal = matrixValues[key] || '';
                                    const options = customValues[type.slug] || [];

                                    return (
                                        <td key={type.slug} className="px-2 py-2 border-r bg-white/50 p-0">
                                            <div className="relative">
                                                <select
                                                    className="w-full h-full bg-transparent p-2 outline-none border-0 focus:ring-2 focus:ring-blue-100 rounded text-gray-700 appearance-none"
                                                    value={currentVal}
                                                    onChange={(e) => handleMatrixChange(cat.id, type.slug, e.target.value)}
                                                >
                                                    <option value="">- Select -</option>
                                                    {options.map(opt => (
                                                        <option key={opt.id} value={opt.name}>{opt.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm z-20">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">VUFS Master Data</h1>
                    <p className="text-sm text-gray-500 mt-1">Vangarments Universal Fashion Standard Classification System</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Matrix View
                        </button>
                    </div>

                    {viewMode === 'list' && (
                        <button
                            onClick={initiateAddColumn}
                            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            <span className="text-lg font-bold">+</span>
                            <span className="text-sm font-semibold uppercase tracking-wide">Add Column</span>
                        </button>
                    )}
                </div>
            </header>

            {viewMode === 'list' ? (
                <div className="flex-1 overflow-x-auto">
                    <div className="flex h-full min-w-max">
                        {renderList('Style / Category', categories, 'bg-purple-50', 'text-purple-900')}
                        {renderList('Brand', brands, 'bg-gray-100', 'text-gray-900')}
                        {renderList('Size', sizes, 'bg-indigo-50', 'text-indigo-900')}
                        {renderList('Color', colors, 'bg-pink-50', 'text-pink-900')}
                        {renderList('Material', materials, 'bg-green-50', 'text-green-900')}
                        {renderList('Pattern', patterns, 'bg-blue-50', 'text-blue-900')}
                        {renderList('Fit', fits, 'bg-yellow-50', 'text-yellow-900')}

                        {/* Dynamic Columns */}
                        {customTypes.map((type, idx) => {
                            // Alternate some pastel colors for dynamic columns
                            const colors = [
                                { bg: 'bg-orange-50', text: 'text-orange-900' },
                                { bg: 'bg-teal-50', text: 'text-teal-900' },
                                { bg: 'bg-rose-50', text: 'text-rose-900' },
                                { bg: 'bg-cyan-50', text: 'text-cyan-900' },
                            ];
                            const scheme = colors[idx % colors.length];
                            return (
                                <div key={type.slug}>
                                    {renderList(type.name, customValues[type.slug] || [], scheme.bg, scheme.text, type.slug, true)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                renderGridView()
            )}

            {/* Modals */}
            {(modalAction === 'renameColumn' || modalAction === 'renameItem') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {modalAction === 'renameItem' ? `Rename Item in "${selectedType}"` : 'Rename Column'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {modalAction === 'renameItem'
                                ? 'Renaming this item will update it everywhere it is used.'
                                : `Renaming "${selectedType}" will update the header for all users.`
                            }
                        </p>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none mb-6"
                            placeholder="Enter new name"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={modalAction === 'renameItem' ? confirmRenameItem : confirmRenameColumn}
                                disabled={actionLoading || !inputValue.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {actionLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalAction && modalAction !== 'renameColumn' && modalAction !== 'renameItem' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalAction === 'add' && `Add New ${selectedType}`}
                                {modalAction === 'delete' && `Delete Item`}
                                {modalAction === 'bulk' && `Bulk Add ${selectedType}`}
                                {modalAction === 'addColumn' && `Add New Column`}
                                {modalAction === 'addColumn' && `Add New Column`}
                                {modalAction === 'deleteColumn' && `Delete Column "${selectedType}"`}
                            </h3>
                        </div>

                        <div className="p-6">
                            {(modalAction === 'add' || modalAction === 'addColumn') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder={modalAction === 'addColumn' ? "e.g. Season, Occasion" : `Enter ${selectedType} name...`}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (modalAction === 'addColumn' ? confirmAddColumn() : confirmAdd())}
                                    />
                                </div>
                            )}

                            {(modalAction === 'delete') && (
                                <p className="text-gray-600">
                                    Are you sure you want to delete this item?
                                </p>
                            )}

                            {(modalAction === 'deleteColumn') && (
                                <p className="text-gray-600">
                                    Are you sure you want to delete the column <strong>{selectedType}</strong>? This will delete all items within it.
                                </p>
                            )}



                            {modalAction === 'bulk' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV</label>
                                        <input
                                            type="file"
                                            accept=".csv,.txt"
                                            onChange={handleFileUpload}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full"
                                        />
                                    </div>
                                    <textarea
                                        className="w-full h-32 px-3 py-2 border rounded font-mono text-sm"
                                        placeholder={`Paste items here...`}
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={
                                    modalAction === 'addColumn' ? confirmAddColumn :
                                        modalAction === 'deleteColumn' ? confirmDeleteColumn :
                                            modalAction === 'add' ? confirmAdd :
                                                modalAction === 'bulk' ? confirmBulkAdd :
                                                    confirmDelete
                                }
                                className={`px-4 py-2 text-sm font-medium text-white rounded ${(modalAction === 'delete' || modalAction === 'deleteColumn') ? 'bg-red-600 hover:bg-red-700' :
                                    modalAction === 'bulk' ? 'bg-green-600 hover:bg-green-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' :
                                    (modalAction === 'bulk' ? 'Import Items' :
                                        'Confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
