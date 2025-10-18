import { PostLikeModel, CreatePostLikeData } from '../../src/models/PostLike';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('PostLikeModel', () => {
  const mockDbQuery = db.query as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a like successfully', async () => {
      const likeData: CreatePostLikeData = {
        postId: 'post-1',
        userId: 'user-1'
      };

      const mockDbResult = {
        rows: [{
          id: 'like-1',
          post_id: 'post-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z'
        }]
      };

      // Mock findByIds to return null (not already liked)
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // findByIds
        .mockResolvedValueOnce(mockDbResult); // create

      const result = await PostLikeModel.create(likeData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO post_likes'),
        ['post-1', 'user-1']
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'like-1',
        postId: 'post-1',
        userId: 'user-1'
      }));
    });

    it('should throw error when post already liked', async () => {
      const likeData: CreatePostLikeData = {
        postId: 'post-1',
        userId: 'user-1'
      };

      // Mock findByIds to return existing like
      mockDbQuery.mockResolvedValueOnce({
        rows: [{
          id: 'like-1',
          post_id: 'post-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z'
        }]
      });

      await expect(PostLikeModel.create(likeData)).rejects.toThrow(
        'Post already liked'
      );

      // Should not call INSERT
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByIds', () => {
    it('should find like by post and user IDs', async () => {
      const mockDbResult = {
        rows: [{
          id: 'like-1',
          post_id: 'post-1',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          user_profile: { name: 'Test User' }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostLikeModel.findByIds('post-1', 'user-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT pl.*'),
        ['post-1', 'user-1']
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'like-1',
        postId: 'post-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          profile: { name: 'Test User' }
        }
      }));
    });

    it('should return null when like not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostLikeModel.findByIds('post-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('findByPostId', () => {
    it('should find likes for a post with pagination', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'like-1',
            post_id: 'post-1',
            user_id: 'user-1',
            created_at: '2024-01-01T00:00:00Z',
            user_profile: { name: 'User 1' },
            total: '2'
          },
          {
            id: 'like-2',
            post_id: 'post-1',
            user_id: 'user-2',
            created_at: '2024-01-01T01:00:00Z',
            user_profile: { name: 'User 2' },
            total: '2'
          }
        ]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostLikeModel.findByPostId('post-1', 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT pl.*'),
        ['post-1', 20, 0]
      );

      expect(result.likes).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.likes[0].id).toBe('like-1');
      expect(result.likes[1].id).toBe('like-2');
    });

    it('should return empty result when no likes found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostLikeModel.findByPostId('post-1', 20, 0);

      expect(result.likes).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete like successfully', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const result = await PostLikeModel.delete('post-1', 'user-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
        ['post-1', 'user-1']
      );
      expect(result).toBe(true);
    });

    it('should return false when like not found', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await PostLikeModel.delete('post-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getLikeCount', () => {
    it('should get like count for a post', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{ count: 5 }]
      });

      const result = await PostLikeModel.getLikeCount('post-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*)::int as count FROM post_likes WHERE post_id = $1',
        ['post-1']
      );
      expect(result).toBe(5);
    });

    it('should return 0 when no likes found', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{ count: null }]
      });

      const result = await PostLikeModel.getLikeCount('post-1');

      expect(result).toBe(0);
    });
  });

  describe('hasUserLiked', () => {
    it('should return true when user has liked post', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{ '?column?': 1 }]
      });

      const result = await PostLikeModel.hasUserLiked('post-1', 'user-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2',
        ['post-1', 'user-1']
      );
      expect(result).toBe(true);
    });

    it('should return false when user has not liked post', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostLikeModel.hasUserLiked('post-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserLikedPosts', () => {
    it('should get posts liked by user with pagination', async () => {
      const mockDbResult = {
        rows: [
          {
            post_id: 'post-1',
            total: '3'
          },
          {
            post_id: 'post-2',
            total: '3'
          },
          {
            post_id: 'post-3',
            total: '3'
          }
        ]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostLikeModel.getUserLikedPosts('user-1', 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT pl.post_id'),
        ['user-1', 20, 0]
      );

      expect(result.postIds).toEqual(['post-1', 'post-2', 'post-3']);
      expect(result.total).toBe(3);
    });

    it('should return empty result when user has not liked any posts', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostLikeModel.getUserLikedPosts('user-1', 20, 0);

      expect(result.postIds).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});