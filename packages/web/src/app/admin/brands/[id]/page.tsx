'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function BrandBasePage() {
    const params = useParams();
    const router = useRouter();
    const brandId = params.id as string;

    useEffect(() => {
        // Redirect to details page
        router.replace(`/admin/brands/${brandId}/details`);
    }, [brandId, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
