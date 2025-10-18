import { SocialPostModel, CreateSocialPostData, UpdateSocialPostData } from '../../src/models/SocialPost';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('SocialPostModel', () => {
  const mockDbQuery = db.query as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a social post successfully', async () => {
      const postData: CreateSocialPostData = {
        userId: 'user-1',
        postType: 'outfit',
        content: {
          title: 'Summer Look',
          description: 'Perfect for beach days',
          imageUrls: ['https://example.com/outfit.jpg'],
          tags: ['summer', 'beach']
        },
        wardrobeItemIds: ['item-1', 'item-2'],
        visibility: 'public'
      };

      const mockDbResult = {
        rows: [{
          id: 'post-1',
          user_id: 'user-1',
          post_type: 'outfit',
          content: postData.content,
          wardrobe_item_ids: ['item-1', 'item-2'],
          visibility: 'public',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          engagement_stats: { likes: 0, comments: 0, shares: 0 }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await SocialPostModel.create(postData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO social_posts'),
        [
          'user-1',
          'outfit',
          JSON.stringify(postData.content),
          ['item-1', 'item-2'],
          'public'
        ]
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'post-1',
        userId: 'user-1',
        postType: 'outfit',
        content: postData.content,
        wardrobeItemIds: ['item-1', 'item-2'],
        visibility: 'public'
      }));
    });

    it('should throw error when content has no image URLs', async () => {
      const postData: CreateSocialPostData = {
        userId: 'user-1',
        postType: 'outfit',
        content: {
          title: 'No Images',
          imageUrls: []
        }
      };

      await expect(SocialPostModel.create(postData)).rejects.toThrow(
        'Content must include at least one image URL'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should create post with default values', async () => {
      const postData: CreateSocialPostData = {
        userId: 'user-1',
        postType: 'inspiration',
        content: {
          imageUrls: ['https://example.com/inspiration.jpg']
        }
      };

      const mockDbResult = {
        rows: [{
          id: 'post-2',
          user_id: 'user-1',
          post_type: 'inspiration',
          content: postData.content,
          wardrobe_item_ids: [],
          visibility: 'public',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          engagement_stats: { likes: 0, comments: 0, shares: 0 }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await SocialPostModel.create(postData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO social_posts'),
        [
          'user-1',
          'inspiration',
          JSON.stringify(postData.content),
          [],
          'public'
        ]
      );

      expect(result.wardrobeItemIds).toEqual([]);
      expect(result.visibility).toBe('public');
    });
  });

  describe('findById', () => {
    it('should find post by ID with engagement stats', async () => {
      const mockDbResult = {
        rows: [{
          id: 'post-1',
          user_id: 'user-1',
          post_type: 'outfit',
          content: { title: 'Test Post', imageUrls: ['test.jpg'] },
          wardrobe_item_ids: ['item-1'],
          visibility: 'public',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_profile: { name: 'Test User' },
          likes_count: 5,
          comments_count: 3,
          engagement_stats: { likes: 5, comments: 3, shares: 0 }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await SocialPostModel.findById('post-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT sp.*'),
        ['post-1']
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'post-1',
        userId: 'user-1',
        engagementStats: {
          likes: 5,
          comments: 3,
          shares: 0
        },
        user: {
          id: 'user-1',
          profile: { name: 'Test User' }
        }
      }));
    });

    it('should return null when post not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await SocialPostModel.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find posts with filters', async () => {
      const mockDbResult = {
        rows: [{
          id: 'post-1',
          user_id: 'user-1',
          post_type: 'outfit',
          content: { title: 'Test Post', imageUrls: ['test.jpg'] },
          wardrobe_item_ids: [],
          visibility: 'public',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          likes_count: 0,
          comments_count: 0
        }]
      };

      const countResult = {
        rows: [{ total: 1 }]
      };

      mockDbQuery
        .mockResolvedValueOnce(mockDbResult)
        .mockResolvedValueOnce(countResult);

      const filters = {
        userId: 'user-1',
        postType: 'outfit' as const,
        visibility: 'public' as const
      };

      const result = await SocialPostModel.findMany(filters, 20, 0);

      expect(result.posts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.posts[0].id).toBe('post-1');
    });

    it('should handle following IDs filter', async () => {
      const mockDbResult = { rows: [] };
      const countResult = { rows: [{ total: 0 }] };

      mockDbQuery
        .mockResolvedValueOnce(mockDbResult)
        .mockResolvedValueOnce(countResult);

      const filters = {
        followingIds: ['user-2', 'user-3']
      };

      await SocialPostModel.findMany(filters, 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('sp.user_id = ANY($1)'),
        expect.arrayContaining([['user-2', 'user-3']])
      );
    });

    it('should handle tags filter', async () => {
      const mockDbResult = { rows: [] };
      const countResult = { rows: [{ total: 0 }] };

      mockDbQuery
        .mockResolvedValueOnce(mockDbResult)
        .mockResolvedValueOnce(countResult);

      const filters = {
        tags: ['summer', 'casual']
      };

      await SocialPostModel.findMany(filters, 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('sp.content->>\'tags\' ?|'),
        expect.arrayContaining([['summer', 'casual']])
      );
    });
  });

  describe('update', () => {
    it('should update post content', async () => {
      const updateData: UpdateSocialPostData = {
        content: {
          title: 'Updated Title',
          description: 'Updated description',
          imageUrls: ['https://example.com/updated.jpg']
        }
      };

      const mockDbResult = {
        rows: [{
          id: 'post-1',
          user_id: 'user-1',
          post_type: 'outfit',
          content: updateData.content,
          wardrobe_item_ids: [],
          visibility: 'public',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          engagement_stats: { likes: 0, comments: 0, shares: 0 }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await SocialPostModel.update('post-1', updateData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE social_posts'),
        [JSON.stringify(updateData.content), 'post-1']
      );

      expect(result?.content).toEqual(updateData.content);
    });

    it('should update post visibility', async () => {
      const updateData: UpdateSocialPostData = {
        visibility: 'private'
      };

      const mockDbResult = {
        rows: [{
          id: 'post-1',
          user_id: 'user-1',
          post_type: 'outfit',
          content: { imageUrls: ['test.jpg'] },
          wardrobe_item_ids: [],
          visibility: 'private',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T01:00:00Z',
          engagement_stats: { likes: 0, comments: 0, shares: 0 }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await SocialPostModel.update('post-1', updateData);

      expect(result?.visibility).toBe('private');
    });

    it('should throw error when no fields to update', async () => {
      await expect(SocialPostModel.update('post-1', {})).rejects.toThrow(
        'No fields to update'
      );
    });

    it('should return null when post not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await SocialPostModel.update('non-existent', {
        visibility: 'private'
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete post successfully', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const result = await SocialPostModel.delete('post-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'DELETE FROM social_posts WHERE id = $1',
        ['post-1']
      );
      expect(result).toBe(true);
    });

    it('should return false when post not found', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await SocialPostModel.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('updateEngagementStats', () => {
    it('should update engagement statistics', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      await SocialPostModel.updateEngagementStats('post-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE social_posts'),
        ['post-1']
      );
    });
  });
});