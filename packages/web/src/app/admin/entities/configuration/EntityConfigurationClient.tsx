'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface EntityFeatures {
    logos?: boolean;
    logoNames?: boolean;
    banners?: boolean;
    team?: boolean;
    lines?: boolean;
    collections?: boolean;
    lookbooks?: boolean;
    skus?: boolean;
    socialLinks?: boolean;
    foundedInfo?: boolean;
    country?: boolean;
    tags?: boolean;
    avatar?: boolean;
    roles?: boolean;
}

interface EntityLabels {
    logos?: { label?: string; button?: string; helper?: string };
    banners?: { label?: string; button?: string; helper?: string };
    avatar?: { label?: string; button?: string };
    [key: string]: { label?: string; button?: string; helper?: string } | undefined;
}

interface EntityTab {
    id: string;
    label: string;
}

interface EntityConfiguration {
    id: string;
    entityType: string;
    displayName: string;
    displayNamePlural: string;
    urlPath: string;
    features: EntityFeatures;
    labels: EntityLabels;
    tabs: EntityTab[];
}

const AVAILABLE_FEATURES = [
    { key: 'logos', label: 'Logos', description: 'Multiple logo images' },
    { key: 'logoNames', label: 'Logo Names', description: 'Name field for each logo' },
    { key: 'banners', label: 'Banners', description: 'Banner images' },
    { key: 'team', label: 'Team', description: 'Team management' },
    { key: 'lines', label: 'Lines', description: 'Product lines' },
    { key: 'collections', label: 'Collections', description: 'Collections' },
    { key: 'lookbooks', label: 'Lookbooks', description: 'Lookbooks' },
    { key: 'skus', label: 'SKUs', description: 'SKU management' },
    { key: 'socialLinks', label: 'Social Links', description: 'Social media links' },
    { key: 'foundedInfo', label: 'Founded Info', description: 'Founded by and date' },
    { key: 'country', label: 'Country', description: 'Country selector' },
    { key: 'tags', label: 'Tags', description: 'Tags selector' },
];

export default function EntityConfigurationPage() {
    const { user } = useAuth();
    const [configurations, setConfigurations] = useState<EntityConfiguration[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

    useEffect(() => {
        if (user && user.roles?.includes('admin')) {
            loadConfigurations();
        }
    }, [user]);

    const loadConfigurations = async () => {
        try {
            setLoading(true);
            // apiClient.get already extracts .data from the response
            const data = await apiClient.get<EntityConfiguration[]>('/configuration/entities');
            if (Array.isArray(data)) {
                setConfigurations(data);
            } else {
                // Fallback if response is wrapped
                setConfigurations((data as any)?.data || []);
            }
        } catch (error) {
            console.error('Failed to load entity configurations:', error);
            toast.error('Failed to load entity configurations');
        } finally {
            setLoading(false);
        }
    };

    const updateConfiguration = async (entityType: string, updates: Partial<EntityConfiguration>) => {
        try {
            setSaving(entityType);
            await apiClient.put(`/configuration/entities/${entityType}`, updates);
            toast.success(`${entityType} configuration updated`);
            await loadConfigurations();
        } catch (error) {
            console.error('Failed to update configuration:', error);
            toast.error('Failed to update configuration');
        } finally {
            setSaving(null);
        }
    };

    const toggleFeature = (config: EntityConfiguration, featureKey: string) => {
        const newFeatures = {
            ...config.features,
            [featureKey]: !config.features[featureKey as keyof EntityFeatures]
        };
        updateConfiguration(config.entityType, { features: newFeatures });
    };

    const updateLabel = (config: EntityConfiguration, labelKey: string, field: string, value: string) => {
        const currentLabelConfig = config.labels[labelKey] || {};
        const newLabels = {
            ...config.labels,
            [labelKey]: {
                ...currentLabelConfig,
                [field]: value
            }
        };
        updateConfiguration(config.entityType, { labels: newLabels });
    };

    if (!user || !user.roles?.includes('admin')) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link href="/admin" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Back to Admin
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Entity Configuration</h1>
                    <p className="mt-2 text-gray-600">
                        Configure which features each entity type has and customize labels.
                    </p>
                </div>

                {configurations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">No entity configurations found.</p>
                        <p className="text-sm text-gray-400 mt-2">Run the database migration to populate default configurations.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {configurations.map((config) => (
                            <div key={config.entityType} className="bg-white rounded-lg shadow overflow-hidden">
                                {/* Entity Header */}
                                <button
                                    onClick={() => setExpandedEntity(expandedEntity === config.entityType ? null : config.entityType)}
                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-gray-900">{config.displayName}</span>
                                        <span className="text-sm text-gray-500">({config.displayNamePlural})</span>
                                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">{config.urlPath}</span>
                                    </div>
                                    {expandedEntity === config.entityType ? (
                                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>

                                {/* Expanded Content */}
                                {expandedEntity === config.entityType && (
                                    <div className="px-6 pb-6 space-y-6 border-t">
                                        {/* Feature Toggles */}
                                        <div className="pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Features</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {AVAILABLE_FEATURES.map(feature => (
                                                    <label
                                                        key={feature.key}
                                                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={!!config.features[feature.key as keyof EntityFeatures]}
                                                            onChange={() => toggleFeature(config, feature.key)}
                                                            disabled={saving === config.entityType}
                                                            className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-900">{feature.label}</span>
                                                            <p className="text-xs text-gray-500">{feature.description}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Label Customization */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Labels</h3>
                                            <div className="space-y-4">
                                                {config.features.logos && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Logos Title</label>
                                                            <input
                                                                type="text"
                                                                value={config.labels.logos?.label || ''}
                                                                onChange={(e) => updateLabel(config, 'logos', 'label', e.target.value)}
                                                                placeholder={`${config.displayName} Logos`}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                                                            <input
                                                                type="text"
                                                                value={config.labels.logos?.button || ''}
                                                                onChange={(e) => updateLabel(config, 'logos', 'button', e.target.value)}
                                                                placeholder="Upload Logo(s)"
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {config.features.banners && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Banners Title</label>
                                                            <input
                                                                type="text"
                                                                value={config.labels.banners?.label || ''}
                                                                onChange={(e) => updateLabel(config, 'banners', 'label', e.target.value)}
                                                                placeholder={`${config.displayName} Banners`}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                                                            <input
                                                                type="text"
                                                                value={config.labels.banners?.button || ''}
                                                                onChange={(e) => updateLabel(config, 'banners', 'button', e.target.value)}
                                                                placeholder="Upload Banner(s)"
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {saving === config.entityType && (
                                            <div className="text-sm text-blue-600 flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                Saving...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
