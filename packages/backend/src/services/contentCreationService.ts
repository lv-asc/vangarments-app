import { ContentCreationModel, FitPicData, OutfitCreationSession } from '../models/ContentCreation';
import { VUFSItemModel } from '../models/VUFSItem';
import { UserFollowModel } from '../models/UserFollow';

export interface CreateFitPicRequest {
  imageUrl: string;
  wardrobeItemIds: string[];
  caption?: string;
  location?: string;
  tags?: string[];
  visibility?: 'public' | 'followers' | 'private';
}

export interface OutfitSuggestionRequest {
  pinnedItemId: string;
  occasion?: string;
  season?: string;
  stylePreferences?: string[];
}

export interface PersonalizedFeedOptions {
  interests?: string[];
  page?: number;
  limit?: number;
  includeFollowing?: boolean;
}

export class ContentCreationService {
  /**
   * Create a fit pic with wardrobe item tagging
   */
  async createFitPic(userId: string, fitPicData: CreateFitPicRequest): Promise<any> {
    // Validate wardrobe items belong to the user
    if (fitPicData.wardrobeItemIds && fitPicData.wardrobeItemIds.length > 0) {
      const userItems = await VUFSItemModel.findByOwner(userId);
      const userItemIds = userItems.map(item => item.id);
      const invalidIds = fitPicData.wardrobeItemIds.filter(id => !userItemIds.includes(id));
      
      if (invalidIds.length > 0) {
        throw new Error('Some wardrobe items do not belong to the user');
      }
    }

    const fitPic: FitPicData = {
      userId,
      imageUrl: fitPicData.imageUrl,
      wardrobeItemIds: fitPicData.wardrobeItemIds,
      caption: fitPicData.caption,
      location: fitPicData.location,
      tags: fitPicData.tags,
      visibility: fitPicData.visibility || 'public',
    };

    return await ContentCreationModel.createFitPic(fitPic);
  }

  /**
   * Start or update outfit creation session
   */
  async startOutfitCreation(userId: string, pinnedItemId?: string): Promise<OutfitCreationSession> {
    // Check if user has an active session
    const activeSession = await ContentCreationModel.getActiveOutfitSession(userId);
    
    if (activeSession) {
      // Update existing session with new pinned item if provided
      if (pinnedItemId) {
        return await ContentCreationModel.updateOutfitSession(activeSession.id, {
          pinnedItemId,
        }) as OutfitCreationSession;
      }
      return activeSession;
    }

    // Create new session
    return await ContentCreationModel.createOutfitSession({
      userId,
      pinnedItemId,
    });
  }

  /**
   * Add item to outfit creation session
   */
  async addItemToOutfit(userId: string, sessionId: string, itemId: string): Promise<OutfitCreationSession> {
    const session = await ContentCreationModel.getOutfitSession(sessionId);
    
    if (!session || session.userId !== userId) {
      throw new Error('Outfit session not found or access denied');
    }

    // Verify item belongs to user
    const userItems = await VUFSItemModel.findByOwner(userId);
    const userItemIds = userItems.map(item => item.id);
    
    if (!userItemIds.includes(itemId)) {
      throw new Error('Item does not belong to user');
    }

    const updatedSelectedItems = [...session.selectedItemIds];
    if (!updatedSelectedItems.includes(itemId)) {
      updatedSelectedItems.push(itemId);
    }

    return await ContentCreationModel.updateOutfitSession(sessionId, {
      selectedItemIds: updatedSelectedItems,
    }) as OutfitCreationSession;
  }

  /**
   * Remove item from outfit creation session
   */
  async removeItemFromOutfit(userId: string, sessionId: string, itemId: string): Promise<OutfitCreationSession> {
    const session = await ContentCreationModel.getOutfitSession(sessionId);
    
    if (!session || session.userId !== userId) {
      throw new Error('Outfit session not found or access denied');
    }

    const updatedSelectedItems = session.selectedItemIds.filter(id => id !== itemId);

    return await ContentCreationModel.updateOutfitSession(sessionId, {
      selectedItemIds: updatedSelectedItems,
    }) as OutfitCreationSession;
  }

  /**
   * Get outfit suggestions based on selected items
   */
  async getOutfitSuggestions(userId: string, request: OutfitSuggestionRequest): Promise<{
    suggestions: any[];
    reasoning: string[];
  }> {
    const { pinnedItemId, occasion, season } = request;

    // Get suggestions from the model
    const suggestionIds = await ContentCreationModel.generateOutfitSuggestions(
      userId,
      pinnedItemId,
      occasion,
      season
    );

    // Get full item details for suggestions
    const suggestions = [];
    const reasoning = [];

    for (const itemId of suggestionIds) {
      const item = await VUFSItemModel.findById(itemId);
      if (item) {
        suggestions.push(item);
        
        // Generate reasoning based on item properties
        const itemCategory = item.categoryHierarchy.page;
        const itemColors = item.metadata.colors?.map((c: any) => c.name) || [];
        
        let reason = `Complements your selection`;
        if (occasion) {
          reason += ` for ${occasion}`;
        }
        if (season) {
          reason += ` in ${season}`;
        }
        if (itemColors.length > 0) {
          reason += ` with matching ${itemColors.join(', ')} tones`;
        }
        
        reasoning.push(reason);
      }
    }

    return { suggestions, reasoning };
  }

  /**
   * Get personalized content feed
   */
  async getPersonalizedFeed(userId: string, options: PersonalizedFeedOptions = {}): Promise<{
    posts: any[];
    hasMore: boolean;
    engagementMetrics?: any;
  }> {
    const { interests = [], page = 1, limit = 20, includeFollowing = true } = options;
    const offset = (page - 1) * limit;

    // Get user's interests from their profile and activity if not provided
    let userInterests = interests;
    if (userInterests.length === 0) {
      // TODO: Implement interest extraction from user activity
      userInterests = ['fashion', 'style', 'outfit'];
    }

    const { posts, total } = await ContentCreationModel.getPersonalizedFeed(
      userId,
      userInterests,
      limit + 1,
      offset
    );

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    // Get user's social proof metrics
    const engagementMetrics = await ContentCreationModel.getSocialProofMetrics(userId);

    return {
      posts,
      hasMore,
      engagementMetrics,
    };
  }

  /**
   * Get content visibility analytics
   */
  async getContentVisibilityAnalytics(userId: string): Promise<{
    publicPosts: number;
    followersPosts: number;
    privatePosts: number;
    totalReach: number;
    engagementByVisibility: Record<string, number>;
  }> {
    // This would typically involve more complex analytics queries
    // For now, we'll provide a basic implementation
    
    const { followersCount } = await UserFollowModel.getFollowCounts(userId);
    const socialProof = await ContentCreationModel.getSocialProofMetrics(userId);

    // Estimate reach based on visibility settings and follower count
    const estimatedReach = {
      public: socialProof.totalPosts * 100, // Assume public posts reach ~100 people on average
      followers: socialProof.totalPosts * Math.min(followersCount, 50), // Followers see most posts
      private: 0, // Private posts have no reach
    };

    return {
      publicPosts: Math.floor(socialProof.totalPosts * 0.7), // Assume 70% are public
      followersPosts: Math.floor(socialProof.totalPosts * 0.25), // 25% followers-only
      privatePosts: Math.floor(socialProof.totalPosts * 0.05), // 5% private
      totalReach: estimatedReach.public + estimatedReach.followers,
      engagementByVisibility: {
        public: socialProof.engagementRate * 0.8, // Public posts get slightly lower engagement
        followers: socialProof.engagementRate * 1.2, // Followers engage more
        private: 0,
      },
    };
  }

  /**
   * Get trending tags and content categories
   */
  async getTrendingContent(): Promise<{
    trendingTags: Array<{ tag: string; count: number; growth: number }>;
    popularCategories: Array<{ category: string; postCount: number }>;
    featuredCreators: Array<{ userId: string; profile: any; metrics: any }>;
  }> {
    // This would typically involve complex analytics queries
    // For now, we'll return mock trending data
    
    return {
      trendingTags: [
        { tag: 'ootd', count: 1250, growth: 15.2 },
        { tag: 'streetstyle', count: 890, growth: 8.7 },
        { tag: 'vintage', count: 654, growth: 22.1 },
        { tag: 'sustainable', count: 432, growth: 31.5 },
        { tag: 'minimalist', count: 387, growth: 12.3 },
      ],
      popularCategories: [
        { category: 'Tops', postCount: 2340 },
        { category: 'Bottoms', postCount: 1890 },
        { category: 'Dresses', postCount: 1456 },
        { category: 'Shoes', postCount: 1234 },
        { category: 'Accessories', postCount: 987 },
      ],
      featuredCreators: [
        // This would be populated with actual user data
      ],
    };
  }

  /**
   * Generate content creation tips based on user's wardrobe
   */
  async getContentCreationTips(userId: string): Promise<{
    tips: string[];
    suggestedOutfits: any[];
    photoTips: string[];
  }> {
    const userItems = await VUFSItemModel.findByOwner(userId);
    const socialProof = await ContentCreationModel.getSocialProofMetrics(userId);

    const tips = [];
    const photoTips = [
      'Use natural lighting for the best colors',
      'Try different angles to showcase the outfit details',
      'Include close-ups of interesting textures or patterns',
      'Show the full outfit and detail shots',
      'Use a clean, uncluttered background',
    ];

    // Generate personalized tips based on wardrobe
    if (userItems.length > 10) {
      tips.push('You have a great wardrobe! Try creating outfit combinations with pieces you haven\'t worn together.');
    }

    if (socialProof.engagementRate < 2) {
      tips.push('Try adding more descriptive captions and relevant hashtags to increase engagement.');
    }

    if (socialProof.totalPosts < 5) {
      tips.push('Share more of your daily outfits to build your fashion profile and connect with others.');
    }

    // Suggest outfit combinations
    const suggestedOutfits = [];
    if (userItems.length >= 2) {
      // Simple algorithm to suggest outfit combinations
      const tops = userItems.filter(item => item.categoryHierarchy.page === 'Tops');
      const bottoms = userItems.filter(item => item.categoryHierarchy.page === 'Bottoms');
      
      if (tops.length > 0 && bottoms.length > 0) {
        suggestedOutfits.push({
          items: [tops[0], bottoms[0]],
          occasion: 'casual',
          reason: 'Classic combination for everyday wear',
        });
      }
    }

    return {
      tips,
      suggestedOutfits,
      photoTips,
    };
  }
}