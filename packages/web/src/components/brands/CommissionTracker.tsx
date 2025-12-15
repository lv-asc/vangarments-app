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
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!commissionData) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Commission Data</h3>
        <p className="text-gray-500 text-sm">Commission data will appear here once you have sales</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Commission Analytics</h2>
          <p className="text-gray-500">
            Track your earnings and partnership performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm"
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
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100">
              Total
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1 relative z-10">
            {formatCurrency(commissionData.totalEarned)}
          </div>
          <div className="text-sm text-gray-500 relative z-10">Total Earned</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
              This Month
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1 relative z-10">
            {formatCurrency(commissionData.monthlyEarnings)}
          </div>
          <div className="text-sm text-gray-500 relative z-10">Monthly Earnings</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-semibold bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full border border-yellow-100">
              Pending
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1 relative z-10">
            {formatCurrency(commissionData.pendingPayments)}
          </div>
          <div className="text-sm text-gray-500 relative z-10">Pending Payments</div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="text-xs font-semibold bg-gray-700 text-gray-100 px-2.5 py-1 rounded-full border border-gray-600">
              Average
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1 relative z-10">
            {commissionData.averageCommissionRate}%
          </div>
          <div className="text-sm text-gray-400 relative z-10">Avg. Commission Rate</div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm w-full md:max-w-fit overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'transactions', label: 'Transactions' },
              { key: 'partners', label: 'Partners' },
              { key: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key
                  ? 'text-gray-900 bg-gray-100 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative z-10">
                  <div className="font-semibold">{tab.label}</div>
                </div>
              </motion.button>
            ))}
          </div>
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
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Top Performing Items</h3>
                <div className="space-y-4">
                  {commissionData.topPerformingItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(item.sales)} sales • {item.commissionRate}% rate
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-sm">
                          {formatCurrency(item.commission)}
                        </div>
                        <div className="text-xs text-gray-400">earned</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Performance</h3>
                <div className="space-y-4">
                  {commissionData.monthlyBreakdown.slice(-6).map((month, index) => (
                    <motion.div
                      key={month.month}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{month.month}</div>
                        <div className="text-xs text-gray-500">
                          {month.transactions} transactions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-sm">
                          {formatCurrency(month.commission)}
                        </div>
                        <div className="text-xs text-gray-400">
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
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h3>
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{transaction.itemName}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.partnerName} • {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(transaction.saleAmount)}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">sale amount</div>
                    </div>
                    <div className="text-center mx-4">
                      <div className="font-bold text-green-600 text-sm">
                        {formatCurrency(transaction.commissionAmount)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {transaction.commissionRate}%
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Partner Performance</h3>
              <div className="space-y-4">
                {commissionData.partnerPerformance.map((partner, index) => (
                  <motion.div
                    key={partner.partnerId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900">{partner.partnerName}</h4>
                      <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
                        {partner.commissionRate}% comm.
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 divide-x divide-gray-200">
                      <div className="text-center px-2">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(partner.sales)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total Sales</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(partner.commission)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Earned</div>
                      </div>
                      <div className="text-center px-2">
                        <div className="text-lg font-bold text-gray-900">
                          {partner.itemsSold}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Items Sold</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Commission Trends</h3>
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics Coming Soon</h4>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    Detailed commission analytics, forecasting, and historical trend analysis are currently in development.
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