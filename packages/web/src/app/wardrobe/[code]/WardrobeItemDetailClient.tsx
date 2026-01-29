// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import BatchPreviewModal from '@/components/wardrobe/BatchPreviewModal';
import toast from 'react-hot-toast';

import {
    ShoppingBagIcon,
    PencilIcon,
    TrashIcon,
    HeartIcon,
    PhotoIcon,
    ShareIcon,
    ChevronUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    CalendarIcon,
    TagIcon,
    UserGroupIcon,
    EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// Helper for slugs
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

interface WardrobeItem {
    id: string;
    vufsCode: string;
    ownerId: string;
    category: any;
    categoryId?: string;
    brand: any;
    brandId?: string;
    sizeId?: string;
    metadata: {
        name: string;
        composition: Array<{ name?: string; material?: string; percentage: number }>;
        colors: Array<{ name?: string; primary?: string; hex?: string }>;
        careInstructions: string[];
        size?: string;
        pattern?: string;
        fit?: string;
        pricing?: {
            retailPrice?: number;
            purchasePrice?: number;
            currentValue?: number;
        };
        acquisitionInfo?: {
            purchasePrice?: number;
            purchaseDate?: string;
            store?: string;
        };
        measurements?: any[];
        [key: string]: any;
    };
    condition: {
        status: string;
        description?: string;
    };
    images?: Array<{ url: string; type: string; isPrimary: boolean; id: string; aiAnalysis?: any }>;
    createdAt: string;
    [key: string]: any;
}


function SortableThumbnail({
    id,
    active,
    onClick,
    src,
    alt,
    showOverlay,
    remainingCount
}: {
    id: string;
    active: boolean;
    onClick: () => void;
    src: string;
    alt: string;
    showOverlay?: boolean;
    remainingCount?: number;
}) {
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
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full aspect-square mb-3">
            <button
                type="button"
                onClick={onClick}
                className={`relative w-full h-full rounded-md overflow-hidden border transition-all ${active
                    ? 'border-[#00132d] ring-1 ring-[#00132d]'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
            >
                <div className="relative w-full h-full pointer-events-none">
                    <img
                        src={src}
                        alt={alt}
                        className={`w-full h-full object-cover ${showOverlay ? 'opacity-40' : ''}`}
                    />
                    {showOverlay && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold">
                            +{remainingCount}
                        </div>
                    )}
                </div>
            </button>
        </div>
    );
}

export default function WardrobeItemDetailClient() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [item, setItem] = useState<WardrobeItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);

    // Image State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // BG Removal State
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);
    // Initialize from localStorage, default to true (show original)
    const [showOriginalBackground, setShowOriginalBackground] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wardrobe-show-original-bg');
            // If saved is 'true', show original. If 'false', show No BG.
            return saved !== 'false';
        }
        return true;
    });
    const [showBgOptions, setShowBgOptions] = useState(false);
    const [bgQuality, setBgQuality] = useState<'fast' | 'medium' | 'high'>('medium');
    const [bgFeatherRadius, setBgFeatherRadius] = useState(0);
    const [bgOutputRatio, setBgOutputRatio] = useState<'1:1' | '4:5' | '3:4' | 'original'>('original');
    const [batchPreviewItems, setBatchPreviewItems] = useState<any[]>([]);
    const [pendingBatchImages, setPendingBatchImages] = useState<any[]>([]);
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [isDeletingImage, setIsDeletingImage] = useState(false);

    // Sync showOriginalBackground to localStorage when changed
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('wardrobe-show-original-bg', String(showOriginalBackground));
        }
    }, [showOriginalBackground]);


    // Attribute State
    const [attributes, setAttributes] = useState<any[]>([]);

    // Confirmation Dialogs
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showUndoConfirm, setShowUndoConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Accordion States
    const [showMeasurements, setShowMeasurements] = useState(false);
    const [showCareInstructions, setShowCareInstructions] = useState(false);
    const [showComposition, setShowComposition] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Message Modal
    const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [showMoreOptions, setShowMoreOptions] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !item) return;

        const displayImages = (item.images || []).filter(img =>
            img.type !== 'background_removed' && (img as any).imageType !== 'background_removed'
        );

        const oldIndex = displayImages.findIndex(img => img.id === active.id);
        const newIndex = displayImages.findIndex(img => img.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newDisplayIds = arrayMove(displayImages.map(i => i.id), oldIndex, newIndex);

            // Reconstruct the full list based on the new display order
            const reorderedImages: any[] = [];
            const processedIds = new Set<string>();

            // 1. Add reordered display images and their children
            newDisplayIds.forEach((displayId, index) => {
                const orig = item.images.find(i => i.id === displayId);
                if (orig) {
                    // Assign sortOrder to ensure backend persists the new order
                    reorderedImages.push({ ...orig, sortOrder: index * 10 });
                    processedIds.add(orig.id);

                    // Find children (bg removed versions) and keep them adjacent
                    const children = item.images.filter(img =>
                        (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
                        (img.aiAnalysis?.originalImageId === displayId || (img as any).originalImageId === displayId)
                    );
                    children.forEach((c, cIdx) => {
                        // Keep children close to parent in sort order
                        reorderedImages.push({ ...c, sortOrder: (index * 10) + cIdx + 1 });
                        processedIds.add(c.id);
                    });
                }
            });

            // 2. Append any leftovers (orphans or unclassified)
            item.images.forEach((img, index) => {
                if (!processedIds.has(img.id)) {
                    reorderedImages.push({ ...img, sortOrder: (newDisplayIds.length * 10) + index * 10 });
                }
            });

            // Optimistic update
            setItem(prev => prev ? { ...prev, images: reorderedImages } : null);

            // Update local selection index logic
            if (currentImageIndex === oldIndex) setCurrentImageIndex(newIndex);
            else if (currentImageIndex === newIndex) setCurrentImageIndex(oldIndex);

            // API Save - Use the dedicated reorder endpoint
            try {
                // Extract just the IDs in the new order (for all images, not just display images)
                const orderedImageIds = reorderedImages.map(img => img.id);
                await apiClient.reorderWardrobeItemImages(item.id, orderedImageIds);
                toast.success('Image order saved');
            } catch (e) {
                console.error('Failed to save order', e);
                toast.error('Failed to save image order');
                loadItem(); // Revert by reloading from server
            }
        }
    };


    useEffect(() => {
        if (code) {
            loadItem();
        }
    }, [code]);

    // Close dropdown on click outside
    useEffect(() => {
        if (!showMoreOptions) return;
        const handleClickOutside = () => setShowMoreOptions(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showMoreOptions]);

    const loadItem = async () => {
        setLoading(true);
        setError(null);
        try {
            const [itemResponse] = await Promise.all([
                apiClient.getWardrobeItem(code),
            ]);

            const fetchedItem = itemResponse.item;
            setItem(fetchedItem);
        } catch (err: any) {
            console.error('Error loading item:', err);
            setError(err.message || 'Falha ao carregar item');
            setItem(null);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (title: string, message: string, type: 'info' | 'error' = 'info') => {
        setMessageModal({ isOpen: true, title, message, type });
        if (type === 'error') toast.error(message);
        else toast(message);
    };

    const handleSellItem = () => {
        router.push(`/marketplace/create?itemId=${item?.id}`);
    };

    const handleEditItem = () => {
        router.push(`/wardrobe/${item?.vufsCode}/edit`);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!item) return;
        setDeleting(true);
        try {
            await apiClient.deleteWardrobeItem(item.id);
            router.push('/wardrobe');
        } catch (err: any) {
            showMessage('Erro', 'Falha ao excluir item: ' + (err.message || 'Erro desconhecido'), 'error');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: item?.metadata.name,
                text: `Confira esta peça: ${item?.metadata.name} - ${item?.brand.brand}`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copiado!');
        }
    };

    const handleRemoveBackground = async () => {
        if (!item) return;

        let imagesToProcess = [];
        if (selectedImages.size > 0) {
            imagesToProcess = Array.from(selectedImages).map(id => item.images?.find(img => img.id === id)).filter(Boolean);
        } else {
            const currentImage = item.images?.[currentImageIndex];
            if (currentImage && currentImage.type !== 'background_removed') {
                imagesToProcess = [currentImage];
            }
        }

        if (imagesToProcess.length === 0) return;

        setIsRemovingBackground(true);
        try {
            const response = await apiClient.batchRemoveBackground(
                item.id,
                imagesToProcess.map(img => img!.id),
                {
                    quality: bgQuality,
                    featherRadius: bgFeatherRadius,
                    outputRatio: bgOutputRatio
                }
            );

            if (response.results) {
                const previewItems: any[] = [];
                const newProcessedImages: any[] = [];

                response.results.forEach((res: any) => {
                    if (res.image) {
                        newProcessedImages.push(res.image);
                        const originalImg = imagesToProcess.find((img: any) => img.id === res.image.aiAnalysis?.originalImageId);
                        if (originalImg) {
                            previewItems.push({
                                id: res.image.id,
                                originalUrl: originalImg.url,
                                processedUrl: res.image.url,
                                originalId: originalImg.id
                            });
                        }
                    }
                });

                setPendingBatchImages(newProcessedImages);
                setBatchPreviewItems(previewItems);
                setShowBatchPreview(true);
                setShowBgOptions(false);
            }
        } catch (err: any) {
            showMessage('Erro', 'Falha ao remover fundo: ' + (err.message || 'Erro desconhecido'), 'error');
        } finally {
            setIsRemovingBackground(false);
        }
    };

    const handleBatchPreviewConfirm = async (selectedIds: string[]) => {
        if (!item) return;
        const selectedImgs = pendingBatchImages.filter(img => selectedIds.includes(img.id));

        if (selectedImgs.length > 0) {
            const newImages = [...(item.images || []), ...selectedImgs];
            setItem({ ...item, images: newImages });
            setShowOriginalBackground(false);
            setSelectedImages(new Set());
            setIsSelectionMode(false);
            toast.success(`${selectedImgs.length} imagens salvas`);
        }
        setShowBatchPreview(false);
        setBatchPreviewItems([]);
        setPendingBatchImages([]);
    };

    const handleBatchPreviewCancel = () => {
        setShowBatchPreview(false);
        setBatchPreviewItems([]);
        setPendingBatchImages([]);
        toast('Processamento cancelado');
    };

    const handleUndoBackgroundRemoval = async () => {
        if (!item || !item.images) return;
        const currentOriginalImage = displayImages[currentImageIndex];
        if (!currentOriginalImage) return;

        const bgRemovedImage = item.images.find(img =>
            (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
            img.aiAnalysis?.originalImageId === currentOriginalImage.id
        );

        if (!bgRemovedImage) return;

        setIsDeletingImage(true);
        try {
            await apiClient.deleteWardrobeItemImage(item.id, bgRemovedImage.id);
            const updatedImages = item.images.filter(img => img.id !== bgRemovedImage.id);
            setItem({ ...item, images: updatedImages });
            setShowOriginalBackground(true);
            setShowUndoConfirm(false);
        } catch (err: any) {
            showMessage('Erro', 'Falha ao desfazer remoção: ' + (err.message || 'Erro desconhecido'), 'error');
        } finally {
            setIsDeletingImage(false);
        }
    };

    const handleOpenMaskEditor = () => {
        router.push(`/wardrobe/bg-editor/${item?.vufsCode}`);
    };

    const displayImages = (item?.images || []).filter(img =>
        img.type !== 'background_removed' && (img as any).imageType !== 'background_removed'
    );

    const currentBaseImage = displayImages[currentImageIndex];

    const hasBgRemovedVersion = !!item?.images?.some(img =>
        (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
        img.aiAnalysis?.originalImageId === currentBaseImage?.id
    );

    const effectiveMainImageUrl = (() => {
        if (!currentBaseImage) return '';
        if (hasBgRemovedVersion && !showOriginalBackground) {
            const bgRemoved = item?.images?.find(img =>
                (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
                img.aiAnalysis?.originalImageId === currentBaseImage.id
            );
            return bgRemoved ? bgRemoved.url : currentBaseImage.url;
        }
        return currentBaseImage.url;
    })();

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };

    const selectImage = (index: number) => {
        setCurrentImageIndex(index);
    };

    const getConditionColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-green-100 text-green-800';
            case 'excellent': return 'bg-blue-100 text-blue-800';
            case 'good': return 'bg-yellow-100 text-yellow-800';
            case 'fair': return 'bg-orange-100 text-orange-800';
            case 'poor': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getConditionLabel = (status: string) => {
        switch (status) {
            case 'new': return 'New';
            case 'excellent': return 'Excellent';
            case 'good': return 'Good';
            case 'fair': return 'Fair';
            case 'poor': return 'Poor';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading item...</p>
                </div>
            </div>
        );
    }

    if (!item) return null;

    const brandSlug = item.brand?.slug || (item.brand?.brand ? slugify(item.brand.brand) : 'brand');
    const displayPriceBrl = item.metadata.pricing?.retailPrice
        ? `R$ ${item.metadata.pricing.retailPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : null;

    const paidPriceBrl = item.metadata.acquisitionInfo?.purchasePrice
        ? `R$ ${item.metadata.acquisitionInfo.purchasePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : null;

    const sellingPriceBrl = item.metadata.pricing?.currentValue
        ? `R$ ${item.metadata.pricing.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-2">

                {/* Header / Back Button & BG Tools Toolbar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <Button variant="outline" onClick={() => router.back()} className="flex items-center space-x-2">
                        <span>←</span><span>Back</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        {hasBgRemovedVersion && (
                            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className={`flex items-center space-x-3 px-3 py-1.5 ${!showOriginalBackground ? 'border-r border-gray-200' : ''}`}>
                                    <span className={`text-xs font-medium ${showOriginalBackground ? 'text-gray-900' : 'text-gray-500'}`}>Original</span>
                                    <Switch
                                        checked={!showOriginalBackground}
                                        onCheckedChange={(checked) => setShowOriginalBackground(!checked)}
                                        className="data-[state=checked]:bg-[#00132d]"
                                    />
                                    <span className={`text-xs font-medium ${!showOriginalBackground ? 'text-gray-900' : 'text-gray-500'}`}>No BG</span>
                                </div>
                                {!showOriginalBackground && (
                                    <>
                                        <button
                                            type="button"
                                            className="px-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                                            onClick={() => setShowUndoConfirm(true)}
                                            title="Delete No-BG Version"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="px-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none border-l border-gray-200"
                                            onClick={handleOpenMaskEditor}
                                            title="Edit Mask"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <div className="flex items-stretch shadow-sm">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-white text-gray-700 hover:bg-gray-50 rounded-r-none border-r-0"
                                    onClick={handleRemoveBackground}
                                    loading={isRemovingBackground}
                                >
                                    <PhotoIcon className="h-4 w-4 mr-2" />
                                    {selectedImages.size > 0 ? `Remove BG (${selectedImages.size})` : 'Remove Background'}
                                </Button>
                                <button
                                    className={`px-2 border border-l-0 border-gray-200 rounded-r-lg transition-colors ${showBgOptions ? 'bg-indigo-50 text-indigo-600' : 'bg-white hover:bg-gray-50 text-gray-500'}`}
                                    onClick={() => setShowBgOptions(!showBgOptions)}
                                    title="Removal Options"
                                >
                                    <ChevronDownIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {showBgOptions && (
                                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-40 w-64">
                                    <h4 className="text-xs font-semibold text-gray-900 mb-3">Removal Options</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-500 uppercase">Quality</label>
                                            <div className="flex bg-gray-100 p-1 rounded mt-1">
                                                {(['fast', 'medium', 'high'] as const).map(q => (
                                                    <button key={q} onClick={() => setBgQuality(q)} className={`flex-1 px-2 py-1 rounded text-xs transition-all ${bgQuality === q ? 'bg-white shadow text-[#00132d]' : 'text-gray-500'}`}>{q === 'high' ? 'High' : q === 'medium' ? 'Med' : 'Fast'}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-500 uppercase">Input Ratio</label>
                                            <div className="flex bg-gray-100 p-1 rounded mt-1">
                                                {(['original', '1:1', '3:4'] as const).map(r => (
                                                    <button key={r} onClick={() => setBgOutputRatio(r)} className={`flex-1 px-2 py-1 rounded text-xs transition-all ${bgOutputRatio === r ? 'bg-white shadow text-[#00132d]' : 'text-gray-500'}`}>{r === 'original' ? 'Auto' : r}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                        {/* LEFT: Product Images */}
                        <div className="flex gap-4 self-start">
                            {/* Vertical Thumbnails */}
                            {/* Vertical Thumbnails */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="hidden md:flex flex-col gap-3 w-20 shrink-0 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                    <SortableContext
                                        items={displayImages.map(img => img.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {displayImages.map((img, idx) => {
                                            let thumbUrl = img.url;
                                            if (!showOriginalBackground) {
                                                const thumbBgRemoved = item.images?.find(i =>
                                                    (i.aiAnalysis?.originalImageId === img.id || (i as any).originalImageId === img.id) &&
                                                    (i.type === 'background_removed' || (i as any).imageType === 'background_removed')
                                                );
                                                if (thumbBgRemoved) thumbUrl = thumbBgRemoved.url;
                                            }

                                            return (
                                                <SortableThumbnail
                                                    key={img.id}
                                                    id={img.id}
                                                    active={currentImageIndex === idx}
                                                    onClick={() => selectImage(idx)}
                                                    src={getImageUrl(thumbUrl)}
                                                    alt={`View ${idx + 1}`}
                                                />
                                            );
                                        })}
                                    </SortableContext>
                                </div>
                            </DndContext>

                            {/* Main Image */}
                            <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden relative group flex-1">
                                {currentBaseImage ? (
                                    <>
                                        <img
                                            src={getImageUrl(effectiveMainImageUrl)}
                                            alt={item.metadata.name}
                                            className="w-full h-full object-cover object-center"
                                        />

                                        {displayImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronLeftIcon className="h-6 w-6" />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ChevronRightIcon className="h-6 w-6" />
                                                </button>

                                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                                                    {displayImages.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={(e) => { e.stopPropagation(); selectImage(idx); }}
                                                            className={`w-2 h-2 rounded-full transition-all shadow-sm ${idx === currentImageIndex
                                                                ? 'bg-white w-4'
                                                                : 'bg-white/50 hover:bg-white/80'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ShoppingBagIcon className="h-24 w-24" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT Column */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <Link href={`/brands/${brandSlug}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group">
                                        {item.brand?.logo ? (
                                            <img src={getImageUrl(item.brand.logo)} alt={item.brand.brand} className="w-5 h-5 rounded-full object-contain bg-white" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">{item.brand?.brand?.charAt(0)}</div>
                                        )}
                                        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{item.brand?.brand}</span>
                                    </Link>

                                    {item.brand.line && (
                                        <Link href={`/brands/${brandSlug}?line=${slugify(item.brand.line)}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">L</div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{item.brand.line}</span>
                                        </Link>
                                    )}

                                    {item.metadata.collection && (
                                        <Link href={`/brands/${brandSlug}/collections/${slugify(item.metadata.collection)}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">C</div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{item.metadata.collection}</span>
                                        </Link>
                                    )}
                                </div>

                                <div className="flex justify-between items-start gap-4">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.metadata.name}</h1>
                                    <div className="flex gap-2 shrink-0 mt-1">
                                        <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors">
                                            {isFavorite ? <HeartSolidIcon className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-gray-500" />}
                                        </button>
                                        <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors">
                                            <ShareIcon className="h-5 w-5 text-gray-500" />
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowMoreOptions(!showMoreOptions); }}
                                                className="p-2 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors"
                                            >
                                                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
                                            </button>

                                            {showMoreOptions && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                                    <button
                                                        onClick={handleEditItem}
                                                        className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <PencilIcon className="h-4 w-4 mr-3 text-gray-400" />
                                                        Edit Item
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteClick}
                                                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                                                    >
                                                        <TrashIcon className="h-4 w-4 mr-3 text-red-500" />
                                                        Delete Item
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mt-4">
                                    {displayPriceBrl && (
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {displayPriceBrl} <span className="text-sm font-normal text-gray-400">Retail</span>
                                        </p>
                                    )}
                                    {paidPriceBrl && (
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {paidPriceBrl} <span className="text-sm font-normal text-gray-400">Paid</span>
                                        </p>
                                    )}
                                    {sellingPriceBrl && (
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {sellingPriceBrl} <span className="text-sm font-normal text-gray-400">Selling</span>
                                        </p>
                                    )}
                                    {!displayPriceBrl && !paidPriceBrl && !sellingPriceBrl && (
                                        <p className="text-sm text-gray-400 italic">No price verified</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-6 mb-6">
                                <Button className="w-full py-6 text-lg font-semibold bg-[#00132d] hover:bg-[#00132d]/90 text-white rounded-xl shadow-lg" onClick={handleSellItem}>
                                    <ShoppingBagIcon className="h-6 w-6 mr-2" />
                                    Sell on Marketplace
                                </Button>
                            </div>

                            <div className="border-t border-gray-200 pt-6 space-y-4">
                                {item.metadata.description && (
                                    <div>
                                        <button
                                            onClick={() => setShowDescription(!showDescription)}
                                            className="flex items-center justify-between w-full text-left"
                                        >
                                            <h3 className="text-sm font-medium text-gray-900">Description</h3>
                                            {showDescription ? (
                                                <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            ) : (
                                                <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            )}
                                        </button>

                                        {showDescription && (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-600">{item.metadata.description}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(item.metadata.colors?.length > 0 || item.metadata.composition?.length > 0) && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <button onClick={() => setShowComposition(!showComposition)} className="flex items-center justify-between w-full">
                                            <h3 className="text-sm font-medium text-gray-900">Material & Color</h3>
                                            {showComposition ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
                                        </button>
                                        {showComposition && (
                                            <div className="mt-4 space-y-4">
                                                {item.metadata.colors?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.metadata.colors.map((c, i) => (
                                                            <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                                                <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.hex || c.primary || '#999' }} />
                                                                <span className="text-sm text-gray-700">{c.name || c.primary}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.metadata.composition?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.metadata.composition.map((c, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded-md border border-gray-100">
                                                                {c.percentage}% {c.name || c.material}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {item.metadata.careInstructions?.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <button onClick={() => setShowCareInstructions(!showCareInstructions)} className="flex items-center justify-between w-full">
                                            <h3 className="text-sm font-medium text-gray-900">Care Instructions</h3>
                                            {showCareInstructions ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
                                        </button>
                                        {showCareInstructions && (
                                            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {item.metadata.careInstructions.map((inst, i) => (
                                                        <li key={i} className="text-sm text-gray-600">{inst}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-6">
                                    <button onClick={() => setShowDetails(!showDetails)} className="flex items-center justify-between w-full">
                                        <h3 className="text-sm font-medium text-gray-900">See More</h3>
                                        {showDetails ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
                                    </button>
                                    {showDetails && (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg"><CheckCircleIcon className="h-5 w-5 text-gray-600" /></div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Condition</p>
                                                    <p className="text-sm font-medium text-gray-900">{item.condition.description || getConditionLabel(item.condition.status)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg"><TagIcon className="h-5 w-5 text-gray-600" /></div>
                                                <div><p className="text-xs text-gray-500">VUFS Code</p><p className="text-sm font-mono text-gray-900">{item.vufsCode}</p></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Item"
                    message="Are you sure you want to delete this item?"
                    confirmText="Delete"
                    type="danger"
                    loading={deleting}
                />

                <ConfirmDialog
                    isOpen={showUndoConfirm}
                    onClose={() => setShowUndoConfirm(false)}
                    onConfirm={handleUndoBackgroundRemoval}
                    title="Remove No-BG Version"
                    message="This will delete the processed version. Original kept."
                    confirmText="Delete"
                    type="danger"
                    loading={isDeletingImage}
                />

                {showBatchPreview && (
                    <BatchPreviewModal
                        isOpen={showBatchPreview}
                        items={batchPreviewItems}
                        onConfirm={handleBatchPreviewConfirm}
                        onCancel={handleBatchPreviewCancel}
                    />
                )}
            </div>
        </div>
    );
}

function getEffectiveImage(image: any) {
    return image;
}
