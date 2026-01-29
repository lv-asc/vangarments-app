'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ItemCreation from '@/components/admin/ItemCreation';
import ItemsFilter, { ItemsFilters } from '@/components/common/ItemsFilter';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { WardrobeItemCard } from './WardrobeItemCard';


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

    // Initialize from localStorage, default to false (show No BG)
    const [showOriginalBackgrounds, setShowOriginalBackgrounds] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wardrobe-show-original-bg');
            return saved === 'true';
        }
        return false;
    });

    // Sync to localStorage when changed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('wardrobe-show-original-bg', String(showOriginalBackgrounds));
        }
    }, [showOriginalBackgrounds]);

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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {items.map(item => {
                                    // Prepare images specifically for the card based on toggle
                                    const isProcessed = (img: any) => img.type === 'background_removed' || img.imageType === 'background_removed';

                                    // Sort all images by sortOrder first
                                    const sortedImages = [...(item.images || [])].sort((a: any, b: any) =>
                                        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
                                    );

                                    // Get originals in sort order
                                    const originalImages = sortedImages.filter((img: any) => !isProcessed(img));

                                    // Build image list for card: for each original, find its No BG version
                                    let cardImages: any[];
                                    if (!showOriginalBackgrounds) {
                                        // No BG mode: for each original, prefer its No BG version if available
                                        cardImages = originalImages.map(orig => {
                                            const noBgVersion = sortedImages.find((img: any) =>
                                                isProcessed(img) &&
                                                (img.aiAnalysis?.originalImageId === orig.id || img.originalImageId === orig.id)
                                            );
                                            return noBgVersion || orig;
                                        });
                                    } else {
                                        // Original mode: just use originals
                                        cardImages = originalImages;
                                    }

                                    // Create a modified item for the card with correctly prioritized images
                                    const cardItem = {
                                        ...item,
                                        images: cardImages
                                    };


                                    return (
                                        <WardrobeItemCard
                                            key={item.id}
                                            item={cardItem}
                                            onEdit={() => router.push(`/wardrobe/${item.vufsCode}/edit`)}
                                            onDelete={() => handleDeleteClick(item.id)}
                                            onToggleFavorite={() => { /* Not implemented yet */ }}
                                            onToggleForSale={() => { /* Not implemented yet */ }}
                                            onView={() => router.push(`/wardrobe/${item.vufsCode}`)}
                                        />
                                    );
                                })}
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
