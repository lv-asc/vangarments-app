import { SocialPostModel, CreateSocialPostData } from '../models/SocialPost';
import { UserFollowModel, CreateUserFollowData } from '../models/UserFollow';
import { PostCommentModel, CreatePostCommentData } from '../models/PostComment';
import { PostLikeModel, CreatePostLikeData } from '../models/PostLike';
import { VUFSItemModel } from '../models/VUFSItem';
import { UserModel } from '../models/User';
import { SocialPost, PostComment, PostLike, UserFollow, UserProfile } from '@vangarments/shared';

export interface FeedOptions {
  userId: string;
  page?: number;
  limit?: number;
  feedType?: 'following' | 'discover' | 'personal';
}

export interface PostFilters {
  postType?: 'outfit' | 'item' | 'inspiration';
  tags?: string[];
  userId?: string;
}

export class SocialService {
  /**
   * Create a new social post
   */
  async createPost(postData: CreateSocialPostData): Promise<SocialPost | null> {
    // Validate wardrobe items belong to the user
    if (postData.wardrobeItemIds && postData.wardrobeItemIds.length > 0) {
      const items = await VUFSItemModel.findByOwner(postData.userId);
      const userItemIds = items.map(item => item.id);
      const invalidIds = postData.wardrobeItemIds.filter(id => !userItemIds.includes(id));

      if (invalidIds.length > 0) {
        throw new Error('Some wardrobe items do not belong to the user or do not exist');
      }
    }

    const post = await SocialPostModel.create(postData);
    return this.getPostWithDetails(post.id);
  }

  /**
   * Get a post with all its details (user, items, engagement)
   */
  async getPostWithDetails(postId: string): Promise<SocialPost | null> {
    const post = await SocialPostModel.findBySlugOrId(postId);
    if (!post) return null;

    // Get recent comments
    const { comments } = await PostCommentModel.findByPostId(post.id, 5, 0);

    // Get recent likes
    const { likes } = await PostLikeModel.findByPostId(post.id, 10, 0);

    return {
      ...post,
      comments,
      likes,
    };
  }

  /**
   * Get personalized feed for a user
   */
  async getFeed(options: FeedOptions): Promise<{ posts: SocialPost[]; hasMore: boolean }> {
    const { userId, page = 1, limit = 20, feedType = 'discover' } = options;
    const offset = (page - 1) * limit;

    let filters: any = {};

    switch (feedType) {
      case 'following':
        // Get posts from users the current user follows
        const followingIds = await UserFollowModel.getFollowingIds(userId);

        if (followingIds.length === 0) {
          return { posts: [], hasMore: false };
        }

        filters.followingIds = followingIds;
        filters.visibility = 'public'; // For now, show public posts from following
        break;

      case 'personal':
        // Get user's own posts
        filters.userId = userId;
        break;

      case 'discover':
      default:
        // Get public posts from all users, prioritizing popular content
        filters.visibility = 'public';
        break;
    }

    const { posts, total } = await SocialPostModel.findMany(filters, limit + 1, offset);
    const hasMore = posts.length > limit;

    if (hasMore) {
      posts.pop(); // Remove the extra post
    }

    return { posts, hasMore };
  }

  /**
   * Search posts with filters
   */
  async searchPosts(
    query: string,
    filters: PostFilters = {},
    page = 1,
    limit = 20
  ): Promise<{ posts: SocialPost[]; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    const searchFilters: any = {
      visibility: 'public',
      ...filters,
    };

    // For now, we'll implement basic search in the model layer
    // TODO: Implement full-text search with proper indexing
    const { posts } = await SocialPostModel.findMany(searchFilters, limit + 1, offset);

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts.pop();
    }

    return { posts, hasMore };
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<UserFollow> {
    const targetUser = await UserModel.findById(followingId);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    const isPrivate = (targetUser as any).privacySettings?.isPrivate === true;
    const status = isPrivate ? 'pending' : 'accepted';

    return await UserFollowModel.create({ followerId, followingId, status });
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    return await UserFollowModel.delete(followerId, followingId);
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, page = 1, limit = 20): Promise<{ users: UserProfile[]; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const { users, total } = await UserFollowModel.getFollowers(userId, limit + 1, offset);

    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop();
    }

    return { users, hasMore };
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string, page = 1, limit = 20): Promise<{ users: UserProfile[]; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const { users, total } = await UserFollowModel.getFollowing(userId, limit + 1, offset);

    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop();
    }

    return { users, hasMore };
  }

  /**
   * Get user's friends (bidirectional follows)
   */
  async getFriends(userId: string, page = 1, limit = 20): Promise<{ users: UserProfile[]; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const { users, total } = await UserFollowModel.getFriends(userId, limit + 1, offset);

    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop();
    }

    return { users, hasMore };
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<PostLike> {
    const like = await PostLikeModel.create({ postId, userId });

    // Update post engagement stats
    await this.updatePostEngagementStats(postId);

    return like;
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const result = await PostLikeModel.delete(postId, userId);

    if (result) {
      // Update post engagement stats
      await this.updatePostEngagementStats(postId);
    }

    return result;
  }

  /**
   * Add a comment to a post
   */
  async addComment(commentData: CreatePostCommentData): Promise<PostComment> {
    const comment = await PostCommentModel.create(commentData);

    // Update post engagement stats
    await this.updatePostEngagementStats(commentData.postId);

    return comment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await PostCommentModel.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    const postId = comment.postId;
    const result = await PostCommentModel.delete(commentId, userId);

    if (result) {
      // Update post engagement stats
      await this.updatePostEngagementStats(postId);
    }

    return result;
  }

  /**
   * Update post engagement statistics
   */
  private async updatePostEngagementStats(postId: string): Promise<void> {
    await SocialPostModel.updateEngagementStats(postId);
  }

  /**
   * Get user's wardrobe for outfit creation
   */
  async getUserWardrobe(userId: string, category?: string): Promise<any[]> {
    const filters: any = {};

    if (category) {
      filters.category = { page: category };
    }

    const items = await VUFSItemModel.findByOwner(userId, filters);
    return items;
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return await UserFollowModel.isFollowing(followerId, followingId);
  }

  /**
   * Check follow relationship (detailed)
   */
  async getFollowRelationship(followerId: string, followingId: string): Promise<UserFollow | null> {
    return await UserFollowModel.findByIds(followerId, followingId);
  }

  /**
   * Get user's social stats
   */
  async getUserSocialStats(userId: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
    friendsCount: number;
  }> {
    const [{ total: postsCount }, followCounts] = await Promise.all([
      SocialPostModel.findMany({ userId }, 1, 0), // Get total count
      UserFollowModel.getFollowCounts(userId),
    ]);

    return {
      postsCount,
      followersCount: followCounts.followersCount,
      followingCount: followCounts.followingCount,
      friendsCount: followCounts.friendsCount,
    };
  }
}