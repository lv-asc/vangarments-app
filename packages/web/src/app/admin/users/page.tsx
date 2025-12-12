'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    roles: string[];
    status: 'active' | 'banned' | 'deactivated';
    banExpiresAt?: string;
    brands?: { id: string; name: string }[];
}

interface Brand {
    id: string;
    userId: string;
    brandInfo: { name: string };
}

const STATUS_OPTIONS = ['all', 'active', 'banned', 'deactivated'];
const SORT_OPTIONS = [
    { value: 'username_asc', label: 'Username (A-Z)' },
    { value: 'username_desc', label: 'Username (Z-A)' },
    { value: 'created_desc', label: 'Newest First' },
    { value: 'created_asc', label: 'Oldest First' },
    { value: 'email_asc', label: 'Email (A-Z)' },
];
const GROUP_OPTIONS = [
    { value: 'none', label: 'No Grouping' },
    { value: 'status', label: 'By Status' },
    { value: 'role', label: 'By Primary Role' },
];

export default function AdminUsersPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter, Sort, Group State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('username_asc');
    const [groupBy, setGroupBy] = useState('status');

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            fetchUsers();
        }
    }, [user, authLoading, router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [usersResponse, brandsResponse] = await Promise.all([
                apiClient.get('/users') as any,
                apiClient.get('/brands') as any
            ]);

            const fetchedUsers = Array.isArray(usersResponse) ? usersResponse : usersResponse.users || [];
            const fetchedBrands: Brand[] = Array.isArray(brandsResponse) ? brandsResponse : brandsResponse.brands || [];

            // Map brands to users
            const brandsByUserId: Record<string, { id: string; name: string }[]> = {};
            fetchedBrands.forEach((b: any) => {
                const userId = b.userId;
                if (!brandsByUserId[userId]) brandsByUserId[userId] = [];
                brandsByUserId[userId].push({ id: b.id, name: b.brandInfo?.name || 'Unnamed' });
            });

            setUsers(fetchedUsers.map((u: any) => ({
                id: u.id,
                name: u.name || u.personalInfo?.name || '',
                username: u.username || '',
                email: u.email,
                roles: u.roles || [],
                status: u.status || 'active',
                banExpiresAt: u.banExpiresAt,
                brands: brandsByUserId[u.id] || []
            })));
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    // Filtering, Sorting, Grouping Logic
    const processedUsers = useMemo(() => {
        let result = [...users];

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(u =>
                u.username?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term) ||
                u.name?.toLowerCase().includes(term)
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(u => u.status === statusFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'username_asc':
                    return (a.username || '').localeCompare(b.username || '');
                case 'username_desc':
                    return (b.username || '').localeCompare(a.username || '');
                case 'email_asc':
                    return (a.email || '').localeCompare(b.email || '');
                case 'created_desc':
                default:
                    return 0; // Keep original order (created_at desc from backend)
                case 'created_asc':
                    return 0; // Would need createdAt field
            }
        });

        return result;
    }, [users, searchTerm, statusFilter, sortBy]);

    // Grouping Logic
    const groupedUsers = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Users': processedUsers };
        }
        if (groupBy === 'status') {
            const groups: Record<string, User[]> = { 'Active': [], 'Banned': [], 'Deactivated': [] };
            processedUsers.forEach(u => {
                const key = u.status === 'active' ? 'Active' : u.status === 'banned' ? 'Banned' : 'Deactivated';
                groups[key].push(u);
            });
            // Filter out empty groups
            return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
        }
        if (groupBy === 'role') {
            const groups: Record<string, User[]> = {};
            processedUsers.forEach(u => {
                const primaryRole = u.roles?.[0] || 'No Role';
                if (!groups[primaryRole]) groups[primaryRole] = [];
                groups[primaryRole].push(u);
            });
            return groups;
        }
        return { 'All Users': processedUsers };
    }, [processedUsers, groupBy]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
            case 'banned':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Banned</span>;
            case 'deactivated':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Deactivated</span>;
            default:
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">Unknown</span>;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage users and their roles. {users.length} total users.</p>
                </div>
            </div>

            {/* Filter/Sort/Group Controls */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt === 'all' ? 'All Statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Group */}
                    <div className="flex items-center gap-2">
                        <Squares2X2Icon className="h-5 w-5 text-gray-400" />
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            {GROUP_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Grouped User Tables */}
            {Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
                <div key={groupName} className="mb-8">
                    {groupBy !== 'none' && (
                        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            {groupName}
                            <span className="text-sm font-normal text-gray-500">({groupUsers.length})</span>
                        </h2>
                    )}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Brands</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {groupUsers.map((userItem) => (
                                    <tr key={userItem.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{userItem.name || '-'}</div>
                                                    <div className="text-sm text-gray-500">@{userItem.username || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{userItem.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {userItem.roles?.map((role: string) => (
                                                    <span key={role} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1">
                                                {userItem.brands && userItem.brands.length > 0 ? (
                                                    userItem.brands.map(brand => (
                                                        <a key={brand.id} href={`/admin/brands/${brand.id}`} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200">
                                                            {brand.name}
                                                        </a>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400">None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(userItem.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a href={`/admin/users/${userItem.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                Edit
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {groupUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No users in this group.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {Object.keys(groupedUsers).length === 0 && (
                <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500">
                    No users found matching your criteria.
                </div>
            )}
        </div>
    );
}
