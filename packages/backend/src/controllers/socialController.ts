import { Request, Response } from 'express';
import { SocialService } from '../services/socialService';
import { AuthenticatedRequest } from '../utils/auth';
import { EntityFollowModel, EntityType } from '../models/EntityFollow';
import { NotificationModel } from '../models/Notification';
import { UserModel } from '../models/User';
import { BrandTeamModel } from '../models/BrandTeam';

const socialService = new SocialService();

export class SocialController {
  /**
   * Create a new social post
   */
  async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postType, content, wardrobeItemIds, visibility } = req.body;
      const userId = req.user!.id;

      // Validate required fields
      if (!postType || !content || !content.imageUrls || content.imageUrls.length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Post type, content, and at least one image are required',
          },
        });
        return;
      }

      const post = await socialService.createPost({
        userId,
        postType,
        content,
        wardrobeItemIds: wardrobeItemIds || [],
        visibility: visibility || 'public',
      });

      res.status(201).json({
        success: true,
        data: { post },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'POST_CREATION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get a specific post by ID
   */
  async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await socialService.getPostWithDetails(postId);

      if (!post) {
        res.status(404).json({
          error: {
            code: 'POST_NOT_FOUND',
            message: 'Post not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: { post },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_POST_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get personalized feed for the authenticated user
   */
  async getFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, feedType = 'discover' } = req.query;

      const result = await socialService.getFeed({
        userId,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        feedType: feedType as 'following' | 'discover' | 'personal',
      });

      res.json({
        success: true,
        data: {
          posts: result.posts,
          hasMore: result.hasMore,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_FEED_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Search posts
   */
  async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const { q: query = '', postType, tags, userId, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (postType) filters.postType = postType;
      if (userId) filters.userId = userId;
      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags];
      }

      const result = await socialService.searchPosts(
        query as string,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          posts: result.posts,
          hasMore: result.hasMore,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'SEARCH_POSTS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Follow a user
   */
  async followUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId: followingId } = req.params;
      const { actingAs, followerId: explicitFollowerId, followerType: explicitFollowerType } = req.body;
      const userId = req.user!.id;

      // Handle "Acting As" an entity (Brand follows User)
      if (actingAs) {
        const followerId = actingAs.id;
        const followerType = actingAs.type;

        if (followerType === 'brand' || followerType === 'store' || followerType === 'supplier') {
          const isMember = await BrandTeamModel.isMember(followerId, userId);
          if (!isMember) {
            res.status(403).json({
              error: { code: 'UNAUTHORIZED_ACTION', message: 'You are not authorized to act as this entity' }
            });
            return;
          }
        }

        if (followerId === followingId) {
          res.status(400).json({ error: { code: 'SELF_FOLLOW_NOT_ALLOWED', message: 'Cannot follow yourself' } });
          return;
        }

        // Use EntityFollowModel when follower is an Entity
        const follow = await EntityFollowModel.follow({
          followerId,
          followerType,
          entityType: 'user', // Target is User
          entityId: followingId,
        });

        res.status(201).json({ success: true, data: { follow } });
        return;
      }

      if (userId === followingId) {
        res.status(400).json({
          error: {
            code: 'SELF_FOLLOW_NOT_ALLOWED',
            message: 'You cannot follow yourself',
          },
        });
        return;
      }

      const follow = await socialService.followUser(userId, followingId);

      // Create notification if follow is accepted (public profile)
      if (follow.status === 'accepted') {
        // Get follower details for the notification
        const follower = await UserModel.findById(userId);
        const followerName = follower?.username || 'Someone';

        await NotificationModel.create({
          userId: followingId,
          type: 'new_follower',
          title: 'New Follower',
          message: `${followerName} started following you`,
          link: `/u/${followerName}`,
          actorId: userId,
        });
      }

      res.status(201).json({
        success: true,
        data: { follow },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'FOLLOW_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId: followingId } = req.params;
      const { actingAs } = req.body;
      const userId = req.user!.id;

      if (actingAs) {
        const followerId = actingAs.id;
        const followerType = actingAs.type;

        if (followerType === 'brand' || followerType === 'store' || followerType === 'supplier') {
          const isMember = await BrandTeamModel.isMember(followerId, userId);
          if (!isMember) {
            res.status(403).json({
              error: { code: 'UNAUTHORIZED_ACTION', message: 'You are not authorized to act as this entity' }
            });
            return;
          }
        }

        const success = await EntityFollowModel.unfollow(
          followerId,
          followerType,
          'user',
          followingId
        );

        if (!success) {
          res.status(404).json({ error: { code: 'FOLLOW_NOT_FOUND', message: 'Follow relationship not found' } });
          return;
        }

        res.json({ success: true, message: 'Successfully unfollowed user' });
        return;
      }

      const success = await socialService.unfollowUser(userId, followingId);

      if (!success) {
        res.status(404).json({
          error: {
            code: 'FOLLOW_NOT_FOUND',
            message: 'Follow relationship not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Successfully unfollowed user',
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'UNFOLLOW_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Remove a follower (remove someone who follows you)
   */
  async removeFollower(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { followerId } = req.params;
      const userId = req.user!.id;

      const success = await socialService.removeFollower(userId, followerId);

      if (!success) {
        res.status(404).json({
          error: {
            code: 'FOLLOWER_NOT_FOUND',
            message: 'Follower relationship not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Successfully removed follower',
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'REMOVE_FOLLOWER_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, q = '' } = req.query;

      const result = await socialService.getFollowers(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        q as string
      );

      res.json({
        success: true,
        data: {
          users: result.users,
          hasMore: result.hasMore,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_FOLLOWERS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, q = '' } = req.query;

      const result = await socialService.getFollowing(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        q as string
      );

      if (result.users.length > 0) {
        console.log('[DEBUG] getFollowing first user:', JSON.stringify(result.users[0], null, 2));
      }

      res.json({
        success: true,
        data: {
          users: result.users,
          hasMore: result.hasMore,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_FOLLOWING_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Like a post
   */
  async likePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      const like = await socialService.likePost(postId, userId);

      res.status(201).json({
        success: true,
        data: { like },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'LIKE_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      const success = await socialService.unlikePost(postId, userId);

      if (!success) {
        res.status(404).json({
          error: {
            code: 'LIKE_NOT_FOUND',
            message: 'Like not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Successfully unliked post',
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'UNLIKE_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Comment content is required',
          },
        });
        return;
      }

      const comment = await socialService.addComment({
        postId,
        userId,
        content: content.trim(),
        parentCommentId,
      });

      res.status(201).json({
        success: true,
        data: { comment },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'COMMENT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      const success = await socialService.deleteComment(commentId, userId);

      if (!success) {
        res.status(404).json({
          error: {
            code: 'COMMENT_NOT_FOUND',
            message: 'Comment not found or not authorized',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'DELETE_COMMENT_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get user's wardrobe for outfit creation
   */
  async getUserWardrobe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { category } = req.query;

      const items = await socialService.getUserWardrobe(userId, category as string);

      res.json({
        success: true,
        data: { items },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_WARDROBE_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Check if user is following another user
   */
  async checkFollowStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId: followingId } = req.params;
      const followerId = req.user!.id;

      const [isFollowing, isFollower, followRel] = await Promise.all([
        socialService.isFollowing(followerId, followingId),
        socialService.isFollowing(followingId, followerId),
        socialService.getFollowRelationship(followerId, followingId)
      ]);

      res.json({
        success: true,
        data: {
          isFollowing,
          isFollower,
          status: followRel?.status
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'CHECK_FOLLOW_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get mutual connections between viewer and target user
   */
  async getMutualConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId: targetUserId } = req.params;
      const viewerId = req.user!.id;
      const { limit = 3 } = req.query;

      if (viewerId === targetUserId) {
        res.json({
          success: true,
          data: { users: [], total: 0 }
        });
        return;
      }

      const result = await socialService.getMutualConnections(
        viewerId,
        targetUserId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          users: result.users,
          total: result.total
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_MUTUAL_CONNECTIONS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get user's social statistics
   */
  async getUserSocialStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await socialService.getUserSocialStats(userId);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_STATS_FAILED',
          message: error.message,
        },
      });
    }
  }

  // ============== Entity Follow Methods ==============

  /**
   * Follow an entity (brand, store, supplier, page)
   */
  async followEntity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { actingAs, followerId: explicitFollowerId, followerType: explicitFollowerType } = req.body;
      const userId = req.user!.id;

      let followerId = userId;
      let followerType: EntityType = 'user';

      // Handle "Acting As" an entity (e.g. Brand)
      if (actingAs) {
        followerId = actingAs.id;
        followerType = actingAs.type;

        // Verify permission (e.g. Check if user is on the brand team)
        if (followerType === 'brand' || followerType === 'store' || followerType === 'supplier') {
          const isMember = await BrandTeamModel.isMember(followerId, userId);
          if (!isMember) {
            res.status(403).json({
              error: { code: 'UNAUTHORIZED_ACTION', message: 'You are not authorized to act as this entity' }
            });
            return;
          }
        }
      }

      // Prevent self-follow
      if (followerId === entityId) {
        res.status(400).json({
          error: {
            code: 'SELF_FOLLOW_NOT_ALLOWED',
            message: 'You cannot follow yourself',
          },
        });
        return;
      }

      const follow = await EntityFollowModel.follow({
        followerId,
        followerType,
        entityType: entityType as EntityType,
        entityId,
      });

      res.status(201).json({
        success: true,
        data: { follow },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'FOLLOW_ENTITY_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Unfollow an entity
   */
  async unfollowEntity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { actingAs } = req.body;
      const userId = req.user!.id;

      let followerId = userId;
      let followerType: EntityType = 'user';

      if (actingAs) {
        followerId = actingAs.id;
        followerType = actingAs.type;

        if (followerType === 'brand' || followerType === 'store' || followerType === 'supplier') {
          const isMember = await BrandTeamModel.isMember(followerId, userId);
          if (!isMember) {
            res.status(403).json({
              error: { code: 'UNAUTHORIZED_ACTION', message: 'You are not authorized to act as this entity' }
            });
            return;
          }
        }
      }

      const success = await EntityFollowModel.unfollow(
        followerId,
        followerType,
        entityType as EntityType,
        entityId
      );

      if (!success) {
        res.status(404).json({
          error: {
            code: 'FOLLOW_NOT_FOUND',
            message: 'Follow relationship not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Successfully unfollowed entity',
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'UNFOLLOW_ENTITY_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get followers of an entity
   */
  async getEntityFollowers(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await EntityFollowModel.getFollowers(
        entityType as EntityType,
        entityId,
        limitNum,
        offset
      );

      res.json({
        success: true,
        data: {
          followers: result.followers,
          total: result.total,
          hasMore: offset + result.followers.length < result.total,
          pagination: {
            page: pageNum,
            limit: limitNum,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_ENTITY_FOLLOWERS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Check if user is following an entity
   */
  async checkEntityFollowStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const followerId = req.user!.id;

      // Check if User follows Entity
      const isFollowing = await EntityFollowModel.isFollowing(
        followerId,
        'user',
        entityType as EntityType,
        entityId
      );

      // Check if Entity follows User (for "Friends" status)
      const isFollower = await EntityFollowModel.isFollowing(
        entityId,
        entityType as EntityType,
        'user',
        followerId
      );

      res.json({
        success: true,
        data: {
          isFollowing,
          isFollower
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'CHECK_ENTITY_FOLLOW_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get entities a user is following
   */
  async getUserFollowingEntities(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { entityType, page = 1, limit = 50, q = '' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await EntityFollowModel.getFollowing(
        userId,
        'user', // Follower is user
        entityType as EntityType | undefined,
        limitNum,
        offset,
        q as string
      );

      res.json({
        success: true,
        data: {
          entities: result.following,
          total: result.total,
          hasMore: offset + result.following.length < result.total,
          pagination: {
            page: pageNum,
            limit: limitNum,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_USER_FOLLOWING_ENTITIES_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get what an entity is following
   */
  async getEntityFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { targetType, page = 1, limit = 50, q = '' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await EntityFollowModel.getFollowing(
        entityId,
        entityType as EntityType,
        targetType as EntityType | undefined,
        limitNum,
        offset,
        q as string
      );

      res.json({
        success: true,
        data: {
          following: result.following,
          total: result.total,
          hasMore: offset + result.following.length < result.total,
          pagination: {
            page: pageNum,
            limit: limitNum,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_ENTITY_FOLLOWING_FAILED',
          message: error.message,
        },
      });
    }
  }
}