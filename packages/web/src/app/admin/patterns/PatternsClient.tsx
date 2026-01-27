'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    TrashIcon, PencilSquareIcon, PlusIcon, ArrowPathIcon,
    ArchiveBoxXMarkIcon, ChevronDownIcon, ChevronRightIcon,
    Cog6ToothIcon, FolderPlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface PatternGroup {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
    subcategories: PatternSubcategory[];
    patterns: Pattern[];
}

interface PatternSubcategory {
    id: string;
    groupId: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
    patterns: Pattern[];
}

interface Pattern {
    id: string;
    name: string;
    description?: string;
    skuRef?: string;
    groupId?: string;
    subcategoryId?: string;
    isActive: boolean;
    isDeleted?: boolean;
    deletedAt?: string;
}

export default function AdminPatternsPage() {
    const [groups, setGroups] = useState<PatternGroup[]>([]);
    const [deletedPatterns, setDeletedPatterns] = useState<Pattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTrash, setShowTrash] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Pattern Modal
    const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
    const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
    const [patternName, setPatternName] = useState('');
    const [patternDescription, setPatternDescription] = useState('');
    const [patternSkuRef, setPatternSkuRef] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');

    // Groups/Subcategory Modal
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<PatternGroup | null>(null);
    const [groupModalTab, setGroupModalTab] = useState<'edit' | 'subcategories'>('edit');
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [groupEmoji, setGroupEmoji] = useState('');
    const [newSubcategoryName, setNewSubcategoryName] = useState('');
    const [editingSubcategory, setEditingSubcategory] = useState<PatternSubcategory | null>(null);
    const [subcategoryEditName, setSubcategoryEditName] = useState('');

    // Delete confirmation
    const [deleteModalState, setDeleteModalState] = useState<{
        isOpen: boolean;
        id: string | null;
        permanent?: boolean;
        type: 'pattern' | 'subcategory';
    }>({
        isOpen: false,
        id: null,
        permanent: false,
        type: 'pattern'
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (showTrash) {
                const data = await apiClient.getDeletedVUFSPatterns();
                setDeletedPatterns(Array.isArray(data) ? data : []);
            } else {
                const data = await apiClient.getVUFSPatternGroups();
                setGroups(Array.isArray(data) ? data : []);
                // Expand all groups by default
                if (Array.isArray(data) && data.length > 0 && expandedGroups.size === 0) {
                    setExpandedGroups(new Set(data.map((g: PatternGroup) => g.id)));
                }
            }
        } catch (error) {
            console.error('Failed to fetch patterns', error);
            toast.error('Failed to load patterns');
        } finally {
            setLoading(false);
        }
    }, [showTrash, expandedGroups.size]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    // Get subcategories for selected group
    const getSubcategoriesForGroup = (groupId: string): PatternSubcategory[] => {
        const group = groups.find(g => g.id === groupId);
        return group?.subcategories || [];
    };

    // Pattern Modal handlers
    const handleOpenPatternModal = (pattern?: Pattern, groupId?: string, subcategoryId?: string) => {
        if (pattern) {
            setEditingPattern(pattern);
            setPatternName(pattern.name);
            setPatternDescription(pattern.description || '');
            setPatternSkuRef(pattern.skuRef || '');
            setSelectedGroupId(pattern.groupId || '');
            setSelectedSubcategoryId(pattern.subcategoryId || '');
        } else {
            setEditingPattern(null);
            setPatternName('');
            setPatternDescription('');
            setPatternSkuRef('');
            setSelectedGroupId(groupId || '');
            setSelectedSubcategoryId(subcategoryId || '');
        }
        setIsPatternModalOpen(true);
    };

    const handleSavePattern = async () => {
        if (!patternName.trim()) {
            toast.error('Pattern name is required');
            return;
        }
        try {
            if (editingPattern) {
                await apiClient.updateVUFSPattern(editingPattern.id, {
                    name: patternName,
                    skuRef: patternSkuRef || undefined,
                    groupId: selectedGroupId || null,
                    subcategoryId: selectedSubcategoryId || null,
                    description: patternDescription || undefined
                });
                toast.success('Pattern updated');
            } else {
                await apiClient.addVUFSPattern(
                    patternName,
                    patternSkuRef || undefined,
                    selectedGroupId || undefined,
                    selectedSubcategoryId || undefined,
                    patternDescription || undefined
                );
                toast.success('Pattern added');
            }
            setIsPatternModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save pattern', error);
            toast.error('Failed to save pattern');
        }
    };

    // Delete handlers
    const handleDeleteClick = (id: string, permanent = false, type: 'pattern' | 'subcategory' = 'pattern') => {
        setDeleteModalState({ isOpen: true, id, permanent, type });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalState.id) return;
        try {
            if (deleteModalState.type === 'subcategory') {
                await apiClient.deleteVUFSPatternSubcategory(deleteModalState.id);
                toast.success('Subcategory deleted');
                // Refresh groups modal if open
                if (editingGroup) {
                    const data = await apiClient.getVUFSPatternGroups();
                    const updatedGroup = data.find((g: PatternGroup) => g.id === editingGroup.id);
                    if (updatedGroup) setEditingGroup(updatedGroup);
                }
            } else if (deleteModalState.permanent) {
                await apiClient.permanentlyDeleteVUFSPattern(deleteModalState.id);
                toast.success('Pattern permanently deleted');
            } else {
                await apiClient.deleteVUFSPattern(deleteModalState.id);
                toast.success('Pattern moved to trash');
            }
            fetchData();
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete');
        } finally {
            setDeleteModalState({ isOpen: false, id: null, permanent: false, type: 'pattern' });
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await apiClient.restoreVUFSPattern(id);
            toast.success('Pattern restored');
            fetchData();
        } catch (error) {
            console.error('Failed to restore pattern', error);
            toast.error('Failed to restore pattern');
        }
    };

    // Group Management handlers
    const openGroupModal = (group: PatternGroup) => {
        setEditingGroup(group);
        setGroupName(group.name);
        setGroupDescription(group.description || '');
        setGroupEmoji(group.emoji || '');
        setGroupModalTab('edit');
        setIsGroupModalOpen(true);
    };

    const handleSaveGroup = async () => {
        if (!editingGroup) return;
        try {
            await apiClient.updateVUFSPatternGroup(editingGroup.id, {
                name: groupName,
                description: groupDescription,
                emoji: groupEmoji
            });
            toast.success('Group updated');
            fetchData();
            setIsGroupModalOpen(false);
        } catch (error) {
            console.error('Failed to update group', error);
            toast.error('Failed to update group');
        }
    };

    const handleAddSubcategory = async () => {
        if (!editingGroup || !newSubcategoryName.trim()) return;
        try {
            await apiClient.addVUFSPatternSubcategory(editingGroup.id, newSubcategoryName);
            toast.success('Subcategory added');
            setNewSubcategoryName('');
            // Refresh the group
            const data = await apiClient.getVUFSPatternGroups();
            const updatedGroup = data.find((g: PatternGroup) => g.id === editingGroup.id);
            if (updatedGroup) setEditingGroup(updatedGroup);
            fetchData();
        } catch (error) {
            console.error('Failed to add subcategory', error);
            toast.error('Failed to add subcategory');
        }
    };

    const handleUpdateSubcategory = async () => {
        if (!editingSubcategory || !subcategoryEditName.trim()) return;
        try {
            await apiClient.updateVUFSPatternSubcategory(editingSubcategory.id, subcategoryEditName);
            toast.success('Subcategory updated');
            setEditingSubcategory(null);
            // Refresh the group
            if (editingGroup) {
                const data = await apiClient.getVUFSPatternGroups();
                const updatedGroup = data.find((g: PatternGroup) => g.id === editingGroup.id);
                if (updatedGroup) setEditingGroup(updatedGroup);
            }
            fetchData();
        } catch (error) {
            console.error('Failed to update subcategory', error);
            toast.error('Failed to update subcategory');
        }
    };

    // Count total patterns
    const getTotalPatternCount = (group: PatternGroup): number => {
        const directPatterns = group.patterns?.length || 0;
        const subcatPatterns = (group.subcategories || []).reduce(
            (acc, sub) => acc + (sub.patterns?.length || 0), 0
        );
        return directPatterns + subcatPatterns;
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patterns Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Organize patterns by industry-standard groups and subcategories.
                    </p>
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
                            onClick={() => handleOpenPatternModal()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            Add Pattern
                        </button>
                    )}
                </div>
            </div>

            {showTrash ? (
                /* Trash View */
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md mx-4 mt-4">
                        <p className="text-sm text-amber-800">
                            <strong>Trash:</strong> Items here can be restored or permanently deleted.
                        </p>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200">
                        {deletedPatterns.map((pattern) => (
                            <li key={pattern.id} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                    <div>
                                        <p className="font-medium text-gray-600">{pattern.name}</p>
                                        {pattern.skuRef && (
                                            <p className="text-xs text-gray-500">SKU: {pattern.skuRef}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRestore(pattern.id)}
                                            className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-full"
                                            title="Restore"
                                        >
                                            <ArrowPathIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(pattern.id, true)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full"
                                            title="Delete Permanently"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {deletedPatterns.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">Trash is empty</li>
                        )}
                    </ul>
                </div>
            ) : (
                /* Groups View */
                <div className="space-y-4">
                    {groups.map((group) => (
                        <div key={group.id} className="bg-white shadow rounded-lg overflow-hidden">
                            {/* Group Header */}
                            <div
                                className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                                onClick={() => toggleGroup(group.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {expandedGroups.has(group.id) ? (
                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                    <span className="text-2xl">{group.emoji}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                                        <p className="text-sm text-gray-500">{group.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {getTotalPatternCount(group)} patterns
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openGroupModal(group); }}
                                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
                                        title="Manage Group"
                                    >
                                        <Cog6ToothIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedGroups.has(group.id) && (
                                <div className="px-4 py-4">
                                    {/* Subcategories */}
                                    {group.subcategories && group.subcategories.length > 0 && (
                                        <div className="space-y-4 mb-4">
                                            {group.subcategories.map((subcat) => (
                                                <div key={subcat.id} className="ml-6">
                                                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-t-md border border-gray-200">
                                                        <h4 className="text-sm font-medium text-gray-700">
                                                            {subcat.name}
                                                            <span className="ml-2 text-xs text-gray-400">
                                                                ({subcat.patterns?.length || 0})
                                                            </span>
                                                        </h4>
                                                        <button
                                                            onClick={() => handleOpenPatternModal(undefined, group.id, subcat.id)}
                                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                                                        >
                                                            + Add Pattern
                                                        </button>
                                                    </div>
                                                    {subcat.patterns && subcat.patterns.length > 0 ? (
                                                        <ul className="divide-y divide-gray-100 border-x border-b border-gray-200 rounded-b-md">
                                                            {subcat.patterns.map((pattern) => (
                                                                <li key={pattern.id} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50">
                                                                    <div>
                                                                        <span className="text-sm text-gray-800">{pattern.name}</span>
                                                                        {pattern.description && (
                                                                            <p className="text-xs text-gray-500">{pattern.description}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <button
                                                                            onClick={() => handleOpenPatternModal(pattern)}
                                                                            className="text-indigo-500 hover:text-indigo-700 p-1"
                                                                        >
                                                                            <PencilSquareIcon className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteClick(pattern.id)}
                                                                            className="text-red-500 hover:text-red-700 p-1"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="px-3 py-3 text-xs text-gray-400 text-center border-x border-b border-gray-200 rounded-b-md">
                                                            No patterns in this subcategory
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Direct patterns (no subcategory) */}
                                    {group.patterns && group.patterns.length > 0 && (
                                        <div className={group.subcategories?.length ? 'ml-6 mt-4' : 'ml-6'}>
                                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                                Other Patterns
                                            </div>
                                            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                                                {group.patterns.map((pattern) => (
                                                    <li key={pattern.id} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50">
                                                        <div>
                                                            <span className="text-sm text-gray-800">{pattern.name}</span>
                                                            {pattern.description && (
                                                                <p className="text-xs text-gray-500">{pattern.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleOpenPatternModal(pattern)}
                                                                className="text-indigo-500 hover:text-indigo-700 p-1"
                                                            >
                                                                <PencilSquareIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(pattern.id)}
                                                                className="text-red-500 hover:text-red-700 p-1"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {(!group.patterns || group.patterns.length === 0) &&
                                        (!group.subcategories || group.subcategories.every(s => !s.patterns || s.patterns.length === 0)) && (
                                            <div className="ml-6 text-center py-6 text-gray-400">
                                                <p className="text-sm">No patterns in this group yet.</p>
                                                <button
                                                    onClick={() => handleOpenPatternModal(undefined, group.id)}
                                                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                                >
                                                    + Add first pattern
                                                </button>
                                            </div>
                                        )}

                                    {/* Add pattern to group directly (without subcategory) */}
                                    <div className="ml-6 mt-4">
                                        <button
                                            onClick={() => handleOpenPatternModal(undefined, group.id)}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            Add pattern to {group.name}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {groups.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No pattern groups found.
                        </div>
                    )}
                </div>
            )}

            {/* Pattern Modal */}
            {isPatternModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {editingPattern ? 'Edit Pattern' : 'Add Pattern'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name *</label>
                                <input
                                    type="text"
                                    value={patternName}
                                    onChange={(e) => setPatternName(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    placeholder="e.g. Houndstooth, Paisley"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={patternDescription}
                                    onChange={(e) => setPatternDescription(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    rows={2}
                                    placeholder="e.g. Broken checks or abstract four-pointed shapes"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Group</label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => {
                                        setSelectedGroupId(e.target.value);
                                        setSelectedSubcategoryId('');
                                    }}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                >
                                    <option value="">-- No Group --</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedGroupId && getSubcategoriesForGroup(selectedGroupId).length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                                    <select
                                        value={selectedSubcategoryId}
                                        onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    >
                                        <option value="">-- No Subcategory --</option>
                                        {getSubcategoriesForGroup(selectedGroupId).map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">SKU Ref (2-4 chars)</label>
                                <input
                                    type="text"
                                    value={patternSkuRef}
                                    onChange={(e) => setPatternSkuRef(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2 uppercase"
                                    placeholder="e.g. HT"
                                    maxLength={4}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPatternModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePattern}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Management Modal */}
            {isGroupModalOpen && editingGroup && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingGroup.emoji} {editingGroup.name}
                            </h3>
                            <button
                                onClick={() => setIsGroupModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setGroupModalTab('edit')}
                                className={`px-4 py-2 text-sm font-medium ${groupModalTab === 'edit'
                                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Edit Group
                            </button>
                            <button
                                onClick={() => setGroupModalTab('subcategories')}
                                className={`px-4 py-2 text-sm font-medium ${groupModalTab === 'subcategories'
                                        ? 'border-b-2 border-indigo-500 text-indigo-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Subcategories ({editingGroup.subcategories?.length || 0})
                            </button>
                        </div>

                        {groupModalTab === 'edit' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Emoji</label>
                                    <input
                                        type="text"
                                        value={groupEmoji}
                                        onChange={(e) => setGroupEmoji(e.target.value)}
                                        className="mt-1 block w-20 border-gray-300 rounded-md shadow-sm sm:text-sm border p-2 text-center text-xl"
                                        maxLength={4}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={groupDescription}
                                        onChange={(e) => setGroupDescription(e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveGroup}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Add new subcategory */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubcategoryName}
                                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                                        className="flex-1 border-gray-300 rounded-md shadow-sm sm:text-sm border p-2"
                                        placeholder="New subcategory name"
                                    />
                                    <button
                                        onClick={handleAddSubcategory}
                                        disabled={!newSubcategoryName.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <FolderPlusIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Subcategory list */}
                                <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                                    {editingGroup.subcategories?.map((subcat) => (
                                        <li key={subcat.id} className="px-3 py-2 flex items-center justify-between">
                                            {editingSubcategory?.id === subcat.id ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={subcategoryEditName}
                                                        onChange={(e) => setSubcategoryEditName(e.target.value)}
                                                        className="flex-1 border-gray-300 rounded-md shadow-sm sm:text-sm border p-1"
                                                    />
                                                    <button
                                                        onClick={handleUpdateSubcategory}
                                                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingSubcategory(null)}
                                                        className="text-gray-500 hover:text-gray-700 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm text-gray-800">{subcat.name}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingSubcategory(subcat);
                                                                setSubcategoryEditName(subcat.name);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-800 text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(subcat.id, false, 'subcategory')}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                    {(!editingGroup.subcategories || editingGroup.subcategories.length === 0) && (
                                        <li className="px-3 py-4 text-center text-gray-400 text-sm">
                                            No subcategories yet
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={
                    deleteModalState.type === 'subcategory'
                        ? 'Delete Subcategory'
                        : deleteModalState.permanent
                            ? 'Permanently Delete Pattern'
                            : 'Move Pattern to Trash'
                }
                message={
                    deleteModalState.type === 'subcategory'
                        ? 'Patterns in this subcategory will be moved to the parent group.'
                        : deleteModalState.permanent
                            ? 'This action cannot be undone. The pattern will be permanently deleted.'
                            : 'This pattern will be moved to trash. You can restore it later.'
                }
                variant="danger"
                confirmText={
                    deleteModalState.type === 'subcategory'
                        ? 'Delete Subcategory'
                        : deleteModalState.permanent
                            ? 'Delete Forever'
                            : 'Move to Trash'
                }
            />
        </div>
    );
}
