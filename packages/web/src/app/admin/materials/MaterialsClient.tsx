'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, BeakerIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Material {
    id: string;
    name: string;
    category?: string;
    skuRef?: string;
    isActive: boolean;
}

export default function AdminMaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [name, setName] = useState('');
    const [skuRef, setSkuRef] = useState('');
    const [category, setCategory] = useState<'natural' | 'synthetic' | 'blend'>('natural');
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getVUFSMaterials();
            setMaterials(Array.isArray(data) ? data : (data?.materials || []));
        } catch (error) {
            console.error('Failed to fetch materials', error);
            toast.error('Failed to load materials');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (material?: Material) => {
        if (material) {
            setEditingMaterial(material);
            setName(material.name);
            setSkuRef(material.skuRef || '');
            setCategory((material.category as any) || 'natural');
        } else {
            setEditingMaterial(null);
            setName('');
            setSkuRef('');
            setCategory('natural');
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        try {
            if (editingMaterial) {
                await apiClient.updateVUFSMaterial(editingMaterial.id, name, skuRef);
                toast.success('Material updated');
            } else {
                await apiClient.addVUFSMaterial(name, category, skuRef);
                toast.success('Material added');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save material', error);
            toast.error('Failed to save material');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            await apiClient.deleteVUFSMaterial(deleteModalState.id);
            toast.success('Material deleted');
            fetchData();
        } catch (error) {
            console.error('Failed to delete material', error);
            toast.error('Failed to delete material');
        } finally {
            setDeleteModalState({ isOpen: false, id: null });
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage fabric and material types.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Material
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {materials.map((material) => (
                        <li key={material.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        <BeakerIcon className="h-8 w-8 text-green-500 mr-4" />
                                        <div>
                                            <p className="font-medium text-green-600">{material.name}</p>
                                            {material.category && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {material.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(material)}
                                            className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(material.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {materials.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">No materials found</li>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingMaterial ? 'Edit Material' : 'Add Material'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    placeholder="e.g. Cotton, Silk, Polyester"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU Ref (2 chars)</label>
                                <input
                                    type="text"
                                    value={skuRef}
                                    onChange={(e) => setSkuRef(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2 uppercase"
                                    placeholder="e.g. CT"
                                    maxLength={4}
                                />
                            </div>
                            {!editingMaterial && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as any)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    >
                                        <option value="natural">Natural</option>
                                        <option value="synthetic">Synthetic</option>
                                        <option value="blend">Blend</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Delete Material"
                message="Are you sure you want to delete this material?"
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
