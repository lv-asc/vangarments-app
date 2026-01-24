'use client';

import SKUForm from '@/components/admin/SKUForm';

export default function CreateSKUPage() {
    return (
        <div className="py-6 px-4">
            <SKUForm isEditMode={false} />
        </div>
    );
}
