'use client';

import { useProfile } from '../layout';

export default function UserFollowersPage() {
    const { profile, loading } = useProfile();

    if (loading || !profile) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Followers</h2>
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-500">No followers yet.</p>
            </div>
        </div>
    );
}
