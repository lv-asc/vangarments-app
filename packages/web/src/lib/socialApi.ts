import {
  SocialPost,
  PostComment,
  PostLike,
  UserFollow,
  UserProfile,
  UserSocialStats,
  CreatePostRequest,
  FeedRequest,
  SearchPostsRequest,
  AddCommentRequest,
  FeedResponse,
  SearchResponse,
  UsersResponse
} from '@vangarments/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class SocialApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_BASE_URL}/social${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  // Post Management
  async createPost(postData: CreatePostRequest): Promise<SocialPost> {
    return this.request<SocialPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getPost(postId: string): Promise<SocialPost> {
    return this.request<SocialPost>(`/posts/${postId}`);
  }

  async deletePost(postId: string): Promise<void> {
    await this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Feed and Discovery
  async getFeed(params: FeedRequest = {}): Promise<FeedResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.feedType) searchParams.set('feedType', params.feedType);

    return this.request<FeedResponse>(`/feed?${searchParams.toString()}`);
  }

  async searchPosts(params: SearchPostsRequest = {}): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.set('q', params.q);
    if (params.postType) searchParams.set('postType', params.postType);
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.tags) {
      params.tags.forEach(tag => searchParams.append('tags', tag));
    }

    return this.request<SearchResponse>(`/posts/search?${searchParams.toString()}`);
  }

  // User Relationships
  async followUser(userId: string): Promise<UserFollow> {
    return this.request<UserFollow>(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<void> {
    await this.request(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  async getFollowers(userId: string, page = 1, limit = 20): Promise<UsersResponse> {
    return this.request<UsersResponse>(
      `/users/${userId}/followers?page=${page}&limit=${limit}`
    );
  }

  async getFollowing(userId: string, page = 1, limit = 20): Promise<UsersResponse> {
    return this.request<UsersResponse>(
      `/users/${userId}/following?page=${page}&limit=${limit}`
    );
  }

  async checkFollowStatus(userId: string): Promise<{ isFollowing: boolean }> {
    return this.request<{ isFollowing: boolean }>(`/users/${userId}/follow-status`);
  }

  async getUserSocialStats(userId: string): Promise<{ stats: UserSocialStats }> {
    return this.request<{ stats: UserSocialStats }>(`/users/${userId}/stats`);
  }

  // Post Engagement
  async likePost(postId: string): Promise<PostLike> {
    return this.request<PostLike>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async unlikePost(postId: string): Promise<void> {
    await this.request(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  }

  async addComment(postId: string, commentData: AddCommentRequest): Promise<PostComment> {
    return this.request<PostComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Wardrobe Integration
  async getUserWardrobe(category?: string): Promise<{ items: any[] }> {
    const searchParams = new URLSearchParams();
    if (category) searchParams.set('category', category);

    return this.request<{ items: any[] }>(`/wardrobe?${searchParams.toString()}`);
  }

  // Batch Operations
  async batchLikePosts(postIds: string[]): Promise<void> {
    await Promise.all(postIds.map(id => this.likePost(id)));
  }

  async batchUnlikePosts(postIds: string[]): Promise<void> {
    await Promise.all(postIds.map(id => this.unlikePost(id)));
  }

  // Content Discovery Helpers
  async getDiscoverFeed(page = 1, limit = 20): Promise<FeedResponse> {
    return this.getFeed({ feedType: 'discover', page, limit });
  }

  async getFollowingFeed(page = 1, limit = 20): Promise<FeedResponse> {
    return this.getFeed({ feedType: 'following', page, limit });
  }

  async getPersonalFeed(page = 1, limit = 20): Promise<FeedResponse> {
    return this.getFeed({ feedType: 'personal', page, limit });
  }

  // Search Helpers
  async searchByTag(tag: string, page = 1, limit = 20): Promise<SearchResponse> {
    return this.searchPosts({ tags: [tag], page, limit });
  }

  async searchByUser(userId: string, page = 1, limit = 20): Promise<SearchResponse> {
    return this.searchPosts({ userId, page, limit });
  }

  async searchByType(postType: 'outfit' | 'item' | 'inspiration', page = 1, limit = 20): Promise<SearchResponse> {
    return this.searchPosts({ postType, page, limit });
  }
}

export const socialApi = new SocialApiClient();
export default socialApi;