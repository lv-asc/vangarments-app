'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { brandApi } from '@/lib/brandApi';
import { apiClient } from '@/lib/api';
import { formatPhone } from '@/lib/masks';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { COUNTRIES, BRAND_TAGS } from '@/lib/constants';
import CountrySelector from '@/components/ui/CountrySelector';
import { useFormDraftPersistence } from '@/hooks/useFormDraftPersistence';

export default function AdminNewStorePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [query, setQuery] = useState('');

    const [formData, setFormData] = useState({
        userId: '',
        brandName: '',
        description: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        businessType: 'store', // Force 'store' type
        partnershipTier: 'basic',
        country: '',
        tags: [] as string[]
    });

    // Draft persistence
    const { clearDraft } = useFormDraftPersistence({
        storageKey: 'store-draft-new',
        data: formData,
        setData: setFormData,
        isLoading: loadingUsers,
        isNew: true
    });

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            loadUsers();
        }
    }, [user, authLoading, router]);

    // Update formData when selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            setFormData(prev => ({
                ...prev,
                userId: selectedUser.id
            }));
        }
    }, [selectedUser]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await apiClient.get('/users?limit=1000') as any;
            const userList = response.data?.users || response.users || [];

            // Filter out deactivated users
            const activeUsers = userList.filter((u: any) => u.status === 'active' || !u.status);

            setUsers(activeUsers);
        } catch (error) {
            console.error('Failed to load users', error);
            toast.error('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'contactPhone') {
            formattedValue = formatPhone(value);
        }
        setFormData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleTagChange = (tag: string) => {
        setFormData(prev => {
            const currentTags = prev.tags || [];
            if (currentTags.includes(tag)) {
                return { ...prev, tags: currentTags.filter(t => t !== tag) };
            } else {
                return { ...prev, tags: [...currentTags, tag] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.userId) {
            toast.error('Please select a user owner');
            return;
        }
        if (!formData.brandName) {
            toast.error('Store name is required');
            return;
        }

        try {
            setLoading(true);
            await brandApi.adminCreateBrand({
                userId: formData.userId,
                brandInfo: {
                    name: formData.brandName,
                    description: formData.description,
                    website: formData.website,
                    country: formData.country,
                    tags: formData.tags,
                    contactInfo: {
                        email: formData.contactEmail,
                        phone: formData.contactPhone
                    }
                },
                businessType: 'store', // Explicitly set to store
                partnershipTier: formData.partnershipTier as any
            });

            toast.success('Store created successfully');
            clearDraft(); // Clear draft on success
            router.push('/admin/stores');
        } catch (error: any) {
            console.error('Failed to create store', error);
            toast.error(error.message || 'Failed to create store');
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers =
        query === ''
            ? users
            : users.filter((u) => {
                const searchStr = `${u.name || ''} ${u.email || ''}`.toLowerCase();
                return searchStr.includes(query.toLowerCase());
            });

    if (authLoading) return <div className="p-10 flex justify-center">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
                <Link href="/admin/stores" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Stores
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Create New Store</h1>
                    <p className="mt-1 text-sm text-gray-500">Register a new store account for a user.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* User Selection */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner (User) *</label>
                        <Combobox as="div" value={selectedUser} onChange={setSelectedUser}>
                            <div className="relative mt-1">
                                <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 sm:text-sm">
                                    <Combobox.Input
                                        className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                        displayValue={(user: any) => user ? `${user.name || 'Unknown'} (${user.email})` : ''}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search for a user..."
                                    />
                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </Combobox.Button>
                                </div>
                                <Transition
                                    as={Fragment as any}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                    afterLeave={() => setQuery('')}
                                >
                                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {filteredUsers.length === 0 && query !== '' ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Nothing found.</div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <Combobox.Option
                                                    key={user.id}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-900'}`
                                                    }
                                                    value={user}
                                                >
                                                    {({ selected, active }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                {user.name || 'Unknown'} <span className={`text-xs ${active ? 'text-blue-200' : 'text-gray-500'}`}>({user.email})</span>
                                                            </span>
                                                            {selected ? (
                                                                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'}`}>
                                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))
                                        )}
                                    </Combobox.Options>
                                </Transition>
                            </div>
                        </Combobox>
                        <p className="mt-1 text-xs text-gray-500">Select the user who will own this store account.</p>
                    </div>

                    {/* Brand Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Store Name *</label>
                            <input
                                type="text"
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                required
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Website</label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        {/* Country Field */}
                        <div>
                            <CountrySelector
                                value={formData.country}
                                onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Partnership Tier</label>
                            <select
                                name="partnershipTier"
                                value={formData.partnershipTier}
                                onChange={handleChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                            >
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                            <input
                                type="tel"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                            />
                        </div>

                        {/* Tags Field */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {BRAND_TAGS.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagChange(tag)}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${formData.tags.includes(tag)
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tag} {formData.tags.includes(tag) && <CheckIcon className="ml-1.5 h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Select categories relevant to this store.</p>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-gray-200 flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/stores')}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Creating...' : 'Create Store'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
