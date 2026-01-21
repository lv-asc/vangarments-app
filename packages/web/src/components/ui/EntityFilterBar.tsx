'use client';

import React from 'react';
import CountrySelector from './CountrySelector';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
    value: string;
    label: string;
}

interface EntityFilterBarProps {
    filters: {
        verificationStatus?: string;
        partnershipTier?: string;
        country?: string;
        roles?: string[];
    };
    onFilterChange: (newFilters: any) => void;
    showVerification?: boolean;
    showTier?: boolean;
    showCountry?: boolean;
    showRoles?: boolean;
}

const VERIFICATION_STATUSES: FilterOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' },
];

const PARTNERSHIP_TIERS: FilterOption[] = [
    { value: '', label: 'All Tiers' },
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' },
];

const AVAILABLE_ROLES: FilterOption[] = [
    { value: 'common_user', label: 'User' },
    { value: 'influencer', label: 'Influencer' },
    { value: 'model', label: 'Model' },
    { value: 'journalist', label: 'Journalist' },
    { value: 'brand_owner', label: 'Brand Owner' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'stylist', label: 'Stylist' },
    { value: 'independent_reseller', label: 'Reseller' },
    { value: 'store_owner', label: 'Store Owner' },
    { value: 'fashion_designer', label: 'Designer' },
    { value: 'sewer', label: 'Sewer' },
];

export default function EntityFilterBar({
    filters,
    onFilterChange,
    showVerification = true,
    showTier = false,
    showCountry = false,
    showRoles = false
}: EntityFilterBarProps) {
    const hasActiveFilters =
        filters.verificationStatus ||
        filters.partnershipTier ||
        filters.country ||
        (filters.roles && filters.roles.length > 0);

    const handleClearFilters = () => {
        onFilterChange({
            verificationStatus: '',
            partnershipTier: '',
            country: '',
            roles: []
        });
    };

    const updateFilter = (key: string, value: any) => {
        onFilterChange({
            ...filters,
            [key]: value
        });
    };

    const toggleRole = (roleValue: string) => {
        const currentRoles = filters.roles || [];
        const newRoles = currentRoles.includes(roleValue)
            ? currentRoles.filter(r => r !== roleValue)
            : [...currentRoles, roleValue];
        updateFilter('roles', newRoles);
    };

    return (
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center text-gray-400 mr-2">
                        <FunnelIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Filters</span>
                    </div>

                    {/* Verification Status */}
                    {showVerification && (
                        <div className="flex flex-col min-w-[140px]">
                            <select
                                value={filters.verificationStatus || ''}
                                onChange={(e) => updateFilter('verificationStatus', e.target.value)}
                                className="block w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {VERIFICATION_STATUSES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Partnership Tier */}
                    {showTier && (
                        <div className="flex flex-col min-w-[140px]">
                            <select
                                value={filters.partnershipTier || ''}
                                onChange={(e) => updateFilter('partnershipTier', e.target.value)}
                                className="block w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                {PARTNERSHIP_TIERS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Country */}
                    {showCountry && (
                        <div className="min-w-[200px]">
                            <CountrySelector
                                value={filters.country || ''}
                                onChange={(val) => updateFilter('country', val)}
                                label=""
                                placeholder="All Countries"
                            />
                        </div>
                    )}

                    {/* Clear Filters */}
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={handleClearFilters}
                                className="flex items-center text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                            >
                                <XMarkIcon className="h-4 w-4 mr-1" />
                                Clear All
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Roles (Chips) */}
                {showRoles && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider self-center mr-2">Roles:</span>
                        {AVAILABLE_ROLES.map(role => {
                            const isActive = filters.roles?.includes(role.value);
                            return (
                                <button
                                    key={role.value}
                                    onClick={() => toggleRole(role.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${isActive
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                >
                                    {role.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
