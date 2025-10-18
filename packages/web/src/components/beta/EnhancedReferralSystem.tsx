'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, TrophyIcon, LightningIcon, ShareIcon } from '@/components/ui/icons';
import { WhatsAppIcon, TwitterIcon, MobileIcon } from '@/components/ui/social-icons';

interface EnhancedReferralData {
  referralCode: string;
  referralsCount: number;
  rewards: Array<{
    id: string;
    type: 'badge' | 'feature' | 'credit';
    title: string;
    description: string;
    earned: boolean;
    earnedAt?: string;
  }>;
  leaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    referrals: number;
    avatar?: string;
    participantType?: string;
  }>;
  networkVisibility: {
    totalConnections: number;
    industryConnections: number;
    recentConnections: Array<{
      id: string;
      name: string;
      type: string;
      connectedAt: string;
      avatar?: string;
    }>;
    networkGrowth: number;
  };
}

interface EnhancedReferralSystemProps {
  referralData: EnhancedReferralData;
  onInviteFriend: (email: string) => void;
  onShareCode: (platform: string) => void;
  loading?: boolean;
}

export default function EnhancedReferralSystem({ 
  referralData, 
  onInviteFriend, 
  onShareCode, 
  loading = false 
}: EnhancedReferralSystemProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'referrals' | 'network' | 'rewards'>('referrals');

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

  const handleInvite = () => {
    if (inviteEmail) {
      onInviteFriend(inviteEmail);
      setInviteEmail('');
      setShowInviteModal(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    // TODO: Show toast notification
  };

  const getParticipantTypeIcon = (type?: string) => {
    // Return empty string instead of emojis
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Network Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#00132d] to-[#00132d]/80 rounded-2xl p-6 text-[#fff7d7]"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Referral & Network Hub</h2>
          <p className="text-[#fff7d7]/80 mb-6">
            Expand your professional network and earn exclusive rewards
          </p>
          
          <div className="bg-[#fff7d7]/10 rounded-xl p-4 mb-6">
            <div className="text-3xl font-mono font-bold tracking-wider mb-2">
              {referralData.referralCode}
            </div>
            <motion.button
              onClick={copyReferralCode}
              className="text-sm text-[#fff7d7]/80 hover:text-[#fff7d7] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Copy Code
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{referralData.referralsCount}</div>
              <div className="text-sm text-[#fff7d7]/80">Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{referralData.networkVisibility.totalConnections}</div>
              <div className="text-sm text-[#fff7d7]/80">Network</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{referralData.rewards.filter(r => r.earned).length}</div>
              <div className="text-sm text-[#fff7d7]/80">Rewards</div>
            </div>
          </div>
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
            { key: 'referrals', label: 'Referrals' },
            { key: 'network', label: 'Network' },
            { key: 'rewards', label: 'Rewards' }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`relative p-3 rounded-xl text-center transition-all duration-300 ${
                activeTab === tab.key
                  ? 'text-[#fff7d7] shadow-lg'
                  : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
              }`}
              whileHover={{ scale: activeTab === tab.key ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeReferralTab"
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
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              {/* Share Options */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Share Your Code</h3>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { platform: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon className="text-white" size="sm" />, color: 'bg-green-500' },
                    { platform: 'twitter', label: 'Twitter', icon: <TwitterIcon className="text-white" size="sm" />, color: 'bg-blue-500' },
                    { platform: 'email', label: 'Email', icon: <MobileIcon className="text-white" size="sm" />, color: 'bg-gray-500' },
                    { platform: 'copy', label: 'Copy Link', icon: <ShareIcon className="text-white" size="sm" />, color: 'bg-[#00132d]' }
                  ].map((option) => (
                    <motion.button
                      key={option.platform}
                      onClick={() => onShareCode(option.platform)}
                      className={`${option.color} text-white p-4 rounded-xl font-semibold hover:opacity-80 transition-opacity`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="text-sm">{option.label}</div>
                    </motion.button>
                  ))}
                </div>

                <div className="text-center">
                  <motion.button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-[#00132d] text-[#fff7d7] px-6 py-3 rounded-xl font-semibold hover:bg-[#00132d]/80 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Invite Professional
                  </motion.button>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Referral Leaderboard</h3>
                
                <div className="space-y-3">
                  {referralData.leaderboard.map((user, index) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-white/50 rounded-xl"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.rank === 1 ? 'bg-yellow-500 text-white' :
                          user.rank === 2 ? 'bg-gray-400 text-white' :
                          user.rank === 3 ? 'bg-orange-500 text-white' :
                          'bg-[#00132d]/20 text-[#00132d]'
                        }`}>
                          {user.rank <= 3 ? (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                              user.rank === 1 ? 'bg-yellow-500' : 
                              user.rank === 2 ? 'bg-gray-400' : 
                              'bg-amber-600'
                            }`}>
                              {user.rank}
                            </div>
                          ) : user.rank}
                        </div>
                        <div className="flex items-center space-x-3">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-[#00132d]/20 rounded-full flex items-center justify-center">
                              {getParticipantTypeIcon(user.participantType)}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-[#00132d]">{user.username}</span>
                            {user.participantType && (
                              <div className="text-xs text-[#00132d]/60 capitalize">
                                {user.participantType.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#00132d]">{user.referrals}</div>
                        <div className="text-sm text-[#00132d]/60">referrals</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6">
              {/* Network Overview */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Professional Network</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#00132d] mb-2">
                      {referralData.networkVisibility.totalConnections}
                    </div>
                    <div className="text-sm text-[#00132d]/60">Total Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#00132d] mb-2">
                      {referralData.networkVisibility.industryConnections}
                    </div>
                    <div className="text-sm text-[#00132d]/60">Industry Professionals</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-[#00132d] mb-3">Recent Connections</h4>
                  {referralData.networkVisibility.recentConnections.map((connection, index) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white/50 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        {connection.avatar ? (
                          <img 
                            src={connection.avatar} 
                            alt={connection.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#00132d]/20 rounded-full flex items-center justify-center">
                            {getParticipantTypeIcon(connection.type)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[#00132d]">{connection.name}</div>
                          <div className="text-sm text-[#00132d]/60 capitalize">
                            {connection.type.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-[#00132d]/60">
                        {new Date(connection.connectedAt).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Network Growth */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Network Growth</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#00132d] mb-2">
                    +{referralData.networkVisibility.networkGrowth}%
                  </div>
                  <div className="text-sm text-[#00132d]/60 mb-4">This Month</div>
                  <div className="w-full bg-[#00132d]/10 rounded-full h-2">
                    <div 
                      className="bg-[#00132d] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(referralData.networkVisibility.networkGrowth, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* Rewards Section */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Referral Rewards</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {referralData.rewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reward.earned
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-white border-[#00132d]/20 text-[#00132d]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">
                              {reward.type === 'badge' ? (
                                <TrophyIcon className="text-amber-500" size="md" />
                              ) : reward.type === 'feature' ? (
                                <LightningIcon className="text-blue-500" size="md" />
                              ) : (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">$</div>
                              )}
                            </span>
                            <h4 className="font-semibold">{reward.title}</h4>
                          </div>
                          <p className="text-sm opacity-80">{reward.description}</p>
                          {reward.earned && reward.earnedAt && (
                            <p className="text-xs mt-2 opacity-60">
                              Earned on {new Date(reward.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {reward.earned ? (
                            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                              <CheckIcon className="text-white" size="xs" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Reward Progress */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-6">Next Rewards</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[#00132d]">5 Referrals - Premium Badge</span>
                    <span className="text-sm text-[#00132d]/60">{referralData.referralsCount}/5</span>
                  </div>
                  <div className="w-full bg-[#00132d]/10 rounded-full h-2">
                    <div 
                      className="bg-[#00132d] h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((referralData.referralsCount / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#fff7d7] rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-[#00132d] mb-4">Invite Professional</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#00132d] mb-2">
                    Professional's Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="professional@example.com"
                    className="w-full px-3 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20"
                  />
                </div>
                <p className="text-sm text-[#00132d]/70">
                  Invite industry professionals to expand your network and earn referral rewards.
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-[#00132d]/20 rounded-lg text-[#00132d] hover:bg-[#00132d]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                  className="flex-1 px-4 py-2 bg-[#00132d] text-[#fff7d7] rounded-lg hover:bg-[#00132d]/80 transition-colors disabled:opacity-50"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}