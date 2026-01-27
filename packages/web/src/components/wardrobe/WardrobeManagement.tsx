'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ItemCreation from '@/components/admin/ItemCreation';
import { getImageUrl } from '@/utils/imageUrl';
import ItemsFilter, { ItemsFilters } from '@/components/common/ItemsFilter';
import { ConfirmationModal } from '../ui/ConfirmationModal';

import { Switch } from '@/components/ui/Switch';

interface WardrobeManagementProps {
}

export default function WardrobeManagement({ }: WardrobeManagementProps) {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ItemsFilters>({});
    const [showOriginalBackgrounds, setShowOriginalBackgrounds] = useState(false); // Default to showing processed images if available

    // Facet Options (Wardrobe Context) - Used for Filters
    const [wardrobeFacets, setWardrobeFacets] = useState<{
        brands: any[];
        categories: any[];
        colors: any[];
        patterns: any[];
        materials: any[];
        lines: any[];
        collections: any[];
    }>({
        brands: [],
        categories: [],
        colors: [],
        patterns: [],
        materials: [],
        lines: [],
        collections: []
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
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchQuery, filters]);

    const fetchWardrobeFacets = async () => {
        try {
            const facets = await apiClient.getWardrobeFacets();
            setWardrobeFacets(facets || {
                brands: [],
                categories: [],
                colors: [],
                patterns: [],
                materials: [],
                lines: [],
                collections: []
            });
        } catch (error) {
            console.error('Failed to fetch wardrobe facets', error);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getWardrobeItems({
                ...filters,
                search: searchQuery,
                page
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

    const getItemImage = (item: any) => {
        if (item.images?.[0]?.url) {
            return getImageUrl(item.images[0].url);
        }
        return null;
    };

    return (
        <Fragment>
            <ItemsFilter
                filters={filters}
                onChange={setFilters}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            >
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your Wardrobe</h1>
                        <p className="text-gray-500 mt-2 font-medium">Manage and curate your digital closet</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                        <button
                            onClick={() => router.push('/wardrobe/trash')}
                            className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-xl border border-gray-100"
                        >
                            <TrashIcon className="h-5 w-5 mr-2 opacity-50" />
                            View Trash
                        </button>
                        <Button onClick={() => openModal()} className="rounded-2xl px-6 h-14 text-base shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <PlusIcon className="h-6 w-6 mr-2" />
                            Add New Item
                        </Button>
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {items.map(item => (
                                    <div
                                        key={item.id}
                                        className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                                        onClick={() => router.push(`/wardrobe/${item.id}`)}
                                    >
                                        {/* Image Container */}
                                        <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                            {(() => {
                                                // Priority:
                                                // 1. If showOriginalBackgrounds is FALSE (default) AND processed image exists -> Show most recent Processed
                                                // 2. Else -> Show Original
                                                let imageUrl = null;
                                                const isProcessed = (img: any) => img.type === 'background_removed' || img.imageType === 'background_removed';

                                                // Get ALL processed images and sort by createdAt descending to get the most recent
                                                const processedImages = (item.images?.filter(isProcessed) || [])
                                                    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                                                const processedImage = processedImages[0]; // Most recent

                                                const originalImage = item.images?.find((img: any) => !isProcessed(img));

                                                if (!showOriginalBackgrounds && processedImage) {
                                                    imageUrl = getImageUrl(processedImage.url);
                                                } else if (originalImage) {
                                                    imageUrl = getImageUrl(originalImage.url);
                                                } else if (item.images?.[0]) {
                                                    // Fallback to first image if no specific type matched (legacy data)
                                                    imageUrl = getImageUrl(item.images[0].url);
                                                }

                                                return imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.metadata?.name || 'Item'}
                                                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!showOriginalBackgrounds && processedImage ? 'p-2 object-contain' : ''}`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <PhotoIcon className="h-12 w-12 opacity-20" />
                                                    </div>
                                                );
                                            })()}

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute top-2 right-2 flex gap-1.5 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openModal(item); }}
                                                    className="p-2 bg-white/95 backdrop-blur-sm rounded-full text-gray-600 hover:text-gray-900 shadow-lg border border-gray-100 transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(item.id); }}
                                                    className="p-2 bg-white/95 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-600 shadow-lg border border-gray-100 transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                                {item.brand?.brand || 'Generic'}
                                            </p>
                                            <h3 className="text-sm font-bold text-gray-900 truncate">
                                                {item.metadata?.name || 'Untitled Piece'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                {item.metadata?.size && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                        {item.metadata.size}
                                                    </span>
                                                )}
                                                {item.ownership?.status && item.ownership.status !== 'owned' && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                                                        {item.ownership.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <PhotoIcon className="mx-auto h-12 w-12 text-gray-300 opacity-50" />
                                <h3 className="mt-4 text-sm font-bold text-gray-900">Your wardrobe is empty</h3>
                                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or add a new piece.</p>
                                <div className="mt-8">
                                    <Button onClick={() => openModal()} className="rounded-xl px-8">
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Add First Piece
                                    </Button>
                                </div>
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
