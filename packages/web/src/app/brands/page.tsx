'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthWrapper';
import BrandDashboard from '../../components/brands/BrandDashboard';
import BrandCatalogManager from '../../components/brands/BrandCatalogManager';
import PartnershipManager from '../../components/brands/PartnershipManager';
import CommissionTracker from '../../components/brands/CommissionTracker';

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

export default function BrandsPage() {
  const { user } = useAuth();
  const [brandAccount, setBrandAccount] = useState<BrandAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'catalog' | 'partnerships' | 'analytics'>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    brandName: '',
    description: '',
    website: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      checkBrandAccount();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkBrandAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/brands/account', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBrandAccount(data.brandAccount);
      } else if (response.status === 404) {
        // No brand account exists
        setBrandAccount(null);
      } else {
        console.warn('Brand account check failed:', response.status);
      }
    } catch (error) {
      console.warn('Error checking brand account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrandAccount = async () => {
    try {
      const response = await fetch('/api/brands/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          brandInfo: {
            name: createForm.brandName,
            description: createForm.description,
            website: createForm.website,
            contactInfo: {
              email: createForm.email,
              phone: createForm.phone
            }
          }
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        await checkBrandAccount();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create brand account');
      }
    } catch (error) {
      console.error('Error creating brand account:', error);
      alert('Failed to create brand account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff7d7] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-[#00132d] border-t-transparent rounded-full"
          />
          <h2 className="text-2xl font-bold text-[#00132d] mb-2">Loading Brand Partnership</h2>
          <p className="text-[#00132d]/70">Checking your brand account...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fff7d7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-3xl font-bold text-[#00132d] mb-4">
            Authentication Required
          </h1>
          <p className="text-[#00132d]/70 mb-6">
            You need to be logged in to access Brand Partnership features.
          </p>
          <motion.a
            href="/login"
            className="inline-block bg-[#00132d] text-[#fff7d7] px-6 py-3 rounded-xl font-semibold hover:bg-[#00132d]/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In
          </motion.a>
        </div>
      </div>
    );
  }

  if (!brandAccount) {
    return (
      <div className="min-h-screen bg-[#fff7d7] p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-[#00132d] mb-4">
              Brand Partnership Program
            </h1>
            <p className="text-xl text-[#00132d]/70 mb-8">
              Join Vangarments as an official brand partner and reach fashion enthusiasts worldwide
            </p>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#00132d]/5 rounded-2xl p-8 border border-[#00132d]/20 mb-8"
          >
            <h2 className="text-2xl font-semibold text-[#00132d] mb-6">Partnership Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Dedicated Brand Page', description: 'Customizable brand presence with your logo and branding' },
                { title: 'Official Catalog', description: 'Manage your product catalog following VUFS standards' },
                { title: 'Revenue Sharing', description: 'Earn commission on sales through the platform' },
                { title: 'Advanced Analytics', description: 'Detailed insights on customer engagement and sales' },
                { title: 'Targeted Marketing', description: 'Reach customers based on fashion preferences' },
                { title: 'Store Partnerships', description: 'Connect with retailers and expand distribution' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-3 h-3 bg-[#00132d] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-[#00132d] mb-1">{benefit.title}</h3>
                    <p className="text-sm text-[#00132d]/70">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#00132d] text-[#fff7d7] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#00132d]/80 transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Brand Account
            </motion.button>
          </motion.div>
        </div>

        {/* Create Brand Account Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#fff7d7] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-[#00132d] mb-4">Create Brand Account</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.brandName}
                      onChange={(e) => setCreateForm({ ...createForm, brandName: e.target.value })}
                      placeholder="Your Brand Name"
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Description
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Brief description of your brand"
                      rows={3}
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={createForm.website}
                      onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                      placeholder="https://yourbrand.com"
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="contact@yourbrand.com"
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="+55 11 99999-9999"
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-[#00132d]/20 rounded-lg text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBrandAccount}
                    disabled={!createForm.brandName}
                    className="flex-1 px-4 py-2 bg-[#00132d] text-[#fff7d7] rounded-lg hover:bg-[#00132d]/80 transition-colors disabled:opacity-50"
                  >
                    Create Account
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7d7] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#00132d] mb-2">
                {brandAccount.brandInfo.name}
              </h1>
              <p className="text-[#00132d]/70">
                Brand Partnership Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                brandAccount.verificationStatus === 'verified' 
                  ? 'bg-green-100 text-green-800' 
                  : brandAccount.verificationStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {brandAccount.verificationStatus === 'verified' ? 'Verified' : 
                 brandAccount.verificationStatus === 'pending' ? 'Pending' : 'Rejected'}
              </div>

            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <nav className="bg-[#00132d]/5 rounded-2xl p-2 border border-[#00132d]/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'catalog', label: 'Catalog' },
                { key: 'partnerships', label: 'Partnerships' },
                { key: 'analytics', label: 'Analytics' }
              ].map((section) => (
                <motion.button
                  key={section.key}
                  onClick={() => setActiveSection(section.key as any)}
                  className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                    activeSection === section.key
                      ? 'text-[#fff7d7] shadow-lg'
                      : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                  }`}
                  whileHover={{ scale: activeSection === section.key ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeSection === section.key && (
                    <motion.div
                      layoutId="activeBrandSection"
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

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'dashboard' && (
              <BrandDashboard brandAccount={brandAccount} />
            )}

            {activeSection === 'catalog' && (
              <BrandCatalogManager brandAccount={brandAccount} />
            )}

            {activeSection === 'partnerships' && (
              <PartnershipManager brandAccount={brandAccount} />
            )}

            {activeSection === 'analytics' && (
              <CommissionTracker brandAccount={brandAccount} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}