'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import OutfitCanvas, { OutfitCanvasRef, OutfitCanvasItem } from './OutfitCanvas';
import { ItemSelector } from './ItemSelector';
import {
    PlusIcon,
    TrashIcon,
    ArrowPathIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface OutfitEditorClientProps {
    initialData?: any; // If editing
    mode: 'create' | 'edit';
}

export default function OutfitEditorClient({ initialData, mode }: OutfitEditorClientProps) {
    const router = useRouter();
    const canvasRef = useRef<OutfitCanvasRef>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(true);
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [canvasItems, setCanvasItems] = useState<OutfitCanvasItem[]>([]);

    // Clear canvas confirmation modal state
    const [showClearModal, setShowClearModal] = useState(false);

    // Load initial items if editing
    useEffect(() => {
        if (initialData && initialData.items && canvasRef.current) {
            // Map initial items to canvas items
            const initialCanvasItems: OutfitCanvasItem[] = initialData.items
                .filter((item: any) => item.itemData) // Filter out items with missing data
                .map((item: any) => {
                    const images = item.itemData?.images || [];
                    // Look for background_removed
                    const noBgImg = images.find((img: any) => img.type === 'background_removed');
                    const primaryImg = images.find((img: any) => img.isPrimary);
                    const fallbackImg = images[0];

                    const imageUrl = noBgImg?.url || primaryImg?.url || fallbackImg?.url || '';

                    return {
                        id: item.id, // Canvas ID (or DB relational ID)
                        itemId: item.itemId, // Wardrobe Item ID
                        imageUrl: getImageUrl(imageUrl),
                        position: { x: item.positionX, y: item.positionY },
                        scale: item.scale,
                        rotation: item.rotation,
                        zIndex: item.zIndex,
                        itemType: item.itemType || 'vufs',
                        // Keep original name for display in sidebar
                        name: item.itemData?.name || 'Untitled Item'
                    } as any;
                }).filter((i: any) => i.imageUrl); // Filter out items without images

            // Deduplicate items (fix for legacy bug where items were duplicated on save)
            const uniqueItems: OutfitCanvasItem[] = [];
            const seen = new Set();
            initialCanvasItems.forEach((item: OutfitCanvasItem) => {
                const key = `${item.itemId}-${Math.round(item.position.x)}-${Math.round(item.position.y)}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueItems.push(item);
                }
            });

            canvasRef.current.loadItems(uniqueItems);
            setCanvasItems(uniqueItems);
        }
    }, [initialData]);

    const handleAddItem = useCallback((item: any) => {
        if (!canvasRef.current) return;

        let imageUrl: string | undefined;

        // Robust image extraction
        // Prioritize "background_removed" images for the canvas
        if (Array.isArray(item.images) && item.images.length > 0) {
            // 1. Look for background_removed type
            const noBgImg = item.images.find((img: any) =>
                (typeof img === 'object' && (img.type === 'background_removed' || img.imageType === 'background_removed'))
            );

            if (noBgImg) {
                imageUrl = typeof noBgImg === 'string' ? noBgImg : noBgImg.url;
                console.log('Found background-removed image:', imageUrl);
            } else {
                // 2. Fallback to primary or first image
                const firstImg = item.images[0];
                if (typeof firstImg === 'string') {
                    imageUrl = firstImg;
                } else if (typeof firstImg === 'object' && firstImg.url) {
                    const primary = item.images.find((img: any) => img.isPrimary);
                    imageUrl = primary ? primary.url : firstImg.url;
                }
            }
        } else if (item.imageUrl) {
            imageUrl = item.imageUrl;
        }

        // Use utility to proxy/resolve URL
        const resolvedUrl = getImageUrl(imageUrl);

        if (resolvedUrl) {
            canvasRef.current.addItem({
                id: item.id,
                imageUrl: resolvedUrl,
                itemType: item.itemType || 'vufs',
                // Pass metadata
                name: item.name || 'Untitled Item',
                brand: (typeof item.brand === 'string' ? item.brand : item.brand?.name) || item.brandInfo?.name || item.brand_account_name || 'Unknown Brand',
                size: item.size?.name || item.size || 'N/A',
                category: item.category?.name || item.category || 'N/A'
            });
            // Update items list
            setTimeout(() => {
                if (canvasRef.current) {
                    setCanvasItems(canvasRef.current.getItems());
                }
            }, 100);
            toast.success(`Added ${item.name}`);
        } else {
            console.error('No image found for item:', item);
            toast.error('Item has no images');
        }
    }, []);

    const handleModified = useCallback(() => {
        setHasUnsavedChanges(true);
        if (canvasRef.current) {
            setCanvasItems(canvasRef.current.getItems());
        }
    }, []);

    const handleDeleteItem = useCallback((itemId: string) => {
        // Find object on canvas and remove it
        if (canvasRef.current && canvasRef.current.canvas) {
            const objects = canvasRef.current.canvas.getObjects();
            const obj = objects.find((o: any) => o.id === itemId);
            if (obj) {
                canvasRef.current.canvas.remove(obj);
                canvasRef.current.canvas.renderAll();
                handleModified();
            }
        }
    }, [handleModified]);

    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            toast.error('Please name your outfit');
            return;
        }

        if (!canvasRef.current) return;

        setSaving(true);
        const currentItems = canvasRef.current.getItems();

        let previewUrl: string | undefined;

        try {
            // Capture preview
            const dataUrl = canvasRef.current.exportToPNG();
            if (dataUrl) {
                // Convert to blob and upload
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `outfit-preview-${Date.now()}.png`, { type: 'image/png' });

                // @ts-ignore - method added recently
                const uploadRes = await apiClient.uploadImage(file, 'wardrobe');
                previewUrl = uploadRes.url;
            }
        } catch (err) {
            console.error('Failed to generate preview:', err);
            // Don't block saving if preview fails, just log it
        }

        // Prepare payload
        const payload = {
            name,
            description,
            previewUrl,
            items: currentItems.map(item => ({
                itemId: item.itemId,
                positionX: item.position.x,
                positionY: item.position.y,
                rotation: item.rotation,
                scale: item.scale,
                zIndex: item.zIndex,
                itemType: item.itemType
            }))
        };

        try {
            if (mode === 'create') {
                await apiClient.createOutfit(payload);
                toast.success('Outfit created!');
            } else {
                await apiClient.updateOutfit(initialData.id, payload);
                toast.success('Outfit updated!');
            }
            router.push('/outfits');
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to save outfit');
        } finally {
            setSaving(false);
        }
    }, [name, description, mode, initialData, router]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex flex-col space-y-1">
                    <input
                        type="text"
                        placeholder="Outfit Name"
                        className="text-2xl font-bold border-none focus:ring-0 p-0 placeholder-gray-300 bg-transparent"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        className="text-sm text-gray-500 border-none focus:ring-0 p-0 placeholder-gray-300 w-full bg-transparent"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="flex items-center space-x-2 px-6 py-2 bg-[#00132d] hover:bg-[#00132d]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <span>{mode === 'create' ? 'Save Outfit' : 'Update Outfit'}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area: 3 Columns */}
            <div className="flex flex-1 overflow-hidden">
                {/* Column 1: Item Selector (Left) */}
                <ItemSelector
                    isOpen={true}
                    onSelectItem={handleAddItem}
                />

                {/* Column 2: Canvas (Center) */}
                <div className="flex-1 relative overflow-hidden flex justify-center items-center p-8 bg-gray-100">
                    <div className="relative shadow-2xl rounded-lg bg-white overflow-hidden">
                        {/* Toolbar */}
                        <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 bg-white/90 backdrop-blur shadow-sm rounded-lg p-2 border border-gray-100">
                            <button
                                onClick={() => {
                                    canvasRef.current?.deleteSelected();
                                    handleModified();
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Selected"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowClearModal(true)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="Clear Canvas"
                            >
                                <ArrowPathIcon className="w-5 h-5" />
                            </button>

                            <div className="border-t border-gray-100 my-1 pt-1">
                                <button
                                    onClick={() => canvasRef.current?.undo()}
                                    disabled={!canvasRef.current?.canUndo}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                    title="Undo (Cmnd+Z)"
                                >
                                    <ArrowUturnLeftIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => canvasRef.current?.redo()}
                                    disabled={!canvasRef.current?.canRedo}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                    title="Redo (Cmnd+Shift+Z)"
                                >
                                    <ArrowUturnRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Clear Canvas Confirmation Modal */}
                        <ConfirmationModal
                            isOpen={showClearModal}
                            onClose={() => setShowClearModal(false)}
                            onConfirm={() => {
                                canvasRef.current?.clear();
                                handleModified();
                                setShowClearModal(false);
                            }}
                            title="Clear Canvas"
                            message="Are you sure you want to clear all items from the canvas? This action cannot be undone."
                            confirmText="Clear"
                            cancelText="Cancel"
                            variant="danger"
                        />

                        <OutfitCanvas
                            ref={canvasRef}
                            width={800}
                            height={800}
                            onModified={handleModified}
                        />
                    </div>
                </div>

                {/* Column 3: Outfit Items (Right) */}
                <div className="w-72 bg-white border-l border-gray-100 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Outfit Items</h2>
                        <p className="text-xs text-gray-500 uppercase font-semibold mt-1">
                            {canvasItems.length} {canvasItems.length === 1 ? 'Item' : 'Items'} Added
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {canvasItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <div className="text-4xl mb-2 opacity-20">👔</div>
                                <p className="text-sm text-gray-400">Add items from the left to start building your outfit</p>
                            </div>
                        ) : (
                            [...canvasItems].reverse().map((item: any, reversedIdx) => {
                                const idx = canvasItems.length - 1 - reversedIdx;
                                return (
                                    <div key={item.id || idx} className="group bg-white border border-gray-200 rounded-lg p-3 flex items-start space-x-3 transition-all hover:shadow-md hover:border-gray-300">
                                        <div className="w-16 h-16 bg-gray-50 rounded-md border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                            <img src={item.imageUrl} alt="" className="w-full h-full object-contain p-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 truncate">{item.name || 'Untitled Item'}</h3>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{item.brand || 'Unknown Brand'}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                                                    {item.size || 'N/A'}
                                                </span>
                                                <span className="text-[10px] items-center text-gray-400">
                                                    {item.itemType === 'sku' ? 'CATALOG' : 'WARDROBE'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-all -mr-1">
                                            <button
                                                onClick={() => canvasRef.current?.bringForward(item.id)}
                                                className="p-1 text-gray-400 hover:text-[#00132d] hover:bg-gray-50 rounded"
                                                title="Move Up"
                                                disabled={reversedIdx === 0}
                                            >
                                                <ChevronUpIcon className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                title="Remove"
                                            >
                                                <TrashIcon className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => canvasRef.current?.sendBackward(item.id)}
                                                className="p-1 text-gray-400 hover:text-[#00132d] hover:bg-gray-50 rounded"
                                                title="Move Down"
                                                disabled={reversedIdx === canvasItems.length - 1}
                                            >
                                                <ChevronDownIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
