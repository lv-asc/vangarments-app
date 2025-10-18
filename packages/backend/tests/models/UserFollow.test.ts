import { UserFollowModel, CreateUserFollowData } from '../../src/models/UserFollow';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

describe('UserFollowModel', () => {
  const mockDbQuery = db.query as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a follow relationship successfully', async () => {
      const followData: CreateUserFollowData = {
        followerId: 'user-1',
        followingId: 'user-2'
      };

      const mockDbResult = {
        rows: [{
          id: 'follow-1',
          follower_id: 'user-1',
          following_id: 'user-2',
          created_at: '2024-01-01T00:00:00Z'
        }]
      };

      // Mock findByIds to return null (not already following)
      mockDbQuery
        .mockResolvedValueOnce({ rows: [] }) // findByIds
        .mockResolvedValueOnce(mockDbResult); // create

      const result = await UserFollowModel.create(followData);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_follows'),
        ['user-1', 'user-2']
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'follow-1',
        followerId: 'user-1',
        followingId: 'user-2'
      }));
    });

    it('should throw error when user tries to follow themselves', async () => {
      const followData: CreateUserFollowData = {
        followerId: 'user-1',
        followingId: 'user-1'
      };

      await expect(UserFollowModel.create(followData)).rejects.toThrow(
        'Users cannot follow themselves'
      );

      expect(mockDbQuery).not.toHaveBeenCalled();
    });

    it('should throw error when already following', async () => {
      const followData: CreateUserFollowData = {
        followerId: 'user-1',
        followingId: 'user-2'
      };

      // Mock findByIds to return existing follow
      mockDbQuery.mockResolvedValueOnce({
        rows: [{
          id: 'follow-1',
          follower_id: 'user-1',
          following_id: 'user-2',
          created_at: '2024-01-01T00:00:00Z'
        }]
      });

      await expect(UserFollowModel.create(followData)).rejects.toThrow(
        'Already following this user'
      );

      // Should not call INSERT
      expect(mockDbQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByIds', () => {
    it('should find follow relationship by IDs', async () => {
      const mockDbResult = {
        rows: [{
          id: 'follow-1',
          follower_id: 'user-1',
          following_id: 'user-2',
          created_at: '2024-01-01T00:00:00Z',
          follower_profile: { name: 'Follower User', username: 'follower' },
          following_profile: { name: 'Following User', username: 'following' }
        }]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await UserFollowModel.findByIds('user-1', 'user-2');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT uf.*'),
        ['user-1', 'user-2']
      );

      expect(result).toEqual(expect.objectContaining({
        id: 'follow-1',
        followerId: 'user-1',
        followingId: 'user-2',
        follower: {
          id: 'user-1',
          profile: { name: 'Follower User', username: 'follower' }
        },
        following: {
          id: 'user-2',
          profile: { name: 'Following User', username: 'following' }
        }
      }));
    });

    it('should return null when follow relationship not found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await UserFollowModel.findByIds('user-1', 'user-2');

      expect(result).toBeNull();
    });
  });

  describe('getFollowers', () => {
    it('should get followers for a user with pagination', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'user-1',
            profile: { name: 'Follower 1', username: 'follower1' },
            total: '2'
          },
          {
            id: 'user-2',
            profile: { name: 'Follower 2', username: 'follower2' },
            total: '2'
          }
        ]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await UserFollowModel.getFollowers('user-3', 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE uf.following_id = $1'),
        ['user-3', 20, 0]
      );

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.users[0]).toEqual({
        id: 'user-1',
        profile: { name: 'Follower 1', username: 'follower1' }
      });
    });

    it('should return empty result when no followers found', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await UserFollowModel.getFollowers('user-1', 20, 0);

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getFollowing', () => {
    it('should get users that a user is following', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'user-2',
            profile: { name: 'Following 1', username: 'following1' },
            total: '3'
          },
          {
            id: 'user-3',
            profile: { name: 'Following 2', username: 'following2' },
            total: '3'
          },
          {
            id: 'user-4',
            profile: { name: 'Following 3', username: 'following3' },
            total: '3'
          }
        ]
      };

      mockDbQuery.mockResolvedValue(mockDbResult);

      const result = await UserFollowModel.getFollowing('user-1', 20, 0);

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE uf.follower_id = $1'),
        ['user-1', 20, 0]
      );

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.users[0]).toEqual({
        id: 'user-2',
        profile: { name: 'Following 1', username: 'following1' }
      });
    });

    it('should return empty result when user follows no one', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await UserFollowModel.getFollowing('user-1', 20, 0);

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete follow relationship successfully', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 1 });

      const result = await UserFollowModel.delete('user-1', 'user-2');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
        ['user-1', 'user-2']
      );
      expect(result).toBe(true);
    });

    it('should return false when follow relationship not found', async () => {
      mockDbQuery.mockResolvedValue({ rowCount: 0 });

      const result = await UserFollowModel.delete('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('isFollowing', () => {
    it('should return true when user is following another user', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{ '?column?': 1 }]
      });

      const result = await UserFollowModel.isFollowing('user-1', 'user-2');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
        ['user-1', 'user-2']
      );
      expect(result).toBe(true);
    });

    it('should return false when user is not following another user', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await UserFollowModel.isFollowing('user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('getFollowCounts', () => {
    it('should get follower and following counts for a user', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{
          followers_count: 25,
          following_count: 15
        }]
      });

      const result = await UserFollowModel.getFollowCounts('user-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['user-1']
      );

      expect(result).toEqual({
        followersCount: 25,
        followingCount: 15
      });
    });

    it('should return zero counts when user has no follows', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [{
          followers_count: null,
          following_count: null
        }]
      });

      const result = await UserFollowModel.getFollowCounts('user-1');

      expect(result).toEqual({
        followersCount: 0,
        followingCount: 0
      });
    });
  });

  describe('getFollowingIds', () => {
    it('should get IDs of users that a user is following', async () => {
      mockDbQuery.mockResolvedValue({
        rows: [
          { following_id: 'user-2' },
          { following_id: 'user-3' },
          { following_id: 'user-4' }
        ]
      });

      const result = await UserFollowModel.getFollowingIds('user-1');

      expect(mockDbQuery).toHaveBeenCalledWith(
        'SELECT following_id FROM user_follows WHERE follower_id = $1',
        ['user-1']
      );

      expect(result).toEqual(['user-2', 'user-3', 'user-4']);
    });

    it('should return empty array when user follows no one', async () => {
      mockDbQuery.mockResolvedValue({ rows: [] });

      const result = await UserFollowModel.getFollowingIds('user-1');

      expect(result).toEqual([]);
    });
  });
});