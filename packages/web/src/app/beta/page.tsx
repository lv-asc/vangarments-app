'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthWrapper';
import BetaPioneerBadge from '../../components/beta/BetaPioneerBadge';
import BetaAnalyticsDashboard from '../../components/beta/BetaAnalyticsDashboard';
import ReferralSystem from '../../components/beta/ReferralSystem';
import EnhancedReferralSystem from '../../components/beta/EnhancedReferralSystem';
import IndustryProfessionalDashboard from '../../components/beta/IndustryProfessionalDashboard';
import ExclusiveContentHub from '../../components/beta/ExclusiveContentHub';
import NetworkVisibility from '../../components/beta/NetworkVisibility';
import { 
  mockBetaStatus, 
  mockAnalytics, 
  mockExclusiveContent, 
  mockNetworkData, 
  mockReferralData 
} from '../../components/beta/BetaProgramMock';

interface BetaStatus {
  isBetaParticipant: boolean;
  participant?: {
    id: string;
    participantType: string;
    joinedAt: string;
    referralCode: string;
    status: string;
    privileges: {
      earlyAccess: boolean;
      advancedAnalytics: boolean;
      directFeedback: boolean;
      customBadges: boolean;
      prioritySupport: boolean;
    };
    metrics: {
      referralsCount: number;
      feedbackSubmitted: number;
      featuresUsed: string[];
      engagementScore: number;
    };
  };
}

export default function BetaPage() {
  const { user } = useAuth();
  const [betaStatus, setBetaStatus] = useState<BetaStatus | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [exclusiveContent, setExclusiveContent] = useState<any>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'referrals' | 'content' | 'network'>('overview');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({
    participantType: '',
    referralCode: ''
  });
  const [mounted, setMounted] = useState(false);

  // Helper function to safely access localStorage
  const getStorageItem = (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  };

  const isDevMode = (): boolean => {
    return getStorageItem('devMode') === 'true';
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (user) {
        checkBetaStatus();
      } else {
        setBetaStatus({ isBetaParticipant: false });
        setLoading(false);
      }
    }
  }, [user, mounted]);

  const checkBetaStatus = async () => {
    try {
      const token = getStorageItem('token');
      const devMode = isDevMode();
      
      if (!token) {
        setBetaStatus({ isBetaParticipant: false });
        setLoading(false);
        return;
      }

      // In development mode, use mock data based on user
      if (devMode) {
        // Grant beta access to developer account
        const isDeveloperAccount = user?.email === 'lvicentini10@gmail.com';
        const isBetaUser = isDeveloperAccount; // Only developer gets beta access
        
        if (isBetaUser) {
          const mockBetaStatus = {
            isBetaParticipant: true,
            participant: {
              id: 'dev-master-' + user.id,
              participantType: 'developer_master',
              joinedAt: '2023-01-01T00:00:00Z',
              referralCode: 'DEV-MASTER-LVE',
              status: 'active',
              privileges: {
                earlyAccess: true,
                advancedAnalytics: true,
                directFeedback: true,
                customBadges: true,
                prioritySupport: true,
                adminAccess: true,
                fullDevAccess: true,
              },
              metrics: {
                referralsCount: 0, // Master account doesn't need referrals
                feedbackSubmitted: 50, // Extensive testing feedback
                featuresUsed: ['all_features'], // Full access to everything
                engagementScore: 100, // Maximum engagement as developer
              },
            }
          };
          
          setBetaStatus(mockBetaStatus);
          
          // Load mock data
          setAnalytics(mockAnalytics);
          setExclusiveContent(mockExclusiveContent);
          setNetworkData(mockNetworkData);
          setReferralData(mockReferralData);
        } else {
          setBetaStatus({ isBetaParticipant: false });
        }
        
        setLoading(false);
        return;
      }

      // Production mode - make real API calls
      const response = await fetch('/api/beta/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBetaStatus(data);
        
        if (data.isBetaParticipant) {
          // Load additional data but don't fail if they error
          try {
            await Promise.allSettled([
              loadAnalytics(),
              loadExclusiveContent(),
              loadNetworkData(),
              loadReferralData()
            ]);
          } catch (error) {
            console.warn('Error loading beta data:', error);
          }
        }
      } else {
        console.warn('Beta status check failed:', response.status);
        setBetaStatus({ isBetaParticipant: false });
      }
    } catch (error) {
      console.warn('Error checking beta status:', error);
      setBetaStatus({ isBetaParticipant: false });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const devMode = isDevMode();
      
      if (devMode) {
        setAnalytics(mockAnalytics);
        return;
      }

      const response = await fetch('/api/beta/analytics', {
        headers: {
          'Authorization': `Bearer ${getStorageItem('token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        console.warn('Failed to load analytics:', response.status);
        // Set mock data as fallback
        setAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.warn('Error loading analytics:', error);
      setAnalytics(mockAnalytics);
    }
  };

  const loadExclusiveContent = async () => {
    try {
      const devMode = isDevMode();
      
      if (devMode) {
        setExclusiveContent(mockExclusiveContent);
        return;
      }

      const response = await fetch('/api/beta/exclusive-content', {
        headers: {
          'Authorization': `Bearer ${getStorageItem('token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExclusiveContent(data.content);
      } else {
        console.warn('Failed to load exclusive content:', response.status);
        // Set mock data as fallback
        setExclusiveContent(mockExclusiveContent);
      }
    } catch (error) {
      console.warn('Error loading exclusive content:', error);
      setExclusiveContent(mockExclusiveContent);
    }
  };

  const loadNetworkData = async () => {
    try {
      const devMode = isDevMode();
      
      if (devMode) {
        setNetworkData(mockNetworkData);
        return;
      }

      const response = await fetch('/api/beta/network-visibility', {
        headers: {
          'Authorization': `Bearer ${getStorageItem('token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNetworkData(data.networkData);
      } else {
        console.warn('Failed to load network data:', response.status);
        // Set mock data as fallback
        setNetworkData(mockNetworkData);
      }
    } catch (error) {
      console.warn('Error loading network data:', error);
      setNetworkData(mockNetworkData);
    }
  };

  const loadReferralData = async () => {
    try {
      const devMode = isDevMode();
      
      if (devMode) {
        setReferralData(mockReferralData);
        return;
      }

      const response = await fetch('/api/beta/leaderboard', {
        headers: {
          'Authorization': `Bearer ${getStorageItem('token') || ''}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReferralData({
          referralCode: betaStatus?.participant?.referralCode || 'DEMO123',
          referralsCount: betaStatus?.participant?.metrics.referralsCount || 0,
          rewards: [], // TODO: Load actual rewards
          leaderboard: data.leaderboard || []
        });
      } else {
        console.warn('Failed to load referral data:', response.status);
        // Set mock data as fallback
        setReferralData(mockReferralData);
      }
    } catch (error) {
      console.warn('Error loading referral data:', error);
      setReferralData(mockReferralData);
    }
  };

  const handleJoinBeta = async () => {
    try {
      const devMode = isDevMode();
      
      if (devMode) {
        // In development mode, simulate joining beta
        if (!joinForm.participantType) {
          alert('Please select a participant type');
          return;
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update user to have beta status
        const mockBetaStatus = {
          isBetaParticipant: true,
          participant: {
            id: 'beta-participant-' + user?.id,
            participantType: joinForm.participantType,
            joinedAt: new Date().toISOString(),
            referralCode: 'BETA' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            status: 'active',
            privileges: {
              earlyAccess: true,
              advancedAnalytics: true,
              directFeedback: true,
              customBadges: true,
              prioritySupport: true,
            },
            metrics: {
              referralsCount: 0,
              feedbackSubmitted: 0,
              featuresUsed: [],
              engagementScore: 0,
            },
          }
        };
        
        setBetaStatus(mockBetaStatus);
        setJoinModalOpen(false);
        
        // Load mock data
        setAnalytics(mockAnalytics);
        setExclusiveContent(mockExclusiveContent);
        setNetworkData(mockNetworkData);
        setReferralData(mockReferralData);
        
        return;
      }

      // Production mode - make real API call
      const response = await fetch('/api/beta/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStorageItem('token') || ''}`
        },
        body: JSON.stringify(joinForm)
      });

      if (response.ok) {
        setJoinModalOpen(false);
        await checkBetaStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join beta program');
      }
    } catch (error) {
      console.error('Error joining beta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join beta program';
      alert(errorMessage);
    }
  };

  const handleInviteFriend = async (email: string) => {
    // TODO: Implement friend invitation
    console.log('Inviting friend:', email);
  };

  const handleShareCode = (platform: string) => {
    const code = betaStatus?.participant?.referralCode;
    const message = `Join me in the Vangarments Beta Program! Use my referral code: ${code}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=Join Vangarments Beta&body=${encodeURIComponent(message)}`);
        break;
      default:
        navigator.clipboard.writeText(message);
    }
  };

  const handleFeatureAccess = (featureId: string) => {
    console.log('Accessing feature:', featureId);
    // TODO: Implement feature access
  };

  const handleDownloadReport = (reportId: string) => {
    console.log('Downloading report:', reportId);
    // TODO: Implement report download
  };

  const handleRegisterEvent = (eventId: string) => {
    console.log('Registering for event:', eventId);
    // TODO: Implement event registration
  };

  const handleConnectUser = (userId: string) => {
    console.log('Connecting with user:', userId);
    // TODO: Implement user connection
  };

  const handleApplyOpportunity = (opportunityId: string) => {
    console.log('Applying to opportunity:', opportunityId);
    // TODO: Implement opportunity application
  };

  // Prevent hydration issues by only rendering on client
  if (!mounted) {
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
          <h2 className="text-2xl font-bold text-[#00132d] mb-2">Loading...</h2>
        </motion.div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-[#00132d] mb-2">Loading Beta Program</h2>
          <p className="text-[#00132d]/70">Checking your beta status...</p>
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
            You need to be logged in to access the Beta Program.
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

  if (!betaStatus?.isBetaParticipant) {
    return (
      <div className="min-h-screen bg-[#fff7d7] p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-[#00132d] mb-4">
              Join the Beta Pioneer Program
            </h1>
            <p className="text-xl text-[#00132d]/70 mb-8">
              Get exclusive early access to Vangarments features and help shape the future of fashion technology
            </p>
            <BetaPioneerBadge size="large" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#00132d]/5 rounded-2xl p-8 border border-[#00132d]/20 mb-8"
          >
            <h2 className="text-2xl font-semibold text-[#00132d] mb-6">Beta Pioneer Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Early Feature Access', description: 'Be the first to try new features before public release' },
                { title: 'Advanced Analytics', description: 'Exclusive insights and industry trend data' },
                { title: 'Direct Feedback Channel', description: 'Shape product development with your input' },
                { title: 'Special Recognition', description: 'Beta Pioneer badges and exclusive status' },
                { title: 'Network Access', description: 'Connect with industry professionals and influencers' },
                { title: 'Priority Support', description: 'Get help faster with dedicated beta support' }
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
              onClick={() => setJoinModalOpen(true)}
              className="bg-[#00132d] text-[#fff7d7] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#00132d]/80 transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Beta Program
            </motion.button>
          </motion.div>
        </div>

        {/* Join Modal */}
        <AnimatePresence>
          {joinModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setJoinModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#fff7d7] rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-[#00132d] mb-4">Join Beta Program</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Participant Type
                    </label>
                    <select
                      value={joinForm.participantType}
                      onChange={(e) => setJoinForm({ ...joinForm, participantType: e.target.value })}
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                      required
                    >
                      <option value="">Select your role</option>
                      <option value="brand">Brand Owner</option>
                      <option value="influencer">Influencer</option>
                      <option value="stylist">Stylist</option>
                      <option value="model">Model</option>
                      <option value="designer">Designer</option>
                      <option value="industry_leader">Industry Leader</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#00132d] mb-2">
                      Referral Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={joinForm.referralCode}
                      onChange={(e) => setJoinForm({ ...joinForm, referralCode: e.target.value })}
                      placeholder="Enter referral code"
                      className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setJoinModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-[#00132d]/20 rounded-lg text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinBeta}
                    disabled={!joinForm.participantType}
                    className="flex-1 px-4 py-2 bg-[#00132d] text-[#fff7d7] rounded-lg hover:bg-[#00132d]/80 transition-colors disabled:opacity-50"
                  >
                    Join Beta
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
                Beta Pioneer Dashboard
              </h1>
              <p className="text-[#00132d]/70">
                Welcome back, {betaStatus.participant?.participantType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <BetaPioneerBadge size="large" />
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'referrals', label: 'Referrals' },
                { key: 'content', label: 'Exclusive' },
                { key: 'network', label: 'Network' }
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
                      layoutId="activeBetaSection"
                      className="absolute inset-0 bg-[#00132d] rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10">
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
            {activeSection === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                    <h3 className="text-xl font-semibold text-[#00132d] mb-4">Beta Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-[#00132d]">
                          {betaStatus.participant?.metrics.engagementScore || 0}
                        </div>
                        <div className="text-sm text-[#00132d]/60">Engagement Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#00132d]">
                          {betaStatus.participant?.metrics.referralsCount || 0}
                        </div>
                        <div className="text-sm text-[#00132d]/60">Referrals</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                    <h3 className="text-lg font-semibold text-[#00132d] mb-4">Privileges</h3>
                    <div className="space-y-2">
                      {Object.entries(betaStatus.participant?.privileges || {}).map(([key, enabled]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-[#00132d]/70">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'analytics' && analytics && (
              <>
                {betaStatus.participant?.participantType === 'industry_leader' || 
                 betaStatus.participant?.participantType === 'brand' || 
                 betaStatus.participant?.participantType === 'influencer' ? (
                  <IndustryProfessionalDashboard 
                    analytics={analytics} 
                    participantType={betaStatus.participant.participantType}
                    loading={!analytics} 
                  />
                ) : (
                  <BetaAnalyticsDashboard analytics={analytics} loading={!analytics} />
                )}
              </>
            )}

            {activeSection === 'referrals' && referralData && (
              <EnhancedReferralSystem
                referralData={{
                  ...referralData,
                  networkVisibility: {
                    totalConnections: Math.floor(Math.random() * 200) + 50,
                    industryConnections: Math.floor(Math.random() * 100) + 20,
                    recentConnections: [
                      {
                        id: '1',
                        name: 'Maria Silva',
                        type: 'stylist',
                        connectedAt: new Date(Date.now() - 86400000).toISOString(),
                        avatar: undefined
                      },
                      {
                        id: '2',
                        name: 'João Santos',
                        type: 'brand',
                        connectedAt: new Date(Date.now() - 172800000).toISOString(),
                        avatar: undefined
                      },
                      {
                        id: '3',
                        name: 'Ana Costa',
                        type: 'influencer',
                        connectedAt: new Date(Date.now() - 259200000).toISOString(),
                        avatar: undefined
                      }
                    ],
                    networkGrowth: Math.floor(Math.random() * 30) + 10
                  }
                }}
                onInviteFriend={handleInviteFriend}
                onShareCode={handleShareCode}
                loading={!referralData}
              />
            )}

            {activeSection === 'content' && exclusiveContent && (
              <ExclusiveContentHub
                content={exclusiveContent}
                onFeatureAccess={handleFeatureAccess}
                onDownloadReport={handleDownloadReport}
                onRegisterEvent={handleRegisterEvent}
                loading={!exclusiveContent}
              />
            )}

            {activeSection === 'network' && networkData && (
              <NetworkVisibility
                networkData={networkData}
                onConnectUser={handleConnectUser}
                onApplyOpportunity={handleApplyOpportunity}
                loading={!networkData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}