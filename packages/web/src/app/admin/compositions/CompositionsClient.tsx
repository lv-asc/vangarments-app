'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, BeakerIcon, ArchiveBoxXMarkIcon, FolderIcon, TagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CompositionCategory {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    isDeleted?: boolean;
}

interface Composition {
    id: string;
    name: string;
    categoryId: string;
    categoryName?: string;
    description?: string;
    isActive: boolean;
    isDeleted?: boolean;
}

export default function CompositionsClient() {
    const [activeTab, setActiveTab] = useState<'categories' | 'compositions'>('categories');

    // Categories State
    const [categories, setCategories] = useState<CompositionCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<CompositionCategory | null>(null);
    const [catName, setCatName] = useState('');
    const [catDesc, setCatDesc] = useState('');

    // Compositions State
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const [loadingCompositions, setLoadingCompositions] = useState(true);
    const [isCompModalOpen, setIsCompModalOpen] = useState(false);
    const [editingComp, setEditingComp] = useState<Composition | null>(null);
    const [compName, setCompName] = useState('');
    const [compCategoryId, setCompCategoryId] = useState('');
    const [compDesc, setCompDesc] = useState('');

    // Delete Modal
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'category' | 'composition'; id: string | null; name: string }>({
        isOpen: false,
        type: 'category',
        id: null,
        name: ''
    });

    useEffect(() => {
        fetchCategories();
        fetchCompositions();
    }, []);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const data = await apiClient.getVUFSCompositionCategories();
            setCategories(data || []);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            toast.error('Failed to load categories');
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchCompositions = async () => {
        setLoadingCompositions(true);
        try {
            const data = await apiClient.getVUFSCompositions();
            setCompositions(data || []);
        } catch (error) {
            console.error('Failed to fetch compositions', error);
            toast.error('Failed to load compositions');
        } finally {
            setLoadingCompositions(false);
        }
    };

    // Category Handlers
    const handleOpenCatModal = (cat?: CompositionCategory) => {
        if (cat) {
            setEditingCat(cat);
            setCatName(cat.name);
            setCatDesc(cat.description || '');
        } else {
            setEditingCat(null);
            setCatName('');
            setCatDesc('');
        }
        setIsCatModalOpen(true);
    };

    const handleSaveCat = async () => {
        if (!catName.trim()) { toast.error('Name required'); return; }
        try {
            if (editingCat) {
                await apiClient.updateVUFSCompositionCategory(editingCat.id, catName, catDesc);
                toast.success('Category updated');
            } else {
                await apiClient.addVUFSCompositionCategory(catName, catDesc);
                toast.success('Category added');
            }
            setIsCatModalOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error('Failed to save category');
        }
    };

    // Composition Handlers
    const handleOpenCompModal = (comp?: Composition) => {
        if (comp) {
            setEditingComp(comp);
            setCompName(comp.name);
            setCompCategoryId(comp.categoryId);
            setCompDesc(comp.description || '');
        } else {
            setEditingComp(null);
            setCompName('');
            setCompCategoryId(categories[0]?.id || '');
            setCompDesc('');
        }
        setIsCompModalOpen(true);
    };

    const handleSaveComp = async () => {
        if (!compName.trim() || !compCategoryId) { toast.error('Name and Category required'); return; }
        try {
            if (editingComp) {
                await apiClient.updateVUFSComposition(editingComp.id, compName, compCategoryId, compDesc);
                toast.success('Composition updated');
            } else {
                await apiClient.addVUFSComposition(compName, compCategoryId, compDesc);
                toast.success('Composition added');
            }
            setIsCompModalOpen(false);
            fetchCompositions();
        } catch (error) {
            toast.error('Failed to save composition');
        }
    };

    // Delete Handlers
    const handleDeleteClick = (type: 'category' | 'composition', item: any) => {
        setDeleteModal({ isOpen: true, type, id: item.id, name: item.name });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            if (deleteModal.type === 'category') {
                await apiClient.deleteVUFSCompositionCategory(deleteModal.id);
                fetchCategories();
            } else {
                await apiClient.deleteVUFSComposition(deleteModal.id);
                fetchCompositions();
            }
            toast.success(`${deleteModal.type === 'category' ? 'Category' : 'Composition'} deleted`);
            setDeleteModal({ ...deleteModal, isOpen: false });
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-outfit text-gray-900">Fiber Compositions</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => activeTab === 'categories' ? handleOpenCatModal() : handleOpenCompModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add {activeTab === 'categories' ? 'Category' : 'Composition'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'categories'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <FolderIcon className="w-5 h-5" />
                        Fiber Categories (Tags)
                    </button>
                    <button
                        onClick={() => setActiveTab('compositions')}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'compositions'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <BeakerIcon className="w-5 h-5" />
                        Compositions / Fibers
                    </button>
                </nav>
            </div>

            {/* Content */}
            {activeTab === 'categories' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{cat.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenCatModal(cat)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteClick('category', cat)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && !loadingCategories && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No categories found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category (Tag)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {compositions.map((comp) => (
                                <tr key={comp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {comp.categoryName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{comp.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenCompModal(comp)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteClick('composition', comp)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Category Modal */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold">{editingCat ? 'Edit Category' : 'Add Category'}</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={catName}
                                onChange={(e) => setCatName(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={catDesc}
                                onChange={(e) => setCatDesc(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveCat} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Composition Modal */}
            {isCompModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold">{editingComp ? 'Edit Composition' : 'Add Composition'}</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={compName}
                                onChange={(e) => setCompName(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                value={compCategoryId}
                                onChange={(e) => setCompCategoryId(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select Category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={compDesc}
                                onChange={(e) => setCompDesc(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button onClick={() => setIsCompModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveComp} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete ${deleteModal.name}? This action cannot be undone.`}
            />
        </div>
    );
}
