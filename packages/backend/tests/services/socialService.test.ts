import { SocialService } from '../../src/services/socialService';
import { SocialPostModel } from '../../src/models/SocialPost';
import { UserFollowModel } from '../../src/models/UserFollow';
import { PostCommentModel } from '../../src/models/PostComment';
import { PostLikeModel } from '../../src/models/PostLike';
import { VUFSItemModel } from '../../src/models/VUFSItem';

// Mock all the models
jest.mock('../../src/models/SocialPost');
jest.mock('../../src/models/UserFollow');
jest.mock('../../src/models/PostComment');
jest.mock('../../src/models/PostLike');
jest.mock('../../src/models/VUFSItem');

describe('SocialService', () => {
  let socialService: SocialService;
  
  const mockUser1 = {
    id: 'user-1',
    profile: {
      name: 'Test User 1',
      username: 'testuser1',
      bio: 'Fashion enthusiast',
      profilePicture: 'https://example.com/profile1.jpg'
    }
  };

  const mockUser2 = {
    id: 'user-2',
    profile: {
      name: 'Test User 2',
      username: 'testuser2',
      bio: 'Style blogger',
      profilePicture: 'https://example.com/profile2.jpg'
    }
  };

  const mockPost = {
    id: 'post-1',
    userId: 'user-1',
    postType: 'outfit' as const,
    content: {
      title: 'My favorite outfit',
      description: 'Perfect for summer days',
      imageUrls: ['https://example.com/outfit1.jpg'],
      tags: ['summer', 'casual']
    },
    wardrobeItemIds: ['item-1', 'item-2'],
    engagementStats: {
      likes: 5,
      comments: 2,
      shares: 1
    },
    visibility: 'public' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockVUFSItem = {
    id: 'item-1',
    vufsCode: 'VUFS-001',
    ownerId: 'user-1',
    categoryHierarchy: {
      page: 'Clothing',
      blueSubcategory: 'Tops',
      whiteSubcategory: 'T-Shirts',
      graySubcategory: 'Basic'
    },
    brandHierarchy: {
      brand: 'Nike',
      line: 'Sportswear'
    },
    metadata: {
      name: 'Basic T-Shirt',
      composition: [{ name: 'Cotton', percentage: 100 }],
      colors: [{ name: 'White', hex: '#FFFFFF' }],
      careInstructions: ['Machine wash cold']
    },
    images: [{
      id: 'img-1',
      url: 'https://example.com/item1.jpg',
      type: 'front' as const,
      isPrimary: true,
      processingStatus: 'completed' as const
    }],
    conditionInfo: {
      status: 'used_excellent' as const,
      description: 'Great condition'
    },
    visibilitySettings: {
      public: true,
      marketplace: true,
      social: true
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    socialService = new SocialService();
    jest.clearAllMocks();
  });

  describe('Content Sharing Functionality', () => {
    describe('createPost', () => {
      it('should create a post successfully with valid data', async () => {
        const postData = {
          userId: 'user-1',
          postType: 'outfit' as const,
          content: {
            title: 'Summer Look',
            description: 'Perfect for beach days',
            imageUrls: ['https://example.com/outfit.jpg'],
            tags: ['summer', 'beach']
          },
          wardrobeItemIds: ['item-1'],
          visibility: 'public' as const
        };

        (VUFSItemModel.findByOwner as jest.Mock).mockResolvedValue([mockVUFSItem]);
        (SocialPostModel.create as jest.Mock).mockResolvedValue(mockPost);
        (SocialPostModel.findById as jest.Mock).mockResolvedValue(mockPost);
        (PostCommentModel.findByPostId as jest.Mock).mockResolvedValue({ comments: [], total: 0 });
        (PostLikeModel.findByPostId as jest.Mock).mockResolvedValue({ likes: [], total: 0 });

        const result = await socialService.createPost(postData);

        expect(VUFSItemModel.findByOwner).toHaveBeenCalledWith('user-1');
        expect(SocialPostModel.create).toHaveBeenCalledWith(postData);
        expect(result).toEqual(expect.objectContaining({
          id: 'post-1',
          userId: 'user-1',
          postType: 'outfit'
        }));
      });

      it('should throw error when wardrobe items do not belong to user', async () => {
        const postData = {
          userId: 'user-1',
          postType: 'outfit' as const,
          content: {
            imageUrls: ['https://example.com/outfit.jpg']
          },
          wardrobeItemIds: ['item-999'] // Non-existent item
        };

        (VUFSItemModel.findByOwner as jest.Mock).mockResolvedValue([mockVUFSItem]);

        await expect(socialService.createPost(postData)).rejects.toThrow(
          'Some wardrobe items do not belong to the user or do not exist'
        );
      });

      it('should create post without wardrobe items', async () => {
        const postData = {
          userId: 'user-1',
          postType: 'inspiration' as const,
          content: {
            title: 'Style Inspiration',
            imageUrls: ['https://example.com/inspiration.jpg']
          }
        };

        (SocialPostModel.create as jest.Mock).mockResolvedValue(mockPost);
        (SocialPostModel.findById as jest.Mock).mockResolvedValue(mockPost);
        (PostCommentModel.findByPostId as jest.Mock).mockResolvedValue({ comments: [], total: 0 });
        (PostLikeModel.findByPostId as jest.Mock).mockResolvedValue({ likes: [], total: 0 });

        const result = await socialService.createPost(postData);

        expect(VUFSItemModel.findByOwner).not.toHaveBeenCalled();
        expect(SocialPostModel.create).toHaveBeenCalledWith(postData);
        expect(result).toBeDefined();
      });
    });

    describe('getPostWithDetails', () => {
      it('should return post with comments and likes', async () => {
        const mockComment = {
          id: 'comment-1',
          postId: 'post-1',
          userId: 'user-2',
          content: 'Great outfit!',
          createdAt: '2024-01-01T01:00:00Z',
          updatedAt: '2024-01-01T01:00:00Z'
        };

        const mockLike = {
          id: 'like-1',
          postId: 'post-1',
          userId: 'user-2',
          createdAt: '2024-01-01T01:00:00Z'
        };

        (SocialPostModel.findById as jest.Mock).mockResolvedValue(mockPost);
        (PostCommentModel.findByPostId as jest.Mock).mockResolvedValue({ 
          comments: [mockComment], 
          total: 1 
        });
        (PostLikeModel.findByPostId as jest.Mock).mockResolvedValue({ 
          likes: [mockLike], 
          total: 1 
        });

        const result = await socialService.getPostWithDetails('post-1');

        expect(result).toEqual(expect.objectContaining({
          ...mockPost,
          comments: [mockComment],
          likes: [mockLike]
        }));
      });

      it('should return null for non-existent post', async () => {
        (SocialPostModel.findById as jest.Mock).mockResolvedValue(null);

        const result = await socialService.getPostWithDetails('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('searchPosts', () => {
      it('should search posts with filters', async () => {
        const mockPosts = [mockPost];
        (SocialPostModel.findMany as jest.Mock).mockResolvedValue({ 
          posts: mockPosts, 
          total: 1 
        });

        const result = await socialService.searchPosts('summer', {
          postType: 'outfit',
          tags: ['summer']
        });

        expect(SocialPostModel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            visibility: 'public',
            postType: 'outfit',
            tags: ['summer']
          }),
          21, // limit + 1
          0   // offset
        );
        expect(result.posts).toEqual(mockPosts);
        expect(result.hasMore).toBe(false);
      });

      it('should handle pagination correctly', async () => {
        const mockPosts = Array(21).fill(mockPost); // More than limit (21 > 20)
        (SocialPostModel.findMany as jest.Mock).mockResolvedValue({ 
          posts: mockPosts, 
          total: 21 
        });

        const result = await socialService.searchPosts('', {}, 1, 20);

        expect(result.posts).toHaveLength(20); // Should remove the extra post
        expect(result.hasMore).toBe(true);
      });
    });
  });

  describe('User Following and Feed Generation', () => {
    describe('followUser', () => {
      it('should follow user successfully', async () => {
        const mockFollow = {
          id: 'follow-1',
          followerId: 'user-1',
          followingId: 'user-2',
          createdAt: '2024-01-01T00:00:00Z'
        };

        (UserFollowModel.create as jest.Mock).mockResolvedValue(mockFollow);

        const result = await socialService.followUser('user-1', 'user-2');

        expect(UserFollowModel.create).toHaveBeenCalledWith({
          followerId: 'user-1',
          followingId: 'user-2'
        });
        expect(result).toEqual(mockFollow);
      });
    });

    describe('unfollowUser', () => {
      it('should unfollow user successfully', async () => {
        (UserFollowModel.delete as jest.Mock).mockResolvedValue(true);

        const result = await socialService.unfollowUser('user-1', 'user-2');

        expect(UserFollowModel.delete).toHaveBeenCalledWith('user-1', 'user-2');
        expect(result).toBe(true);
      });
    });

    describe('getFeed', () => {
      it('should get following feed for user', async () => {
        const mockPosts = [mockPost];
        (UserFollowModel.getFollowingIds as jest.Mock).mockResolvedValue(['user-2', 'user-3']);
        (SocialPostModel.findMany as jest.Mock).mockResolvedValue({ 
          posts: mockPosts, 
          total: 1 
        });

        const result = await socialService.getFeed({
          userId: 'user-1',
          feedType: 'following',
          page: 1,
          limit: 20
        });

        expect(UserFollowModel.getFollowingIds).toHaveBeenCalledWith('user-1');
        expect(SocialPostModel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            followingIds: ['user-2', 'user-3'],
            visibility: 'public'
          }),
          21,
          0
        );
        expect(result.posts).toEqual(mockPosts);
        expect(result.hasMore).toBe(false);
      });

      it('should return empty feed when user follows no one', async () => {
        (UserFollowModel.getFollowingIds as jest.Mock).mockResolvedValue([]);

        const result = await socialService.getFeed({
          userId: 'user-1',
          feedType: 'following'
        });

        expect(result.posts).toEqual([]);
        expect(result.hasMore).toBe(false);
      });

      it('should get personal feed for user', async () => {
        const mockPosts = [mockPost];
        (SocialPostModel.findMany as jest.Mock).mockResolvedValue({ 
          posts: mockPosts, 
          total: 1 
        });

        const result = await socialService.getFeed({
          userId: 'user-1',
          feedType: 'personal'
        });

        expect(SocialPostModel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1'
          }),
          21,
          0
        );
        expect(result.posts).toEqual(mockPosts);
      });

      it('should get discover feed with public posts', async () => {
        const mockPosts = [mockPost];
        (SocialPostModel.findMany as jest.Mock).mockResolvedValue({ 
          posts: mockPosts, 
          total: 1 
        });

        const result = await socialService.getFeed({
          userId: 'user-1',
          feedType: 'discover'
        });

        expect(SocialPostModel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            visibility: 'public'
          }),
          21,
          0
        );
        expect(result.posts).toEqual(mockPosts);
      });
    });

    describe('getFollowers', () => {
      it('should get user followers with pagination', async () => {
        const mockUsers = [mockUser1, mockUser2];
        (UserFollowModel.getFollowers as jest.Mock).mockResolvedValue({ 
          users: mockUsers, 
          total: 2 
        });

        const result = await socialService.getFollowers('user-1', 1, 20);

        expect(UserFollowModel.getFollowers).toHaveBeenCalledWith('user-1', 21, 0);
        expect(result.users).toEqual(mockUsers);
        expect(result.hasMore).toBe(false);
      });
    });

    describe('getFollowing', () => {
      it('should get users that user is following', async () => {
        const mockUsers = [mockUser2];
        (UserFollowModel.getFollowing as jest.Mock).mockResolvedValue({ 
          users: mockUsers, 
          total: 1 
        });

        const result = await socialService.getFollowing('user-1', 1, 20);

        expect(UserFollowModel.getFollowing).toHaveBeenCalledWith('user-1', 21, 0);
        expect(result.users).toEqual(mockUsers);
        expect(result.hasMore).toBe(false);
      });
    });

    describe('isFollowing', () => {
      it('should check if user is following another user', async () => {
        (UserFollowModel.isFollowing as jest.Mock).mockResolvedValue(true);

        const result = await socialService.isFollowing('user-1', 'user-2');

        expect(UserFollowModel.isFollowing).toHaveBeenCalledWith('user-1', 'user-2');
        expect(result).toBe(true);
      });
    });
  });

  describe('Engagement Features (Likes, Comments, Shares)', () => {
    describe('likePost', () => {
      it('should like post successfully', async () => {
        const mockLike = {
          id: 'like-1',
          postId: 'post-1',
          userId: 'user-1',
          createdAt: '2024-01-01T00:00:00Z'
        };

        (PostLikeModel.create as jest.Mock).mockResolvedValue(mockLike);
        (SocialPostModel.updateEngagementStats as jest.Mock).mockResolvedValue(undefined);

        const result = await socialService.likePost('post-1', 'user-1');

        expect(PostLikeModel.create).toHaveBeenCalledWith({
          postId: 'post-1',
          userId: 'user-1'
        });
        expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
        expect(result).toEqual(mockLike);
      });
    });

    describe('unlikePost', () => {
      it('should unlike post successfully', async () => {
        (PostLikeModel.delete as jest.Mock).mockResolvedValue(true);
        (SocialPostModel.updateEngagementStats as jest.Mock).mockResolvedValue(undefined);

        const result = await socialService.unlikePost('post-1', 'user-1');

        expect(PostLikeModel.delete).toHaveBeenCalledWith('post-1', 'user-1');
        expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
        expect(result).toBe(true);
      });

      it('should not update engagement stats if unlike fails', async () => {
        (PostLikeModel.delete as jest.Mock).mockResolvedValue(false);

        const result = await socialService.unlikePost('post-1', 'user-1');

        expect(PostLikeModel.delete).toHaveBeenCalledWith('post-1', 'user-1');
        expect(SocialPostModel.updateEngagementStats).not.toHaveBeenCalled();
        expect(result).toBe(false);
      });
    });

    describe('addComment', () => {
      it('should add comment successfully', async () => {
        const commentData = {
          postId: 'post-1',
          userId: 'user-1',
          content: 'Great outfit!'
        };

        const mockComment = {
          id: 'comment-1',
          ...commentData,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        (PostCommentModel.create as jest.Mock).mockResolvedValue(mockComment);
        (SocialPostModel.updateEngagementStats as jest.Mock).mockResolvedValue(undefined);

        const result = await socialService.addComment(commentData);

        expect(PostCommentModel.create).toHaveBeenCalledWith(commentData);
        expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
        expect(result).toEqual(mockComment);
      });

      it('should add reply comment successfully', async () => {
        const commentData = {
          postId: 'post-1',
          userId: 'user-1',
          content: 'Thanks!',
          parentCommentId: 'comment-1'
        };

        const mockComment = {
          id: 'comment-2',
          ...commentData,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        (PostCommentModel.create as jest.Mock).mockResolvedValue(mockComment);
        (SocialPostModel.updateEngagementStats as jest.Mock).mockResolvedValue(undefined);

        const result = await socialService.addComment(commentData);

        expect(PostCommentModel.create).toHaveBeenCalledWith(commentData);
        expect(result.parentCommentId).toBe('comment-1');
      });
    });

    describe('deleteComment', () => {
      it('should delete comment successfully', async () => {
        const mockComment = {
          id: 'comment-1',
          postId: 'post-1',
          userId: 'user-1',
          content: 'Great outfit!',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        (PostCommentModel.findById as jest.Mock).mockResolvedValue(mockComment);
        (PostCommentModel.delete as jest.Mock).mockResolvedValue(true);
        (SocialPostModel.updateEngagementStats as jest.Mock).mockResolvedValue(undefined);

        const result = await socialService.deleteComment('comment-1', 'user-1');

        expect(PostCommentModel.findById).toHaveBeenCalledWith('comment-1');
        expect(PostCommentModel.delete).toHaveBeenCalledWith('comment-1', 'user-1');
        expect(SocialPostModel.updateEngagementStats).toHaveBeenCalledWith('post-1');
        expect(result).toBe(true);
      });

      it('should throw error when comment not found', async () => {
        (PostCommentModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(socialService.deleteComment('comment-1', 'user-1')).rejects.toThrow(
          'Comment not found'
        );
      });

      it('should throw error when user not authorized to delete comment', async () => {
        const mockComment = {
          id: 'comment-1',
          postId: 'post-1',
          userId: 'user-2', // Different user
          content: 'Great outfit!',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        };

        (PostCommentModel.findById as jest.Mock).mockResolvedValue(mockComment);

        await expect(socialService.deleteComment('comment-1', 'user-1')).rejects.toThrow(
          'Not authorized to delete this comment'
        );
      });
    });

    describe('getUserSocialStats', () => {
      it('should get user social statistics', async () => {
        (SocialPostModel.findMany as jest.Mock).mockResolvedValue({ 
          posts: [], 
          total: 5 
        });
        (UserFollowModel.getFollowCounts as jest.Mock).mockResolvedValue({
          followersCount: 10,
          followingCount: 15
        });

        const result = await socialService.getUserSocialStats('user-1');

        expect(result).toEqual({
          postsCount: 5,
          followersCount: 10,
          followingCount: 15
        });
      });
    });
  });

  describe('Wardrobe Integration', () => {
    describe('getUserWardrobe', () => {
      it('should get user wardrobe items', async () => {
        const mockItems = [mockVUFSItem];
        (VUFSItemModel.findByOwner as jest.Mock).mockResolvedValue(mockItems);

        const result = await socialService.getUserWardrobe('user-1');

        expect(VUFSItemModel.findByOwner).toHaveBeenCalledWith('user-1', {});
        expect(result).toEqual(mockItems);
      });

      it('should get user wardrobe items by category', async () => {
        const mockItems = [mockVUFSItem];
        (VUFSItemModel.findByOwner as jest.Mock).mockResolvedValue(mockItems);

        const result = await socialService.getUserWardrobe('user-1', 'Clothing');

        expect(VUFSItemModel.findByOwner).toHaveBeenCalledWith('user-1', {
          category: { page: 'Clothing' }
        });
        expect(result).toEqual(mockItems);
      });
    });
  });
});