'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BrandAccount {
  id: string;
  userId: string;
  brandInfo: {
    name: string;
    description?: string;
    website?: string;
    logo?: string;
    banner?: string;
    socialLinks?: Array<{
      platform: string;
      url: string;
    }>;
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    brandColors?: string[];
    brandStyle?: string[];
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  partnershipTier: 'basic' | 'premium' | 'enterprise';
  badges: string[];
  analytics: {
    totalCatalogItems: number;
    totalSales: number;
    totalCommission: number;
    monthlyViews: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface BrandDashboardProps {
  brandAccount: BrandAccount;
}

export default function BrandDashboard({ brandAccount }: BrandDashboardProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    todayViews: 0,
    weeklyOrders: 0,
    monthlyRevenue: 0,
    catalogGrowth: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [brandAccount.id]);

  const loadDashboardData = async () => {
    try {
      // Mock data for now - in real implementation, fetch from API
      setRecentActivity([
        {
          id: '1',
          type: 'catalog_item_added',
          description: 'New item added to catalog',
          timestamp: new Date().toISOString(),
          details: 'Summer Collection Dress'
        },
        {
          id: '2',
          type: 'sale_completed',
          description: 'Sale completed',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'R$ 299.90'
        },
        {
          id: '3',
          type: 'partnership_request',
          description: 'New partnership request',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: 'Fashion Store ABC'
        }
      ]);

      setQuickStats({
        todayViews: Math.floor(Math.random() * 500) + 100,
        weeklyOrders: Math.floor(Math.random() * 50) + 10,
        monthlyRevenue: Math.floor(Math.random() * 10000) + 2000,
        catalogGrowth: Math.floor(Math.random() * 20) + 5
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    // Return empty string instead of emojis
    return '';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#00132d] to-[#00132d]/80 rounded-2xl p-6 text-[#fff7d7]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {brandAccount.brandInfo.name}!
            </h2>
            <p className="text-[#fff7d7]/80">
              Here's what's happening with your brand today
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTierColor(brandAccount.partnershipTier)}`}>
              {brandAccount.partnershipTier.charAt(0).toUpperCase() + brandAccount.partnershipTier.slice(1)} Partner
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-[#00132d]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              +12%
            </div>
          </div>
          <div className="text-2xl font-bold text-[#00132d] mb-1">
            {quickStats.todayViews.toLocaleString()}
          </div>
          <div className="text-sm text-[#00132d]/60">Views Today</div>
        </div>

        <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              +8%
            </div>
          </div>
          <div className="text-2xl font-bold text-[#00132d] mb-1">
            {quickStats.weeklyOrders}
          </div>
          <div className="text-sm text-[#00132d]/60">Orders This Week</div>
        </div>

        <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              +15%
            </div>
          </div>
          <div className="text-2xl font-bold text-[#00132d] mb-1">
            {formatCurrency(quickStats.monthlyRevenue)}
          </div>
          <div className="text-sm text-[#00132d]/60">Monthly Revenue</div>
        </div>

        <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              +{quickStats.catalogGrowth}
            </div>
          </div>
          <div className="text-2xl font-bold text-[#00132d] mb-1">
            {brandAccount.analytics.totalCatalogItems}
          </div>
          <div className="text-sm text-[#00132d]/60">Catalog Items</div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
        >
          <h3 className="text-xl font-semibold text-[#00132d] mb-6">Recent Activity</h3>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl"
              >
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-[#00132d]">{activity.description}</div>
                  <div className="text-sm text-[#00132d]/60">{activity.details}</div>
                  <div className="text-xs text-[#00132d]/40 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-[#00132d] hover:text-[#00132d]/80 font-semibold"
            >
              View All Activity →
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
            <h3 className="text-lg font-semibold text-[#00132d] mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-[#00132d] text-[#fff7d7] rounded-xl font-semibold hover:bg-[#00132d]/80 transition-colors"
              >
                Add New Product
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-white border border-[#00132d]/20 text-[#00132d] rounded-xl font-semibold hover:bg-[#00132d]/5 transition-colors"
              >
                View Analytics
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 bg-white border border-[#00132d]/20 text-[#00132d] rounded-xl font-semibold hover:bg-[#00132d]/5 transition-colors"
              >
                Manage Partnerships
              </motion.button>
            </div>
          </div>

          <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
            <h3 className="text-lg font-semibold text-[#00132d] mb-4">Brand Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#00132d]/70">Catalog Completeness</span>
                  <span className="font-semibold text-[#00132d]">85%</span>
                </div>
                <div className="w-full bg-[#00132d]/10 rounded-full h-2">
                  <div className="bg-[#00132d] h-2 rounded-full w-[85%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#00132d]/70">Profile Optimization</span>
                  <span className="font-semibold text-[#00132d]">92%</span>
                </div>
                <div className="w-full bg-[#00132d]/10 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-[92%]"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#00132d]/70">Customer Engagement</span>
                  <span className="font-semibold text-[#00132d]">78%</span>
                </div>
                <div className="w-full bg-[#00132d]/10 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full w-[78%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {brandAccount.badges && brandAccount.badges.length > 0 && (
            <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
              <h3 className="text-lg font-semibold text-[#00132d] mb-4">Brand Badges</h3>
              <div className="flex flex-wrap gap-2">
                {brandAccount.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-[#00132d] text-[#fff7d7] rounded-full text-sm font-medium"
                  >
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}