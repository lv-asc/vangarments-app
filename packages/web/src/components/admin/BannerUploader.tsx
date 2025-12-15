import React, { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Reuse LogoItem interface for now, might rename to ImageItem if generalized
export interface BannerItem {
    url: string;
    positionY?: number; // 0 to 100 percentage
}

interface BannerUploaderProps {
    banners: BannerItem[];
    onChange: (banners: BannerItem[]) => void;
    label?: string;
    buttonLabel?: string;
    emptyStateMessage?: string;
    helperText?: string;
}

interface SortableBannerItemProps {
    banner: BannerItem;
    index: number;
    getImageUrl: (url: string) => string;
    onRemove: (index: number) => void;
    onMakeMain: (index: number) => void;
    onUpdatePosition: (index: number, positionY: number) => void;
}

function SortableBannerItem({ banner, index, getImageUrl, onRemove, onMakeMain, onUpdatePosition }: SortableBannerItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: banner.url });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const positionY = banner.positionY ?? 50;
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRepositioning, setIsRepositioning] = useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsRepositioning(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isRepositioning || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        // Calculate relative Y position within the container
        // We want to map mouse movement to position percentage
        // Default scroll factor 
        const scrollFactor = 1.5; // Adjust sensitivity
        const deltaY = e.movementY * scrollFactor;

        // Note: object-position percentage works inversely for the "viewing window" concept slightly.
        // If position is 0%, top of image aligns with top of container. 
        // If 100%, bottom of image aligns with bottom of container.
        // Dragging UP should reveal lower parts of image (increase %).
        // Dragging DOWN should reveal upper parts of image (decrease %).

        // Let's stick to direct object-position mapping:
        // dragging down (positive dy) -> want to see top -> decrease %
        // dragging up (negative dy) -> want to see bottom -> increase %

        let newPos = positionY - (deltaY / rect.height) * 100;
        newPos = Math.max(0, Math.min(100, newPos));

        onUpdatePosition(index, newPos);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsRepositioning(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative rounded-lg border-2 p-2 group bg-white flex flex-col gap-2 ${index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
        >
            <div
                ref={containerRef}
                className={`aspect-[4/1] relative overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${isRepositioning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <img
                    ref={imageRef}
                    src={getImageUrl(banner.url)}
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full pointer-events-none select-none"
                    style={{ objectFit: 'cover', objectPosition: `center ${positionY}%` }}
                    draggable={false}
                />

                {/* Visual indicator for drag */}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isRepositioning ? 'opacity-0' : ''}`}>
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        Drag vertically to adjust
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    {/* Drag Handle for Reordering */}
                    <button
                        type="button"
                        className="cursor-move text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                        {...attributes}
                        {...listeners}
                        title="Drag to reorder"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </button>

                    {index === 0 ? (
                        <span className="flex items-center text-xs font-semibold text-blue-600 ml-1">
                            <StarIcon className="h-3 w-3 mr-1" />
                            Main
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onMakeMain(index)}
                            className="text-xs text-gray-500 hover:text-blue-600 font-medium ml-1"
                        >
                            Make Main
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-gray-400 hover:text-red-500"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BannerUploader({
    banners,
    onChange,
    label = "Brand Banners",
    buttonLabel = "Upload Banner(s)",
    emptyStateMessage = "No banners uploaded yet",
    helperText = "The first banner (highlighted) is the main brand banner. Use the handle to reorder."
}: BannerUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

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

    const getImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        // Fix for double /api if simple path
        if (url.startsWith('/api') && !url.includes('/api/storage')) return url;

        let path = url.startsWith('/') ? url.substring(1) : url;
        if (path.startsWith('storage/')) {
            path = path.substring('storage/'.length);
        }
        return `/api/storage/${path}`;
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const files = Array.from(e.target.files);
            const uploadPromises = files.map(file => api.uploadFile(file));
            const results = await Promise.all(uploadPromises);

            const newItems: BannerItem[] = results.map(r => ({
                url: r.url,
                positionY: 50 // Default center
            }));

            onChange([...banners, ...newItems]);
            toast.success(`${files.length} banner(s) uploaded`);
        } catch (error) {
            console.error('Failed to upload banner', error);
            toast.error('Failed to upload banner(s)');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (index: number) => {
        const newBanners = [...banners];
        newBanners.splice(index, 1);
        onChange(newBanners);
    };

    const handleMakeMain = (index: number) => {
        if (index === 0) return;
        const newBanners = [...banners];
        const [movedBanner] = newBanners.splice(index, 1);
        newBanners.unshift(movedBanner);
        onChange(newBanners);
    };

    const handleUpdatePosition = (index: number, positionY: number) => {
        const newBanners = [...banners];
        newBanners[index] = { ...newBanners[index], positionY };
        onChange(newBanners);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = banners.findIndex(b => b.url === active.id);
            const newIndex = banners.findIndex(b => b.url === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onChange(arrayMove(banners, oldIndex, newIndex));
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        disabled={uploading}
                        className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {uploading ? 'Uploading...' : buttonLabel}
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={banners.map(b => b.url)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 gap-4">
                        {banners.map((banner, index) => (
                            <SortableBannerItem
                                key={banner.url}
                                banner={banner}
                                index={index}
                                getImageUrl={getImageUrl}
                                onRemove={handleRemove}
                                onMakeMain={handleMakeMain}
                                onUpdatePosition={handleUpdatePosition}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {banners.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    {emptyStateMessage}
                </div>
            )}

            <p className="text-xs text-gray-500">
                {helperText}
                <br />
                Proposed size: 1200x300px (4:1 ratio).
            </p>
        </div>
    );
}
