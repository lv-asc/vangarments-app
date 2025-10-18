import { PostCommentModel, CreatePostCommentData, UpdatePostCommentData } from '../../src/models/PostComment';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('PostCommentModel', () => {
  const mockDbQuery = db.query as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      const commentData: CreatePostCommentData = {
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great outfit! Love the color combination.'
      };

      const mockDbResult = {
        rows: [{
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Great outfit! Love the color combination.',
          parent_comment_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostCommentModel.create(commentData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO post_comments'),
        ['post-1', 'user-1', 'Great outfit! Love the color combination.', null]
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great outfit! Love the color combination.',
        parentCommentId: null
      }));
    });

    it('should create a reply comment successfully', async () => {
      const commentData: CreatePostCommentData = {
        postId: 'post-1',
        userId: 'user-2',
        content: 'Thank you!',
        parentCommentId: 'comment-1'
      };

      const mockDbResult = {
        rows: [{
          id: 'comment-2',
          post_id: 'post-1',
          user_id: 'user-2',
          content: 'Thank you!',
          parent_comment_id: 'comment-1',
          created_at: '2024-01-01T01:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostCommentModel.create(commentData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO post_comments'),
        ['post-1', 'user-2', 'Thank you!', 'comment-1']
      );

      expect(result.parentCommentId).toBe('comment-1');
    });

    it('should trim whitespace from content', async () => {
      const commentData: CreatePostCommentData = {
        postId: 'post-1',
        userId: 'user-1',
        content: '  Great outfit!  '
      };

      const mockDbResult = {
        rows: [{
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Great outfit!',
          parent_comment_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      await PostCommentModel.create(commentData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO post_comments'),
        expect.arrayContaining(['Great outfit!'])
      );
    });

    it('should throw error for empty content', async () => {
      const commentData: CreatePostCommentData = {
        postId: 'post-1',
        userId: 'user-1',
        content: ''
      };

      await expect(PostCommentModel.create(commentData)).rejects.toThrow(
        'Comment content must be between 1 and 500 characters'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should throw error for content too long', async () => {
      const commentData: CreatePostCommentData = {
        postId: 'post-1',
        userId: 'user-1',
        content: 'a'.repeat(501) // 501 characters
      };

      await expect(PostCommentModel.create(commentData)).rejects.toThrow(
        'Comment content must be between 1 and 500 characters'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only content', async () => {
      const commentData: CreatePostCommentData = {
        postId: 'post-1',
        userId: 'user-1',
        content: '   '
      };

      await expect(PostCommentModel.create(commentData)).rejects.toThrow(
        'Comment content must be between 1 and 500 characters'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find comment by ID with user profile', async () => {
      const mockDbResult = {
        rows: [{
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Great outfit!',
          parent_comment_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_profile: { name: 'Test User', username: 'testuser' }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostCommentModel.findById('comment-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT pc.*'),
        ['comment-1']
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'comment-1',
        postId: 'post-1',
        userId: 'user-1',
        content: 'Great outfit!',
        user: {
          id: 'user-1',
          profile: { name: 'Test User', username: 'testuser' }
        }
      }));
    });

    it('should return null when comment not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostCommentModel.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByPostId', () => {
    it('should find top-level comments for a post', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'comment-1',
            post_id: 'post-1',
            user_id: 'user-1',
            content: 'Great outfit!',
            parent_comment_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            user_profile: { name: 'User 1' },
            total: '2'
          },
          {
            id: 'comment-2',
            post_id: 'post-1',
            user_id: 'user-2',
            content: 'Love the style!',
            parent_comment_id: null,
            created_at: '2024-01-01T01:00:00Z',
            updated_at: '2024-01-01T01:00:00Z',
            user_profile: { name: 'User 2' },
            total: '2'
          }
        ]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostCommentModel.findByPostId('post-1', 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pc.post_id = $1 AND pc.parent_comment_id IS NULL'),
        ['post-1', 20, 0]
      );

      expect(result.comments).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.comments[0].id).toBe('comment-1');
      expect(result.comments[1].id).toBe('comment-2');
    });

    it('should return empty result when no comments found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostCommentModel.findByPostId('post-1', 20, 0);

      expect(result.comments).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findReplies', () => {
    it('should find replies to a comment', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'reply-1',
            post_id: 'post-1',
            user_id: 'user-2',
            content: 'Thank you!',
            parent_comment_id: 'comment-1',
            created_at: '2024-01-01T01:00:00Z',
            updated_at: '2024-01-01T01:00:00Z',
            user_profile: { name: 'User 2' },
            total: '1'
          }
        ]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostCommentModel.findReplies('comment-1', 10, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE pc.parent_comment_id = $1'),
        ['comment-1', 10, 0]
      );

      expect(result.comments).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.comments[0].parentCommentId).toBe('comment-1');
    });
  });

  describe('update', () => {
    it('should update comment content', async () => {
      const updateData: UpdatePostCommentData = {
        content: 'Updated comment content'
      };

      const mockDbResult = {
        rows: [{
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Updated comment content',
          parent_comment_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T02:00:00Z'
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await PostCommentModel.update('comment-1', 'user-1', updateData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE post_comments'),
        ['Updated comment content', 'comment-1', 'user-1']
      );

      expect(result?.content).toBe('Updated comment content');
    });

    it('should trim whitespace when updating', async () => {
      const updateData: UpdatePostCommentData = {
        content: '  Updated content  '
      };

      const mockDbResult = {
        rows: [{
          id: 'comment-1',
          post_id: 'post-1',
          user_id: 'user-1',
          content: 'Updated content',
          parent_comment_id: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T02:00:00Z'
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      await PostCommentModel.update('comment-1', 'user-1', updateData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE post_comments'),
        expect.arrayContaining(['Updated content'])
      );
    });

    it('should throw error for empty content', async () => {
      const updateData: UpdatePostCommentData = {
        content: ''
      };

      await expect(PostCommentModel.update('comment-1', 'user-1', updateData)).rejects.toThrow(
        'Comment content must be between 1 and 500 characters'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should throw error for content too long', async () => {
      const updateData: UpdatePostCommentData = {
        content: 'a'.repeat(501)
      };

      await expect(PostCommentModel.update('comment-1', 'user-1', updateData)).rejects.toThrow(
        'Comment content must be between 1 and 500 characters'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should return null when comment not found or user not authorized', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await PostCommentModel.update('comment-1', 'user-1', {
        content: 'Updated content'
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete comment successfully', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const result = await PostCommentModel.delete('comment-1', 'user-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'DELETE FROM post_comments WHERE id = $1 AND user_id = $2',
        ['comment-1', 'user-1']
      );
      expect(result).toBe(true);
    });

    it('should return false when comment not found or user not authorized', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await PostCommentModel.delete('comment-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getCommentCount', () => {
    it('should get comment count for a post', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{ count: 8 }]
      });

      const result = await PostCommentModel.getCommentCount('post-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT COUNT(*)::int as count FROM post_comments WHERE post_id = $1',
        ['post-1']
      );
      expect(result).toBe(8);
    });

    it('should return 0 when no comments found', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{ count: null }]
      });

      const result = await PostCommentModel.getCommentCount('post-1');

      expect(result).toBe(0);
    });
  });
});