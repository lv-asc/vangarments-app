'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { formatCPF } from '@/lib/masks';
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon, Squares2X2Icon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface LinkedEntity {
    id: string;
    name: string;
    type: 'brand' | 'store' | 'page' | 'supplier' | 'non_profit' | 'designer' | 'manufacturer';
    logo?: string;
}

interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl?: string;
    roles: string[];
    status: 'active' | 'banned' | 'deactivated' | 'trashed';
    banExpiresAt?: string;
    brands?: { id: string; name: string }[];
    linkedEntities?: LinkedEntity[];
}

interface Brand {
    id: string;
    userId: string;
    brandInfo: { name: string };
}

interface Store {
    id: string;
    userId?: string;
    name: string;
}

interface Page {
    id: string;
    userId?: string;
    name: string;
}

interface Supplier {
    id: string;
    userId?: string;
    name: string;
}

// ... (keep existing constants)
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
    const [view, setView] = useState<'active' | 'trash'>('active');

    // Modals State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            fetchUsers();
        }
    }, [user, authLoading, router, view]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const statusParam = view === 'trash' ? 'trashed' : undefined;
            const [usersResponse, brandsResponse, storesResponse, pagesResponse, suppliersResponse] = await Promise.all([
                apiClient.get(`/users${statusParam ? `?status=${statusParam}` : ''}`) as any,
                apiClient.get('/brands') as any,
                apiClient.get('/stores') as any,
                apiClient.get('/pages') as any,
                apiClient.get('/suppliers') as any
            ]);

            const fetchedUsers = Array.isArray(usersResponse) ? usersResponse : usersResponse.users || [];
            const fetchedBrands: Brand[] = Array.isArray(brandsResponse) ? brandsResponse : brandsResponse.brands || [];
            const fetchedStores: Store[] = Array.isArray(storesResponse) ? storesResponse : storesResponse.stores || [];
            const fetchedPages: Page[] = Array.isArray(pagesResponse) ? pagesResponse : pagesResponse.pages || [];
            const fetchedSuppliers: Supplier[] = Array.isArray(suppliersResponse) ? suppliersResponse : suppliersResponse.suppliers || [];

            // Map brand accounts to users (respecting businessType)
            const brandAccountsByUserId: Record<string, LinkedEntity[]> = {};
            fetchedBrands.forEach((b: any) => {
                const userId = b.userId;
                if (!userId) return;
                if (!brandAccountsByUserId[userId]) brandAccountsByUserId[userId] = [];

                // Use businessType if available, default to 'brand'
                const businessType = b.brandInfo?.businessType || 'brand';
                const logo = b.brandInfo?.logo || b.profileData?.logo;

                brandAccountsByUserId[userId].push({
                    id: b.id,
                    name: b.brandInfo?.name || 'Unnamed',
                    type: businessType as LinkedEntity['type'],
                    logo
                });
            });

            // Map stores to users
            const storesByUserId: Record<string, { id: string; name: string }[]> = {};
            fetchedStores.forEach((s: Store) => {
                if (s.userId) {
                    if (!storesByUserId[s.userId]) storesByUserId[s.userId] = [];
                    storesByUserId[s.userId].push({ id: s.id, name: s.name });
                }
            });

            // Map pages to users
            const pagesByUserId: Record<string, { id: string; name: string }[]> = {};
            fetchedPages.forEach((p: Page) => {
                if (p.userId) {
                    if (!pagesByUserId[p.userId]) pagesByUserId[p.userId] = [];
                    pagesByUserId[p.userId].push({ id: p.id, name: p.name });
                }
            });

            // Map suppliers to users
            const suppliersByUserId: Record<string, { id: string; name: string }[]> = {};
            fetchedSuppliers.forEach((sup: Supplier) => {
                if (sup.userId) {
                    if (!suppliersByUserId[sup.userId]) suppliersByUserId[sup.userId] = [];
                    suppliersByUserId[sup.userId].push({ id: sup.id, name: sup.name });
                }
            });

            setUsers(fetchedUsers.map((u: any) => {
                // Combine all linked entities
                const linkedEntities: LinkedEntity[] = [];

                // Add brand accounts (they already have correct type from businessType)
                (brandAccountsByUserId[u.id] || []).forEach(entity => linkedEntities.push(entity));
                // Add stores from stores table (rarely used, most stores are in brand_accounts)
                (storesByUserId[u.id] || []).forEach(s => linkedEntities.push({ ...s, type: 'store' }));
                (pagesByUserId[u.id] || []).forEach(p => linkedEntities.push({ ...p, type: 'page' }));
                (suppliersByUserId[u.id] || []).forEach(sup => linkedEntities.push({ ...sup, type: 'supplier' }));

                return {
                    id: u.id,
                    name: u.name || u.personalInfo?.name || '',
                    username: u.username || '',
                    email: u.email,
                    avatarUrl: u.personalInfo?.avatarUrl || u.profile?.avatarUrl,
                    roles: u.roles || [],
                    status: u.status || 'active',
                    banExpiresAt: u.banExpiresAt,
                    linkedEntities
                };
            }));
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    const handleRestore = async (user: User) => {
        if (!confirm(`Are you sure you want to restore ${user.name}?`)) return;
        try {
            await apiClient.restoreUser(user.id);
            toast.success('User restored successfully');
            setUsers(users.filter(u => u.id !== user.id));
        } catch (error) {
            console.error('Failed to restore user', error);
            toast.error('Failed to restore user');
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            // If in trash, force delete. If active, soft delete.
            const force = view === 'trash';
            await apiClient.deleteUser(userToDelete.id, force);
            toast.success(force ? 'User permanently deleted' : 'User moved to trash');
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Failed to delete user', error);
            toast.error('Failed to delete user');
        }
    };

    // ... (keep filtering logic)

    // ... (keep grouping logic)

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

    const groupedUsers = useMemo(() => {
        if (groupBy === 'none') {
            return { 'All Users': processedUsers };
        }
        if (groupBy === 'status') {
            const groups: Record<string, User[]> = { 'Active': [], 'Banned': [], 'Deactivated': [], 'Trashed': [] };
            processedUsers.forEach(u => {
                const key = u.status === 'active' ? 'Active' : u.status === 'banned' ? 'Banned' : u.status === 'deactivated' ? 'Deactivated' : 'Trashed';
                groups[key].push(u);
            });
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
            case 'trashed':
                return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-50 text-red-500 border border-red-200">Trashed</span>;
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
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Create User
                </button>
            </div>

            {/* View Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setView('active')}
                        className={`${view === 'active'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Active Users
                    </button>
                    <button
                        onClick={() => setView('trash')}
                        className={`${view === 'trash'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        Trash
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </nav>
            </div>

            {/* Filter Controls (omitted for brevity, keep as is) */}
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

            {
                Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
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
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Entities</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {groupUsers.map((userItem) => (
                                        <tr key={userItem.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {userItem.avatarUrl ? (
                                                        <img
                                                            src={userItem.avatarUrl}
                                                            alt={userItem.name || 'User'}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <span className="text-gray-500 font-medium text-sm">
                                                                {(userItem.name?.[0] || userItem.username?.[0] || '?').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
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
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {userItem.linkedEntities && userItem.linkedEntities.length > 0 ? (
                                                        userItem.linkedEntities.map(entity => {
                                                            const badgeStyles: Record<string, string> = {
                                                                brand: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
                                                                store: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
                                                                page: 'bg-green-100 text-green-800 hover:bg-green-200',
                                                                supplier: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
                                                                non_profit: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
                                                                designer: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
                                                                manufacturer: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                            };
                                                            const adminPaths: Record<string, string> = {
                                                                brand: 'brands',
                                                                store: 'brands', // stores are in brand_accounts table
                                                                page: 'pages',
                                                                supplier: 'suppliers',
                                                                non_profit: 'brands',
                                                                designer: 'brands',
                                                                manufacturer: 'brands'
                                                            };
                                                            // Use relative path for storage URLs to go through frontend proxy
                                                            const logoUrl = entity.logo ?
                                                                (entity.logo.startsWith('http') ? entity.logo : entity.logo)
                                                                : null;
                                                            return (
                                                                <a
                                                                    key={`${entity.type}-${entity.id}`}
                                                                    href={`/admin/${adminPaths[entity.type] || 'brands'}/${entity.id}`}
                                                                    className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${badgeStyles[entity.type] || badgeStyles.brand}`}
                                                                    title={entity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                >
                                                                    {logoUrl && (
                                                                        <img
                                                                            src={logoUrl}
                                                                            alt=""
                                                                            className="h-4 w-4 rounded-full object-cover"
                                                                        />
                                                                    )}
                                                                    {entity.name}
                                                                </a>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-gray-400">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(userItem.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <a href={`/admin/users/${userItem.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                    Edit
                                                </a>
                                                {view === 'trash' && (
                                                    <button
                                                        onClick={() => handleRestore(userItem)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Restore
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteClick(userItem)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
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
                ))
            }

            {
                Object.keys(groupedUsers).length === 0 && (
                    <div className="bg-white shadow rounded-lg p-10 text-center text-gray-500">
                        No users found matching your criteria.
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDeleteModalOpen(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Delete User</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {view === 'trash'
                                                    ? <span>Are you sure you want to <span className="font-bold text-red-600">PERMANENTLY DELETE</span> <span className="font-bold">{userToDelete?.name || userToDelete?.email}</span>? This action cannot be undone.</span>
                                                    : <span>Are you sure you want to move <span className="font-bold">{userToDelete?.name || userToDelete?.email}</span> to trash? You can restore them later.</span>
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={confirmDelete}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                        onClick={() => setDeleteModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create User Modal */}
            {
                createModalOpen && (
                    <CreateUserModal
                        isOpen={createModalOpen}
                        onClose={() => setCreateModalOpen(false)}
                        onSuccess={() => {
                            setCreateModalOpen(false);
                            fetchUsers();
                        }}
                    />
                )
            }
        </div >
    );
}

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        roles: ['consumer'],
        birthDate: '',
        gender: 'prefer-not-to-say',
        cpf: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await (apiClient as any).adminCreateUser(formData);
            toast.success('User created successfully');
            onSuccess();
        } catch (error: any) {
            console.error('Failed to create user:', error);
            toast.error(error.message || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleRole = (role: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role]
        }));
    };

    const ALL_ROLES = [
        'consumer', 'admin', 'influencer', 'model', 'stylist', 'brand_owner',
        'supplier', 'independent_reseller', 'store_owner', 'fashion_designer', 'sewer'
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Create New User</h3>
                        <p className="text-sm text-gray-500">Add a new user to the platform.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_ROLES.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => toggleRole(role)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${formData.roles.includes(role)
                                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                                            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Birth Date (Optional)</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">CPF (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                    value={formData.cpf}
                                    onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
