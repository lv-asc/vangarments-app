'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PublicOutfitListPage() {
    const params = useParams();
    const username = params.username as string;
    const [outfits, setOutfits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOutfits();
    }, [username]);

    const loadOutfits = async () => {
        try {
            // @ts-ignore
            const data = await apiClient.getPublicOutfits(username);
            setOutfits(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load outfits');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading outfits...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#00132d]">@{username}'s Outfits</h1>
                <p className="text-gray-500 mt-2">Browse their looks</p>
            </div>

            {outfits.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-600">No outfits yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {outfits.map((outfit) => (
                        <Link
                            key={outfit.id}
                            href={`/u/${username}/outfits/${outfit.slug}`}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
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
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
