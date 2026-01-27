'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, AdjustmentsHorizontalIcon, ArrowPathIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Fit {
    id: string;
    name: string;
    isActive: boolean;
    associatedCategories?: string[];
    skuRef?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}

export default function AdminFitsPage() {
    const [fits, setFits] = useState<Fit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFit, setEditingFit] = useState<Fit | null>(null);
    const [name, setName] = useState('');
    const [skuRef, setSkuRef] = useState('');
    const [apparelCategories, setApparelCategories] = useState<any[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [showTrash, setShowTrash] = useState(false);
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null; permanent?: boolean }>({
        isOpen: false,
        id: null,
        permanent: false
    });

    useEffect(() => {
        fetchData();
    }, [showTrash]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fitsData, apparelData] = await Promise.all([
                showTrash ? apiClient.getDeletedVUFSFits() : apiClient.getVUFSFits(),
                apiClient.getVUFSAttributeValues('apparel')
            ]);
            setFits(Array.isArray(fitsData) ? fitsData : (fitsData?.fits || []));
            setApparelCategories(apparelData || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (fit?: Fit) => {
        if (fit) {
            setEditingFit(fit);
            setName(fit.name);
            setSkuRef(fit.skuRef || '');
            setSelectedCategoryIds(fit.associatedCategories || []);
        } else {
            setEditingFit(null);
            setName('');
            setSkuRef('');
            setSelectedCategoryIds([]);
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }
        try {
            if (editingFit) {
                await apiClient.updateVUFSFit(editingFit.id, name, selectedCategoryIds, skuRef);
                toast.success('Fit updated');
            } else {
                await apiClient.addVUFSFit(name, skuRef);
                toast.success('Fit added');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save fit', error);
            toast.error('Failed to save fit');
        }
    };

    const handleDeleteClick = (id: string, permanent = false) => {
        setDeleteModalState({ isOpen: true, id, permanent });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            if (deleteModalState.permanent) {
                await apiClient.permanentlyDeleteVUFSFit(deleteModalState.id);
                toast.success('Fit permanently deleted');
            } else {
                await apiClient.deleteVUFSFit(deleteModalState.id);
                toast.success('Fit moved to trash');
            }
            fetchData();
        } catch (error) {
            console.error('Failed to delete fit', error);
            toast.error('Failed to delete fit');
        } finally {
            setDeleteModalState({ isOpen: false, id: null, permanent: false });
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await apiClient.restoreVUFSFit(id);
            toast.success('Fit restored');
            fetchData();
        } catch (error) {
            console.error('Failed to restore fit', error);
            toast.error('Failed to restore fit');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fits Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage fit types and silhouettes.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowTrash(!showTrash)}
                        className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${showTrash
                                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                    >
                        <ArchiveBoxXMarkIcon className="-ml-1 mr-2 h-5 w-5" />
                        {showTrash ? 'View Active' : 'View Trash'}
                    </button>
                    {!showTrash && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Add Fit
                        </button>
                    )}
                </div>
            </div>

            {showTrash && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                        <strong>Trash:</strong> Items here can be restored or permanently deleted.
                    </p>
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {fits.map((fit) => (
                        <li key={fit.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        <AdjustmentsHorizontalIcon className="h-8 w-8 text-sky-500 mr-4" />
                                        <div>
                                            <p className="font-medium text-sky-600">{fit.name}</p>
                                            {fit.skuRef && (
                                                <p className="text-xs text-gray-500">SKU: {fit.skuRef}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {showTrash ? (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(fit.id)}
                                                    className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full"
                                                    title="Restore"
                                                >
                                                    <ArrowPathIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(fit.id, true)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                                    title="Delete Permanently"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleOpenModal(fit)}
                                                    className="text-sky-600 hover:text-sky-900 bg-sky-50 p-2 rounded-full"
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(fit.id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {fits.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            {showTrash ? 'Trash is empty' : 'No fits found'}
                        </li>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingFit ? 'Edit Fit' : 'Add Fit'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    placeholder="e.g. Slim, Regular, Loose"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU Ref (2 chars)</label>
                                <input
                                    type="text"
                                    value={skuRef}
                                    onChange={(e) => setSkuRef(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2 uppercase"
                                    placeholder="e.g. SL"
                                    maxLength={4}
                                />
                            </div>

                            {editingFit && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Apparel</label>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                                        {apparelCategories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategoryIds.includes(cat.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                                                        } else {
                                                            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                <span className="text-sm text-gray-700">{cat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Select which apparel categories this fit applies to.</p>
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
                                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
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
                title={deleteModalState.permanent ? 'Permanently Delete Fit' : 'Move Fit to Trash'}
                message={deleteModalState.permanent
                    ? 'This action cannot be undone. The fit will be permanently deleted.'
                    : 'This fit will be moved to trash. You can restore it later.'}
                variant="danger"
                confirmText={deleteModalState.permanent ? 'Delete Forever' : 'Move to Trash'}
            />
        </div>
    );
}
