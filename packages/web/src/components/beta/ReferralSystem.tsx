'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TargetIcon, 
  TrophyIcon, 
  CheckIcon, 
  ClockIcon, 
  XIcon, 
  GiftIcon,
  SparklesIcon 
} from '@/components/ui/icons';
import { 
  WhatsAppIcon, 
  InstagramIcon, 
  TwitterIcon, 
  MobileIcon, 
  CameraIcon 
} from '@/components/ui/social-icons';

interface ReferralData {
  referralCode: string;
  referralsCount: number;
  rewards: Array<{
    id: string;
    type: string;
    description: string;
    status: 'pending' | 'awarded' | 'expired';
    awardedAt?: string;
  }>;
  leaderboard: Array<{
    userId: string;
    participantType: string;
    engagementScore: number;
    referralsCount: number;
    rank: number;
  }>;
}

interface ReferralSystemProps {
  referralData: ReferralData;
  onInviteFriend: (email: string) => void;
  onShareCode: (platform: string) => void;
  loading?: boolean;
}

export default function ReferralSystem({
  referralData,
  onInviteFriend,
  onShareCode,
  loading = false
}: ReferralSystemProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      onInviteFriend(inviteEmail.trim());
      setInviteEmail('');
    }
  };

  const shareOptions = [
    { platform: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon className="text-white" size="sm" />, color: 'bg-green-500' },
    { platform: 'instagram', label: 'Instagram', icon: <CameraIcon className="text-white" size="sm" />, color: 'bg-pink-500' },
    { platform: 'twitter', label: 'Twitter', icon: <TwitterIcon className="text-white" size="sm" />, color: 'bg-blue-500' },
    { platform: 'email', label: 'Email', icon: <MobileIcon className="text-white" size="sm" />, color: 'bg-gray-500' },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-orange-600';
    return 'text-[#00132d]';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>;
    if (rank === 2) return <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>;
    if (rank === 3) return <div className="w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>;
    return <div className="w-6 h-6 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold">{rank}</div>;
  };

  if (loading) {
    return (
      <div className="bg-[#fff7d7] p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#00132d]/20 rounded w-1/3"></div>
          <div className="h-4 bg-[#00132d]/20 rounded w-2/3"></div>
          <div className="h-20 bg-[#00132d]/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff7d7] space-y-6">
      {/* Referral Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
      >
        <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
          <TargetIcon className="mr-2 text-[#00132d]" size="md" />
          Your Referral Code
        </h3>
        
        <div className="bg-[#fff7d7] rounded-xl p-4 border border-[#00132d]/10 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#00132d] tracking-wider">
                {referralData.referralCode}
              </div>
              <div className="text-sm text-[#00132d]/60 mt-1">
                Share this code to invite friends to the beta program
              </div>
            </div>
            <motion.button
              onClick={handleCopyCode}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                copiedCode 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#00132d] text-[#fff7d7] hover:bg-[#00132d]/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copiedCode ? (
                <span className="flex items-center">
                  <CheckIcon className="mr-1" size="sm" />
                  Copied!
                </span>
              ) : 'Copy Code'}
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00132d]">{referralData.referralsCount}</div>
            <div className="text-sm text-[#00132d]/60">Successful Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00132d]">
              {referralData.rewards.filter(r => r.status === 'awarded').length}
            </div>
            <div className="text-sm text-[#00132d]/60">Rewards Earned</div>
          </div>
        </div>

        {/* Quick Share Buttons */}
        <div className="flex flex-wrap gap-2">
          {shareOptions.map((option) => (
            <motion.button
              key={option.platform}
              onClick={() => onShareCode(option.platform)}
              className={`flex items-center space-x-2 ${option.color} text-white px-3 py-2 rounded-lg text-sm font-medium`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Invite Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
      >
        <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
          <MobileIcon className="mr-2 text-[#00132d]" size="md" />
          Invite a Friend
        </h3>
        
        <form onSubmit={handleInvite} className="flex space-x-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 px-4 py-2 border border-[#00132d]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]/20 bg-[#fff7d7]"
            required
          />
          <motion.button
            type="submit"
            className="bg-[#00132d] text-[#fff7d7] px-6 py-2 rounded-lg font-medium hover:bg-[#00132d]/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Send Invite
          </motion.button>
        </form>
        
        <p className="text-sm text-[#00132d]/60 mt-2">
          Your friend will receive an email invitation to join the beta program with your referral code.
        </p>
      </motion.div>

      {/* Rewards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
      >
        <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
          <TrophyIcon className="mr-2 text-amber-500" size="md" />
          Referral Rewards
        </h3>
        
        {referralData.rewards.length > 0 ? (
          <div className="space-y-3">
            {referralData.rewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-[#fff7d7] rounded-xl p-4 border border-[#00132d]/10 ${
                  reward.status === 'awarded' ? 'ring-2 ring-green-500/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#00132d]">
                      {reward.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm text-[#00132d]/70">{reward.description}</div>
                    {reward.awardedAt && (
                      <div className="text-xs text-[#00132d]/50 mt-1">
                        Awarded on {new Date(reward.awardedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    reward.status === 'awarded' 
                      ? 'bg-green-100 text-green-800' 
                      : reward.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reward.status === 'awarded' ? (
                      <span className="flex items-center">
                        <CheckIcon className="mr-1" size="xs" />
                        Earned
                      </span>
                    ) : reward.status === 'pending' ? (
                      <span className="flex items-center">
                        <ClockIcon className="mr-1" size="xs" />
                        Pending
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <XIcon className="mr-1" size="xs" />
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex justify-center mb-2">
              <GiftIcon className="text-[#00132d]/40" size="xl" />
            </div>
            <div className="text-[#00132d]/70">No rewards yet</div>
            <div className="text-sm text-[#00132d]/50">Start referring friends to earn rewards!</div>
          </div>
        )}
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
      >
        <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
          <TrophyIcon className="mr-2 text-amber-500" size="md" />
          Beta Pioneer Leaderboard
        </h3>
        
        <div className="space-y-3">
          {referralData.leaderboard.slice(0, 10).map((participant, index) => (
            <motion.div
              key={participant.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#fff7d7] rounded-xl p-4 border border-[#00132d]/10 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className={`text-2xl ${getRankColor(participant.rank)}`}>
                  {getRankIcon(participant.rank)}
                </div>
                <div>
                  <div className="font-semibold text-[#00132d]">
                    {participant.participantType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-sm text-[#00132d]/60">
                    {participant.referralsCount} referrals • Score: {participant.engagementScore}
                  </div>
                </div>
              </div>
              
              {participant.rank <= 3 && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="flex justify-center"
                >
                  <SparklesIcon className="text-yellow-500" size="lg" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-sm text-[#00132d]/60">
            Rankings are updated daily based on engagement and referrals
          </div>
        </div>
      </motion.div>
    </div>
  );
}