'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    BuildingStorefrontIcon,
    UsersIcon,
    TagIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';

const AdminCard = ({ title, description, href, icon: Icon, color }: any) => (
    <Link
        href={href}
        className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors"
    >
        <div className={`p-3 rounded-full w-fit mb-4 ${color}`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{title}</h5>
        <p className="font-normal text-gray-700">{description}</p>
    </Link>
);

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || !user.roles?.includes('admin')) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdminCard
                    title="VUFS Management"
                    description="Manage Categories, Attributes, and Matrix values."
                    href="/admin/vufs"
                    icon={TagIcon}
                    color="bg-purple-600"
                />

                <AdminCard
                    title="Brand Profiles"
                    description="Manage Brands, Logos, and Teams."
                    href="/admin/brands"
                    icon={BuildingStorefrontIcon}
                    color="bg-blue-600"
                />

                <AdminCard
                    title="User Management"
                    description="Manage Users, Roles, and Permissions."
                    href="/admin/users"
                    icon={UsersIcon}
                    color="bg-green-600"
                />

                <AdminCard
                    title="System Configuration"
                    description="Global settings and system parameters."
                    href="/admin/configuration"
                    icon={Cog6ToothIcon}
                    color="bg-gray-600"
                />
            </div>
        </div>
    );
}
