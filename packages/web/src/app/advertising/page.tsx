'use client';

import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
import AdvertisingDashboard from '@/components/advertising/AdvertisingDashboard';
import TrendReports from '@/components/advertising/TrendReports';
import RevenueSharingDashboard from '@/components/advertising/RevenueSharingDashboard';

// Mock data for advertising features
const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Fashion Collection 2024',
    status: 'active' as const,
    budget: 5000,
    spent: 3200,
    impressions: 125000,
    clicks: 2500,
    conversions: 125,
    ctr: 0.02,
    cpc: 1.28,
    roas: 4.2,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    targetAudience: {
      demographics: ['25-34', 'Female'],
      interests: ['Fashion', 'Summer Style'],
      behaviors: ['Frequent Shoppers']
    }
  },
  {
    id: '2',
    name: 'Sustainable Fashion Awareness',
    status: 'active' as const,
    budget: 3000,
    spent: 1800,
    impressions: 85000,
    clicks: 1700,
    conversions: 68,
    ctr: 0.02,
    cpc: 1.06,
    roas: 3.8,
    startDate: '2024-07-01',
    endDate: '2024-09-30',
    targetAudience: {
      demographics: ['25-44', 'All Genders'],
      interests: ['Sustainability', 'Eco Fashion'],
      behaviors: ['Conscious Consumers']
    }
  }
];

const mockAdvertisingMetrics = {
  totalSpend: 15000,
  totalImpressions: 450000,
  totalClicks: 9000,
  totalConversions: 450,
  averageCTR: 0.02,
  averageCPC: 1.67,
  averageROAS: 4.1,
  activeCampaigns: 5
};

const mockTrendReports = [
  {
    id: '1',
    title: 'Q3 2024 Fashion Trends Analysis',
    category: 'Fashion Trends',
    period: 'Q3 2024',
    generatedDate: '2024-09-15',
    insights: [
      {
        type: 'growth' as const,
        title: 'Oversized Blazers Surge',
        description: 'Oversized blazers show 45% increase in search volume and engagement',
        percentage: 45,
        confidence: 92
      },
      {
        type: 'emerging' as const,
        title: 'Sustainable Materials Focus',
        description: 'Growing consumer interest in eco-friendly fashion materials',
        percentage: 32,
        confidence: 87
      }
    ],
    marketData: {
      totalMarketSize: 2500000000,
      growthRate: 12.5,
      topBrands: [
        { name: 'Zara', marketShare: 15.2, growth: 8.5 },
        { name: 'H&M', marketShare: 12.8, growth: 6.2 },
        { name: 'Uniqlo', marketShare: 9.5, growth: 11.3 }
      ],
      priceRanges: [
        { range: '$0-50', volume: 45, growth: 8.2 },
        { range: '$51-100', volume: 35, growth: 12.5 },
        { range: '$101-200', volume: 15, growth: 15.8 },
        { range: '$200+', volume: 5, growth: 22.1 }
      ]
    },
    demographics: {
      ageGroups: [
        { range: '18-24', engagement: 78, spending: 450 },
        { range: '25-34', engagement: 85, spending: 680 },
        { range: '35-44', engagement: 72, spending: 520 },
        { range: '45+', engagement: 45, spending: 380 }
      ],
      genderSplit: {
        male: 25,
        female: 70,
        nonBinary: 5
      },
      geographicData: [
        {
          region: 'North America',
          engagement: 82,
          topTrends: ['Minimalist Style', 'Athleisure', 'Vintage Revival']
        },
        {
          region: 'Europe',
          engagement: 78,
          topTrends: ['Sustainable Fashion', 'Luxury Basics', 'Street Style']
        }
      ]
    }
  }
];

const mockPartnerships = [
  {
    id: '1',
    partnerName: 'Fashion Forward Brands',
    partnerType: 'brand' as const,
    status: 'active' as const,
    commissionRate: 15,
    totalRevenue: 125000,
    partnerRevenue: 18750,
    platformRevenue: 106250,
    transactionCount: 450,
    averageOrderValue: 278,
    startDate: '2024-01-01',
    lastPayment: '2024-08-01',
    nextPayment: '2024-09-01'
  },
  {
    id: '2',
    partnerName: 'Style Influencer Network',
    partnerType: 'influencer' as const,
    status: 'active' as const,
    commissionRate: 20,
    totalRevenue: 85000,
    partnerRevenue: 17000,
    platformRevenue: 68000,
    transactionCount: 320,
    averageOrderValue: 266,
    startDate: '2024-02-15',
    lastPayment: '2024-08-15',
    nextPayment: '2024-09-15'
  }
];

const mockRevenueMetrics = {
  totalRevenue: 450000,
  platformRevenue: 360000,
  partnerRevenue: 90000,
  pendingPayments: 25000,
  activePartnerships: 12,
  monthlyGrowth: 18.5,
  topPerformingPartners: mockPartnerships
};

const mockTransactions = [
  {
    id: '1',
    partnerId: '1',
    partnerName: 'Fashion Forward Brands',
    amount: 450,
    commission: 67.50,
    platformFee: 382.50,
    date: '2024-08-28',
    status: 'completed' as const,
    orderDetails: {
      itemCount: 3,
      category: 'Dresses',
      customerType: 'Premium'
    }
  }
];

export default function AdvertisingPage() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'campaigns' | 'reports' | 'revenue'>('campaigns');

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7d7] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto border-4 border-[#00132d] border-t-transparent rounded-full animate-spin" />
            <div
              className="absolute inset-0 w-20 h-20 mx-auto border-4 border-[#00132d]/30 border-b-transparent rounded-full"
            />
          </div>
          <h2 className="text-2xl font-bold text-[#00132d] mb-2">Loading Advertising Platform</h2>
          <p className="text-[#00132d]/70">Preparing your campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7d7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#00132d] mb-2">
                Premium Advertising Platform
              </h1>
              <p className="text-[#00132d]/70 text-lg">
                Advanced targeting, market intelligence, and revenue optimization for fashion brands
              </p>
            </div>
            
            <div className="mt-4 lg:mt-0 flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-[#00132d]/10 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-[#00132d]/20"
              >
                <span className="font-medium text-[#00132d]">Analytics</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span className="font-medium">New Campaign</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="mb-8">
          <nav className="bg-[#00132d]/5 rounded-2xl shadow-lg p-2 border border-[#00132d]/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { key: 'campaigns', label: 'Campaign Management' },
                { key: 'reports', label: 'Trend Reports' },
                { key: 'revenue', label: 'Revenue Sharing' }
              ].map((section) => (
                <motion.button
                  key={section.key}
                  onClick={() => setActiveSection(section.key as any)}
                  className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                    activeSection === section.key
                      ? 'text-[#fff7d7] shadow-lg transform scale-105'
                      : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                  }`}
                  whileHover={{ scale: activeSection === section.key ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeSection === section.key && (
                    <motion.div
                      layoutId="activeAdBackground"
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

        {/* Content with Animation */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {activeSection === 'campaigns' && (
            <AdvertisingDashboard 
              campaigns={mockCampaigns}
              metrics={mockAdvertisingMetrics}
              loading={false}
            />
          )}
          
          {activeSection === 'reports' && (
            <TrendReports 
              reports={mockTrendReports}
              loading={false}
            />
          )}
          
          {activeSection === 'revenue' && (
            <RevenueSharingDashboard 
              partnerships={mockPartnerships}
              metrics={mockRevenueMetrics}
              transactions={mockTransactions}
              loading={false}
            />
          )}
        </motion.div>

        {/* Enhanced Premium Features Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-[#00132d] rounded-2xl p-8 text-[#fff7d7] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#fff7d7]/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#fff7d7]/5 rounded-full -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-bold mb-4"
              >
                Premium Advertising Features
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl opacity-90 max-w-2xl mx-auto"
              >
                Unlock the full potential of fashion advertising with AI-powered insights and advanced targeting
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {[
                {
                  title: 'Smart Targeting',
                  description: 'AI-powered audience segmentation based on style DNA, wardrobe data, and shopping behavior',
                  features: ['Style DNA matching', 'Behavioral targeting', 'Lookalike audiences']
                },
                {
                  title: 'Market Intelligence',
                  description: 'Real-time fashion trends, competitor analysis, and market opportunity identification',
                  features: ['Trend forecasting', 'Competitor insights', 'Market sizing']
                },
                {
                  title: 'Revenue Optimization',
                  description: 'Advanced attribution, revenue sharing, and performance optimization tools',
                  features: ['Multi-touch attribution', 'Revenue sharing', 'ROI optimization']
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-[#fff7d7]/10 backdrop-blur-sm rounded-xl p-6 hover:bg-[#fff7d7]/15 transition-all duration-300"
                >
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-[#fff7d7]/80 mb-4 text-sm leading-relaxed">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-[#fff7d7]/70 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#fff7d7]/50 rounded-full mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#fff7d7] text-[#00132d] px-8 py-4 rounded-xl font-semibold hover:bg-[#fff7d7]/90 transition-all duration-300 shadow-lg"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-[#fff7d7] text-[#fff7d7] px-8 py-4 rounded-xl font-semibold hover:bg-[#fff7d7] hover:text-[#00132d] transition-all duration-300"
              >
                View Pricing
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}