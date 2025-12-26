'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TrashIcon, PencilSquareIcon, PlusIcon, SwatchIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MediaLabelGroup {
    id: string;
    name: string;
    representativeMediaLabel?: string;
    mediaLabels?: MediaLabel[];
}

interface MediaLabel {
    id: string;
    name: string;
    groupIds?: string[];
    groups?: MediaLabelGroup[];
    isActive: boolean;
}

// Sortable Item Component for Group MediaLabels
function SortableMediaLabelItem({ mediaLabel, onRemove }: { mediaLabel: MediaLabel; onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: mediaLabel.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li ref={setNodeRef} style={style} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded mb-2 border border-gray-200">
            <div className="flex items-center gap-3">
                <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                    <Bars3Icon className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-gray-700">{mediaLabel.name}</span>
            </div>
            <button onClick={() => onRemove(mediaLabel.id)} className="text-red-400 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
            </button>
        </li>
    );
}

export default function AdminMediaLabelsPage() {
    const [mediaLabels, setMediaLabels] = useState<MediaLabel[]>([]);
    const [groups, setGroups] = useState<MediaLabelGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Group Modal State
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<MediaLabelGroup | null>(null);
    const [groupName, setGroupName] = useState('');
    const [groupRepMediaLabel, setGroupRepMediaLabel] = useState('#000000');
    const [groupMediaLabels, setGroupMediaLabels] = useState<MediaLabel[]>([]); // Current mediaLabels in the group being edited
    const [showGroupEditView, setShowGroupEditView] = useState(false); // Toggle between list of groups and edit single group
    const [availableMediaLabelsForGroup, setAvailableMediaLabelsForGroup] = useState<MediaLabel[]>([]); // For adding new mediaLabels
    const [selectedMediaLabelToAdd, setSelectedMediaLabelToAdd] = useState('');

    // MediaLabel Edit State
    const [editingMediaLabel, setEditingMediaLabel] = useState<MediaLabel | null>(null);
    const [name, setName] = useState('');
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; type: 'mediaLabel' | 'group' | null; id: string | null }>({
        isOpen: false,
        type: null,
        id: null
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mediaLabelsData, groupsData] = await Promise.all([
                apiClient.getAllMediaLabels(),
                apiClient.getMediaLabelGroups()
            ]);
            setMediaLabels(mediaLabelsData || []);
            setGroups(groupsData || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (mediaLabel?: MediaLabel) => {
        if (mediaLabel) {
            setEditingMediaLabel(mediaLabel);
            setName(mediaLabel.name);
            setSelectedGroupIds(mediaLabel.groupIds || []);
        } else {
            setEditingMediaLabel(null);
            setName('');
            setSelectedGroupIds([]);
        }
        setIsModalOpen(true);
    };

    const handleSaveMediaLabel = async () => {
        try {
            if (editingMediaLabel) {
                await apiClient.updateMediaLabel(editingMediaLabel.id, {
                    name,
                    groupIds: selectedGroupIds
                });
            } else {
                await apiClient.createMediaLabel({
                    name,
                    groupIds: selectedGroupIds
                });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save media label', error);
        }
    };

    const handleDeleteClick = (id: string, type: 'mediaLabel' | 'group') => {
        setDeleteModalState({ isOpen: true, type, id });
    };

    const handleConfirmDelete = async () => {
        const { type, id } = deleteModalState;
        if (!type || !id) return;

        try {
            if (type === 'mediaLabel') {
                await apiClient.deleteMediaLabel(id);
            } else {
                await apiClient.deleteMediaLabelGroup(id);
            }
            fetchData();
        } catch (error) {
            console.error('Failed to delete item', error);
        } finally {
            setDeleteModalState({ isOpen: false, type: null, id: null });
        }
    };

    // --- Group Management Logic ---

    const openGroupList = () => {
        setEditingGroup(null);
        setGroupName('');
        setGroupRepMediaLabel('#000000');
        setGroupMediaLabels([]);
        setShowGroupEditView(false);
        setIsGroupModalOpen(true);
    };

    const openGroupEdit = (group?: MediaLabelGroup) => {
        if (group) {
            setEditingGroup(group);
            setGroupName(group.name);
            setGroupRepMediaLabel(group.representativeMediaLabel || '#000000');
            setGroupMediaLabels(group.mediaLabels || []);
        } else {
            setEditingGroup(null);
            setGroupName('');
            setGroupRepMediaLabel('#000000');
            setGroupMediaLabels([]);
        }
        setShowGroupEditView(true);
    };

    const handleAddMediaLabelToGroup = () => {
        if (!selectedMediaLabelToAdd) return;
        const mediaLabelToAdd = mediaLabels.find(c => c.id === selectedMediaLabelToAdd);
        if (mediaLabelToAdd) {
            setGroupMediaLabels([...groupMediaLabels, mediaLabelToAdd]);
            setSelectedMediaLabelToAdd('');
        }
    };

    const handleRemoveMediaLabelFromGroup = (mediaLabelId: string) => {
        setGroupMediaLabels(groupMediaLabels.filter(c => c.id !== mediaLabelId));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setGroupMediaLabels((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveGroup = async () => {
        if (!groupName.trim()) return;
        try {
            const mediaLabelIds = groupMediaLabels.map(c => c.id);

            if (editingGroup) {
                await apiClient.updateMediaLabelGroup(editingGroup.id, groupName, groupRepMediaLabel, mediaLabelIds);
            } else {
                await apiClient.createMediaLabelGroup(groupName, groupRepMediaLabel);
                // Note: Create doesn't support adding mediaLabels immediately in this UI flow generally, 
                // but since we allow it in state, we should ideally support it or just save metadata first.
                // Our API implementation for create didn't include mediaLabelIds, let's stick to metadata first 
                // OR we can't add mediaLabels to a NEW group until it's created if the API doesn't support it.
                // Given my previous backend edit, CreateGroup ONLY accepts name and repMediaLabel.
                // So if user added mediaLabels to a NEW group, they won't be saved unless we do a subsequent update.
                // Let's handle that:
                if (groupMediaLabels.length > 0) {
                    // We need to fetch the newly created group ID to update it, but createMediaLabelGroup returns it.
                    // Ah, wait. I can't chain it easily without storing the result.
                    // The simple fix is: Create group -> Then Update group with mediaLabels.
                    // But strictly speaking, the user might expect it to work.
                    // For now, I'll assume users typically create a group name first, then edit it to add mediaLabels, 
                    // OR I can quickly patch the frontend to double-save if it's new.
                    // Actually, usually you create empty group then populate.
                    // I will assume for "New Group" we ignore mediaLabels or warn? 
                    // Let's just create it, and if there are mediaLabels, we'll need to update it immediately.
                    // However, handling that robustly is tricky in one go without transaction script.
                    // I'll leave it simple: Create is metadata only. Edit is everything.
                    // I'll clear `groupMediaLabels` for new group creation in UI or hide the section?
                    // I'll hide the "MediaLabels in Group" section if creating new group to avoid confusion.
                }
            }

            // Refresh
            const newGroups = await apiClient.getMediaLabelGroups();
            setGroups(newGroups || []);

            // If we were editing, go back to list? Or close?
            // Let's go back to list.
            setShowGroupEditView(false);
        } catch (error) {
            console.error('Failed to save group', error);
        }
    };

    // Filter available mediaLabels (exclude already in group)
    useEffect(() => {
        if (showGroupEditView) {
            const currentIds = new Set(groupMediaLabels.map(c => c.id));
            setAvailableMediaLabelsForGroup(mediaLabels.filter(c => !currentIds.has(c.id)));
        }
    }, [groupMediaLabels, mediaLabels, showGroupEditView]);


    const toggleGroupSelection = (groupId: string) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Media Labels Management</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage media labels and media label groups.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={openGroupList}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Manage Groups
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add MediaLabel
                    </button>
                </div>
            </div>

            {/* MediaLabels List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {mediaLabels.map((mediaLabel) => (
                        <li key={mediaLabel.id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex items-center">
                                        <div className="ml-4 truncate">
                                            <div className="flex text-sm">
                                                <p className="font-medium text-indigo-600 truncate">{mediaLabel.name}</p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 gap-2">
                                                <SwatchIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                                                <span className="truncate">
                                                    {mediaLabel.groups && mediaLabel.groups.length > 0 ? (
                                                        mediaLabel.groups.map(g => (
                                                            <span key={g.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1 border border-gray-200">
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
                                            onClick={() => handleOpenModal(mediaLabel)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full"
                                        >
                                            <PencilSquareIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(mediaLabel.id, 'mediaLabel')}
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

            {/* MediaLabel Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 pb-0">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingMediaLabel ? 'Edit Media Label' : 'Add Media Label'}</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-2">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Media Label Groups</label>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded p-2">
                                        {groups.map(group => (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() => toggleGroupSelection(group.id)}
                                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-mediaLabels border ${selectedGroupIds.includes(group.id)
                                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full mr-2"
                                                    style={{ backgroundColor: group.representativeMediaLabel || '#ccc' }}
                                                ></span>
                                                {group.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveMediaLabel}
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
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {showGroupEditView ? (editingGroup ? 'Edit Group' : 'New Group') : 'Manage Media Label Groups'}
                            </h3>
                            <button
                                onClick={() => setIsGroupModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {!showGroupEditView ? (
                            // List View
                            <div>
                                <div className="mb-4">
                                    <button
                                        onClick={() => openGroupEdit()}
                                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                        Create New Group
                                    </button>
                                </div>
                                <div className="border-t border-gray-200">
                                    <ul className="divide-y divide-gray-200">
                                        {groups.map(group => (
                                            <li key={group.id} className="py-3 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-gray-900">{group.name}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        {(group.mediaLabels || []).length} mediaLabels
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openGroupEdit(group)}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium px-2 py-1 hover:bg-indigo-50 rounded"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(group.id, 'group')}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        {groups.length === 0 && <li className="py-4 text-center text-sm text-gray-500">No groups defined.</li>}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            // Edit View
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="e.g. Mockup, Still, Close-Up"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                        />
                                    </div>
                                </div>

                                {/* MediaLabels Management (Only for editing existing groups mainly due to API limitations, but we can show empty for new) */}
                                {editingGroup && (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Media Labels in Group (Drag to Reorder)</label>
                                            <span className="text-xs text-gray-500">{groupMediaLabels.length} media labels</span>
                                        </div>

                                        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto mb-4">
                                            {groupMediaLabels.length === 0 ? (
                                                <p className="text-sm text-gray-400 text-center py-4">No media labels in this group yet.</p>
                                            ) : (
                                                // @ts-ignore DndContext type incompatibility with React 18 types
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <SortableContext
                                                        items={groupMediaLabels.map(c => c.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {groupMediaLabels.map(mediaLabel => (
                                                            <SortableMediaLabelItem
                                                                key={mediaLabel.id}
                                                                mediaLabel={mediaLabel}
                                                                onRemove={handleRemoveMediaLabelFromGroup}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <select
                                                value={selectedMediaLabelToAdd}
                                                onChange={(e) => setSelectedMediaLabelToAdd(e.target.value)}
                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border p-2"
                                            >
                                                <option value="">Select a media label to add...</option>
                                                {availableMediaLabelsForGroup.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleAddMediaLabelToGroup}
                                                disabled={!selectedMediaLabelToAdd}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!editingGroup && (
                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                        <p className="text-sm text-blue-700">You can add media labels to this group after creating it.</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={openGroupList}
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Back to List
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveGroup}
                                        disabled={!groupName.trim()}
                                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {editingGroup ? 'Save Changes' : 'Create Group'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={handleConfirmDelete}
                title={deleteModalState.type === 'mediaLabel' ? 'Delete Media Label' : 'Delete Media Label Group'}
                message={deleteModalState.type === 'mediaLabel'
                    ? 'Are you sure you want to delete this media label? This action cannot be undone.'
                    : 'Are you sure you want to delete this group? Media labels in this group will remain, but the association will be removed.'
                }
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}
