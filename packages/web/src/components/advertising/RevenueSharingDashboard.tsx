'use client';

import React, { useState } from 'react';

interface Partnership {
  id: string;
  partnerName: string;
  partnerType: 'brand' | 'influencer' | 'retailer' | 'affiliate';
  status: 'active' | 'pending' | 'paused' | 'terminated';
  commissionRate: number;
  totalRevenue: number;
  partnerRevenue: number;
  platformRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  startDate: string;
  lastPayment: string;
  nextPayment: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  platformRevenue: number;
  partnerRevenue: number;
  pendingPayments: number;
  activePartnerships: number;
  monthlyGrowth: number;
  topPerformingPartners: Partnership[];
}

interface Transaction {
  id: string;
  partnerId: string;
  partnerName: string;
  amount: number;
  commission: number;
  platformFee: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  orderDetails: {
    itemCount: number;
    category: string;
    customerType: string;
  };
}

interface RevenueSharingDashboardProps {
  partnerships: Partnership[];
  metrics: RevenueMetrics;
  transactions: Transaction[];
  loading?: boolean;
}

export default function RevenueSharingDashboard({ 
  partnerships, 
  metrics, 
  transactions, 
  loading = false 
}: RevenueSharingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'partnerships' | 'transactions' | 'payments'>('overview');
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'terminated': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPartnerTypeIcon = (type: string) => {
    // Return empty string instead of emojis
    return '';
  };

  const filteredPartnerships = partnerships.filter(partnership => {
    const typeMatch = filterType === 'all' || partnership.partnerType === filterType;
    const statusMatch = filterStatus === 'all' || partnership.status === filterStatus;
    return typeMatch && statusMatch;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Revenue Sharing Dashboard</h2>
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Process Payments
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            New Partnership
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'partnerships', label: 'Partnerships' },
          { key: 'transactions', label: 'Transactions' },
          { key: 'payments', label: 'Payments' }
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
              <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalRevenue)}</p>
              <p className="text-sm text-blue-600">+{metrics.monthlyGrowth}% this month</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Platform Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.platformRevenue)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Partner Revenue</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.partnerRevenue)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.pendingPayments)}</p>
            </div>
          </div>

          {/* Revenue Distribution Chart */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">By Partner Type</h4>
                <div className="space-y-2">
                  {[
                    { type: 'Brands', percentage: 45, amount: metrics.totalRevenue * 0.45 },
                    { type: 'Influencers', percentage: 30, amount: metrics.totalRevenue * 0.30 },
                    { type: 'Retailers', percentage: 20, amount: metrics.totalRevenue * 0.20 },
                    { type: 'Affiliates', percentage: 5, amount: metrics.totalRevenue * 0.05 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-16">{item.percentage}%</span>
                        <span className="text-sm font-medium text-gray-900 w-20">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Monthly Trend</h4>
                <div className="h-32 flex items-end justify-between space-x-1">
                  {[65, 78, 82, 95, 88, 92, 100].map((height, index) => (
                    <div key={index} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${height}%` }}>
                      <div className="w-full bg-blue-600 rounded-t" style={{ height: '20%' }}></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>6mo</span>
                  <span>5mo</span>
                  <span>4mo</span>
                  <span>3mo</span>
                  <span>2mo</span>
                  <span>1mo</span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Partners */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Partners</h3>
            <div className="space-y-3">
              {metrics.topPerformingPartners.slice(0, 5).map((partner, index) => (
                <div key={partner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                    <span className="text-2xl">{getPartnerTypeIcon(partner.partnerType)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{partner.partnerName}</h4>
                      <p className="text-sm text-gray-600 capitalize">{partner.partnerType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(partner.totalRevenue)}</p>
                    <p className="text-sm text-gray-600">{partner.transactionCount} transactions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partnerships Tab */}
      {activeTab === 'partnerships' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="brand">Brands</option>
              <option value="influencer">Influencers</option>
              <option value="retailer">Retailers</option>
              <option value="affiliate">Affiliates</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {/* Partnerships List */}
          <div className="space-y-3">
            {filteredPartnerships.map((partnership) => (
              <div key={partnership.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getPartnerTypeIcon(partnership.partnerType)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{partnership.partnerName}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {partnership.partnerType} • {partnership.commissionRate}% commission
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partnership.status)}`}>
                      {partnership.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(partnership.totalRevenue)}</p>
                    <p className="text-sm text-gray-600">
                      Partner: {formatCurrency(partnership.partnerRevenue)} | 
                      Platform: {formatCurrency(partnership.platformRevenue)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Transactions:</span>
                      <span className="ml-1 font-medium">{partnership.transactionCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Order:</span>
                      <span className="ml-1 font-medium">{formatCurrency(partnership.averageOrderValue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Payment:</span>
                      <span className="ml-1 font-medium">{new Date(partnership.lastPayment).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Payment:</span>
                      <span className="ml-1 font-medium">{new Date(partnership.nextPayment).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.partnerName}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.orderDetails.itemCount} items • {transaction.orderDetails.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.commission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.platformFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(metrics.pendingPayments)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">This Month Paid</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.partnerRevenue * 0.8)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Next Payment Date</p>
              <p className="text-2xl font-bold text-blue-900">Dec 1</p>
            </div>
          </div>

          {/* Pending Payments */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Pending Payments</h3>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Process All Payments
              </button>
            </div>
            <div className="space-y-3">
              {partnerships
                .filter(p => p.status === 'active')
                .slice(0, 10)
                .map((partnership) => (
                  <div key={partnership.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getPartnerTypeIcon(partnership.partnerType)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{partnership.partnerName}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {new Date(partnership.nextPayment).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(partnership.partnerRevenue * 0.1)}
                      </p>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        Process Payment
                      </button>
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