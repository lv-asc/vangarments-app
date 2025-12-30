'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface EntityFeatures {
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

export interface EntityLabels {
    logos?: { label?: string; button?: string; helper?: string };
    banners?: { label?: string; button?: string; helper?: string };
    avatar?: { label?: string; button?: string };
    [key: string]: { label?: string; button?: string; helper?: string } | undefined;
}

export interface EntityTab {
    id: string;
    label: string;
}

export interface EntityConfiguration {
    id: string;
    entityType: string;
    displayName: string;
    displayNamePlural: string;
    urlPath: string;
    features: EntityFeatures;
    labels: EntityLabels;
    tabs: EntityTab[];
}

// Simple in-memory cache for entity configurations
const configCache: Map<string, { data: EntityConfiguration; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useEntityConfiguration(entityType: string) {
    const [config, setConfig] = useState<EntityConfiguration | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConfiguration = useCallback(async () => {
        try {
            // Check cache first
            const cached = configCache.get(entityType);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                setConfig(cached.data);
                setLoading(false);
                return;
            }

            setLoading(true);
            const data = await apiClient.get<EntityConfiguration>(`/configuration/entities/${entityType}`);

            if (data) {
                // Handle both direct response and wrapped response
                const configData = (data as any)?.data || data;
                setConfig(configData);
                configCache.set(entityType, { data: configData, timestamp: Date.now() });
            }
        } catch (err) {
            console.error(`Failed to load entity configuration for ${entityType}:`, err);
            setError(err instanceof Error ? err.message : 'Failed to load configuration');
            // Set default configuration on error
            setConfig(getDefaultConfiguration(entityType));
        } finally {
            setLoading(false);
        }
    }, [entityType]);

    useEffect(() => {
        loadConfiguration();
    }, [loadConfiguration]);

    // Helper to get label with fallback
    const getLabel = useCallback((feature: string, field: 'label' | 'button' | 'helper', fallback: string): string => {
        return config?.labels?.[feature]?.[field] || fallback;
    }, [config]);

    // Helper to check if feature is enabled
    const hasFeature = useCallback((feature: keyof EntityFeatures): boolean => {
        return config?.features?.[feature] ?? getDefaultFeature(entityType, feature);
    }, [config, entityType]);

    // Invalidate cache (useful after updates)
    const invalidateCache = useCallback(() => {
        configCache.delete(entityType);
    }, [entityType]);

    return {
        config,
        loading,
        error,
        features: config?.features || getDefaultFeatures(entityType),
        labels: config?.labels || {},
        displayName: config?.displayName || entityType,
        displayNamePlural: config?.displayNamePlural || `${entityType}s`,
        getLabel,
        hasFeature,
        invalidateCache,
        reload: loadConfiguration,
    };
}

// Default configurations when API fails
function getDefaultConfiguration(entityType: string): EntityConfiguration {
    const defaults: Record<string, Partial<EntityConfiguration>> = {
        brand: {
            displayName: 'Brand',
            displayNamePlural: 'Brands',
            features: { logos: true, banners: true, team: true, lines: true, collections: true, lookbooks: true, skus: true, country: true, tags: true, foundedInfo: true, socialLinks: true },
        },
        store: {
            displayName: 'Store',
            displayNamePlural: 'Stores',
            features: { logos: true, banners: true, team: true, collections: true, lookbooks: true, skus: true, socialLinks: true, country: true, tags: true, foundedInfo: true },
        },
        supplier: {
            displayName: 'Supplier',
            displayNamePlural: 'Suppliers',
            features: { logos: true, banners: true, team: true, socialLinks: true, country: true, tags: true },
        },
        non_profit: {
            displayName: 'Non-Profit',
            displayNamePlural: 'Non-Profits',
            features: { logos: true, banners: true, team: true, country: true, tags: true },
        },
        page: {
            displayName: 'Page',
            displayNamePlural: 'Pages',
            features: { logos: true, logoNames: true, banners: true, team: true, socialLinks: true, country: true, tags: true },
        },
        user: {
            displayName: 'User',
            displayNamePlural: 'Users',
            features: { avatar: true, roles: true, socialLinks: true },
        },
    };

    const defaultConfig = defaults[entityType] || { displayName: entityType, displayNamePlural: `${entityType}s` };

    return {
        id: entityType,
        entityType,
        displayName: defaultConfig.displayName || entityType,
        displayNamePlural: defaultConfig.displayNamePlural || `${entityType}s`,
        urlPath: `/${entityType}s`,
        features: defaultConfig.features || {},
        labels: {},
        tabs: [],
    };
}

function getDefaultFeatures(entityType: string): EntityFeatures {
    return getDefaultConfiguration(entityType).features;
}

function getDefaultFeature(entityType: string, feature: keyof EntityFeatures): boolean {
    const defaults = getDefaultFeatures(entityType);
    return defaults[feature] ?? false;
}
