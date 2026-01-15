'use client';

import { useProfile } from './ProfileLayoutClient';
import Link from 'next/link'; // Import Link
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { useEffect } from 'react';

export default function PublicUserProfilePage() {
    const { profile, loading, canViewSection, followStatus } = useProfile();
    const { addVisit } = useRecentVisits();

    useEffect(() => {
        if (profile) {
            addVisit({
                id: profile.id,
                name: profile.name,
                logo: profile.profileImage,
                businessType: 'user',
                type: 'user',
                username: profile.username,
                verificationStatus: profile.verificationStatus,
                visitedAt: Date.now()
            });
        }
    }, [profile?.id]);

    if (loading || !profile) {
        return null; // Layout handles loading/error
    }

    const isPrivateAndNotFollowed = profile.privacySettings?.isPrivate &&
        (!followStatus.isFollowing || followStatus.status !== 'accepted');

    // If account is private, show the private account wall if not followed
    if (isPrivateAndNotFollowed) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockClosedIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Este perfil é privado</h2>
                    <p className="text-gray-500 mb-6">
                        Siga este usuário para ver suas fotos, itens e atualizações.
                    </p>
                    {followStatus.isFollowing && followStatus.status === 'pending' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            Solicitação Pendente
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href={`/u/${profile.username}/followers`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#00132d] transition-colors block">
                    <div className="text-2xl font-bold text-[#00132d] mb-1">{profile.stats.followers}</div>
                    <div className="text-sm text-gray-600">Followers</div>
                </Link>
                <Link href={`/u/${profile.username}/following`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#00132d] transition-colors block">
                    <div className="text-2xl font-bold text-[#00132d] mb-1">{profile.stats.following}</div>
                    <div className="text-sm text-gray-600">Following</div>
                </Link>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <Link
                            href={`/u/${profile.username}`}
                            className="py-4 px-1 border-b-2 font-medium text-sm transition-colors border-[#00132d] text-[#00132d]"
                        >
                            Wardrobe
                        </Link>
                        <Link
                            href={`/u/${profile.username}/outfits`}
                            className="py-4 px-1 border-b-2 font-medium text-sm transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        >
                            Outfits
                        </Link>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Wardrobe Content */}
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                        <p className="text-gray-500">Nenhum item público encontrado.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
