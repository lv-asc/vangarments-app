'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
    { key: 'logos', label: 'Logos', description: 'Allow uploading multiple logo images' },
    { key: 'logoNames', label: 'Logo Names', description: 'Show name input field for each logo' },
    { key: 'banners', label: 'Banners', description: 'Allow uploading banner images' },
    { key: 'team', label: 'Team Management', description: 'Enable team member management tab' },
    { key: 'lines', label: 'Lines', description: 'Enable product lines management' },
    { key: 'collections', label: 'Collections', description: 'Enable collections management' },
    { key: 'lookbooks', label: 'Lookbooks', description: 'Enable lookbooks management' },
    { key: 'skus', label: 'SKUs', description: 'Enable SKU management' },
    { key: 'socialLinks', label: 'Social Links', description: 'Show social media links editor' },
    { key: 'foundedInfo', label: 'Founded Info', description: 'Show founded by and date fields' },
    { key: 'country', label: 'Country', description: 'Show country selector' },
    { key: 'tags', label: 'Tags', description: 'Show tags selector' },
    { key: 'avatar', label: 'Avatar/Profile Picture', description: 'Single profile image (for users)' },
    { key: 'roles', label: 'Roles', description: 'User role management' },
];

export function EntityConfigurationEditor() {
    const [configurations, setConfigurations] = useState<EntityConfiguration[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [expandedEntity, setExpandedEntity] = useState<string | null>(null);

    useEffect(() => {
        loadConfigurations();
    }, []);

    const loadConfigurations = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<{ success: boolean; data: EntityConfiguration[] }>('/configuration/entities');
            if (response.success) {
                setConfigurations(response.data);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Entity Configuration</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Configure which features each entity type has and customize labels.
                </p>
            </div>

            {configurations.map((config) => (
                <div key={config.entityType} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Entity Header */}
                    <button
                        onClick={() => setExpandedEntity(expandedEntity === config.entityType ? null : config.entityType)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{config.displayName}</span>
                            <span className="text-sm text-gray-500">({config.displayNamePlural})</span>
                            <span className="text-xs text-gray-400 font-mono">{config.urlPath}</span>
                        </div>
                        {expandedEntity === config.entityType ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                    </button>

                    {/* Expanded Content */}
                    {expandedEntity === config.entityType && (
                        <div className="p-4 space-y-6">
                            {/* Feature Toggles */}
                            <div>
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
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Label Customization</h3>
                                <div className="space-y-4">
                                    {/* Logo Labels */}
                                    {config.features.logos && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Logos Section Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={config.labels.logos?.label || ''}
                                                    onChange={(e) => updateLabel(config, 'logos', 'label', e.target.value)}
                                                    placeholder={`${config.displayName} Logos`}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Upload Button Text
                                                </label>
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

                                    {/* Banner Labels */}
                                    {config.features.banners && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Banners Section Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={config.labels.banners?.label || ''}
                                                    onChange={(e) => updateLabel(config, 'banners', 'label', e.target.value)}
                                                    placeholder={`${config.displayName} Banners`}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Upload Button Text
                                                </label>
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

                                    {/* Avatar Labels (for users) */}
                                    {config.features.avatar && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Avatar Section Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={config.labels.avatar?.label || ''}
                                                    onChange={(e) => updateLabel(config, 'avatar', 'label', e.target.value)}
                                                    placeholder="Profile Picture"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                                    Upload Button Text
                                                </label>
                                                <input
                                                    type="text"
                                                    value={config.labels.avatar?.button || ''}
                                                    onChange={(e) => updateLabel(config, 'avatar', 'button', e.target.value)}
                                                    placeholder="Upload Photo"
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Saving indicator */}
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
    );
}
