'use client';

import { useProfile } from '../ProfileLayoutClient';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import WardrobeManagement from '@/components/wardrobe/WardrobeManagement';

export default function UserWardrobePage() {
    const { profile, loading, canViewSection, followStatus } = useProfile();

    if (loading || !profile) return null;

    // Check visibility
    if (!canViewSection('wardrobe')) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center py-12">
                    <LockClosedIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Private Content</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {profile.privacySettings?.wardrobe?.visibility === 'followers'
                            ? followStatus.isFollowing && followStatus.status === 'pending'
                                ? 'This user\'s wardrobe is only visible to followers. Your follow request is pending.'
                                : 'This user\'s wardrobe is only visible to followers. Follow them to see their wardrobe.'
                            : 'This content is not available.'
                        }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <WardrobeManagement
                username={profile.username}
                displayName={profile.name}
            />
        </div>
    );
}
