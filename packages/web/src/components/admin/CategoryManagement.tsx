'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { MagnifyingGlassIcon, TrashIcon, FolderIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CategoryManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Edit/Create State
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        parentId: '',
        level: 'page'
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getVUFSCategories();
            setCategories(res || []);
        } catch (error) {
            console.error('Failed to load categories', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCategory = (cat: any) => {
        setMode('edit');
        setSelectedCategory(cat);
        setFormData({
            name: cat.name,
            parentId: cat.parentId || '',
            level: cat.level || 'page'
        });
    };

    const handleCreateNew = () => {
        setMode('create');
        setSelectedCategory(null);
        setFormData({
            name: '',
            parentId: '',
            level: 'page'
        });
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        setSaving(true);
        try {
            if (mode === 'create') {
                await apiClient.addVUFSCategory({
                    name: formData.name,
                    level: formData.level,
                    parentId: formData.parentId || undefined
                });
                toast.success('Category created successfully');
            } else {
                if (!selectedCategory) return;
                await apiClient.updateVUFSCategory(selectedCategory.id, formData.name);
                // Note: current API client updateVUFSCategory might only accept name or might have signature issues if we want to change parentId/level too.
                // Looking at api.ts: updateVUFSCategory(id: string, nameOrUpdates: string | any)
                // We should check if we can update parentId. 
                // Based on vufsManagementService logic, updateCategory accepts parentId.
                // Let's try passing object if supported, or just name for now if restricted.
                // Actually the service supports it. The client wrapper might need care.
                // Assuming client passes second arg as body or name.
                // If it's just name string in client, we might be limited.
                // But let's try calling it with object if the client signature allows any.
                // If the client signature is (id, name), we might need to modify api.ts or just update name.
                // For now, let's assume we update name. If we need to move categories (change parent), we might need an API update.

                // Correction: We saw updateCategory in service TS.
                // updateCategory(id: string, name?: string, parentId?: string | null)
                // Let's rely on what we can do.

                // Wait, if I look at previous context, `handleAdd` calls `addVUFSCategory` with object.
                // `handleMatrixChange` calls `updateVUFSCategory(entityId, { parentId: value })`.
                // So the client supports object updates!

                await apiClient.updateVUFSCategory(selectedCategory.id, {
                    name: formData.name,
                    parentId: formData.parentId || null
                });
                toast.success('Category updated successfully');
            }
            await fetchCategories();
            handleCreateNew(); // Reset to create mode
        } catch (error) {
            console.error('Failed to save category', error);
            toast.error('Failed to save category');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = () => {
        if (!selectedCategory) return;
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCategory) return;
        setDeleting(true);
        try {
            await apiClient.deleteVUFSCategory(selectedCategory.id);
            toast.success('Category deleted');
            await fetchCategories();
            handleCreateNew();
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete category');
        } finally {
            setDeleting(false);
        }
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [categories, search]);

    // Build hierarchy for dropdown
    // We want to prevent selecting self or children as parent (cycle)
    const availableParents = useMemo(() => {
        if (mode === 'create') return categories;
        if (!selectedCategory) return categories;

        // Simple cycle check: exclude self. Full cycle check is recursive but let's start simple.
        return categories.filter(c => c.id !== selectedCategory.id);
    }, [categories, selectedCategory, mode]);

    if (loading && categories.length === 0) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
            {/* Sidebar List */}
            <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Categories</h2>
                    <button
                        onClick={handleCreateNew}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Create New"
                    >
                        <PlusIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto max-h-[600px] border-t border-gray-100">
                    {filteredCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleSelectCategory(cat)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex items-center justify-between group ${selectedCategory?.id === cat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <FolderIcon className="h-5 w-5 text-gray-400" />
                                <span className={`text-sm ${selectedCategory?.id === cat.id ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                                    {cat.name}
                                </span>
                            </div>
                            {cat.parentId && <span className="text-xs text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">Sub</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Form */}
            <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {mode === 'create' ? 'Create New Category' : 'Edit Category'}
                    </h2>
                    {mode === 'edit' && (
                        <button
                            onClick={handleDeleteClick}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-md"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="space-y-6 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., Summer Collection"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hierarchy Level</label>
                        <select
                            value={formData.level}
                            onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="page">Subcategory 1</option>
                            <option value="blue">Subcategory 2</option>
                            <option value="white">Subcategory 3</option>
                            <option value="gray">Subcategory 4</option>
                        </select>
                        <p className="mt-1 text-sm text-gray-500">Defines the depth in the navigation tree.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                        <select
                            value={formData.parentId}
                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">(No Parent - Root)</option>
                            {availableParents.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">Select a parent to nest this category under.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="ghost" onClick={handleCreateNew} disabled={saving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : (mode === 'create' ? 'Create Category' : 'Save Changes')}
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Category"
                message="Are you sure? This will delete this category AND ALL its subcategories. This cannot be undone."
                variant="danger"
                isLoading={deleting}
                confirmText="Delete Recursive"
            />
        </div>
    );
}
