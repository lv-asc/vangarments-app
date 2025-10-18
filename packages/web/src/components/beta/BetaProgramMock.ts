// Mock data for beta program development and testing

export const mockBetaStatus = {
  isBetaParticipant: true,
  participant: {
    id: 'participant-123',
    participantType: 'influencer',
    joinedAt: '2024-01-15T10:00:00Z',
    referralCode: 'BETA123',
    status: 'active',
    privileges: {
      earlyAccess: true,
      advancedAnalytics: true,
      directFeedback: true,
      customBadges: true,
      prioritySupport: false,
    },
    metrics: {
      referralsCount: 3,
      feedbackSubmitted: 5,
      featuresUsed: ['ai_styling', 'marketplace_pro', 'trend_analysis'],
      engagementScore: 85,
    },
  },
};

export const mockAnalytics = {
  wardrobeInsights: {
    totalItems: 47,
    categoriesUsed: 12,
    averageItemValue: 125.50,
    styleConsistency: 0.78,
  },
  engagementMetrics: {
    dailyActiveTime: 45,
    featuresUsed: ['ai_styling', 'marketplace_pro', 'trend_analysis'],
    feedbackSubmitted: 5,
    referralsGenerated: 3,
  },
  industryInsights: {
    trendPredictions: [
      {
        category: 'Outerwear',
        trend: 'Oversized blazers gaining 25% popularity',
        confidence: 0.87,
        timeframe: 'Next 3 months',
      },
      {
        category: 'Footwear',
        trend: 'Chunky sneakers declining 15%',
        confidence: 0.72,
        timeframe: 'Next 6 months',
      },
    ],
    marketAnalysis: {
      priceRanges: {
        'luxury': 45,
        'premium': 35,
        'mid-range': 15,
        'budget': 5,
      },
      popularBrands: [
        { brand: 'Zara', usage: 23 },
        { brand: 'H&M', usage: 18 },
        { brand: 'Nike', usage: 15 },
      ],
      seasonalTrends: {
        'spring': 28,
        'summer': 32,
        'fall': 25,
        'winter': 15,
      },
    },
  },
  exclusiveData: {
    earlyTrendAccess: true,
    advancedFilters: true,
    customReports: true,
    directFeedbackChannel: true,
  },
};

export const mockExclusiveContent = {
  earlyFeatures: [
    {
      id: 'ai-styling-v2',
      name: 'AI Styling Assistant v2.0',
      description: 'Next-generation AI that creates complete outfits based on your style DNA',
      status: 'beta' as const,
      accessLevel: 'beta_pioneer',
    },
    {
      id: 'marketplace-pro',
      name: 'Marketplace Pro Analytics',
      description: 'Advanced selling insights and price optimization tools',
      status: 'alpha' as const,
      accessLevel: 'industry_leader',
    },
  ],
  industryReports: [
    {
      id: 'q1-2024-trends',
      title: 'Q1 2024 Fashion Trend Report',
      description: 'Comprehensive analysis of emerging trends in Brazilian fashion market',
      downloadUrl: '/api/beta/reports/q1-2024-trends.pdf',
      publishedAt: new Date('2024-01-15'),
    },
  ],
  trendPreviews: [
    {
      id: 'spring-2024-colors',
      title: 'Spring 2024 Color Palette Preview',
      description: 'Exclusive preview of trending colors for the upcoming season',
      imageUrl: '/api/beta/content/spring-2024-colors.jpg',
      confidence: 0.89,
    },
  ],
  networkingOpportunities: [
    {
      id: 'beta-meetup-sp',
      title: 'São Paulo Beta Pioneer Meetup',
      description: 'Exclusive networking event for beta participants in São Paulo',
      date: new Date('2024-03-15'),
      location: 'São Paulo, SP',
      attendeeLimit: 50,
      registrationUrl: '/api/beta/events/beta-meetup-sp/register',
    },
  ],
};

export const mockNetworkData = {
  connections: [
    {
      id: 'user-456',
      name: 'Maria Silva',
      participantType: 'brand',
      mutualConnections: 5,
      lastActive: new Date('2024-01-20'),
    },
    {
      id: 'user-789',
      name: 'João Santos',
      participantType: 'stylist',
      mutualConnections: 3,
      lastActive: new Date('2024-01-18'),
    },
  ],
  visibility: {
    profileViews: 1250,
    contentReach: 8500,
    industryRanking: 15,
    influenceScore: 87,
  },
  opportunities: [
    {
      id: 'brand-collab-1',
      type: 'collaboration' as const,
      title: 'Brand Partnership Opportunity',
      description: 'Sustainable fashion brand looking for industry leaders',
      company: 'EcoFashion Brasil',
      deadline: new Date('2024-04-01'),
      requirements: [
        'Minimum 1000 followers',
        'Focus on sustainable fashion',
        'Active social media presence',
      ],
    },
  ],
};

export const mockReferralData = {
  referralCode: 'BETA123',
  referralsCount: 3,
  rewards: [
    {
      id: 'reward-1',
      type: 'badge',
      description: 'Referral Champion badge for 5 successful referrals',
      status: 'pending' as const,
    },
  ],
  leaderboard: [
    {
      userId: 'user-1',
      participantType: 'industry_leader',
      engagementScore: 95,
      referralsCount: 8,
      feedbackSubmitted: 12,
      rank: 1,
    },
    {
      userId: 'user-2',
      participantType: 'brand',
      engagementScore: 87,
      referralsCount: 3,
      feedbackSubmitted: 5,
      rank: 2,
    },
  ],
};