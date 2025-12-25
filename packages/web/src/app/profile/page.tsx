'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthWrapper';

export default function ProfileRedirectPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (isAuthenticated && user?.username) {
            // Redirect to the user's own profile page (Instagram-style)
            router.replace(`/u/${user.username}`);
        } else {
            // Not authenticated, redirect to login
            router.replace('/login');
        }
    }, [isAuthenticated, user, loading, router]);

    // Show loading spinner while redirecting
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
