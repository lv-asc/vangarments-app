'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import ShopColorPicker from '@/components/ui/ShopColorPicker';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, SwatchIcon } from '@heroicons/react/24/outline';

interface ColorGroup {
    id: string;
    name: string;
}

interface Color {
    id: string;
    name: string;
    hexCode?: string;
    groupIds?: string[];
    groups?: ColorGroup[];
    isActive: boolean;
}

export default function AdminColorsPage() {
    const [colors, setColors] = useState<Color[]>([]);
    const [groups, setGroups] = useState<ColorGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState<Color | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [hexCode, setHexCode] = useState('#000000');
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    // Group Management State
    const [groupName, setGroupName] = useState('');
    const [editingGroup, setEditingGroup] = useState<ColorGroup | null>(null);

    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'color' | 'group' | null; id: string | null }>({
        isOpen: false,
        type: null,
        id: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [colorsData, groupsData] = await Promise.all([
                apiClient.getAllColors(),
                apiClient.getColorGroups()
            ]);
            setColors(colorsData || []);
            setGroups(groupsData || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (color?: Color) => {
        if (color) {
            setEditingColor(color);
            setName(color.name);
            setHexCode(color.hexCode || '#000000');
            setSelectedGroupIds(color.groupIds || []);
        } else {
            setEditingColor(null);
            setName('');
            setHexCode('#000000');
            setSelectedGroupIds([]);
        }
        setIsModalOpen(true);
    };

    const handleSaveColor = async () => {
        try {
            if (editingColor) {
                await apiClient.updateColor(editingColor.id, {
                    name,
                    hexCode,
                    groupIds: selectedGroupIds
                });
            } else {
                await apiClient.createColor({
                    name,
                    hexCode,
                    groupIds: selectedGroupIds
                });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save color', error);
            // Replaced alert with console error, ideally use a Toast notification system if available
        }
    };

    const handleDeleteClick = (id: string, type: 'color' | 'group') => {
        setDeleteModalState({ isOpen: true, type, id });
    };

    const handleConfirmDelete = async () => {
        const { type, id } = deleteModalState;
        if (!type || !id) return;

        try {
            if (type === 'color') {
                await apiClient.deleteColor(id);
            } else {
                await apiClient.deleteColorGroup(id);
            }
            fetchData();
        } catch (error) {
            console.error('Failed to delete item', error);
        } finally {
            setDeleteModalState({ isOpen: false, type: null, id: null });
        }
    };

    const handleSaveGroup = async () => {
        if (!groupName.trim()) return;
        try {
            if (editingGroup) {
                await apiClient.updateColorGroup(editingGroup.id, groupName);
            } else {
                await apiClient.createColorGroup(groupName);
            }
            setGroupName('');
            setEditingGroup(null);
            // Refresh groups locally or via fetch
            const newGroups = await apiClient.getColorGroups();
            setGroups(newGroups || []);
        } catch (error) {
            console.error('Failed to save group', error);
        }
    };

    const toggleGroupSelection = (groupId: string) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header ... */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Colors Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage colors and color groups.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsGroupModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Manage Groups
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Color
                    </button>
                </div>
            </div>

            {/* Colors List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {colors.map((color) => (
                        <li key={color.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        <div
                                            className="h-10 w-10 rounded-full border border-gray-200 flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: color.hexCode }}
                                        />
                                        <div className="ml-4 truncate">
                                            <div className="flex text-sm">
                                                <p className="font-medium text-indigo-600 truncate">{color.name}</p>
                                                <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                    {color.hexCode}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 gap-2">
                                                <SwatchIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                                                <span className="truncate">
                                                    {color.groups && color.groups.length > 0 ? (
                                                        color.groups.map(g => (
                                                            <span key={g.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                                                                {g.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400">No groups</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5 flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(color)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(color.id, 'color')}
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

            {/* Color Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{editingColor ? 'Edit Color' : 'Add Color'}</h3>

                        <div className="space-y-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                <div className="flex justify-center bg-gray-50 p-4 rounded border">
                                    <ShopColorPicker
                                        color={hexCode}
                                        onChange={setHexCode}
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-gray-500">Selected Hex:</span>
                                    <input
                                        type="text"
                                        value={hexCode}
                                        onChange={(e) => setHexCode(e.target.value)}
                                        className="w-28 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-1"
                                    />
                                    <div
                                        className="h-6 w-6 rounded border border-gray-300 shadow-sm"
                                        style={{ backgroundColor: hexCode }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Color Groups</label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded p-2">
                                    {groups.map(group => (
                                        <button
                                            key={group.id}
                                            type="button"
                                            onClick={() => toggleGroupSelection(group.id)}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedGroupIds.includes(group.id)
                                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200 border'
                                                : 'bg-gray-100 text-gray-800 border-gray-200 border hover:bg-gray-200'
                                                }`}
                                        >
                                            {group.name}
                                        </button>
                                    ))}
                                </div>
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
                                onClick={handleSaveColor}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Groups Modal */}
            {isGroupModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Manage Color Groups</h3>
                            <button
                                onClick={() => setIsGroupModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {editingGroup ? 'Edit Group' : 'New Group'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="Group Name (e.g., Blue)"
                                    className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                />
                                <button
                                    onClick={handleSaveGroup}
                                    disabled={!groupName.trim()}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {editingGroup ? 'Update' : 'Add'}
                                </button>
                                {editingGroup && (
                                    <button
                                        onClick={() => { setEditingGroup(null); setGroupName(''); }}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4 max-h-60 overflow-y-auto">
                            <ul className="divide-y divide-gray-200">
                                {groups.map(group => (
                                    <li key={group.id} className="py-2 flex justify-between items-center">
                                        <span className="text-sm text-gray-900">{group.name}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setEditingGroup(group); setGroupName(group.name); }}
                                                className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(group.id, 'group')}
                                                className="text-red-600 hover:text-red-900 text-xs font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {groups.length === 0 && <li className="text-sm text-gray-500 italic">No groups defined.</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={deleteModalState.type === 'color' ? 'Delete Color' : 'Delete Color Group'}
                message={deleteModalState.type === 'color'
                    ? 'Are you sure you want to delete this color? This action cannot be undone.'
                    : 'Are you sure you want to delete this group? Colors in this group will remain, but the association will be removed.'
                }
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
