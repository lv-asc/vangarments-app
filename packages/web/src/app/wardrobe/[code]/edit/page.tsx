'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthWrapper';
import { apiClient } from '@/lib/api';
import ItemCreation from '@/components/admin/ItemCreation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface EditWardrobeItemPageProps {
    params: { code: string } | Promise<{ code: string }>;
}

export default function EditWardrobeItemPage({ params }: EditWardrobeItemPageProps) {
    const resolvedParams = params instanceof Promise ? use(params) : params;
    const { code } = resolvedParams;
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Load Item Data
    useEffect(() => {
        const loadItem = async () => {
            if (!code || !isAuthenticated) return;

            try {
                setLoading(true);
                const response = await apiClient.getWardrobeItem(code);
                const currentItem = response.item || response;

                // Ensure IDs and nested objects are properly set for ItemCreation
                // ItemCreation expects specific fields like brandId, lineInfo, etc.
                // We rely on ItemCreation's own initializeForm logic which handles mapping from sku/item structure.
                setItem(currentItem);
            } catch (error) {
                console.error('Failed to load item:', error);
                setError('Failed to load item data.');
            } finally {
                setLoading(false);
            }
        };

        loadItem();
    }, [code, isAuthenticated]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading item...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                >
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        Cancel Editing
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="mb-6 border-b border-gray-100 pb-4">
                            <h1 className="text-2xl font-bold text-gray-900">Edit Wardrobe Item</h1>
                            <p className="text-gray-500 mt-1">Update details about your piece</p>
                        </div>

                        <ItemCreation
                            mode="wardrobe"
                            initialData={item}
                            isEditMode={true}
                            onCancel={() => router.back()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
