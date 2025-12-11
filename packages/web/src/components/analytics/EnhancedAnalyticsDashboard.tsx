// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StyleDNAAnalysis from './StyleDNAAnalysis';
import WardrobeOptimization from './WardrobeOptimization';
import TrendPredictions from './TrendPredictions';
import ItemValuationAnalytics from './ItemValuationAnalytics';
import FloatingActionButton from '../ui/FloatingActionButton';

interface AnalyticsInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
  action?: string;
  icon: string;
}

interface EnhancedAnalyticsDashboardProps {
  styleDNAData: any;
  optimizationData: any;
  trendData: any;
  valuationData: any;
  loading?: boolean;
}

export default function EnhancedAnalyticsDashboard({
  styleDNAData,
  optimizationData,
  trendData,
  valuationData,
  loading = false
}: EnhancedAnalyticsDashboardProps) {
  const [activeSection, setActiveSection] = useState<'dna' | 'optimization' | 'trends' | 'valuation'>('dna');
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    // Generate dynamic insights based on data
    if (!loading) {
      const generatedInsights: AnalyticsInsight[] = [
        {
          id: '1',
          type: 'success',
          title: 'Great Style Consistency!',
          description: 'Your minimalist style is 45% of your wardrobe - very cohesive!',
          action: 'Explore similar pieces',
        },
        {
          id: '2',
          type: 'warning',
          title: 'Underutilized Items Detected',
          description: '25 items haven\'t been worn in the last 3 months',
          action: 'Review suggestions'
        },
        {
          id: '3',
          type: 'tip',
          title: 'Trend Opportunity',
          description: 'Oversized blazers are trending and match your style DNA perfectly',
          action: 'Shop recommendations'
        }
      ];
      setInsights(generatedInsights);
    }
  }, [loading]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-[#00132d] text-[#fff7d7]';
      case 'warning': return 'bg-[#00132d]/80 text-[#fff7d7]';
      case 'info': return 'bg-[#00132d]/90 text-[#fff7d7]';
      case 'tip': return 'bg-[#00132d]/70 text-[#fff7d7]';
      default: return 'bg-[#00132d]/60 text-[#fff7d7]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7d7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4 border-4 border-[#00132d] border-t-transparent rounded-full"
              />
              <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-[#00132d]/30 border-b-transparent rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-[#00132d] mb-2">Analyzing Your Fashion Data</h2>
            <p className="text-[#00132d]/70">Generating personalized insights...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7d7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#00132d] mb-2">
                Fashion Intelligence Hub
              </h1>
              <p className="text-[#00132d]/70 text-lg">
                AI-powered insights to optimize your style and wardrobe
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 lg:mt-0 flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInsights(!showInsights)}
                className="flex items-center space-x-2 bg-[#00132d]/10 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-[#00132d]/20"
              >
                <span className="font-medium text-[#00132d]">Smart Insights</span>
                {insights.length > 0 && (
                  <span className="bg-[#00132d] text-[#fff7d7] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {insights.length}
                  </span>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span className="font-medium">Export Report</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Smart Insights Panel */}
        <AnimatePresence>
          {showInsights && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="bg-[#00132d]/5 rounded-2xl shadow-lg p-6 border border-[#00132d]/20">
                <h3 className="text-lg font-semibold text-[#00132d] mb-4 flex items-center">
                  <span className="mr-2">🧠</span>
                  Smart Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl ${getInsightColor(insight.type)} relative overflow-hidden`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{insight.icon}</span>
                          <span className="text-xs bg-[#fff7d7]/20 px-2 py-1 rounded-full">
                            {insight.type}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <p className="text-sm opacity-90 mb-3">{insight.description}</p>
                        {insight.action && (
                          <button className="text-xs bg-[#fff7d7]/20 hover:bg-[#fff7d7]/30 px-3 py-1 rounded-full transition-colors">
                            {insight.action} →
                          </button>
                        )}
                      </div>
                      <div className="absolute top-0 right-0 w-20 h-20 bg-[#fff7d7]/10 rounded-full -mr-10 -mt-10" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <nav className="bg-[#00132d]/5 rounded-2xl shadow-lg p-2 border border-[#00132d]/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { key: 'dna', label: 'Style DNA' },
                { key: 'optimization', label: 'Optimization' },
                { key: 'trends', label: 'Trends' },
                { key: 'valuation', label: 'Analytics' }
              ].map((section) => (
                <motion.button
                  key={section.key}
                  onClick={() => setActiveSection(section.key as any)}
                  className={`relative p-4 rounded-xl text-center transition-all duration-300 ${activeSection === section.key
                      ? 'text-[#fff7d7] shadow-lg transform scale-105'
                      : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                    }`}
                  whileHover={{ scale: activeSection === section.key ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeSection === section.key && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 bg-[#00132d] rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="text-2xl mb-1">{section.icon}</div>
                    <div className="font-semibold text-sm">{section.label}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </nav>
        </motion.div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'dna' && (
              <StyleDNAAnalysis data={styleDNAData} loading={false} />
            )}

            {activeSection === 'optimization' && (
              <WardrobeOptimization
                recommendations={optimizationData.recommendations}
                stats={optimizationData.stats}
                loading={false}
              />
            )}

            {activeSection === 'trends' && (
              <TrendPredictions
                trends={trendData.trends}
                personalInsights={trendData.personalInsights}
                loading={false}
              />
            )}

            {activeSection === 'valuation' && (
              <ItemValuationAnalytics
                items={valuationData.items}
                usageAnalytics={valuationData.usageAnalytics}
                wardrobeMetrics={valuationData.wardrobeMetrics}
                loading={false}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-[#00132d]/5 rounded-2xl shadow-lg p-6 border border-[#00132d]/20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Items Analyzed', value: '120', change: '+5 this week' },
              { label: 'Style Score', value: '92%', change: '+3% this month' },
              { label: 'Wardrobe Value', value: '$8.5K', change: '+$200 this month' },
              { label: 'Optimization', value: '85%', change: '+12% improved' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-[#00132d] mb-1">{stat.value}</div>
                <div className="text-sm text-[#00132d]/70 mb-1">{stat.label}</div>
                <div className="text-xs text-[#00132d] font-medium">{stat.change}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Floating Action Button */}
        <FloatingActionButton
          actions={[
            {
              id: 'export',
              label: 'Export Report',

              onClick: () => console.log('Export report'),
              color: 'bg-[#00132d] text-[#fff7d7]'
            },
            {
              id: 'share',
              label: 'Share Insights',
              icon: 'share',
              onClick: () => console.log('Share insights'),
              color: 'bg-[#00132d]/80 text-[#fff7d7]'
            },
            {
              id: 'refresh',
              label: 'Refresh Data',

              onClick: () => console.log('Refresh data'),
              color: 'bg-[#00132d]/90 text-[#fff7d7]'
            },
            {
              id: 'settings',
              label: 'Analytics Settings',

              onClick: () => console.log('Open settings'),
              color: 'bg-[#00132d]/70 text-[#fff7d7]'
            }
          ]}

          mainColor="bg-[#00132d] text-[#fff7d7]"
        />
      </div>
    </div>
  );
}