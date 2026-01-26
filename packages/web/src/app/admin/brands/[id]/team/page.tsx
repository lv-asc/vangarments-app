'use client';

import { useBrand } from '@/components/admin/BrandProvider';
import TeamManagement from '@/components/admin/TeamManagement';

export default function BrandTeamPage() {
    const { brand, loading } = useBrand();

    if (loading || !brand) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <TeamManagement brandId={brand.id} />
        </div>
    );
}
