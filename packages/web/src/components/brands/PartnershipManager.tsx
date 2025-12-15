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

interface Partnership {
  id: string;
  storeId: string;
  storeName: string;
  storeType: 'retail' | 'online' | 'thrift' | 'boutique';
  status: 'pending' | 'active' | 'paused' | 'terminated';
  commissionRate: number;
  terms: {
    exclusivity: boolean;
    minimumOrder: number;
    paymentTerms: string;
    territory?: string;
  };
  performance: {
    totalSales: number;
    totalCommission: number;
    itemsSold: number;
    averageOrderValue: number;
  };
  createdAt: string;
  lastActivity: string;
}

interface PartnershipRequest {
  id: string;
  storeId: string;
  storeName: string;
  storeType: string;
  contactEmail: string;
  message: string;
  proposedCommission: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface PartnershipManagerProps {
  brandAccount: BrandAccount;
}

export default function PartnershipManager({ brandAccount }: PartnershipManagerProps) {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [partnershipRequests, setPartnershipRequests] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'analytics'>('active');
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadPartnershipData();
  }, [brandAccount.id]);

  const loadPartnershipData = async () => {
    try {
      // Mock data for now - in real implementation, fetch from API
      const mockPartnerships: Partnership[] = [
        {
          id: '1',
          storeId: 'store-1',
          storeName: 'Fashion Boutique ABC',
          storeType: 'boutique',
          status: 'active',
          commissionRate: 15,
          terms: {
            exclusivity: false,
            minimumOrder: 1000,
            paymentTerms: 'Net 30',
            territory: 'São Paulo'
          },
          performance: {
            totalSales: 25000,
            totalCommission: 3750,
            itemsSold: 85,
            averageOrderValue: 294.12
          },
          createdAt: '2024-01-15T00:00:00Z',
          lastActivity: new Date().toISOString()
        },
        {
          id: '2',
          storeId: 'store-2',
          storeName: 'Online Fashion Store',
          storeType: 'online',
          status: 'active',
          commissionRate: 12,
          terms: {
            exclusivity: true,
            minimumOrder: 2000,
            paymentTerms: 'Net 15',
          },
          performance: {
            totalSales: 45000,
            totalCommission: 5400,
            itemsSold: 150,
            averageOrderValue: 300
          },
          createdAt: '2024-02-01T00:00:00Z',
          lastActivity: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      const mockRequests: PartnershipRequest[] = [
        {
          id: '1',
          storeId: 'store-3',
          storeName: 'Trendy Thrift Store',
          storeType: 'thrift',
          contactEmail: 'contact@trendythrift.com',
          message: 'We would love to partner with your brand to offer sustainable fashion options to our customers.',
          proposedCommission: 10,
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      setPartnerships(mockPartnerships);
      setPartnershipRequests(mockRequests);
    } catch (error) {
      console.error('Error loading partnership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // In real implementation, send to API
      setPartnershipRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved' as const }
            : req
        )
      );
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // In real implementation, send to API
      setPartnershipRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'rejected' as const }
            : req
        )
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStoreTypeIcon = (type: string) => {
    // Return empty string instead of emojis
    return '';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partnership Management</h2>
          <p className="text-gray-500">
            Manage your store partnerships and collaboration agreements
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{partnerships.length}</div>
          <div className="text-sm text-gray-500 font-medium">Active Partnerships</div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm w-full md:max-w-fit overflow-x-auto">
          <div className="flex space-x-1 min-w-max">
            {[
              { key: 'active', label: 'Active Partnerships', count: partnerships.filter(p => p.status === 'active').length },
              { key: 'requests', label: 'Partnership Requests', count: partnershipRequests.filter(r => r.status === 'pending').length },
              { key: 'analytics', label: 'Performance Analytics', count: null }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${activeTab === tab.key
                  ? 'text-gray-900 bg-gray-100 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem]">
                    {tab.count}
                  </span>
                )}
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
          {activeTab === 'active' && (
            <div className="space-y-6">
              {partnerships.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {partnerships.map((partnership, index) => (
                    <motion.div
                      key={partnership.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedPartnership(partnership);
                        setShowDetailsModal(true);
                      }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border border-gray-200">
                            {/* Placeholder Icon */}
                            <span className="opacity-50">🏪</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{partnership.storeName}</h3>
                            <p className="text-sm text-gray-500 capitalize">{partnership.storeType} Store</p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(partnership.status)}`}>
                          {partnership.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(partnership.performance.totalSales)}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-0.5">Total Sales</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {partnership.commissionRate}%
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-0.5">Comm. Rate</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          {partnership.performance.itemsSold} items sold
                        </span>
                        <span>
                          Last activity: {new Date(partnership.lastActivity).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Partnerships</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Start building partnerships with stores to expand your reach and increase sales.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              {partnershipRequests.length > 0 ? (
                <div className="space-y-4">
                  {partnershipRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl border border-blue-100 text-blue-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{request.storeName}</h3>
                            <p className="text-sm text-gray-500 font-mono">{request.contactEmail}</p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status}
                        </div>
                      </div>

                      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-600 text-sm leading-relaxed">
                        "{request.message}"
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 font-medium">
                          Proposed Commission: <span className="font-bold text-gray-900">{request.proposedCommission}%</span>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex space-x-3">
                            <motion.button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-semibold shadow-sm"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Reject
                            </motion.button>
                            <motion.button
                              onClick={() => handleApproveRequest(request.id)}
                              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold shadow-sm"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Approve
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
                  <div className="flex justify-center mb-4">
                    <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Partnership Requests</h3>
                  <p className="text-gray-500">
                    New partnership requests will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {formatCurrency(partnerships.reduce((sum, p) => sum + p.performance.totalSales, 0))}
                  </div>
                  <div className="text-sm text-gray-500">Total Partnership Revenue</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {partnerships.reduce((sum, p) => sum + p.performance.itemsSold, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Items Sold Through Partners</div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {partnerships.length > 0
                      ? formatCurrency(partnerships.reduce((sum, p) => sum + p.performance.averageOrderValue, 0) / partnerships.length)
                      : formatCurrency(0)
                    }
                  </div>
                  <div className="text-sm text-gray-500">Average Order Value</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Partnership Performance</h3>
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Detailed Analytics Coming Soon</h4>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Advanced partnership analytics and performance tracking are in development.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Partnership Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPartnership && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Partnership Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border border-gray-200">
                    <span className="opacity-50">🏪</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedPartnership.storeName}</h4>
                    <p className="text-gray-500 capitalize">{selectedPartnership.storeType} Store</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Performance Metrics
                    </h5>
                    <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Total Sales:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(selectedPartnership.performance.totalSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Commission:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedPartnership.performance.totalCommission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Items Sold:</span>
                        <span className="font-semibold text-gray-900">{selectedPartnership.performance.itemsSold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Avg. Order:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(selectedPartnership.performance.averageOrderValue)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Partnership Terms
                    </h5>
                    <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Rate:</span>
                        <span className="font-bold text-gray-900">{selectedPartnership.commissionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Min. Order:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(selectedPartnership.terms.minimumOrder)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Terms:</span>
                        <span className="font-semibold text-gray-900">{selectedPartnership.terms.paymentTerms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Exclusivity:</span>
                        <span className="font-semibold text-gray-900">{selectedPartnership.terms.exclusivity ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedPartnership.terms.territory && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 text-sm">Territory:</span>
                          <span className="font-semibold text-gray-900">{selectedPartnership.terms.territory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 pt-6 mt-6 border-t border-gray-100">
                  <motion.button
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit Terms
                  </motion.button>
                  <motion.button
                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Full Report
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}