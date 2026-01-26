'use client';

import { useBrand } from '@/components/admin/BrandProvider';
import LookbookManagement from '@/components/admin/LookbookManagement';

export default function BrandLookbooksPage() {
    const { brand, loading } = useBrand();

    if (loading || !brand) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <LookbookManagement brandId={brand.id} />
        </div>
    );
}
