'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import OutfitEditorClient from '@/components/outfits/OutfitEditorClient';
import { useParams } from 'next/navigation';

export default function OutfitDetailPage() {
    const params = useParams();
    const [outfit, setOutfit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.id) {
            // @ts-ignore
            apiClient.getOutfit(params.id as string)
                .then(data => {
                    setOutfit(data);
                })
                .catch(err => {
                    console.error(err);
                    setError('Failed to load outfit');
                })
                .finally(() => setLoading(false));
        }
    }, [params.id]);

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

    return <OutfitEditorClient mode="edit" initialData={outfit} />;
}
