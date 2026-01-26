'use client';

import { useBrand } from '@/components/admin/BrandProvider';
import LineManagement from '@/components/admin/LineManagement';

export default function BrandLinesPage() {
    const { brand, loading } = useBrand();

    if (loading || !brand) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <LineManagement brandId={brand.id} />
        </div>
    );
}
