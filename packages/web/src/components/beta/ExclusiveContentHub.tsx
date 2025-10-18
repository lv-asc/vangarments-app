'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LightningIcon, ChartIcon, DocumentIcon, SparklesIcon } from '@/components/ui/icons';

interface ExclusiveContent {
  earlyFeatures: Array<{
    id: string;
    name: string;
    description: string;
    status: 'alpha' | 'beta' | 'coming_soon';
    accessLevel: string;
  }>;
  industryReports: Array<{
    id: string;
    title: string;
    description: string;
    downloadUrl: string;
    publishedAt: Date;
  }>;
  trendPreviews: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    confidence: number;
  }>;
  networkingOpportunities: Array<{
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    attendeeLimit: number;
    registrationUrl: string;
  }>;
}

interface ExclusiveContentHubProps {
  content: ExclusiveContent;
  onFeatureAccess: (featureId: string) => void;
  onDownloadReport: (reportId: string) => void;
  onRegisterEvent: (eventId: string) => void;
  loading?: boolean;
}

export default function ExclusiveContentHub({
  content,
  onFeatureAccess,
  onDownloadReport,
  onRegisterEvent,
  loading = false
}: ExclusiveContentHubProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'reports' | 'trends' | 'networking'>('features');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const tabs = [
    { key: 'features', label: 'Early Features', icon: <LightningIcon className="text-current" size="sm" />, count: content.earlyFeatures.length },
    { key: 'reports', label: 'Industry Reports', icon: <ChartIcon className="text-current" size="sm" />, count: content.industryReports.length },
    { key: 'trends', label: 'Trend Previews', icon: <DocumentIcon className="text-current" size="sm" />, count: content.trendPreviews.length },
    { key: 'networking', label: 'Networking', icon: <ChartIcon className="text-current" size="sm" />, count: content.networkingOpportunities.length },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alpha': return 'bg-red-100 text-red-800';
      case 'beta': return 'bg-yellow-100 text-yellow-800';
      case 'coming_soon': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'alpha': return 'Alpha Access';
      case 'beta': return 'Beta Testing';
      case 'coming_soon': return 'Coming Soon';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#fff7d7] p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#00132d]/20 rounded w-1/2"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#00132d]/20 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-[#00132d]/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff7d7] space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-[#00132d] mb-2">
          Exclusive Content Hub
        </h2>
        <p className="text-[#00132d]/70">
          Early access features and exclusive content for beta pioneers
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                  {tab.count > 0 && (
                    <div className="text-xs mt-1 opacity-75">
                      {tab.count} item{tab.count !== 1 ? 's' : ''}
                    </div>
                  )}
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
          {/* Early Features */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              {content.earlyFeatures.length > 0 ? (
                content.earlyFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedItem(selectedItem === feature.id ? null : feature.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-[#00132d]">{feature.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feature.status)}`}>
                            {getStatusLabel(feature.status)}
                          </span>
                        </div>
                        <p className="text-[#00132d]/70 mb-3">{feature.description}</p>
                        <div className="text-sm text-[#00132d]/50">
                          Access Level: {feature.accessLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFeatureAccess(feature.id);
                        }}
                        className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg font-medium hover:bg-[#00132d]/80 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={feature.status === 'coming_soon'}
                      >
                        {feature.status === 'coming_soon' ? 'Coming Soon' : 'Try Now'}
                      </motion.button>
                    </div>
                    
                    <AnimatePresence>
                      {selectedItem === feature.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-[#00132d]/10"
                        >
                          <div className="bg-[#fff7d7] rounded-xl p-4">
                            <h4 className="font-semibold text-[#00132d] mb-2">Feature Details</h4>
                            <p className="text-sm text-[#00132d]/70 mb-3">
                              This exclusive feature is available only to beta participants. Your feedback helps us improve before the public release.
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-[#00132d]/60">
                              <span>Beta Exclusive</span>
                              <span>Feedback Welcome</span>
                              <span>Early Access</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <LightningIcon className="text-[#00132d]/40" size="xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Early Features Available</h3>
                  <p className="text-[#00132d]/70">Check back soon for exclusive beta features!</p>
                </div>
              )}
            </div>
          )}

          {/* Industry Reports */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {content.industryReports.length > 0 ? (
                content.industryReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex justify-center">
                        <ChartIcon className="text-[#00132d]" size="lg" />
                      </div>
                      <span className="text-xs text-[#00132d]/50">
                        {new Date(report.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#00132d] mb-2">{report.title}</h3>
                    <p className="text-[#00132d]/70 mb-4 text-sm">{report.description}</p>
                    <motion.button
                      onClick={() => onDownloadReport(report.id)}
                      className="w-full bg-[#00132d] text-[#fff7d7] py-2 rounded-lg font-medium hover:bg-[#00132d]/80 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Download Report
                    </motion.button>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <div className="flex justify-center mb-4">
                    <ChartIcon className="text-[#00132d]/40" size="xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Reports Available</h3>
                  <p className="text-[#00132d]/70">Industry reports will be published here for beta participants.</p>
                </div>
              )}
            </div>
          )}

          {/* Trend Previews */}
          {activeTab === 'trends' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {content.trendPreviews.length > 0 ? (
                content.trendPreviews.map((trend, index) => (
                  <motion.div
                    key={trend.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-2xl overflow-hidden border border-[#00132d]/20"
                  >
                    <div className="aspect-video bg-gradient-to-br from-[#00132d]/10 to-[#00132d]/20 flex items-center justify-center">
                      <div className="flex justify-center">
                        <SparklesIcon className="text-purple-500" size="xl" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-[#00132d]">{trend.title}</h3>
                        <span className="text-sm font-medium text-green-600">
                          {(trend.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-[#00132d]/70">{trend.description}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <div className="flex justify-center mb-4">
                    <SparklesIcon className="text-purple-400" size="xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Trend Previews Available</h3>
                  <p className="text-[#00132d]/70">Exclusive trend previews will appear here for beta participants.</p>
                </div>
              )}
            </div>
          )}

          {/* Networking Opportunities */}
          {activeTab === 'networking' && (
            <div className="space-y-4">
              {content.networkingOpportunities.length > 0 ? (
                content.networkingOpportunities.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex justify-center">
                            <ChartIcon className="text-[#00132d]" size="lg" />
                          </div>
                          <h3 className="text-xl font-semibold text-[#00132d]">{event.title}</h3>
                        </div>
                        <p className="text-[#00132d]/70 mb-3">{event.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#00132d]/60">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-[#00132d]/40" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-[#00132d]/40" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-[#00132d]/40" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            <span>Max {event.attendeeLimit} attendees</span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => onRegisterEvent(event.id)}
                        className="bg-[#00132d] text-[#fff7d7] px-6 py-2 rounded-lg font-medium hover:bg-[#00132d]/80 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Register
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <ChartIcon className="text-[#00132d]/40" size="xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Events Scheduled</h3>
                  <p className="text-[#00132d]/70">Exclusive networking events will be announced here for beta participants.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}