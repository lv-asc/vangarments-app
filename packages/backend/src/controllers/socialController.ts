
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { UserFollowModel } from '../models/UserFollow';
import { EntityFollowModel, EntityType } from '../models/EntityFollow';
import { UserModel } from '../models/User';

export class SocialController {

    // --- User to User Follows ---

    static async getFollowStatus(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { userId } = req.params; // Target user ID
            const followerId = req.user.userId;

            const status = await UserFollowModel.getFollowStatus(followerId, userId);
            const isFollowing = status === 'accepted' || status === 'pending';

            // Check if target user follows viewer (for isFollower/Friends status)
            const reverseStatus = await UserFollowModel.getFollowStatus(userId, followerId);
            const isFollower = reverseStatus === 'accepted';

            res.json({
                data: {
                    isFollowing,
                    status,
                    isFollower
                }
            });
        } catch (error: any) {
            console.error('getFollowStatus error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async followUser(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { userId } = req.params; // Target user ID
            const followerId = req.user.userId;

            // Prevent self-follow
            if (followerId === userId) {
                return res.status(400).json({ error: 'Cannot follow yourself' });
            }

            const follow = await UserFollowModel.create({
                followerId,
                followingId: userId
            });

            res.json({
                message: 'Successfully followed user',
                data: follow
            });
        } catch (error: any) {
            console.error('followUser error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async unfollowUser(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { userId } = req.params; // Target user ID (followingId)
            const followerId = req.user.userId;

            const success = await UserFollowModel.delete(followerId, userId);

            if (!success) {
                return res.status(404).json({ error: 'Relationship not found' });
            }

            res.json({
                message: 'Successfully unfollowed user'
            });
        } catch (error: any) {
            console.error('unfollowUser error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getUserFollowers(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.q as string;
            const offset = (page - 1) * limit;

            const result = await UserFollowModel.getFollowers(userId, limit, offset, search);

            res.json({
                data: {
                    users: result.users,
                    hasMore: result.total > offset + limit,
                    total: result.total
                }
            });
        } catch (error: any) {
            console.error('getUserFollowers error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getUserFollowing(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const search = req.query.q as string;
            const offset = (page - 1) * limit;

            const result = await UserFollowModel.getFollowing(userId, limit, offset, search);

            res.json({
                data: {
                    users: result.users,
                    hasMore: result.total > offset + limit,
                    total: result.total
                }
            });
        } catch (error: any) {
            console.error('getUserFollowing error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getUserFollowingEntities(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const search = req.query.q as string;
            const entityType = req.query.entityType as EntityType | undefined;
            const offset = (page - 1) * limit;

            const result = await EntityFollowModel.getFollowing(userId, 'user', entityType, limit, offset, search);

            res.json({
                data: {
                    entities: result.following,
                    hasMore: result.total > offset + limit,
                    total: result.total
                }
            });
        } catch (error: any) {
            console.error('getUserFollowingEntities error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getMutualConnections(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                // If not logged in, return empty
                return res.json({ data: { users: [], total: 0 } });
            }

            const { userId } = req.params; // Target user
            const viewerId = req.user.userId;
            const limit = parseInt(req.query.limit as string) || 3;

            if (userId === viewerId) {
                return res.json({ data: { users: [], total: 0 } });
            }

            const result = await UserFollowModel.getMutualConnections(viewerId, userId, limit);

            res.json({
                data: result
            });
        } catch (error: any) {
            console.error('getMutualConnections error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // --- Entity Follows (Brand, Store, etc) ---

    static async followEntity(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { entityType, entityId } = req.params;
            const followerId = req.user.userId;

            const follow = await EntityFollowModel.follow({
                followerId,
                followerType: 'user',
                entityType: entityType as EntityType,
                entityId
            });

            res.json({
                message: 'Successfully followed entity',
                data: follow
            });
        } catch (error: any) {
            console.error('followEntity error:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async unfollowEntity(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { entityType, entityId } = req.params;
            const followerId = req.user.userId;

            const success = await EntityFollowModel.unfollow(followerId, 'user', entityType as EntityType, entityId);

            if (!success) {
                return res.status(404).json({ error: 'Relationship not found' });
            }

            res.json({
                message: 'Successfully unfollowed entity'
            });
        } catch (error: any) {
            console.error('unfollowEntity error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getEntityFollowStatus(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { entityType, entityId } = req.params;
            const followerId = req.user.userId;

            const isFollowing = await EntityFollowModel.isFollowing(followerId, 'user', entityType as EntityType, entityId);

            res.json({
                data: {
                    isFollowing
                }
            });
        } catch (error: any) {
            console.error('getEntityFollowStatus error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getEntityFollowers(req: Request, res: Response) {
        try {
            const { entityType, entityId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const result = await EntityFollowModel.getFollowers(entityType as EntityType, entityId, limit, offset);

            res.json({
                data: {
                    followers: result.followers,
                    hasMore: result.total > offset + limit,
                    total: result.total
                }
            });
        } catch (error: any) {
            console.error('getEntityFollowers error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
