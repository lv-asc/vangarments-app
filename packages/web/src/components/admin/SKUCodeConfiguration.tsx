'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckIcon, PencilSquareIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface AttributeItem {
    id: string;
    name: string;
    skuRef?: string;
    hexCode?: string;
}

type TabType = 'apparel' | 'sizes' | 'colors' | 'materials' | 'patterns' | 'styles' | 'fits' | 'genders' | 'conditions';

const TABS: { id: TabType; label: string }[] = [
    { id: 'apparel', label: 'Apparel' },
    { id: 'sizes', label: 'Sizes' },
    { id: 'colors', label: 'Colors' },
    { id: 'materials', label: 'Materials' },
    { id: 'patterns', label: 'Patterns' },
    { id: 'styles', label: 'Styles' },
    { id: 'fits', label: 'Fits' },
    { id: 'genders', label: 'Genders' },
    { id: 'conditions', label: 'Conditions' }
];

export default function SKUCodeConfiguration() {
    const [activeTab, setActiveTab] = useState<TabType>('apparel');
    const [items, setItems] = useState<AttributeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null; itemName: string }>({
        isOpen: false,
        itemId: null,
        itemName: ''
    });

    useEffect(() => {
        fetchItems(activeTab);
    }, [activeTab]);

    const fetchItems = async (tab: TabType) => {
        setLoading(true);
        try {
            let data: any[] = [];
            switch (tab) {
                case 'apparel':
                    data = await apiClient.getVUFSAttributeValues('apparel');
                    break;
                case 'sizes':
                    data = await apiClient.getVUFSSizes();
                    break;
                case 'colors':
                    data = await apiClient.getVUFSColors();
                    break;
                case 'materials':
                    data = await apiClient.getVUFSMaterials();
                    break;
                case 'patterns':
                    data = await apiClient.getVUFSPatterns();
                    break;
                case 'styles':
                    data = await apiClient.getVUFSAttributeValues('style');
                    break;
                case 'fits':
                    data = await apiClient.getVUFSFits();
                    break;
                case 'genders':
                    data = await apiClient.getVUFSGenders();
                    break;
                case 'conditions':
                    const conditionsRes = await apiClient.getAllConditions();
                    data = Array.isArray(conditionsRes) ? conditionsRes : [];
                    break;
            }
            setItems(data || []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (item: AttributeItem) => {
        setEditingId(item.id);
        setEditValue(item.skuRef || '');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveSkuRef = async (itemId: string) => {
        setSaving(true);
        try {
            const path = `/vufs-management/attributes/${activeTab}/${itemId}/sku-ref`;
            console.log('[SKUCodeConfiguration] Saving SKU ref:', {
                activeTab,
                itemId,
                skuRef: editValue,
                path
            });

            await apiClient.request(path, {
                method: 'PUT',
                body: JSON.stringify({ skuRef: editValue.toUpperCase().trim() })
            });

            // Update local state
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, skuRef: editValue.toUpperCase().trim() } : item
            ));
            setEditingId(null);
            setEditValue('');
            toast.success('SKU code saved');
        } catch (error) {
            console.error('[SKUCodeConfiguration] Failed to save SKU ref:', error);
            toast.error('Failed to save SKU code');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async (itemId: string, itemName: string) => {
        if (!deleteConfirm.isOpen) {
            setDeleteConfirm({
                isOpen: true,
                itemId: itemId,
                itemName: itemName
            });
            return;
        }

        try {
            setLoading(true);
            switch (activeTab) {
                case 'apparel':
                case 'styles':
                    await apiClient.deleteVUFSAttributeValue(itemId);
                    break;
                case 'sizes':
                    await apiClient.deleteVUFSSize(itemId);
                    break;
                case 'colors':
                    await apiClient.deleteVUFSColor(itemId);
                    break;
                case 'materials':
                    await apiClient.deleteVUFSMaterial(itemId);
                    break;
                case 'patterns':
                    await apiClient.deleteVUFSPattern(itemId);
                    break;
                case 'fits':
                    await apiClient.deleteVUFSFit(itemId);
                    break;
                case 'genders':
                    await apiClient.deleteVUFSGender(itemId);
                    break;
                case 'conditions':
                    await apiClient.deleteCondition(itemId);
                    break;
            }
            toast.success('Item deleted successfully');
            setItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Failed to delete item:', error);
            toast.error('Failed to delete item');
        } finally {
            setLoading(false);
            setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
        if (e.key === 'Enter') {
            saveSkuRef(itemId);
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-6">
                    Configure short codes for each attribute value. These codes are used when generating SKU codes
                    (e.g., "BLK" for Black, "SH" for Shirt).
                </p>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex flex-wrap gap-1 -mb-px">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Items Table */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No items found for this category.
                    </div>
                ) : (
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {activeTab === 'colors' && 'Color'}
                                        {activeTab !== 'colors' && 'Name'}
                                    </th>
                                    {activeTab === 'colors' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Preview
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU Code
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        {activeTab === 'colors' && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.hexCode && (
                                                    <div
                                                        className="w-6 h-6 rounded-full border border-gray-200"
                                                        style={{ backgroundColor: item.hexCode }}
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                                                    className="w-24 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                                                    maxLength={10}
                                                    autoFocus
                                                    placeholder="e.g. BLK"
                                                />
                                            ) : (
                                                <span className={`text-sm font-mono ${item.skuRef ? 'text-gray-900 bg-gray-100 px-2 py-1 rounded' : 'text-gray-400 italic'}`}>
                                                    {item.skuRef || 'Not set'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {editingId === item.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => saveSkuRef(item.id)}
                                                        disabled={saving}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                        title="Edit SKU Code"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id, item.name)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete Item"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">How SKU Codes Work</h3>
                <p className="text-sm text-blue-700">
                    SKU codes are short identifiers used to build unique product codes. For example, a black shirt in size M
                    might generate: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs font-mono">BRAND-SH-BLK-M</code>
                </p>
            </div>
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, itemId: null, itemName: '' })}
                onConfirm={() => deleteConfirm.itemId && handleDeleteItem(deleteConfirm.itemId, deleteConfirm.itemName)}
                title="Delete Attribute"
                message={`Are you sure you want to delete "${deleteConfirm.itemName}"? This may affect existing products using this attribute.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
