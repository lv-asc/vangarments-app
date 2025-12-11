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

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#00132d] mb-2">Partnership Management</h2>
          <p className="text-[#00132d]/70">
            Manage your store partnerships and collaboration agreements
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#00132d]">{partnerships.length}</div>
          <div className="text-sm text-[#00132d]/60">Active Partnerships</div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#00132d]/5 rounded-2xl p-2 border border-[#00132d]/20"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'active', label: 'Active Partnerships', count: partnerships.filter(p => p.status === 'active').length },
            { key: 'requests', label: 'Partnership Requests', count: partnershipRequests.filter(r => r.status === 'pending').length },
            { key: 'analytics', label: 'Performance Analytics', count: null }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative p-4 rounded-xl text-center transition-all duration-300 ${activeTab === tab.key
                  ? 'text-[#fff7d7] shadow-lg'
                  : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                }`}
              whileHover={{ scale: activeTab === tab.key ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activePartnershipTab"
                  className="absolute inset-0 bg-[#00132d] rounded-xl"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-xl">{tab.icon}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.count}
                    </span>
                  )}
                </div>
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
                      className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedPartnership(partnership);
                        setShowDetailsModal(true);
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getStoreTypeIcon(partnership.storeType)}</div>
                          <div>
                            <h3 className="font-semibold text-[#00132d]">{partnership.storeName}</h3>
                            <p className="text-sm text-[#00132d]/60 capitalize">{partnership.storeType} Store</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(partnership.status)}`}>
                          {partnership.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-lg font-bold text-[#00132d]">
                            {formatCurrency(partnership.performance.totalSales)}
                          </div>
                          <div className="text-sm text-[#00132d]/60">Total Sales</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-[#00132d]">
                            {partnership.commissionRate}%
                          </div>
                          <div className="text-sm text-[#00132d]/60">Commission Rate</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#00132d]/60">
                          {partnership.performance.itemsSold} items sold
                        </span>
                        <span className="text-[#00132d]/60">
                          Last activity: {new Date(partnership.lastActivity).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">

                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Active Partnerships</h3>
                  <p className="text-[#00132d]/70">
                    Start building partnerships with stores to expand your reach
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
                      className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getStoreTypeIcon(request.storeType)}</div>
                          <div>
                            <h3 className="font-semibold text-[#00132d]">{request.storeName}</h3>
                            <p className="text-sm text-[#00132d]/60">{request.contactEmail}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-[#00132d]/80">{request.message}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-[#00132d]/60">
                          Proposed Commission: <span className="font-semibold">{request.proposedCommission}%</span>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={() => handleRejectRequest(request.id)}
                              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Reject
                            </motion.button>
                            <motion.button
                              onClick={() => handleApproveRequest(request.id)}
                              className="px-4 py-2 bg-[#00132d] text-[#fff7d7] rounded-lg hover:bg-[#00132d]/80 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
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
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <svg className="w-16 h-16 text-[#00132d]/40" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Partnership Requests</h3>
                  <p className="text-[#00132d]/70">
                    New partnership requests will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">

                  <div className="text-2xl font-bold text-[#00132d] mb-1">
                    {formatCurrency(partnerships.reduce((sum, p) => sum + p.performance.totalSales, 0))}
                  </div>
                  <div className="text-sm text-[#00132d]/60">Total Partnership Revenue</div>
                </div>

                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">

                  <div className="text-2xl font-bold text-[#00132d] mb-1">
                    {partnerships.reduce((sum, p) => sum + p.performance.itemsSold, 0)}
                  </div>
                  <div className="text-sm text-[#00132d]/60">Items Sold Through Partners</div>
                </div>

                <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">

                  <div className="text-2xl font-bold text-[#00132d] mb-1">
                    {partnerships.length > 0
                      ? formatCurrency(partnerships.reduce((sum, p) => sum + p.performance.averageOrderValue, 0) / partnerships.length)
                      : formatCurrency(0)
                    }
                  </div>
                  <div className="text-sm text-[#00132d]/60">Average Order Value</div>
                </div>
              </div>

              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Partnership Performance</h3>
                <div className="text-center py-8">

                  <h4 className="text-lg font-semibold text-[#00132d] mb-2">Detailed Analytics Coming Soon</h4>
                  <p className="text-[#00132d]/70">
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#fff7d7] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-[#00132d]">Partnership Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-[#00132d]/60 hover:text-[#00132d] text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{getStoreTypeIcon(selectedPartnership.storeType)}</div>
                  <div>
                    <h4 className="text-lg font-semibold text-[#00132d]">{selectedPartnership.storeName}</h4>
                    <p className="text-[#00132d]/60 capitalize">{selectedPartnership.storeType} Store</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-[#00132d] mb-3">Performance Metrics</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Total Sales:</span>
                        <span className="font-semibold">{formatCurrency(selectedPartnership.performance.totalSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Commission Earned:</span>
                        <span className="font-semibold">{formatCurrency(selectedPartnership.performance.totalCommission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Items Sold:</span>
                        <span className="font-semibold">{selectedPartnership.performance.itemsSold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Avg. Order Value:</span>
                        <span className="font-semibold">{formatCurrency(selectedPartnership.performance.averageOrderValue)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-[#00132d] mb-3">Partnership Terms</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Commission Rate:</span>
                        <span className="font-semibold">{selectedPartnership.commissionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Minimum Order:</span>
                        <span className="font-semibold">{formatCurrency(selectedPartnership.terms.minimumOrder)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Payment Terms:</span>
                        <span className="font-semibold">{selectedPartnership.terms.paymentTerms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#00132d]/70">Exclusivity:</span>
                        <span className="font-semibold">{selectedPartnership.terms.exclusivity ? 'Yes' : 'No'}</span>
                      </div>
                      {selectedPartnership.terms.territory && (
                        <div className="flex justify-between">
                          <span className="text-[#00132d]/70">Territory:</span>
                          <span className="font-semibold">{selectedPartnership.terms.territory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    className="flex-1 px-4 py-2 border border-[#00132d]/20 rounded-lg text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit Terms
                  </motion.button>
                  <motion.button
                    className="flex-1 px-4 py-2 bg-[#00132d] text-[#fff7d7] rounded-lg hover:bg-[#00132d]/80 transition-colors"
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