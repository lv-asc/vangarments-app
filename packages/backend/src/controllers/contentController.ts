import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { ContentPostModel, ContentType, CreateContentPostData, UpdateContentPostData } from '../models/ContentPost';
import { ContentViewModel } from '../models/ContentView';
import { ContentDraftModel, CreateDraftData, UpdateDraftData } from '../models/ContentDraft';
import { UserFollowModel } from '../models/UserFollow';

export class ContentController {
    // ─────────────────────────────────────────────────────────────────────────────
    // CONTENT POSTS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Create a new content post
     */
    static async createPost(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { contentType, mediaUrls, mediaType, thumbnailUrl, caption, aspectRatio, audioId, audioName, audioArtist, visibility } = req.body;

            if (!contentType || !['daily', 'motion', 'feed'].includes(contentType)) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
                return res.status(400).json({ error: 'At least one media URL is required' });
            }

            const postData: CreateContentPostData = {
                userId: req.user.userId,
                contentType,
                mediaUrls,
                mediaType: mediaType || 'image',
                thumbnailUrl,
                caption,
                aspectRatio,
                audioId,
                audioName,
                audioArtist,
                visibility
            };

            const post = await ContentPostModel.create(postData);

            res.status(201).json({
                message: 'Content created successfully',
                data: post
            });
        } catch (error: any) {
            console.error('createPost error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get a single content post
     */
    static async getPost(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const viewerId = req.user?.userId;

            const post = await ContentPostModel.findById(id, viewerId);

            if (!post) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ data: post });
        } catch (error: any) {
            console.error('getPost error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get content feed
     */
    static async getFeed(req: AuthenticatedRequest, res: Response) {
        try {
            const viewerId = req.user?.userId;
            const contentType = req.query.type as ContentType | undefined;
            const userId = req.query.userId as string | undefined;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            // Get following IDs for feed filtering
            let followingIds: string[] = [];
            if (viewerId && !userId) {
                const following = await UserFollowModel.getFollowingIds(viewerId);
                followingIds = following;
            }

            const result = await ContentPostModel.findMany(
                {
                    contentType,
                    userId,
                    followingIds: followingIds.length > 0 ? followingIds : undefined,
                    visibility: 'public'
                },
                limit,
                offset,
                viewerId
            );

            res.json({
                data: {
                    posts: result.posts,
                    total: result.total,
                    hasMore: result.total > offset + limit,
                    page
                }
            });
        } catch (error: any) {
            console.error('getFeed error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get active Daily stories from followed users
     */
    static async getStories(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const viewerId = req.user.userId;
            const limit = parseInt(req.query.limit as string) || 50;

            // Get users the viewer follows
            const followingIds = await UserFollowModel.getFollowingIds(viewerId);

            const result = await ContentPostModel.getActiveStories(viewerId, followingIds, limit);

            res.json({
                data: {
                    users: result.users,
                    total: result.total
                }
            });
        } catch (error: any) {
            console.error('getStories error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update a content post
     */
    static async updatePost(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const { caption, visibility, isArchived, audioId, audioName, audioArtist } = req.body;

            // Verify ownership
            const existing = await ContentPostModel.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Content not found' });
            }
            if (existing.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized to update this content' });
            }

            const updateData: UpdateContentPostData = {};
            if (caption !== undefined) updateData.caption = caption;
            if (visibility !== undefined) updateData.visibility = visibility;
            if (isArchived !== undefined) updateData.isArchived = isArchived;
            if (audioId !== undefined) updateData.audioId = audioId;
            if (audioName !== undefined) updateData.audioName = audioName;
            if (audioArtist !== undefined) updateData.audioArtist = audioArtist;

            const post = await ContentPostModel.update(id, updateData);

            res.json({
                message: 'Content updated successfully',
                data: post
            });
        } catch (error: any) {
            console.error('updatePost error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Delete a content post
     */
    static async deletePost(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;

            // Verify ownership
            const existing = await ContentPostModel.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Content not found' });
            }
            if (existing.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized to delete this content' });
            }

            await ContentPostModel.delete(id);

            res.json({ message: 'Content deleted successfully' });
        } catch (error: any) {
            console.error('deletePost error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Toggle like on a content post
     */
    static async toggleLike(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const result = await ContentPostModel.toggleLike(id, req.user.userId);

            res.json({
                message: result.liked ? 'Content liked' : 'Content unliked',
                data: result
            });
        } catch (error: any) {
            console.error('toggleLike error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CONTENT VIEWS (Story "Seen" tracking)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Record that a user viewed content (for Daily stories)
     */
    static async recordView(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            await ContentViewModel.recordView(id, req.user.userId);

            res.json({ message: 'View recorded' });
        } catch (error: any) {
            console.error('recordView error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get viewers of content (for owners to see "Seen" list)
     */
    static async getViewers(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = (page - 1) * limit;

            // Verify ownership
            const content = await ContentPostModel.findById(id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            if (content.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Only content owner can view this' });
            }

            const result = await ContentViewModel.getViewers(id, limit, offset);

            res.json({
                data: {
                    viewers: result.viewers,
                    total: result.total,
                    hasMore: result.total > offset + limit
                }
            });
        } catch (error: any) {
            console.error('getViewers error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DRAFTS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Create a new draft
     */
    static async createDraft(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { contentType, draftData, mediaUrls, thumbnailUrl } = req.body;

            if (!contentType || !['daily', 'motion', 'feed'].includes(contentType)) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            const data: CreateDraftData = {
                userId: req.user.userId,
                contentType,
                draftData,
                mediaUrls,
                thumbnailUrl
            };

            const draft = await ContentDraftModel.create(data);

            res.status(201).json({
                message: 'Draft saved',
                data: draft
            });
        } catch (error: any) {
            console.error('createDraft error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get user's drafts
     */
    static async getDrafts(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const contentType = req.query.type as ContentType | undefined;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const result = await ContentDraftModel.findByUser(
                req.user.userId,
                contentType,
                limit,
                offset
            );

            res.json({
                data: {
                    drafts: result.drafts,
                    total: result.total,
                    hasMore: result.total > offset + limit
                }
            });
        } catch (error: any) {
            console.error('getDrafts error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get a single draft
     */
    static async getDraft(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const draft = await ContentDraftModel.findById(id);

            if (!draft) {
                return res.status(404).json({ error: 'Draft not found' });
            }
            if (draft.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            res.json({ data: draft });
        } catch (error: any) {
            console.error('getDraft error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Update a draft
     */
    static async updateDraft(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;
            const { draftData, mediaUrls, thumbnailUrl } = req.body;

            // Verify ownership
            const existing = await ContentDraftModel.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Draft not found' });
            }
            if (existing.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            const updateData: UpdateDraftData = {};
            if (draftData !== undefined) updateData.draftData = draftData;
            if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls;
            if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

            const draft = await ContentDraftModel.update(id, updateData);

            res.json({
                message: 'Draft updated',
                data: draft
            });
        } catch (error: any) {
            console.error('updateDraft error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Delete a draft
     */
    static async deleteDraft(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;

            // Verify ownership
            const existing = await ContentDraftModel.findById(id);
            if (!existing) {
                return res.status(404).json({ error: 'Draft not found' });
            }
            if (existing.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            await ContentDraftModel.delete(id);

            res.json({ message: 'Draft deleted' });
        } catch (error: any) {
            console.error('deleteDraft error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * Publish a draft (convert to post)
     */
    static async publishDraft(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { id } = req.params;

            // Get the draft
            const draft = await ContentDraftModel.findById(id);
            if (!draft) {
                return res.status(404).json({ error: 'Draft not found' });
            }
            if (draft.userId !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized' });
            }

            // Validate draft has required data
            if (!draft.mediaUrls || draft.mediaUrls.length === 0) {
                return res.status(400).json({ error: 'Draft must have at least one media file' });
            }

            // Create the post from draft
            const postData: CreateContentPostData = {
                userId: req.user.userId,
                contentType: draft.contentType,
                mediaUrls: draft.mediaUrls,
                mediaType: (draft.draftData.mediaType as 'image' | 'video' | 'mixed') || 'image',
                thumbnailUrl: draft.thumbnailUrl,
                caption: draft.draftData.caption,
                aspectRatio: draft.draftData.aspectRatio as '1:1' | '4:5' | '9:16' | undefined,
                audioId: draft.draftData.audioId,
                audioName: draft.draftData.audioName,
                audioArtist: draft.draftData.audioArtist,
                visibility: (draft.draftData.visibility as 'public' | 'followers' | 'private') || 'public'
            };

            const post = await ContentPostModel.create(postData);

            // Delete the draft
            await ContentDraftModel.delete(id);

            res.status(201).json({
                message: 'Draft published successfully',
                data: post
            });
        } catch (error: any) {
            console.error('publishDraft error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
