'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { brandApi } from '@/lib/brandApi';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AdminNewBrandPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [formData, setFormData] = useState({
        userId: '',
        brandName: '',
        description: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        businessType: 'brand',
        partnershipTier: 'basic'
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

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await apiClient.get('/users?limit=100') as any; // Simple list for now, ideally search
            // Handle different response structures if necessary
            const userList = response.data?.users || response.users || [];
            // Filter users who are NOT brand owners maybe? Backend checks this anyway.
            setUsers(userList);
        } catch (error) {
            console.error('Failed to load users', error);
            toast.error('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.userId) {
            toast.error('Please select a user owner');
            return;
        }
        if (!formData.brandName) {
            toast.error('Brand name is required');
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
                    contactInfo: {
                        email: formData.contactEmail,
                        phone: formData.contactPhone
                    }
                },
                partnershipTier: formData.partnershipTier as any
            });

            toast.success('Brand created successfully');
            router.push('/admin/brands');
        } catch (error: any) {
            console.error('Failed to create brand', error);
            toast.error(error.message || 'Failed to create brand');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="p-10 flex justify-center">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6">
                <Link href="/admin/brands" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Brands
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Create New Brand</h1>
                    <p className="mt-1 text-sm text-gray-500">Register a new brand account for a user.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* User Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Owner (User) *</label>
                        <select
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                        >
                            <option value="">Select a user...</option>
                            {users.map((u: any) => (
                                <option key={u.id} value={u.id}>
                                    {u.name || u.email} ({u.email})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Select the user who will own this brand account.</p>
                    </div>

                    {/* Brand Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Brand Name *</label>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Business Type</label>
                            <select
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                            >
                                <option value="brand">Brand</option>
                                <option value="store">Store</option>
                                <option value="designer">Designer</option>
                                <option value="manufacturer">Manufacturer</option>
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
                    </div>

                    <div className="pt-5 border-t border-gray-200 flex justify-end">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/brands')}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Creating...' : 'Create Brand'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
