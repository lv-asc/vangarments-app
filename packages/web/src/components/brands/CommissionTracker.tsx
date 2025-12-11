// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandAccount {
  id: string;
  brandInfo: {
    name: string;
  };
}

interface CommissionData {
  totalEarned: number;
  monthlyEarnings: number;
  pendingPayments: number;
  averageCommissionRate: number;
  topPerformingItems: Array<{
    id: string;
    name: string;
    sales: number;
    commission: number;
    commissionRate: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    sales: number;
    commission: number;
    transactions: number;
  }>;
  partnerPerformance: Array<{
    partnerId: string;
    partnerName: string;
    sales: number;
    commission: number;
    commissionRate: number;
    itemsSold: number;
  }>;
}

interface Transaction {
  id: string;
  itemName: string;
  partnerName: string;
  saleAmount: number;
  commissionAmount: number;
  commissionRate: number;
  status: 'completed' | 'pending' | 'processing';
  date: string;
}

interface CommissionTrackerProps {
  brandAccount: BrandAccount;
}

export default function CommissionTracker({ brandAccount }: CommissionTrackerProps) {
  const [commissionData, setCommissionData] = useState<CommissionData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'partners' | 'analytics'>('overview');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadCommissionData();
  }, [brandAccount.id, dateRange]);

  const loadCommissionData = async () => {
    try {
      // Mock data for now - in real implementation, fetch from API
      const mockCommissionData: CommissionData = {
        totalEarned: 15750.50,
        monthlyEarnings: 3250.75,
        pendingPayments: 850.25,
        averageCommissionRate: 13.5,
        topPerformingItems: [
          {
            id: '1',
            name: 'Summer Floral Dress',
            sales: 5200,
            commission: 780,
            commissionRate: 15
          },
          {
            id: '2',
            name: 'Casual Denim Jacket',
            sales: 3800,
            commission: 456,
            commissionRate: 12
          },
          {
            id: '3',
            name: 'Evening Cocktail Dress',
            sales: 4500,
            commission: 675,
            commissionRate: 15
          }
        ],
        monthlyBreakdown: [
          { month: 'Jan 2024', sales: 12000, commission: 1800, transactions: 45 },
          { month: 'Feb 2024', sales: 15500, commission: 2325, transactions: 58 },
          { month: 'Mar 2024', sales: 18200, commission: 2730, transactions: 67 },
          { month: 'Apr 2024', sales: 21000, commission: 3150, transactions: 72 },
          { month: 'May 2024', sales: 19800, commission: 2970, transactions: 69 },
          { month: 'Jun 2024', sales: 22500, commission: 3375, transactions: 78 }
        ],
        partnerPerformance: [
          {
            partnerId: '1',
            partnerName: 'Fashion Boutique ABC',
            sales: 25000,
            commission: 3750,
            commissionRate: 15,
            itemsSold: 85
          },
          {
            partnerId: '2',
            partnerName: 'Online Fashion Store',
            sales: 45000,
            commission: 5400,
            commissionRate: 12,
            itemsSold: 150
          }
        ]
      };

      const mockTransactions: Transaction[] = [
        {
          id: '1',
          itemName: 'Summer Floral Dress',
          partnerName: 'Fashion Boutique ABC',
          saleAmount: 299.90,
          commissionAmount: 44.99,
          commissionRate: 15,
          status: 'completed',
          date: new Date().toISOString()
        },
        {
          id: '2',
          itemName: 'Casual Denim Jacket',
          partnerName: 'Online Fashion Store',
          saleAmount: 189.90,
          commissionAmount: 22.79,
          commissionRate: 12,
          status: 'pending',
          date: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          itemName: 'Evening Cocktail Dress',
          partnerName: 'Fashion Boutique ABC',
          saleAmount: 450.00,
          commissionAmount: 67.50,
          commissionRate: 15,
          status: 'processing',
          date: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setCommissionData(mockCommissionData);
      setRecentTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (!commissionData) {
    return (
      <div className="text-center py-12">

        <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Commission Data</h3>
        <p className="text-[#00132d]/70">Commission data will appear here once you have sales</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#00132d] mb-2">Commission Analytics</h2>
          <p className="text-[#00132d]/70">
            Track your earnings and partnership performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Total
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(commissionData.totalEarned)}
          </div>
          <div className="text-sm opacity-80">Total Earned</div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
              This Month
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(commissionData.monthlyEarnings)}
          </div>
          <div className="text-sm opacity-80">Monthly Earnings</div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Pending
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {formatCurrency(commissionData.pendingPayments)}
          </div>
          <div className="text-sm opacity-80">Pending Payments</div>
        </div>

        <div className="bg-[#00132d] rounded-2xl p-6 text-[#fff7d7]">
          <div className="flex items-center justify-between mb-4">

            <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
              Average
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">
            {commissionData.averageCommissionRate}%
          </div>
          <div className="text-sm opacity-80">Avg. Commission Rate</div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#00132d]/5 rounded-2xl p-2 border border-[#00132d]/20"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'partners', label: 'Partners' },
            { key: 'analytics', label: 'Analytics' }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative p-3 rounded-xl text-center transition-all duration-300 ${activeTab === tab.key
                  ? 'text-[#fff7d7] shadow-lg'
                  : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                }`}
              whileHover={{ scale: activeTab === tab.key ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeCommissionTab"
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Items */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Top Performing Items</h3>
                <div className="space-y-4">
                  {commissionData.topPerformingItems.map((item, index) => (
                    <motion.div
                      key={item.id}
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
                          <div className="font-semibold text-[#00132d]">{item.name}</div>
                          <div className="text-sm text-[#00132d]/60">
                            {formatCurrency(item.sales)} sales • {item.commissionRate}% rate
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#00132d]">
                          {formatCurrency(item.commission)}
                        </div>
                        <div className="text-sm text-[#00132d]/60">commission</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Monthly Performance</h3>
                <div className="space-y-4">
                  {commissionData.monthlyBreakdown.slice(-6).map((month, index) => (
                    <motion.div
                      key={month.month}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
                    >
                      <div>
                        <div className="font-semibold text-[#00132d]">{month.month}</div>
                        <div className="text-sm text-[#00132d]/60">
                          {month.transactions} transactions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#00132d]">
                          {formatCurrency(month.commission)}
                        </div>
                        <div className="text-sm text-[#00132d]/60">
                          from {formatCurrency(month.sales)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
              <h3 className="text-xl font-semibold text-[#00132d] mb-6">Recent Transactions</h3>
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-[#00132d]">{transaction.itemName}</div>
                      <div className="text-sm text-[#00132d]/60">
                        Sold by {transaction.partnerName} • {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="font-semibold text-[#00132d]">
                        {formatCurrency(transaction.saleAmount)}
                      </div>
                      <div className="text-sm text-[#00132d]/60">sale amount</div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(transaction.commissionAmount)}
                      </div>
                      <div className="text-sm text-[#00132d]/60">
                        {transaction.commissionRate}% commission
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
              <h3 className="text-xl font-semibold text-[#00132d] mb-6">Partner Performance</h3>
              <div className="space-y-4">
                {commissionData.partnerPerformance.map((partner, index) => (
                  <motion.div
                    key={partner.partnerId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-white/50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-[#00132d]">{partner.partnerName}</h4>
                      <div className="text-sm text-[#00132d]/60">
                        {partner.commissionRate}% commission rate
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#00132d]">
                          {formatCurrency(partner.sales)}
                        </div>
                        <div className="text-sm text-[#00132d]/60">Total Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(partner.commission)}
                        </div>
                        <div className="text-sm text-[#00132d]/60">Commission Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#00132d]">
                          {partner.itemsSold}
                        </div>
                        <div className="text-sm text-[#00132d]/60">Items Sold</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Commission Trends</h3>
                <div className="text-center py-8">

                  <h4 className="text-lg font-semibold text-[#00132d] mb-2">Advanced Analytics Coming Soon</h4>
                  <p className="text-[#00132d]/70">
                    Detailed commission analytics and trend analysis are in development.
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