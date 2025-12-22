'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { brandApi, BrandFullProfile } from '@/lib/brandApi';
import OrgProfile from '@/components/brands/OrgProfile';

export default function SupplierProfilePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [profile, setProfile] = useState<BrandFullProfile | null>(null);
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
            const data = await brandApi.getFullProfile(slug);

            // Redirect if not a supplier
            if (data.brand.brandInfo.businessType === 'brand') {
                router.replace(`/brands/${slug}`);
                return;
            }
            if (data.brand.brandInfo.businessType === 'store') {
                router.replace(`/stores/${slug}`);
                return;
            }
            if (data.brand.brandInfo.businessType === 'non_profit') {
                router.replace(`/non-profits/${slug}`);
                return;
            }

            setProfile(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load supplier profile');
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Supplier Not Found</h1>
                    <p className="text-gray-600 mb-4">{error || 'The supplier profile could not be loaded.'}</p>
                    <Link href="/suppliers" className="text-blue-600 hover:underline">
                        ← Back to Suppliers
                    </Link>
                </div>
            </div>
        );
    }

    return <OrgProfile profile={profile} slug={slug} />;
}
