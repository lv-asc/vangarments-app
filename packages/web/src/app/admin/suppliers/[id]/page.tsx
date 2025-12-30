'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { COUNTRIES, BRAND_TAGS } from '@/lib/constants';
import CountrySelector from '@/components/ui/CountrySelector';
import { CheckIcon } from '@heroicons/react/20/solid';
import { formatPhone } from '@/lib/masks';

import TeamManagement from '@/components/admin/TeamManagement';
import LogoUploader, { LogoItem } from '@/components/admin/LogoUploader';
import BannerUploader, { BannerItem } from '@/components/admin/BannerUploader';
import SocialLinksEditor from '@/components/admin/SocialLinksEditor';
import FoundationDateInput from '@/components/ui/FoundationDateInput';
import { Modal } from '@/components/ui/Modal';
import { useEntityConfiguration } from '@/hooks/useEntityConfiguration';

export default function AdminEditSupplierPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const supplierId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'team'>('details');
    const [supplier, setSupplier] = useState<any>(null);
    const [logos, setLogos] = useState<LogoItem[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);

    // Entity configuration for dynamic features and labels
    const { hasFeature, getLabel, displayName } = useEntityConfiguration('supplier');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        country: '',
        tags: [] as string[],
        foundedBy: '',
        foundedDate: '',
        foundedDatePrecision: 'year' as 'year' | 'month' | 'day',
        socialLinks: [] as { platform: string; url: string }[]
    });

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin') && supplierId) {
            loadSupplier();
        }
    }, [user, authLoading, router, supplierId]);

    // Update document title when supplier is loaded
    useEffect(() => {
        if (supplier?.brandInfo?.name) {
            document.title = `Admin - Supplier @${supplier.brandInfo.name}`;
        }
    }, [supplier]);

    const loadSupplier = async () => {
        try {
            setLoading(true);
            const loadedSupplier = await brandApi.getBrand(supplierId);
            if (!loadedSupplier) {
                toast.error('Supplier not found');
                router.push('/admin/suppliers');
                return;
            }

            setSupplier(loadedSupplier);

            setFormData({
                name: loadedSupplier.brandInfo.name || '',
                slug: loadedSupplier.brandInfo.slug || '',
                description: loadedSupplier.brandInfo.description || '',
                website: loadedSupplier.brandInfo.website || '',
                contactEmail: loadedSupplier.brandInfo.contactInfo?.email || '',
                contactPhone: loadedSupplier.brandInfo.contactInfo?.phone || '',
                country: loadedSupplier.brandInfo.country || '',
                tags: loadedSupplier.brandInfo.tags || [],
                foundedBy: loadedSupplier.profileData?.foundedBy || '',
                foundedDate: loadedSupplier.profileData?.foundedDate || '',
                foundedDatePrecision: loadedSupplier.profileData?.foundedDatePrecision || 'year',
                socialLinks: loadedSupplier.brandInfo.socialLinks || []
            });

            // Initialize Banners
            const mainBanner = loadedSupplier.brandInfo.banner;
            const additionalBanners = loadedSupplier.brandInfo.banners || [];

            let initialBanners: BannerItem[] = [];
            if (additionalBanners.length > 0) {
                initialBanners = additionalBanners.map((b: any) => {
                    if (typeof b === 'string') return { url: b };
                    return b;
                });
            } else if (mainBanner) {
                initialBanners = [{ url: mainBanner }];
            }
            setBanners(initialBanners);

            // Initialize logos
            const mainLogoUrl = loadedSupplier.brandInfo.logo;
            const additionalLogos = loadedSupplier.profileData?.additionalLogos || [];
            const logoMetadata = loadedSupplier.profileData?.logoMetadata || [];

            const allUrls = [mainLogoUrl, ...additionalLogos].filter(Boolean) as string[];
            const logoItems: LogoItem[] = allUrls.map(url => {
                const meta = logoMetadata.find((m: any) => m.url === url);
                return { url, name: meta?.name || '' };
            });
            setLogos(logoItems);

        } catch (error) {
            console.error('Failed to load supplier', error);
            toast.error('Failed to load supplier details');
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
            .replace(/[®™©]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const targetId = supplier?.id || supplierId;

        try {
            setSaving(true);

            const mainLogo = logos.length > 0 ? logos[0].url : '';
            const additionalLogos = logos.slice(1).map(l => l.url);
            const logoMetadata = logos.map(l => ({ url: l.url, name: l.name }));

            const mainBanner = banners.length > 0 ? banners[0].url : '';
            const bannersToSave = banners.map(b => ({ url: b.url, positionY: b.positionY }));

            const existingContactInfo = supplier?.brandInfo?.contactInfo || {};
            const mergedContactInfo = {
                ...existingContactInfo,
                email: formData.contactEmail,
                phone: formData.contactPhone
            };

            const supplierSlug = formData.slug ? slugify(formData.slug) : slugify(formData.name);

            await brandApi.updateBrand(targetId, {
                brandInfo: {
                    name: formData.name,
                    slug: supplierSlug,
                    description: formData.description,
                    website: formData.website,
                    country: formData.country,
                    tags: formData.tags,
                    contactInfo: mergedContactInfo,
                    logo: mainLogo,
                    banner: mainBanner,
                    banners: bannersToSave as any,
                    socialLinks: formData.socialLinks
                        .filter(link => link.url && link.url.trim() !== '')
                        .map(({ platform, url }) => ({ platform, url })) // Strip id field
                }
            });

            await brandApi.updateProfileData(targetId, {
                additionalLogos: additionalLogos,
                logoMetadata: logoMetadata,
                foundedBy: formData.foundedBy || undefined,
                foundedDate: formData.foundedDate || undefined,
                foundedDatePrecision: formData.foundedDate ? formData.foundedDatePrecision : undefined
            });

            toast.success('Supplier updated successfully');

            if (supplierSlug) {
                window.history.replaceState(null, '', `/admin/suppliers/${supplierSlug}`);
            }

            loadSupplier();
        } catch (error: any) {
            console.error('Failed to update supplier', error);
            toast.error(error.message || 'Failed to update supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await brandApi.deleteBrand(supplier?.id || supplierId);
            toast.success('Supplier moved to trash');
            router.push('/admin/suppliers');
        } catch (error: any) {
            console.error('Failed to delete supplier', error);
            toast.error(error.message || 'Failed to delete supplier');
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || loading) return <div className="p-10 flex justify-center">Loading...</div>;

    const displaySlug = supplier?.brandInfo?.slug || slugify(supplier?.brandInfo?.name || '') || supplierId;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/suppliers" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Suppliers
                </Link>
                <div className="flex space-x-3">
                    <a
                        href={`/suppliers/${displaySlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Supplier
                    </a>
                </div>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Supplier'}
                </button>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Supplier"
            >
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete this supplier? It will be moved to trash.
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
                        <h1 className="text-xl font-bold text-gray-900">Edit Supplier</h1>
                        <p className="mt-1 text-sm text-gray-500">Update supplier profile and details.</p>
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

                        {hasFeature('logos') && (
                            <LogoUploader
                                logos={logos}
                                onChange={setLogos}
                                label={getLabel('logos', 'label', `${displayName} Logos`)}
                                buttonLabel={getLabel('logos', 'button', 'Upload Logo(s)')}
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

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Supplier ID</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        value={supplier?.id || ''}
                                        readOnly
                                        className="block w-full px-3 py-2 rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm shadow-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        /suppliers/
                                    </span>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder={slugify(formData.name)}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 border"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    The URL-friendly version of the name. Leave empty to auto-generate.
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

                            <div>
                                <CountrySelector
                                    value={formData.country}
                                    onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                                    label="Country"
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

                            {/* Social Links */}
                            <div className="col-span-2 border-t pt-6">
                                <SocialLinksEditor
                                    socialLinks={formData.socialLinks}
                                    onChange={(links) => setFormData(prev => ({ ...prev, socialLinks: links }))}
                                    label="Social Links"
                                />
                            </div>
                        </div>

                        <div className="pt-5 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => router.push('/admin/suppliers')}
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
                ) : activeTab === 'team' ? (
                    <div className="p-6">
                        <TeamManagement brandId={supplier?.id || supplierId} />
                    </div>
                ) : null}
            </div>
        </div >
    );
}
