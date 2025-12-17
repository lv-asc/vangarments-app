'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    BuildingStorefrontIcon,
    UsersIcon,
    TagIcon,
    Cog6ToothIcon,
    SwatchIcon,
    FunnelIcon,
    FolderIcon,
    NewspaperIcon,
    BookOpenIcon,
    TruckIcon,
    HeartIcon,
    ShoppingBagIcon,
    GlobeAltIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';

// Modern Card Component
const AdminCard = ({ item }: { item: any }) => {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="group relative flex flex-col p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-5 rounded-bl-full pointer-events-none group-hover:opacity-10 transition-opacity`} />

            <div className={`p-3 rounded-lg w-fit mb-4 bg-gradient-to-br ${item.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.title}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                {item.description}
            </p>

            <div className="mt-auto flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span>Manage</span>
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
};

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading || !isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user || !user.roles?.includes('admin')) {
        return null;
    }

    // Defined Sections
    const sections = [
        {
            title: "Commerce & Partners",
            description: "Manage your business relationships and entities",
            items: [
                {
                    id: 'brands',
                    title: 'Brand Profiles',
                    description: 'Manage Brands, Logos, and Teams.',
                    href: '/admin/brands',
                    icon: BuildingStorefrontIcon,
                    gradient: 'from-blue-500 to-blue-600'
                },
                {
                    id: 'stores',
                    title: 'Stores',
                    description: 'Manage Store Accounts and locations.',
                    href: '/admin/stores',
                    icon: ShoppingBagIcon,
                    gradient: 'from-purple-500 to-indigo-600'
                },
                {
                    id: 'suppliers',
                    title: 'Suppliers',
                    description: 'Manage Suppliers and their details.',
                    href: '/admin/suppliers',
                    icon: TruckIcon,
                    gradient: 'from-emerald-500 to-teal-600'
                },
                {
                    id: 'non_profits',
                    title: 'Non Profits',
                    description: 'Manage Non-Profit Organizations.',
                    href: '/admin/non-profits',
                    icon: HeartIcon,
                    gradient: 'from-rose-500 to-red-600'
                }
            ]
        },
        {
            title: "Product Catalog",
            description: "Configure your product taxonomy and inventory",
            items: [
                {
                    id: 'categories',
                    title: 'Categories',
                    description: 'Manage hierarchical Categories structure.',
                    href: '/admin/categories',
                    icon: FolderIcon,
                    gradient: 'from-orange-400 to-pink-500'
                },
                {
                    id: 'apparel',
                    title: 'Apparel',
                    description: 'Manage Apparel Categories and Attributes.',
                    href: '/admin/apparel',
                    icon: TagIcon,
                    gradient: 'from-pink-500 to-rose-500'
                },
                {
                    id: 'skus',
                    title: 'SKU Management',
                    description: 'Manage Global SKUs, Images, and Videos.',
                    href: '/admin/skus',
                    icon: BriefcaseIcon,
                    gradient: 'from-cyan-500 to-blue-500'
                },
                {
                    id: 'colors',
                    title: 'Colors',
                    description: 'Manage Colors and Color Groups.',
                    href: '/admin/colors',
                    icon: SwatchIcon,
                    gradient: 'from-fuchsia-500 to-purple-600'
                },
                {
                    id: 'sizes',
                    title: 'Sizes',
                    description: 'Manage Sizes, Conversions and Validity.',
                    href: '/admin/sizes',
                    icon: FunnelIcon,
                    gradient: 'from-amber-500 to-orange-600'
                }
            ]
        },
        {
            title: "Content & Platform",
            description: "Manage users, pages and system settings",
            items: [
                {
                    id: 'users',
                    title: 'User Management',
                    description: 'Manage Users, Roles, and Permissions.',
                    href: '/admin/users',
                    icon: UsersIcon,
                    gradient: 'from-blue-600 to-indigo-600'
                },
                {
                    id: 'pages',
                    title: 'Pages',
                    description: 'Manage publication pages (Vogue, etc.)',
                    href: '/admin/pages',
                    icon: BookOpenIcon,
                    gradient: 'from-violet-500 to-purple-500'
                },
                {
                    id: 'journalism',
                    title: 'Journalism',
                    description: 'Manage News, Columns, and Articles.',
                    href: '/admin/journalism',
                    icon: NewspaperIcon,
                    gradient: 'from-slate-600 to-gray-700'
                },
                {
                    id: 'vufs',
                    title: 'VUFS Management',
                    description: 'Manage Attributes and Matrix values.',
                    href: '/admin/vufs',
                    icon: GlobeAltIcon,
                    gradient: 'from-teal-500 to-emerald-600'
                },
                {
                    id: 'config',
                    title: 'System Configuration',
                    description: 'Global settings and system parameters.',
                    href: '/admin/configuration',
                    icon: Cog6ToothIcon,
                    gradient: 'from-gray-600 to-gray-800'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        Admin Dashboard
                    </h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                        Manage your application's content, users, and settings.
                    </p>
                </div>

                <div className="space-y-12">
                    {sections.map((section, idx) => (
                        <div key={idx} className="animate-in fade-in-50 slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                            <div className="flex items-end space-x-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {section.title}
                                </h2>
                                <span className="text-sm text-gray-500 dark:text-gray-500 pb-0.5">
                                    {section.description}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {section.items.map((item) => (
                                    <AdminCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
