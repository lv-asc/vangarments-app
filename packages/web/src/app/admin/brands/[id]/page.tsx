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
import CollectionManagement from '@/components/admin/CollectionManagement';
import LookbookManagement from '@/components/admin/LookbookManagement';
import TeamManagement from '@/components/admin/TeamManagement';
import LogoUploader, { LogoItem } from '@/components/admin/LogoUploader';
import BannerUploader, { BannerItem } from '@/components/admin/BannerUploader';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils'; // Import getImageUrl

export default function AdminEditBrandPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const brandId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'skus' | 'lines' | 'collections' | 'lookbooks' | 'team'>('details');
    const [brand, setBrand] = useState<any>(null); // Store full brand object
    const [logos, setLogos] = useState<LogoItem[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);

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

            // Initialize Banners
            const mainBanner = loadedBrand.brandInfo.banner;
            const additionalBanners = loadedBrand.brandInfo.banners || [];

            // If we have a banners array, use it. If not, and we have a main banner, start with that.
            let initialBanners: BannerItem[] = [];

            if (additionalBanners.length > 0) {
                // Check if items are objects (new format) or strings (legacy)
                initialBanners = additionalBanners.map((b: any) => {
                    if (typeof b === 'string') {
                        return { url: b };
                    }
                    return b;
                });
            } else if (mainBanner) {
                initialBanners = [{ url: mainBanner }];
            }

            setBanners(initialBanners);

            // Initialize logos (Main Logo + Additional Logos)
            const mainLogoUrl = loadedBrand.brandInfo.logo;
            const additionalLogos = loadedBrand.profileData?.additionalLogos || [];
            const logoMetadata = loadedBrand.profileData?.logoMetadata || [];

            const allUrls = [
                mainLogoUrl,
                ...additionalLogos
            ].filter(Boolean) as string[];

            const logoItems: LogoItem[] = allUrls.map(url => {
                const meta = logoMetadata.find((m: any) => m.url === url);
                return {
                    url,
                    name: meta?.name || ''
                };
            });

            setLogos(logoItems);

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

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/[®™©]/g, '') // Remove trademarks
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start
            .replace(/-+$/, ''); // Trim - from end
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);

            const mainLogo = logos.length > 0 ? logos[0].url : '';
            const additionalLogos = logos.slice(1).map(l => l.url);
            const logoMetadata = logos.map(l => ({ url: l.url, name: l.name }));

            const mainBanner = banners.length > 0 ? banners[0].url : '';
            // Send full banner objects with alignment info, ensure main banner aligns with first item
            const bannersToSave = banners.map(b => ({
                url: b.url,
                positionY: b.positionY
            }));

            // Merge contact info with existing to prevent data loss (like address)
            const existingContactInfo = brand?.brandInfo?.contactInfo || {};
            const mergedContactInfo = {
                ...existingContactInfo,
                email: formData.contactEmail,
                phone: formData.contactPhone
            };

            // Generate slug
            const brandSlug = slugify(formData.brandName);

            // 1. Update Brand Info
            await brandApi.updateBrand(brandId, {
                brandInfo: {
                    name: formData.brandName,
                    slug: brandSlug, // Save Explicit Slug
                    description: formData.description,
                    website: formData.website,
                    country: formData.country,
                    tags: formData.tags,
                    contactInfo: mergedContactInfo,
                    logo: mainLogo,
                    banner: mainBanner,
                    banners: bannersToSave as any // Cast as any since strict typing might not perfectly match yet
                }
            });

            // 2. Update Profile Data (Additional Logos)
            await brandApi.updateProfileData(brandId, {
                additionalLogos: additionalLogos,
                logoMetadata: logoMetadata
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
        // Modal handles confirmation
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

    // Use explicit slug if available, otherwise compute it (fallback), otherwise ID
    const displaySlug = brand?.brandInfo?.slug || slugify(brand?.brandInfo?.name || '') || brandId;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/brands" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Brands
                </Link>
                <div className="flex space-x-3">
                    <a
                        href={`/brands/${displaySlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Brand
                    </a>
                </div>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Brand'}
                </button>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Brand"
            >
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete this brand? It will be moved to trash and can be restored later.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>


            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Edit Brand</h1>
                        <p className="mt-1 text-sm text-gray-500">Update brand details, lines, collections and official SKUs.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 overflow-x-auto">
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
                            onClick={() => setActiveTab('collections')}
                            className={`${activeTab === 'collections'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Collections
                        </button>
                        <button
                            onClick={() => setActiveTab('lookbooks')}
                            className={`${activeTab === 'lookbooks'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Lookbooks
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
                        <button
                            onClick={() => setActiveTab('team')}
                            className={`${activeTab === 'team'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Team
                        </button>
                    </nav>
                </div>

                {activeTab === 'details' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        <LogoUploader logos={logos} onChange={setLogos} />

                        {/* Banner Upload */}
                        <div className="space-y-4">
                            <BannerUploader
                                banners={banners}
                                onChange={setBanners}
                            />
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
                ) : activeTab === 'collections' ? (
                    <div className="p-6">
                        <CollectionManagement brandId={brandId} />
                    </div>
                ) : activeTab === 'lookbooks' ? (
                    <div className="p-6">
                        <LookbookManagement brandId={brandId} />
                    </div>
                ) : activeTab === 'team' ? ( // Team Tab Content
                    <div className="p-6">
                        <TeamManagement brandId={brandId} />
                    </div>
                ) : (
                    <div className="p-6">
                        <SKUManagement brandId={brandId} />
                    </div>
                )}
            </div>
        </div >
    );
}
