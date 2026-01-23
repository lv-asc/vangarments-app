'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrashIcon, CloudArrowUpIcon, PhotoIcon, CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SPORT_ORG_TYPES } from '@vangarments/shared/constants';
import { SportOrg, SportOrgType } from '@vangarments/shared/types';
import CountrySelect from '@/components/ui/CountrySelect';
import { Modal } from '@/components/ui/Modal';
import { getImageUrl } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import LogoUploader from '@/components/admin/LogoUploader';
import BannerUploader, { BannerItem } from '@/components/admin/BannerUploader';
import SocialLinksEditor from '@/components/admin/SocialLinksEditor';
import FoundationDateInput from '@/components/ui/FoundationDateInput';
import { formatPhone } from '@/lib/masks';

interface SportOrgEditorProps {
    orgId?: string; // If undefined, we are in "Create" mode
}

export default function SportOrgEditor({ orgId }: SportOrgEditorProps) {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const isNew = !orgId;
    const STORAGE_KEY = `sport-org-draft-${orgId || 'new'}`;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'departments' | 'squads'>('details');

    const [formData, setFormData] = useState<Partial<SportOrg>>({
        name: '',
        slug: '',
        orgType: 'professional_club',
        foundedCountry: '',
        foundedDate: '',
        foundedBy: '',
        website: '',
        description: '',
        masterLogo: '',
        banner: '',
        banners: [],
        contactInfo: {
            email: '',
            phone: '',
            address: ''
        },
        socialLinks: []
    });

    const [logos, setLogos] = useState<{ url: string, name: string }[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (orgId && user?.roles?.includes('admin')) {
            loadOrg();
        }
    }, [user, authLoading, router, orgId]);

    // --- localStorage Persistence ---
    // Save draft to localStorage whenever form state changes
    useEffect(() => {
        if (loading) return; // Don't save while loading from server
        const draft = { formData, logos, banners, socialLinks };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        } catch (e) {
            console.warn('Failed to save draft to localStorage', e);
        }
    }, [formData, logos, banners, socialLinks, loading, STORAGE_KEY]);

    // Restore draft from localStorage on mount (only for new orgs or if no server data)
    useEffect(() => {
        if (!isNew) return; // For existing orgs, always load from server
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const draft = JSON.parse(saved);
                if (draft.formData) setFormData(draft.formData);
                if (draft.logos) setLogos(draft.logos);
                if (draft.banners) setBanners(draft.banners);
                if (draft.socialLinks) setSocialLinks(draft.socialLinks);
                toast.success('Restored unsaved draft', { id: 'draft-restored', duration: 3000 });
            }
        } catch (e) {
            console.warn('Failed to restore draft from localStorage', e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNew]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
    };

    const loadOrg = async () => {
        try {
            setLoading(true);
            const data = await sportOrgApi.getOrg(orgId!);
            setFormData(data);

            // Initialize Logos
            if (data.masterLogo) {
                setLogos([{ url: data.masterLogo, name: 'Main Logo' }]);
            } else {
                setLogos([]);
            }

            // Initialize Banners
            const initialBanners = data.banners?.length
                ? data.banners.map(b => typeof b === 'string' ? { url: b } : b)
                : data.banner ? [{ url: data.banner }] : [];
            setBanners(initialBanners);

            // Initialize Social Links
            if (data.socialLinks) {
                setSocialLinks(data.socialLinks);
            }
        } catch (error) {
            console.error('Failed to load org', error);
            toast.error('Failed to load organization');
            router.push('/admin/sport-orgs');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (newLogos: any[]) => {
        const normalized = newLogos.map(l => typeof l === 'string' ? { url: l, name: '' } : l);
        setLogos(normalized);
        setFormData(prev => ({
            ...prev,
            masterLogo: normalized.length > 0 ? normalized[0].url : ''
        }));
    };

    const handleBannerChange = (newBanners: BannerItem[]) => {
        setBanners(newBanners);
        setFormData(prev => ({
            ...prev,
            banner: newBanners.length > 0 ? newBanners[0].url : '',
            banners: newBanners
        }));
    };

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setFormData(prev => ({
            ...prev,
            name,
            slug: isNew ? slug : prev.slug
        }));
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'phone') formattedValue = formatPhone(value);

        setFormData(prev => ({
            ...prev,
            contactInfo: {
                ...prev.contactInfo,
                [name]: formattedValue
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);

            const finalSlug = formData.slug || formData.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';

            const payload = {
                ...formData,
                socialLinks: socialLinks,
                logoMetadata: logos.map(l => ({ url: l.url, name: l.name })),
                slug: finalSlug
            };

            if (!payload.name || !payload.slug) {
                toast.error('Name and Slug are required');
                return;
            }

            if (isNew) {
                const created = await sportOrgApi.createOrg(payload);
                toast.success('Organization created');
                clearDraft();
                // Redirect to slug-based URL
                router.push(`/admin/sport-orgs/${created.slug || created.id}`);
            } else {
                await sportOrgApi.updateOrg(orgId!, payload);
                toast.success('Organization updated');
                clearDraft();
                // Update URL to use slug if it changed
                if (finalSlug && window.location.pathname !== `/admin/sport-orgs/${finalSlug}`) {
                    window.history.replaceState(null, '', `/admin/sport-orgs/${finalSlug}`);
                }
                loadOrg();
            }
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Failed to save organization');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!orgId) return;
        try {
            setDeleting(true);
            await sportOrgApi.deleteOrg(orgId);
            toast.success('Organization deleted');
            router.push('/admin/sport-orgs');
        } catch (error) {
            toast.error('Failed to delete organization');
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || loading) return <div className="p-10 flex justify-center text-gray-400">Loading Organization...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/sport-orgs" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to Organizations
                </Link>
                {!isNew && (
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={deleting}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Org
                    </button>
                )}
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Organization"
            >
                <div className="p-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to delete this organization? This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">{isNew ? 'New Organization' : 'Edit Organization'}</h1>
                    <p className="mt-1 text-sm text-gray-500">Update organization details, departments, and squads.</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 overflow-x-auto">
                    <nav className="-mb-px flex px-6 space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Details
                        </button>
                        {!isNew && (
                            <>
                                <button
                                    onClick={() => setActiveTab('departments')}
                                    className={`${activeTab === 'departments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Departments
                                </button>
                                <button
                                    onClick={() => setActiveTab('squads')}
                                    className={`${activeTab === 'squads' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Squads
                                </button>
                            </>
                        )}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'details' && (
                        <form onSubmit={handleSubmit} className="space-y-8">

                            <LogoUploader
                                logos={logos}
                                onChange={handleLogoChange}
                                label="Organization Logos"
                                buttonLabel="Upload Logo(s)"
                                maxItems={1}
                            />

                            <BannerUploader
                                banners={banners}
                                onChange={handleBannerChange}
                                label="Organization Banners"
                                buttonLabel="Upload Banner(s)"
                            />

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {!isNew && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Sport ORG ID</label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                value={orgId}
                                                readOnly
                                                className="block w-full px-3 py-2 rounded-md border-gray-300 bg-gray-50 text-gray-400 sm:text-sm shadow-sm cursor-not-allowed border"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                        placeholder="e.g. SE Palmeiras"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                            /sport-orgs/
                                        </span>
                                        <input
                                            required
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 border"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                                    <select
                                        required
                                        value={formData.orgType}
                                        onChange={(e) => setFormData({ ...formData, orgType: e.target.value as SportOrgType })}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                                    >
                                        {SPORT_ORG_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Country of Origin</label>
                                    <div className="mt-1">
                                        <CountrySelect
                                            value={formData.foundedCountry}
                                            onChange={(val) => setFormData(prev => ({ ...prev, foundedCountry: val }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Founded by</label>
                                    <input
                                        type="text"
                                        value={formData.foundedBy || ''}
                                        onChange={(e) => setFormData({ ...formData, foundedBy: e.target.value })}
                                        placeholder="Founders names"
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                    />
                                </div>

                                <div>
                                    <FoundationDateInput
                                        value={formData.foundedDate || ''}
                                        onChange={(date) => setFormData(prev => ({ ...prev, foundedDate: date }))}
                                        label="Date of Foundation"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.contactInfo?.email || ''}
                                        onChange={handleContactChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.contactInfo?.phone || ''}
                                        onChange={handleContactChange}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                    />
                                </div>


                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <SocialLinksEditor
                                        socialLinks={socialLinks}
                                        onChange={setSocialLinks}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-200">
                                <Link
                                    href="/admin/sport-orgs"
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (isNew ? 'Create Organization' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'departments' && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Departments Management</h3>
                            <p className="mt-1 text-sm text-gray-500">Feature coming soon.</p>
                        </div>
                    )}

                    {activeTab === 'squads' && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Squads Management</h3>
                            <p className="mt-1 text-sm text-gray-500">Feature coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
