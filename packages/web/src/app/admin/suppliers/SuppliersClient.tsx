'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TruckIcon } from '@heroicons/react/24/outline';

export default function AdminSuppliersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Suppliers Management</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage suppliers and their details.</p>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-12 flex flex-col items-center justify-center border border-gray-200">
                <div className="p-4 rounded-full bg-teal-100 mb-4">
                    <TruckIcon className="h-12 w-12 text-teal-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Suppliers Section</h3>
                <p className="mt-1 text-gray-500">This section is currently under construction. Functions to be specified.</p>
            </div>
        </div>
    );
}
