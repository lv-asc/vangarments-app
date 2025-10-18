'use client';

import React, { useState } from 'react';

interface TrendReport {
  id: string;
  title: string;
  category: string;
  period: string;
  generatedDate: string;
  insights: Array<{
    type: 'growth' | 'decline' | 'stable' | 'emerging';
    title: string;
    description: string;
    percentage: number;
    confidence: number;
  }>;
  marketData: {
    totalMarketSize: number;
    growthRate: number;
    topBrands: Array<{
      name: string;
      marketShare: number;
      growth: number;
    }>;
    priceRanges: Array<{
      range: string;
      volume: number;
      growth: number;
    }>;
  };
  demographics: {
    ageGroups: Array<{
      range: string;
      engagement: number;
      spending: number;
    }>;
    genderSplit: {
      male: number;
      female: number;
      nonBinary: number;
    };
    geographicData: Array<{
      region: string;
      engagement: number;
      topTrends: string[];
    }>;
  };
}

interface TrendReportsProps {
  reports: TrendReport[];
  loading?: boolean;
}

export default function TrendReports({ reports, loading = false }: TrendReportsProps) {
  const [selectedReport, setSelectedReport] = useState<TrendReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'market' | 'demographics'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(reports.map(r => r.category)))];
  const periods = ['all', ...Array.from(new Set(reports.map(r => r.period)))];

  const filteredReports = reports.filter(report => {
    const categoryMatch = filterCategory === 'all' || report.category === filterCategory;
    const periodMatch = filterPeriod === 'all' || report.period === filterPeriod;
    return categoryMatch && periodMatch;
  });

  const getInsightIcon = (type: string) => {
    // Icons removed for premium appearance
    return '';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'growth': return 'text-green-600 bg-green-100';
      case 'decline': return 'text-red-600 bg-red-100';
      case 'stable': return 'text-blue-600 bg-blue-100';
      case 'emerging': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  if (selectedReport) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Report Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <button 
              onClick={() => setSelectedReport(null)}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← Back to Reports
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedReport.title}</h2>
            <p className="text-gray-600">
              {selectedReport.category} • {selectedReport.period} • Generated {new Date(selectedReport.generatedDate).toLocaleDateString()}
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Download Report
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'insights', label: 'Key Insights' },
            { key: 'market', label: 'Market Data' },
            { key: 'demographics', label: 'Demographics' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Market Size</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(selectedReport.marketData.totalMarketSize)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Growth Rate</p>
                <p className="text-2xl font-bold text-green-900">
                  +{selectedReport.marketData.growthRate}%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Key Insights</p>
                <p className="text-2xl font-bold text-purple-900">
                  {selectedReport.insights.length}
                </p>
              </div>
            </div>

            {/* Top Insights Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReport.insights.slice(0, 4).map((insight, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInsightColor(insight.type)}`}>
                            {insight.percentage > 0 ? '+' : ''}{insight.percentage}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {selectedReport.insights.map((insight, index) => (
              <div key={index} className="p-6 border border-gray-200 rounded-lg">
                <div className="flex items-start space-x-4">
                  <span className="text-3xl">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInsightColor(insight.type)}`}>
                        {insight.type}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{insight.description}</p>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Impact:</span>
                        <span className="font-medium text-gray-900">
                          {insight.percentage > 0 ? '+' : ''}{insight.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${insight.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{insight.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market Data Tab */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            {/* Top Brands */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Leaders</h3>
              <div className="space-y-3">
                {selectedReport.marketData.topBrands.map((brand, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{brand.name}</p>
                        <p className="text-sm text-gray-600">Market Share: {brand.marketShare}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${brand.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {brand.growth >= 0 ? '+' : ''}{brand.growth}%
                      </p>
                      <p className="text-sm text-gray-600">growth</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Range Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedReport.marketData.priceRanges.map((range, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">{range.range}</h4>
                    <p className="text-2xl font-bold text-blue-600 my-2">{range.volume}%</p>
                    <p className="text-sm text-gray-600">of market volume</p>
                    <div className="mt-2">
                      <span className={`text-sm font-medium ${range.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {range.growth >= 0 ? '+' : ''}{range.growth}% growth
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Demographics Tab */}
        {activeTab === 'demographics' && (
          <div className="space-y-6">
            {/* Age Groups */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Age Group Analysis</h3>
              <div className="space-y-3">
                {selectedReport.demographics.ageGroups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{group.range}</p>
                      <p className="text-sm text-gray-600">Engagement: {group.engagement}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(group.spending)}</p>
                      <p className="text-sm text-gray-600">avg. spending</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender Split */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <p className="text-2xl font-bold text-pink-600">{selectedReport.demographics.genderSplit.female}%</p>
                  <p className="text-sm text-gray-600">Female</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedReport.demographics.genderSplit.male}%</p>
                  <p className="text-sm text-gray-600">Male</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedReport.demographics.genderSplit.nonBinary}%</p>
                  <p className="text-sm text-gray-600">Non-Binary</p>
                </div>
              </div>
            </div>

            {/* Geographic Data */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Regional Insights</h3>
              <div className="space-y-4">
                {selectedReport.demographics.geographicData.map((region, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{region.region}</h4>
                      <span className="text-sm font-medium text-blue-600">{region.engagement}% engagement</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Top Trends:</p>
                      <div className="flex flex-wrap gap-2">
                        {region.topTrends.map((trend, trendIndex) => (
                          <span key={trendIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {trend}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Trend Reports & Market Intelligence</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Generate New Report
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {periods.map((period) => (
            <option key={period} value={period}>
              {period === 'all' ? 'All Periods' : period}
            </option>
          ))}
        </select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div 
            key={report.id} 
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedReport(report)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900">{report.title}</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {report.category}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Period: {report.period}</p>
              <p className="text-sm text-gray-600">
                Generated: {new Date(report.generatedDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Market Size:</span>
                <span className="font-medium">{formatCurrency(report.marketData.totalMarketSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Growth Rate:</span>
                <span className="font-medium text-green-600">+{report.marketData.growthRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Key Insights:</span>
                <span className="font-medium">{report.insights.length}</span>
              </div>
            </div>

            <button className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors">
              View Full Report
            </button>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No reports found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}