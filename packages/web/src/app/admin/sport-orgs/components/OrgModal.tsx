import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SportOrg, SportOrgType } from '@vangarments/shared/types';
import { SPORT_ORG_TYPES } from '@vangarments/shared/constants';
import { sportOrgApi } from '@/lib/sportOrgApi';
import toast from 'react-hot-toast';
import CountrySelect from '@/components/ui/CountrySelect';

interface OrgModalProps {
    org?: SportOrg;
    onClose: () => void;
    onSuccess: () => void;
}

export default function OrgModal({ org, onClose, onSuccess }: OrgModalProps) {
    const isNew = !org;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<SportOrg>>({
        name: '',
        orgType: 'professional_club',
        foundedCountry: '',
        slug: ''
    });

    useEffect(() => {
        if (org) {
            setFormData({
                name: org.name,
                orgType: org.orgType,
                foundedCountry: org.foundedCountry,
                slug: org.slug
            });
        }
    }, [org]);

    const handleNameChange = (name: string) => {
        // Only auto-generate slug for new orgs
        if (isNew) {
            const slug = name.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, name, slug }));
        } else {
            setFormData(prev => ({ ...prev, name }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            if (isNew) {
                await sportOrgApi.createOrg(formData);
                toast.success('Organization created');
            } else {
                await sportOrgApi.updateOrg(org.id, formData);
                toast.success('Organization updated');
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to save org', error);
            toast.error('Failed to save organization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isNew ? 'New Organization' : 'Edit Organization'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
                    <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. SE Palmeiras"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">URL Slug *</label>
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

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (isNew ? 'Create' : 'Save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
