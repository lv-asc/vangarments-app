'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { TrashIcon, PencilSquareIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface SizeConversion {
    standard: string;
    value: string;
}

interface Size {
    id: string;
    name: string;
    sortOrder: number;
    conversions: SizeConversion[];
    validCategoryIds: number[];
    isActive: boolean;
}

interface Category {
    id: string;
    name: string;
    level: string;
}

export default function AdminSizesPage() {
    const [sizes, setSizes] = useState<Size[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<Size | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [sortOrder, setSortOrder] = useState<number>(0);
    const [conversions, setConversions] = useState<SizeConversion[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sizesData, categoriesRes] = await Promise.all([
                apiClient.getAllSizes(),
                apiClient.getVUFSCategories()
            ]);
            setSizes(sizesData || []);
            // Assuming categoriesRes might be wrapper or array
            const catArr = Array.isArray(categoriesRes) ? categoriesRes : ((categoriesRes as any).categories || []);
            setCategories(catArr);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (size?: Size) => {
        if (size) {
            setEditingSize(size);
            setName(size.name);
            setSortOrder(size.sortOrder || 0);
            setConversions(size.conversions || []);
            setSelectedCategoryIds(size.validCategoryIds || []);
        } else {
            setEditingSize(null);
            setName('');
            setSortOrder(0);
            setConversions([]);
            setSelectedCategoryIds([]);
        }
        setIsModalOpen(true);
    };

    const handleAddConversion = () => {
        setConversions([...conversions, { standard: '', value: '' }]);
    };

    const handleUpdateConversion = (index: number, field: 'standard' | 'value', val: string) => {
        const newConversions = [...conversions];
        newConversions[index][field] = val;
        setConversions(newConversions);
    };

    const handleRemoveConversion = (index: number) => {
        setConversions(conversions.filter((_, i) => i !== index));
    };

    const toggleCategorySelection = (catIdStr: string) => {
        const catId = parseInt(catIdStr);
        setSelectedCategoryIds(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleSave = async () => {
        try {
            const payload = {
                name,
                sortOrder,
                conversions: conversions.filter(c => c.standard && c.value), // Filter empty
                validCategoryIds: selectedCategoryIds
            };

            if (editingSize) {
                await apiClient.updateSize(editingSize.id, payload);
            } else {
                await apiClient.createSize(payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save size', error);
            alert('Failed to save size');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this size?')) return;
        try {
            await apiClient.deleteSize(id);
            fetchData();
        } catch (error) {
            console.error('Failed to delete size', error);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sizes Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage sizes, conversions, and category restrictions.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Size
                </button>
            </div>

            {/* Sizes List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {sizes.map((size) => (
                        <li key={size.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center text-sm font-medium text-indigo-600 truncate">
                                            <span className="text-lg mr-2 font-bold">{size.name}</span>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Order: {size.sortOrder}</span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            <p className="font-semibold mb-1">Conversions:</p>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {size.conversions && size.conversions.length > 0 ? (
                                                    size.conversions.map((conv, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            {conv.standard}: {conv.value}
                                                        </span>
                                                    ))
                                                ) : <span className="text-xs text-gray-400">None</span>}
                                            </div>

                                            <p className="font-semibold mb-1">Valid Categories:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {size.validCategoryIds && size.validCategoryIds.length > 0 ? (
                                                    // In a real app we would map IDs to names, for now just count or IDs if lazy. 
                                                    // Better: Compute names from category list
                                                    size.validCategoryIds.map(id => {
                                                        const cat = categories.find(c => parseInt(c.id) === id);
                                                        return cat ? (
                                                            <span key={id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                {cat.name}
                                                            </span>
                                                        ) : null;
                                                    })
                                                ) : <span className="text-xs text-gray-400">All (No restrictions)</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5 flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(size)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(size.id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{editingSize ? 'Edit Size' : 'Add Size'}</h3>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                                    <input
                                        type="number"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(parseInt(e.target.value))}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                            </div>

                            {/* Conversions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Conversions (Standard to Value)</label>
                                {conversions.map((conv, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Standard (e.g. BR)"
                                            value={conv.standard}
                                            onChange={(e) => handleUpdateConversion(idx, 'standard', e.target.value)}
                                            className="flex-1 border-gray-300 rounded-md shadow-sm text-sm border p-2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value (e.g. G)"
                                            value={conv.value}
                                            onChange={(e) => handleUpdateConversion(idx, 'value', e.target.value)}
                                            className="flex-1 border-gray-300 rounded-md shadow-sm text-sm border p-2"
                                        />
                                        <button
                                            onClick={() => handleRemoveConversion(idx)}
                                            className="text-red-600 hover:text-red-800 p-2"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddConversion} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    + Add Conversion
                                </button>
                            </div>

                            {/* Valid Categories */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Categories (Select strictly applicable)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleCategorySelection(cat.id)}
                                            className={`text-left px-2 py-1.5 rounded text-xs font-medium transition-colors truncate ${selectedCategoryIds.includes(parseInt(cat.id))
                                                ? 'bg-indigo-100 text-indigo-800'
                                                : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCategoryIds.includes(parseInt(cat.id))}
                                                readOnly
                                                className="mr-2 pointer-events-none"
                                            />
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">If none selected, this size applies to ALL.</p>
                            </div>
                        </div>

                        <div className="mt-5 sm:mt-6 flex justify-end gap-3">
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
            )}
        </div>
    );
}
