'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    DragEndEvent,
    useSensors,
    useSensor,
    PointerSensor
} from '@dnd-kit/core';
import {
    EyeIcon,
    EyeSlashIcon,
    ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';

const AnyDndContext = DndContext as any;
const AnySortableContext = SortableContext as any;
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
    mainColumn: 'Apparel' | 'Brand' | 'Size';
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
// Sortable Matrix Header
function SortableMatrixHeader({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
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
        cursor: 'grab'
    };

    return (
        <th ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
            {children}
        </th>
    );
}

function SortableTab({ id, children, active }: { id: string, children: React.ReactNode, active: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-t border-l border-r border-b-0 cursor-pointer transition-colors relative top-[1px] select-none ${active ? 'bg-white text-blue-600 border-gray-200 z-10' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
        >
            {children}
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
    const [genders, setGenders] = useState<VUFSItem[]>([]);

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

    // Visualization Settings
    const [hiddenWardrobeColumns, setHiddenWardrobeColumns] = useState<string[]>([]);

    const toggleHiddenColumn = async (slug: string) => {
        const isHidden = hiddenWardrobeColumns.includes(slug);
        const newHidden = isHidden
            ? hiddenWardrobeColumns.filter(s => s !== slug)
            : [...hiddenWardrobeColumns, slug];

        setHiddenWardrobeColumns(newHidden);

        try {
            await apiClient.updateVUFSSettings('hidden_wardrobe_columns', newHidden);
        } catch (error) {
            console.error('Failed to update visualization settings', error);
            // Revert on error
            setHiddenWardrobeColumns(hiddenWardrobeColumns);
            setAlertMessage({ type: 'error', message: 'Failed to save settings' });
        }
    };



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
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('vufs_list_column_order', JSON.stringify(newOrder));
                return newOrder;
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
                    mainColumn: 'Apparel',
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
            // Load Settings
            try {
                const settings = await apiClient.getVUFSSettings();
                if (settings && (settings as any).hidden_wardrobe_columns) {
                    setHiddenWardrobeColumns((settings as any).hidden_wardrobe_columns);
                }
            } catch (e) { console.error('Error fetching settings', e); }

            const [
                catsRes,
                brandsRes,
                colorsRes,
                matsRes,
                patsRes,
                fitsRes,
                sizesRes,
                gendersRes,
                typesRes,
                catMatrixRes,
                brandMatrixRes,
                sizeMatrixRes,
                settingsRes
            ] = await Promise.all([
                apiClient.getVUFSCategories(),
                apiClient.getVUFSBrands(),
                apiClient.getVUFSColors(),
                apiClient.getVUFSMaterials(),
                apiClient.getVUFSPatterns(),
                apiClient.getVUFSFits(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSGenders(),
                apiClient.getVUFSAttributeTypes(),
                apiClient.getAllCategoryAttributes(),
                apiClient.getAllBrandAttributes(),
                apiClient.getAllSizeAttributes(),
                apiClient.getVUFSSettings().catch(e => { console.warn('Failed to load settings', e); return {}; })
            ]);

            // Handle Settings
            const settingsData = settingsRes as Record<string, any>;
            if (settingsData && settingsData['column_aliases']) {
                setColumnAliases(settingsData['column_aliases']);
            }
            if (settingsData && settingsData['disabled_columns']) {
                setDisabledColumns(settingsData['disabled_columns']);
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
            setGenders(Array.isArray(gendersRes) ? gendersRes : (gendersRes?.genders || []));

            // Handle Custom Attributes
            const typesData: AttributeType[] = Array.isArray(typesRes) ? typesRes : (typesRes?.types || []);
            setCustomTypes(typesData);

            // Fetch values for custom types
            const valuesMap: Record<string, VUFSItem[]> = {};
            await Promise.all(typesData.map(async (type) => {
                try {
                    const valuesRes = await apiClient.getVUFSAttributeValues(type.slug);
                    valuesMap[type.slug] = Array.isArray(valuesRes) ? valuesRes : (valuesRes?.values || []);
                } catch (e) {
                    valuesMap[type.slug] = [];
                }
            }));
            setCustomValues(valuesMap);

            // Column Order
            const allColumns = ['Style / Category', 'Brand', 'Gender', 'Size', 'Color', 'Material', 'Pattern', 'Fit', ...typesData.map(t => t.slug)];
            const storedOrder = localStorage.getItem('vufs_list_column_order');
            if (storedOrder) {
                try {
                    const parsedOrder = JSON.parse(storedOrder);
                    const currentSet = new Set(typesData.map(t => t.slug).concat(['Style / Category', 'Brand', 'Gender', 'Size', 'Color', 'Material', 'Pattern', 'Fit']));
                    const validStored = parsedOrder.filter((s: string) => currentSet.has(s));
                    const storedSet = new Set(validStored);
                    const missing = Array.from(currentSet).filter((s) => !storedSet.has(s as string));
                    setColumnOrder([...validStored, ...missing]);
                } catch (e) { setColumnOrder(allColumns); }
            } else {
                setColumnOrder(allColumns);
            }

            // Matrix Values
            const matrixMap: Record<string, string> = {};
            const catMatrixData = Array.isArray(catMatrixRes) ? catMatrixRes : (catMatrixRes?.attributes || []);
            catMatrixData.forEach((item: any) => matrixMap[`${item.category_id}:${item.attribute_slug}`] = item.value);

            const brandMatrixData = Array.isArray(brandMatrixRes) ? brandMatrixRes : (brandMatrixRes?.attributes || []);
            brandMatrixData.forEach((item: any) => matrixMap[`${item.brand_id}:${item.attribute_slug}`] = item.value);

            const sizeMatrixData = Array.isArray(sizeMatrixRes) ? sizeMatrixRes : (sizeMatrixRes?.attributes || []);
            sizeMatrixData.forEach((item: any) => matrixMap[`${item.size_id}:${item.attribute_slug}`] = item.value);

            setMatrixValues(matrixMap);

        } catch (err) {
            console.error('Failed to fetch VUFS data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMatrixChange = async (entityId: string, attributeSlug: string, value: string) => {
        const key = `${entityId}:${attributeSlug}`;
        setMatrixValues(prev => ({ ...prev, [key]: value }));

        const activeTab = tabs.find(t => t.id === activeTabId);
        const mainCol = activeTab?.mainColumn || 'Apparel';

        try {
            if (activeTab?.mainColumn === 'Apparel' && attributeSlug === 'IS_SUBCATEGORY_1') {
                await apiClient.updateVUFSCategory(entityId, { parentId: value || null });
                await fetchAllData();
            } else if (mainCol === 'Apparel') {
                await apiClient.setCategoryAttribute(entityId, attributeSlug, value);
            } else if (mainCol === 'Brand') {
                await apiClient.setBrandAttribute(entityId, attributeSlug, value);
            } else if (mainCol === 'Size') {
                await apiClient.setSizeAttribute(entityId, attributeSlug, value);
            }
        } catch (err) {
            console.error('Failed to save attribute', err);
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
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Handlers
    const initiateDelete = (type: string, id: string, slug?: string) => {
        setModalAction('delete');
        setSelectedType(type);
        setSelectedId(id);
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
        if (index > -1) newTabs[index] = tabConfig;
        else newTabs.push(tabConfig);
        setTabs(newTabs);
        localStorage.setItem('vufs_matrix_tabs', JSON.stringify(newTabs));
        if (!activeTabId || activeTabId === tabConfig.id) setActiveTabId(tabConfig.id);
        closeModal();
    };

    const initiateDeleteTab = (tabId: string) => {
        if (tabs.length <= 1) {
            setAlertMessage({ type: 'error', message: "Cannot delete last tab." });
            return;
        }
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        localStorage.setItem('vufs_matrix_tabs', JSON.stringify(newTabs));
        if (activeTabId === tabId) setActiveTabId(newTabs[0].id);
        closeModal();
    };

    const initiateConfigureTab = (tab?: TabConfig) => {
        if (tab) setEditingTab(tab);
        else setEditingTab({ id: crypto.randomUUID(), name: 'New Tab', mainColumn: 'Apparel', columns: [] });
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
        setSelectedSlug(typeSlug || typeName);
        setInputValue(item.name);
    };

    const confirmRenameColumn = async () => {
        if (!inputValue.trim()) return;
        const slug = selectedSlug || selectedType;
        setActionLoading(true);
        try {
            const isCustom = customTypes.some(t => t.slug === slug);
            if (isCustom) await apiClient.updateVUFSAttributeType(slug, inputValue.trim());
            else {
                const newAliases = { ...columnAliases, [slug]: inputValue.trim() };
                setColumnAliases(newAliases);
                await apiClient.updateVUFSSettings('column_aliases', newAliases);
            }
            await fetchAllData();
            closeModal();
        } catch (error) { setAlertMessage({ type: 'error', message: 'Failed to rename column' }); }
        finally { setActionLoading(false); }
    };

    const confirmRenameItem = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);
        try {
            const isCustom = customTypes.some(t => t.slug === selectedSlug);
            if (isCustom) await apiClient.updateVUFSAttributeValue(selectedId, inputValue.trim());
            else {
                switch (selectedType) {
                    case 'Apparel': await apiClient.updateVUFSCategory(selectedId, inputValue.trim()); break;
                    case 'Brand': await apiClient.updateVUFSBrand(selectedId, inputValue.trim()); break;
                    case 'Color': await apiClient.updateVUFSColor(selectedId, inputValue.trim()); break;
                    case 'Material': await apiClient.updateVUFSMaterial(selectedId, inputValue.trim()); break;
                    case 'Pattern': await apiClient.updateVUFSPattern(selectedId, inputValue.trim()); break;
                    case 'Fit': await apiClient.updateVUFSFit(selectedId, inputValue.trim()); break;
                    case 'Size': await apiClient.updateVUFSSize(selectedId, inputValue.trim()); break;
                    case 'Gender': await apiClient.updateVUFSGender(selectedId, inputValue.trim()); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err) { setAlertMessage({ type: 'error', message: 'Failed to rename item' }); }
        finally { setActionLoading(false); }
    };

    const initiateAddColumn = () => {
        setModalAction('addColumn');
        setInputValue('');
    };

    const initiateDeleteColumn = (slug: string, name: string) => {
        setModalAction('deleteColumn');
        setSelectedSlug(slug);
        setSelectedType(name);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setBulkInput(event.target?.result as string);
        reader.readAsText(file);
    };

    const confirmDelete = async () => {
        setActionLoading(true);
        try {
            const isCustom = customTypes.some(t => t.slug === selectedSlug);
            if (isCustom) await apiClient.deleteVUFSAttributeValue(selectedId);
            else {
                switch (selectedType) {
                    case 'Apparel': await apiClient.deleteVUFSCategory(selectedId); break;
                    case 'Brand': await apiClient.deleteVUFSBrand(selectedId); break;
                    case 'Color': await apiClient.deleteVUFSColor(selectedId); break;
                    case 'Material': await apiClient.deleteVUFSMaterial(selectedId); break;
                    case 'Pattern': await apiClient.deleteVUFSPattern(selectedId); break;
                    case 'Fit': await apiClient.deleteVUFSFit(selectedId); break;
                    case 'Size': await apiClient.deleteVUFSSize(selectedId); break;
                    case 'Gender': await apiClient.deleteVUFSGender(selectedId); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err) { setAlertMessage({ type: 'error', message: 'Failed to delete item.' }); }
        finally { setActionLoading(false); }
    };

    const confirmAdd = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);
        try {
            const isCustom = !!selectedSlug && customTypes.some(t => t.slug === selectedSlug);
            if (isCustom) await apiClient.addVUFSAttributeValue(selectedSlug, inputValue);
            else {
                switch (selectedType) {
                    case 'Apparel': await apiClient.addVUFSCategory({ name: inputValue, level: 'page' }); break;
                    case 'Brand': await apiClient.addVUFSBrand(inputValue); break;
                    case 'Color': await apiClient.addVUFSColor(inputValue); break;
                    case 'Material': await apiClient.addVUFSMaterial(inputValue); break;
                    case 'Pattern': await apiClient.addVUFSPattern(inputValue); break;
                    case 'Fit': await apiClient.addVUFSFit(inputValue); break;
                    case 'Size': await apiClient.addVUFSSize(inputValue); break;
                    case 'Gender': await apiClient.addVUFSGender(inputValue); break;
                }
            }
            await fetchAllData();
            closeModal();
        } catch (err: any) { setAlertMessage({ type: 'error', message: `Failed: ${err.message || 'Error adding item'}` }); }
        finally { setActionLoading(false); }
    };

    const confirmAddColumn = async () => {
        if (!inputValue.trim()) return;
        setActionLoading(true);
        try {
            const res = await apiClient.addVUFSAttributeType(slugify(inputValue), inputValue);
            setColumnOrder(prev => [...prev, (res as any).slug]);
            await fetchAllData();
            closeModal();
        } catch (err: any) { setAlertMessage({ type: 'error', message: `Failed to add column: ${err.message}` }); }
        finally { setActionLoading(false); }
    };

    const confirmDeleteColumn = async () => {
        const slug = selectedSlug || selectedType;
        setActionLoading(true);
        try {
            const isCustom = customTypes.some(t => t.slug === slug);
            if (isCustom) await apiClient.deleteVUFSAttributeType(slug);
            else {
                const newDisabled = [...disabledColumns, slug];
                setDisabledColumns(newDisabled);
                await apiClient.updateVUFSSettings('disabled_columns', newDisabled);
                setColumnOrder(prev => prev.filter(s => s !== slug));
            }
            await fetchAllData();
            closeModal();
        } catch (err: any) { setAlertMessage({ type: 'error', message: `Failed to delete column: ${err.message}` }); }
        finally { setActionLoading(false); }
    };

    const confirmBulkAdd = async () => {
        if (!bulkInput.trim()) return;
        setActionLoading(true);
        const items = bulkInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
        if (!items.length) { setActionLoading(false); return; }
        try {
            // Check if custom
            const isCustom = customTypes.some(t => t.slug === selectedSlug);
            const typeToSend = isCustom ? 'custom' : (selectedSlug || selectedType);

            const res = await apiClient.bulkAddVUFSItems(typeToSend, items, selectedSlug);
            // @ts-ignore
            const { added, duplicates } = res.result || {};
            setAlertMessage({ type: 'success', message: `Bulk Add Completed!\nAdded: ${added}\nDuplicates: ${duplicates}` });
            await fetchAllData();
            closeModal();
        } catch (err) { setAlertMessage({ type: 'error', message: 'Failed to bulk add items.' }); }
        finally { setActionLoading(false); }
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
        <div className="flex flex-col min-w-[320px] bg-white border-r last:border-r-0 h-full w-[320px]">
            <div className={`h-[50px] px-4 font-bold text-center border-b text-sm tracking-wider flex justify-between items-center group/header ${bgClass} ${textClass}`}>
                <span className="truncate" title={title}>{title}</span>
                <div className="flex gap-1 items-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); initiateRenameColumn({ slug: slug || title, name: title } as any); }}
                        className="opacity-0 group-hover/header:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                        title="Rename Column"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); initiateBulk(title, slug); }}
                        className="text-[10px] bg-white/50 hover:bg-white text-gray-700 px-1.5 py-1 rounded transition-colors"
                        title="Bulk Add"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        + Bulk
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleHiddenColumn(slug || title); }}
                        className={`text-[10px] px-1.5 py-1 rounded transition-colors ml-1 ${hiddenWardrobeColumns?.includes(slug || title) ? 'text-gray-400 bg-gray-100' : 'text-blue-600 bg-blue-50'}`}
                        title={hiddenWardrobeColumns?.includes(slug || title) ? "Show in Wardrobe" : "Hide in Visualization"}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {hiddenWardrobeColumns?.includes(slug || title) ? <EyeSlashIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                    </button>
                    <button
                        onClick={() => initiateDeleteColumn((slug || title), title)}
                        className="opacity-0 group-hover/header:opacity-100 text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-1 rounded transition-all"
                        title="Delete Column"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        Trash
                    </button>
                </div>
            </div>
            <div className={`overflow-y-auto flex-1 ${items.length === 0 ? 'flex items-center justify-center' : ''}`}>
                {items.length === 0 && (
                    <div className="text-gray-400 italic text-xs py-10">No items found</div>
                )}
                {items.length > 0 && items.sort((a, b) => a.name.localeCompare(b.name)).map((item, idx) => (
                    <div key={item.id} className={`group p-3 border-b text-sm max-w-xs hover:bg-gray-100 flex justify-between items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="flex items-center overflow-hidden mr-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); initiateRenameItem(item, title, slug); }}
                                className="mr-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity focus:opacity-100"
                                title="Rename"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <span className="truncate font-medium text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {slug === 'Brand' && (
                                <a href={`/brands/${item.id}/edit`} target="_blank" className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 hover:text-blue-700 font-medium px-1 underline">Profile</a>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); initiateDelete(title, item.id, slug); }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 font-bold px-1 rounded transition-all duration-200 focus:opacity-100"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t bg-gray-50">
                <button
                    onClick={(e) => { e.stopPropagation(); initiateAdd(title, slug); }}
                    className="w-full py-2 text-xs font-bold text-gray-600 hover:text-white hover:bg-blue-600 border border-gray-300 hover:border-blue-600 rounded transition-all duration-200 shadow-sm uppercase tracking-wide"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    + Add Item
                </button>
            </div>
        </div>
    );

    const handleMatrixDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab) return;
        const oldIndex = activeTab.columns.indexOf(active.id as string);
        const newIndex = activeTab.columns.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newColumns = arrayMove(activeTab.columns, oldIndex, newIndex);
            const newTabs = tabs.map(t => t.id === activeTabId ? { ...t, columns: newColumns } : t);
            setTabs(newTabs);
            localStorage.setItem('vufs_matrix_tabs', JSON.stringify(newTabs));
        }
    };

    const handleTabDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = tabs.findIndex(t => t.id === active.id);
        const newIndex = tabs.findIndex(t => t.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newTabs = arrayMove(tabs, oldIndex, newIndex);
            setTabs(newTabs);
            localStorage.setItem('vufs_matrix_tabs', JSON.stringify(newTabs));
        }
    };



    const getColumnContent = (colId: string) => {
        const displayName = columnAliases[colId] || colId;
        const customType = customTypes.find(t => t.slug === colId);

        if (customType) {
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

        switch (colId) {
            case 'Style / Category': return renderList(displayName, categories, 'bg-purple-50', 'text-purple-900', colId);
            case 'Brand': return renderList(displayName, brands, 'bg-gray-100', 'text-gray-900', colId);
            case 'Gender': return renderList(displayName, genders, 'bg-pink-50', 'text-pink-900', colId);
            case 'Size': return renderList(displayName, sizes, 'bg-indigo-50', 'text-indigo-900', colId);
            case 'Color': return renderList(displayName, colors, 'bg-pink-50', 'text-pink-900', colId);
            case 'Material': return renderList(displayName, materials, 'bg-green-50', 'text-green-900', colId);
            case 'Pattern': return renderList(displayName, patterns, 'bg-blue-50', 'text-blue-900', colId);
            case 'Fit': return renderList(displayName, fits, 'bg-yellow-50', 'text-yellow-900', colId);
            default: return null;
        }
    };

    const renderGridView = () => {
        const activeTab = tabs.find(t => t.id === activeTabId);
        let rows = categories;
        let rowLabel = 'Apparel';
        if (activeTab?.mainColumn === 'Brand') { rows = brands; rowLabel = 'Brand'; }
        else if (activeTab?.mainColumn === 'Size') { rows = sizes; rowLabel = 'Size'; }

        const visibleColumnSlugs = activeTab?.columns || [];
        const MAPPED_COLUMNS = [{ slug: 'IS_SUBCATEGORY_1', name: 'Subcategory 1' }];
        const allVisibleColumns = visibleColumnSlugs.map(slug => {
            const mapped = MAPPED_COLUMNS.find(c => c.slug === slug);
            if (mapped) return mapped;
            const custom = customTypes.find(c => c.slug === slug);
            if (custom) return custom;
            return null;
        }).filter((t): t is AttributeType | { slug: string, name: string } => !!t);

        return (
            <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
                <div className="flex items-center gap-1 mb-0 border-b border-gray-200 bg-white px-2 pt-2 z-20 shrink-0 min-h-[45px]">
                    {/* @ts-ignore */}
                    <AnyDndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
                        <AnySortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                            {tabs.map(tab => (
                                <SortableTab key={tab.id} id={tab.id} active={activeTabId === tab.id}>
                                    <div className="flex items-center gap-2" onClick={() => setActiveTabId(tab.id)}>
                                        <span>{tab.name}</span>
                                        <button onClick={(e) => { e.stopPropagation(); initiateConfigureTab(tab); }} className={`ml-1 p-0.5 rounded hover:bg-gray-200 ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} title="Configure Tab" onPointerDown={(e) => e.stopPropagation()}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </button>
                                    </div>
                                </SortableTab>
                            ))}
                        </AnySortableContext>
                    </AnyDndContext>
                    <button onClick={() => initiateConfigureTab()} className="p-1.5 ml-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors" title="Add New Tab">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-6 pt-0">
                    <div className="bg-white border rounded-b shadow-sm min-w-max border-t-0">
                        {/* @ts-ignore */}
                        {/* @ts-ignore */}
                        <AnyDndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMatrixDragEnd}>
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-4 py-3 font-bold border-r w-48 sticky left-0 top-0 bg-gray-100 z-30 shadow-[1px_1px_0_0_rgba(0,0,0,0.05)]">{rowLabel}</th>
                                        <AnySortableContext items={allVisibleColumns.map(c => c.slug)} strategy={horizontalListSortingStrategy}>
                                            {allVisibleColumns.map(type => (
                                                <SortableMatrixHeader key={type.slug} id={type.slug} className="px-4 py-3 border-r min-w-[320px] sticky top-0 bg-gray-100 z-20">
                                                    <div className="flex items-center justify-between group cursor-grab active:cursor-grabbing">
                                                        <span>{columnAliases[type.slug] || type.name}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); toggleHiddenColumn(type.slug); }}
                                                                className={`p-1 rounded hover:bg-white transition-colors ${hiddenWardrobeColumns?.includes(type.slug) ? 'text-gray-400' : 'text-blue-600'}`}
                                                                title={hiddenWardrobeColumns?.includes(type.slug) ? "Show in Wardrobe" : "Hide in Visualization"}
                                                                onPointerDown={(e) => e.stopPropagation()}
                                                            >
                                                                {hiddenWardrobeColumns?.includes(type.slug) ? <EyeSlashIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); initiateRenameColumn(type as any); }} className="text-gray-500 hover:text-blue-600 p-1" title="Rename Column" onPointerDown={e => e.stopPropagation()}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); initiateDeleteColumn(type.slug, type.name); }} className="text-gray-400 hover:text-red-500 p-1 font-bold" title="Delete Column" onPointerDown={e => e.stopPropagation()}>&times;</button>
                                                            <span className="text-gray-300 ml-1 cursor-grab" title="Drag to reorder">⋮⋮</span>
                                                        </div>
                                                    </div>
                                                </SortableMatrixHeader>
                                            ))}
                                        </AnySortableContext>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.sort((a, b) => a.name.localeCompare(b.name)).map((row, idx) => (
                                        <tr key={row.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900 border-r bg-white sticky left-0 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center justify-between group">
                                                    <span>{row.name}</span>
                                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); initiateRenameItem(row, row.name, rowLabel); }}
                                                            className="p-1 text-gray-400 hover:text-blue-600"
                                                            title="Rename"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); initiateDelete(rowLabel, row.id, row.slug); }}
                                                            className="p-1 text-gray-400 hover:text-red-500"
                                                            title="Delete"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            {allVisibleColumns.map(col => (
                                                <td key={col.slug} className="px-4 py-2 border-r min-w-[320px]">
                                                    <input
                                                        type="text"
                                                        value={matrixValues[`${row.id}:${col.slug}`] || ''}
                                                        onChange={(e) => handleMatrixChange(row.id, col.slug, e.target.value)}
                                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        placeholder="-"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </AnyDndContext>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white">
            <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm z-20">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">VUFS Master Data</h1>
                    <p className="text-sm text-gray-500 mt-1">Vangarments Universal Fashion Standard Classification System</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={initiateAddColumn}
                        className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                    >
                        <span className="text-lg font-bold">+</span>
                        <span className="text-sm font-semibold uppercase tracking-wide">Add Column</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto">
                {/* @ts-ignore */}
                {/* @ts-ignore */}
                <AnyDndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <AnySortableContext
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
                    </AnySortableContext>
                </AnyDndContext>
            </div>

            {/* Modals */}
            {
                (modalAction === 'renameColumn' || modalAction === 'renameItem') && (
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
                )
            }

            {
                modalAction && modalAction !== 'renameColumn' && modalAction !== 'renameItem' && (
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
                                                        value="Apparel"
                                                        checked={editingTab?.mainColumn === 'Apparel'}
                                                        onChange={() => editingTab && setEditingTab({ ...editingTab, mainColumn: 'Apparel' })}
                                                        className="text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">Apparel (Categories)</span>
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
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="mainColumn"
                                                        value="Size"
                                                        checked={editingTab?.mainColumn === 'Size'}
                                                        onChange={() => editingTab && setEditingTab({ ...editingTab, mainColumn: 'Size' })}
                                                        className="text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm">Size</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Visible Attribute Columns</label>
                                            <div className="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                                                {/* Subcategory 1 Pseudo-Column */}
                                                {editingTab.mainColumn === 'Apparel' && (
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
                )
            }

            {alertMessage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 animate-in zoom-in duration-200">
                        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${alertMessage.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                            {alertMessage.type === 'error' ? (
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <h3 className={`text-lg font-medium text-center mb-2 ${alertMessage.type === 'error' ? 'text-red-900' : 'text-gray-900'}`}>
                            {alertMessage.type === 'error' ? 'Error' : 'Success'}
                        </h3>
                        <div className="mt-2 text-center">
                            <p className="text-sm text-gray-500 whitespace-pre-line">
                                {alertMessage.message}
                            </p>
                        </div>
                        <div className="mt-5">
                            <button
                                type="button"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${alertMessage.type === 'error' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-black hover:bg-gray-800 focus:ring-gray-500'}`}
                                onClick={() => setAlertMessage(null)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
