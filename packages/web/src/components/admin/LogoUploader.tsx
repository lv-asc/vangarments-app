import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
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

export interface LogoItem {
    url: string;
    name: string;
}

interface LogoUploaderProps {
    logos: LogoItem[];
    onChange: (logos: LogoItem[]) => void;
    label?: string;
    buttonLabel?: string;
    emptyStateMessage?: string;
    helperText?: string;
}

interface SortableLogoItemProps {
    logo: LogoItem;
    index: number;
    getImageUrl: (url: string) => string;
    onRemove: (index: number) => void;
    onMakeMain: (index: number) => void;
    onNameChange: (index: number, name: string) => void;
}

function SortableLogoItem({ logo, index, getImageUrl, onRemove, onMakeMain, onNameChange }: SortableLogoItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: logo.url });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const extension = logo.url.split('.').pop()?.toLowerCase() || '';

    // Prevent drag on input
    const handleInputPointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative rounded-lg border-2 p-3 group bg-white flex flex-col gap-2 ${index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
        >
            <div
                className="aspect-square relative overflow-hidden rounded-md bg-gray-100 flex items-center justify-center cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <img
                    src={getImageUrl(logo.url)}
                    alt={`Logo ${index + 1}`}
                    className="object-contain w-full h-full pointer-events-none"
                />
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={logo.name}
                        onChange={(e) => onNameChange(index, e.target.value)}
                        placeholder="Logo Name"
                        className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
                        onPointerDown={handleInputPointerDown}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                    <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-100 px-1 rounded">
                        {extension}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-100">
                {index === 0 ? (
                    <span className="flex items-center text-xs font-semibold text-blue-600">
                        <StarIcon className="h-3 w-3 mr-1" />
                        Main
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => onMakeMain(index)}
                        className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                    >
                        Make Main
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-gray-400 hover:text-red-500"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function LogoUploader({
    logos,
    onChange,
    label = "Brand Logos",
    buttonLabel = "Upload Logo(s)",
    emptyStateMessage = "No logos uploaded yet",
    helperText = "The first logo (highlighted) is the main brand logo. Drag to reorder. Name your logos."
}: LogoUploaderProps) {
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
        if (url.startsWith('/api')) return url;
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

            // Create new logo items with empty names initially
            const newItems: LogoItem[] = results.map(r => ({
                url: r.url,
                name: ''
            }));

            onChange([...logos, ...newItems]);
            toast.success(`${files.length} image(s) uploaded`);
        } catch (error) {
            console.error('Failed to upload image', error);
            toast.error('Failed to upload image(s)');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (index: number) => {
        const newLogos = [...logos];
        newLogos.splice(index, 1);
        onChange(newLogos);
    };

    const handleMakeMain = (index: number) => {
        if (index === 0) return;
        const newLogos = [...logos];
        const [movedLogo] = newLogos.splice(index, 1);
        newLogos.unshift(movedLogo);
        onChange(newLogos);
    };

    const handleNameChange = (index: number, name: string) => {
        const newLogos = [...logos];
        newLogos[index] = { ...newLogos[index], name };
        onChange(newLogos);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = logos.findIndex(l => l.url === active.id);
            const newIndex = logos.findIndex(l => l.url === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onChange(arrayMove(logos, oldIndex, newIndex));
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
                    items={logos.map(l => l.url)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {logos.map((logo, index) => (
                            <SortableLogoItem
                                key={logo.url}
                                logo={logo}
                                index={index}
                                getImageUrl={getImageUrl}
                                onRemove={handleRemove}
                                onMakeMain={handleMakeMain}
                                onNameChange={handleNameChange}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {logos.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    {emptyStateMessage}
                </div>
            )}

            <p className="text-xs text-gray-500">
                {helperText}
            </p>
        </div>
    );
}
