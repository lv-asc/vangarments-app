import { db } from '../../src/database/connection';
import { UserModel } from '../../src/models/User';
import { VUFSItemModel } from '../../src/models/VUFSItem';
import { SocialPostModel } from '../../src/models/SocialPost';
import { UserFollowModel } from '../../src/models/UserFollow';
import { PostLikeModel } from '../../src/models/PostLike';
import { PostCommentModel } from '../../src/models/PostComment';
import { SocialService } from '../../src/services/socialService';

describe('Social Platform Core Functionality - Task 7.1 & 7.2', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let testWardrobeItem: any;
  let testPost: any;
  let socialService: SocialService;

  beforeAll(async () => {
    socialService = new SocialService();

    // Clean up any existing test data
    await db.query('DELETE FROM post_comments WHERE 1=1');
    await db.query('DELETE FROM post_likes WHERE 1=1');
    await db.query('DELETE FROM social_posts WHERE 1=1');
    await db.query('DELETE FROM user_follows WHERE 1=1');
    await db.query('DELETE FROM vufs_items WHERE owner_id IN (SELECT id FROM users WHERE email LIKE \'%social.%@example.com\')');
    await db.query('DELETE FROM users WHERE email LIKE \'%social.%@example.com\'');

    // Create test users with unique identifiers
    const uniqueId = Math.floor(Math.random() * 1000000);
    testUser1 = await UserModel.create({
      cpf: `${uniqueId}01`,
      email: `user1.social.${uniqueId}@example.com`,
      name: 'Test User 1',
      birthDate: new Date('1990-01-01'),
      gender: 'female'
    });

    testUser2 = await UserModel.create({
      cpf: `${uniqueId}02`,
      email: `user2.social.${uniqueId}@example.com`,
      name: 'Test User 2',
      birthDate: new Date('1992-05-15'),
      gender: 'female'
    });

    testUser3 = await UserModel.create({
      cpf: `${uniqueId}03`,
      email: `user3.social.${uniqueId}@example.com`,
      name: 'Test User 3',
      birthDate: new Date('1988-12-20'),
      gender: 'male'
    });

    // Create a test wardrobe item for user1
    testWardrobeItem = await VUFSItemModel.create({
      ownerId: testUser1.id,
      category: {
        page: 'APPAREL',
        blueSubcategory: 'TOPS',
        whiteSubcategory: 'SHIRTS',
        graySubcategory: 'CASUAL_SHIRTS'
      },
      brand: {
        brand: 'Test Brand',
        line: 'Test Line'
      },
      metadata: {
        name: 'Test Casual Shirt',
        composition: [{ name: 'Cotton', percentage: 100 }],
        colors: [{ name: 'Blue', hex: '#0066CC' }],
        careInstructions: ['Machine wash cold']
      },
      condition: {
        status: 'used_excellent',
        description: 'Excellent condition, barely worn'
      },
      ownership: {
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
    await db.query('DELETE FROM vufs_items WHERE owner_id IN (SELECT id FROM users WHERE email LIKE \'%social.%@example.com\')');
    await db.query('DELETE FROM users WHERE email LIKE \'%social.%@example.com\'');
    
    // Close database connection
    await db.close();
  });

  describe('Task 7.1: Build real social posting system', () => {
    describe('Social Post Creation and Storage', () => {
      it('should create and persist social posts with real data', async () => {
        const postData = {
          userId: testUser1.id,
          postType: 'outfit' as const,
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
          visibility: 'public' as const
        };

        testPost = await socialService.createPost(postData);

        expect(testPost).toBeDefined();
        expect(testPost.userId).toBe(testUser1.id);
        expect(testPost.postType).toBe('outfit');
        expect(testPost.content.title).toBe('My Casual Friday Look');
        expect(testPost.content.imageUrls).toHaveLength(2);
        expect(testPost.content.tags).toContain('casual');
        expect(testPost.wardrobeItemIds).toContain(testWardrobeItem.id);
        expect(testPost.visibility).toBe('public');
        expect(testPost.engagementStats.likes).toBe(0);
        expect(testPost.engagementStats.comments).toBe(0);

        console.log('✅ Created social post with real data persistence');
      });

      it('should create different types of posts', async () => {
        // Item showcase post
        const itemPost = await socialService.createPost({
          userId: testUser2.id,
          postType: 'item',
          content: {
            title: 'Vintage Denim Jacket Find',
            description: 'Found this amazing vintage denim jacket at a thrift store. The quality is incredible!',
            imageUrls: ['https://example.com/jacket1.jpg'],
            tags: ['vintage', 'denim', 'thrift', 'sustainable']
          },
          visibility: 'public'
        });

        expect(itemPost.postType).toBe('item');
        expect(itemPost.userId).toBe(testUser2.id);

        // Inspiration post
        const inspirationPost = await socialService.createPost({
          userId: testUser3.id,
          postType: 'inspiration',
          content: {
            title: 'Spring Color Palette Inspiration',
            description: 'Loving these soft pastels for spring. Perfect for creating fresh, feminine looks.',
            imageUrls: ['https://example.com/inspiration1.jpg'],
            tags: ['spring', 'pastels', 'inspiration', 'colors']
          },
          visibility: 'followers'
        });

        expect(inspirationPost.postType).toBe('inspiration');
        expect(inspirationPost.visibility).toBe('followers');

        console.log('✅ Created multiple post types with real data');
      });
    });

    describe('Real Engagement Features', () => {
      it('should handle likes with real data persistence', async () => {
        // Like the post
        const like = await socialService.likePost(testPost.id, testUser2.id);
        
        expect(like).toBeDefined();
        expect(like.postId).toBe(testPost.id);
        expect(like.userId).toBe(testUser2.id);

        // Verify engagement stats updated
        const updatedPost = await socialService.getPostWithDetails(testPost.id);
        expect(updatedPost!.engagementStats.likes).toBe(1);

        // Unlike the post
        const unlikeResult = await socialService.unlikePost(testPost.id, testUser2.id);
        expect(unlikeResult).toBe(true);

        // Verify stats updated again
        const finalPost = await socialService.getPostWithDetails(testPost.id);
        expect(finalPost!.engagementStats.likes).toBe(0);

        console.log('✅ Like/unlike functionality working with real data persistence');
      });

      it('should handle comments with real data persistence', async () => {
        // Add a comment
        const comment = await socialService.addComment({
          postId: testPost.id,
          userId: testUser2.id,
          content: 'Love this outfit! Where did you get that shirt?'
        });

        expect(comment).toBeDefined();
        expect(comment.content).toBe('Love this outfit! Where did you get that shirt?');
        expect(comment.userId).toBe(testUser2.id);
        expect(comment.postId).toBe(testPost.id);

        // Add a reply
        const reply = await socialService.addComment({
          postId: testPost.id,
          userId: testUser1.id,
          content: 'Thanks! I got it from a local boutique downtown.',
          parentCommentId: comment.id
        });

        expect(reply.parentCommentId).toBe(comment.id);

        // Verify engagement stats updated
        const updatedPost = await socialService.getPostWithDetails(testPost.id);
        expect(updatedPost!.engagementStats.comments).toBeGreaterThan(0);

        console.log('✅ Comment system working with real data persistence');
      });
    });
  });

  describe('Task 7.2: Implement real user interaction system', () => {
    describe('User Following System', () => {
      it('should create real following relationships', async () => {
        // User1 follows User2
        const follow = await socialService.followUser(testUser1.id, testUser2.id);
        
        expect(follow).toBeDefined();
        expect(follow.followerId).toBe(testUser1.id);
        expect(follow.followingId).toBe(testUser2.id);

        // Verify follow status
        const isFollowing = await socialService.isFollowing(testUser1.id, testUser2.id);
        expect(isFollowing).toBe(true);

        // User3 follows User1
        await socialService.followUser(testUser3.id, testUser1.id);

        console.log('✅ Following relationships created with real data persistence');
      });

      it('should get real followers and following lists', async () => {
        // Get User1's followers (should include User3)
        const followers = await socialService.getFollowers(testUser1.id, 1, 20);
        expect(followers.users.length).toBeGreaterThan(0);
        
        const follower = followers.users.find(u => u.id === testUser3.id);
        expect(follower).toBeDefined();
        expect(follower!.profile.name).toBe('Test User 3');

        // Get User1's following (should include User2)
        const following = await socialService.getFollowing(testUser1.id, 1, 20);
        expect(following.users.length).toBeGreaterThan(0);
        
        const followedUser = following.users.find(u => u.id === testUser2.id);
        expect(followedUser).toBeDefined();
        expect(followedUser!.profile.name).toBe('Test User 2');

        console.log('✅ Followers/following lists working with real data');
      });

      it('should get accurate social statistics', async () => {
        const stats = await socialService.getUserSocialStats(testUser1.id);
        
        expect(stats.postsCount).toBeGreaterThan(0);
        expect(stats.followersCount).toBeGreaterThan(0);
        expect(stats.followingCount).toBeGreaterThan(0);

        console.log('✅ Social statistics accurate with real data');
      });
    });

    describe('Real Social Feed System', () => {
      it('should generate discover feed with real posts', async () => {
        const discoverFeed = await socialService.getFeed({
          userId: testUser1.id,
          feedType: 'discover',
          limit: 10
        });

        expect(discoverFeed.posts).toBeDefined();
        expect(discoverFeed.posts.length).toBeGreaterThan(0);
        
        // Should contain public posts from all users
        const hasPublicPosts = discoverFeed.posts.some(post => post.visibility === 'public');
        expect(hasPublicPosts).toBe(true);

        console.log('✅ Discover feed working with real posts');
      });

      it('should generate following feed with posts from followed users', async () => {
        const followingFeed = await socialService.getFeed({
          userId: testUser1.id,
          feedType: 'following',
          limit: 10
        });

        expect(followingFeed.posts).toBeDefined();
        
        // Should contain posts from User2 (who User1 follows)
        const postsFromFollowed = followingFeed.posts.filter(
          post => post.userId === testUser2.id
        );
        expect(postsFromFollowed.length).toBeGreaterThan(0);

        console.log('✅ Following feed working with real user relationships');
      });

      it('should generate personal feed with user own posts', async () => {
        const personalFeed = await socialService.getFeed({
          userId: testUser1.id,
          feedType: 'personal',
          limit: 10
        });

        expect(personalFeed.posts).toBeDefined();
        
        // All posts should be from the user
        personalFeed.posts.forEach(post => {
          expect(post.userId).toBe(testUser1.id);
        });

        console.log('✅ Personal feed working with real user posts');
      });
    });

    describe('Content Search and Discovery', () => {
      it('should search posts with real data', async () => {
        // Search by tags
        const tagResults = await socialService.searchPosts('', { tags: ['casual'] }, 1, 10);
        expect(tagResults.posts.length).toBeGreaterThan(0);
        
        const casualPost = tagResults.posts.find(post => 
          post.content.tags && post.content.tags.includes('casual')
        );
        expect(casualPost).toBeDefined();

        // Search by post type
        const outfitResults = await socialService.searchPosts('', { postType: 'outfit' }, 1, 10);
        expect(outfitResults.posts.length).toBeGreaterThan(0);
        
        outfitResults.posts.forEach(post => {
          expect(post.postType).toBe('outfit');
        });

        console.log('✅ Search functionality working with real data');
      });
    });
  });

  describe('Data Persistence and Real Usage Validation', () => {
    it('should persist all social data permanently', async () => {
      // Verify that all created data exists in database
      const postsCount = await db.query('SELECT COUNT(*) as count FROM social_posts');
      const followsCount = await db.query('SELECT COUNT(*) as count FROM user_follows');
      const likesCount = await db.query('SELECT COUNT(*) as count FROM post_likes');
      const commentsCount = await db.query('SELECT COUNT(*) as count FROM post_comments');

      expect(parseInt(postsCount.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(followsCount.rows[0].count)).toBeGreaterThan(0);
      expect(parseInt(commentsCount.rows[0].count)).toBeGreaterThan(0);

      console.log('✅ All social data persisted permanently in database');
      console.log(`   - Posts: ${postsCount.rows[0].count}`);
      console.log(`   - Follows: ${followsCount.rows[0].count}`);
      console.log(`   - Comments: ${commentsCount.rows[0].count}`);
    });

    it('should maintain referential integrity', async () => {
      // Test cascading deletes work properly
      const testUserId = testUser3.id;
      
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

      console.log('✅ Referential integrity maintained - cascading deletes work');
    });

    it('should integrate with wardrobe system', async () => {
      // Verify posts link to real wardrobe items
      const postWithItems = await socialService.getPostWithDetails(testPost.id);
      expect(postWithItems!.wardrobeItemIds).toContain(testWardrobeItem.id);
      
      // Verify wardrobe item exists and belongs to post author
      const wardrobeItem = await VUFSItemModel.findById(testWardrobeItem.id);
      expect(wardrobeItem).toBeDefined();
      expect(wardrobeItem!.ownerId).toBe(testUser1.id);

      console.log('✅ Social platform integrated with real wardrobe system');
    });
  });
});