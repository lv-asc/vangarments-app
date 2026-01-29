
import React, { useRef, useState } from 'react';
import { TrashIcon, StarIcon, VideoCameraIcon, PhotoIcon, TagIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, Bars3Icon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { api, apiClient } from '@/lib/api';
import { Fragment, useEffect } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { processImageFiles } from '@/utils/heicConverter';
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
    id?: string; // Database ID for linking
    url: string;
    isPrimary?: boolean;
    title?: string; // For videos
    type: 'image' | 'video';
    imageType?: string; // Was labelId, mapped to backend imageType
    originalImageId?: string; // For background_removed images, links to parent
    aiAnalysis?: { originalImageId?: string }; // Alternative location for originalImageId
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
    onTagImage?: (imageUrl: string, index: number) => void;
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
    onTagImage?: (imageUrl: string, index: number) => void;
    isSelected: boolean;
    onToggleSelection: (url: string) => void;
    selectionMode: boolean;
    hasNoBgVersion?: boolean; // Indicates if this image has a linked no-BG version
}

function SortableMediaItem({
    item,
    index,
    type,
    getUrl,
    onRemove,
    onMakePrimary,
    onLabelChange,
    mediaLabels,
    onTagImage,
    isSelected,
    onToggleSelection,
    selectionMode,
    hasNoBgVersion
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
            {/* Selection Checkbox */}
            <div className={`absolute top-1 right-1 z-10 ${selectionMode || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(item.url)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                />
            </div>

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
                {/* No-BG Version Indicator */}
                {hasNoBgVersion && (
                    <div className="absolute bottom-1 right-1 z-10" title="Background-removed version available">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded shadow-sm">
                            BG ✓
                        </span>
                    </div>
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
                {type === 'image' && onTagImage && (
                    <button
                        type="button"
                        onClick={() => onTagImage(item.url, index)}
                        className="text-gray-400 hover:text-blue-500"
                        title="Tag people & entities"
                    >
                        <TagIcon className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Media Label Selection */}
            <div className="mt-2 pt-2 border-t border-gray-100">
                <Combobox value={item.imageType || ''} onChange={(val) => onLabelChange(index, val)}>
                    <div className="relative">
                        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-xs">
                            <Combobox.Input
                                className="w-full border-none py-1.5 pl-2 pr-8 text-xs leading-5 text-gray-900 focus:ring-0 bg-gray-50 hover:bg-white transition-colors placeholder:text-gray-400"
                                displayValue={(labelId: string) =>
                                    mediaLabels.find((l) => l.id === labelId)?.name || ''
                                }
                                onChange={(event) => setLabelQuery(event.target.value)}
                                placeholder="Select Label..."
                                autoComplete="off"
                            />
                            <Combobox.Button className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-end pr-2 cursor-text">
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
    helperText,
    onTagImage
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [mediaLabels, setMediaLabels] = useState<MediaLabel[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
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
                // Inject 'Measurements' label if not present
                const hasMeasurements = labels.some((l: any) => l.name === 'Measurements');
                if (!hasMeasurements && labels) {
                    labels.push({ id: 'measurements', name: 'Measurements' }); // Use lowercase ID 'measurements' to match backend enums
                }
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

        // Handle data URLs and API paths directly
        if (url.startsWith('data:')) return url;
        if (url.startsWith('/api')) return url;

        // Strip backend domain from full URLs to enable Next.js proxy
        let path = url;
        if (path.includes('localhost:3001') || path.includes('localhost:3000')) {
            // Remove the domain part
            path = path
                .replace(/https?:\/\/localhost:3001\/api\/v1/g, '')
                .replace(/https?:\/\/localhost:3001/g, '')
                .replace(/https?:\/\/localhost:3000/g, '');
        }

        // Clean up leading slashes
        while (path.startsWith('/')) {
            path = path.substring(1);
        }

        // Handle /storage prefix from backend
        if (path.startsWith('storage/')) {
            path = path.substring('storage/'.length);
        }

        // Final URL should use /storage prefix to match next.config.js rewrites
        const finalUrl = `/storage/${path}`;

        return finalUrl;
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            let files = Array.from(e.target.files);
            const newMediaItems: MediaItem[] = [];

            // Convert HEIC files to JPEG if type is image
            if (type === 'image') {
                files = await processImageFiles(files);
            }

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
                } catch (err: any) {
                    console.error(`Failed to upload ${file.name}`, err);

                    if (err?.status === 401 || err?.status === 403) {
                        toast.error('Session expired. Please refresh/login.');
                        // Stop uploading other files if session is dead
                        throw err;
                    }
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            if (newMediaItems.length > 0) {
                onChange([...media, ...newMediaItems]);
                toast.success(`${newMediaItems.length} ${type === 'image' ? 'Images' : 'Videos'} uploaded`);
            }

        } catch (error: any) {
            console.error(`Failed to upload ${type}`, error);

            if (error?.status === 401 || error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('401')) {
                toast.error('Session expired. Please refresh the page or login again.');
            } else {
                toast.error(`Failed to upload ${type}: ${error.message || 'Unknown error'}`);
            }
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

    const handleLabelChange = (index: number, imageType: string) => {
        const newMedia = [...media];
        newMedia[index] = { ...newMedia[index], imageType };
        onChange(newMedia);
    };

    const handleToggleSelection = (url: string) => {
        const newSelected = new Set(selectedUrls);
        if (newSelected.has(url)) {
            newSelected.delete(url);
        } else {
            newSelected.add(url);
        }
        setSelectedUrls(newSelected);
    };

    const handleBulkLabel = (imageType: string) => {
        if (selectedUrls.size === 0) return;
        const newMedia = media.map(item => {
            if (selectedUrls.has(item.url)) {
                return { ...item, imageType };
            }
            return item;
        });
        onChange(newMedia);
        setSelectedUrls(new Set()); // Clear selection after action
        toast.success(`Label applied to ${selectedUrls.size} items`);
    };

    const handleBulkDelete = () => {
        if (selectedUrls.size === 0) return;
        const newMedia = media.filter(item => !selectedUrls.has(item.url));

        // Ensure primary consistency
        if (newMedia.length > 0 && !newMedia.some(m => m.isPrimary)) {
            newMedia[0].isPrimary = true;
        }

        onChange(newMedia);
        setSelectedUrls(new Set());
        toast.success(`${selectedUrls.size} items removed`);
    };

    const handleDeselectAll = () => {
        setSelectedUrls(new Set());
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
                        accept={type === 'image' ? "image/*,.heic,.heif" : "video/*"}
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

            {/* Bulk Actions Bar */}
            {selectedUrls.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in mb-4">
                    <span className="text-sm font-medium text-blue-900">{selectedUrls.size} selected</span>

                    <div className="h-4 w-px bg-blue-200" />

                    <Combobox value="" onChange={handleBulkLabel}>
                        <div className="relative w-48">
                            <Combobox.Input
                                className="w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 shadow-sm ring-1 ring-inset ring-blue-200 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-xs sm:leading-6 bg-white placeholder:text-blue-400"
                                placeholder="Apply Label to Selected..."
                                displayValue={() => ''}
                                autoComplete="off"
                            />
                            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {mediaLabels.map((label) => (
                                    <Combobox.Option
                                        key={label.id}
                                        value={label.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`
                                        }
                                    >
                                        <span className="block truncate">{label.name}</span>
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </div>
                    </Combobox>

                    <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                        Deselect All
                    </button>

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={handleBulkDelete}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 rounded text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                    >
                        <TrashIcon className="h-3 w-3" />
                        Delete Selected
                    </button>
                </div>
            )}

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
                            {/* Filter out background_removed images - they appear as indicators on their parent */}
                            {media
                                .filter(item => item.imageType !== 'background_removed')
                                .map((item, index) => {
                                    // Find if this item has a linked no-BG version
                                    const hasNoBgVersion = media.some(m =>
                                        m.imageType === 'background_removed' &&
                                        (m.originalImageId === item.id || m.aiAnalysis?.originalImageId === item.id)
                                    );
                                    return (
                                        <SortableMediaItem
                                            key={item.url}
                                            item={item}
                                            index={media.indexOf(item)} // Use real index for operations
                                            type={type}
                                            getUrl={getUrl}
                                            onRemove={handleRemove}
                                            onMakePrimary={handleMakePrimary}
                                            onLabelChange={handleLabelChange}
                                            mediaLabels={mediaLabels}
                                            onTagImage={onTagImage}
                                            isSelected={selectedUrls.has(item.url)}
                                            onToggleSelection={handleToggleSelection}
                                            selectionMode={selectedUrls.size > 0}
                                            hasNoBgVersion={hasNoBgVersion}
                                        />
                                    );
                                })}
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
