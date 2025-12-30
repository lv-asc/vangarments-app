import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { TrashIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { processImageFiles } from '@/utils/heicConverter';

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

const AnyDndContext = DndContext as any;
const AnySortableContext = SortableContext as any;

export interface LogoItem {
    url: string;
    name: string;
}

interface LogoUploaderProps {
    logos: (LogoItem | string)[];
    onChange: (logos: any[]) => void; // Accepts generic array to support string[] or LogoItem[]
    label?: string;
    buttonLabel?: string;
    emptyStateMessage?: string;
    helperText?: string;
    showNameInput?: boolean;
    itemLabel?: string;
}

interface SortableLogoItemProps {
    logo: LogoItem;
    index: number;
    getImageUrl: (url: string) => string;
    onRemove: (index: number) => void;
    onMakeMain: (index: number) => void;
    onNameChange: (index: number, name: string) => void;
    showNameInput: boolean;
    itemLabel: string;
}

function SortableLogoItem({
    logo,
    index,
    getImageUrl,
    onRemove,
    onMakeMain,
    onNameChange,
    showNameInput,
    itemLabel
}: SortableLogoItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: logo.url || `item-${index}` });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const extension = logo.url?.split('.').pop()?.toLowerCase() || '';

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
                    alt={`${itemLabel} ${index + 1}`}
                    className="object-contain w-full h-full pointer-events-none"
                />
            </div>

            <div className="flex flex-col gap-1">
                {showNameInput && (
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={logo.name}
                            onChange={(e) => onNameChange(index, e.target.value)}
                            placeholder={`${itemLabel} Name`}
                            className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
                            onPointerDown={handleInputPointerDown}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-100 px-1 rounded">
                            {extension}
                        </span>
                    </div>
                )}
                {!showNameInput && (
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-medium text-gray-500">{itemLabel} {index + 1}</span>
                        <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-100 px-1 rounded">
                            {extension}
                        </span>
                    </div>
                )}
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
    helperText = "The first image is the main one. Drag to reorder.",
    showNameInput = true,
    itemLabel = "Logo"
}: LogoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Normalize input to LogoItem[]
    const normalizedLogos: LogoItem[] = logos.map(l => {
        if (typeof l === 'string') {
            return { url: l, name: '' };
        }
        return l;
    });

    const isStringArray = logos.length > 0 && typeof logos[0] === 'string';

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

    const emitChange = (newItems: LogoItem[]) => {
        if (isStringArray) {
            onChange(newItems.map(item => item.url));
        } else {
            onChange(newItems);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            let files = Array.from(e.target.files);

            // Convert HEIC files to JPEG
            files = await processImageFiles(files);

            const uploadPromises = files.map(file => api.uploadFile(file));
            const results = await Promise.all(uploadPromises);

            // Create new logo items
            const newItems: LogoItem[] = results.map(r => ({
                url: r.url,
                name: ''
            }));

            // Merge with existing normalized logos
            const updatedList = [...normalizedLogos, ...newItems];

            // Check if we started with strings or objects (e.g. empty array initially, assume objects unless prop says otherwise? 
            // Actually, if generic, we should infer or check props. 
            // Determine return type based on current input type or a prop?
            // If empty, we can't infer. But let's assume if we receive string[], we return string[].
            // If logos is empty, we default to LogoItem[] (standard behavior) UNLESS we change logic.
            // But wait, LookbookManagement passes `formData.images` which is `string[]`.
            // If it's empty `[]`, `isStringArray` is false.
            // Then it returns objects `[{url, name}]`.
            // But `LookbookManagement` expects `string[]`.
            // FIX: If the input array is empty, this heuristic fails.
            // However, `LookbookManagement` uses `handleImagesChange` which just sets state. 
            // If it receives objects, `formData.images` becomes object array.
            // But `LookbookManagement` defines `images: [] as string[]`.
            // So Typescript might complain, or runtime is fine.
            // To be safe: we should probably always return what was passed, OR simpler:
            // Just return objects if names are supported, strings if not? No.
            // Let's add better detection. 
            // Best bet: If `logos` contains strings, return strings. 
            // If `logos` is empty, check `showNameInput`. If `false`, likely treating as simple images -> return strings?
            // Or just check if the parent component provided a specific type.
            // Let's keep `emitChange` logic but refine:
            // If `logos` was empty, we need to know what to return.
            // Maybe just check `normalizedLogos`? No.

            // Let's rely on `onChange` to handle `any[]`.
            // But we need to be consistent. 
            // HACK: If `logos` is empty, check `showNameInput`. If `false` (Lookbook), return strings. If `true` (Brand Logos), return objects.

            let shouldReturnStrings = isStringArray;
            if (logos.length === 0 && !showNameInput) {
                shouldReturnStrings = true;
            }

            if (shouldReturnStrings) {
                onChange(updatedList.map(i => i.url));
            } else {
                onChange(updatedList);
            }

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
        const newItems = [...normalizedLogos];
        newItems.splice(index, 1);
        emitChange(newItems);
    };

    const handleMakeMain = (index: number) => {
        if (index === 0) return;
        const newItems = [...normalizedLogos];
        const [movedItem] = newItems.splice(index, 1);
        newItems.unshift(movedItem);
        emitChange(newItems);
    };

    const handleNameChange = (index: number, name: string) => {
        const newItems = [...normalizedLogos];
        newItems[index] = { ...newItems[index], name };
        emitChange(newItems);
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = normalizedLogos.findIndex(l => (l.url || `item-${normalizedLogos.indexOf(l)}`) === active.id);
            const newIndex = normalizedLogos.findIndex(l => (l.url || `item-${normalizedLogos.indexOf(l)}`) === over.id);

            // Fallback for ID matching if URL is issue
            // Re-calc using index directly if needed? No, dnd-kit uses IDs.
            // The IDs in `SortableLogoItem` use `logo.url || item-${index}`.
            // Need to match that logic. 
            // `SortableContext` needs items with same IDs.

            if (oldIndex !== -1 && newIndex !== -1) {
                emitChange(arrayMove(normalizedLogos, oldIndex, newIndex));
            }
        }
    };

    // Sortable context needs consistent IDs
    const itemIds = normalizedLogos.map((l, idx) => l.url || `item-${idx}`);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        onChange={handleUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        disabled={uploading}
                        className={`inline-flex items-center px-3 py-2 border border-blue-600 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {uploading ? 'Uploading...' : buttonLabel}
                    </button>
                </div>
            </div>

            <AnyDndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <AnySortableContext
                    items={logos.length > 0 && typeof logos[0] !== 'string'
                        ? (logos as LogoItem[]).map(l => l.url)
                        : logos.map((l, i) => `${l}-${i}`) // Fallback for strings
                    }
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {normalizedLogos.map((logo, index) => (
                            <SortableLogoItem
                                key={logo.url || `item-${index}`}
                                logo={logo}
                                index={index}
                                getImageUrl={getImageUrl}
                                onRemove={handleRemove}
                                onMakeMain={handleMakeMain}
                                onNameChange={handleNameChange}
                                showNameInput={showNameInput}
                                itemLabel={itemLabel}
                            />
                        ))}
                    </div>
                </AnySortableContext>
            </AnyDndContext>

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
