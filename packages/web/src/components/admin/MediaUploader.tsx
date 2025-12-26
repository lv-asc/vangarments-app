
import React, { useRef, useState } from 'react';
import { TrashIcon, StarIcon, VideoCameraIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, Bars3Icon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { api, apiClient } from '@/lib/api';
import { Fragment, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MediaItem {
    url: string;
    isPrimary?: boolean;
    title?: string; // For videos
    type: 'image' | 'video';
    labelId?: string; // Add this
}

interface MediaLabel {
    id: string;
    name: string;
}

interface MediaUploaderProps {
    media: MediaItem[];
    onChange: (media: MediaItem[]) => void;
    type: 'image' | 'video';
    label?: string;
    helperText?: string;
}

interface SortableMediaItemProps {
    item: MediaItem;
    index: number;
    type: 'image' | 'video';
    getUrl: (url: string) => string;
    onRemove: (index: number) => void;
    onMakePrimary: (index: number) => void;
    onLabelChange: (index: number, labelId: string) => void;
    mediaLabels: MediaLabel[];
}

function SortableMediaItem({
    item,
    index,
    type,
    getUrl,
    onRemove,
    onMakePrimary,
    onLabelChange,
    mediaLabels
}: SortableMediaItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.url });

    const [labelQuery, setLabelQuery] = useState('');

    const filteredLabels =
        labelQuery === ''
            ? mediaLabels
            : mediaLabels.filter((label) =>
                label.name
                    ? label.name.toLowerCase().replace(/\s+/g, '').includes(labelQuery.toLowerCase().replace(/\s+/g, ''))
                    : false
            );

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative rounded-lg border-2 p-2 ${item.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-1 left-1 p-1 bg-white rounded shadow-sm cursor-grab active:cursor-grabbing z-10 hover:bg-gray-100"
                title="Drag to reorder"
            >
                <Bars3Icon className="h-4 w-4 text-gray-500" />
            </div>

            <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100 flex items-center justify-center mb-2">
                {type === 'image' ? (
                    <img
                        src={getUrl(item.url)}
                        alt={`Item ${index + 1}`}
                        className="object-contain w-full h-full"
                        onError={(e) => {
                            console.error('[MediaUploader] Image failed to load:', item.url);
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                    />
                ) : (
                    <video
                        src={getUrl(item.url)}
                        className="object-cover w-full h-full"
                        controls
                        onError={(e) => {
                            console.error('[MediaUploader] Video failed to load:', item.url);
                        }}
                    />
                )}
            </div>

            <div className="flex justify-between items-center gap-1">
                {item.isPrimary ? (
                    <span className="flex items-center text-xs font-semibold text-blue-600">
                        <StarSolidIcon className="h-3 w-3 mr-1" />
                        Primary
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => onMakePrimary(index)}
                        className="text-xs text-gray-500 hover:text-blue-600 font-medium flex items-center"
                    >
                        <StarIcon className="h-3 w-3 mr-1" />
                        Set Primary
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

            {/* Media Label Selection */}
            <div className="mt-2 pt-2 border-t border-gray-100">
                <Combobox value={item.labelId || ''} onChange={(val) => onLabelChange(index, val)}>
                    <div className="relative">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-xs">
                            <Combobox.Input
                                className="w-full border-none py-1.5 pl-2 pr-8 text-xs leading-5 text-gray-900 focus:ring-0 bg-gray-50 hover:bg-white transition-colors"
                                displayValue={(labelId: string) =>
                                    mediaLabels.find((l) => l.id === labelId)?.name || 'Select Label...'
                                }
                                onChange={(event) => setLabelQuery(event.target.value)}
                                placeholder="Search labels..."
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                    className="h-4 w-4 text-gray-400"
                                    aria-hidden="true"
                                />
                            </Combobox.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setLabelQuery('')}
                        >
                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-xs">
                                {filteredLabels.length === 0 && labelQuery !== '' ? (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 italic">
                                        Nothing found.
                                    </div>
                                ) : (
                                    <>
                                        <Combobox.Option
                                            key="none"
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-8 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                }`
                                            }
                                            value=""
                                        >
                                            {({ selected, active }) => (
                                                <>
                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                        None
                                                    </span>
                                                    {selected ? (
                                                        <span className={`absolute inset-y-0 left-0 flex items-center pl-2 ${active ? 'text-white' : 'text-blue-600'}`}>
                                                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </Combobox.Option>
                                        {filteredLabels.map((label) => (
                                            <Combobox.Option
                                                key={label.id}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none py-2 pl-8 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                                    }`
                                                }
                                                value={label.id}
                                            >
                                                {({ selected, active }) => (
                                                    <>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                            {label.name}
                                                        </span>
                                                        {selected ? (
                                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-2 ${active ? 'text-white' : 'text-blue-600'}`}>
                                                                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))}
                                    </>
                                )}
                            </Combobox.Options>
                        </Transition>
                    </div>
                </Combobox>
            </div>
        </div>
    );
}

export default function MediaUploader({
    media,
    onChange,
    type,
    label,
    helperText
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [mediaLabels, setMediaLabels] = useState<MediaLabel[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchLabels = async () => {
            try {
                const labels = await apiClient.getAllMediaLabels();
                setMediaLabels(labels || []);
            } catch (error) {
                console.error('Failed to fetch media labels:', error);
            }
        };
        fetchLabels();
    }, []);

    const getUrl = (url: string) => {
        if (!url) {
            console.warn('[MediaUploader] Empty URL provided');
            return '';
        }
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        if (url.startsWith('/api')) return url;

        // Normalize path: strip leading slash
        let path = url.startsWith('/') ? url.substring(1) : url;

        // Handle /storage prefix from backend
        if (path.startsWith('storage/')) {
            path = path.substring('storage/'.length);
        }

        const finalUrl = `/api/storage/${path}`;
        console.log('[MediaUploader] Converted URL:', { original: url, final: finalUrl });
        return finalUrl;
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const files = Array.from(e.target.files);
            const newMediaItems: MediaItem[] = [];

            for (const file of files) {
                // Validate type
                if (type === 'image' && !file.type.startsWith('image/')) {
                    toast.error(`File ${file.name} is not a valid image`);
                    continue;
                }
                if (type === 'video' && !file.type.startsWith('video/')) {
                    toast.error(`File ${file.name} is not a valid video`);
                    continue;
                }

                try {
                    const { url } = await api.uploadFile(file);
                    console.log('[MediaUploader] File uploaded:', { fileName: file.name, url });
                    newMediaItems.push({
                        url,
                        isPrimary: media.length === 0 && newMediaItems.length === 0, // Primary if list was empty
                        type
                    });
                } catch (err) {
                    console.error(`Failed to upload ${file.name}`, err);
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            if (newMediaItems.length > 0) {
                onChange([...media, ...newMediaItems]);
                toast.success(`${newMediaItems.length} ${type === 'image' ? 'Images' : 'Videos'} uploaded`);
            }

        } catch (error) {
            console.error(`Failed to upload ${type}`, error);
            toast.error(`Failed to upload ${type}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (index: number) => {
        const newMedia = [...media];
        newMedia.splice(index, 1);

        // If we removed the primary item, make the new first item primary
        if (media[index].isPrimary && newMedia.length > 0) {
            newMedia[0].isPrimary = true;
        }

        onChange(newMedia);
    };

    const handleMakePrimary = (index: number) => {
        if (index === 0 && media[0].isPrimary) return;

        const newMedia = media.map((item, i) => ({
            ...item,
            isPrimary: i === index
        }));

        onChange(newMedia);
    };

    const handleLabelChange = (index: number, labelId: string) => {
        const newMedia = [...media];
        newMedia[index] = { ...newMedia[index], labelId };
        onChange(newMedia);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = media.findIndex(item => item.url === active.id);
            const newIndex = media.findIndex(item => item.url === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newMedia = arrayMove(media, oldIndex, newIndex);
                onChange(newMedia);
                toast.success('Media reordered');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                    {label || (type === 'image' ? 'Images' : 'Videos')}
                </label>
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple // Allow multiple files
                        accept={type === 'image' ? "image/*" : "video/*"}
                        onChange={handleUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        disabled={uploading}
                        className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${uploading ? 'opacity-75 cursor-wait' : ''
                            }`}
                    >
                        {uploading ? 'Uploading...' : `Upload ${type === 'image' ? 'Image' : 'Video'}`}
                    </button>
                </div>
            </div>

            {media.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={media.map(item => item.url)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {media.map((item, index) => (
                                <SortableMediaItem
                                    key={item.url}
                                    item={item}
                                    index={index}
                                    type={type}
                                    getUrl={getUrl}
                                    onRemove={handleRemove}
                                    onMakePrimary={handleMakePrimary}
                                    onLabelChange={handleLabelChange}
                                    mediaLabels={mediaLabels}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    {type === 'image' ? (
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    ) : (
                        <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <p className="mt-2 text-sm text-gray-500">No {type}s uploaded</p>
                </div>
            )}

            {helperText && (
                <p className="text-xs text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
}
