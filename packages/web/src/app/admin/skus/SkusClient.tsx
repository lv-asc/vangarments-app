
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import GlobalSKUManagement from '@/components/admin/GlobalSKUManagement';

export default function AdminSKUsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return <div className="p-10 flex justify-center">Loading...</div>;
    }

    if (!user || !user.roles?.includes('admin')) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
                <Link href="/admin" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">SKU Management</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage all product SKUs across all brands.</p>
                    </div>
                </div>
            </div>

            <GlobalSKUManagement />
        </div>
    );
}
