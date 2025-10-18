'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChartIcon, DocumentIcon } from '@/components/ui/icons';

interface IndustryAnalytics {
  totalReach: number;
  engagementRate: number;
  trendInfluence: number;
  networkGrowth: number;
  contentViews: number;
  collaborationRequests: number;
  monthlyTrends: Array<{
    month: string;
    reach: number;
    engagement: number;
    influence: number;
  }>;
  topContent: Array<{
    id: string;
    type: 'outfit' | 'trend' | 'collaboration';
    title: string;
    views: number;
    engagement: number;
    date: string;
  }>;
  industryInsights: Array<{
    category: string;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    description: string;
  }>;
}

interface IndustryProfessionalDashboardProps {
  analytics: IndustryAnalytics;
  participantType: string;
  loading?: boolean;
}

export default function IndustryProfessionalDashboard({ 
  analytics, 
  participantType, 
  loading = false 
}: IndustryProfessionalDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'network' | 'insights'>('overview');

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
            <div className="animate-pulse">
              <div className="h-4 bg-[#00132d]/20 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-[#00132d]/20 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-[#00132d]/20 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
    }
  };

  const getParticipantTypeIcon = (type: string) => {
    // Professional icons removed for premium appearance
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#00132d] to-[#00132d]/80 rounded-2xl p-6 text-[#fff7d7]"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{getParticipantTypeIcon(participantType)}</span>
              <h2 className="text-2xl font-bold">
                Industry Professional Dashboard
              </h2>
            </div>
            <p className="text-[#fff7d7]/80">
              Advanced analytics and insights for {participantType.replace(/_/g, ' ')} professionals
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatNumber(analytics.totalReach)}</div>
            <div className="text-sm text-[#fff7d7]/80">Total Reach</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#00132d]/5 rounded-2xl p-2 border border-[#00132d]/20"
      >
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: <ChartIcon className="text-current" size="sm" /> },
            { key: 'trends', label: 'Trends', icon: <ChartIcon className="text-current" size="sm" /> },
            { key: 'network', label: 'Network', icon: <ChartIcon className="text-current" size="sm" /> },
            { key: 'insights', label: 'Insights', icon: <ChartIcon className="text-current" size="sm" /> }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative p-3 rounded-xl text-center transition-all duration-300 ${
                activeTab === tab.key
                  ? 'text-[#fff7d7] shadow-lg'
                  : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
              }`}
              whileHover={{ scale: activeTab === tab.key ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeIndustryTab"
                  className="absolute inset-0 bg-[#00132d] rounded-xl"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10">
                <div className="text-xl mb-1">{tab.icon}</div>
                <div className="font-semibold text-sm">{tab.label}</div>
              </div>
            </motion.button>
          ))}
        </div>
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
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Key Metrics */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-6">Key Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00132d] mb-2">
                        {analytics.engagementRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-[#00132d]/60">Engagement Rate</div>
                      <div className="text-xs text-green-600 mt-1">+12% vs last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00132d] mb-2">
                        {analytics.trendInfluence}
                      </div>
                      <div className="text-sm text-[#00132d]/60">Trend Influence Score</div>
                      <div className="text-xs text-green-600 mt-1">+8% vs last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00132d] mb-2">
                        {formatNumber(analytics.contentViews)}
                      </div>
                      <div className="text-sm text-[#00132d]/60">Content Views</div>
                      <div className="text-xs text-green-600 mt-1">+25% vs last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00132d] mb-2">
                        {analytics.collaborationRequests}
                      </div>
                      <div className="text-sm text-[#00132d]/60">Collaboration Requests</div>
                      <div className="text-xs text-blue-600 mt-1">5 pending</div>
                    </div>
                  </div>
                </div>

                {/* Top Content */}
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-xl font-semibold text-[#00132d] mb-6">Top Performing Content</h3>
                  <div className="space-y-4">
                    {analytics.topContent.map((content, index) => (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#00132d] text-[#fff7d7] rounded-lg flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-[#00132d]">{content.title}</div>
                            <div className="text-sm text-[#00132d]/60">
                              {content.type} • {new Date(content.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[#00132d]">
                            {formatNumber(content.views)} views
                          </div>
                          <div className="text-sm text-[#00132d]/60">
                            {content.engagement.toFixed(1)}% engagement
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-lg font-semibold text-[#00132d] mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 bg-[#00132d] text-[#fff7d7] rounded-xl font-semibold hover:bg-[#00132d]/80 transition-colors"
                    >
                      Download Analytics Report
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 bg-white border border-[#00132d]/20 text-[#00132d] rounded-xl font-semibold hover:bg-[#00132d]/5 transition-colors"
                    >
                      🤝 View Collaboration Requests
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 bg-white border border-[#00132d]/20 text-[#00132d] rounded-xl font-semibold hover:bg-[#00132d]/5 transition-colors"
                    >
                      Create Trend Report
                    </motion.button>
                  </div>
                </div>

                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                  <h3 className="text-lg font-semibold text-[#00132d] mb-4">Network Growth</h3>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00132d] mb-2">
                      +{analytics.networkGrowth}%
                    </div>
                    <div className="text-sm text-[#00132d]/60 mb-4">This Month</div>
                    <div className="w-full bg-[#00132d]/10 rounded-full h-2">
                      <div 
                        className="bg-[#00132d] h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(analytics.networkGrowth, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Industry Trend Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analytics.industryInsights.map((insight, index) => (
                    <motion.div
                      key={insight.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-[#00132d]">{insight.category}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getTrendIcon(insight.trend)}</span>
                          <span className={`font-semibold ${
                            insight.trend === 'up' ? 'text-green-600' : 
                            insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {insight.percentage > 0 ? '+' : ''}{insight.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-[#00132d]/70">{insight.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Monthly Performance Trends</h3>
                <div className="space-y-4">
                  {analytics.monthlyTrends.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                      <div className="font-semibold text-[#00132d]">{month.month}</div>
                      <div className="flex space-x-6 text-sm">
                        <div>
                          <span className="text-[#00132d]/60">Reach: </span>
                          <span className="font-semibold text-[#00132d]">{formatNumber(month.reach)}</span>
                        </div>
                        <div>
                          <span className="text-[#00132d]/60">Engagement: </span>
                          <span className="font-semibold text-[#00132d]">{month.engagement.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-[#00132d]/60">Influence: </span>
                          <span className="font-semibold text-[#00132d]">{month.influence}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Professional Network</h3>
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <ChartIcon className="text-[#00132d]/40" size="xl" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#00132d] mb-2">Network Features Coming Soon</h4>
                  <p className="text-[#00132d]/70">
                    Advanced networking features for industry professionals are in development.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Market Intelligence</h3>
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <ChartIcon className="text-[#00132d]/40" size="xl" />
                  </div>
                  <h4 className="text-lg font-semibold text-[#00132d] mb-2">Advanced Insights Coming Soon</h4>
                  <p className="text-[#00132d]/70">
                    Detailed market intelligence and competitive analysis features are being developed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}