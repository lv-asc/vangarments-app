'use client';

import { useProfile } from './layout';

export default function PublicUserProfilePage() {
    const { profile, loading } = useProfile();

    if (loading || !profile) {
        return null; // Layout handles loading/error
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                <p className="text-gray-500">No public items found.</p>
            </div>
        </div>
    );
}
