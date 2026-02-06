// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { MagnifyingGlassIcon, TrashIcon, FolderIcon, PlusIcon, ChevronRightIcon, ChevronDownIcon, Bars3Icon, PencilSquareIcon, ArrowsRightLeftIcon, TagIcon } from '@heroicons/react/24/outline';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Combobox, Transition, Menu } from '@headlessui/react';
import toast from 'react-hot-toast';
import { SmartCombobox } from '@/components/ui/SmartCombobox';
import { ApparelIcon, ICON_GROUPS } from '@/components/ui/ApparelIcons';
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
    skuRef?: string;
}

// Map Google Shopping info
const GOOGLE_SHOPPING_MAP: Record<string, { category: string; code: string }> = {
    // Tops
    't-shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'baby tee': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'long-sleeved t-shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'polo shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Polos', code: '5388' },
    'button-up shirt': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'tank top': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'crop top': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'blouse': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'henley': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    'jersey': { category: 'Apparel & Accessories > Clothing > Shirts & Tops', code: '212' },
    // Sweaters & Hoodies
    'sweater': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweaters', code: '5441' },
    'hoodie': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts', code: '5365' },
    'sweatshirt': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts', code: '5365' },
    'cardigan': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweaters', code: '5441' },
    'pullover': { category: 'Apparel & Accessories > Clothing > Shirts & Tops > Sweaters', code: '5441' },
    // Outerwear
    'jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'bomber jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'button-up jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'zip-up jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'coat': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'puffer jacket': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'windbreaker': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'trench coat': { category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets', code: '203' },
    'vest': { category: 'Apparel & Accessories > Clothing > Outerwear > Vests', code: '5506' },
    // Bottoms
    'jeans': { category: 'Apparel & Accessories > Clothing > Pants > Jeans', code: '204' },
    'pants': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
    'trousers': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
    'chinos': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
    'cargo pants': { category: 'Apparel & Accessories > Clothing > Pants', code: '204' },
    'joggers': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatpants', code: '5463' },
    'sweatpants': { category: 'Apparel & Accessories > Clothing > Activewear > Sweatpants', code: '5463' },
    'leggings': { category: 'Apparel & Accessories > Clothing > Pants > Leggings', code: '5460' },
    'shorts': { category: 'Apparel & Accessories > Clothing > Shorts', code: '207' },
    'skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
    'mini skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
    'midi skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
    'maxi skirt': { category: 'Apparel & Accessories > Clothing > Skirts', code: '208' },
    // One-Pieces
    'dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
    'maxi dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
    'midi dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
    'mini dress': { category: 'Apparel & Accessories > Clothing > Dresses', code: '2271' },
    'jumpsuit': { category: 'Apparel & Accessories > Clothing > One-Pieces > Jumpsuits & Rompers', code: '5250' },
    'romper': { category: 'Apparel & Accessories > Clothing > One-Pieces > Jumpsuits & Rompers', code: '5250' },
    'overalls': { category: 'Apparel & Accessories > Clothing > One-Pieces > Overalls', code: '5322' },
    'bodysuit': { category: 'Apparel & Accessories > Clothing > One-Pieces', code: '184' },
    // Suits & Formal
    'suit': { category: 'Apparel & Accessories > Clothing > Suits', code: '5466' },
    'blazer': { category: 'Apparel & Accessories > Clothing > Suits > Suit Jackets', code: '5427' },
    'sport coat': { category: 'Apparel & Accessories > Clothing > Suits > Suit Jackets', code: '5427' },
    // Swimwear
    'swimsuit': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
    'bikini': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
    'swim trunks': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
    'board shorts': { category: 'Apparel & Accessories > Clothing > Swimwear', code: '211' },
    // Underwear
    'underwear': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Underwear', code: '213' },
    'boxers': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Underwear', code: '213' },
    'briefs': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Underwear', code: '213' },
    'bra': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Bras', code: '214' },
    'socks': { category: 'Apparel & Accessories > Clothing > Underwear & Socks > Socks', code: '209' },
    // Footwear
    'shoes': { category: 'Apparel & Accessories > Shoes', code: '187' },
    'sneakers': { category: 'Apparel & Accessories > Shoes > Athletic Shoes', code: '187' },
    'boots': { category: 'Apparel & Accessories > Shoes > Boots', code: '187' },
    'sandals': { category: 'Apparel & Accessories > Shoes > Sandals', code: '187' },
    'loafers': { category: 'Apparel & Accessories > Shoes > Flats & Loafers', code: '187' },
    'heels': { category: 'Apparel & Accessories > Shoes > Heels', code: '187' },
    'slippers': { category: 'Apparel & Accessories > Shoes > Slippers', code: '187' },
    // Headwear
    'hat': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    'cap': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    'beanie': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    'bucket hat': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    'fedora': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    'beret': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    'visor': { category: 'Apparel & Accessories > Clothing Accessories > Hats', code: '173' },
    // Bags
    'bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '6551' },
    'backpack': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Backpacks', code: '110' },
    'tote': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Totes', code: '6551' },
    'crossbody bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '6551' },
    'clutch': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Clutches & Special Occasion Bags', code: '178' },
    'shoulder bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '6551' },
    'duffle bag': { category: 'Apparel & Accessories > Luggage & Bags > Duffel Bags', code: '110' },
    'messenger bag': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Messenger Bags', code: '110' },
    'fanny pack': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Handbags', code: '110' },
    // Wallets & Small Leather Goods
    'wallet': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips', code: '6169' },
    'card holder': { category: 'Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips', code: '6169' },
    // Accessories
    'belt': { category: 'Apparel & Accessories > Clothing Accessories > Belts', code: '174' },
    'scarf': { category: 'Apparel & Accessories > Clothing Accessories > Scarves & Shawls', code: '175' },
    'gloves': { category: 'Apparel & Accessories > Clothing Accessories > Gloves & Mittens', code: '2020' },
    'tie': { category: 'Apparel & Accessories > Clothing Accessories > Neckties', code: '176' },
    'bow tie': { category: 'Apparel & Accessories > Clothing Accessories > Neckties', code: '176' },
    'sunglasses': { category: 'Apparel & Accessories > Clothing Accessories > Sunglasses', code: '178' },
    'watch': { category: 'Apparel & Accessories > Jewelry > Watches', code: '201' },
    'jewelry': { category: 'Apparel & Accessories > Jewelry', code: '188' },
    'necklace': { category: 'Apparel & Accessories > Jewelry > Necklaces', code: '196' },
    'bracelet': { category: 'Apparel & Accessories > Jewelry > Bracelets', code: '191' },
    'ring': { category: 'Apparel & Accessories > Jewelry > Rings', code: '200' },
    'earrings': { category: 'Apparel & Accessories > Jewelry > Earrings', code: '194' },
    'keychain': { category: 'Apparel & Accessories > Clothing Accessories > Keychains', code: '3081' },
};

// Required attributes for Item level
const REQUIRED_ATTRIBUTES = [
    { slug: 'subcategory-1', name: 'Subcategory 1' },
    { slug: 'subcategory-2', name: 'Subcategory 2' },
    { slug: 'subcategory-3', name: 'Subcategory 3' },
    { slug: 'google-shopping-category', name: 'Google Shopping Category' },
    { slug: 'google-shopping-code', name: 'Google Shopping Code' },
    { slug: 'height-cm', name: 'Height (cm)' },
    { slug: 'length-cm', name: 'Length (cm)' },
    { slug: 'width-cm', name: 'Width (cm)' },
    { slug: 'weight-kg', name: 'Weight (kg)' },
    { slug: 'possible-sizes', name: 'Possible Sizes' },
    { slug: 'possible-fits', name: 'Possible Fits' },
    { slug: 'icon-slug', name: 'Icon' }
];

// Sortable Item Component with Move To dropdown

// Sortable Item Component with Move To dropdown
function SortableItem({ item, onEdit, onDelete, showHandle = true, onMoveToLevel, availableLevels, icon: Icon = FolderIcon }: {
    item: AttributeValue;
    onEdit: (item: AttributeValue) => void;
    onDelete: (id: string) => void;
    showHandle?: boolean;
    onMoveToLevel?: (itemId: string, newLevel: string) => void;
    availableLevels?: { slug: string; name: string }[];
    icon?: any;
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
                <Icon className="h-5 w-5 text-gray-400" />
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
    const [tierLabels, setTierLabels] = useState<Record<string, string>>({
        'subcategory-1': 'Department',
        'subcategory-2': 'Category',
        'subcategory-3': 'Subcategory',
        'apparel': 'Item'
    });
    const [isRenamingTiers, setIsRenamingTiers] = useState(false);
    const [newTierLabels, setNewTierLabels] = useState<Record<string, string>>({});
    const [subcategory1Values, setSubcategory1Values] = useState<AttributeValue[]>([]);
    const [subcategory2Values, setSubcategory2Values] = useState<AttributeValue[]>([]);
    const [subcategory3Values, setSubcategory3Values] = useState<AttributeValue[]>([]);
    const [apparelValues, setApparelValues] = useState<AttributeValue[]>([]);

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'subcategory-1' | 'subcategory-2' | 'subcategory-3' | 'item' | 'item-paths'>('subcategory-1');

    // Edit/Create State
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [selectedValue, setSelectedValue] = useState<AttributeValue | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({ name: '', parentId: '', skuRef: '' });
    const [saving, setSaving] = useState(false);

    // Auxiliary Data for Item form
    const [sizes, setSizes] = useState<any[]>([]);
    const [fits, setFits] = useState<any[]>([]);
    const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
    const [pomCategories, setPomCategories] = useState<any[]>([]);
    const [pomDefinitions, setPomDefinitions] = useState<any[]>([]);
    const [selectedPOMs, setSelectedPOMs] = useState<string[]>([]);
    const [expandedPOMCategories, setExpandedPOMCategories] = useState<Set<string>>(new Set());
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [packageMeasurementTypes, setPackageMeasurementTypes] = useState<any[]>([]);
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
            // Fetch all attribute types and categories, plus auxiliary data for Item form
            const [typesRes, categoriesRes, sizeRes, fitRes, matrix, pomCats, pomDefs, pkgTypes] = await Promise.all([
                apiClient.getVUFSAttributeTypes(),
                apiClient.getVUFSCategories(),
                apiClient.getVUFSSizes(),
                apiClient.getVUFSFits(),
                apiClient.getAllCategoryAttributes(),
                apiClient.getPOMCategories().catch(() => []),
                apiClient.getPOMDefinitions().catch(() => []),
                apiClient.getPackageMeasurementTypes().catch(() => [])
            ]);

            const typesArray: AttributeType[] = Array.isArray(typesRes) ? typesRes : [];
            setAttributeTypes(typesArray);

            const allCats: AttributeValue[] = categoriesRes.categories || [];
            const tierLabelsData: Record<string, string> = categoriesRes.tierLabels || {};

            // Update tier labels from fetched types/response
            const newLabels = { ...tierLabels };
            const initialRenaming = {};

            // Map categories by level
            setSubcategory1Values(allCats.filter(c => c.level === 'page'));
            setSubcategory2Values(allCats.filter(c => c.level === 'blue'));
            setSubcategory3Values(allCats.filter(c => c.level === 'white'));
            setApparelValues(allCats.filter(c => c.level === 'gray'));

            // Process tier labels
            typesArray.forEach(t => {
                if (['subcategory-1', 'subcategory-2', 'subcategory-3', 'apparel'].includes(t.slug)) {
                    // Suggest descriptive names if still set to generic system defaults
                    let val = t.name;
                    if (t.slug === 'subcategory-1' && (t.name === 'Subcategory 1' || !t.name)) val = 'Department';
                    if (t.slug === 'subcategory-2' && (t.name === 'Subcategory 2' || !t.name)) val = 'Category';
                    if (t.slug === 'subcategory-3' && (t.name === 'Subcategory 3' || !t.name)) val = 'Subcategory';
                    if (t.slug === 'apparel' && (t.name === 'Apparel' || t.name === 'Item' || !t.name)) val = 'Item';

                    newLabels[t.slug] = val;
                    initialRenaming[t.slug] = val;
                }
            });

            setTierLabels(newLabels);
            setTierLabels(newLabels);
            setNewTierLabels(initialRenaming);

            // Set auxiliary data
            setSizes(sizeRes || []);
            setFits(fitRes || []);
            setCategoryAttributes(matrix || []);
            setPomCategories(Array.isArray(pomCats) ? pomCats : []);
            setPomDefinitions(Array.isArray(pomDefs) ? pomDefs : []);
            setPackageMeasurementTypes(Array.isArray(pkgTypes) ? pkgTypes : []);

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

    // Get Google Shopping info for a category name
    const getGoogleShoppingInfo = (categoryName: string): { category: string; code: string } => {
        const name = categoryName.toLowerCase();
        // Exact match first
        if (GOOGLE_SHOPPING_MAP[name]) {
            return GOOGLE_SHOPPING_MAP[name];
        }
        // Partial match
        for (const [key, value] of Object.entries(GOOGLE_SHOPPING_MAP)) {
            if (name.includes(key) || key.includes(name)) {
                return value;
            }
        }
        // Default
        return { category: 'Apparel & Accessories > Clothing', code: '1604' };
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
        } else if (selectedSub1ForFilter) {
            // Filter by all sub2s that belong to sub1
            const validSub2Ids = subcategory2Values
                .filter(v => v.parentId === selectedSub1ForFilter)
                .map(v => v.id);
            filtered = filtered.filter(v => validSub2Ids.includes(v.parentId || ''));
        }
        return filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }, [subcategory3Values, search, selectedSub1ForFilter, selectedSub2ForFilter, subcategory2Values]);

    const filteredApparel = useMemo(() => {
        let filtered = apparelValues;
        if (selectedSub3ForFilter) {
            filtered = filtered.filter(v => v.parentId === selectedSub3ForFilter);
        } else if (selectedSub2ForFilter) {
            const validSub3Ids = subcategory3Values
                .filter(v => v.parentId === selectedSub2ForFilter)
                .map(v => v.id);
            filtered = filtered.filter(v => validSub3Ids.includes(v.parentId || ''));
        } else if (selectedSub1ForFilter) {
            const validSub2Ids = subcategory2Values
                .filter(v => v.parentId === selectedSub1ForFilter)
                .map(v => v.id);
            const validSub3Ids = subcategory3Values
                .filter(v => validSub2Ids.includes(v.parentId || ''))
                .map(v => v.id);
            filtered = filtered.filter(v => validSub3Ids.includes(v.parentId || ''));
        }
        return filtered.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }, [apparelValues, search, selectedSub1ForFilter, selectedSub2ForFilter, selectedSub3ForFilter, subcategory2Values, subcategory3Values]);

    // Helper getters for Apparel Paths
    const getSub2ForSub1 = (sub1Id: string) => subcategory2Values.filter(v => v.parentId === sub1Id);
    const getSub3ForSub2 = (sub2Id: string) => subcategory3Values.filter(v => v.parentId === sub2Id);
    const getApparelForSub3 = (sub3Id: string) => apparelValues.filter(v => v.parentId === sub3Id);

    // Form handlers
    const handleSelectValue = (item: AttributeValue) => {
        setMode('edit');
        setSelectedValue(item);
        // Basic form data
        setFormData({
            name: item.name,
            parentId: item.parentId || '',
            skuRef: item.skuRef || '',
            // Initialize rich fields with defaults to avoid uncontrolled inputs
            'subcategory-1': '',
            'subcategory-2': '',
            'subcategory-3': '',
            'google-shopping-category': '',
            'google-shopping-code': '',
            'height-cm': '',
            'length-cm': '',
            'width-cm': '',
            'weight-kg': '',
            'possible-sizes': [],
            'possible-fits': [],
            'icon-slug': ''
        });
    };

    const handleCreateNew = () => {
        setMode('create');
        setSelectedValue(null);
        setFormData({
            name: '',
            parentId: '',
            skuRef: '',
            // Clear rich fields
            'subcategory-1': '',
            'subcategory-2': '',
            'subcategory-3': '',
            'google-shopping-category': '',
            'google-shopping-code': '',
            'height-cm': '',
            'length-cm': '',
            'width-cm': '',
            'weight-kg': '',
            'possible-sizes': [],
            'possible-fits': [],
            'icon-slug': ''
        });
        setSelectedPOMs([]);
    };

    // Load rich attributes when selectedValue changes (for Items)
    useEffect(() => {
        const loadItemDetails = async () => {
            if (activeTab === 'apparel-paths' && selectedValue) {
                // Load attributes for this category (Item)
                const attrs = categoryAttributes.filter((ca: any) => ca.category_id === selectedValue.id);
                const newForm: Record<string, any> = { ...formData }; // Start with existing basic data

                REQUIRED_ATTRIBUTES.forEach(attr => {
                    // Skip basic parent/name fields as they are already set
                    if (['subcategory-1', 'subcategory-2', 'subcategory-3'].includes(attr.slug)) return;

                    const found = attrs.find((a: any) => a.attribute_slug === attr.slug);
                    let val = found?.value || '';
                    // Handle JSON fields (arrays)
                    if (attr.slug === 'possible-sizes' || attr.slug === 'possible-fits') {
                        try {
                            val = val ? JSON.parse(val) : [];
                        } catch (e) {
                            val = [];
                        }
                    }
                    newForm[attr.slug] = val;
                });

                // Auto-fill Google Shopping fields if empty
                if (!newForm['google-shopping-category'] || !newForm['google-shopping-code']) {
                    const googleInfo = getGoogleShoppingInfo(selectedValue.name);
                    if (!newForm['google-shopping-category']) {
                        newForm['google-shopping-category'] = googleInfo.category;
                    }
                    if (!newForm['google-shopping-code']) {
                        newForm['google-shopping-code'] = googleInfo.code;
                    }
                }

                // Pre-fill parent classification if not already set (though parentId handles the relationship, these are for display/explicit set)
                // Actually, parentId is the source of truth for hierarchy. We can try to deduce sub1/2/3 from parentId if desired, 
                // but usually the "Classification" inputs in ApparelManagement were for explicit attribute storage if different from strict hierarchy.
                // For now we trust the attributes we just loaded.

                setFormData(newForm);

                // Fetch POMs linked to this item
                try {
                    const linkedPOMs = await apiClient.getApparelPOMs(selectedValue.id);
                    setSelectedPOMs(Array.isArray(linkedPOMs) ? linkedPOMs.map((p: any) => p.id) : []);
                } catch (e) {
                    console.error('Failed to fetch apparel POMs', e);
                    setSelectedPOMs([]);
                }
            }
        };

        loadItemDetails();
    }, [selectedValue, categoryAttributes, activeTab]);

    // Handle MultiSelect for Sizes/Fits
    const handleMultiSelect = (slug: string, id: string) => {
        setFormData(prev => {
            const current = (prev[slug] as string[]) || [];
            if (current.includes(id)) {
                return { ...prev, [slug]: current.filter(x => x !== id) };
            } else {
                return { ...prev, [slug]: [...current, id] };
            }
        });
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
            let itemId = selectedValue?.id;

            if (mode === 'create') {
                const typeSlug = activeTab === 'apparel-paths' ? 'apparel' : activeTab;
                const newAttr = await apiClient.addVUFSAttributeValue(typeSlug, formData.name, formData.parentId || undefined, formData.skuRef);
                itemId = newAttr.id;
                toast.success('Created successfully');
            } else if (selectedValue) {
                await apiClient.updateVUFSAttributeValue(selectedValue.id, {
                    name: formData.name,
                    parentId: formData.parentId || null,
                    skuRef: formData.skuRef
                });
                toast.success('Saved successfully');
            }

            // If we are editing an Item, save the rich attributes
            if (activeTab === 'apparel-paths' && itemId) {
                // Save attributes
                for (const attr of REQUIRED_ATTRIBUTES) {
                    // Skip subcategory-1/2/3 as they are structurally handled by the hierarchy, 
                    // though we could save them as attributes if needed for redundancy.
                    // For now, let's save everything in REQUIRED_ATTRIBUTES to match ApparelManagement behavior.

                    let value = formData[attr.slug];
                    if (Array.isArray(value)) {
                        value = JSON.stringify(value);
                    }
                    if (value !== undefined) {
                        // We need to use setCategoryAttribute which expects a category ID.
                        // Here 'itemId' is the ID of the AttributeValue (category).
                        await apiClient.setCategoryAttribute(
                            itemId,
                            attr.slug,
                            String(value)
                        );
                    }
                }

                // Save apparel-POM mappings
                await apiClient.setApparelPOMs(
                    itemId,
                    selectedPOMs.map((pomId, index) => ({
                        pomId,
                        isRequired: false,
                        sortOrder: index + 1
                    }))
                );
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
            { slug: 'subcategory-1', name: tierLabels['subcategory-1'] },
            { slug: 'subcategory-2', name: tierLabels['subcategory-2'] },
            { slug: 'subcategory-3', name: tierLabels['subcategory-3'] },
            { slug: 'apparel', name: tierLabels['apparel'] }
        ];
        return allLevels.filter(l => l.slug !== currentLevel);
    };

    // Check if column exists
    const hasSubcategory1 = attributeTypes.some(t => t.slug === 'subcategory-1');
    const hasSubcategory2 = attributeTypes.some(t => t.slug === 'subcategory-2');
    const hasSubcategory3 = attributeTypes.some(t => t.slug === 'subcategory-3');
    const hasApparel = attributeTypes.some(t => t.slug === 'apparel');

    if (loading && attributeTypes.length === 0) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                <p className="text-sm text-blue-700">
                    <strong>4-Tier Hierarchy:</strong> {tierLabels['subcategory-1']} → {tierLabels['subcategory-2']} → {tierLabels['subcategory-3']} → {tierLabels['apparel']}.
                    Use the <ArrowsRightLeftIcon className="h-4 w-4 inline" /> button to move items between levels.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRenamingTiers(true)}
                    className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                    <PencilSquareIcon className="h-4 w-4 mr-2" />
                    Rename Tiers
                </Button>
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
                        {tierLabels['subcategory-1']}
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
                        {tierLabels['subcategory-2']}
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
                        {tierLabels['subcategory-3']}
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{subcategory3Values.length}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('item'); handleCreateNew(); setSearch(''); }}
                        disabled={!hasApparel}
                        className={`${activeTab === 'item'
                            ? 'border-blue-500 text-blue-600'
                            : hasApparel ? 'border-transparent text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <TagIcon className="h-5 w-5" />
                        {tierLabels['apparel']}
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{apparelValues.length}</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('item-paths'); setSearch(''); setSelectedSub1ForFilter(''); setSelectedSub2ForFilter(''); setSelectedSub3ForFilter(''); }}
                        disabled={!hasApparel}
                        className={`${activeTab === 'item-paths'
                            ? 'border-blue-500 text-blue-600'
                            : hasApparel ? 'border-transparent text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <ArrowsRightLeftIcon className="h-5 w-5" />
                        Item Paths
                    </button>
                </nav>
            </div>

            {/* Subcategory 1 Tab */}
            {activeTab === 'subcategory-1' && hasSubcategory1 && (
                <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
                    {/* List */}
                    <div className="w-full md:w-1/2 bg-white shadow rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">{tierLabels['subcategory-1']} (Top Level)</h2>
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
                            {mode === 'create' ? `Add New ${tierLabels['subcategory-1']}` : `Edit ${tierLabels['subcategory-1']}`}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Ref (2 chars)</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm uppercase"
                                    placeholder="e.g. TP"
                                    maxLength={4}
                                    value={formData.skuRef || ''}
                                    onChange={(e) => setFormData({ ...formData, skuRef: e.target.value })}
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
                            <h2 className="text-lg font-medium text-gray-900">{tierLabels['subcategory-2']}</h2>
                            <button onClick={handleCreateNew} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Filter by Sub1 */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Filter by {tierLabels['subcategory-1']}</label>
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
                            {mode === 'create' ? `Add New ${tierLabels['subcategory-2']}` : `Edit ${tierLabels['subcategory-2']}`}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Ref (2 chars)</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm uppercase"
                                    placeholder="e.g. TS"
                                    maxLength={4}
                                    value={formData.skuRef || ''}
                                    onChange={(e) => setFormData({ ...formData, skuRef: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent ({tierLabels['subcategory-1']})</label>
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
                            <h2 className="text-lg font-medium text-gray-900">{tierLabels['subcategory-3']}</h2>
                            <button onClick={handleCreateNew} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Hierarchical Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Filter by {tierLabels['subcategory-1']}</label>
                                <select
                                    value={selectedSub1ForFilter}
                                    onChange={(e) => {
                                        setSelectedSub1ForFilter(e.target.value);
                                        setSelectedSub2ForFilter('');
                                    }}
                                    className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm"
                                >
                                    <option value="">All</option>
                                    {subcategory1Values.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Filter by {tierLabels['subcategory-2']}</label>
                                <select
                                    value={selectedSub2ForFilter}
                                    onChange={(e) => setSelectedSub2ForFilter(e.target.value)}
                                    className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm"
                                    disabled={!selectedSub1ForFilter}
                                >
                                    <option value="">All</option>
                                    {getSub2ForSub1(selectedSub1ForFilter).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
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
                            {mode === 'create' ? `Add New ${tierLabels['subcategory-3']}` : `Edit ${tierLabels['subcategory-3']}`}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">SKU Ref (2 chars)</label>
                                <input
                                    type="text"
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm uppercase"
                                    placeholder="e.g. LS"
                                    maxLength={4}
                                    value={formData.skuRef || ''}
                                    onChange={(e) => setFormData({ ...formData, skuRef: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent ({tierLabels['subcategory-2']})</label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                                >
                                    <option value="">None (Unassigned)</option>
                                    <optgroup label="Filtered Options">
                                        {getSub2ForSub1(selectedSub1ForFilter).map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="All Options">
                                        {subcategory2Values.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </optgroup>
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

            {/* Item Paths Tab - 4 Column View */}
            {activeTab === 'item-paths' && hasApparel && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">{tierLabels['apparel']} Paths</h2>
                            <Button onClick={() => {
                                handleCreateNew();
                                const parentId = selectedSub3ForFilter || selectedSub2ForFilter || selectedSub1ForFilter || '';
                                setFormData({ name: '', parentId });
                                setActiveTab('item');
                            }}>
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add {tierLabels['apparel']}
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Navigate through the hierarchy. {tierLabels['apparel']} items can be added at any level ({tierLabels['subcategory-1']}, {tierLabels['subcategory-2']}, or {tierLabels['subcategory-3']}).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Column 1: Subcategory 1 */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-gray-700">{tierLabels['subcategory-1']}</h3>
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
                                        {tierLabels['subcategory-2']}
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
                                            Select a {tierLabels['subcategory-1']} to view
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: Subcategory 3 */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        {tierLabels['subcategory-3']}
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
                                            Select a {tierLabels['subcategory-2']} to view
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 4: Apparel */}
                            <div className="border rounded-lg overflow-hidden flex flex-col h-[450px]">
                                <div className="bg-gray-50 px-4 py-3 border-b flex-shrink-0 flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        {tierLabels['apparel']}
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
                                                    return <div className="p-4 text-center text-gray-400 italic text-sm">No {tierLabels['apparel'].toLowerCase()} items directly in this category.</div>
                                                }
                                                return <div className="p-4 text-center text-gray-400 italic text-sm">No matches for search.</div>
                                            }

                                            return filteredBySearch.map(item => (
                                                <div key={item.id} className="relative flex items-center border-b border-gray-100 hover:bg-gray-50">
                                                    <div className="flex-1">
                                                        <SortableItem
                                                            item={item}
                                                            onEdit={(item) => {
                                                                handleSelectValue(item);
                                                                setActiveTab('item');
                                                            }}
                                                            onDelete={handleDeleteClick}
                                                            showHandle={false}
                                                            onMoveToLevel={handleMoveToLevel}
                                                            availableLevels={['subcategory-1', 'subcategory-2', 'subcategory-3'].map(slug => ({
                                                                slug,
                                                                name: tierLabels[slug]
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            ));
                                        })()
                                    ) : (
                                        <div className="p-4 text-center text-gray-400 italic text-sm">
                                            Select a category to view {tierLabels['apparel'].toLowerCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Tab */}
            {activeTab === 'item' && hasApparel && (
                <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
                    {/* Left Column: List & Filters */}
                    <div className="w-full md:w-1/3 bg-white shadow rounded-lg p-4 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">{tierLabels['apparel']} List</h2>
                            <button onClick={handleCreateNew} className="p-1 text-blue-600 hover:bg-blue-50 rounded-full" title="Create New">
                                <PlusIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Hierarchical Filters */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{tierLabels['subcategory-1']}</label>
                                <select
                                    value={selectedSub1ForFilter}
                                    onChange={(e) => {
                                        setSelectedSub1ForFilter(e.target.value);
                                        setSelectedSub2ForFilter('');
                                        setSelectedSub3ForFilter('');
                                    }}
                                    className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-xs"
                                >
                                    <option value="">All {tierLabels['subcategory-1']}s</option>
                                    {subcategory1Values.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{tierLabels['subcategory-2']}</label>
                                <select
                                    value={selectedSub2ForFilter}
                                    onChange={(e) => {
                                        setSelectedSub2ForFilter(e.target.value);
                                        setSelectedSub3ForFilter('');
                                    }}
                                    className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-xs"
                                    disabled={!selectedSub1ForFilter}
                                >
                                    <option value="">All {tierLabels['subcategory-2']}s</option>
                                    {getSub2ForSub1(selectedSub1ForFilter).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">{tierLabels['subcategory-3']}</label>
                                <select
                                    value={selectedSub3ForFilter}
                                    onChange={(e) => setSelectedSub3ForFilter(e.target.value)}
                                    className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-xs"
                                    disabled={!selectedSub2ForFilter}
                                >
                                    <option value="">All {tierLabels['subcategory-3']}s</option>
                                    {getSub3ForSub2(selectedSub2ForFilter).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder={`Search ${tierLabels['apparel']}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[500px] border rounded-md">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, apparelValues, setApparelValues)}>
                                <SortableContext items={filteredApparel.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {filteredApparel.map(item => (
                                        <div key={item.id} className="relative flex items-center border-b border-gray-100 hover:bg-gray-50">
                                            <div className="flex-1">
                                                <SortableItem
                                                    item={item}
                                                    icon={TagIcon}
                                                    onEdit={handleSelectValue}
                                                    onDelete={handleDeleteClick}
                                                    showHandle={true}
                                                    onMoveToLevel={handleMoveToLevel}
                                                    availableLevels={getAvailableLevels('apparel')}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>
                            {filteredApparel.length === 0 && (
                                <div className="p-4 text-center text-gray-400 italic text-sm">No items found</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Edit/Create Area for Item */}
                    <div className="w-full md:w-2/3 bg-white shadow rounded-lg p-6 border-t-4 border-t-blue-500">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">
                            {mode === 'create' ? (
                                <span>Add New {tierLabels['apparel']}</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Edit {tierLabels['apparel']}</span>
                                    {saving && <span className="text-sm font-normal text-gray-500">(Saving...)</span>}
                                </div>
                            )}
                        </h3>

                        <div className="space-y-8">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-gray-50"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. T-Shirt"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU Reference (2 chars)</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 uppercase bg-gray-50"
                                        value={formData.skuRef || ''}
                                        onChange={(e) => setFormData({ ...formData, skuRef: e.target.value.toUpperCase() })}
                                        placeholder="TS"
                                    />
                                </div>
                            </div>

                            {/* Parent Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                                {/* If no parent is selected, show a dropdown to select one */}
                                {!formData.parentId ? (
                                    <div>
                                        <select
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white"
                                            value={formData.parentId}
                                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                        >
                                            <option value="">-- Select Parent Category --</option>
                                            <optgroup label={tierLabels['subcategory-3']}>
                                                {subcategory3Values.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} (in {getParentName(s.parentId, subcategory2Values)})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label={tierLabels['subcategory-2']}>
                                                {subcategory2Values.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} (in {getParentName(s.parentId, subcategory1Values)})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label={tierLabels['subcategory-1']}>
                                                {subcategory1Values.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Select the category this item belongs to.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                                        {(() => {
                                            const p1 = subcategory1Values.find(i => i.id === formData.parentId);
                                            const p2 = subcategory2Values.find(i => i.id === formData.parentId);
                                            const p3 = subcategory3Values.find(i => i.id === formData.parentId);
                                            const parent = p1 || p2 || p3;
                                            return parent ? (
                                                <>
                                                    <FolderIcon className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium">{parent.name}</span>
                                                    <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">
                                                        {p1 ? tierLabels['subcategory-1'] : p2 ? tierLabels['subcategory-2'] : tierLabels['subcategory-3']}
                                                    </span>
                                                    {mode === 'create' && (
                                                        <button
                                                            onClick={() => setFormData({ ...formData, parentId: '' })}
                                                            className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                            Change
                                                        </button>
                                                    )}
                                                </>
                                            ) : <span className="text-red-500">Unknown Parent (ID: {formData.parentId})</span>;
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Google Shopping */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">SEO</span>
                                    Google Shopping Integration
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Category String</label>
                                        <input
                                            type="text"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 text-gray-600"
                                            value={formData['google-shopping-category'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'google-shopping-category': e.target.value })}
                                            placeholder="Apparel & Accessories > ..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Category Code</label>
                                        <input
                                            type="text"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 text-gray-600"
                                            value={formData['google-shopping-code'] || ''}
                                            onChange={(e) => setFormData({ ...formData, 'google-shopping-code': e.target.value })}
                                            placeholder="e.g. 1604"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const info = getGoogleShoppingInfo(formData.name);
                                                setFormData({ ...formData, 'google-shopping-category': info.category, 'google-shopping-code': info.code });
                                                toast.success('Auto-filled from map');
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Auto-fill based on name
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Configuration */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Configuration</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Possible Sizes */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Possible Sizes</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setOpenDropdown(openDropdown === 'sizes' ? null : 'sizes')}
                                                className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm text-sm w-full text-left flex justify-between items-center"
                                            >
                                                <span className="truncate">
                                                    {(formData['possible-sizes'] || []).length > 0
                                                        ? sizes.filter(s => (formData['possible-sizes'] || []).includes(s.id)).map(s => s.name).join(', ')
                                                        : 'Select sizes...'}
                                                </span>
                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            </button>
                                            {openDropdown === 'sizes' && (
                                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                    <div className="p-2 grid grid-cols-2 gap-2">
                                                        {sizes.map((size) => (
                                                            <label key={size.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(formData['possible-sizes'] || []).includes(size.id)}
                                                                    onChange={(e) => { e.stopPropagation(); handleMultiSelect('possible-sizes', size.id); }}
                                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                                                />
                                                                <span className="ml-3 text-sm text-gray-700">{size.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
                                                        <button type="button" onClick={() => setOpenDropdown(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded">Done</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Possible Fits */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Possible Fits</label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setOpenDropdown(openDropdown === 'fits' ? null : 'fits')}
                                                className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md shadow-sm text-sm w-full text-left flex justify-between items-center"
                                            >
                                                <span className="truncate">
                                                    {(formData['possible-fits'] || []).length > 0
                                                        ? fits.filter(f => (formData['possible-fits'] || []).includes(f.id)).map(f => f.name).join(', ')
                                                        : 'Select fits...'}
                                                </span>
                                                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                            </button>
                                            {openDropdown === 'fits' && (
                                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                    <div className="p-2 space-y-1">
                                                        {fits.map((fit) => (
                                                            <label key={fit.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(formData['possible-fits'] || []).includes(fit.id)}
                                                                    onChange={(e) => { e.stopPropagation(); handleMultiSelect('possible-fits', fit.id); }}
                                                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                                                />
                                                                <span className="ml-3 text-sm text-gray-700">{fit.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-2 text-right">
                                                        <button type="button" onClick={() => setOpenDropdown(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 bg-white border border-blue-200 rounded">Done</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Icons */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Icon</label>
                                    <div className="border border-gray-200 rounded-md p-4 max-h-48 overflow-y-auto bg-gray-50/50">
                                        {Object.entries(ICON_GROUPS).map(([groupName, icons]) => (
                                            <div key={groupName} className="mb-4 last:mb-0">
                                                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{groupName}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {icons.map((iconKey) => {
                                                        const isSelected = formData['icon-slug'] === iconKey;
                                                        return (
                                                            <button
                                                                key={iconKey}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, 'icon-slug': iconKey })}
                                                                className={`p-2 rounded-md border flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isSelected
                                                                    ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-500'
                                                                    : 'bg-white border-gray-200 hover:border-blue-300 text-gray-400 hover:text-gray-600'
                                                                    }`}
                                                                title={iconKey.replace(/-/g, ' ')}
                                                            >
                                                                <ApparelIcon name="" icon={iconKey} className="w-5 h-5" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Package Measurements */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Package Measurements</h4>
                                <p className="text-xs text-gray-400 mb-4">Used for shipping calculations. Default dimensions.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Height (cm)', 'Length (cm)', 'Width (cm)', 'Weight (kg)'].map((label, idx) => {
                                        const slug = ['height-cm', 'length-cm', 'width-cm', 'weight-kg'][idx];
                                        return (
                                            <div key={slug}>
                                                <label className="block text-xs font-medium text-gray-500">{label}</label>
                                                <input
                                                    type="number"
                                                    step={slug === 'weight-kg' ? '0.01' : '1'}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-xs"
                                                    value={formData[slug] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [slug]: e.target.value })}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* POMs */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Points of Measure</h4>
                                <div className="border border-gray-200 rounded-md max-h-80 overflow-y-auto">
                                    {pomCategories.map(category => {
                                        const categoryPOMs = pomDefinitions.filter(p => p.category_id === category.id);
                                        const isExpanded = expandedPOMCategories.has(category.id);
                                        const selectedCount = categoryPOMs.filter(p => selectedPOMs.includes(p.id)).length;

                                        return (
                                            <div key={category.id} className="border-b border-gray-200 last:border-b-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedPOMCategories(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(category.id)) next.delete(category.id);
                                                        else next.add(category.id);
                                                        return next;
                                                    })}
                                                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 bg-gray-50/50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronDownIcon className="h-4 w-4 text-gray-400" /> : <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
                                                        <span className="font-medium text-sm text-gray-700">{category.name}</span>
                                                        <span className="text-xs text-gray-500">({categoryPOMs.length})</span>
                                                    </div>
                                                    {selectedCount > 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{selectedCount} selected</span>}
                                                </button>

                                                {isExpanded && (
                                                    <div className="bg-white px-4 py-2 space-y-1">
                                                        {categoryPOMs.map(pom => (
                                                            <label key={pom.id} className="flex items-start gap-3 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors group">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPOMs.includes(pom.id)}
                                                                    onChange={() => setSelectedPOMs(prev => prev.includes(pom.id) ? prev.filter(id => id !== pom.id) : [...prev, pom.id])}
                                                                    className="mt-1 h-3.5 w-3.5 text-blue-600 rounded border-gray-300"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-xs font-bold text-gray-600 group-hover:text-blue-700">{pom.code}</span>
                                                                        <span className="text-sm text-gray-800">{pom.name}</span>
                                                                        {pom.is_half_measurement && <span className="text-[10px] bg-yellow-50 text-yellow-600 px-1 rounded border border-yellow-100">HALF</span>}
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 truncate max-w-xs">{pom.description}</p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                <Button variant="ghost" onClick={handleCreateNew}>Cancel / New</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !formData.name || !formData.parentId}
                                    className="min-w-[120px]"
                                >
                                    {saving ? 'Saving...' : (mode === 'create' ? 'Create Item' : 'Save Changes')}
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
                                                {tierLabels[d.type_slug] || d.type_slug}
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

            {/* Tier Rename Modal */}
            <ConfirmationModal
                isOpen={isRenamingTiers}
                onClose={() => setIsRenamingTiers(false)}
                onConfirm={async () => {
                    toast.loading('Saving tier names...', { id: 'save-tiers' });
                    try {
                        for (const [slug, name] of Object.entries(newTierLabels)) {
                            if (name !== tierLabels[slug]) {
                                await apiClient.updateVUFSAttributeType(slug, name);
                            }
                        }
                        toast.success('Tier names updated successfully', { id: 'save-tiers' });
                        await fetchData();
                        setIsRenamingTiers(false);
                    } catch (error: any) {
                        console.error('Failed to update tier names', error);
                        toast.error(`Error: ${error.message}`, { id: 'save-tiers' });
                    }
                }}
                title="Rename Category Tiers"
                confirmText="Save Changes"
                variant="primary"
                message={
                    <div className="space-y-6 pt-4">
                        <p className="text-sm text-gray-500 mb-4">
                            Define custom names for each level of the hierarchy. These will be used throughout the system.
                        </p>
                        {['subcategory-1', 'subcategory-2', 'subcategory-3', 'apparel'].map((slug, index) => (
                            <div key={slug} className="space-y-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                                <div className="text-sm font-bold text-gray-900 uppercase tracking-tight">Level {index + 1}</div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-semibold text-gray-500 uppercase w-12 shrink-0">Name:</label>
                                    <input
                                        type="text"
                                        className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 bg-gray-50 text-gray-900"
                                        value={newTierLabels[slug] || ''}
                                        onChange={(e) => setNewTierLabels(prev => ({ ...prev, [slug]: e.target.value }))}
                                        placeholder="Enter tier name"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                }
            />
        </div >
    );
}
