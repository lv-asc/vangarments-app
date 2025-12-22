'use client';

import { Suspense } from 'react';
import ApparelManagement from '@/components/admin/ApparelManagement';

export default function AdminApparelPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Apparel Management</h1>
            <Suspense fallback={<div>Loading...</div>}>
                <ApparelManagement />
            </Suspense>
        </div>
    );
}
