import React from 'react';
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
import { TrashIcon, StarIcon, CameraIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '@/utils/imageUrl';

const AnyDndContext = DndContext as any;
const AnySortableContext = SortableContext as any;

interface SortableImageItemProps {
    url: string;
    index: number;
    onRemove: (index: number) => void;
    onMakeMain: (index: number) => void;
    onEdit?: (index: number) => void;
    aspectRatio?: string;
}

function SortableImageItem({ url, index, onRemove, onMakeMain, onEdit, aspectRatio = "aspect-square" }: SortableImageItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: url });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative rounded-lg border-2 p-1 group bg-white flex flex-col gap-1 ${index === 0 ? 'border-[#00132d] bg-[#00132d]/5' : 'border-gray-200'
                }`}
        >
            <div className={`relative ${aspectRatio} overflow-hidden rounded-md bg-gray-100`}>
                <img
                    src={getImageUrl(url)}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remove image"
                    >
                        <TrashIcon className="h-4 w-4 text-white" />
                    </button>
                    {index !== 0 && (
                        <button
                            type="button"
                            onClick={() => onMakeMain(index)}
                            className="p-2 bg-white text-[#00132d] rounded-full hover:bg-gray-100 transition-colors"
                            title="Make Main"
                        >
                            <StarIcon className="h-4 w-4" />
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(index)}
                            className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            title="Edit image"
                        >
                            <CameraIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Drag Handle */}
                <div
                    className="absolute top-1 left-1 p-1 bg-white/80 rounded shadow-sm cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                    {...attributes}
                    {...listeners}
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>

                {index === 0 && (
                    <div className="absolute top-1 right-1 bg-[#00132d] text-[#fff7d7] text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Main
                    </div>
                )}
            </div>
        </div>
    );
}

interface SortableImageGridProps {
    images: string[];
    onOrderChange: (images: string[]) => void;
    onAddImage: () => void;
    onRemoveImage: (index: number) => void;
    onEditImage?: (url: string) => void;
    maxImages?: number;
    aspectRatio?: string;
    columns?: number;
    helperText?: string;
}

export function SortableImageGrid({
    images,
    onOrderChange,
    onAddImage,
    onRemoveImage,
    onEditImage,
    maxImages = 5,
    aspectRatio = "aspect-square",
    columns = 5,
    helperText = "Drag and drop to reorder. The first photo is the main one."
}: SortableImageGridProps) {
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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = images.indexOf(active.id as string);
            const newIndex = images.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                onOrderChange(arrayMove(images, oldIndex, newIndex));
            }
        }
    };

    const handleMakeMain = (index: number) => {
        const newImages = [...images];
        const [moved] = newImages.splice(index, 1);
        newImages.unshift(moved);
        onOrderChange(newImages);
    };

    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5'
    }[columns] || 'grid-cols-5';

    return (
        <div className="space-y-3">
            <AnyDndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <AnySortableContext
                    items={images}
                    strategy={rectSortingStrategy}
                >
                    <div className={`grid ${gridCols} gap-4`}>
                        {images.map((url, index) => (
                            <SortableImageItem
                                key={url}
                                url={url}
                                index={index}
                                onRemove={onRemoveImage}
                                onMakeMain={handleMakeMain}
                                onEdit={onEditImage ? () => onEditImage(url) : undefined}
                                aspectRatio={aspectRatio}
                            />
                        ))}

                        {images.length < maxImages && (
                            <button
                                type="button"
                                onClick={onAddImage}
                                className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg ${aspectRatio} hover:border-[#00132d] hover:bg-gray-50 transition-all text-gray-500 hover:text-[#00132d]`}
                            >
                                <CameraIcon className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-medium uppercase">Add Photo</span>
                            </button>
                        )}
                    </div>
                </AnySortableContext>
            </AnyDndContext>
            {images.length > 0 && (
                <p className="text-[10px] text-gray-500 italic">
                    {helperText}
                </p>
            )}
        </div>
    );
}
