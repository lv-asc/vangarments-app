'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SKUForm from '@/components/admin/SKUForm';
import { apiClient } from '@/lib/api';

export default function EditSKUPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [sku, setSku] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSku = async () => {
            try {
                // Try fetching by slug/id (apiClient.getSKU usually handles both if backend supports it, 
                // or we might need search if getSKU is strict on ID)
                // Assuming getSKU handles slug or ID as per standard REST patterns or Vangarments custom
                let data;
                try {
                    data = await apiClient.getSKU(slug);
                } catch (e) {
                    console.warn('Direct fetch failed, trying search...');
                    // Fallback to search if specific fetch fails (e.g. if endpoint expects uuid but got slug)
                    const searchRes = await apiClient.searchSKUs(slug);
                    if (searchRes && searchRes.length > 0) {
                        data = searchRes[0];
                    } else {
                        throw e;
                    }
                }

                setSku(data);

                // Update document title with SKU name/code in the requested format
                if (data?.name) {
                    document.title = `Admin | ${data.name}`;
                } else if (data?.code) {
                    document.title = `Admin | ${data.code}`;
                }
            } catch (error) {
                console.error('Failed to fetch SKU', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchSku();
        }
    }, [slug]);

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
