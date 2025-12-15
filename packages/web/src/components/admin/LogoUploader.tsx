
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { TrashIcon, ArrowUpIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface LogoUploaderProps {
    logos: string[];
    onChange: (logos: string[]) => void;
}

export default function LogoUploader({ logos, onChange }: LogoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const getImageUrl = (url: string) => {
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
            const { url } = await api.uploadFile(file);

            // Add to logos
            onChange([...logos, url]);
            toast.success('Logo uploaded');
        } catch (error) {
            console.error('Failed to upload logo', error);
            toast.error('Failed to upload logo');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleRemove = (index: number) => {
        const newLogos = [...logos];
        newLogos.splice(index, 1);
        onChange(newLogos);
    };

    const handleMakeMain = (index: number) => {
        if (index === 0) return; // Already main
        const newLogos = [...logos];
        const [movedLogo] = newLogos.splice(index, 1);
        newLogos.unshift(movedLogo);
        onChange(newLogos);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Brand Logos</label>
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
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
                        {uploading ? 'Uploading...' : 'Upload Logo'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {logos.map((logo, index) => (
                    <div
                        key={`${logo}-${index}`}
                        className={`relative rounded-lg border-2 p-2 ${index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                    >
                        <div className="aspect-square relative overflow-hidden rounded-md bg-gray-100 flex items-center justify-center mb-2">
                            <img
                                src={getImageUrl(logo)}
                                alt={`Logo ${index + 1}`}
                                className="object-contain w-full h-full"
                            />
                        </div>

                        <div className="flex justify-between items-center gap-1">
                            {index === 0 ? (
                                <span className="flex items-center text-xs font-semibold text-blue-600">
                                    <StarIcon className="h-3 w-3 mr-1" />
                                    Main
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleMakeMain(index)}
                                    className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                                >
                                    Make Main
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

            <p className="text-xs text-gray-500">
                The first logo (highlighted) is the main brand logo. Drag/Move functionality coming soon, use "Make Main" to reorder.
            </p>
        </div>
    );
}
