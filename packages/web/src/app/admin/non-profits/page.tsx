'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { brandApi } from '../../../lib/brandApi';
import { useAuth } from '../../../contexts/AuthWrapper';
import { PlusIcon, TrashIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function AdminNonProfitsPage() {
    const { user } = useAuth();
    const [nonProfits, setNonProfits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        website: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadNonProfits();
    }, [debouncedSearch]);

    const loadNonProfits = async () => {
        try {
            setLoading(true);
            const data = await brandApi.getBrands({
                search: debouncedSearch,
                businessType: 'non_profit',
                limit: 50
            });
            // Additional client-side filter just in case API returns mixed types if parameter wasn't handled on backend yet (though I updated backend logic in my head/previous steps... wait, checking BrandAccountModel.findMany in Step 370. Yes, it has businessType filter logic).
            const filtered = data.filter(b => b.brandInfo?.businessType === 'non_profit');
            setNonProfits(filtered);
        } catch (error) {
            console.error('Failed to load non-profits', error);
            toast.error('Failed to load non-profits');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user) return;

            await brandApi.adminCreateBrand({
                userId: user.id, // Assign to current admin for now, or could handle differently
                brandInfo: {
                    name: createForm.name,
                    description: createForm.description,
                    website: createForm.website,
                    contactInfo: {
                        email: createForm.email,
                        phone: createForm.phone
                    }
                },
                businessType: 'non_profit',
                partnershipTier: 'basic'
            });

            toast.success('Non-Profit Organization created successfully');
            setShowCreateModal(false);
            setCreateForm({ name: '', description: '', website: '', email: '', phone: '' });
            loadNonProfits();
        } catch (error: any) {
            console.error('Failed to create non-profit', error);
            toast.error(error.message || 'Failed to create Non-Profit');
        }
    };

    // Hack to bypass framer-motion type issues in this file
    const MotionDiv = motion.div as any;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Non-Profit Organizations</h1>
                    <p className="text-sm text-gray-500">Manage apparel donation partners</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Non-Profit
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 max-w-md">
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                        placeholder="Search non-profits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10">Loading...</div>
            ) : nonProfits.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {nonProfits.map((npo) => (
                        <div key={npo.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                            <div className="h-32 bg-gray-100 relative">
                                {npo.brandInfo.banner && (
                                    <img
                                        src={getImageUrl(npo.brandInfo.banner)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute -bottom-6 left-6">
                                    <div className="h-16 w-16 rounded-lg bg-white p-1 shadow border border-gray-200">
                                        {npo.brandInfo.logo ? (
                                            <img
                                                src={getImageUrl(npo.brandInfo.logo)}
                                                alt={npo.brandInfo.name}
                                                className="w-full h-full object-contain rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-xl">
                                                {npo.brandInfo.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-8 px-6 pb-6">
                                <h3 className="text-lg font-medium text-gray-900">{npo.brandInfo.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[2.5rem]">
                                    {npo.brandInfo.description || 'No description'}
                                </p>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${npo.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {npo.verificationStatus}
                                    </span>
                                    <Link
                                        href={`/admin/brands/${npo.id}`} // Reusing Brand Edit page as it handles generic brandInfo
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                    >
                                        <PencilSquareIcon className="h-4 w-4 mr-1" />
                                        Edit
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No Non-Profit Organizations found.</p>
                </div>
            )}

            {/* Create Modal */}
            {/* @ts-expect-error AnimatePresence type mismatch */}
            <AnimatePresence>
                {showCreateModal && (
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <MotionDiv
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-4">Add Non-Profit Organization</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                        value={createForm.name}
                                        onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                        rows={3}
                                        value={createForm.description}
                                        onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Website</label>
                                    <input
                                        type="url"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                        value={createForm.website}
                                        onChange={e => setCreateForm({ ...createForm, website: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                            value={createForm.email}
                                            onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input
                                            type="tel"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                            value={createForm.phone}
                                            onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Create NPO
                                    </button>
                                </div>
                            </form>
                        </MotionDiv>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
}
