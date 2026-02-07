'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Condition {
    id: string;
    name: string;
    rating: number;
    sortOrder?: number;
    group: 'new' | 'used';
    isActive: boolean;
}

export default function ConditionsClient() {
    const [conditions, setConditions] = useState<Condition[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCondition, setEditingCondition] = useState<Condition | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [rating, setRating] = useState(10);
    const [group, setGroup] = useState<'new' | 'used'>('new');

    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    useEffect(() => {
        fetchConditions();
    }, []);

    const fetchConditions = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getAllConditions();
            setConditions(data || []);
        } catch (error) {
            console.error('Failed to fetch conditions', error);
            toast.error('Failed to load conditions');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (condition?: Condition) => {
        if (condition) {
            setEditingCondition(condition);
            setName(condition.name);
            setRating(condition.rating);
            setGroup(condition.group);
        } else {
            setEditingCondition(null);
            setName('');
            setRating(10);
            setGroup('new');
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        // Check for duplicates in the same group
        const isDuplicate = conditions.some(c =>
            c.group === group &&
            c.name.trim().toLowerCase() === name.trim().toLowerCase() &&
            c.id !== editingCondition?.id
        );

        if (isDuplicate) {
            toast.error(`A condition named "${name}" already exists in the ${group} group.`);
            return;
        }

        try {
            // Preserve existing sortOrder or default to 0
            const sortOrder = editingCondition?.sortOrder ?? 0;
            const payload = { name, rating, group, sortOrder };

            if (editingCondition) {
                await apiClient.updateCondition(editingCondition.id, payload);
                toast.success('Condition updated successfully');
            } else {
                await apiClient.createCondition(payload);
                toast.success('Condition created successfully');
            }

            setIsModalOpen(false);
            fetchConditions();
        } catch (error) {
            console.error('Failed to save condition', error);
            toast.error('Failed to save condition');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModalState({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        const { id } = deleteModalState;
        if (!id) return;

        try {
            await apiClient.deleteCondition(id);
            toast.success('Condition deleted successfully');
            fetchConditions();
        } catch (error) {
            console.error('Failed to delete condition', error);
            toast.error('Failed to delete condition');
        } finally {
            setDeleteModalState({ isOpen: false, id: null });
        }
    };

    const newConditions = conditions
        .filter(c => c.group === 'new')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || b.rating - a.rating);
    const usedConditions = conditions
        .filter(c => c.group === 'used')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || b.rating - a.rating);

    const handleMove = async (id: string, direction: 'up' | 'down', group: 'new' | 'used') => {
        const list = group === 'new' ? newConditions : usedConditions;
        const index = list.findIndex(c => c.id === id);
        if (index === -1) return;

        const otherIndex = direction === 'up' ? index - 1 : index + 1;
        if (otherIndex < 0 || otherIndex >= list.length) return;

        const currentItem = list[index];
        const otherItem = list[otherIndex];

        // Swap sort orders
        // Use index as the base sort order to ensure continuity if numbers are messy
        const newSortOrderCurrent = otherIndex;
        const newSortOrderOther = index;

        // Optimistic update
        const updatedConditions = conditions.map(c => {
            if (c.id === currentItem.id) return { ...c, sortOrder: newSortOrderCurrent };
            if (c.id === otherItem.id) return { ...c, sortOrder: newSortOrderOther };
            return c;
        });
        setConditions(updatedConditions);

        try {
            await Promise.all([
                apiClient.updateCondition(currentItem.id, { sortOrder: newSortOrderCurrent }),
                apiClient.updateCondition(otherItem.id, { sortOrder: newSortOrderOther })
            ]);
        } catch (error) {
            console.error('Failed to update order:', error);
            toast.error('Failed to update order');
            fetchConditions(); // Revert on error
        }
    };


    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Wardrobe Item Conditions</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage condition ratings for wardrobe items (6/10 to 10/10 scale)
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Condition
                    </button>
                </div>
            </div>

            {/* Conditions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* New Conditions */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-green-50 border-b border-green-200">
                        <h3 className="text-lg leading-6 font-medium text-green-900">New Conditions</h3>
                        <p className="mt-1 max-w-2xl text-sm text-green-700">Items in new or near-new condition</p>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200">
                        {newConditions.length === 0 ? (
                            <li className="px-4 py-8 text-center text-sm text-gray-500">
                                No new conditions defined
                            </li>
                        ) : (
                            newConditions.map((condition) => (
                                <li key={condition.id} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    {condition.name}
                                                </p>
                                                <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                                                    {condition.sortOrder !== undefined && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded uppercase tracking-wider">
                                                            Order: {condition.sortOrder}
                                                        </span>
                                                    )}
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {condition.rating}/10
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 flex gap-2 items-center">
                                            <div className="flex flex-col gap-1 mr-2">
                                                <button
                                                    onClick={() => handleMove(condition.id, 'up', 'new')}
                                                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100"
                                                    title="Move Up"
                                                >
                                                    <ArrowUpIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleMove(condition.id, 'down', 'new')}
                                                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100"
                                                    title="Move Down"
                                                >
                                                    <ArrowDownIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleOpenModal(condition)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(condition.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Used Conditions */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b border-blue-200">
                        <h3 className="text-lg leading-6 font-medium text-blue-900">Used Conditions</h3>
                        <p className="mt-1 max-w-2xl text-sm text-blue-700">Items showing signs of wear</p>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200">
                        {usedConditions.length === 0 ? (
                            <li className="px-4 py-8 text-center text-sm text-gray-500">
                                No used conditions defined
                            </li>
                        ) : (
                            usedConditions.map((condition) => (
                                <li key={condition.id} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-600 truncate">
                                                    {condition.name}
                                                </p>
                                                <div className="ml-2 flex-shrink-0 flex items-center gap-2">
                                                    {condition.sortOrder !== undefined && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded uppercase tracking-wider">
                                                            Order: {condition.sortOrder}
                                                        </span>
                                                    )}
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {condition.rating}/10
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 flex gap-2 items-center">
                                            <div className="flex flex-col gap-1 mr-2">
                                                <button
                                                    onClick={() => handleMove(condition.id, 'up', 'used')}
                                                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100"
                                                    title="Move Up"
                                                >
                                                    <ArrowUpIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleMove(condition.id, 'down', 'used')}
                                                    className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100"
                                                    title="Move Down"
                                                >
                                                    <ArrowDownIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleOpenModal(condition)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(condition.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingCondition ? 'Edit Condition' : 'Add Condition'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., New w/ Tag, Used (9/10)"
                                        className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-gray-900 focus:border-gray-900 sm:text-sm border p-2.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rating (/10)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={rating}
                                        onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
                                        className="mt-1 block w-full border-gray-300 rounded-xl shadow-sm focus:ring-gray-900 focus:border-gray-900 sm:text-sm border p-2.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adjust Rating Slider</label>
                                    <input
                                        type="range"
                                        min="6"
                                        max="10"
                                        step="0.5"
                                        value={rating}
                                        onChange={(e) => setRating(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>6/10</span>
                                        <span>10/10</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="new"
                                                checked={group === 'new'}
                                                onChange={(e) => setGroup(e.target.value as 'new' | 'used')}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">New</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="used"
                                                checked={group === 'used'}
                                                onChange={(e) => setGroup(e.target.value as 'new' | 'used')}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Used</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title="Delete Condition"
                message="Are you sure you want to delete this condition? This action cannot be undone."
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
