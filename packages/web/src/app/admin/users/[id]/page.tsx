'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, LinkIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function AdminEditUserPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Ban Modal State
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [banDuration, setBanDuration] = useState('1d');
    const [banReason, setBanReason] = useState('');

    // Deactivate Modal State
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

    // Linked Entities State
    const [linkedEntities, setLinkedEntities] = useState({
        brands: [] as any[],
        stores: [] as any[],
        suppliers: [] as any[],
        pages: [] as any[]
    });

    // Available Entities State for Selection
    const [availableEntities, setAvailableEntities] = useState({
        brands: [] as any[],
        stores: [] as any[],
        suppliers: [] as any[],
        pages: [] as any[]
    });

    // Link Modal State
    const [linkModalState, setLinkModalState] = useState<{
        isOpen: boolean;
        type: 'brand' | 'store' | 'supplier' | 'page' | null;
    }>({ isOpen: false, type: null });
    const [selectedEntityId, setSelectedEntityId] = useState('');

    // Unlink Confirmation Modal State
    const [unlinkModalState, setUnlinkModalState] = useState<{
        isOpen: boolean;
        type: 'brand' | 'store' | 'supplier' | 'page' | null;
        entityId: string | null;
    }>({ isOpen: false, type: null, entityId: null });


    const [userData, setUserData] = useState({
        name: '',
        email: '',
        username: '',
        bio: '',
        roles: [] as string[],
        status: 'active',
        banExpiresAt: undefined as Date | undefined
    });

    const AVAILABLE_ROLES = [
        'consumer', 'admin', 'common_user', 'influencer',
        'brand_owner', 'stylist', 'independent_reseller',
        'store_owner', 'fashion_designer'
    ];

    const BAN_DURATIONS = [
        { label: '1 Day', value: '1d' },
        { label: '1 Week', value: '1w' },
        { label: '1 Month', value: '1m' },
        { label: '3 Months', value: '3m' },
        { label: '6 Months', value: '6m' },
        { label: '1 Year', value: '1y' },
        { label: '2 Years', value: '2y' },
        { label: 'Permanent', value: 'permanent' },
    ];

    useEffect(() => {
        if (!authLoading && (!currentUser || !currentUser.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (id && currentUser?.roles?.includes('admin')) {
            loadUser();
        }
    }, [id, currentUser, authLoading, router]);

    const loadUser = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<{ user: any }>(`/users/${id}`);

            if (response.user) {
                setUserData({
                    name: response.user.name || '',
                    email: response.user.email || '',
                    username: response.user.username || '',
                    bio: response.user.profile?.bio || '',
                    roles: response.user.roles || [],
                    status: response.user.status || 'active',
                    banExpiresAt: response.user.banExpiresAt ? new Date(response.user.banExpiresAt) : undefined
                });

                setLinkedEntities({
                    brands: response.user.brands || [],
                    stores: response.user.stores || [],
                    suppliers: response.user.suppliers || [],
                    pages: response.user.pages || []
                });
            }
        } catch (error) {
            console.error('Failed to load user', error);
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableEntities = async (type: 'brand' | 'store' | 'supplier' | 'page') => {
        try {
            let endpoint = '';
            let key = '';
            switch (type) {
                case 'store': endpoint = '/stores'; key = 'stores'; break;
                case 'supplier': endpoint = '/suppliers'; key = 'suppliers'; break;
                case 'page': endpoint = '/pages'; key = 'pages'; break;
                // Use generic brands endpoint if available, or vufs-management/brands if specifically needing all
                // The issue previously was unclear endpoints. Let's assume /brands search works or use a listing endpoint.
                // Assuming /brands allows listing for now.
                case 'brand': endpoint = '/brands'; key = 'brands'; break;
            }

            const response = await apiClient.get<any>(endpoint);
            // Handle different response structures
            let list = [];
            if (response[key]) list = response[key];
            else if (response.data && response.data[key]) list = response.data[key];
            else if (Array.isArray(response)) list = response;
            else if (response.data && Array.isArray(response.data)) list = response.data;

            // Fallback for searchBrands response structure { success: true, data: { brands: [], ... } }
            if (key === 'brands' && response.data && response.data.brands) {
                list = response.data.brands;
            }

            setAvailableEntities(prev => ({ ...prev, [key]: Array.isArray(list) ? list : [] }));
        } catch (error) {
            console.error(`Failed to load ${type}s`, error);
            toast.error(`Failed to load available ${type}s`);
        }
    };

    const handleLinkEntity = async () => {
        if (!linkModalState.type || !selectedEntityId) return;
        try {
            // Determine endpoint. All should support PUT /:entity/:id with { userId: id }
            const endpoint = linkModalState.type === 'brand' ? '/brands' : `/${linkModalState.type}s`;

            await apiClient.put(`${endpoint}/${selectedEntityId}`, { userId: id });

            toast.success(`${linkModalState.type} linked successfully`);
            setLinkModalState({ isOpen: false, type: null });
            setSelectedEntityId('');
            loadUser();
        } catch (error) {
            console.error('Failed to link entity', error);
            toast.error('Failed to link entity');
        }
    };

    const confirmUnlinkEntity = async () => {
        if (!unlinkModalState.type || !unlinkModalState.entityId) return;

        try {
            const endpoint = unlinkModalState.type === 'brand' ? '/brands' : `/${unlinkModalState.type}s`;

            // Update with userId: null to unlink
            // Note: For brands this now works because we updated the backend.
            await apiClient.put(`${endpoint}/${unlinkModalState.entityId}`, { userId: null });

            toast.success(`${unlinkModalState.type} unlinked successfully`);
            setUnlinkModalState({ isOpen: false, type: null, entityId: null });
            loadUser();
        } catch (error) {
            console.error('Failed to unlink entity', error);
            toast.error('Failed to unlink entity');
        }
    };

    const openLinkModal = (type: 'brand' | 'store' | 'supplier' | 'page') => {
        setLinkModalState({ isOpen: true, type });
        loadAvailableEntities(type);
    };

    const openUnlinkModal = (type: 'brand' | 'store' | 'supplier' | 'page', entityId: string) => {
        setUnlinkModalState({ isOpen: true, type, entityId });
    };

    const handleRoleChange = (role: string) => {
        setUserData(prev => {
            if (prev.roles.includes(role)) {
                return { ...prev, roles: prev.roles.filter(r => r !== role) };
            } else {
                return { ...prev, roles: [...prev.roles, role] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await apiClient.put(`/users/${id}`, {
                name: userData.name,
                bio: userData.bio,
                roles: userData.roles
            });
            toast.success('User updated successfully');
            loadUser();
        } catch (error: any) {
            console.error('Failed to update user', error);
            toast.error(error.message || 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleBanUser = async () => {
        try {
            await apiClient.post(`/users/${id}/ban`, { duration: banDuration, reason: banReason });
            toast.success('User banned successfully');
            setIsBanModalOpen(false);
            loadUser();
        } catch (error: any) {
            console.error('Failed to ban user', error);
            toast.error(error.message || 'Failed to ban user');
        }
    };

    const handleDeactivateUser = async () => {
        try {
            await apiClient.post(`/users/${id}/deactivate`, {});
            toast.success('User deactivated successfully');
            setIsDeactivateModalOpen(false);
            loadUser();
        } catch (error: any) {
            console.error('Failed to deactivate user', error);
            toast.error(error.message || 'Failed to deactivate user');
        }
    };

    const handleReactivateUser = async () => {
        try {
            await apiClient.post(`/users/${id}/reactivate`, {});
            toast.success('User reactivated successfully');
            loadUser();
        } catch (error: any) {
            console.error('Failed to reactivate user', error);
            toast.error(error.message || 'Failed to reactivate user');
        }
    };

    if (authLoading || loading) {
        return <div className="p-10 flex justify-center">Loading...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
                <Link href="/admin/users" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Users
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit User</h1>
                        <p className="mt-1 text-sm text-gray-500">{userData.email}</p>
                    </div>
                    <div>
                        {userData.status === 'active' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                            </span>
                        )}
                        {userData.status === 'banned' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Banned {userData.banExpiresAt ? `until ${userData.banExpiresAt.toLocaleDateString()}` : '(Permanent)'}
                            </span>
                        )}
                        {userData.status === 'deactivated' && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Deactivated
                            </span>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={userData.name}
                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                                type="text"
                                value={userData.username}
                                disabled
                                className="mt-1 bg-gray-50 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2 text-gray-500"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                value={userData.bio}
                                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                                rows={3}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_ROLES.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => handleRoleChange(role)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium border ${userData.roles.includes(role)
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-gray-200 flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/users')}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'Save Changes' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Linked Entities Section */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900">Linked Entities</h2>
                </div>
                <div className="p-6 space-y-6">
                    {/* Brands */}
                    <EntitySection
                        title="Brands"
                        items={linkedEntities.brands}
                        onAdd={() => openLinkModal('brand')}
                        onRemove={(itemId) => openUnlinkModal('brand', itemId)}
                    />
                    {/* Stores */}
                    <EntitySection
                        title="Stores"
                        items={linkedEntities.stores}
                        onAdd={() => openLinkModal('store')}
                        onRemove={(itemId) => openUnlinkModal('store', itemId)}
                    />
                    {/* Suppliers */}
                    <EntitySection
                        title="Suppliers"
                        items={linkedEntities.suppliers}
                        onAdd={() => openLinkModal('supplier')}
                        onRemove={(itemId) => openUnlinkModal('supplier', itemId)}
                    />
                    {/* Pages */}
                    <EntitySection
                        title="Pages"
                        items={linkedEntities.pages}
                        onAdd={() => openLinkModal('page')}
                        onRemove={(itemId) => openUnlinkModal('page', itemId)}
                    />
                </div>
            </div>

            {/* Account Status Actions */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900">Account Status & Actions</h2>
                </div>
                <div className="p-6">
                    <div className="flex flex-wrap gap-4">
                        {userData.status === 'active' && (
                            <>
                                <button
                                    onClick={() => setIsDeactivateModalOpen(true)}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Deactivate Account
                                </button>
                                <button
                                    onClick={() => setIsBanModalOpen(true)}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Ban Account
                                </button>
                            </>
                        )}

                        {(userData.status === 'banned' || userData.status === 'deactivated') && (
                            <button
                                onClick={() => handleReactivateUser()}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Reactivate Account
                            </button>
                        )}
                        {userData.status === 'deactivated' && (
                            <button
                                onClick={() => setIsBanModalOpen(true)}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Ban Account
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Ban Modal */}
            <Dialog open={isBanModalOpen} onClose={() => setIsBanModalOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 shadow-xl">
                        <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                            Ban User
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-gray-500">
                            Select the duration for the ban.
                        </Dialog.Description>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2"
                                    value={banDuration}
                                    onChange={(e) => setBanDuration(e.target.value)}
                                >
                                    {BAN_DURATIONS.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm border p-2"
                                    rows={3}
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Violation of terms..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsBanModalOpen(false)}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBanUser}
                                className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                            >
                                Ban User
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Deactivate Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
                onConfirm={handleDeactivateUser}
                title="Deactivate User"
                message="Are you sure you want to deactivate this user? They will not be able to log in until reactivated."
                confirmText="Deactivate"
                cancelText="Cancel"
                variant="primary" // Just a standard action, but logically 'danger' warning is good also. Using primary for now as per previous modal style.
            />

            {/* Unlink Confirmation Modal */}
            <ConfirmationModal
                isOpen={unlinkModalState.isOpen}
                onClose={() => setUnlinkModalState({ ...unlinkModalState, isOpen: false })}
                onConfirm={confirmUnlinkEntity}
                title={`Unlink ${unlinkModalState.type ? unlinkModalState.type.charAt(0).toUpperCase() + unlinkModalState.type.slice(1) : ''}`}
                message={`Are you sure you want to unlink this ${unlinkModalState.type}?`}
                confirmText="Unlink"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Link Modal */}
            <Dialog open={linkModalState.isOpen} onClose={() => setLinkModalState({ ...linkModalState, isOpen: false })} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 shadow-xl w-full">
                        <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-blue-500" />
                            Link {linkModalState.type ? linkModalState.type.charAt(0).toUpperCase() + linkModalState.type.slice(1) : ''}
                        </Dialog.Title>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Select Entity</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                value={selectedEntityId}
                                onChange={(e) => setSelectedEntityId(e.target.value)}
                            >
                                <option value="">Select...</option>
                                {linkModalState.type && availableEntities[linkModalState.type === 'brand' ? 'brands' : `${linkModalState.type}s` as keyof typeof availableEntities]?.map((item: any) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name || item.brandInfo?.name || 'Unnamed'} {item.userId ? '(Already Linked)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setLinkModalState({ ...linkModalState, isOpen: false })}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLinkEntity}
                                disabled={!selectedEntityId}
                                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Link
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

        </div>
    );
}

function EntitySection({ title, items, onAdd, onRemove }: { title: string, items: any[], onAdd: () => void, onRemove: (id: string) => void }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">{title}</h3>
                <button onClick={onAdd} type="button" className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                    <PlusIcon className="h-3 w-3 mr-1" /> Add
                </button>
            </div>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map((item: any) => (
                        <span key={item.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.name || item.brandInfo?.name || 'Unnamed'}
                            <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="ml-1.5 inline-flex items-center justify-center text-blue-400 hover:text-blue-600 focus:outline-none"
                            >
                                <span className="sr-only">Remove</span>
                                <TrashIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} linked.</p>
            )}
        </div>
    );
}
