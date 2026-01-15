'use client';

import { useProfile } from '../ProfileLayoutClient';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function UserOutfitsPage() {
    const { profile, loading, canViewSection, followStatus } = useProfile();

    if (loading || !profile) return null;

    // Check visibility
    if (!canViewSection('outfits')) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center py-12">
                    <LockClosedIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Private Content</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {profile.privacySettings?.outfits?.visibility === 'followers'
                            ? followStatus.isFollowing && followStatus.status === 'pending'
                                ? 'This user\'s outfits are only visible to followers. Your follow request is pending.'
                                : 'This user\'s outfits are only visible to followers. Follow them to see their outfits.'
                            : 'This content is not available.'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Outfits</h2>
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-500">No outfits shared publicly.</p>
            </div>
        </div>
    );
}
