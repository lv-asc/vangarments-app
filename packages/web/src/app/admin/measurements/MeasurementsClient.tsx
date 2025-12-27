'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Ruler icon component
const RulerIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

interface Measurement {
    id: string;
    name: string;
    isActive: boolean;
}

export default function AdminMeasurementsPage() {
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
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
            // Try to get measurements, fallback to empty if endpoint doesn't exist
            const data = await apiClient.getVUFSAttributeValues('measurement').catch(() => []);
            setMeasurements(Array.isArray(data) ? data : (data?.values || []));
        } catch (error) {
            console.error('Failed to fetch measurements', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (measurement?: Measurement) => {
        if (measurement) {
            setEditingMeasurement(measurement);
            setName(measurement.name);
        } else {
            setEditingMeasurement(null);
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
            if (editingMeasurement) {
                await apiClient.updateVUFSAttributeValue(editingMeasurement.id, { name });
                toast.success('Measurement updated');
            } else {
                await apiClient.addVUFSAttributeValue('measurement', name);
                toast.success('Measurement added');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save measurement', error);
            toast.error('Failed to save measurement');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            await apiClient.deleteVUFSAttributeValue(deleteModalState.id);
            toast.success('Measurement deleted');
            fetchData();
        } catch (error) {
            console.error('Failed to delete measurement', error);
            toast.error('Failed to delete measurement');
        } finally {
            setDeleteModalState({ isOpen: false, id: null });
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Measurements Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage body measurement fields and types.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-stone-600 hover:bg-stone-700"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Measurement
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {measurements.map((measurement) => (
                        <li key={measurement.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        <RulerIcon className="h-8 w-8 text-stone-500 mr-4" />
                                        <p className="font-medium text-stone-600">{measurement.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(measurement)}
                                            className="text-stone-600 hover:text-stone-900 bg-stone-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(measurement.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {measurements.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No measurements found. Add a measurement to get started.
                        </li>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingMeasurement ? 'Edit Measurement' : 'Add Measurement'}
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                placeholder="e.g. Chest, Waist, Hip, Inseam"
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
                                className="px-4 py-2 text-sm font-medium text-white bg-stone-600 rounded-md hover:bg-stone-700"
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
                title="Delete Measurement"
                message="Are you sure you want to delete this measurement type?"
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
