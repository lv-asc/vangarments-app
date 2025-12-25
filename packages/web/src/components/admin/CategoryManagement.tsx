// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { MagnifyingGlassIcon, TrashIcon, FolderIcon, PlusIcon, ChevronRightIcon, Bars3Icon, PencilSquareIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Combobox, Transition, Menu } from '@headlessui/react';
import toast from 'react-hot-toast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AttributeType {
    slug: string;
    name: string;
    isActive: boolean;
}

interface AttributeValue {
    id: string;
    name: string;
    type_slug: string;
    sortOrder: number;
    parentId: string | null;
}

// Sortable Item Component with Move To dropdown
function SortableItem({ item, onEdit, onDelete, showHandle = true, onMoveToLevel, availableLevels }: {
    item: AttributeValue;
    onEdit: (item: AttributeValue) => void;
    onDelete: (id: string) => void;
    showHandle?: boolean;
    onMoveToLevel?: (itemId: string, newLevel: string) => void;
    availableLevels?: { slug: string; name: string }[];
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between group ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
        >
            <div className="flex items-center gap-3">
                {showHandle && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-blue-600 p-1"
                        title="Drag to reorder"
                    >
                        <Bars3Icon className="h-5 w-5" />
                    </div>
                )}
                <FolderIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Move To dropdown */}
                {onMoveToLevel && availableLevels && availableLevels.length > 0 && (
                    <Menu as="div" className="relative">
                        <Menu.Button className="text-purple-600 hover:text-purple-800 p-1" title="Move to different level">
                            <ArrowsRightLeftIcon className="h-4 w-4" />
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Move to</div>
                                    {availableLevels.map(level => (
                                        <Menu.Item key={level.slug}>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => onMoveToLevel(item.id, level.slug)}
                                                    className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} block w-full px-4 py-2 text-left text-sm`}
                                                >
                                                    {level.name}
                                                </button>
                                            )}
                                        </Menu.Item>
                                    ))}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                )}
                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-800 p-1">
                    <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-800 p-1">
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function CategoryManagement() {
    // VUFS Attribute Types & Values
    const [attributeTypes, setAttributeTypes] = useState<AttributeType[]>([]);
    const [subcategory1Values, setSubcategory1Values] = useState<AttributeValue[]>([]);
    const [subcategory2Values, setSubcategory2Values] = useState<AttributeValue[]>([]);
    const [subcategory3Values, setSubcategory3Values] = useState<AttributeValue[]>([]);
    const [apparelValues, setApparelValues] = useState<AttributeValue[]>([]);

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'subcategory-1' | 'subcategory-2' | 'subcategory-3' | 'apparel-paths'>('subcategory-1');

    // Edit/Create State
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedValue, setSelectedValue] = useState<AttributeValue | null>(null);
    const [formData, setFormData] = useState({ name: '', parentId: '' });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [descendantsToDelete, setDescendantsToDelete] = useState<{ id: string; name: string; type_slug: string; depth: number }[]>([]);
    const [loadingDescendants, setLoadingDescendants] = useState(false);

    // Apparel Paths specific state
    const [selectedSub1ForFilter, setSelectedSub1ForFilter] = useState<string>('');
    const [selectedSub2ForFilter, setSelectedSub2ForFilter] = useState<string>('');
    const [selectedSub3ForFilter, setSelectedSub3ForFilter] = useState<string>('');

    // DnD sensors
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
            // Fetch all attribute types
            const types = await apiClient.getVUFSAttributeTypes();
            const typesArray: AttributeType[] = Array.isArray(types) ? types : [];
            setAttributeTypes(typesArray);

            // Fetch values for each subcategory type
            const sub1 = typesArray.find(t => t.slug === 'subcategory-1');
            const sub2 = typesArray.find(t => t.slug === 'subcategory-2');
            const sub3 = typesArray.find(t => t.slug === 'subcategory-3');
            const apparel = typesArray.find(t => t.slug === 'apparel');

            if (sub1) {
                const values = await apiClient.getVUFSAttributeValues('subcategory-1');
                setSubcategory1Values(Array.isArray(values) ? values : []);
            }
            if (sub2) {
                const values = await apiClient.getVUFSAttributeValues('subcategory-2');
                setSubcategory2Values(Array.isArray(values) ? values : []);
            }
            if (sub3) {
                const values = await apiClient.getVUFSAttributeValues('subcategory-3');
                setSubcategory3Values(Array.isArray(values) ? values : []);
            }
            if (apparel) {
                const values = await apiClient.getVUFSAttributeValues('apparel');
                setApparelValues(Array.isArray(values) ? values : []);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load category data');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get parent name
    const getParentName = (parentId: string | null, parentList: AttributeValue[]) => {
        if (!parentId) return '';
        const parent = parentList.find(p => p.id === parentId);
        return parent?.name || '';
    };

    // Filtered lists based on search and parent selections
    const filteredSub1 = useMemo(() => {
        return subcategory1Values.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }, [subcategory1Values, search]);

    const filteredSub2 = useMemo(() => {
        let filtered = subcategory2Values;
        if (selectedSub1ForFilter) {
            filtered = filtered.filter(v => v.parentId === selectedSub1ForFilter);
        }
        return filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }, [subcategory2Values, search, selectedSub1ForFilter]);

    const filteredSub3 = useMemo(() => {
        let filtered = subcategory3Values;
        if (selectedSub2ForFilter) {
            filtered = filtered.filter(v => v.parentId === selectedSub2ForFilter);
        }
        return filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }, [subcategory3Values, search, selectedSub2ForFilter]);

    const filteredApparel = useMemo(() => {
        let filtered = apparelValues;
        if (selectedSub3ForFilter) {
            filtered = filtered.filter(v => v.parentId === selectedSub3ForFilter);
        }
        return filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }, [apparelValues, search, selectedSub3ForFilter]);

    // Helper getters for Apparel Paths
    const getSub2ForSub1 = (sub1Id: string) => subcategory2Values.filter(v => v.parentId === sub1Id);
    const getSub3ForSub2 = (sub2Id: string) => subcategory3Values.filter(v => v.parentId === sub2Id);
    const getApparelForSub3 = (sub3Id: string) => apparelValues.filter(v => v.parentId === sub3Id);

    // Form handlers
    const handleSelectValue = (item: AttributeValue) => {
        setMode('edit');
        setSelectedValue(item);
        setFormData({ name: item.name, parentId: item.parentId || '' });
    };

    const handleCreateNew = () => {
        setMode('create');
        setSelectedValue(null);
        setFormData({ name: '', parentId: '' });
    };

    const handleDeleteClick = async (id: string) => {
        setItemToDelete(id);
        setLoadingDescendants(true);
        setShowDeleteConfirm(true);
        try {
            const descendants = await apiClient.getVUFSAttributeValueDescendants(id);
            setDescendantsToDelete(descendants || []);
        } catch (error) {
            console.error('Failed to fetch descendants', error);
            setDescendantsToDelete([]);
        } finally {
            setLoadingDescendants(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        try {
            await apiClient.deleteVUFSAttributeValue(itemToDelete);
            toast.success('Item deleted');
            await fetchData();
            handleCreateNew();
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error('Failed to delete item');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setDescendantsToDelete([]);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setSaving(true);
        try {
            if (mode === 'create') {
                const typeSlug = activeTab === 'apparel-paths' ? 'apparel' : activeTab;
                await apiClient.addVUFSAttributeValue(typeSlug, formData.name, formData.parentId || undefined);
                toast.success('Created successfully');
            } else if (selectedValue) {
                await apiClient.updateVUFSAttributeValue(selectedValue.id, {
                    name: formData.name,
                    parentId: formData.parentId || null
                });
                toast.success('Saved successfully');
            }
            await fetchData();
            handleCreateNew();
        } catch (error) {
            console.error('Failed to save', error);
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // Drag and drop handler for reordering
    const handleDragEnd = async (event: DragEndEvent, items: AttributeValue[], setItems: React.Dispatch<React.SetStateAction<AttributeValue[]>>) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);

        // Save new order to backend
        const orders = newItems.map((item, index) => ({ id: item.id, sortOrder: index + 1 }));
        try {
            await apiClient.reorderVUFSAttributeValues(orders);
            toast.success('Order updated');
        } catch (error) {
            console.error('Failed to reorder', error);
            toast.error('Failed to save order');
            await fetchData();
        }
    };

    // Move to different hierarchy level handler
    const handleMoveToLevel = async (itemId: string, newLevel: string) => {
        toast.loading('Moving item...', { id: 'move-item' });
        try {
            // Find item to get current parent
            const allItems = [...subcategory1Values, ...subcategory2Values, ...subcategory3Values, ...apparelValues];
            const item = allItems.find(i => i.id === itemId);
            let newParentId = null;

            if (item && newLevel === 'apparel') {
                // If moving to apparel, preserve current parent (it's likely valid as Sub1, Sub2, or Sub3)
                newParentId = item.parentId;
            }

            await apiClient.changeVUFSAttributeHierarchy(itemId, newLevel, newParentId);
            toast.success('Item moved successfully', { id: 'move-item' });
            await fetchData();
        } catch (error: any) {
            console.error('Failed to move item', error);
            toast.error(`Failed to move: ${error.message}`, { id: 'move-item' });
        }
    };

    // Available levels for Move To dropdown
    const getAvailableLevels = (currentLevel: string) => {
        const allLevels = [
            { slug: 'subcategory-1', name: 'Subcategory 1' },
            { slug: 'subcategory-2', name: 'Subcategory 2' },
            { slug: 'subcategory-3', name: 'Subcategory 3' },
            { slug: 'apparel', name: 'Apparel' }
        ];
        return allLevels.filter(l => l.slug !== currentLevel);
    };

    // Check if column exists
    const hasSubcategory1 = attributeTypes.some(t => t.slug === 'subcategory-1');
    const hasSubcategory2 = attributeTypes.some(t => t.slug === 'subcategory-2');
    const hasSubcategory3 = attributeTypes.some(t => t.slug === 'subcategory-3');
    const hasApparel = attributeTypes.some(t => t.slug === 'apparel');

    if (loading && attributeTypes.length === 0) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                    <strong>4-Tier Hierarchy:</strong> Subcategory 1 → Subcategory 2 → Subcategory 3 → Apparel.
                    Use the <ArrowsRightLeftIcon className="h-4 w-4 inline" /> button to move items between levels.
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => { setActiveTab('subcategory-1'); handleCreateNew(); setSearch(''); }}
                        disabled={!hasSubcategory1}
                        className={`${activeTab === 'subcategory-1'
                            ? 'border-blue-500 text-blue-600'
                            : hasSubcategory1 ? 'border-transparent text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Subcategory 1
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{subcategory1Values.length}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('subcategory-2'); handleCreateNew(); setSearch(''); setSelectedSub1ForFilter(''); }}
                        disabled={!hasSubcategory2}
                        className={`${activeTab === 'subcategory-2'
                            ? 'border-blue-500 text-blue-600'
                            : hasSubcategory2 ? 'border-transparent text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Subcategory 2
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{subcategory2Values.length}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('subcategory-3'); handleCreateNew(); setSearch(''); setSelectedSub1ForFilter(''); setSelectedSub2ForFilter(''); }}
                        disabled={!hasSubcategory3}
                        className={`${activeTab === 'subcategory-3'
                            ? 'border-blue-500 text-blue-600'
                            : hasSubcategory3 ? 'border-transparent text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Subcategory 3
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{subcategory3Values.length}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('apparel-paths'); handleCreateNew(); setSearch(''); setSelectedSub1ForFilter(''); setSelectedSub2ForFilter(''); setSelectedSub3ForFilter(''); }}
                        disabled={!hasApparel}
                        className={`${activeTab === 'apparel-paths'
                            ? 'border-blue-500 text-blue-600'
                            : hasApparel ? 'border-transparent text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Apparel Paths
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{apparelValues.length}</span>
                    </button>
                </nav>
            </div>

            {/* Subcategory 1 Tab */}
            {activeTab === 'subcategory-1' && hasSubcategory1 && (
                <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
                    {/* List */}
                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Subcategory 1 (Top Level)</h2>
                            <button onClick={handleCreateNew} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[350px] border rounded-md">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, subcategory1Values, setSubcategory1Values)}>
                                <SortableContext items={filteredSub1.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {filteredSub1.map(item => (
                                        <SortableItem
                                            key={item.id}
                                            item={item}
                                            onEdit={handleSelectValue}
                                            onDelete={handleDeleteClick}
                                            showHandle={true}
                                            onMoveToLevel={handleMoveToLevel}
                                            availableLevels={getAvailableLevels('subcategory-1')}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {filteredSub1.length === 0 && (
                                <div className="p-4 text-center text-gray-400 italic text-sm">No items found</div>
                            )}
                        </div>
                    </div>

                    {/* Form */}
                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {mode === 'create' ? 'Add New Subcategory 1' : 'Edit Subcategory 1'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                    placeholder="e.g., Tops, Bottoms, Accessories"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="ghost" onClick={handleCreateNew}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategory 2 Tab */}
            {activeTab === 'subcategory-2' && hasSubcategory2 && (
                <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Subcategory 2</h2>
                            <button onClick={handleCreateNew} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Filter by Sub1 */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Filter by Subcategory 1</label>
                            <select
                                value={selectedSub1ForFilter}
                                onChange={(e) => setSelectedSub1ForFilter(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                            >
                                <option value="">All</option>
                                {subcategory1Values.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative mb-4">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[350px] border rounded-md">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, subcategory2Values, setSubcategory2Values)}>
                                <SortableContext items={filteredSub2.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {filteredSub2.map(item => (
                                        <div key={item.id} className="relative flex items-center border-b border-gray-100 hover:bg-gray-50">
                                            <div className="flex-1">
                                                <SortableItem
                                                    item={item}
                                                    onEdit={handleSelectValue}
                                                    onDelete={handleDeleteClick}
                                                    showHandle={true}
                                                    onMoveToLevel={handleMoveToLevel}
                                                    availableLevels={getAvailableLevels('subcategory-2')}
                                                />
                                            </div>
                                            {item.parentId && (
                                                <span className="mr-4 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                                    {getParentName(item.parentId, subcategory1Values)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {filteredSub2.length === 0 && (
                                <div className="p-4 text-center text-gray-400 italic text-sm">No items found</div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {mode === 'create' ? 'Add New Subcategory 2' : 'Edit Subcategory 2'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                    placeholder="e.g., T-Shirts, Jeans, Hats"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent (Subcategory 1)</label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                >
                                    <option value="">None (Unassigned)</option>
                                    {subcategory1Values.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="ghost" onClick={handleCreateNew}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subcategory 3 Tab */}
            {activeTab === 'subcategory-3' && hasSubcategory3 && (
                <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Subcategory 3</h2>
                            <button onClick={handleCreateNew} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Filter by Sub2 */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Filter by Subcategory 2</label>
                            <select
                                value={selectedSub2ForFilter}
                                onChange={(e) => setSelectedSub2ForFilter(e.target.value)}
                                className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                            >
                                <option value="">All</option>
                                {subcategory2Values.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative mb-4">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[350px] border rounded-md">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, subcategory3Values, setSubcategory3Values)}>
                                <SortableContext items={filteredSub3.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {filteredSub3.map(item => (
                                        <div key={item.id} className="relative flex items-center border-b border-gray-100 hover:bg-gray-50">
                                            <div className="flex-1">
                                                <SortableItem
                                                    item={item}
                                                    onEdit={handleSelectValue}
                                                    onDelete={handleDeleteClick}
                                                    showHandle={true}
                                                    onMoveToLevel={handleMoveToLevel}
                                                    availableLevels={getAvailableLevels('subcategory-3')}
                                                />
                                            </div>
                                            {item.parentId && (
                                                <span className="mr-4 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                                    {getParentName(item.parentId, subcategory2Values)}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {filteredSub3.length === 0 && (
                                <div className="p-4 text-center text-gray-400 italic text-sm">No items found</div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {mode === 'create' ? 'Add New Subcategory 3' : 'Edit Subcategory 3'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                    placeholder="e.g., Long Sleeve, Short Sleeve"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent (Subcategory 2)</label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                >
                                    <option value="">None (Unassigned)</option>
                                    {subcategory2Values.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="ghost" onClick={handleCreateNew}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Apparel Paths Tab - 4 Column View */}
            {activeTab === 'apparel-paths' && hasApparel && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Apparel Paths</h2>
                            <Button onClick={() => {
                                handleCreateNew();
                                const parentId = selectedSub3ForFilter || selectedSub2ForFilter || selectedSub1ForFilter || '';
                                setFormData({ name: '', parentId });
                            }}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Apparel
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Navigate through the hierarchy. Apparel items can be added at any level (Subcategory 1, 2, or 3).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Column 1: Subcategory 1 */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-gray-700">Subcategory 1</h3>
                                </div>
                                <div className="overflow-y-auto flex-1 bg-white">
                                    {subcategory1Values.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedSub1ForFilter(item.id);
                                                setSelectedSub2ForFilter('');
                                                setSelectedSub3ForFilter('');
                                                if (mode === 'create') {
                                                    setFormData(prev => ({ ...prev, parentId: item.id }));
                                                }
                                            }}
                                            className={`cursor-pointer px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-2 ${selectedSub1ForFilter === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                        >
                                            <FolderIcon className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm text-gray-700">{item.name}</span>
                                            <span className="ml-auto text-xs text-gray-400">
                                                {getSub2ForSub1(item.id).length + apparelValues.filter(a => a.parentId === item.id).length}
                                            </span>
                                        </div>
                                    ))}
                                    {subcategory1Values.length === 0 && (
                                        <div className="p-4 text-center text-gray-400 italic text-sm">No items</div>
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Subcategory 2 */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Subcategory 2
                                        {selectedSub1ForFilter && (
                                            <span className="ml-2 text-xs text-blue-600 block truncate">
                                                in {getParentName(selectedSub1ForFilter, subcategory1Values)}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <div className="overflow-y-auto flex-1 bg-white">
                                    {selectedSub1ForFilter ? (
                                        getSub2ForSub1(selectedSub1ForFilter).map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedSub2ForFilter(item.id);
                                                    setSelectedSub3ForFilter('');
                                                    if (mode === 'create') {
                                                        setFormData(prev => ({ ...prev, parentId: item.id }));
                                                    }
                                                }}
                                                className={`cursor-pointer px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-2 ${selectedSub2ForFilter === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                            >
                                                <FolderIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-sm text-gray-700">{item.name}</span>
                                                <span className="ml-auto text-xs text-gray-400">
                                                    {getSub3ForSub2(item.id).length + apparelValues.filter(a => a.parentId === item.id).length}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-400 italic text-sm">
                                            Select a Subcategory 1 to view
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Subcategory 3 */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Subcategory 3
                                        {selectedSub2ForFilter && (
                                            <span className="ml-2 text-xs text-blue-600 block truncate">
                                                in {getParentName(selectedSub2ForFilter, subcategory2Values)}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <div className="overflow-y-auto flex-1 bg-white">
                                    {selectedSub2ForFilter ? (
                                        getSub3ForSub2(selectedSub2ForFilter).map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedSub3ForFilter(item.id);
                                                    if (mode === 'create') {
                                                        setFormData(prev => ({ ...prev, parentId: item.id }));
                                                    }
                                                }}
                                                className={`cursor-pointer px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-2 ${selectedSub3ForFilter === item.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                                            >
                                                <FolderIcon className="h-5 w-5 text-gray-400" />
                                                <span className="text-sm text-gray-700">{item.name}</span>
                                                <span className="ml-auto text-xs text-gray-400">
                                                    {apparelValues.filter(a => a.parentId === item.id).length}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-400 italic text-sm">
                                            Select a Subcategory 2 to view
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 4: Apparel */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0 flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        Apparel
                                        {(selectedSub3ForFilter || selectedSub2ForFilter || selectedSub1ForFilter) && (
                                            <span className="ml-2 text-xs text-blue-600 block truncate">
                                                in {
                                                    selectedSub3ForFilter ? getParentName(selectedSub3ForFilter, subcategory3Values) :
                                                        selectedSub2ForFilter ? getParentName(selectedSub2ForFilter, subcategory2Values) :
                                                            getParentName(selectedSub1ForFilter, subcategory1Values)
                                                }
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <div className="overflow-y-auto flex-1 bg-white">
                                    {(selectedSub1ForFilter || selectedSub2ForFilter || selectedSub3ForFilter) ? (
                                        (() => {
                                            const currentParentId = selectedSub3ForFilter || selectedSub2ForFilter || selectedSub1ForFilter;
                                            const apparelItems = apparelValues.filter(v => v.parentId === currentParentId);
                                            const filteredBySearch = apparelItems.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));

                                            if (filteredBySearch.length === 0) {
                                                if (apparelItems.length === 0) {
                                                    return <div className="p-4 text-center text-gray-400 italic text-sm">No apparel items directly in this category.</div>
                                                }
                                                return <div className="p-4 text-center text-gray-400 italic text-sm">No matches for search.</div>
                                            }

                                            return filteredBySearch.map(item => (
                                                <div key={item.id} className="relative flex items-center border-b border-gray-100 hover:bg-gray-50">
                                                    <div className="flex-1">
                                                        <SortableItem
                                                            item={item}
                                                            onEdit={handleSelectValue}
                                                            onDelete={handleDeleteClick}
                                                            showHandle={false}
                                                            onMoveToLevel={handleMoveToLevel}
                                                            availableLevels={['subcategory-1', 'subcategory-2', 'subcategory-3'].map(slug => ({
                                                                slug,
                                                                name: slug.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        <div className="p-4 text-center text-gray-400 italic text-sm">
                                            Select a category to view apparel
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit/Create Area for Apparel */}
                    <div className="bg-white shadow rounded-lg p-6 border-t-4 border-t-blue-500">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {mode === 'create' ? (
                                <span>Add New Apparel Item <span className="text-sm font-normal text-gray-500">(select parent in grid above)</span></span>
                            ) : (
                                'Edit Apparel Item'
                            )}
                        </h3>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                    placeholder="e.g., Beanie, Belt"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                    {formData.parentId ? (
                                        (() => {
                                            const p1 = subcategory1Values.find(i => i.id === formData.parentId);
                                            const p2 = subcategory2Values.find(i => i.id === formData.parentId);
                                            const p3 = subcategory3Values.find(i => i.id === formData.parentId);
                                            const parent = p1 || p2 || p3;
                                            return parent ? (
                                                <span className="flex items-center gap-2">
                                                    <FolderIcon className="h-4 w-4 text-blue-500" />
                                                    {parent.name}
                                                    <span className="text-xs text-gray-400 border border-gray-200 rounded px-1">
                                                        {p1 ? 'Sub 1' : p2 ? 'Sub 2' : 'Sub 3'}
                                                    </span>
                                                </span>
                                            ) : 'Unknown Selection';
                                        })()
                                    ) : (
                                        <span className="text-gray-400 italic">No parent selected (Select from grid)</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={handleCreateNew}>Cancel / New</Button>
                                <Button onClick={handleSave} disabled={saving || !formData.parentId}>
                                    {saving ? 'Saving...' : (mode === 'create' ? 'Create' : 'Save')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setItemToDelete(null); setDescendantsToDelete([]); }}
                onConfirm={handleConfirmDelete}
                title="Delete Item"
                message={
                    <div className="space-y-3">
                        <p>Are you sure you want to delete this item? This cannot be undone.</p>
                        {loadingDescendants ? (
                            <p className="text-sm text-gray-500 italic">Loading affected items...</p>
                        ) : descendantsToDelete.length > 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                <p className="text-sm font-medium text-amber-800 mb-2">
                                    ⚠️ The following {descendantsToDelete.length} child item(s) will also be deleted:
                                </p>
                                <ul className="text-sm text-amber-700 max-h-40 overflow-y-auto space-y-1">
                                    {descendantsToDelete.map((d) => (
                                        <li key={d.id} className="flex items-center gap-2">
                                            <span className="text-xs text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded">
                                                {d.type_slug.replace('subcategory-', 'Sub ').replace('apparel', 'Apparel')}
                                            </span>
                                            {d.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-green-600">✓ This item has no child items.</p>
                        )}
                    </div>
                }
                variant="danger"
                isLoading={deleting}
                confirmText={descendantsToDelete.length > 0 ? `Delete ${descendantsToDelete.length + 1} items` : "Delete"}
            />
        </div>
    );
}
