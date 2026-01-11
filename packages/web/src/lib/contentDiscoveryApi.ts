import { SocialPost, ContentCategory, TrendingTag, StyleRecommendation } from '@vangarments/shared';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '') + '/api/v1';

export interface DiscoveryFeedResponse {
  posts: SocialPost[];
  categories: ContentCategory[];
  trendingTags: TrendingTag[];
  hasMore: boolean;
}

export interface SearchResponse {
  posts: SocialPost[];
  hasMore: boolean;
  totalResults: number;
}

export interface TagContentResponse {
  posts: SocialPost[];
  hasMore: boolean;
  tag: {
    name: string;
    postCount: number;
    relatedTags: string[];
  };
}

export interface FeedPreferences {
  showFollowing: boolean;
  showRecommended: boolean;
  showTrending: boolean;
  preferredStyles: string[];
  preferredOccasions: string[];
  contentTypes: ('outfit' | 'item' | 'inspiration')[];
  blockedUsers: string[];
  blockedTags: string[];
}

export interface ReportContentData {
  contentId: string;
  contentType: 'post' | 'comment' | 'user';
  reason: string;
  description?: string;
}

class ContentDiscoveryAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get personalized discovery feed
   */
  async getDiscoveryFeed(params: {
    category?: string;
    tags?: string[];
    contentType?: 'outfit' | 'item' | 'inspiration';
    page?: number;
    limit?: number;
  } = {}): Promise<DiscoveryFeedResponse> {
    const searchParams = new URLSearchParams();

    if (params.category) searchParams.append('category', params.category);
    if (params.tags) params.tags.forEach(tag => searchParams.append('tags', tag));
    if (params.contentType) searchParams.append('contentType', params.contentType);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<DiscoveryFeedResponse>(
      `/content-discovery/feed?${searchParams.toString()}`
    );
  }

  /**
   * Get trending content and tags
   */
  async getTrendingContent(params: {
    timeframe?: '1d' | '7d' | '30d';
    limit?: number;
  } = {}): Promise<{ posts: SocialPost[]; tags: TrendingTag[] }> {
    const searchParams = new URLSearchParams();

    if (params.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<{ posts: SocialPost[]; tags: TrendingTag[] }>(
      `/content-discovery/trending?${searchParams.toString()}`
    );
  }

  /**
   * Get content categories
   */
  async getContentCategories(): Promise<{ categories: ContentCategory[] }> {
    return this.request<{ categories: ContentCategory[] }>(
      '/content-discovery/categories'
    );
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(params: {
    type?: string;
    limit?: number;
  } = {}): Promise<{ recommendations: StyleRecommendation[] }> {
    const searchParams = new URLSearchParams();

    if (params.type) searchParams.append('type', params.type);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<{ recommendations: StyleRecommendation[] }>(
      `/content-discovery/recommendations?${searchParams.toString()}`
    );
  }

  /**
   * Search content with advanced filters
   */
  async searchContent(params: {
    q?: string;
    contentType?: 'outfit' | 'item' | 'inspiration';
    tags?: string[];
    userId?: string;
    category?: string;
    sortBy?: 'relevance' | 'recent' | 'popular';
    page?: number;
    limit?: number;
  } = {}): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.append('q', params.q);
    if (params.contentType) searchParams.append('contentType', params.contentType);
    if (params.tags) params.tags.forEach(tag => searchParams.append('tags', tag));
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.category) searchParams.append('category', params.category);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<SearchResponse>(
      `/content-discovery/search?${searchParams.toString()}`
    );
  }

  /**
   * Get content by tag
   */
  async getContentByTag(
    tag: string,
    params: {
      sortBy?: 'recent' | 'popular';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<TagContentResponse> {
    const searchParams = new URLSearchParams();

    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<TagContentResponse>(
      `/content-discovery/tags/${encodeURIComponent(tag)}?${searchParams.toString()}`
    );
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(params: {
    limit?: number;
  } = {}): Promise<{ posts: SocialPost[] }> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<{ posts: SocialPost[] }>(
      `/content-discovery/featured?${searchParams.toString()}`
    );
  }

  /**
   * Get similar content
   */
  async getSimilarContent(
    postId: string,
    params: { limit?: number } = {}
  ): Promise<{ posts: SocialPost[] }> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request<{ posts: SocialPost[] }>(
      `/content-discovery/similar/${postId}?${searchParams.toString()}`
    );
  }

  /**
   * Report content
   */
  async reportContent(reportData: ReportContentData): Promise<{ report: any }> {
    return this.request<{ report: any }>('/content-discovery/report', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  /**
   * Get user's feed preferences
   */
  async getFeedPreferences(): Promise<{ preferences: FeedPreferences }> {
    return this.request<{ preferences: FeedPreferences }>(
      '/content-discovery/preferences'
    );
  }

  /**
   * Update user's feed preferences
   */
  async updateFeedPreferences(
    preferences: Partial<FeedPreferences>
  ): Promise<{ preferences: FeedPreferences }> {
    return this.request<{ preferences: FeedPreferences }>(
      '/content-discovery/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }
    );
  }

  /**
   * Share outfit with "where to buy" information
   */
  async shareOutfit(shareData: {
    title: string;
    description: string;
    images: File[];
    wardrobeItemIds: string[];
    tags: string[];
    location?: string;
    visibility: 'public' | 'followers' | 'private';
    whereToBuy: Array<{
      itemId: string;
      storeName?: string;
      storeUrl?: string;
      price?: number;
      availability: 'available' | 'out_of_stock' | 'limited';
    }>;
  }): Promise<{ post: SocialPost }> {
    // Create FormData for file upload
    const formData = new FormData();

    // Add images
    shareData.images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    // Add other data
    formData.append('postType', 'outfit');
    formData.append('content', JSON.stringify({
      title: shareData.title,
      description: shareData.description,
      tags: shareData.tags,
      location: shareData.location,
      whereToBuy: shareData.whereToBuy,
    }));
    formData.append('wardrobeItemIds', JSON.stringify(shareData.wardrobeItemIds));
    formData.append('visibility', shareData.visibility);

    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE_URL}/social/posts`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }
}

export const contentDiscoveryApi = new ContentDiscoveryAPI();