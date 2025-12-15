'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { COUNTRIES, BRAND_TAGS } from '@/lib/constants';
import { CheckIcon } from '@heroicons/react/20/solid';

import SKUManagement from '@/components/admin/SKUManagement';
import LineManagement from '@/components/admin/LineManagement';
import LogoUploader from '@/components/admin/LogoUploader';

export default function AdminEditBrandPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const brandId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'skus' | 'lines'>('details');
    const [brand, setBrand] = useState<any>(null); // Store full brand object

    const [logos, setLogos] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        brandName: '',
        description: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        country: '',
        tags: [] as string[]
    });

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin') && brandId) {
            loadBrand();
        }
    }, [user, authLoading, router, brandId]);

    const loadBrand = async () => {
        try {
            setLoading(true);
            const loadedBrand = await brandApi.getBrand(brandId);

            if (!loadedBrand) {
                toast.error('Brand not found');
                router.push('/admin/brands');
                return;
            }

            setBrand(loadedBrand);

            setFormData({
                brandName: loadedBrand.brandInfo.name || '',
                description: loadedBrand.brandInfo.description || '',
                website: loadedBrand.brandInfo.website || '',
                contactEmail: loadedBrand.brandInfo.contactInfo?.email || '',
                contactPhone: loadedBrand.brandInfo.contactInfo?.phone || '',
                country: loadedBrand.brandInfo.country || '',
                tags: loadedBrand.brandInfo.tags || []
            });

            // Initialize logos (Main Logo + Additional Logos)
            const allLogos = [
                loadedBrand.brandInfo.logo,
                ...(loadedBrand.profileData?.additionalLogos || [])
            ].filter(Boolean) as string[];
            setLogos(allLogos);

        } catch (error) {
            console.error('Failed to load brand', error);
            toast.error('Failed to load brand details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        try {
            setSaving(true);

            const mainLogo = logos[0] || '';
            const additionalLogos = logos.slice(1);

            // Merge contact info with existing to prevent data loss (like address)
            const existingContactInfo = brand?.brandInfo?.contactInfo || {};
            const mergedContactInfo = {
                ...existingContactInfo,
                email: formData.contactEmail,
                phone: formData.contactPhone
            };

            // 1. Update Brand Info
            await brandApi.updateBrand(brandId, {
                brandInfo: {
                    name: formData.brandName,
                    description: formData.description,
                    website: formData.website,
                    country: formData.country,
                    tags: formData.tags,
                    contactInfo: mergedContactInfo,
                    logo: mainLogo
                }
            });

            // 2. Update Profile Data (Additional Logos)
            await brandApi.updateProfileData(brandId, {
                additionalLogos: additionalLogos
            });

            toast.success('Brand updated successfully');
            // Refresh brand data to ensure state is in sync
            loadBrand();
        } catch (error: any) {
            console.error('Failed to update brand', error);
            toast.error(error.message || 'Failed to update brand');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this brand? It will be moved to trash.')) {
            return;
        }

        try {
            setDeleting(true);
            await brandApi.deleteBrand(brandId);
            toast.success('Brand moved to trash');
            router.push('/admin/brands');
        } catch (error: any) {
            console.error('Failed to delete brand', error);
            toast.error(error.message || 'Failed to delete brand');
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || loading) return <div className="p-10 flex justify-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/brands" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Brands
                </Link>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Brand'}
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Brand</h1>
                        <p className="mt-1 text-sm text-gray-500">Update brand details, lines, and official SKUs.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex px-6 space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`${activeTab === 'details'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setActiveTab('lines')}
                            className={`${activeTab === 'lines'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Lines
                        </button>
                        <button
                            onClick={() => setActiveTab('skus')}
                            className={`${activeTab === 'skus'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            SKUs
                        </button>
                    </nav>
                </div>

                {activeTab === 'details' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        <LogoUploader logos={logos} onChange={setLogos} />

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

                            {/* Country Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country of Origin</label>
                                <div className="mt-1 relative">
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                                    >
                                        <option value="">Select a country</option>
                                        {COUNTRIES.map((c) => (
                                            <option key={c.code} value={c.name}>
                                                {c.flag} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                disabled={saving}
                                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : activeTab === 'lines' ? (
                    <div className="p-6">
                        <LineManagement brandId={brandId} />
                    </div>
                ) : (
                    <div className="p-6">
                        <SKUManagement brandId={brandId} />
                    </div>
                )}
            </div>
        </div>
    );
}
