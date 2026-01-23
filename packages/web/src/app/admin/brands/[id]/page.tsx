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
import { formatPhone } from '@/lib/masks';

import SKUManagement from '@/components/admin/SKUManagement';
import LineManagement from '@/components/admin/LineManagement';
import CollectionManagement from '@/components/admin/CollectionManagement';
import LookbookManagement from '@/components/admin/LookbookManagement';
import TeamManagement from '@/components/admin/TeamManagement';
import LogoUploader, { LogoItem } from '@/components/admin/LogoUploader';
import BannerUploader, { BannerItem } from '@/components/admin/BannerUploader';
import SocialLinksEditor from '@/components/admin/SocialLinksEditor';
import FoundationDateInput from '@/components/ui/FoundationDateInput';
import CountrySelector from '@/components/ui/CountrySelector';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { useEntityConfiguration } from '@/hooks/useEntityConfiguration';
import { useFormDraftPersistence } from '@/hooks/useFormDraftPersistence';

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
    const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);

    // Entity configuration for dynamic features and labels
    const { hasFeature, getLabel, displayName } = useEntityConfiguration('brand');

    const [formData, setFormData] = useState({
        brandName: '',
        slug: '', // Add slug to state
        description: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        country: '',
        tags: [] as string[],
        foundedBy: '',
        foundedDate: '',
        foundedDatePrecision: 'year' as 'year' | 'month' | 'day'
    });

    // Draft persistence
    const { clearDraft } = useFormDraftPersistence({
        storageKey: `brand-draft-${brandId || 'new'}`,
        data: formData,
        setData: setFormData,
        isLoading: loading,
        isNew: false,
        additionalData: { logos, banners, socialLinks },
        additionalSetters: { logos: setLogos, banners: setBanners, socialLinks: setSocialLinks }
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

    // Update document title when brand is loaded
    useEffect(() => {
        if (brand?.brandInfo?.name) {
            document.title = `Admin | Brand @${brand.brandInfo.name}`;
        }
    }, [brand]);

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
                slug: loadedBrand.brandInfo.slug || '', // Load existing slug
                description: loadedBrand.brandInfo.description || '',
                website: loadedBrand.brandInfo.website || '',
                contactEmail: loadedBrand.brandInfo.contactInfo?.email || '',
                contactPhone: loadedBrand.brandInfo.contactInfo?.phone || '',
                country: loadedBrand.brandInfo.country || '',
                tags: loadedBrand.brandInfo.tags || [],
                foundedBy: loadedBrand.profileData?.foundedBy || '',
                foundedDate: loadedBrand.profileData?.foundedDate || '',
                foundedDatePrecision: loadedBrand.profileData?.foundedDatePrecision || 'year'
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

            // Initialize social links
            if ((loadedBrand.profileData as any)?.socialLinks) {
                setSocialLinks((loadedBrand.profileData as any).socialLinks);
            }

        } catch (error) {
            console.error('Failed to load brand', error);
            toast.error('Failed to load brand details');
        } finally {
            setLoading(false);
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

        // Ensure we have a valid brand ID for updates
        const targetBrandId = brand?.id || brandId;

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

            // Generate slug: Use manual input if provided, otherwise fallback to name-based
            const brandSlug = formData.slug ? slugify(formData.slug) : slugify(formData.brandName);

            // 1. Update Brand Info
            await brandApi.updateBrand(targetBrandId, {
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

            // 2. Update Profile Data (Additional Logos + Foundation Info + Social Links)
            await brandApi.updateProfileData(targetBrandId, {
                additionalLogos: additionalLogos,
                logoMetadata: logoMetadata,
                foundedBy: formData.foundedBy || undefined,
                foundedDate: formData.foundedDate || undefined,
                foundedDatePrecision: formData.foundedDate ? formData.foundedDatePrecision : undefined,
                socialLinks: socialLinks.length > 0 ? socialLinks : undefined
            });

            toast.success('Brand updated successfully');
            clearDraft(); // Clear draft on success

            // If the slug changed, we might need to redirect, but for now just reload
            // If we have a slug, ensure the URL reflects it (even if we started with ID)
            if (brandSlug) {
                window.history.replaceState(null, '', `/admin/brands/${brandSlug}`);
            }

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
            // Ensure we use the UUID for deletion
            await brandApi.deleteBrand(brand?.id || brandId);
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
                        {hasFeature('lines') && (
                            <button
                                onClick={() => setActiveTab('lines')}
                                className={`${activeTab === 'lines'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Lines
                            </button>
                        )}
                        {hasFeature('collections') && (
                            <button
                                onClick={() => setActiveTab('collections')}
                                className={`${activeTab === 'collections'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Collections
                            </button>
                        )}
                        {hasFeature('lookbooks') && (
                            <button
                                onClick={() => setActiveTab('lookbooks')}
                                className={`${activeTab === 'lookbooks'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Lookbooks
                            </button>
                        )}
                        {hasFeature('skus') && (
                            <button
                                onClick={() => setActiveTab('skus')}
                                className={`${activeTab === 'skus'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                SKUs
                            </button>
                        )}
                        {hasFeature('team') && (
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`${activeTab === 'team'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Team
                            </button>
                        )}
                    </nav>
                </div>

                {activeTab === 'details' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {hasFeature('logos') && (
                            <LogoUploader
                                logos={logos}
                                onChange={setLogos}
                                label={getLabel('logos', 'label', `${displayName} Logos`)}
                                buttonLabel={getLabel('logos', 'button', 'Upload Logo(s)')}
                                showNameInput={hasFeature('logoNames')}
                            />
                        )}

                        {hasFeature('banners') && (
                            <div className="space-y-4">
                                <BannerUploader
                                    banners={banners}
                                    onChange={setBanners}
                                    label={getLabel('banners', 'label', `${displayName} Banners`)}
                                    buttonLabel={getLabel('banners', 'button', 'Upload Banner(s)')}
                                />
                            </div>
                        )}

                        {/* Brand Info */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Brand ID</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        value={brand?.id || ''}
                                        readOnly
                                        className="block w-full px-3 py-2 rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Unique identifier for this brand. Useful for distinguishing duplicate names.
                                    </p>
                                </div>
                            </div>

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
                                <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        /brands/
                                    </span>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder={slugify(formData.brandName)}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 border"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    The URL-friendly version of the name. e.g. <code>my-brand-name</code>. Leave empty to auto-generate.
                                </p>
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

                            {/* Country Field */}
                            <div>
                                <CountrySelector
                                    value={formData.country}
                                    onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                                />
                            </div>

                            {/* Founded By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Founded by</label>
                                <input
                                    type="text"
                                    name="foundedBy"
                                    value={formData.foundedBy}
                                    onChange={handleChange}
                                    placeholder="e.g., John Smith, Jane Doe"
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                />
                            </div>

                            {/* Date of Foundation */}
                            <div>
                                <FoundationDateInput
                                    value={formData.foundedDate}
                                    precision={formData.foundedDatePrecision}
                                    onChange={(date, precision) => setFormData(prev => ({ ...prev, foundedDate: date, foundedDatePrecision: precision }))}
                                    label="Date of Foundation"
                                />
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

                        {/* Social Links */}
                        {hasFeature('socialLinks') && (
                            <SocialLinksEditor
                                socialLinks={socialLinks}
                                onChange={setSocialLinks}
                            />
                        )}

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
                        <LineManagement brandId={brand?.id || brandId} />
                    </div>
                ) : activeTab === 'collections' ? (
                    <div className="p-6">
                        <CollectionManagement brandId={brand?.id || brandId} />
                    </div>
                ) : activeTab === 'lookbooks' ? (
                    <div className="p-6">
                        <LookbookManagement brandId={brand?.id || brandId} />
                    </div>
                ) : activeTab === 'team' ? ( // Team Tab Content
                    <div className="p-6">
                        <TeamManagement brandId={brand?.id || brandId} />
                    </div>
                ) : (
                    <div className="p-6">
                        <SKUManagement brandId={brand?.id || brandId} />
                    </div>
                )}
            </div>
        </div >
    );
}
