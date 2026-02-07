'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ItemCreation from '@/components/admin/ItemCreation';
import ItemsFilter, { ItemsFilters, AvailableFacets, countryFlags } from '@/components/common/ItemsFilter';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { WardrobeItemCard } from './WardrobeItemCard';
import { vufsApi } from '@/lib/vufsApi';
import { processImagesForCard } from '@/utils/wardrobeImages';


import { Switch } from '@/components/ui/Switch';

interface WardrobeManagementProps {
    username?: string;
    displayName?: string;
}

export default function WardrobeManagement({ username, displayName }: WardrobeManagementProps) {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ItemsFilters>({});

    const isPublicView = !!username;

    // Initialize from localStorage, default to false (show No BG)
    const [showOriginalBackgrounds, setShowOriginalBackgrounds] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wardrobe-show-original-bg');
            return saved === 'true';
        }
    });

    // Sync to localStorage when changed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('wardrobe-show-original-bg', String(showOriginalBackgrounds));
        }
    }, [showOriginalBackgrounds]);

    // Facet Options (Wardrobe Context) - Used for Filters
    const [wardrobeFacets, setWardrobeFacets] = useState<any>({
        brands: [],
        departments: [],
        categories: [],
        subcategories: [],
        apparelTypes: [],
        colors: [],
        patterns: [],
        materials: [],
        lines: [],
        collections: [],
        sizes: [],
        genders: [],
        fits: [],
        styles: [],
        nationalities: [],
        years: [],
        months: [],
        days: [],
        conditions: []
    });

    const [tierLabels, setTierLabels] = useState<Record<string, string>>({
        'subcategory-1': 'Department',
        'subcategory-2': 'Category',
        'subcategory-3': 'Subcategory',
        'apparel': 'Item'
    });


    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Deletion Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchWardrobeFacets(); // Fetch initial facets

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showModal) setShowModal(false);
                if (showDeleteConfirm) setShowDeleteConfirm(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showModal, showDeleteConfirm]);

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const types = await vufsApi.getAttributeTypes();
                if (types && Array.isArray(types)) {
                    const newLabels = { ...tierLabels };
                    types.forEach(t => {
                        if (['subcategory-1', 'subcategory-2', 'subcategory-3', 'apparel'].includes(t.slug)) {
                            newLabels[t.slug] = t.name;
                        }
                    });
                    setTierLabels(newLabels);
                }
            } catch (error) {
                console.error('Failed to fetch tiers in wardrobe', error);
            }
        };
        fetchTiers();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchQuery, filters]);


    const fetchWardrobeFacets = async () => {
        try {
            const facets = isPublicView && username
                ? await apiClient.getPublicWardrobeFacets(username)
                : await apiClient.getWardrobeFacets();

            setWardrobeFacets(facets || {
                brands: [],
                departments: [],
                categories: [],
                subcategories: [],
                apparelTypes: [],
                colors: [],
                patterns: [],
                materials: [],
                lines: [],
                collections: [],
                sizes: [],
                genders: [],
                conditions: []
            });
            console.log('[DEBUG] Fetched Wardrobe Facets:', facets);
        } catch (error) {
            console.error('Failed to fetch wardrobe facets', error);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = isPublicView && username
                ? await apiClient.getPublicWardrobeItems(username, {
                    ...filters,
                    search: searchQuery,
                    page
                })
                : await apiClient.getWardrobeItems({
                    ...filters,
                    search: searchQuery,
                    page,
                    // If grouping is active, fetch more items (up to 1000) to ensure groups aren't fragmented across pages
                    limit: filters.groupBy ? 1000 : 20,
                    sortBy: filters.sortBy || 'date_desc'
                });

            setItems(res.items || []);
            setTotalPages(res.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch wardrobe items', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item?: any) => {
        if (item) {
            setEditingItem(item);
        } else {
            setEditingItem(null);
        }
        setShowModal(true);
    };

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await apiClient.deleteWardrobeItem(itemToDelete);
            toast.success('Item moved to trash');
            fetchItems();
            fetchWardrobeFacets(); // Refresh facets too
        } catch (error) {
            console.error('Failed to delete item', error);
            toast.error('Failed to delete item');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };



    return (
        <Fragment>
            <ItemsFilter
                filters={filters}
                onChange={setFilters}
                availableFacets={wardrobeFacets}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                useNameAsValue={true}
            >
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            {isPublicView ? (displayName ? `${displayName}'s Wardrobe` : 'Wardrobe') : 'Your Wardrobe'}
                        </h1>
                        <p className="text-gray-500 mt-2 font-medium">
                            {isPublicView ? `Curated digital closet by ${displayName || 'this user'}` : 'Manage and curate your digital closet'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Sort & Group Controls */}
                        <div className="flex items-center gap-2">
                            <select
                                value={filters.sortBy || 'date_desc'}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="name_asc">Name: A-Z</option>
                                <option value="name_desc">Name: Z-A</option>
                                <option value="brand_asc">Brand: A-Z</option>
                            </select>

                            <select
                                value={filters.groupBy || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                            >
                                <option value="">No Grouping</option>
                                <option value="brand">Brand</option>
                                <option value="department">{tierLabels['subcategory-1']}</option>
                                <option value="category">{tierLabels['subcategory-2']}</option>
                                <option value="subcategory">{tierLabels['subcategory-3']}</option>
                                <option value="item">{tierLabels['apparel']}</option>
                                <option value="style">Style</option>
                                <option value="gender">Gender</option>
                                <option value="size">Size</option>
                                <option value="fit">Fit</option>
                                <option value="nationality">Brand Nationality</option>
                                <option value="color">Color</option>
                                <option value="pattern">Pattern</option>
                                <option value="material">Material</option>
                                <option value="condition">Condition</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 mr-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold transition-colors ${showOriginalBackgrounds ? 'text-gray-900' : 'text-gray-400'}`}>Original</span>
                                <Switch
                                    checked={!showOriginalBackgrounds}
                                    onCheckedChange={(checked) => setShowOriginalBackgrounds(!checked)}
                                />
                                <span className={`text-xs font-bold transition-colors ${!showOriginalBackgrounds ? 'text-indigo-600' : 'text-gray-400'}`}>No BG</span>
                            </div>
                        </div>
                        {!isPublicView && (
                            <>
                                <button
                                    onClick={() => router.push('/wardrobe/trash')}
                                    className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-xl border border-gray-100"
                                >
                                    <TrashIcon className="h-5 w-5 mr-2 opacity-50" />
                                </button>
                                <Button onClick={() => openModal()} className="rounded-2xl px-6 h-14 text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <PlusIcon className="h-6 w-6 mr-2" />
                                    Add New Item
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                <div className="aspect-square bg-gray-200"></div>
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {items.length > 0 ? (
                            filters.groupBy ? (
                                // Grouped View
                                <div className="space-y-12">
                                    {Object.entries(
                                        items.reduce((acc: any, item: any) => {
                                            let key = 'Unspecified';

                                            switch (filters.groupBy) {
                                                case 'brand':
                                                    // official joined name first, then hierarchy name, then item.brand fallback
                                                    key = item.brandInfo?.name || item.brand?.brand || item.brand?.name || (typeof item.brand === 'string' ? item.brand : 'Unspecified');
                                                    break;
                                                case 'department':
                                                    key = item.category?.page || 'Unspecified';
                                                    break;
                                                case 'category':
                                                    key = item.category?.blueSubcategory || 'Unspecified';
                                                    break;
                                                case 'subcategory':
                                                    key = item.category?.whiteSubcategory || 'Unspecified';
                                                    break;
                                                case 'item':
                                                    key = item.category?.graySubcategory || 'Unspecified';
                                                    break;
                                                case 'style':
                                                    // Prefer resolved style names from backend -> fallback to metadata style array -> single style -> Unspecified
                                                    if (item.styleNames && item.styleNames.length > 0) {
                                                        key = item.styleNames[0];
                                                    } else if (Array.isArray(item.metadata?.styles) && item.metadata.styles.length > 0) {
                                                        // Fallback for when backend aggregation might have missed or it's a string array in metadata
                                                        key = item.metadata.styles[0];
                                                    } else {
                                                        key = item.metadata?.style || 'Unspecified';
                                                    }
                                                    break;
                                                case 'gender':
                                                    key = item.metadata?.gender || 'Unspecified';
                                                    break;
                                                case 'size':
                                                    key = item.metadata?.size || 'Unspecified';
                                                    break;
                                                case 'fit':
                                                    key = item.metadata?.fit || 'Unspecified';
                                                    break;
                                                case 'nationality':
                                                    // Use Brand Nationality per user request
                                                    key = item.brandInfo?.country || item.metadata?.madeIn || item.metadata?.nationality || 'Unspecified';
                                                    break;
                                                case 'color':
                                                    const colors = item.metadata?.colors || [];
                                                    key = colors.length > 0
                                                        ? (typeof colors[0] === 'string' ? colors[0] : (colors[0]?.name || colors[0]?.primary || 'Unspecified'))
                                                        : (item.metadata?.color || 'Unspecified');
                                                    break;
                                                case 'pattern':
                                                    key = item.metadata?.pattern || 'Unspecified';
                                                    break;
                                                case 'material':
                                                    const mats = item.metadata?.composition || [];
                                                    key = mats.length > 0
                                                        ? (typeof mats[0] === 'string' ? mats[0] : (mats[0]?.name || mats[0]?.material || 'Unspecified'))
                                                        : (item.metadata?.material || 'Unspecified');
                                                    break;
                                                default:
                                                    key = 'Unspecified';
                                            }

                                            // Normalize key
                                            key = (key && key.trim()) || 'Unspecified';

                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(item);
                                            return acc;
                                        }, {})
                                    ).sort((a: any, b: any) => a[0].localeCompare(b[0])).map(([groupName, groupItems]: any) => {
                                        // Extract logo if grouping by brand
                                        let groupLogo: string | undefined;
                                        if (filters.groupBy === 'brand') {
                                            // Try to find a logo from any item in the group, preferring one with brandInfo
                                            const itemWithLogo = groupItems.find((i: any) => i.brandInfo?.logo);
                                            groupLogo = itemWithLogo?.brandInfo?.logo;
                                        }

                                        let groupFlag = null;
                                        if (filters.groupBy === 'nationality') {
                                            groupFlag = countryFlags[groupName];
                                        }

                                        return (
                                            <div key={groupName}>
                                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                                    {groupLogo && (
                                                        <img
                                                            src={groupLogo}
                                                            alt={groupName}
                                                            className="h-8 w-8 object-contain mr-3 rounded-full bg-gray-50 border border-gray-100 p-0.5"
                                                        />
                                                    )}
                                                    {groupFlag && <span className="mr-3 text-2xl">{groupFlag}</span>}
                                                    {groupName}
                                                    <span className="ml-3 text-sm font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                                        {groupItems.length}
                                                    </span>
                                                </h2>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                    {groupItems.map((item: any) => {
                                                        const cardItem = processImagesForCard(item, !!showOriginalBackgrounds);

                                                        return (
                                                            <WardrobeItemCard
                                                                key={item.id}
                                                                item={cardItem}
                                                                onEdit={isPublicView ? undefined : () => router.push(`/wardrobe/${item.vufsCode}/edit`)}
                                                                onDelete={isPublicView ? undefined : () => handleDeleteClick(item.id)}
                                                                onToggleFavorite={() => { /* Not implemented yet */ }}
                                                                onToggleForSale={() => { /* Not implemented yet */ }}
                                                                onView={() => router.push(isPublicView ? `/u/${username}/wardrobe/${item.vufsCode}` : `/wardrobe/${item.vufsCode}`)}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Standard Grid View
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {items.map(item => {
                                        const cardItem = processImagesForCard(item, !!showOriginalBackgrounds);

                                        return (
                                            <WardrobeItemCard
                                                key={item.id}
                                                item={cardItem}
                                                onEdit={isPublicView ? undefined : () => router.push(`/wardrobe/${item.vufsCode}/edit`)}
                                                onDelete={isPublicView ? undefined : () => handleDeleteClick(item.id)}
                                                onToggleFavorite={() => { /* Not implemented yet */ }}
                                                onToggleForSale={() => { /* Not implemented yet */ }}
                                                onView={() => router.push(isPublicView ? `/u/${username}/wardrobe/${item.vufsCode}` : `/wardrobe/${item.vufsCode}`)}
                                            />
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300 opacity-50" />
                                <h3 className="mt-4 text-sm font-bold text-gray-900">
                                    {isPublicView ? `${displayName || 'This user'}'s wardrobe is empty` : 'Your wardrobe is empty'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {isPublicView ? 'No public items found for this user.' : 'Try adjusting your filters or add a new piece.'}
                                </p>
                                {!isPublicView && (
                                    <div className="mt-8">
                                        <Button onClick={() => openModal()} className="rounded-xl px-8">
                                            <PlusIcon className="h-5 w-5 mr-2" />
                                            Add First Piece
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                                <div className="p-6">
                                    <ItemCreation
                                        mode="wardrobe"
                                        initialData={editingItem}
                                        isEditMode={!!editingItem}
                                        onCancel={() => setShowModal(false)}
                                        onSuccess={() => {
                                            setShowModal(false);
                                            fetchItems();
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </ItemsFilter>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Move to Trash"
                message="Are you sure you want to move this item to the trash? It will be automatically deleted in 14 days, but you can restore it until then."
                confirmText="Move to Trash"
                variant="danger"
                isLoading={isDeleting}
            />
        </Fragment>
    );
}
