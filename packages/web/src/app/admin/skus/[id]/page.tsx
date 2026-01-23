'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SKUForm from '@/components/admin/SKUForm';
import { apiClient } from '@/lib/api';

export default function EditSKUPage() {
    const params = useParams();
    const id = params.id as string;
    const [sku, setSku] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSku = async () => {
            try {
                // Try fetching by slug first, then by ID
                const data = await apiClient.getSKU(id);
                setSku(data);

                // Update document title with SKU code
                if (data?.code) {
                    document.title = `Admin | Edit ${data.code}`;
                } else if (data?.name) {
                    document.title = `Admin | Edit ${data.name}`;
                }
            } catch (error) {
                console.error('Failed to fetch SKU', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSku();
        }
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center">Loading SKU...</div>;
    }

    if (!sku) {
        return <div className="p-8 text-center text-red-500">SKU not found</div>;
    }

    return (
        <div className="py-6">
            <SKUForm initialData={sku} isEditMode={true} />
        </div>
    );
}
