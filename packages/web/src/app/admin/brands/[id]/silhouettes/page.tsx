'use client';

import { useBrand } from '@/components/admin/BrandProvider';
import SilhouetteManagement from '@/components/admin/SilhouetteManagement';

export default function BrandSilhouettesPage() {
    const { brand, loading } = useBrand();

    if (loading || !brand) return <div>Loading...</div>;

    return (
        <div className="p-0">
            <SilhouetteManagement brandId={brand.id} />
        </div>
    );
}
