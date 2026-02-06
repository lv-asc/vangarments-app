'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PublicOutfitDetailPage() {
    const params = useParams();
    const username = params.username as string;
    const slug = params.slug as string;
    const [outfit, setOutfit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (username && slug) {
            // @ts-ignore
            apiClient.getPublicOutfit(username, slug)
                .then((data: any) => {
                    setOutfit(data);
                })
                .catch((err: any) => {
                    console.error(err);
                    setError('Outfit not found');
                })
                .finally(() => setLoading(false));
        }
    }, [username, slug]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );

    if (error || !outfit) return (
        <div className="p-8 text-center text-red-600">
            {error || 'Outfit not found'}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-8">
                <Link
                    href={`/u/${username}/outfits`}
                    className="inline-flex items-center text-gray-600 hover:text-[#00132d] mb-6"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to @{username}'s outfits
                </Link>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-100">
                        {outfit.previewUrl ? (
                            <img
                                src={outfit.previewUrl}
                                alt={outfit.name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                                <span className="text-6xl">👔</span>
                            </div>
                        )}
                    </div>
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-[#00132d]">{outfit.name}</h1>
                        {outfit.description && (
                            <p className="text-gray-600 mt-2">{outfit.description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-4">
                            Created by <Link href={`/u/${username}`} className="text-[#00132d] hover:underline">@{username}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
