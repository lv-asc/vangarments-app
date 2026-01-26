'use client';

import { useBrand } from '@/components/admin/BrandProvider';
import GlobalSKUManagement from '@/components/admin/GlobalSKUManagement';

export default function BrandSKUsPage() {
    const { brand, loading } = useBrand();

    if (loading || !brand) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <GlobalSKUManagement brandId={brand.id} />
        </div>
    );
}
