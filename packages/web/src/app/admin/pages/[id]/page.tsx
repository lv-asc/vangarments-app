'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { pageApi, IPage } from '@/lib/pageApi';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import PageTeamManagement from '@/components/admin/PageTeamManagement';

import LogoUploader, { LogoItem } from '@/components/admin/LogoUploader';
import BannerUploader, { BannerItem } from '@/components/admin/BannerUploader';
import SocialLinksEditor from '@/components/admin/SocialLinksEditor';
import FoundationDateInput from '@/components/ui/FoundationDateInput';
import { Modal } from '@/components/ui/Modal';
import { useEntityConfiguration } from '@/hooks/useEntityConfiguration';

export default function AdminEditPagePage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const pageId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'articles' | 'team'>('details');
    const [page, setPage] = useState<IPage | null>(null);
    const [logos, setLogos] = useState<LogoItem[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);

    // Entity configuration for dynamic features and labels
    const { hasFeature, getLabel, displayName } = useEntityConfiguration('page');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        websiteUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        facebookUrl: '',
        foundedBy: '',
        foundedDate: '',
        foundedDatePrecision: 'year' as 'year' | 'month' | 'day',
        isVerified: false,
        isActive: true,
        socialLinks: [] as { platform: string; url: string }[]
    });

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin') && pageId) {
            loadPage();
        }
    }, [user, authLoading, router, pageId]);

    // Update document title when page is loaded
    useEffect(() => {
        if (page?.name) {
            document.title = `Admin - Page @${page.name}`;
        }
    }, [page]);

    const loadPage = async () => {
        try {
            setLoading(true);
            const loadedPage = await pageApi.getPage(pageId);
            if (!loadedPage) {
                toast.error('Page not found');
                router.push('/admin/pages');
                return;
            }

            setPage(loadedPage);

            setFormData({
                name: loadedPage.name || '',
                slug: (loadedPage as any).slug || '',
                description: loadedPage.description || '',
                websiteUrl: loadedPage.websiteUrl || '',
                instagramUrl: loadedPage.instagramUrl || '',
                twitterUrl: loadedPage.twitterUrl || '',
                facebookUrl: loadedPage.facebookUrl || '',
                foundedBy: loadedPage.foundedBy || '',
                foundedDate: loadedPage.foundedDate || '',
                foundedDatePrecision: loadedPage.foundedDatePrecision || 'year',
                isVerified: loadedPage.isVerified,
                isActive: loadedPage.isActive,
                socialLinks: (loadedPage as any).socialLinks || []
            });

            // Initialize logo from metadata if available, fallback to logoUrl
            if (loadedPage.logoMetadata && loadedPage.logoMetadata.length > 0) {
                setLogos(loadedPage.logoMetadata);
            } else if (loadedPage.logoUrl) {
                setLogos([{ url: loadedPage.logoUrl, name: '' }]);
            } else {
                setLogos([]);
            }

            // Initialize banner from metadata if available, fallback to bannerUrl
            if (loadedPage.bannerMetadata && loadedPage.bannerMetadata.length > 0) {
                setBanners(loadedPage.bannerMetadata);
            } else if (loadedPage.bannerUrl) {
                setBanners([{ url: loadedPage.bannerUrl }]);
            } else {
                setBanners([]);
            }

        } catch (error) {
            console.error('Failed to load page', error);
            toast.error('Failed to load page details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

        try {
            setSaving(true);

            const mainLogo = logos.length > 0 ? logos[0].url : '';
            const mainBanner = banners.length > 0 ? banners[0].url : '';

            // Generate slug: Use manual input if provided, otherwise fallback to name-based
            const pageSlug = formData.slug ? slugify(formData.slug) : slugify(formData.name);

            await pageApi.update(page?.id || pageId, {
                name: formData.name,
                slug: pageSlug,
                description: formData.description,
                logoUrl: mainLogo,
                bannerUrl: mainBanner,
                logoMetadata: logos,
                bannerMetadata: banners,
                websiteUrl: formData.websiteUrl,
                instagramUrl: formData.instagramUrl,
                twitterUrl: formData.twitterUrl,
                facebookUrl: formData.facebookUrl,
                foundedBy: formData.foundedBy,
                foundedDate: formData.foundedDate,
                foundedDatePrecision: formData.foundedDate ? formData.foundedDatePrecision : undefined,
                isVerified: formData.isVerified,
                isActive: formData.isActive,
                socialLinks: formData.socialLinks
                    .filter(link => link.url && link.url.trim() !== '')
                    .map(({ platform, url }) => ({ platform, url })) // Strip id field
            });

            toast.success('Page updated successfully');

            // Reload to get fresh data
            loadPage();
        } catch (error: any) {
            console.error('Failed to update page', error);
            toast.error(error.message || 'Failed to update page');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await pageApi.delete(page?.id || pageId);
            toast.success('Page deleted');
            router.push('/admin/pages');
        } catch (error: any) {
            console.error('Failed to delete page', error);
            toast.error(error.message || 'Failed to delete page');
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || loading) return <div className="p-10 flex justify-center">Loading...</div>;

    const displaySlug = (page as any)?.slug || slugify(page?.name || '') || pageId;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/pages" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Pages
                </Link>
                <div className="flex space-x-3">
                    <a
                        href={`/pages/${displaySlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        View Page
                    </a>
                </div>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete Page'}
                </button>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Page"
            >
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete this page? This action cannot be undone.
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
                        <h1 className="text-xl font-bold text-gray-900">Edit Page</h1>
                        <p className="mt-1 text-sm text-gray-500">Update page details, articles and team members.</p>
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
                            onClick={() => setActiveTab('articles')}
                            className={`${activeTab === 'articles'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Articles
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
                                showNameInput={hasFeature('logoNames')}
                                emptyStateMessage="No logo uploaded yet"
                                helperText="Upload your page's logo image."
                            />
                        )}

                        {hasFeature('banners') && (
                            <div className="space-y-4">
                                <BannerUploader
                                    banners={banners}
                                    onChange={setBanners}
                                    label={getLabel('banners', 'label', `${displayName} Banners`)}
                                    buttonLabel={getLabel('banners', 'button', 'Upload Banner(s)')}
                                    emptyStateMessage="No banner uploaded yet"
                                    helperText="The banner will be displayed at the top of your page."
                                />
                            </div>
                        )}

                        {/* Page Info */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Page ID</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        value={page?.id || ''}
                                        readOnly
                                        className="block w-full px-3 py-2 rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Unique identifier for this page.
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Page Name *</label>
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
                                        /pages/
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

                            {/* Status checkboxes */}
                            <div className="col-span-2 flex items-center space-x-6">
                                <div className="flex items-center">
                                    <input
                                        id="isVerified"
                                        type="checkbox"
                                        checked={formData.isVerified}
                                        onChange={e => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-900">Verified</label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
                                </div>
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div className="border-t border-gray-200 pt-6">
                            <SocialLinksEditor
                                socialLinks={formData.socialLinks}
                                onChange={(links) => setFormData(prev => ({ ...prev, socialLinks: links }))}
                                label="Social Links"
                            />
                        </div>

                        <div className="pt-5 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => router.push('/admin/pages')}
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
                ) : activeTab === 'articles' ? (
                    <div className="p-6">
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium">Articles Management</p>
                            <p className="mt-2 text-sm">Coming soon - manage articles published by this page.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        {hasFeature('team') ? (
                            <PageTeamManagement pageId={pageId} />
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                Team Management not enabled for this page type.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
