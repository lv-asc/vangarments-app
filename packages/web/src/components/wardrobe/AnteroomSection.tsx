'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusIcon,
    FunnelIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { AnteroomAPI, type AnteroomItem, type ItemCountResponse } from '@/lib/anteroomApi';
import AnteroomItemCard from './AnteroomItemCard';
import AnteroomUploadModal from './AnteroomUploadModal';
import QualityApplicationPanel from './QualityApplicationPanel';
import { ExpiryIndicator } from '@/components/ui/ExpiryIndicator';

interface AnteroomSectionProps {
    onItemComplete?: (item: any) => void;
}

/**
 * AnteroomSection - Main anteroom display and management component
 */
export function AnteroomSection({ onItemComplete }: AnteroomSectionProps) {
    // State
    const [items, setItems] = useState<AnteroomItem[]>([]);
    const [itemCount, setItemCount] = useState<ItemCountResponse>({
        current: 0,
        max: 50,
        available: 50,
        limits: { MAX_BATCH_UPLOAD: 10, MAX_TOTAL_ITEMS: 50, EXPIRY_DAYS: 14 },
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Selection state for bulk operations
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showQualityPanel, setShowQualityPanel] = useState(false);
    const [isApplyingQuality, setIsApplyingQuality] = useState(false);

    // Fetch items
    const fetchItems = useCallback(async () => {
        try {
            setIsLoading(true);
            const [itemsRes, countRes] = await Promise.all([
                AnteroomAPI.getItems(),
                AnteroomAPI.getItemCount(),
            ]);
            setItems(itemsRes.items);
            setItemCount(countRes);
        } catch (error) {
            console.error('Failed to load anteroom items:', error);
            toast.error('Failed to load anteroom items');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Handle batch upload
    const handleUpload = async (files: File[]) => {
        try {
            setIsUploading(true);
            const result = await AnteroomAPI.addBatchItems(files, []);

            if (result.errors?.length > 0) {
                toast.error(`Some items failed: ${result.errors[0]}`);
            } else {
                toast.success(`Added ${result.items.length} items to anteroom`);
            }

            setShowUploadModal(false);
            await fetchItems();
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload items');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle item selection
    const handleItemSelect = (id: string, selected: boolean) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (selected) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    // Toggle selection mode
    const toggleSelectionMode = () => {
        if (selectionMode) {
            setSelectedItems(new Set());
            setShowQualityPanel(false);
        }
        setSelectionMode(!selectionMode);
    };

    // Apply quality to selected items
    const handleApplyQuality = async (quality: string, value: any) => {
        if (selectedItems.size === 0) return;

        try {
            setIsApplyingQuality(true);
            const result = await AnteroomAPI.applyQualityBulk({
                itemIds: Array.from(selectedItems),
                quality: quality as any,
                value,
            });

            if (result.errors?.length > 0) {
                toast.error(`Some items failed: ${result.errors[0]}`);
            } else {
                toast.success(`Updated ${result.updated} items`);
            }

            setShowQualityPanel(false);
            setSelectedItems(new Set());
            setSelectionMode(false);
            await fetchItems();
        } catch (error) {
            console.error('Apply quality failed:', error);
            toast.error('Failed to apply quality');
        } finally {
            setIsApplyingQuality(false);
        }
    };

    // Handle item edit (navigate to edit view or show modal)
    const handleEditItem = (item: AnteroomItem) => {
        // TODO: Implement edit modal or navigation
        toast.success(`Editing item: ${item.id}`);
    };

    // Handle complete item
    const handleCompleteItem = async (item: AnteroomItem) => {
        try {
            const result = await AnteroomAPI.completeItem(item.id);
            toast.success('Item moved to wardrobe!');
            onItemComplete?.(result.item);
            await fetchItems();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.error?.message || 'Failed to complete item';
            toast.error(errorMsg);
        }
    };

    // Handle remove item
    const handleRemoveItem = async (item: AnteroomItem) => {
        if (!confirm('Remove this item from anteroom?')) return;

        try {
            await AnteroomAPI.removeItem(item.id);
            toast.success('Item removed');
            await fetchItems();
        } catch (error) {
            console.error('Remove failed:', error);
            toast.error('Failed to remove item');
        }
    };

    // Items expiring soon (3 days or less)
    const expiringSoonItems = items.filter(item => item.daysRemaining <= 3);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Anteroom</h2>
                    <p className="text-sm text-gray-500">
                        Staging area for items pending details • {itemCount.current} of {itemCount.max} items
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={fetchItems}
                        disabled={isLoading}
                    >
                        <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button
                        variant={selectionMode ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={toggleSelectionMode}
                    >
                        <FunnelIcon className="w-4 h-4 mr-1" />
                        {selectionMode ? `${selectedItems.size} selected` : 'Bulk Edit'}
                    </Button>

                    <Button
                        onClick={() => setShowUploadModal(true)}
                        disabled={itemCount.available <= 0}
                    >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Items
                    </Button>
                </div>
            </div>

            {/* Expiring Soon Warning */}
            {expiringSoonItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">
                            {expiringSoonItems.length} item{expiringSoonItems.length > 1 ? 's' : ''} expiring soon
                        </p>
                        <p className="text-sm text-amber-700">
                            Complete these items to move them to your wardrobe before they expire.
                        </p>
                    </div>
                </div>
            )}

            {/* Quality Application Panel (when items selected) */}
            {selectionMode && selectedItems.size > 0 && (
                <div className="sticky top-4 z-10">
                    {showQualityPanel ? (
                        <QualityApplicationPanel
                            selectedCount={selectedItems.size}
                            onApply={handleApplyQuality}
                            onCancel={() => setShowQualityPanel(false)}
                            isApplying={isApplyingQuality}
                        />
                    ) : (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                            <p className="font-medium text-indigo-800">
                                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedItems(new Set());
                                        setSelectionMode(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setShowQualityPanel(true)}
                                >
                                    Apply Quality
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Items Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square bg-gray-200 rounded-xl" />
                            <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
                            <div className="mt-1 h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <PlusIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items in anteroom</h3>
                    <p className="text-gray-500 mb-4">
                        Upload items here to add details before moving them to your wardrobe.
                    </p>
                    <Button onClick={() => setShowUploadModal(true)}>
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Your First Items
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item) => (
                        <AnteroomItemCard
                            key={item.id}
                            item={item}
                            isSelected={selectedItems.has(item.id)}
                            selectionMode={selectionMode}
                            onSelect={handleItemSelect}
                            onEdit={handleEditItem}
                            onComplete={handleCompleteItem}
                            onRemove={handleRemoveItem}
                        />
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <AnteroomUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUpload}
                itemCount={itemCount}
                isUploading={isUploading}
            />
        </div>
    );
}

export default AnteroomSection;
