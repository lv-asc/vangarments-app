'use client';

import { useBrand } from '@/components/admin/BrandProvider';
import CollectionManagement from '@/components/admin/CollectionManagement';

export default function BrandCollectionsPage() {
    const { brand, loading } = useBrand();

    if (loading || !brand) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <CollectionManagement brandId={brand.id} />
        </div>
    );
}
