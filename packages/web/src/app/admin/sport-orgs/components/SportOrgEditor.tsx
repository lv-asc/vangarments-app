'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrashIcon, CloudArrowUpIcon, PhotoIcon, CheckIcon, UserGroupIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
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

import DepartmentModal from './DepartmentModal';
import SquadModal from './SquadModal';
import QuickAddModal from './QuickAddModal';

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
    const [activeTab, setActiveTab] = useState<'details' | 'departments' | 'squads' | 'items'>('details');

    // Nested Data
    const [departments, setDepartments] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);

    // Modals
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

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

            // Set Departments (nested in getOrg response)
            if (data.departments) {
                setDepartments(data.departments);
            }

            // Fetch Items optionally if on items tab, or lazy load
            if (activeTab === 'items') {
                fetchItems(orgId!);
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

    const fetchItems = async (id: string) => {
        try {
            const data = await sportOrgApi.getOrgItems(id);
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch items', error);
            // toast.error('Failed to load items');
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
                                <button
                                    onClick={() => { setActiveTab('items'); if (orgId) fetchItems(orgId); }}
                                    className={`${activeTab === 'items' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Items Gallery
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
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Departments</h3>
                                <button
                                    onClick={() => setIsDeptModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                    New Department
                                </button>
                            </div>

                            {departments.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {departments.map((dept: any) => (
                                        <div key={dept.id} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    {dept.logo ? <img src={dept.logo} className="h-10 w-10 rounded-full object-cover" /> : <span className="text-xs font-bold text-gray-500">{dept.name.substring(0, 2).toUpperCase()}</span>}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <a href="#" className="focus:outline-none">
                                                    <span className="absolute inset-0" aria-hidden="true" />
                                                    <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                                                    <p className="text-sm text-gray-500 truncate">{dept.sportType}</p>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No departments</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new department.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'squads' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Squads Management</h3>
                                <p className="text-sm text-gray-500">Manage squads within each department.</p>
                            </div>

                            {departments.length > 0 ? (
                                <div className="space-y-8">
                                    {departments.map((dept: any) => (
                                        <div key={dept.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-md font-bold text-gray-900">{dept.name}</h4>
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{dept.category}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setSelectedDeptId(dept.id); setIsQuickAddOpen(true); }}
                                                        className="text-xs font-medium text-green-600 hover:text-green-800 flex items-center"
                                                    >
                                                        <SparklesIcon className="h-4 w-4 mr-1" /> Quick Add
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedDeptId(dept.id); setIsSquadModalOpen(true); }}
                                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
                                                    >
                                                        <PlusIcon className="h-4 w-4 mr-1" /> Add Squad
                                                    </button>
                                                </div>
                                            </div>

                                            {dept.squads && dept.squads.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {dept.squads.map((squad: any) => (
                                                        <div key={squad.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center group">
                                                            <div className="flex items-center gap-2">
                                                                <UserGroupIcon className="h-5 w-5 text-gray-400" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{squad.name}</p>
                                                                    <p className="text-xs text-gray-500">{squad.gender} • {squad.ageGroup}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No squads yet.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">Create a department first to add squads.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Items Gallery</h3>
                                    <p className="text-sm text-gray-500">All SKU items linked to any squad in this organization.</p>
                                </div>
                                <button
                                    onClick={() => orgId && fetchItems(orgId)}
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    Refresh
                                </button>
                            </div>

                            {items.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {items.map((item: any) => (
                                        <div key={item.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 group-hover:opacity-75 h-40">
                                                {item.images && item.images.length > 0 ? (
                                                    <img src={getImageUrl(item.images[0].url)} alt={item.name} className="h-full w-full object-cover object-center" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    <Link href={`/admin/skus/${item.id}`}>
                                                        <span aria-hidden="true" className="absolute inset-0" />
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">{item.code}</p>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-900">{item.department_name}</span>
                                                    <span className="text-[10px] text-gray-400">{item.squad_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
                                    <p className="mt-1 text-sm text-gray-500">Items linked to squads will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modals */}
                {isDeptModalOpen && orgId && (
                    <DepartmentModal
                        orgId={orgId}
                        onClose={() => setIsDeptModalOpen(false)}
                        onSuccess={() => { setIsDeptModalOpen(false); loadOrg(); }}
                    />
                )}
                {isSquadModalOpen && selectedDeptId && orgId && (
                    <SquadModal
                        orgId={orgId}
                        deptId={selectedDeptId}
                        onClose={() => { setIsSquadModalOpen(false); setSelectedDeptId(null); }}
                        onSuccess={() => { setIsSquadModalOpen(false); setSelectedDeptId(null); loadOrg(); }}
                    />
                )}
                {isQuickAddOpen && selectedDeptId && orgId && (
                    <QuickAddModal
                        orgId={orgId}
                        deptId={selectedDeptId}
                        onClose={() => { setIsQuickAddOpen(false); setSelectedDeptId(null); }}
                        onSuccess={() => { setIsQuickAddOpen(false); setSelectedDeptId(null); loadOrg(); }}
                    />
                )}
            </div>
        </div>
    );
}
