'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkData {
  connections: Array<{
    id: string;
    name: string;
    participantType: string;
    mutualConnections: number;
    lastActive: Date;
  }>;
  visibility: {
    profileViews: number;
    contentReach: number;
    industryRanking: number;
    influenceScore: number;
  };
  opportunities: Array<{
    id: string;
    type: 'collaboration' | 'partnership' | 'event' | 'mentorship';
    title: string;
    description: string;
    company?: string;
    deadline?: Date;
    requirements?: string[];
  }>;
}

interface NetworkVisibilityProps {
  networkData: NetworkData;
  onConnectUser: (userId: string) => void;
  onApplyOpportunity: (opportunityId: string) => void;
  loading?: boolean;
}

export default function NetworkVisibility({
  networkData,
  onConnectUser,
  onApplyOpportunity,
  loading = false
}: NetworkVisibilityProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'opportunities'>('overview');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  const getOpportunityIcon = (type: string) => {
    // Return empty string instead of emojis
    return '';
  };

  const getOpportunityColor = (type: string) => {
    switch (type) {
      case 'collaboration': return 'bg-blue-100 text-blue-800';
      case 'partnership': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'mentorship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInfluenceLevel = (score: number) => {
    if (score >= 80) return { level: 'Industry Leader', color: 'text-yellow-600' };
    if (score >= 60) return { level: 'Rising Influencer', color: 'text-green-600' };
    if (score >= 40) return { level: 'Active Contributor', color: 'text-blue-600' };
    return { level: 'Growing Network', color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="bg-[#fff7d7] p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#00132d]/20 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-[#00132d]/20 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-[#00132d]/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const influenceData = getInfluenceLevel(networkData.visibility.influenceScore);

  return (
    <div className="bg-[#fff7d7] space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-[#00132d] mb-2">
          Network Visibility
        </h2>
        <p className="text-[#00132d]/70">
          Your influence and connections in the fashion industry
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <nav className="bg-[#00132d]/5 rounded-2xl p-2 border border-[#00132d]/20">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'connections', label: 'Connections' },
              { key: 'opportunities', label: 'Opportunities' }
            ].map((tab) => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'text-[#fff7d7] shadow-lg'
                    : 'text-[#00132d]/70 hover:text-[#00132d] hover:bg-[#00132d]/5'
                }`}
                whileHover={{ scale: activeTab === tab.key ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeNetworkTab"
                    className="absolute inset-0 bg-[#00132d] rounded-xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10">
                  <div className="text-2xl mb-1">{tab.icon}</div>
                  <div className="font-semibold text-sm">{tab.label}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </nav>
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
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Influence Score */}
              <div className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20">
                <h3 className="text-xl font-semibold text-[#00132d] mb-4 flex items-center">
                  <span className="mr-2">{influenceData.icon}</span>
                  Industry Influence
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#00132d20"
                          strokeWidth="8"
                          fill="none"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#00132d"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                          animate={{ 
                            strokeDashoffset: 2 * Math.PI * 40 * (1 - networkData.visibility.influenceScore / 100)
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#00132d]">
                          {networkData.visibility.influenceScore}
                        </span>
                      </div>
                    </div>
                    <div className={`font-semibold ${influenceData.color}`}>
                      {influenceData.level}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Profile Views</span>
                      <span className="font-bold text-[#00132d]">
                        {networkData.visibility.profileViews.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Content Reach</span>
                      <span className="font-bold text-[#00132d]">
                        {networkData.visibility.contentReach.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#00132d]/70">Industry Ranking</span>
                      <span className="font-bold text-[#00132d]">
                        #{networkData.visibility.industryRanking}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Connections', value: networkData.connections.length },
                  { label: 'Opportunities', value: networkData.opportunities.length },
                  { label: 'Profile Views', value: networkData.visibility.profileViews },
                  { label: 'Influence Score', value: networkData.visibility.influenceScore }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-xl p-4 text-center border border-[#00132d]/20"
                  >
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-xl font-bold text-[#00132d] mb-1">
                      {typeof stat.value === 'number' && stat.value > 1000 
                        ? stat.value.toLocaleString() 
                        : stat.value}
                    </div>
                    <div className="text-sm text-[#00132d]/60">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Connections */}
          {activeTab === 'connections' && (
            <div className="space-y-4">
              {networkData.connections.length > 0 ? (
                networkData.connections.map((connection, index) => (
                  <motion.div
                    key={connection.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#00132d]/20 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-[#00132d]/40 rounded-full"></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#00132d]">{connection.name}</h3>
                          <p className="text-sm text-[#00132d]/70">
                            {connection.participantType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-[#00132d]/50 mt-1">
                            <span>{connection.mutualConnections} mutual connections</span>
                            <span>Active {new Date(connection.lastActive).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => onConnectUser(connection.id)}
                        className="bg-[#00132d] text-[#fff7d7] px-4 py-2 rounded-lg font-medium hover:bg-[#00132d]/80 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Connect
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">

                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Connections Yet</h3>
                  <p className="text-[#00132d]/70">Start connecting with other beta participants to grow your network.</p>
                </div>
              )}
            </div>
          )}

          {/* Opportunities */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              {networkData.opportunities.length > 0 ? (
                networkData.opportunities.map((opportunity, index) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#00132d]/5 rounded-2xl p-6 border border-[#00132d]/20 cursor-pointer"
                    onClick={() => setSelectedOpportunity(
                      selectedOpportunity === opportunity.id ? null : opportunity.id
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getOpportunityIcon(opportunity.type)}</span>
                          <h3 className="text-xl font-semibold text-[#00132d]">{opportunity.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOpportunityColor(opportunity.type)}`}>
                            {opportunity.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <p className="text-[#00132d]/70 mb-3">{opportunity.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-[#00132d]/60">
                          {opportunity.company && (
                            <span className="flex items-center space-x-1">

                              <span>{opportunity.company}</span>
                            </span>
                          )}
                          {opportunity.deadline && (
                            <span className="flex items-center space-x-1">
                              <span>⏰</span>
                              <span>Due {new Date(opportunity.deadline).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApplyOpportunity(opportunity.id);
                        }}
                        className="bg-[#00132d] text-[#fff7d7] px-6 py-2 rounded-lg font-medium hover:bg-[#00132d]/80 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Apply
                      </motion.button>
                    </div>
                    
                    <AnimatePresence>
                      {selectedOpportunity === opportunity.id && opportunity.requirements && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-[#00132d]/10"
                        >
                          <h4 className="font-semibold text-[#00132d] mb-2">Requirements:</h4>
                          <ul className="space-y-1">
                            {opportunity.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="text-sm text-[#00132d]/70 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">

                  <h3 className="text-xl font-semibold text-[#00132d] mb-2">No Opportunities Available</h3>
                  <p className="text-[#00132d]/70">New opportunities will appear here as your network grows.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}