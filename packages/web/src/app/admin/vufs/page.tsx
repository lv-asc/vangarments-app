'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VUFSItem {
    id: string;
    name: string;
    [key: string]: any;
}

interface VUFSCategoryOption extends VUFSItem {
    level: 'page' | 'blue' | 'white' | 'gray';
    parentId?: string;
    isActive: boolean;
}

interface AttributeType {
    slug: string;
    name: string;
    isActive: boolean;
}

interface TabConfig {
    id: string;
    name: string;
    mainColumn: 'Style / Category' | 'Brand';
    columns: string[]; // slugs of visible columns
}

// Sortable Column Wrapper
function SortableColumn({ id, children }: { id: string, children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full flex flex-col">
            {/* We want the drag handle to be on the header, but for now apply to whole col or pass handle props?
                Actually, renderList header needs the listeners.
                Let's clone the children to pass listeners? Or just wrap. 
                If we wrap, the whole column is draggable. Let's try that first.
            */}
            {/* Better: Pass listeners to a specific handle in the child. 
                For now, let's make the Whole Header draggable.
                But renderList is a function returning JSX.
                Let's adjust.
            */}
            <div {...attributes} {...listeners} className="h-full touch-none">
                {children}
            </div>
        </div>
    );
}

export default function AdminVUFSPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // Data states
    const [categories, setCategories] = useState<VUFSItem[]>([]);
    const [brands, setBrands] = useState<VUFSItem[]>([]);
    const [colors, setColors] = useState<VUFSItem[]>([]);
    const [materials, setMaterials] = useState<VUFSItem[]>([]);
    const [patterns, setPatterns] = useState<VUFSItem[]>([]);
    const [fits, setFits] = useState<VUFSItem[]>([]);
    const [sizes, setSizes] = useState<VUFSItem[]>([]);

    // Dynamic Attributes State
    const [customTypes, setCustomTypes] = useState<AttributeType[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, VUFSItem[]>>({});
    const [columnOrder, setColumnOrder] = useState<string[]>([
        'Style / Category', 'Brand', 'Size', 'Color', 'Material', 'Pattern', 'Fit'
    ]);

    // Persist Column Order
    useEffect(() => {
        const saved = localStorage.getItem('admin_vufs_column_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setColumnOrder(parsed);
            } catch (e) {
                console.error('Failed to parse column order', e);
            }
        }
    }, []);

    useEffect(() => {
        if (columnOrder.length > 0) {
            localStorage.setItem('admin_vufs_column_order', JSON.stringify(columnOrder));
        }
    }, [columnOrder]);

    // Column Aliases & Visibility (Global)
    const [columnAliases, setColumnAliases] = useState<Record<string, string>>({});
    const [disabledColumns, setDisabledColumns] = useState<string[]>([]);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Matrix State
    const [matrixValues, setMatrixValues] = useState<Record<string, string>>({}); // Key: "catId:attrSlug" -> Value
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setColumnOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Tabs State
    const [tabs, setTabs] = useState<TabConfig[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');


    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !user.roles || !user.roles.includes('admin')) {
                router.push('/');
                return;
            }

            // Load Tabs
            const storedTabs = localStorage.getItem('vufs_matrix_tabs');
            if (storedTabs) {
                try {
                    const parsed = JSON.parse(storedTabs);
                    setTabs(parsed);
                    if (parsed.length > 0) setActiveTabId(parsed[0].id);
                } catch (e) { console.error('Failed to parse tabs', e); }
            } else {
                // Default Tab
                const defaultTab: TabConfig = {
                    id: 'default',
                    name: 'Default View',
                    mainColumn: 'Style / Category',
                    columns: [] // All
                };
                setTabs([defaultTab]);
                setActiveTabId('default');
            }

            fetchAllData();
        }
    }, [user, authLoading, router]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [
                catsRes,
                brandsRes,
                colorsRes,
                matsRes,
                patsRes,
                fitsRes,
                sizesRes,
                typesRes,
                catMatrixRes,
                brandMatrixRes,
                settingsRes
            ] = await Promise.all([
                apiClient.getVUFSCategories(),
                apiClient.getVUFSBrands(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSAttributeTypes(),
                apiClient.getAllCategoryAttributes(),
                apiClient.getAllBrandAttributes(),
                apiClient.getVUFSSettings().catch(e => { console.warn('Failed to load settings', e); return {}; })
            ]);

            // Handle Settings
            const settingsData = settingsRes as Record<string, any>;
            if (settingsData && settingsData['column_aliases']) {
                setColumnAliases(settingsData['column_aliases']);
            }
            if (settingsData && settingsData['disabled_columns']) {
                const disabled = settingsData['disabled_columns'];
                setDisabledColumns(disabled);
            }
            setSettingsLoaded(true);

            // Handle Categories
            const catsData = Array.isArray(catsRes) ? catsRes : (catsRes?.categories || []);
            setCategories(catsData.filter((c: any) => c.level === 'page'));

            // Handle Standard Collections
            setBrands(Array.isArray(brandsRes) ? brandsRes : (brandsRes?.brands || []));
            setColors(Array.isArray(colorsRes) ? colorsRes : (colorsRes?.colors || []));
            setMaterials(Array.isArray(matsRes) ? matsRes : (matsRes?.materials || []));
            setPatterns(Array.isArray(patsRes) ? patsRes : (patsRes?.patterns || []));
            setFits(Array.isArray(fitsRes) ? fitsRes : (fitsRes?.fits || []));
            setSizes(Array.isArray(sizesRes) ? sizesRes : (sizesRes?.sizes || []));

            // Handle Custom Attributes
            const typesData: AttributeType[] = Array.isArray(typesRes) ? typesRes : (typesRes?.types || []);
            setCustomTypes(typesData);

            // Fetch values for each custom type (for dropdowns in grid view)
            const valuesMap: Record<string, VUFSItem[]> = {};
            await Promise.all(typesData.map(async (type) => {
                try {
                    const valuesRes = await apiClient.getVUFSAttributeValues(type.slug);
                    valuesMap[type.slug] = Array.isArray(valuesRes) ? valuesRes : (valuesRes?.values || []);
                } catch (e) {
                    console.error(`Failed to fetch values for ${type.name}`, e);
                    valuesMap[type.slug] = [];
                }
            }));
            setCustomValues(valuesMap);

            // Sync Column Order
            setColumnOrder(prev => {
                const currentSet = new Set(prev);
                const newSlugs = typesData.map(t => t.slug).filter(s => !currentSet.has(s));
                const validSlugs = new Set([...typesData.map(t => t.slug), 'Style / Category', 'Brand', 'Size', 'Color', 'Material', 'Pattern', 'Fit']);

                // If it's the first load, use a default order if prev is empty, or respect existing?
                const filteredPrev = prev.length > 0 ? prev.filter(p => validSlugs.has(p)) : Array.from(validSlugs);

                let combined = [...filteredPrev, ...newSlugs];

                // Filter out disabled
                if (settingsData && settingsData['disabled_columns']) {
                    const disabledSet = new Set(settingsData['disabled_columns']);
                    combined = combined.filter(c => !disabledSet.has(c));
                }

                return Array.from(new Set(combined));
            });

            // Handle Matrix Values
            const matrixMap: Record<string, string> = {};

            const catMatrixData = Array.isArray(catMatrixRes) ? catMatrixRes : (catMatrixRes?.attributes || []);
            catMatrixData.forEach((item: any) => {
                matrixMap[`${item.category_id}:${item.attribute_slug}`] = item.value;
            });

            // Brand Attributes
            const brandMatrixData = Array.isArray(brandMatrixRes) ? brandMatrixRes : (brandMatrixRes?.attributes || []);
            brandMatrixData.forEach((item: any) => {
                matrixMap[`${item.brand_id}:${item.attribute_slug}`] = item.value;
            });

            setMatrixValues(matrixMap);

        } catch (err) {
            console.error('Failed to fetch VUFS data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMatrixChange = async (entityId: string, attributeSlug: string, value: string) => {
        // Optimistic update
        const key = `${entityId}:${attributeSlug}`;
        setMatrixValues(prev => ({ ...prev, [key]: value }));

        const activeTab = tabs.find(t => t.id === activeTabId);
        const mainCol = activeTab?.mainColumn || 'Style / Category';

        try {
            if (activeTab?.mainColumn === 'Style / Category' && attributeSlug === 'IS_SUBCATEGORY_1') {
                // Handle mapped column update (Parent ID)
                await apiClient.updateVUFSCategory(entityId, { parentId: value || null });
                // We need to refresh categories to update the list view and other parts
                await fetchAllData();
            } else if (mainCol === 'Style / Category') {
                await apiClient.setCategoryAttribute(entityId, attributeSlug, value);
            } else if (mainCol === 'Brand') {
                await apiClient.setBrandAttribute(entityId, attributeSlug, value);
            }
        } catch (err) {
            console.error('Failed to save attribute', err);
            // Revert on error? For now just log
            alert('Failed to save value');
        }
    };

    const [modalAction, setModalAction] = useState<'add' | 'delete' | 'bulk' | 'addColumn' | 'deleteColumn' | 'renameColumn' | 'renameItem' | 'configureTab' | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedSlug, setSelectedSlug] = useState<string>('');
    const [selectedId, setSelectedId] = useState<string>('');
    const [inputValue, setInputValue] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [editingTab, setEditingTab] = useState<TabConfig | null>(null);

    // Handlers
    const initiateDelete = (type: string, id: string, slug?: string) => {
        setModalAction('delete');
        setSelectedType(type);
        setSelectedId(id);
        // Correctly set slug, defaulting to type name if missing (common for standard columns in legacy)
        setSelectedSlug(slug || type);
    };

    const initiateAdd = (type: string, slug?: string) => {
        setModalAction('add');
        setSelectedType(type);
        if (slug) setSelectedSlug(slug);
        setInputValue('');
    };

    const initiateSaveTab = (tabConfig: TabConfig) => {
        const newTabs = [...tabs];
        const index = newTabs.findIndex(t => t.id === tabConfig.id);
        if (index > -1) {
            newTabs[index] = tabConfig;
        } else {
            newTabs.push(tabConfig);
        }
        setTabs(newTabs);
        localStorage.setItem('vufs_matrix_tabs', JSON.stringify(newTabs));
        if (activeTabId === tabConfig.id || !activeTabId) setActiveTabId(tabConfig.id);
        closeModal();
    };

    const initiateDeleteTab = (tabId: string) => {
        if (tabs.length <= 1) {
            alert("Cannot delete the last tab.");
            return;
        }
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        localStorage.setItem('vufs_matrix_tabs', JSON.stringify(newTabs));
        if (activeTabId === tabId) setActiveTabId(newTabs[0].id);
        closeModal();
    };

    const initiateConfigureTab = (tab?: TabConfig) => {
        if (tab) {
            setEditingTab(tab);
        } else {
            setEditingTab({
                id: crypto.randomUUID(),
                name: 'New Tab',
                mainColumn: 'Style / Category',
                columns: []
            });
        }
        setModalAction('configureTab');
    };

    const initiateBulk = (type: string, slug?: string) => {
        setModalAction('bulk');
        setSelectedType(type);
        if (slug) setSelectedSlug(slug);
        setBulkInput('');
    };

    const initiateRenameColumn = (type: AttributeType) => {
        setModalAction('renameColumn');
        setSelectedSlug(type.slug);
        setInputValue(type.name);
    };

    const initiateRenameItem = (item: VUFSItem, typeName: string, typeSlug?: string) => {
        setModalAction('renameItem');
        setSelectedId(item.id);
        setSelectedType(typeName);
        // Essential: Set slug or fallback to name if missing (for standard columns where slug might == name)
        setSelectedSlug(typeSlug || typeName);
        setInputValue(item.name);
    };

    const confirmRenameColumn = async () => {
        if (!inputValue.trim()) return;
        const slug = selectedSlug || selectedType; // Handle cases where slug passed as type

        setActionLoading(true);
        try {
            // Check if custom
            const isCustom = customTypes.some(t => t.slug === slug);
            if (isCustom) {
                await apiClient.updateVUFSAttributeType(slug, inputValue.trim());
            } else {
                // Standard Column - Update Global Alias
                const newAliases = { ...columnAliases, [slug]: inputValue.trim() };
                setColumnAliases(newAliases);
                await apiClient.updateVUFSSettings('column_aliases', newAliases);
            }
            await fetchAllData();
            closeModal();
        } catch (error) {
            console.error('Failed to rename column', error);
            // Fallback to alias if API fails? No, better to alert.
            alert('Failed to rename column');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmRenameItem = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);
        try {
            // Check if custom
            const isCustom = customTypes.some(t => t.slug === selectedSlug);

            if (isCustom) {
                await apiClient.updateVUFSAttributeValue(selectedId, inputValue.trim());
            } else {
                // Standard Types - Use selectedSlug (Internal ID) NOT selectedType (Display Alias)
                switch (selectedSlug) {
                    case 'Style / Category': await apiClient.updateVUFSCategory(selectedId, inputValue.trim()); break;
                    case 'Brand': await apiClient.updateVUFSBrand(selectedId, inputValue.trim()); break;
                    case 'Color': await apiClient.updateVUFSColor(selectedId, inputValue.trim()); break;
                    case 'Material': await apiClient.updateVUFSMaterial(selectedId, inputValue.trim()); break;
                    case 'Pattern': await apiClient.updateVUFSPattern(selectedId, inputValue.trim()); break;
                    case 'Fit': await apiClient.updateVUFSFit(selectedId, inputValue.trim()); break;
                    case 'Size': await apiClient.updateVUFSSize(selectedId, inputValue.trim()); break;
                    default:
                        // Fallback if slug missing, though unlikely given renderList logic
                        console.warn("Unknown standard type:", selectedSlug);
                }
            }

            await fetchAllData();
            closeModal();
        } catch (error) {
            console.error('Failed to rename item', error);
            alert('Failed to rename item');
        } finally {
            setActionLoading(false);
        }
    };

    const initiateAddColumn = () => {
        setModalAction('addColumn');
        setInputValue('');
    };

    const initiateDeleteColumn = (slug: string, name: string) => {
        setModalAction('deleteColumn');
        setSelectedSlug(slug);
        setSelectedType(name);
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setBulkInput(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    const confirmDelete = async () => {
        setActionLoading(true);
        try {
            // Check if it's a custom attribute value
            const isCustom = customTypes.some(t => t.slug === selectedSlug);

            if (isCustom) {
                await apiClient.deleteVUFSAttributeValue(selectedId);
            } else {
                // Standard types - Use selectedSlug
                switch (selectedSlug) {
                    case 'Style / Category': await apiClient.deleteVUFSCategory(selectedId); break;
                    case 'Brand': await apiClient.deleteVUFSBrand(selectedId); break;
                    case 'Color': await apiClient.deleteVUFSColor(selectedId); break;
                    case 'Material': await apiClient.deleteVUFSMaterial(selectedId); break;
                    case 'Pattern': await apiClient.deleteVUFSPattern(selectedId); break;
                    case 'Fit': await apiClient.deleteVUFSFit(selectedId); break;
                    case 'Size': await apiClient.deleteVUFSSize(selectedId); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete item.');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmAdd = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);

        try {
            // Check if it's a custom attribute value
            const customType = customTypes.find(t => t.name === selectedType || t.slug === selectedSlug);
            const isCustom = !!customType || (!!selectedSlug && customTypes.some(t => t.slug === selectedSlug));

            if (isCustom) {
                await apiClient.addVUFSAttributeValue(selectedSlug, inputValue);
            } else {
                // Standard Types - Use selectedSlug logic
                const stdType = selectedSlug || selectedType;
                switch (stdType) {
                    case 'Style / Category': await apiClient.addVUFSCategory({ name: inputValue, level: 'page' }); break;
                    case 'Brand': await apiClient.addVUFSBrand(inputValue); break;
                    case 'Color': await apiClient.addVUFSColor(inputValue); break;
                    case 'Material': await apiClient.addVUFSMaterial(inputValue); break;
                    case 'Pattern': await apiClient.addVUFSPattern(inputValue); break;
                    case 'Fit': await apiClient.addVUFSFit(inputValue); break;
                    case 'Size': await apiClient.addVUFSSize(inputValue); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            console.error('Add failed', err);
            alert(`Failed: ${err.message || 'Error adding item'}`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmAddColumn = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);
        try {
            const res = await apiClient.addVUFSAttributeType(inputValue);
            // Add new column to order
            setColumnOrder(prev => [...prev, (res as any).slug]);
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            alert(`Failed to add column: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDeleteColumn = async () => {
        const slug = selectedSlug || selectedType;
        setActionLoading(true);
        try {
            const isCustom = customTypes.some(t => t.slug === slug);
            if (isCustom) {
                await apiClient.deleteVUFSAttributeType(slug);
            } else {
                // Standard Column - Disable Globally
                const newDisabled = [...disabledColumns, slug];
                setDisabledColumns(newDisabled);
                await apiClient.updateVUFSSettings('disabled_columns', newDisabled);
                setColumnOrder(prev => prev.filter(s => s !== slug));
            }
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            alert(`Failed to delete column: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmBulkAdd = async () => {
        if (!bulkInput.trim()) return;
        setActionLoading(true);
        const items = bulkInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
        if (!items.length) { setActionLoading(false); return; }

        try {
            // Pass attributeSlug properly. Use selectedSlug as type if available (for standard columns) to ensure ID match.
            // If custom, selectedSlug acts as attributeSlug.
            const isCustom = customTypes.some(t => t.slug === selectedSlug);
            const typeToSend = isCustom ? 'custom' : (selectedSlug || selectedType);

            const res = await apiClient.bulkAddVUFSItems(typeToSend, items, selectedSlug);
            // @ts-ignore
            const { added, duplicates } = res.result || {};
            alert(`Bulk Add Completed!\nAdded: ${added}\nDuplicates Skipped: ${duplicates}`);
            await fetchAllData();
            closeModal();
        } catch (err: any) {
            console.error(err);
            alert('Failed to bulk add items.');
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setModalAction(null);
        setSelectedType('');
        setSelectedSlug('');
        setSelectedId('');
        setInputValue('');
        setBulkInput('');
        setEditingTab(null);
        setActionLoading(false);
    };

    if (authLoading || loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );

    const renderList = (title: string, items: VUFSItem[], bgClass: string, textClass: string, slug?: string, isCustomColumn = false) => (
        <div className="flex flex-col min-w-[220px] bg-white border-r last:border-r-0 h-full w-[250px]">
            <div className={`h-[50px] px-4 font-bold text-center border-b uppercase text-sm tracking-wider flex justify-between items-center group/header ${bgClass} ${textClass}`}>
                <span className="truncate" title={title}>{title}</span>
                <div className="flex gap-1 items-center">
                    <button
                        onClick={() => initiateRenameColumn({ slug: slug || title, name: title } as any)}
                        className="opacity-0 group-hover/header:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                        title="Rename Column"
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => initiateBulk(title, slug)}
                        className="text-[10px] bg-white/50 hover:bg-white text-gray-700 px-1.5 py-1 rounded transition-colors"
                        title="Bulk Add"
                    >
                        + Bulk
                    </button>
                    <button
                        onClick={() => initiateDeleteColumn(slug || title, title)}
                        className="opacity-0 group-hover/header:opacity-100 text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-1 rounded transition-all"
                        title="Delete Column"
                    >
                        Trash
                    </button>
                </div>
            </div>
            <div className="overflow-y-auto flex-1">
                {items.sort((a, b) => a.name.localeCompare(b.name)).map((item, idx) => (
                    <div key={item.id} className={`group p-3 border-b text-sm max-w-xs hover:bg-gray-100 flex justify-between items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="flex items-center overflow-hidden mr-2">
                            {/* Edit Icon Button for All Columns */}
                            <button
                                onClick={() => initiateRenameItem(item, title, slug)}
                                className="mr-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity focus:opacity-100"
                                title="Rename"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <span className="truncate font-medium text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {slug === 'Brand' && (
                                <a
                                    href={`/brands/${item.id}/edit`}
                                    target="_blank"
                                    className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 hover:text-blue-700 font-medium px-1 underline"
                                >
                                    Profile
                                </a>
                            )}
                            <button
                                onClick={() => initiateDelete(title, item.id, slug)}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 font-bold px-1 rounded transition-all duration-200 focus:opacity-100"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-4 text-gray-400 text-center italic text-xs">No items found</div>
                )}
            </div>
            <div className="p-3 border-t bg-gray-50">
                <button
                    onClick={() => initiateAdd(title, slug)}
                    className="w-full py-2 text-xs font-bold text-gray-600 hover:text-white hover:bg-blue-600 border border-gray-300 hover:border-blue-600 rounded transition-all duration-200 shadow-sm uppercase tracking-wide"
                >
                    + Add Item
                </button>
            </div>
        </div>
    );

    const renderGridView = () => {
        const activeTab = tabs.find(t => t.id === activeTabId);

        // Filter rows
        const rows = activeTab?.mainColumn === 'Brand' ? brands : categories;
        const rowLabel = activeTab?.mainColumn === 'Brand' ? 'Brand' : 'Apparel';
        const rowIdType = activeTab?.mainColumn;

        // Filter columns
        const visibleColumnSlugs = activeTab?.columns || [];

        // Define Mapped Columns (Pseudo-columns)
        const MAPPED_COLUMNS = [
            { slug: 'IS_SUBCATEGORY_1', name: 'Subcategory 1' }
        ];

        // Determine which columns to show. 
        // If "Subcategory 1" is in the visible list (or we enable it by default for testing), include it.
        // For now, let's treat IS_SUBCATEGORY_1 as available if selected or if configured.

        const visibleCustomTypes = customTypes.filter(t => visibleColumnSlugs.includes(t.slug));
        const visibleMappedTypes = MAPPED_COLUMNS.filter(t => visibleColumnSlugs.includes(t.slug));

        // Combine them for rendering headers
        const allVisibleColumns = [...visibleMappedTypes, ...visibleCustomTypes];

        return (
            <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
                {/* Tabs Bar - Fixed at top */}
                <div className="flex items-center gap-1 mb-0 border-b border-gray-200 bg-white px-2 pt-2 z-20 shrink-0">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-t border-l border-r border-b-0 cursor-pointer transition-colors relative top-[1px] ${activeTabId === tab.id ? 'bg-white text-blue-600 border-gray-200 z-10' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                            onClick={() => setActiveTabId(tab.id)}
                        >
                            <span>{tab.name}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); initiateConfigureTab(tab); }}
                                className={`ml-1 p-0.5 rounded hover:bg-gray-200 ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                title="Configure Tab"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => initiateConfigureTab()}
                        className="p-1.5 ml-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Add New Tab"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                {/* Table Container - Scrollable */}
                <div className="flex-1 overflow-auto p-6 pt-0">
                    <div className="bg-white border rounded-b shadow-sm min-w-max border-t-0">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-3 font-bold border-r w-48 sticky left-0 top-0 bg-gray-100 z-30 shadow-[1px_1px_0_0_rgba(0,0,0,0.05)]">{rowLabel}</th>
                                    {allVisibleColumns.length === 0 && (
                                        <th className="px-4 py-3 border-r min-w-[200px] text-gray-400 italic font-normal normal-case">
                                            No columns selected. Click "Configure Tab" to add columns.
                                        </th>
                                    )}
                                    {allVisibleColumns.map(type => (
                                        <th key={type.slug} className="px-4 py-3 border-r min-w-[200px] sticky top-0 bg-gray-100 z-20">
                                            <div className="flex items-center justify-between group">
                                                <span>{columnAliases[type.slug] || type.name}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => initiateRenameColumn(type as any)}
                                                        className="text-gray-500 hover:text-blue-600 p-1"
                                                        title="Rename Column"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => initiateDeleteColumn(type.slug, type.name)}
                                                        className="text-gray-400 hover:text-red-500 p-1 font-bold"
                                                        title="Delete Column"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.sort((a, b) => a.name.localeCompare(b.name)).map((row, idx) => (
                                    <tr key={row.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900 border-r bg-white sticky left-0 z-10 font-bold group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span>{row.name}</span>
                                                    {rowIdType === 'Brand' && (
                                                        <a
                                                            href={`/brands/${row.id}/edit`}
                                                            target="_blank"
                                                            className="text-xs text-blue-500 hover:text-blue-700 underline opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Profile
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => initiateRenameItem(row, rowLabel, rowIdType)} // Pass rowIdType as slug
                                                        className="text-gray-400 hover:text-blue-600 p-1"
                                                        title="Rename Item"
                                                    >
                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => initiateDelete(rowLabel, row.id, rowIdType)} // Pass rowIdType as slug
                                                        className="text-gray-400 hover:text-red-500 p-1 font-bold text-lg leading-none"
                                                        title="Delete Item"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        {allVisibleColumns.length === 0 && (
                                            <td className="px-4 py-4 border-r bg-gray-50/50"></td>
                                        )}
                                        {allVisibleColumns.map(type => {
                                            // Is this a mapped column?
                                            if (type.slug === 'IS_SUBCATEGORY_1') {
                                                // Handle Parent ID Logic
                                                // Find current parent
                                                const currentParentId = (row as VUFSCategoryOption).parentId;

                                                // Options for dropdown: prevent circular logic (can't be own child)
                                                // For simplicity, let's just show all other categories for now, or filter by level if strict
                                                const parentOptions = categories.filter(c => c.id !== row.id);

                                                return (
                                                    <td key={type.slug} className="px-2 py-2 border-r bg-blue-50/30 p-0">
                                                        <div className="relative">
                                                            <select
                                                                className="w-full h-full bg-transparent p-2 outline-none border-0 focus:ring-2 focus:ring-blue-100 rounded text-gray-900 font-medium appearance-none"
                                                                value={currentParentId || ''}
                                                                onChange={(e) => handleMatrixChange(row.id, type.slug, e.target.value)}
                                                            >
                                                                <option value="">- Top Level -</option>
                                                                {parentOptions.map(opt => (
                                                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // Standard Attribute Logic
                                            const key = `${row.id}:${type.slug}`;
                                            const currentVal = matrixValues[key] || '';
                                            const options = customValues[type.slug] || [];

                                            return (
                                                <td key={type.slug} className="px-2 py-2 border-r bg-white/50 p-0">
                                                    <div className="relative">
                                                        <select
                                                            className="w-full h-full bg-transparent p-2 outline-none border-0 focus:ring-2 focus:ring-blue-100 rounded text-gray-700 appearance-none"
                                                            value={currentVal}
                                                            onChange={(e) => handleMatrixChange(row.id, type.slug, e.target.value)}
                                                        >
                                                            <option value="">- Select -</option>
                                                            {options.map(opt => (
                                                                <option key={opt.id} value={opt.name}>{opt.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const getColumnContent = (colId: string) => {
        // Alias lookup
        const displayName = columnAliases[colId] || colId;
        const customType = customTypes.find(t => t.slug === colId);

        if (customType) {
            // Determine color scheme based on index or hash?
            // reuse existing logic or simple random
            const idx = customTypes.findIndex(t => t.slug === colId);
            const colors = [
                { bg: 'bg-orange-50', text: 'text-orange-900' },
                { bg: 'bg-teal-50', text: 'text-teal-900' },
                { bg: 'bg-rose-50', text: 'text-rose-900' },
                { bg: 'bg-cyan-50', text: 'text-cyan-900' },
            ];
            const scheme = colors[idx % colors.length] || colors[0];
            return renderList(customType.name, customValues[colId] || [], scheme.bg, scheme.text, colId, true);
        }

        // Standard Columns
        switch (colId) {
            case 'Style / Category': return renderList(displayName, categories, 'bg-purple-50', 'text-purple-900', colId);
            case 'Brand': return renderList(displayName, brands, 'bg-gray-100', 'text-gray-900', colId);
            case 'Size': return renderList(displayName, sizes, 'bg-indigo-50', 'text-indigo-900', colId);
            case 'Color': return renderList(displayName, colors, 'bg-pink-50', 'text-pink-900', colId);
            case 'Material': return renderList(displayName, materials, 'bg-green-50', 'text-green-900', colId);
            case 'Pattern': return renderList(displayName, patterns, 'bg-blue-50', 'text-blue-900', colId);
            case 'Fit': return renderList(displayName, fits, 'bg-yellow-50', 'text-yellow-900', colId);
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm z-20">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">VUFS Master Data</h1>
                    <p className="text-sm text-gray-500 mt-1">Vangarments Universal Fashion Standard Classification System</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Matrix View
                        </button>
                    </div>

                    {viewMode === 'list' && (
                        <button
                            onClick={initiateAddColumn}
                            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            <span className="text-lg font-bold">+</span>
                            <span className="text-sm font-semibold uppercase tracking-wide">Add Column</span>
                        </button>
                    )}
                </div>
            </header>

            {viewMode === 'list' ? (
                <div className="flex-1 overflow-x-auto">
                    {/* @ts-ignore */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={columnOrder}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex h-full min-w-max">
                                {columnOrder.map((colId) => {
                                    const content = getColumnContent(colId);
                                    if (!content) return null;
                                    return (
                                        <SortableColumn key={colId} id={colId}>
                                            {content}
                                        </SortableColumn>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            ) : (
                renderGridView()
            )}

            {/* Modals */}
            {(modalAction === 'renameColumn' || modalAction === 'renameItem') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {modalAction === 'renameItem' ? `Rename Item in "${selectedType}"` : 'Rename Column'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {modalAction === 'renameItem'
                                ? 'Renaming this item will update it everywhere it is used.'
                                : `Renaming "${selectedType}" will update the header for all users.`
                            }
                        </p>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none mb-6"
                            placeholder="Enter new name"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={modalAction === 'renameItem' ? confirmRenameItem : confirmRenameColumn}
                                disabled={actionLoading || !inputValue.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                                {actionLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalAction && modalAction !== 'renameColumn' && modalAction !== 'renameItem' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalAction === 'add' && `Add New ${selectedType}`}
                                {modalAction === 'delete' && `Delete Item`}
                                {modalAction === 'bulk' && `Bulk Add ${selectedType}`}
                                {modalAction === 'addColumn' && `Add New Column`}
                                {modalAction === 'addColumn' && `Add New Column`}
                                {modalAction === 'deleteColumn' && `Delete Column "${selectedType}"`}
                                {modalAction === 'configureTab' && `Configure Tab`}
                            </h3>
                        </div>

                        <div className="p-6">
                            {(modalAction === 'add' || modalAction === 'addColumn') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder={modalAction === 'addColumn' ? "e.g. Season, Occasion" : `Enter ${selectedType} name...`}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (modalAction === 'addColumn' ? confirmAddColumn() : confirmAdd())}
                                    />
                                </div>
                            )}

                            {(modalAction === 'delete') && (
                                <p className="text-gray-600">
                                    Are you sure you want to delete this item?
                                </p>
                            )}

                            {(modalAction === 'deleteColumn') && (
                                <p className="text-gray-600">
                                    Are you sure you want to delete the column <strong>{selectedType}</strong>? This will delete all items within it.
                                </p>
                            )}

                            {modalAction === 'configureTab' && editingTab && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tab Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={editingTab?.name || ''}
                                            onChange={(e) => editingTab && setEditingTab({ ...editingTab, name: e.target.value })}
                                            placeholder="e.g. Seasonal View"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Row Entity (Main Column)</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="mainColumn"
                                                    value="Style / Category"
                                                    checked={editingTab?.mainColumn === 'Style / Category'}
                                                    onChange={() => editingTab && setEditingTab({ ...editingTab, mainColumn: 'Style / Category' })}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Style / Category</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="mainColumn"
                                                    value="Brand"
                                                    checked={editingTab?.mainColumn === 'Brand'}
                                                    onChange={() => editingTab && setEditingTab({ ...editingTab, mainColumn: 'Brand' })}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">Brand</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Visible Attribute Columns</label>
                                        <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                                            {/* Subcategory 1 Pseudo-Column */}
                                            {editingTab?.mainColumn === 'Style / Category' && (
                                                <label className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer font-semibold bg-blue-50">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingTab?.columns?.includes('IS_SUBCATEGORY_1') ?? false}
                                                        onChange={(e) => {
                                                            const newCols = e.target.checked
                                                                ? ['IS_SUBCATEGORY_1', ...(editingTab?.columns || [])] // Add to start
                                                                : (editingTab?.columns || []).filter(c => c !== 'IS_SUBCATEGORY_1');
                                                            if (editingTab) setEditingTab({ ...editingTab, columns: newCols });
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-blue-800">Subcategory 1 (Hierarchy)</span>
                                                </label>
                                            )}

                                            {customTypes.map(type => (
                                                <label key={type.slug} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingTab?.columns?.includes(type.slug) ?? false}
                                                        onChange={(e) => {
                                                            const newCols = e.target.checked
                                                                ? [...(editingTab?.columns || []), type.slug]
                                                                : (editingTab?.columns || []).filter(c => c !== type.slug);
                                                            if (editingTab) setEditingTab({ ...editingTab, columns: newCols });
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">{type.name}</span>
                                                </label>
                                            ))}
                                            {customTypes.length === 0 && <div className="text-xs text-gray-400 italic">No custom attributes defined.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}



                            {modalAction === 'bulk' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV</label>
                                        <input
                                            type="file"
                                            accept=".csv,.txt"
                                            onChange={handleFileUpload}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full"
                                        />
                                    </div>
                                    <textarea
                                        className="w-full h-32 px-3 py-2 border rounded font-mono text-sm"
                                        placeholder={`Paste items here...`}
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>

                            {modalAction === 'configureTab' && editingTab && (
                                <button
                                    onClick={() => initiateDeleteTab(editingTab.id)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded mr-auto"
                                >
                                    Delete Tab
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (modalAction === 'addColumn') confirmAddColumn();
                                    else if (modalAction === 'deleteColumn') confirmDeleteColumn();
                                    else if (modalAction === 'add') confirmAdd();
                                    else if (modalAction === 'bulk') confirmBulkAdd();
                                    else if (modalAction === 'configureTab' && editingTab) initiateSaveTab(editingTab);
                                    else confirmDelete();
                                }}
                                className={`px-4 py-2 text-sm font-medium text-white rounded ${(modalAction === 'delete' || modalAction === 'deleteColumn') ? 'bg-red-600 hover:bg-red-700' :
                                    modalAction === 'bulk' ? 'bg-green-600 hover:bg-green-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' :
                                    (modalAction === 'bulk' ? 'Import Items' :
                                        modalAction === 'configureTab' ? 'Save Configuration' :
                                            'Confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
