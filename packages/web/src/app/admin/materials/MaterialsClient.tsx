'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, BeakerIcon, ArrowPathIcon, ArchiveBoxXMarkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface MaterialComposition {
    compositionId: string;
    compositionName?: string;
    percentage: number;
}

interface Material {
    id: string;
    name: string;
    category?: string; // Tag/Category Name
    skuRef?: string;
    compositions?: MaterialComposition[];
    isActive: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
}

interface CompositionOption {
    id: string;
    name: string;
    categoryName?: string;
}

interface CategoryOption {
    id: string;
    name: string;
}

export default function AdminMaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [skuRef, setSkuRef] = useState('');
    const [category, setCategory] = useState(''); // Primary Tag
    const [selectedCompositions, setSelectedCompositions] = useState<MaterialComposition[]>([]);

    // Reference Data
    const [availableCompositions, setAvailableCompositions] = useState<CompositionOption[]>([]);
    const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);

    const [showTrash, setShowTrash] = useState(false);
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null; permanent?: boolean }>({
        isOpen: false,
        id: null,
        permanent: false
    });

    useEffect(() => {
        fetchData();
        fetchReferences();
    }, [showTrash]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = showTrash
                ? await apiClient.getDeletedVUFSMaterials()
                : await apiClient.getVUFSMaterials();
            setMaterials(Array.isArray(data) ? data : (data?.materials || []));
        } catch (error) {
            console.error('Failed to fetch materials', error);
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    };

    const fetchReferences = async () => {
        try {
            const comps = await apiClient.getVUFSCompositions();
            setAvailableCompositions(comps || []);
            const cats = await apiClient.getVUFSCompositionCategories();
            setAvailableCategories(cats || []);
        } catch (error) {
            console.error('Failed to load references', error);
        }
    };

    const handleOpenModal = (material?: Material) => {
        if (material) {
            setEditingMaterial(material);
            setName(material.name);
            setSkuRef(material.skuRef || '');
            setCategory(material.category || (availableCategories[0]?.name || 'Natural Plant-Based Fibers'));
            setSelectedCompositions(material.compositions || []);
        } else {
            setEditingMaterial(null);
            setName('');
            setSkuRef('');
            setCategory(availableCategories[0]?.name || 'Natural Plant-Based Fibers');
            setSelectedCompositions([{ compositionId: '', percentage: 100 }]);
        }
        setIsModalOpen(true);
    };

    // Composition Row Handlers
    const updateCompositionRow = (index: number, field: 'compositionId' | 'percentage', value: any) => {
        const updated = [...selectedCompositions];
        if (field === 'percentage') {
            updated[index].percentage = Number(value);
        } else {
            updated[index].compositionId = value;
            updated[index].compositionName = availableCompositions.find(c => c.id === value)?.name;
        }
        setSelectedCompositions(updated);
    };

    const addCompositionRow = () => {
        setSelectedCompositions([...selectedCompositions, { compositionId: '', percentage: 0 }]);
    };

    const removeCompositionRow = (index: number) => {
        const updated = selectedCompositions.filter((_, i) => i !== index);
        setSelectedCompositions(updated);
    };

    const totalPercentage = selectedCompositions.reduce((sum, c) => sum + (c.percentage || 0), 0);

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Name is required'); return; }

        // Validate compositions
        const validCompositions = selectedCompositions.filter(c => c.compositionId);
        if (validCompositions.length > 0 && Math.abs(totalPercentage - 100) > 0.1) {
            toast.error(`Total percentage must be 100% (Current: ${totalPercentage}%)`);
            return;
        }

        try {
            const payloadCompositions = validCompositions.map(c => ({ compositionId: c.compositionId, percentage: c.percentage }));

            if (editingMaterial) {
                await apiClient.updateVUFSMaterial(editingMaterial.id, name, skuRef, payloadCompositions);
                toast.success('Material updated');
            } else {
                await apiClient.addVUFSMaterial(name, category, skuRef, payloadCompositions);
                toast.success('Material added');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save material', error);
            toast.error('Failed to save material');
        }
    };

    const handleDeleteClick = (id: string, permanent = false) => {
        setDeleteModalState({ isOpen: true, id, permanent });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            if (deleteModalState.permanent) {
                await apiClient.permanentlyDeleteVUFSMaterial(deleteModalState.id);
                toast.success('Material permanently deleted');
            } else {
                await apiClient.deleteVUFSMaterial(deleteModalState.id);
                toast.success('Material moved to trash');
            }
            setDeleteModalState({ ...deleteModalState, isOpen: false });
            fetchData();
        } catch (error) {
            toast.error('Failed to delete material');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await apiClient.restoreVUFSMaterial(id);
            toast.success('Material restored');
            fetchData();
        } catch (error) {
            toast.error('Failed to restore material');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-outfit text-gray-900">Materials Library (Fabrics)</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTrash(!showTrash)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showTrash
                                ? 'bg-gray-100 text-gray-900 border-gray-300'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {showTrash ? <ArrowPathIcon className="w-5 h-5" /> : <ArchiveBoxXMarkIcon className="w-5 h-5" />}
                        {showTrash ? 'View Active' : 'Trash'}
                    </button>
                    {!showTrash && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Material
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag (Category)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Composition</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Reference</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading materials...</td></tr>
                            ) : materials.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No materials found</td></tr>
                            ) : materials.map((material) => (
                                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{material.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${material.category?.toLowerCase().includes('natural') ? 'bg-green-100 text-green-800' :
                                                material.category?.toLowerCase().includes('synthetic') ? 'bg-purple-100 text-purple-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {material.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {material.compositions && material.compositions.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {material.compositions.map((c, idx) => (
                                                    <span key={idx} className="text-xs">
                                                        {c.percentage}% {c.compositionName}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">No composition</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {material.skuRef || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {showTrash ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleRestore(material.id)} className="text-green-600 hover:text-green-900" title="Restore">
                                                    <ArrowPathIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(material.id, true)} className="text-red-600 hover:text-red-900" title="Delete Permanently">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenModal(material)} className="text-indigo-600 hover:text-indigo-900">
                                                    <PencilSquareIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(material.id)} className="text-red-600 hover:text-red-900">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold font-outfit">{editingMaterial ? 'Edit Material' : 'Add Material'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="w-6 h-6 text-gray-400" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Material Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. Organic Cotton Denim"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tag (Category)</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    {availableCategories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Internal Reference (SKU Ref)</label>
                                <input
                                    type="text"
                                    value={skuRef}
                                    onChange={(e) => setSkuRef(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        {/* Compositions Section */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Fiber Composition</label>
                                <button type="button" onClick={addCompositionRow} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                                    <PlusIcon className="w-4 h-4" /> Add Fiber
                                </button>
                            </div>

                            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                                {selectedCompositions.map((row, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <select
                                                value={row.compositionId}
                                                onChange={(e) => updateCompositionRow(index, 'compositionId', e.target.value)}
                                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                            >
                                                <option value="">Select Fiber...</option>
                                                {availableCompositions.map(comp => (
                                                    <option key={comp.id} value={comp.id}>{comp.name} ({comp.categoryName})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={row.percentage}
                                                onChange={(e) => updateCompositionRow(index, 'percentage', e.target.value)}
                                                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none pr-6"
                                            />
                                            <span className="absolute right-2 top-2 text-gray-400 text-xs">%</span>
                                        </div>
                                        <button onClick={() => removeCompositionRow(index)} className="text-gray-400 hover:text-red-500">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {selectedCompositions.length === 0 && (
                                    <div className="text-sm text-gray-500 text-center py-2">No composition defined. Add a fiber.</div>
                                )}
                                <div className={`text-right text-sm font-medium ${Math.abs(totalPercentage - 100) < 0.1 ? 'text-green-600' : 'text-orange-600'}`}>
                                    Total: {totalPercentage}%
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Material</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={deleteModalState.permanent ? "Delete Permanently?" : "Move to Trash?"}
                message={deleteModalState.permanent
                    ? "This action cannot be undone. The material will be permanently removed."
                    : "The material will be moved to trash and can be restored later."}
            />
        </div>
    );
}
