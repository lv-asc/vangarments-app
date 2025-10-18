'use client';

import { useState, useEffect, useCallback } from 'react';
import { SocialPost, UserProfile, VUFSItem } from '@vangarments/shared';
import { socialApi } from '../../lib/socialApi';
import { PersonalizedFeed } from './PersonalizedFeed';
import { OutfitShareModal, OutfitShareData } from './OutfitShareModal';
import { useAuth } from '../../hooks/useAuth';

interface SocialFeedContainerProps {
  initialFeedType?: 'discover' | 'following' | 'personal';
}

export function SocialFeedContainer({ initialFeedType = 'discover' }: SocialFeedContainerProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [feedType, setFeedType] = useState(initialFeedType);
  const [showShareModal, setShowShareModal] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<VUFSItem[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  // Load initial feed
  useEffect(() => {
    loadFeed(true);
  }, [feedType]);

  // Load user's wardrobe for sharing
  useEffect(() => {
    if (user) {
      loadWardrobe();
      loadUserInteractions();
    }
  }, [user]);

  const loadFeed = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 1 : page;
      const response = await socialApi.getFeed({
        feedType,
        page: currentPage,
        limit: 20
      });

      if (reset) {
        setPosts(response.posts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [feedType, page, loading]);

  const loadWardrobe = async () => {
    try {
      const response = await socialApi.getUserWardrobe();
      setWardrobeItems(response.items);
    } catch (err) {
      console.error('Failed to load wardrobe:', err);
    }
  };

  const loadUserInteractions = async () => {
    if (!user) return;
    
    try {
      // Load user's liked posts and followed users
      // This would typically come from a user preferences API
      // For now, we'll initialize empty sets
      setLikedPosts(new Set());
      setFollowedUsers(new Set());
    } catch (err) {
      console.error('Failed to load user interactions:', err);
    }
  };

  const handlePostClick = (post: SocialPost) => {
    // Navigate to post detail page or open modal
    console.log('Post clicked:', post.id);
  };

  const handleUserClick = (userId: string) => {
    // Navigate to user profile page
    console.log('User clicked:', userId);
  };

  const handleTagClick = (tag: string) => {
    // Search posts by tag
    console.log('Tag clicked:', tag);
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;

    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        await socialApi.unlikePost(postId);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        
        // Update post engagement stats
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, engagementStats: { ...post.engagementStats, likes: post.engagementStats.likes - 1 }}
            : post
        ));
      } else {
        await socialApi.likePost(postId);
        setLikedPosts(prev => new Set(prev).add(postId));
        
        // Update post engagement stats
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, engagementStats: { ...post.engagementStats, likes: post.engagementStats.likes + 1 }}
            : post
        ));
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!user) return;

    try {
      const isFollowing = followedUsers.has(userId);
      
      if (isFollowing) {
        await socialApi.unfollowUser(userId);
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await socialApi.followUser(userId);
        setFollowedUsers(prev => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleShareOutfit = async (shareData: OutfitShareData) => {
    if (!user) return;

    try {
      // Upload images first (this would typically go to a file upload service)
      const imageUrls: string[] = [];
      for (const image of shareData.images) {
        // Mock image upload - in real implementation, upload to S3 or similar
        const mockUrl = URL.createObjectURL(image);
        imageUrls.push(mockUrl);
      }

      // Create the social post
      const postData = {
        postType: 'outfit' as const,
        content: {
          title: shareData.title,
          description: shareData.description,
          imageUrls,
          tags: shareData.tags
        },
        wardrobeItemIds: shareData.wardrobeItemIds,
        visibility: shareData.visibility
      };

      const newPost = await socialApi.createPost(postData);
      
      // Add the new post to the feed if it's visible
      if (feedType === 'personal' || (feedType === 'discover' && shareData.visibility === 'public')) {
        setPosts(prev => [newPost, ...prev]);
      }

      setShowShareModal(false);
    } catch (err) {
      console.error('Failed to share outfit:', err);
      throw err; // Re-throw to show error in modal
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadFeed(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Erro ao carregar feed</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => loadFeed(true)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Feed Type Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'discover', name: 'Descobrir' },
            { id: 'following', name: 'Seguindo' },
            { id: 'personal', name: 'Meus Posts' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFeedType(type.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                feedType === type.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>

        {user && (
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Compartilhar Look
          </button>
        )}
      </div>

      {/* Feed Component */}
      <PersonalizedFeed
        userId={user?.id || ''}
        onPostClick={handlePostClick}
        onUserClick={handleUserClick}
        onTagClick={handleTagClick}
      />

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}

      {/* Share Modal */}
      <OutfitShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        wardrobeItems={wardrobeItems}
        onShare={handleShareOutfit}
      />
    </div>
  );
}