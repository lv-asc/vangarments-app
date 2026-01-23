'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sportOrgApi } from '@/lib/sportOrgApi';
import SportOrgProfile, { SportOrgFullProfile } from '@/components/sport-orgs/SportOrgProfile';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import toast from 'react-hot-toast';

interface SportOrgProfileClientProps {
    slug: string;
}

export default function SportOrgProfileClient({ slug }: SportOrgProfileClientProps) {
    const router = useRouter();
    const { addVisit } = useRecentVisits();

    const [profile, setProfile] = useState<SportOrgFullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadProfile();
        }
    }, [slug]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await sportOrgApi.getOrg(slug);

            if (!data) {
                setError('Organization not found');
                return;
            }

            // We need to fetch follower count too, or assume it's 0 for now
            // The API returns SportOrg, which we'll wrap in SportOrgFullProfile
            setProfile({
                org: data,
                followerCount: 0, // Placeholder until social stats are integrated for SportOrgs
                followingCount: 0
            });

            // Add to recent visits
            addVisit({
                id: data.id,
                name: data.name,
                logo: data.masterLogo,
                businessType: 'sport_org' as any,
                type: 'sport_org' as any,
                slug: data.slug || slug,
                verificationStatus: 'unverified'
            });

            // Update title
            document.title = `Sport ORG @${data.name}`;

        } catch (err: any) {
            console.error('Failed to load profile:', err);
            setError(err.message || 'Failed to load organization profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
                    <p className="text-gray-600 mb-4">{error || 'The profile could not be loaded.'}</p>
                    <Link href="/sport-orgs" className="text-blue-600 hover:underline">
                        ← Back to Sport ORGs
                    </Link>
                </div>
            </div>
        );
    }

    return <SportOrgProfile profile={profile} slug={slug} />;
}
