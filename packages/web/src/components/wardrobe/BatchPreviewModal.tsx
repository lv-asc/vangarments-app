import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '@/utils/imageUrl';

interface BatchPreviewItem {
    id: string;
    originalUrl: string;
    processedUrl: string;
    originalId: string;
}

interface BatchPreviewModalProps {
    isOpen: boolean;
    items: BatchPreviewItem[];
    onConfirm: (selectedIds: string[]) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function BatchPreviewModal({
    isOpen,
    items,
    onConfirm,
    onCancel,
    isLoading = false
}: BatchPreviewModalProps) {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(
        new Set(items.map(item => item.id))
    );
    const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

    const toggleItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const selectAll = () => setSelectedItems(new Set(items.map(item => item.id)));
    const selectNone = () => setSelectedItems(new Set());

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-[95vw] max-w-5xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-lg">Batch Preview</h3>
                        <span className="text-sm text-gray-500">
                            {selectedItems.size} of {items.length} selected
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('side-by-side')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'side-by-side' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                                    }`}
                            >
                                Side by Side
                            </button>
                            <button
                                onClick={() => setViewMode('overlay')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'overlay' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
                                    }`}
                            >
                                Overlay
                            </button>
                        </div>

                        {/* Selection Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                Select All
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                onClick={selectNone}
                                className="text-xs text-gray-500 hover:underline"
                            >
                                Clear
                            </button>
                        </div>

                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    {items.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No images to preview
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${items.length === 1 ? 'grid-cols-1' :
                            items.length === 2 ? 'grid-cols-2' :
                                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                            }`}>
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${selectedItems.has(item.id)
                                        ? 'border-indigo-500 shadow-lg'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    {/* Selection Indicator */}
                                    <div className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedItems.has(item.id)
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white/80 border border-gray-300'
                                        }`}>
                                        {selectedItems.has(item.id) && <CheckIcon className="w-4 h-4" />}
                                    </div>

                                    {viewMode === 'side-by-side' ? (
                                        <div className="flex">
                                            {/* Original */}
                                            <div className="flex-1 relative">
                                                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                    Original
                                                </div>
                                                <img
                                                    src={getImageUrl(item.originalUrl)}
                                                    alt="Original"
                                                    className="w-full aspect-square object-cover"
                                                />
                                            </div>
                                            {/* Processed */}
                                            <div className="flex-1 relative bg-[#e5e5f7]" style={{
                                                backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px)',
                                                backgroundSize: '10px 10px'
                                            }}>
                                                <div className="absolute top-2 left-2 bg-indigo-500/80 text-white text-xs px-2 py-1 rounded">
                                                    No Background
                                                </div>
                                                <img
                                                    src={getImageUrl(item.processedUrl)}
                                                    alt="Processed"
                                                    className="w-full aspect-square object-contain p-2"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative aspect-square group">
                                            {/* Original (background) */}
                                            <img
                                                src={getImageUrl(item.originalUrl)}
                                                alt="Original"
                                                className="absolute inset-0 w-full h-full object-cover transition-opacity group-hover:opacity-0"
                                            />
                                            {/* Processed (revealed on hover) */}
                                            <div className="absolute inset-0 bg-[#e5e5f7] opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{
                                                    backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px)',
                                                    backgroundSize: '10px 10px'
                                                }}
                                            >
                                                <img
                                                    src={getImageUrl(item.processedUrl)}
                                                    alt="Processed"
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            </div>
                                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                                Hover to compare
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Click on images to select/deselect
                    </p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onConfirm(Array.from(selectedItems))}
                            disabled={selectedItems.size === 0 || isLoading}
                            loading={isLoading}
                        >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Confirm {selectedItems.size > 0 && `(${selectedItems.size})`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
