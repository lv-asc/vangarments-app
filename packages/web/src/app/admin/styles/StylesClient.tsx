'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Style {
    id: string;
    name: string;
    isActive: boolean;
}

export default function AdminStylesPage() {
    const [styles, setStyles] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<Style | null>(null);
    const [name, setName] = useState('');
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
            const data = await apiClient.getVUFSAttributeValues('style');
            setStyles(Array.isArray(data) ? data : (data?.styles || []));
        } catch (error) {
            console.error('Failed to fetch styles', error);
            toast.error('Failed to load styles');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (style?: Style) => {
        if (style) {
            setEditingStyle(style);
            setName(style.name);
        } else {
            setEditingStyle(null);
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        try {
            if (editingStyle) {
                await apiClient.updateVUFSAttributeValue(editingStyle.id, { name });
                toast.success('Style updated');
            } else {
                await apiClient.addVUFSAttributeValue('style', name);
                toast.success('Style added');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save style', error);
            toast.error('Failed to save style');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            await apiClient.deleteVUFSAttributeValue(deleteModalState.id);
            toast.success('Style deleted');
            fetchData();
        } catch (error) {
            console.error('Failed to delete style', error);
            toast.error('Failed to delete style');
        } finally {
            setDeleteModalState({ isOpen: false, id: null });
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Styles Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage apparel style types and categories.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Style
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {styles.map((style) => (
                        <li key={style.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        <SparklesIcon className="h-8 w-8 text-purple-500 mr-4" />
                                        <p className="font-medium text-purple-600">{style.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(style)}
                                            className="text-purple-600 hover:text-purple-900 bg-purple-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(style.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {styles.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">No styles found</li>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingStyle ? 'Edit Style' : 'Add Style'}
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                placeholder="e.g. Activewear, Vintage, Cargo"
                            />
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
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
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
                title="Delete Style"
                message="Are you sure you want to delete this style type?"
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
