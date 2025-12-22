import request from 'supertest';
import { app } from '../../src/index';
import { db } from '../../src/database/connection';
import { UserModel } from '../../src/models/User';
import { VUFSItemModel } from '../../src/models/VUFSItem';
import { SocialPostModel } from '../../src/models/SocialPost';
import { UserFollowModel } from '../../src/models/UserFollow';
import { PostLikeModel } from '../../src/models/PostLike';
import { PostCommentModel } from '../../src/models/PostComment';

describe.skip('Social Platform Functionality - Task 7.1 & 7.2', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let authToken1: string;
  let authToken2: string;
  let authToken3: string;
  let testWardrobeItem: any;
  let testPost: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM post_comments WHERE 1=1');
    await db.query('DELETE FROM post_likes WHERE 1=1');
    await db.query('DELETE FROM social_posts WHERE 1=1');
    await db.query('DELETE FROM user_follows WHERE 1=1');
    await db.query('DELETE FROM vufs_items WHERE owner_id IN (SELECT id FROM users WHERE email LIKE \'%socialtest%\')');
    await db.query('DELETE FROM users WHERE email LIKE \'%socialtest%\'');

    // Create test users
    testUser1 = await UserModel.create({
      cpf: '12345678901',
      email: 'user1.socialtest@example.com',
      password: 'password123',
      birthDate: new Date('1990-01-01'),
      gender: 'female',
      profile: {
        name: 'Test User 1',
        username: 'testuser1',
        bio: 'Fashion enthusiast and style blogger',
        profilePicture: 'https://example.com/profile1.jpg'
      }
    });

    testUser2 = await UserModel.create({
      cpf: '12345678902',
      email: 'user2.socialtest@example.com',
      password: 'password123',
      birthDate: new Date('1992-05-15'),
      gender: 'male',
      profile: {
        name: 'Test User 2',
        username: 'testuser2',
        bio: 'Sustainable fashion advocate',
        profilePicture: 'https://example.com/profile2.jpg'
      }
    });

    testUser3 = await UserModel.create({
      cpf: '12345678903',
      email: 'user3.socialtest@example.com',
      password: 'password123',
      birthDate: new Date('1988-11-20'),
      gender: 'non-binary',
      profile: {
        name: 'Test User 3',
        username: 'testuser3',
        bio: 'Vintage clothing collector',
        profilePicture: 'https://example.com/profile3.jpg'
      }
    });

    // Get auth tokens
    const loginResponse1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user1.socialtest@example.com',
        password: 'password123'
      });
    authToken1 = loginResponse1.body.data.token;

    const loginResponse2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user2.socialtest@example.com',
        password: 'password123'
      });
    authToken2 = loginResponse2.body.data.token;

    const loginResponse3 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user3.socialtest@example.com',
        password: 'password123'
      });
    authToken3 = loginResponse3.body.data.token;

    // Create a test wardrobe item for user1
    testWardrobeItem = await VUFSItemModel.create({
      vufsCode: 'TEST-SOCIAL-001',
      ownerId: testUser1.id,
      categoryHierarchy: {
        page: 'APPAREL',
        blueSubcategory: 'TOPS',
        whiteSubcategory: 'SHIRTS',
        graySubcategory: 'CASUAL_SHIRTS'
      },
      brandHierarchy: {
        brand: 'Test Brand',
        line: 'Test Line'
      },
      metadata: {
        name: 'Test Casual Shirt',
        composition: [{ name: 'Cotton', percentage: 100 }],
        colors: [{ name: 'Blue', hex: '#0066CC' }],
        careInstructions: ['Machine wash cold']
      },
      conditionInfo: {
        status: 'used_excellent',
        description: 'Excellent condition, barely worn'
      },
      ownershipInfo: {
        status: 'owned',
        visibility: 'public'
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM post_comments WHERE 1=1');
    await db.query('DELETE FROM post_likes WHERE 1=1');
    await db.query('DELETE FROM social_posts WHERE 1=1');
    await db.query('DELETE FROM user_follows WHERE 1=1');
    await db.query('DELETE FROM vufs_items WHERE owner_id IN (SELECT id FROM users WHERE email LIKE \'%socialtest%\')');
    await db.query('DELETE FROM users WHERE email LIKE \'%socialtest%\'');
  });

  describe('Task 7.1: Build real social posting system', () => {
    describe('Social Post Creation', () => {
      it('should create a social post with images and text', async () => {
        const postData = {
          postType: 'outfit',
          content: {
            title: 'My Casual Friday Look',
            description: 'Perfect combination for a relaxed work day. Love how this shirt pairs with my favorite jeans!',
            imageUrls: [
              'https://example.com/outfit1.jpg',
              'https://example.com/outfit2.jpg'
            ],
            tags: ['casual', 'workwear', 'friday', 'comfortable']
          },
          wardrobeItemIds: [testWardrobeItem.id],
          visibility: 'public'
        };

        const response = await request(app)
          .post('/api/social/posts')
          .set('Authorization', `Bearer ${authToken1}`)
          .send(postData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.post).toBeDefined();

        const post = response.body.data.post;
        testPost = post;

        expect(post.userId).toBe(testUser1.id);
        expect(post.postType).toBe('outfit');
        expect(post.content.title).toBe('My Casual Friday Look');
        expect(post.content.imageUrls).toHaveLength(2);
        expect(post.content.tags).toContain('casual');
        expect(post.wardrobeItemIds).toContain(testWardrobeItem.id);
        expect(post.visibility).toBe('public');
        expect(post.engagementStats.likes).toBe(0);
        expect(post.engagementStats.comments).toBe(0);
      });

      it('should create an item showcase post', async () => {
        const postData = {
          postType: 'item',
          content: {
            title: 'Vintage Denim Jacket Find',
            description: 'Found this amazing vintage denim jacket at a thrift store. The quality is incredible!',
            imageUrls: ['https://example.com/jacket1.jpg'],
            tags: ['vintage', 'denim', 'thrift', 'sustainable']
          },
          visibility: 'public'
        };

        const response = await request(app)
          .post('/api/social/posts')
          .set('Authorization', `Bearer ${authToken2}`)
          .send(postData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.post.postType).toBe('item');
        expect(response.body.data.post.userId).toBe(testUser2.id);
      });

      it('should create an inspiration post', async () => {
        const postData = {
          postType: 'inspiration',
          content: {
            title: 'Spring Color Palette Inspiration',
            description: 'Loving these soft pastels for spring. Perfect for creating fresh, feminine looks.',
            imageUrls: ['https://example.com/inspiration1.jpg'],
            tags: ['spring', 'pastels', 'inspiration', 'colors']
          },
          visibility: 'followers'
        };

        const response = await request(app)
          .post('/api/social/posts')
          .set('Authorization', `Bearer ${authToken3}`)
          .send(postData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.post.postType).toBe('inspiration');
        expect(response.body.data.post.visibility).toBe('followers');
      });

      it('should validate required fields for post creation', async () => {
        const invalidPostData = {
          postType: 'outfit',
          content: {
            title: 'Test Post'
            // Missing imageUrls
          }
        };

        await request(app)
          .post('/api/social/posts')
          .set('Authorization', `Bearer ${authToken1}`)
          .send(invalidPostData)
          .expect(400);
      });
    });

    describe('Post Engagement Features', () => {
      it('should allow users to like posts', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${testPost.id}/like`)
          .set('Authorization', `Bearer ${authToken2}`)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.like).toBeDefined();
        expect(response.body.data.like.postId).toBe(testPost.id);
        expect(response.body.data.like.userId).toBe(testUser2.id);
      });

      it('should prevent duplicate likes', async () => {
        await request(app)
          .post(`/api/social/posts/${testPost.id}/like`)
          .set('Authorization', `Bearer ${authToken2}`)
          .expect(400);
      });

      it('should allow users to unlike posts', async () => {
        const response = await request(app)
          .delete(`/api/social/posts/${testPost.id}/like`)
          .set('Authorization', `Bearer ${authToken2}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should allow users to comment on posts', async () => {
        const commentData = {
          content: 'Love this outfit! Where did you get that shirt?'
        };

        const response = await request(app)
          .post(`/api/social/posts/${testPost.id}/comments`)
          .set('Authorization', `Bearer ${authToken2}`)
          .send(commentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.comment).toBeDefined();
        expect(response.body.data.comment.content).toBe(commentData.content);
        expect(response.body.data.comment.userId).toBe(testUser2.id);
        expect(response.body.data.comment.postId).toBe(testPost.id);
      });

      it('should allow replies to comments', async () => {
        // First, get the comment we just created
        const postResponse = await request(app)
          .get(`/api/social/posts/${testPost.id}`)
          .expect(200);

        const comments = postResponse.body.data.post.comments;
        expect(comments).toHaveLength(1);
        const parentComment = comments[0];

        const replyData = {
          content: 'Thanks! I got it from a local boutique downtown.',
          parentCommentId: parentComment.id
        };

        const response = await request(app)
          .post(`/api/social/posts/${testPost.id}/comments`)
          .set('Authorization', `Bearer ${authToken1}`)
          .send(replyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.comment.parentCommentId).toBe(parentComment.id);
      });

      it('should validate comment content length', async () => {
        const longComment = {
          content: 'a'.repeat(501) // Exceeds 500 character limit
        };

        await request(app)
          .post(`/api/social/posts/${testPost.id}/comments`)
          .set('Authorization', `Bearer ${authToken2}`)
          .send(longComment)
          .expect(400);
      });
    });

    describe('Post Retrieval and Display', () => {
      it('should retrieve a post with engagement stats', async () => {
        // Like the post first
        await request(app)
          .post(`/api/social/posts/${testPost.id}/like`)
          .set('Authorization', `Bearer ${authToken3}`)
          .expect(201);

        const response = await request(app)
          .get(`/api/social/posts/${testPost.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        const post = response.body.data.post;

        expect(post.id).toBe(testPost.id);
        expect(post.engagementStats.likes).toBeGreaterThan(0);
        expect(post.engagementStats.comments).toBeGreaterThan(0);
        expect(post.user).toBeDefined();
        expect(post.user.profile.name).toBe('Test User 1');
      });
    });
  });

  describe('Task 7.2: Implement real user interaction system', () => {
    describe('User Following System', () => {
      it('should allow users to follow other users', async () => {
        const response = await request(app)
          .post(`/api/social/users/${testUser2.id}/follow`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.follow).toBeDefined();
        expect(response.body.data.follow.followerId).toBe(testUser1.id);
        expect(response.body.data.follow.followingId).toBe(testUser2.id);
      });

      it('should prevent users from following themselves', async () => {
        await request(app)
          .post(`/api/social/users/${testUser1.id}/follow`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(400);
      });

      it('should prevent duplicate follows', async () => {
        await request(app)
          .post(`/api/social/users/${testUser2.id}/follow`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(400);
      });

      it('should allow users to unfollow other users', async () => {
        const response = await request(app)
          .delete(`/api/social/users/${testUser2.id}/follow`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should check follow status between users', async () => {
        // Follow user2 again
        await request(app)
          .post(`/api/social/users/${testUser2.id}/follow`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(201);

        const response = await request(app)
          .get(`/api/social/users/${testUser2.id}/follow-status`)
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isFollowing).toBe(true);
      });
    });

    describe('Followers and Following Lists', () => {
      beforeAll(async () => {
        // Set up follow relationships for testing
        await request(app)
          .post(`/api/social/users/${testUser1.id}/follow`)
          .set('Authorization', `Bearer ${authToken3}`)
          .expect(201);
      });

      it('should get user followers list', async () => {
        const response = await request(app)
          .get(`/api/social/users/${testUser1.id}/followers`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toBeDefined();
        expect(response.body.data.users.length).toBeGreaterThan(0);

        const follower = response.body.data.users.find((u: any) => u.id === testUser3.id);
        expect(follower).toBeDefined();
        expect(follower.profile.name).toBe('Test User 3');
      });

      it('should get user following list', async () => {
        const response = await request(app)
          .get(`/api/social/users/${testUser1.id}/following`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.users).toBeDefined();
        expect(response.body.data.users.length).toBeGreaterThan(0);

        const following = response.body.data.users.find((u: any) => u.id === testUser2.id);
        expect(following).toBeDefined();
        expect(following.profile.name).toBe('Test User 2');
      });

      it('should get user social statistics', async () => {
        const response = await request(app)
          .get(`/api/social/users/${testUser1.id}/stats`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.stats).toBeDefined();
        expect(response.body.data.stats.postsCount).toBeGreaterThan(0);
        expect(response.body.data.stats.followersCount).toBeGreaterThan(0);
        expect(response.body.data.stats.followingCount).toBeGreaterThan(0);
      });
    });

    describe('Social Feed System', () => {
      it('should get discover feed with public posts', async () => {
        const response = await request(app)
          .get('/api/social/feed?feedType=discover&limit=10')
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeDefined();
        expect(Array.isArray(response.body.data.posts)).toBe(true);
        expect(response.body.data.posts.length).toBeGreaterThan(0);
      });

      it('should get following feed with posts from followed users', async () => {
        const response = await request(app)
          .get('/api/social/feed?feedType=following&limit=10')
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeDefined();

        // Should contain posts from user2 (who user1 follows)
        const postsFromFollowed = response.body.data.posts.filter(
          (post: any) => post.userId === testUser2.id
        );
        expect(postsFromFollowed.length).toBeGreaterThan(0);
      });

      it('should get personal feed with user own posts', async () => {
        const response = await request(app)
          .get('/api/social/feed?feedType=personal&limit=10')
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeDefined();

        // All posts should be from the authenticated user
        response.body.data.posts.forEach((post: any) => {
          expect(post.userId).toBe(testUser1.id);
        });
      });

      it('should support pagination in feeds', async () => {
        const response = await request(app)
          .get('/api/social/feed?feedType=discover&page=1&limit=2')
          .set('Authorization', `Bearer ${authToken1}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toBeDefined();
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(2);
      });
    });

    describe('Content Search and Discovery', () => {
      it('should search posts by tags', async () => {
        const response = await request(app)
          .get('/api/social/posts/search?tags=casual&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeDefined();

        // Should find posts with 'casual' tag
        const casualPosts = response.body.data.posts.filter((post: any) =>
          post.content.tags && post.content.tags.includes('casual')
        );
        expect(casualPosts.length).toBeGreaterThan(0);
      });

      it('should search posts by post type', async () => {
        const response = await request(app)
          .get('/api/social/posts/search?postType=outfit&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeDefined();

        // All returned posts should be outfit type
        response.body.data.posts.forEach((post: any) => {
          expect(post.postType).toBe('outfit');
        });
      });

      it('should search posts by user', async () => {
        const response = await request(app)
          .get(`/api/social/posts/search?userId=${testUser1.id}&limit=10`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeDefined();

        // All returned posts should be from the specified user
        response.body.data.posts.forEach((post: any) => {
          expect(post.userId).toBe(testUser1.id);
        });
      });
    });
  });

  describe('Data Persistence and Real Usage', () => {
    it('should persist all social data across app restarts', async () => {
      // Verify that all created data still exists
      const postsCount = await db.query('SELECT COUNT(*) as count FROM social_posts');
      const followsCount = await db.query('SELECT COUNT(*) as count FROM user_follows');
      const likesCount = await db.query('SELECT COUNT(*) as count FROM post_likes');
      const commentsCount = await db.query('SELECT COUNT(*) as count FROM post_comments');

      expect(parseInt(postsCount.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(followsCount.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(likesCount.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(commentsCount.rows[0].count)).toBeGreaterThan(0);
    });

    it('should maintain referential integrity', async () => {
      // Test that deleting a user cascades properly
      const testUserId = testUser3.id;

      // Create some data for user3
      await request(app)
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken3}`)
        .send({
          postType: 'item',
          content: {
            title: 'Test Post for Deletion',
            imageUrls: ['https://example.com/test.jpg']
          }
        });

      // Delete the user
      await db.query('DELETE FROM users WHERE id = $1', [testUserId]);

      // Verify that related social data was also deleted
      const userPosts = await db.query('SELECT COUNT(*) as count FROM social_posts WHERE user_id = $1', [testUserId]);
      const userFollows = await db.query('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1 OR following_id = $1', [testUserId]);
      const userLikes = await db.query('SELECT COUNT(*) as count FROM post_likes WHERE user_id = $1', [testUserId]);
      const userComments = await db.query('SELECT COUNT(*) as count FROM post_comments WHERE user_id = $1', [testUserId]);

      expect(parseInt(userPosts.rows[0].count)).toBe(0);
      expect(parseInt(userFollows.rows[0].count)).toBe(0);
      expect(parseInt(userLikes.rows[0].count)).toBe(0);
      expect(parseInt(userComments.rows[0].count)).toBe(0);
    });

    it('should support real-time engagement updates', async () => {
      // Get initial engagement stats
      const initialResponse = await request(app)
        .get(`/api/social/posts/${testPost.id}`)
        .expect(200);

      const initialLikes = initialResponse.body.data.post.engagementStats.likes;

      // Add a like
      await request(app)
        .post(`/api/social/posts/${testPost.id}/like`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(201);

      // Verify engagement stats updated
      const updatedResponse = await request(app)
        .get(`/api/social/posts/${testPost.id}`)
        .expect(200);

      const updatedLikes = updatedResponse.body.data.post.engagementStats.likes;
      expect(updatedLikes).toBe(initialLikes + 1);
    });
  });

  describe('Integration with Wardrobe System', () => {
    it('should link social posts to actual wardrobe items', async () => {
      const response = await request(app)
        .get(`/api/social/posts/${testPost.id}`)
        .expect(200);

      const post = response.body.data.post;
      expect(post.wardrobeItemIds).toContain(testWardrobeItem.id);

      // Verify the wardrobe item exists and belongs to the post author
      const wardrobeItem = await VUFSItemModel.findById(testWardrobeItem.id);
      expect(wardrobeItem).toBeDefined();
      expect(wardrobeItem!.ownerId).toBe(testUser1.id);
    });

    it('should get user wardrobe for outfit creation', async () => {
      const response = await request(app)
        .get('/api/social/wardrobe')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);

      const userItem = response.body.data.items.find((item: any) => item.id === testWardrobeItem.id);
      expect(userItem).toBeDefined();
    });
  });
});