'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { brandApi, BrandFullProfile } from '@/lib/brandApi';
import OrgProfile from '@/components/brands/OrgProfile';
import { useRecentVisits } from '@/hooks/useRecentVisits';

export default function StoreProfilePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { addVisit } = useRecentVisits();

    const [profile, setProfile] = useState<BrandFullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            loadProfile();
        }
    }, [slug]);

    // Update document title when profile is loaded
    useEffect(() => {
        if (profile) {
            document.title = `Store @${profile.brand.brandInfo.name}`;
        }
    }, [profile]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await brandApi.getBrandProfile(slug);

            // Add to recent visits
            if (data?.brand) {
                addVisit({
                    id: data.brand.id,
                    name: data.brand.brandInfo.name,
                    logo: data.brand.brandInfo.logo,
                    businessType: data.brand.brandInfo.businessType || 'store',
                    type: 'store',
                    slug: data.brand.brandInfo.slug || slug,
                    verificationStatus: data.brand.verificationStatus
                });
            }

            // Redirect if this is actually a brand (not a store)
            if (data.brand.brandInfo.businessType === 'brand') {
                router.replace(`/brands/${slug}`);
                return;
            }

            // Redirect if this is a non-profit
            if (data.brand.brandInfo.businessType === 'non_profit') {
                router.replace(`/non-profits/${slug}`);
                return;
            }

            setProfile(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load store profile');
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
                    <p className="text-gray-600 mb-4">{error || 'The store profile could not be loaded.'}</p>
                    <Link href="/stores" className="text-blue-600 hover:underline">
                        ← Back to Stores
                    </Link>
                </div>
            </div>
        );
    }

    return <OrgProfile profile={profile} slug={slug} />;
}
