'use client';

import SKUForm from '@/components/admin/SKUForm';

export default function CreateSKUPage() {
    return (
        <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6 px-4">Create New SKU</h1>
            <SKUForm isEditMode={false} />
        </div>
    );
}
