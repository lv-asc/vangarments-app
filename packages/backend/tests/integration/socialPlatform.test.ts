import { SocialService } from '../../src/services/socialService';

// Mock all the models and dependencies
jest.mock('../../src/models/SocialPost');
jest.mock('../../src/models/UserFollow');
jest.mock('../../src/models/PostComment');
jest.mock('../../src/models/PostLike');
jest.mock('../../src/models/VUFSItem');

describe('Social Platform Integration Tests', () => {
  let socialService: SocialService;

  beforeEach(() => {
    socialService = new SocialService();
    jest.clearAllMocks();
  });

  describe('Content Sharing Workflow', () => {
    it('should complete full content sharing workflow', async () => {
      const { SocialPostModel } = require('../../src/models/SocialPost');
      const { VUFSItemModel } = require('../../src/models/VUFSItem');
      const { PostCommentModel } = require('../../src/models/PostComment');
      const { PostLikeModel } = require('../../src/models/PostLike');

      const mockPost = {
        id: 'post-1',
        userId: 'user-1',
        postType: 'outfit',
        content: {
          title: 'Summer Look',
          imageUrls: ['https://example.com/outfit.jpg']
        },
        wardrobeItemIds: ['item-1'],
        visibility: 'public',
        engagementStats: { likes: 0, comments: 0, shares: 0 },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const mockVUFSItem = {
        id: 'item-1',
        ownerId: 'user-1',
        vufsCode: 'VUFS-001'
      };

      // Mock the model methods
      VUFSItemModel.findByOwner = jest.fn().mockResolvedValue([mockVUFSItem]);
      SocialPostModel.create = jest.fn().mockResolvedValue(mockPost);
      SocialPostModel.findById = jest.fn().mockResolvedValue(mockPost);
      PostCommentModel.findByPostId = jest.fn().mockResolvedValue({ comments: [], total: 0 });
      PostLikeModel.findByPostId = jest.fn().mockResolvedValue({ likes: [], total: 0 });

      // 1. Create a post
      const postData = {
        userId: 'user-1',
        postType: 'outfit' as const,
        content: {
          title: 'Summer Look',
          imageUrls: ['https://example.com/outfit.jpg']
        },
        wardrobeItemIds: ['item-1'],
        visibility: 'public' as const
      };

      const createdPost = await socialService.createPost(postData);

      expect(VUFSItemModel.findByOwner).toHaveBeenCalledWith('user-1');
      expect(SocialPostModel.create).toHaveBeenCalledWith(postData);
      expect(createdPost.id).toBe('post-1');

      // 2. Retrieve the post with details
      const retrievedPost = await socialService.getPostWithDetails('post-1');

      expect(SocialPostModel.findById).toHaveBeenCalledWith('post-1');
      expect(PostCommentModel.findByPostId).toHaveBeenCalledWith('post-1', 5, 0);
      expect(PostLikeModel.findByPostId).toHaveBeenCalledWith('post-1', 10, 0);
      expect(retrievedPost?.id).toBe('post-1');
    });

    it('should handle post sharing with engagement', async () => {
      const { PostLikeModel } = require('../../src/models/PostLike');
      const { PostCommentModel } = require('../../src/models/PostComment');
      const { SocialPostModel } = require('../../src/models/SocialPost');

      const mockLike = {
        id: 'like-1',
        postId: 'post-1',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great outfit!',
        parentCommentId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock the model methods
      PostLikeModel.create = jest.fn().mockResolvedValue(mockLike);
      PostCommentModel.create = jest.fn().mockResolvedValue(mockComment);
      SocialPostModel.updateEngagementStats = jest.fn().mockResolvedValue(undefined);

      // 1. Like the post
      const like = await socialService.likePost('post-1', 'user-1');

      expect(PostLikeModel.create).toHaveBeenCalledWith({
        postId: 'post-1',
        userId: 'user-1'
      });
      expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
      expect(like.id).toBe('like-1');

      // 2. Comment on the post
      const comment = await socialService.addComment({
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great outfit!'
      });

      expect(PostCommentModel.create).toHaveBeenCalledWith({
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great outfit!'
      });
      expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
      expect(comment.content).toBe('Great outfit!');
    });
  });

  describe('User Following and Feed Generation', () => {
    it('should complete follow workflow and generate personalized feed', async () => {
      const { UserFollowModel } = require('../../src/models/UserFollow');
      const { SocialPostModel } = require('../../src/models/SocialPost');

      const mockFollow = {
        id: 'follow-1',
        followerId: 'user-1',
        followingId: 'user-2',
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockPost = {
        id: 'post-1',
        userId: 'user-2',
        postType: 'outfit',
        content: { title: 'User 2 Post', imageUrls: ['test.jpg'] },
        wardrobeItemIds: [],
        visibility: 'public',
        engagementStats: { likes: 0, comments: 0, shares: 0 },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock the model methods
      UserFollowModel.create = jest.fn().mockResolvedValue(mockFollow);
      UserFollowModel.getFollowingIds = jest.fn().mockResolvedValue(['user-2']);
      SocialPostModel.findMany = jest.fn().mockResolvedValue({
        posts: [mockPost],
        total: 1
      });

      // 1. Follow a user
      const follow = await socialService.followUser('user-1', 'user-2');

      expect(UserFollowModel.create).toHaveBeenCalledWith({
        followerId: 'user-1',
        followingId: 'user-2'
      });
      expect(follow.id).toBe('follow-1');

      // 2. Get following feed
      const feed = await socialService.getFeed({
        userId: 'user-1',
        feedType: 'following',
        page: 1,
        limit: 20
      });

      expect(UserFollowModel.getFollowingIds).toHaveBeenCalledWith('user-1');
      expect(SocialPostModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          followingIds: ['user-2'],
          visibility: 'public'
        }),
        21,
        0
      );
      expect(feed.posts).toHaveLength(1);
      expect(feed.posts[0].userId).toBe('user-2');
    });

    it('should handle unfollow and update feed accordingly', async () => {
      const { UserFollowModel } = require('../../src/models/UserFollow');

      // Mock the model methods
      UserFollowModel.delete = jest.fn().mockResolvedValue(true);
      UserFollowModel.getFollowingIds = jest.fn().mockResolvedValue([]);

      // 1. Unfollow user
      const result = await socialService.unfollowUser('user-1', 'user-2');

      expect(UserFollowModel.delete).toHaveBeenCalledWith('user-1', 'user-2');
      expect(result).toBe(true);

      // 2. Get following feed (should be empty)
      const feed = await socialService.getFeed({
        userId: 'user-1',
        feedType: 'following',
        page: 1,
        limit: 20
      });

      expect(UserFollowModel.getFollowingIds).toHaveBeenCalledWith('user-1');
      expect(feed.posts).toEqual([]);
      expect(feed.hasMore).toBe(false);
    });
  });

  describe('Engagement Features Integration', () => {
    it('should handle complex engagement scenarios', async () => {
      const { PostLikeModel } = require('../../src/models/PostLike');
      const { PostCommentModel } = require('../../src/models/PostComment');
      const { SocialPostModel } = require('../../src/models/SocialPost');

      const mockLike = {
        id: 'like-1',
        postId: 'post-1',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great style!',
        parentCommentId: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const mockReply = {
        id: 'comment-2',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Thanks for sharing!',
        parentCommentId: 'comment-1',
        createdAt: '2024-01-01T01:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z'
      };

      // Mock the model methods
      PostLikeModel.create = jest.fn().mockResolvedValue(mockLike);
      PostCommentModel.create = jest.fn()
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(mockReply);
      SocialPostModel.updateEngagementStats = jest.fn().mockResolvedValue(undefined);

      // 1. Like post
      const like = await socialService.likePost('post-1', 'user-1');
      expect(like.id).toBe('like-1');

      // 2. Add comment
      const comment = await socialService.addComment({
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great style!'
      });
      expect(comment.content).toBe('Great style!');

      // 3. Reply to comment
      const reply = await socialService.addComment({
        postId: 'post-1',
        userId: 'user-1',
        content: 'Thanks for sharing!',
        parentCommentId: 'comment-1'
      });
      expect(reply.parentCommentId).toBe('comment-1');

      // Verify engagement stats were updated for each action
      expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledTimes(3);
    });

    it('should handle engagement deletion and updates', async () => {
      const { PostLikeModel } = require('../../src/models/PostLike');
      const { PostCommentModel } = require('../../src/models/PostComment');
      const { SocialPostModel } = require('../../src/models/SocialPost');

      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Test comment'
      };

      // Mock the model methods
      PostLikeModel.delete = jest.fn().mockResolvedValue(true);
      PostCommentModel.findById = jest.fn().mockResolvedValue(mockComment);
      PostCommentModel.delete = jest.fn().mockResolvedValue(true);
      SocialPostModel.updateEngagementStats = jest.fn().mockResolvedValue(undefined);

      // 1. Unlike post
      const unlikeResult = await socialService.unlikePost('post-1', 'user-1');

      expect(PostLikeModel.delete).toHaveBeenCalledWith('post-1', 'user-1');
      expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
      expect(unlikeResult).toBe(true);

      // 2. Delete comment
      const deleteResult = await socialService.deleteComment('comment-1', 'user-1');

      expect(PostCommentModel.findById).toHaveBeenCalledWith('comment-1');
      expect(PostCommentModel.delete).toHaveBeenCalledWith('comment-1', 'user-1');
      expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
      expect(deleteResult).toBe(true);
    });
  });

  describe('Search and Discovery', () => {
    it('should search posts with various filters', async () => {
      const { SocialPostModel } = require('../../src/models/SocialPost');

      const mockPost = {
        id: 'post-1',
        userId: 'user-2',
        postType: 'outfit',
        content: {
          title: 'Summer Outfit',
          tags: ['summer', 'casual'],
          imageUrls: ['test.jpg']
        },
        wardrobeItemIds: [],
        visibility: 'public',
        engagementStats: { likes: 5, comments: 2, shares: 0 },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock the model methods
      SocialPostModel.findMany = jest.fn().mockResolvedValue({
        posts: [mockPost],
        total: 1
      });

      const result = await socialService.searchPosts(
        'summer',
        { postType: 'outfit', tags: ['summer', 'casual'] },
        1,
        20
      );

      expect(SocialPostModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'public',
          postType: 'outfit',
          tags: ['summer', 'casual']
        }),
        21,
        0
      );
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].content.tags).toContain('summer');
    });

    it('should get discover feed with trending content', async () => {
      const { SocialPostModel } = require('../../src/models/SocialPost');

      const mockPosts = [
        {
          id: 'post-1',
          userId: 'user-2',
          postType: 'outfit',
          content: { title: 'Trending Look', imageUrls: ['test1.jpg'] },
          wardrobeItemIds: [],
          visibility: 'public',
          engagementStats: { likes: 50, comments: 20, shares: 0 },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'post-2',
          userId: 'user-3',
          postType: 'inspiration',
          content: { title: 'Style Inspiration', imageUrls: ['test2.jpg'] },
          wardrobeItemIds: [],
          visibility: 'public',
          engagementStats: { likes: 30, comments: 10, shares: 0 },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock the model methods
      SocialPostModel.findMany = jest.fn().mockResolvedValue({
        posts: mockPosts,
        total: 2
      });

      const result = await socialService.getFeed({
        userId: 'user-1',
        feedType: 'discover',
        page: 1,
        limit: 20
      });

      expect(SocialPostModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'public'
        }),
        21,
        0
      );
      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].engagementStats.likes).toBe(50);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle wardrobe items validation', async () => {
      const { VUFSItemModel } = require('../../src/models/VUFSItem');

      // Mock user has no items
      VUFSItemModel.findByOwner = jest.fn().mockResolvedValue([]);

      const postData = {
        userId: 'user-1',
        postType: 'outfit' as const,
        content: {
          imageUrls: ['https://example.com/outfit.jpg']
        },
        wardrobeItemIds: ['non-existent-item']
      };

      await expect(socialService.createPost(postData)).rejects.toThrow(
        'Some wardrobe items do not belong to the user or do not exist'
      );
    });

    it('should handle non-existent post retrieval', async () => {
      const { SocialPostModel } = require('../../src/models/SocialPost');

      SocialPostModel.findById = jest.fn().mockResolvedValue(null);

      const result = await socialService.getPostWithDetails('non-existent-post');

      expect(result).toBeNull();
    });

    it('should handle unauthorized comment deletion', async () => {
      const { PostCommentModel } = require('../../src/models/PostComment');

      const mockComment = {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-2', // Different user
        content: 'Test comment'
      };

      PostCommentModel.findById = jest.fn().mockResolvedValue(mockComment);

      await expect(socialService.deleteComment('comment-1', 'user-1')).rejects.toThrow(
        'Not authorized to delete this comment'
      );
    });

    it('should handle empty following list in feed', async () => {
      const { UserFollowModel } = require('../../src/models/UserFollow');

      UserFollowModel.getFollowingIds = jest.fn().mockResolvedValue([]);

      const result = await socialService.getFeed({
        userId: 'user-1',
        feedType: 'following'
      });

      expect(result.posts).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });
});