'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useBrand } from '@/components/admin/BrandProvider';
import { brandApi } from '@/lib/brandApi';
import toast from 'react-hot-toast';
import { COUNTRIES, BRAND_TAGS } from '@/lib/constants';
import { CheckIcon } from '@heroicons/react/20/solid';
import { formatPhone } from '@/lib/masks';
import LogoUploader, { LogoItem } from '@/components/admin/LogoUploader';
import BannerUploader, { BannerItem } from '@/components/admin/BannerUploader';
import SocialLinksEditor from '@/components/admin/SocialLinksEditor';
import FoundationDateInput from '@/components/ui/FoundationDateInput';
import CountrySelector from '@/components/ui/CountrySelector';
import { useEntityConfiguration } from '@/hooks/useEntityConfiguration';
import { useFormDraftPersistence } from '@/hooks/useFormDraftPersistence';

export default function BrandDetailsPage() {
    const { brand, loading: brandLoading, refreshBrand } = useBrand();
    const router = useRouter();
    const params = useParams();
    const brandId = params.id as string;

    const [saving, setSaving] = useState(false);
    const [logos, setLogos] = useState<LogoItem[]>([]);
    const [banners, setBanners] = useState<BannerItem[]>([]);
    const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([]);

    const { hasFeature, getLabel, displayName } = useEntityConfiguration('brand');

    const [formData, setFormData] = useState({
        brandName: '',
        slug: '',
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
        isLoading: brandLoading,
        isNew: false,
        additionalData: { logos, banners, socialLinks },
        additionalSetters: { logos: setLogos, banners: setBanners, socialLinks: setSocialLinks }
    });

    useEffect(() => {
        if (brand) {
            setFormData({
                brandName: brand.brandInfo.name || '',
                slug: brand.brandInfo.slug || '',
                description: brand.brandInfo.description || '',
                website: brand.brandInfo.website || '',
                contactEmail: brand.brandInfo.contactInfo?.email || '',
                contactPhone: brand.brandInfo.contactInfo?.phone || '',
                country: brand.brandInfo.country || '',
                tags: brand.brandInfo.tags || [],
                foundedBy: brand.profileData?.foundedBy || '',
                foundedDate: brand.profileData?.foundedDate || '',
                foundedDatePrecision: brand.profileData?.foundedDatePrecision || 'year'
            });

            // Initialize Banners
            const mainBanner = brand.brandInfo.banner;
            const additionalBanners = brand.brandInfo.banners || [];

            let initialBanners: BannerItem[] = [];

            if (additionalBanners.length > 0) {
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

            // Initialize logos
            const mainLogoUrl = brand.brandInfo.logo;
            const additionalLogos = brand.profileData?.additionalLogos || [];
            const logoMetadata = brand.profileData?.logoMetadata || [];

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
            if ((brand.profileData as any)?.socialLinks) {
                setSocialLinks((brand.profileData as any).socialLinks);
            }
        }
    }, [brand]);

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

        const targetBrandId = brand?.id || brandId;

        try {
            setSaving(true);

            const mainLogo = logos.length > 0 ? logos[0].url : '';
            const additionalLogos = logos.slice(1).map(l => l.url);
            const logoMetadata = logos.map(l => ({ url: l.url, name: l.name }));

            const mainBanner = banners.length > 0 ? banners[0].url : '';
            const bannersToSave = banners.map(b => ({
                url: b.url,
                positionY: b.positionY
            }));

            const existingContactInfo = brand?.brandInfo?.contactInfo || {};
            const mergedContactInfo = {
                ...existingContactInfo,
                email: formData.contactEmail,
                phone: formData.contactPhone
            };

            const brandSlug = formData.slug ? slugify(formData.slug) : slugify(formData.brandName);

            // 1. Update Brand Info
            await brandApi.updateBrand(targetBrandId, {
                brandInfo: {
                    name: formData.brandName,
                    slug: brandSlug,
                    description: formData.description,
                    website: formData.website,
                    country: formData.country,
                    tags: formData.tags,
                    contactInfo: mergedContactInfo,
                    logo: mainLogo,
                    banner: mainBanner,
                    banners: bannersToSave as any
                }
            });

            // 2. Update Profile Data
            await brandApi.updateProfileData(targetBrandId, {
                additionalLogos: additionalLogos,
                logoMetadata: logoMetadata,
                foundedBy: formData.foundedBy || undefined,
                foundedDate: formData.foundedDate || undefined,
                foundedDatePrecision: formData.foundedDate ? formData.foundedDatePrecision : undefined,
                socialLinks: socialLinks.length > 0 ? socialLinks : undefined
            });

            toast.success('Brand updated successfully');
            clearDraft();

            if (brandSlug) {
                window.history.replaceState(null, '', `/admin/brands/${brandSlug}/details`);
            }

            refreshBrand();
        } catch (error: any) {
            console.error('Failed to update brand', error);
            toast.error(error.message || 'Failed to update brand');
        } finally {
            setSaving(false);
        }
    };

    if (brandLoading) {
        return <div className="p-10 flex justify-center">Loading...</div>;
    }

    return (
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

                <div>
                    <CountrySelector
                        value={formData.country}
                        onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                    />
                </div>

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
            </div>

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
    );
}
