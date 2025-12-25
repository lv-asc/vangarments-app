'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Gender {
    id: string;
    name: string;
    isActive: boolean;
}

export default function AdminGendersPage() {
    const [genders, setGenders] = useState<Gender[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Edit State
    const [editingGender, setEditingGender] = useState<Gender | null>(null);
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
            const data = await apiClient.getVUFSGenders();
            setGenders(data || []);
        } catch (error) {
            console.error('Failed to fetch genders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (gender?: Gender) => {
        if (gender) {
            setEditingGender(gender);
            setName(gender.name);
        } else {
            setEditingGender(null);
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        try {
            if (editingGender) {
                await apiClient.updateVUFSGender(editingGender.id, name);
            } else {
                await apiClient.addVUFSGender(name);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save gender', error);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        const { id } = deleteModalState;
        if (!id) return;

        try {
            await apiClient.deleteVUFSGender(id);
            fetchData();
        } catch (error) {
            console.error('Failed to delete gender', error);
        } finally {
            setDeleteModalState({ isOpen: false, id: null });
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Genders Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage gender options.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Gender
                </button>
            </div>

            {/* List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {genders.map((gender) => (
                        <li key={gender.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="p-2 bg-pink-50 rounded-full text-pink-600">
                                            <UserGroupIcon className="h-5 w-5" />
                                        </span>
                                        <p className="font-medium text-gray-900 truncate">{gender.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOpenModal(gender)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(gender.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {genders.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500 text-sm">
                            No genders defined. Add "Men", "Women", or "Unisex".
                        </li>
                    )}
                </ul>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{editingGender ? 'Edit Gender' : 'Add Gender'}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Men"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
                title="Delete Gender"
                message="Are you sure you want to delete this gender? This action cannot be undone."
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
