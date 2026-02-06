'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
    CloudArrowUpIcon,
    XMarkIcon,
    PhotoIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import type { ItemCountResponse } from '@/lib/anteroomApi';

interface AnteroomUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => Promise<void>;
    itemCount: ItemCountResponse;
    isUploading?: boolean;
}

/**
 * AnteroomUploadModal - Batch upload interface for anteroom items
 * Enforces 10 items per batch and shows remaining capacity
 */
export function AnteroomUploadModal({
    isOpen,
    onClose,
    onUpload,
    itemCount,
    isUploading = false,
}: AnteroomUploadModalProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const maxBatch = itemCount.limits?.MAX_BATCH_UPLOAD || 10;
    const effectiveMax = Math.min(maxBatch, itemCount.available);
    const canUpload = itemCount.available > 0;

    // Handle file selection
    const handleFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

        // Enforce batch limit
        const limitedFiles = imageFiles.slice(0, effectiveMax - selectedFiles.length);

        if (limitedFiles.length < imageFiles.length) {
            toast.error(`Only ${effectiveMax} images can be uploaded. Some files were not added.`);
        }

        // Create previews
        const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));

        setSelectedFiles(prev => [...prev, ...limitedFiles].slice(0, effectiveMax));
        setPreviews(prev => [...prev, ...newPreviews].slice(0, effectiveMax));
    }, [effectiveMax, selectedFiles.length]);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    // Remove a file
    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Handle upload
    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        await onUpload(selectedFiles);
        // Clear after successful upload
        previews.forEach(p => URL.revokeObjectURL(p));
        setSelectedFiles([]);
        setPreviews([]);
    };

    // Cleanup on close
    const handleClose = () => {
        previews.forEach(p => URL.revokeObjectURL(p));
        setSelectedFiles([]);
        setPreviews([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add Items to Anteroom</h2>
                        <p className="text-sm text-gray-500">
                            Upload up to {effectiveMax} images at once ({itemCount.current}/{itemCount.max} items used)
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!canUpload ? (
                        /* Limit Reached Warning */
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ExclamationCircleIcon className="w-16 h-16 text-amber-500 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Anteroom is Full
                            </h3>
                            <p className="text-gray-600 max-w-sm">
                                You have reached the maximum of {itemCount.max} items.
                                Complete or remove some items to make room for new ones.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Drop Zone */}
                            <div
                                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${dragActive
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }
                `}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                />

                                <CloudArrowUpIcon className={`
                  w-12 h-12 mx-auto mb-4
                  ${dragActive ? 'text-indigo-500' : 'text-gray-400'}
                `} />

                                <p className="text-lg font-medium text-gray-700 mb-1">
                                    {dragActive ? 'Drop images here' : 'Drag & drop images here'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    or click to browse (max {effectiveMax} images)
                                </p>
                            </div>

                            {/* Preview Grid */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-900">
                                            Selected: {selectedFiles.length} / {effectiveMax}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                previews.forEach(p => URL.revokeObjectURL(p));
                                                setSelectedFiles([]);
                                                setPreviews([]);
                                            }}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Clear all
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-5 gap-3">
                                        {previews.map((preview, index) => (
                                            <div
                                                key={index}
                                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                                            >
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add more button */}
                                        {selectedFiles.length < effectiveMax && (
                                            <button
                                                onClick={() => inputRef.current?.click()}
                                                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                                            >
                                                <PhotoIcon className="w-8 h-8 mb-1" />
                                                <span className="text-xs">Add more</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Capacity Indicator */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">Anteroom Capacity</span>
                                    <span className="font-medium text-gray-900">
                                        {itemCount.current + selectedFiles.length} / {itemCount.max}
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${(itemCount.current + selectedFiles.length) / itemCount.max > 0.9
                                            ? 'bg-red-500'
                                            : (itemCount.current + selectedFiles.length) / itemCount.max > 0.7
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                            }`}
                                        style={{
                                            width: `${((itemCount.current + selectedFiles.length) / itemCount.max) * 100}%`
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Items expire after 14 days if not completed
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {canUpload && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Uploading...
                                </>
                            ) : (
                                `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'item' : 'items'}`
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnteroomUploadModal;
