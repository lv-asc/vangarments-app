'use client';

import GlobalSKUManagement from '@/components/admin/GlobalSKUManagement';

export default function SKUManagementPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">SKU Management</h1>
            <GlobalSKUManagement />
        </div>
    );
}
