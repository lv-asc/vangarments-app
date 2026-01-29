import { SocialPostModel } from '../models/SocialPost';
import { ContentReportModel, CreateContentReportData } from '../models/ContentReport';
import { UserFollowModel } from '../models/UserFollow';
import { SocialPost, ContentCategory, TrendingTag, StyleRecommendation } from '@vangarments/shared';

export interface DiscoveryFilters {
  category?: string;
  tags?: string[];
  contentType?: 'item' | 'inspiration';
}

export interface SearchFilters extends DiscoveryFilters {
  userId?: string;
}

export interface FeedPreferences {
  showFollowing: boolean;
  showRecommended: boolean;
  showTrending: boolean;
  preferredStyles: string[];
  preferredOccasions: string[];
  contentTypes: ('item' | 'inspiration')[];
  blockedUsers: string[];
  blockedTags: string[];
}

export class ContentDiscoveryService {
  /**
   * Get personalized discovery feed
   */
  async getDiscoveryFeed(
    userId?: string,
    filters: DiscoveryFilters = {},
    page = 1,
    limit = 20
  ): Promise<{
    posts: SocialPost[];
    categories: ContentCategory[];
    trendingTags: TrendingTag[];
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;

    // Get user preferences if authenticated
    let userPreferences: FeedPreferences | null = null;
    if (userId) {
      userPreferences = await this.getUserFeedPreferences(userId);
    }

    // Build search filters
    const searchFilters: any = {
      visibility: 'public',
      ...filters,
    };

    // Apply user preferences
    if (userPreferences) {
      if (userPreferences.contentTypes.length > 0) {
        searchFilters.postType = userPreferences.contentTypes;
      }

      if (userPreferences.blockedUsers.length > 0) {
        searchFilters.excludeUsers = userPreferences.blockedUsers;
      }
    }

    // Get posts
    const { posts, total } = await SocialPostModel.findMany(searchFilters, limit + 1, offset);
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    // Get categories and trending tags in parallel
    const [categories, trendingTags] = await Promise.all([
      this.getContentCategories(),
      this.getTrendingTags(),
    ]);

    return {
      posts,
      categories,
      trendingTags,
      hasMore,
    };
  }

  /**
   * Get trending content and tags
   */
  async getTrendingContent(
    timeframe = '7d',
    limit = 10
  ): Promise<{
    posts: SocialPost[];
    tags: TrendingTag[];
  }> {
    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get trending posts (high engagement in timeframe)
    const { posts } = await SocialPostModel.findMany(
      {
        visibility: 'public',
        // @ts-ignore
        createdAfter: startDate.toISOString(),
      },
      limit,
      0
    );

    // Sort by engagement score
    const trendingPosts = posts.sort((a, b) => {
      const scoreA = a.engagementStats.likes + a.engagementStats.comments * 2 + a.engagementStats.shares * 3;
      const scoreB = b.engagementStats.likes + b.engagementStats.comments * 2 + b.engagementStats.shares * 3;
      return scoreB - scoreA;
    });

    const trendingTags = await this.getTrendingTags(timeframe);

    return {
      posts: trendingPosts,
      tags: trendingTags,
    };
  }

  /**
   * Get content categories
   */
  async getContentCategories(): Promise<ContentCategory[]> {
    // Mock categories - in a real implementation, this would be dynamic
    return [
      {
        id: 'work',
        name: 'Trabalho',
        description: 'Looks profissionais e corporativos',
        imageUrl: '/api/placeholder/200/200',
        postCount: await this.getCategoryPostCount('trabalho'),
      },
      {
        id: 'casual',
        name: 'Casual',
        description: 'Looks para o dia a dia',
        imageUrl: '/api/placeholder/200/200',
        postCount: await this.getCategoryPostCount('casual'),
      },
      {
        id: 'party',
        name: 'Festa',
        description: 'Looks para eventos e festas',
        imageUrl: '/api/placeholder/200/200',
        postCount: await this.getCategoryPostCount('festa'),
      },
      {
        id: 'date',
        name: 'Encontro',
        description: 'Looks românticos e especiais',
        imageUrl: '/api/placeholder/200/200',
        postCount: await this.getCategoryPostCount('encontro'),
      },
    ];
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(
    userId: string,
    type = 'all',
    limit = 10
  ): Promise<StyleRecommendation[]> {
    // Get user's interaction history
    const userPosts = await SocialPostModel.findMany({ userId }, 20, 0);
    const followingIds = await UserFollowModel.getFollowingIds(userId);

    // Analyze user's style preferences
    const styleAnalysis = this.analyzeUserStyle(userPosts.posts);

    // Generate recommendations based on analysis
    const recommendations: StyleRecommendation[] = [];

    if (type === 'all' || type === 'similar_style') {
      recommendations.push({
        type: 'similar_style',
        confidence: 0.85,
        items: [],
        reason: `Baseado no seu interesse por looks ${styleAnalysis.dominantStyle}`,
        basedOn: {
          userPosts: userPosts.posts.slice(0, 3),
        },
      });
    }

    if (type === 'all' || type === 'trending') {
      recommendations.push({
        type: 'trending',
        confidence: 0.75,
        items: [],
        reason: 'Tendências populares na sua rede',
        basedOn: {
          followedUsers: [], // Would be populated with actual user data
        },
      });
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Search content with advanced filters
   */
  async searchContent(
    query: string,
    filters: SearchFilters = {},
    sortBy = 'relevance',
    page = 1,
    limit = 20
  ): Promise<{
    posts: SocialPost[];
    hasMore: boolean;
    totalResults: number;
  }> {
    const offset = (page - 1) * limit;

    const searchFilters: any = {
      visibility: 'public',
      ...filters,
    };

    // Add text search if query provided
    if (query.trim()) {
      searchFilters.textSearch = query.trim();
    }

    const { posts, total } = await SocialPostModel.findMany(searchFilters, limit + 1, offset);
    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    // Apply sorting
    let sortedPosts = posts;
    switch (sortBy) {
      case 'recent':
        sortedPosts = posts.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        sortedPosts = posts.sort((a, b) => {
          const scoreA = a.engagementStats.likes + a.engagementStats.comments * 2;
          const scoreB = b.engagementStats.likes + b.engagementStats.comments * 2;
          return scoreB - scoreA;
        });
        break;
      case 'relevance':
      default:
        // Keep original order (relevance-based from database)
        break;
    }

    return {
      posts: sortedPosts,
      hasMore,
      totalResults: total,
    };
  }

  /**
   * Get content by tag
   */
  async getContentByTag(
    tag: string,
    sortBy = 'recent',
    page = 1,
    limit = 20
  ): Promise<{
    posts: SocialPost[];
    hasMore: boolean;
    tag: {
      name: string;
      postCount: number;
      relatedTags: string[];
    };
  }> {
    const offset = (page - 1) * limit;

    const { posts, total } = await SocialPostModel.findMany(
      {
        visibility: 'public',
        tags: [tag],
      },
      limit + 1,
      offset
    );

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    // Get related tags
    const relatedTags = await this.getRelatedTags(tag);

    return {
      posts,
      hasMore,
      tag: {
        name: tag,
        postCount: total,
        relatedTags,
      },
    };
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(limit = 10): Promise<SocialPost[]> {
    // Get high-quality posts from verified users or with high engagement
    const { posts } = await SocialPostModel.findMany(
      {
        visibility: 'public',
        // @ts-ignore
        featured: true, // Assuming we have a featured flag
      },
      limit,
      0
    );

    return posts;
  }

  /**
   * Get similar content
   */
  async getSimilarContent(postId: string, limit = 5): Promise<SocialPost[]> {
    const originalPost = await SocialPostModel.findById(postId);
    if (!originalPost) {
      return [];
    }

    // Find posts with similar tags or from the same user
    const { posts } = await SocialPostModel.findMany(
      {
        visibility: 'public',
        tags: originalPost.content.tags,
        // @ts-ignore
        excludePostIds: [postId],
      },
      limit,
      0
    );

    return posts;
  }

  /**
   * Report content
   */
  async reportContent(reportData: CreateContentReportData) {
    return await ContentReportModel.create(reportData);
  }

  /**
   * Get user's feed preferences
   */
  async getUserFeedPreferences(userId: string): Promise<FeedPreferences> {
    // Mock implementation - in reality, this would fetch from database
    return {
      showFollowing: true,
      showRecommended: true,
      showTrending: true,
      preferredStyles: [],
      preferredOccasions: [],
      contentTypes: ['item', 'inspiration'],
      blockedUsers: [],
      blockedTags: [],
    };
  }

  /**
   * Update user's feed preferences
   */
  async updateUserFeedPreferences(
    userId: string,
    preferences: Partial<FeedPreferences>
  ): Promise<FeedPreferences> {
    // Mock implementation - in reality, this would update the database
    const currentPreferences = await this.getUserFeedPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };

    // TODO: Save to database

    return updatedPreferences;
  }

  /**
   * Get trending tags
   */
  private async getTrendingTags(timeframe = '7d'): Promise<TrendingTag[]> {
    // Mock implementation - in reality, this would analyze tag usage patterns
    return [
      { tag: 'blazer', postCount: 234, growth: 15.2 },
      { tag: 'jeans', postCount: 189, growth: 8.7 },
      { tag: 'vestido', postCount: 156, growth: 22.1 },
      { tag: 'casual-chic', postCount: 134, growth: 12.5 },
      { tag: 'trabalho', postCount: 98, growth: 18.9 },
    ];
  }

  /**
   * Get post count for a category
   */
  private async getCategoryPostCount(category: string): Promise<number> {
    const { total } = await SocialPostModel.findMany(
      {
        visibility: 'public',
        tags: [category],
      },
      1,
      0
    );
    return total;
  }

  /**
   * Analyze user's style preferences
   */
  private analyzeUserStyle(posts: SocialPost[]): {
    dominantStyle: string;
    preferredOccasions: string[];
    colorPreferences: string[];
  } {
    // Simple analysis based on tags
    const allTags = posts.flatMap(post => post.content.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);

    return {
      dominantStyle: sortedTags[0] || 'casual',
      preferredOccasions: sortedTags.slice(0, 3),
      colorPreferences: [], // Would analyze colors from images
    };
  }

  /**
   * Get related tags for a given tag
   */
  private async getRelatedTags(tag: string): Promise<string[]> {
    // Mock implementation - in reality, this would analyze tag co-occurrence
    const relatedTagsMap: Record<string, string[]> = {
      'blazer': ['trabalho', 'formal', 'elegante', 'escritório'],
      'jeans': ['casual', 'conforto', 'dia-a-dia', 'denim'],
      'vestido': ['feminino', 'elegante', 'festa', 'romântico'],
      'casual': ['conforto', 'dia-a-dia', 'relaxado', 'simples'],
    };

    return relatedTagsMap[tag] || [];
  }
}