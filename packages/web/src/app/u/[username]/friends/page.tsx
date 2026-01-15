'use client';

import { useProfile } from '../ProfileLayoutClient';

export default function UserFriendsPage() {
    const { profile, loading } = useProfile();

    if (loading || !profile) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Friends</h2>
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-500">No friends to show.</p>
            </div>
        </div>
    );
}
