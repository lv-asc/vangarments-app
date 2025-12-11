// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemValuation {
    id: string;
    name: string;
    image: string;
    brand: string;
    category: string;
    purchasePrice: number;
    currentValue: number;
    marketValue: number;
    depreciation: number;
    wearCount: number;
    costPerWear: number;
    lastWorn: string;
    condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
    investmentScore: number;
    resaleability: number;
}

interface UsageAnalytics {
    totalWears: number;
    averageWearFrequency: number;
    mostWornItems: ItemValuation[];
    leastWornItems: ItemValuation[];
    seasonalUsage: {
        spring: number;
        summer: number;
        fall: number;
        winter: number;
    };
    categoryUsage: Array<{
        category: string;
        wearCount: number;
        percentage: number;
    }>;
}

interface WardrobeMetrics {
    totalInvestment: number;
    currentValue: number;
    totalDepreciation: number;
    averageCostPerWear: number;
    bestInvestments: ItemValuation[];
    worstInvestments: ItemValuation[];
    underutilizedValue: number;
}

interface ItemValuationAnalyticsProps {
    items: ItemValuation[];
    usageAnalytics: UsageAnalytics;
    wardrobeMetrics: WardrobeMetrics;
    loading?: boolean;
}

export default function ItemValuationAnalytics({
    items,
    usageAnalytics,
    wardrobeMetrics,
    loading = false
}: ItemValuationAnalyticsProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'valuations' | 'usage' | 'investments'>('overview');
    const [sortBy, setSortBy] = useState<'value' | 'depreciation' | 'costPerWear' | 'wearCount'>('value');
    const [filterCondition, setFilterCondition] = useState<string>('all');

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const filteredItems = items
        .filter(item => filterCondition === 'all' || item.condition === filterCondition)
        .sort((a, b) => {
            switch (sortBy) {
                case 'value':
                    return b.currentValue - a.currentValue;
                case 'depreciation':
                    return b.depreciation - a.depreciation;
                case 'costPerWear':
                    return a.costPerWear - b.costPerWear;
                case 'wearCount':
                    return b.wearCount - a.wearCount;
                default:
                    return 0;
            }
        });

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'new': return 'text-green-600 bg-green-100';
            case 'excellent': return 'text-blue-600 bg-blue-100';
            case 'good': return 'text-yellow-600 bg-yellow-100';
            case 'fair': return 'text-orange-600 bg-orange-100';
            case 'poor': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getInvestmentScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Item Valuation & Usage Analytics</h2>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {[
                    { key: 'overview', label: 'Overview' },
                    { key: 'valuations', label: 'Valuations' },
                    { key: 'usage', label: 'Usage Analytics' },
                    { key: 'investments', label: 'Investment Analysis' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Investment</p>
                            <p className="text-2xl font-bold text-blue-900">${wardrobeMetrics.totalInvestment.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 font-medium">Current Value</p>
                            <p className="text-2xl font-bold text-green-900">${wardrobeMetrics.currentValue.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <p className="text-sm text-red-600 font-medium">Total Depreciation</p>
                            <p className="text-2xl font-bold text-red-900">${wardrobeMetrics.totalDepreciation.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-600 font-medium">Avg Cost/Wear</p>
                            <p className="text-2xl font-bold text-purple-900">${wardrobeMetrics.averageCostPerWear.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Usage Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Usage</h3>
                            <div className="space-y-3">
                                {usageAnalytics.categoryUsage.slice(0, 5).map((category, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${category.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm text-gray-600">{category.wearCount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seasonal Usage</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(usageAnalytics.seasonalUsage).map(([season, count]) => (
                                    <div key={season} className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                                        <p className="text-sm text-gray-600 capitalize">{season}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Valuations Tab */}
            {activeTab === 'valuations' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex space-x-4">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="value">Sort by Current Value</option>
                            <option value="depreciation">Sort by Depreciation</option>
                            <option value="costPerWear">Sort by Cost per Wear</option>
                            <option value="wearCount">Sort by Wear Count</option>
                        </select>
                        <select
                            value={filterCondition}
                            onChange={(e) => setFilterCondition(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Conditions</option>
                            <option value="new">New</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        {filteredItems.slice(0, 20).map((item) => (
                            <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        {typeof item.brand === 'string' ? item.brand : (item.brand?.brand || 'Unknown Brand')} • {typeof item.category === 'string' ? item.category : (item.category?.page || 'Unknown Category')}
                                    </p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                                        {item.condition}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">${item.currentValue}</p>
                                    <p className="text-sm text-gray-600">Market: ${item.marketValue}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">${item.costPerWear.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">{item.wearCount} wears</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium ${item.depreciation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.depreciation > 0 ? '-' : '+'}${Math.abs(item.depreciation)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {((item.depreciation / item.purchasePrice) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Usage Analytics Tab */}
            {activeTab === 'usage' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Most Worn Items */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Worn Items</h3>
                            <div className="space-y-3">
                                {usageAnalytics.mostWornItems.slice(0, 5).map((item, index) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">{item.wearCount} wears</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-green-600">${item.costPerWear.toFixed(2)}</p>
                                            <p className="text-xs text-gray-600">per wear</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Least Worn Items */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Underutilized Items</h3>
                            <div className="space-y-3">
                                {usageAnalytics.leastWornItems.slice(0, 5).map((item, index) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {item.wearCount} wears • Last worn: {item.lastWorn}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-red-600">${item.costPerWear.toFixed(2)}</p>
                                            <p className="text-xs text-gray-600">per wear</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Investment Analysis Tab */}
            {activeTab === 'investments' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Best Investments */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Best Investments</h3>
                            <div className="space-y-3">
                                {wardrobeMetrics.bestInvestments.map((item, index) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">{item.brand}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${getInvestmentScoreColor(item.investmentScore)}`}>
                                                {item.investmentScore}/100
                                            </p>
                                            <p className="text-xs text-gray-600">investment score</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Worst Investments */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Poor Investments</h3>
                            <div className="space-y-3">
                                {wardrobeMetrics.worstInvestments.map((item, index) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">{item.brand}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${getInvestmentScoreColor(item.investmentScore)}`}>
                                                {item.investmentScore}/100
                                            </p>
                                            <p className="text-xs text-gray-600">investment score</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Investment Summary */}
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Investment Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">${wardrobeMetrics.underutilizedValue.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Underutilized Value</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {((wardrobeMetrics.currentValue / wardrobeMetrics.totalInvestment) * 100).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">Value Retention</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">${wardrobeMetrics.averageCostPerWear.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">Avg Cost per Wear</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}