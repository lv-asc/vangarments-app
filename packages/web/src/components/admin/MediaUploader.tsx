
import React, { useRef, useState } from 'react';
import { TrashIcon, StarIcon, VideoCameraIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface MediaItem {
    url: string;
    isPrimary?: boolean;
    title?: string; // For videos
    type: 'image' | 'video';
}

interface MediaUploaderProps {
    media: MediaItem[];
    onChange: (media: MediaItem[]) => void;
    type: 'image' | 'video';
    label?: string;
    helperText?: string;
}

export default function MediaUploader({
    media,
    onChange,
    type,
    label,
    helperText
}: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        if (url.startsWith('/api')) return url;

        // Normalize path: strip leading slash
        let path = url.startsWith('/') ? url.substring(1) : url;

        // Handle /storage prefix from backend
        if (path.startsWith('storage/')) {
            path = path.substring('storage/'.length);
        }

        return `/api/storage/${path}`;
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];

            // Validate type
            if (type === 'image' && !file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            if (type === 'video' && !file.type.startsWith('video/')) {
                toast.error('Please upload a video file');
                return;
            }

            const { url } = await api.uploadFile(file);

            // Add to media list
            onChange([...media, { url, isPrimary: media.length === 0, type }]); // Make first item primary by default
            toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded`);
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

        // Sort to put primary first
        // const primaryItem = newMedia[index];
        // newMedia.splice(index, 1);
        // newMedia.unshift(primaryItem);

        onChange(newMedia);
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
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {media.map((item, index) => (
                        <div
                            key={`${item.url}-${index}`}
                            className={`relative rounded-lg border-2 p-2 ${item.isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                        >
                            <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100 flex items-center justify-center mb-2">
                                {type === 'image' ? (
                                    <img
                                        src={getUrl(item.url)}
                                        alt={`Item ${index + 1}`}
                                        className="object-contain w-full h-full"
                                    />
                                ) : (
                                    <video
                                        src={getUrl(item.url)}
                                        className="object-cover w-full h-full"
                                        controls
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
                                        onClick={() => handleMakePrimary(index)}
                                        className="text-xs text-gray-500 hover:text-blue-600 font-medium flex items-center"
                                    >
                                        <StarIcon className="h-3 w-3 mr-1" />
                                        Set Primary
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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
