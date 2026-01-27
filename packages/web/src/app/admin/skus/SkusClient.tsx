
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

    return <GlobalSKUManagement />;
}
