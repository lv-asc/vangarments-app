'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
// @ts-ignore - Ignoring missing property lint until restart
import Link from 'next/link';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function OutfitListPage() {
    const [outfits, setOutfits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOutfits();
    }, []);

    const loadOutfits = async () => {
        try {
            // @ts-ignore
            const data = await apiClient.getOutfits();
            setOutfits(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load outfits');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this outfit?')) return;

        try {
            // @ts-ignore
            await apiClient.deleteOutfit(id);
            setOutfits(outfits.filter(o => o.id !== id));
            toast.success('Outfit deleted');
        } catch (err) {
            toast.error('Failed to delete outfit');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading your outfits...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#00132d]">My Outfits</h1>
                    <p className="text-gray-500 mt-2">Manage and organize your looks</p>
                </div>
                <Link href="/wardrobe/outfits/create" className="bg-[#00132d] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[#00132d]/90 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>New Outfit</span>
                </Link>
            </div>

            {outfits.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-600 mb-4">You haven't created any outfits yet.</p>
                    <Link
                        href="/wardrobe/outfits/create"
                        className="text-[#00132d] font-semibold hover:underline"
                    >
                        Create your first outfit
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {outfits.map((outfit) => (
                        <Link
                            key={outfit.id}
                            href={`/wardrobe/outfits/${outfit.id}`}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                            <div className="aspect-square bg-gray-100 relative group-hover:opacity-90 transition-opacity">
                                {outfit.previewUrl ? (
                                    <img
                                        src={outfit.previewUrl}
                                        alt={outfit.name}
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-400 p-4">
                                        <div className="text-center">
                                            <span className="text-4xl">👔</span>
                                            <p className="text-sm mt-2">No Preview</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 group-hover:text-[#00132d] transition-colors">{outfit.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{new Date(outfit.updatedAt).toLocaleDateString()}</p>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, outfit.id)}
                                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
