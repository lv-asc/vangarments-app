'use client';

import React, { useState } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  startDate: string;
  endDate: string;
  targetAudience: {
    demographics: string[];
    interests: string[];
    behaviors: string[];
  };
}

interface AdvertisingMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  averageROAS: number;
  activeCampaigns: number;
}

interface AdvertisingDashboardProps {
  campaigns: Campaign[];
  metrics: AdvertisingMetrics;
  loading?: boolean;
}

export default function AdvertisingDashboard({ 
  campaigns, 
  metrics, 
  loading = false 
}: AdvertisingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'analytics' | 'audience'>('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Advertising Dashboard</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Create Campaign
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'campaigns', label: 'Campaigns' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'audience', label: 'Audience' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Spend</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalSpend)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Impressions</p>
              <p className="text-2xl font-bold text-green-900">{metrics.totalImpressions.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Clicks</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Conversions</p>
              <p className="text-2xl font-bold text-orange-900">{metrics.totalConversions}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 font-medium">Average CTR</p>
              <p className="text-xl font-bold text-gray-900">{formatPercentage(metrics.averageCTR)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 font-medium">Average CPC</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.averageCPC)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600 font-medium">Average ROAS</p>
              <p className="text-xl font-bold text-gray-900">{metrics.averageROAS.toFixed(2)}x</p>
            </div>
          </div>

          {/* Recent Campaigns */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Campaigns</h3>
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}</p>
                    <p className="text-sm text-gray-600">ROAS: {campaign.roas.toFixed(2)}x</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">All Campaigns</h3>
            <div className="flex space-x-2">
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                New Campaign
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROAS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(campaign.ctr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.roas.toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => setSelectedCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Chart Placeholder */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Performance Over Time</h4>
              <div className="h-64 flex items-center justify-center text-gray-500">
                Performance chart would go here
              </div>
            </div>

            {/* Audience Insights */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Audiences</h4>
              <div className="space-y-3">
                {[
                  { segment: 'Fashion Enthusiasts 25-34', performance: 4.2, spend: 1200 },
                  { segment: 'Luxury Shoppers', performance: 3.8, spend: 2100 },
                  { segment: 'Sustainable Fashion', performance: 3.5, spend: 800 }
                ].map((audience, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded">
                    <div>
                      <p className="font-medium text-gray-900">{audience.segment}</p>
                      <p className="text-sm text-gray-600">Spend: {formatCurrency(audience.spend)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{audience.performance}x ROAS</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Conversion Funnel</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { stage: 'Impressions', count: metrics.totalImpressions, percentage: 100 },
                { stage: 'Clicks', count: metrics.totalClicks, percentage: (metrics.totalClicks / metrics.totalImpressions) * 100 },
                { stage: 'Visits', count: Math.floor(metrics.totalClicks * 0.8), percentage: (metrics.totalClicks * 0.8 / metrics.totalImpressions) * 100 },
                { stage: 'Conversions', count: metrics.totalConversions, percentage: (metrics.totalConversions / metrics.totalImpressions) * 100 }
              ].map((stage, index) => (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 p-4 rounded-lg mb-2">
                    <p className="text-2xl font-bold text-blue-900">{stage.count.toLocaleString()}</p>
                    <p className="text-sm text-blue-600">{stage.stage}</p>
                  </div>
                  <p className="text-sm text-gray-600">{stage.percentage.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demographics */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Demographics</h4>
              <div className="space-y-3">
                {[
                  { label: 'Age 18-24', percentage: 25 },
                  { label: 'Age 25-34', percentage: 40 },
                  { label: 'Age 35-44', percentage: 25 },
                  { label: 'Age 45+', percentage: 10 }
                ].map((demo, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{demo.label}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${demo.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{demo.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Interests</h4>
              <div className="space-y-3">
                {[
                  { interest: 'Fashion & Style', engagement: 92 },
                  { interest: 'Luxury Brands', engagement: 78 },
                  { interest: 'Sustainable Fashion', engagement: 65 },
                  { interest: 'Street Style', engagement: 58 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{item.interest}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${item.engagement}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{item.engagement}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audience Builder */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Create Custom Audience</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Demographics</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Select age range</option>
                  <option>18-24</option>
                  <option>25-34</option>
                  <option>35-44</option>
                  <option>45+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Select interests</option>
                  <option>Fashion & Style</option>
                  <option>Luxury Brands</option>
                  <option>Sustainable Fashion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Behaviors</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Select behaviors</option>
                  <option>Frequent Shoppers</option>
                  <option>Brand Loyalists</option>
                  <option>Trend Followers</option>
                </select>
              </div>
            </div>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Create Audience
            </button>
          </div>
        </div>
      )}
    </div>
  );
}