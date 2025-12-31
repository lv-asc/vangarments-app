'use client';

import { useProfile } from './layout';
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                <p className="text-gray-500">Nenhum item público encontrado.</p>
            </div>
        </div>
    );
}
