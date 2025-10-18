'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartIcon, LightningIcon, TargetIcon, CheckIcon, SparklesIcon } from '@/components/ui/icons';
import InteractiveChart from '../ui/InteractiveChart';

interface BetaAnalytics {
  wardrobeInsights: {
    totalItems: number;
    categoriesUsed: number;
    averageItemValue: number;
    styleConsistency: number;
  };
  engagementMetrics: {
    dailyActiveTime: number;
    featuresUsed: string[];
    feedbackSubmitted: number;
    referralsGenerated: number;
  };
  industryInsights: {
    trendPredictions: Array<{
      category: string;
      trend: string;
      confidence: number;
      timeframe: string;
    }>;
    marketAnalysis: {
      priceRanges: Record<string, number>;
      popularBrands: Array<{ brand: string; usage: number }>;
      seasonalTrends: Record<string, number>;
    };
  };
  exclusiveData: {
    earlyTrendAccess: boolean;
    advancedFilters: boolean;
    customReports: boolean;
    directFeedbackChannel: boolean;
  };
}

interface BetaAnalyticsDashboardProps {
  analytics: BetaAnalytics;
  loading?: boolean;
}

export default function BetaAnalyticsDashboard({ 
  analytics, 
  loading = false 
}: BetaAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'trends' | 'engagement' | 'exclusive'>('insights');
  const [selectedTrend, setSelectedTrend] = useState<number | null>(null);

  const tabs = [
    { key: 'insights', label: 'Wardrobe Insights', icon: <ChartIcon className="text-current" size="sm" /> },
    { key: 'trends', label: 'Industry Trends', icon: <ChartIcon className="text-current" size="sm" /> },
    { key: 'engagement', label: 'Engagement', icon: <LightningIcon className="text-current" size="sm" /> },
    { key: 'exclusive', label: 'Exclusive Access', icon: <CheckIcon className="text-current" size="sm" /> }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (loading) {
    return (
      <div className="bg-[#fff7d7] min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 border-4 border-[#00132d] border-t-transparent rounded-full"
            />
            <h2 className="text-2xl font-bold text-[#00132d] mb-2">Loading Beta Analytics</h2>
            <p className="text-[#00132d]/70">Generating exclusive insights...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff7d7] min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#00132d] mb-2">
                Beta Pioneer Analytics
              </h1>
              <p className="text-[#00132d]/70">
                Exclusive insights and advanced analytics for beta participants
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg">
              <span className="font-bold">β</span>
              <span className="font-semibold">Beta Access</span>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <nav className="bg-[#00132d]/5 rounded-2xl p-2 border border-[#00132d]/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'text-[#fff7d7] shadow-lg'
                      : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                  }`}
                  whileHover={{ scale: activeTab === tab.key ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-[#00132d] rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="text-2xl mb-1">{tab.icon}</div>
                    <div className="font-semibold text-sm">{tab.label}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </nav>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Wardrobe Insights */}
            {activeTab === 'insights' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
                    <ChartIcon className="mr-2 text-[#00132d]" size="md" />
                    Wardrobe Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Total Items</span>
                      <span className="font-bold text-[#00132d]">{analytics.wardrobeInsights.totalItems}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Categories Used</span>
                      <span className="font-bold text-[#00132d]">{analytics.wardrobeInsights.categoriesUsed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Average Item Value</span>
                      <span className="font-bold text-[#00132d]">
                        ${analytics.wardrobeInsights.averageItemValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Style Consistency</span>
                      <span className="font-bold text-[#00132d]">
                        {(analytics.wardrobeInsights.styleConsistency * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
                    <ChartIcon className="mr-2 text-[#00132d]" size="md" />
                    Style Consistency Score
                  </h3>
                  <div className="relative">
                    <div className="w-32 h-32 mx-auto relative">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#00132d20"
                          strokeWidth="8"
                          fill="none"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#00132d"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                          animate={{ 
                            strokeDashoffset: 2 * Math.PI * 40 * (1 - analytics.wardrobeInsights.styleConsistency)
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#00132d]">
                          {(analytics.wardrobeInsights.styleConsistency * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Industry Trends */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
                    <SparklesIcon className="mr-2 text-purple-500" size="md" />
                    Trend Predictions
                  </h3>
                  <div className="space-y-4">
                    {analytics.industryInsights.trendPredictions.map((trend, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[#fff7d7] rounded-xl p-4 border border-[#00132d]/10 cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setSelectedTrend(selectedTrend === index ? null : index)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-[#00132d]">{trend.category}</span>
                              <span className={`text-sm ${getConfidenceColor(trend.confidence)}`}>
                                {getConfidenceLabel(trend.confidence)}
                              </span>
                            </div>
                            <p className="text-[#00132d]/80 mb-2">{trend.trend}</p>
                            <span className="text-sm text-[#00132d]/60">{trend.timeframe}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[#00132d]">
                              {(trend.confidence * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-[#00132d]/60">Confidence</div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {selectedTrend === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-[#00132d]/10"
                            >
                              <p className="text-sm text-[#00132d]/70">
                                This trend is based on analysis of user behavior, market data, and fashion industry signals. 
                                Beta participants get early access to these insights before they become public.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                    <h3 className="text-lg font-semibold text-[#00132d] mb-4">Price Range Distribution</h3>
                    <InteractiveChart
                      data={Object.entries(analytics.industryInsights.marketAnalysis.priceRanges).map(([range, percentage]) => ({
                        label: range,
                        value: percentage
                      }))}
                      type="pie"
                      height={200}
                    />
                  </div>

                  <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                    <h3 className="text-lg font-semibold text-[#00132d] mb-4">Popular Brands</h3>
                    <div className="space-y-3">
                      {analytics.industryInsights.marketAnalysis.popularBrands.map((brand, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-[#00132d]">{brand.brand}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-[#00132d]/20 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-[#00132d] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${brand.usage}%` }}
                                transition={{ delay: index * 0.1, duration: 0.8 }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-[#00132d]">{brand.usage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            {activeTab === 'engagement' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
                    <LightningIcon className="mr-2 text-[#00132d]" size="md" />
                    Engagement Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Daily Active Time</span>
                      <span className="font-bold text-[#00132d]">
                        {analytics.engagementMetrics.dailyActiveTime}min
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Features Used</span>
                      <span className="font-bold text-[#00132d]">
                        {analytics.engagementMetrics.featuresUsed.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Feedback Submitted</span>
                      <span className="font-bold text-[#00132d]">
                        {analytics.engagementMetrics.feedbackSubmitted}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Referrals Generated</span>
                      <span className="font-bold text-[#00132d]">
                        {analytics.engagementMetrics.referralsGenerated}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
                    <TargetIcon className="mr-2 text-[#00132d]" size="md" />
                    Features Explored
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.engagementMetrics.featuresUsed.map((feature, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-[#00132d] text-[#fff7d7] px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Exclusive Access */}
            {activeTab === 'exclusive' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(analytics.exclusiveData).map(([key, enabled], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20 ${
                      enabled ? 'ring-2 ring-green-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#00132d]">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h3>
                      <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>
                    <p className="text-[#00132d]/70 text-sm">
                      {enabled ? 'You have access to this exclusive feature' : 'Feature not available in your tier'}
                    </p>
                    {enabled && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-3"
                      >
                        <span className="inline-flex items-center text-green-600 text-sm font-medium">
                          <CheckIcon className="mr-1" size="xs" />
                          Active
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}