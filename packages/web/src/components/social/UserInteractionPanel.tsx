'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { SocialPost, UserProfile, UserSocialStats } from '@vangarments/shared';
import { socialApi } from '../../lib/socialApi';
import { useAuth } from '../../hooks/useAuth';

interface UserInteractionPanelProps {
  post: SocialPost;
  onLike?: (postId: string, isLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

export function UserInteractionPanel({
  post,
  onLike,
  onComment,
  onShare,
  onReport,
  onUserClick
}: UserInteractionPanelProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userStats, setUserStats] = useState<UserSocialStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (user && post.userId !== user.id) {
      loadUserInteractionStatus();
    }
    loadUserStats();
  }, [user, post.userId]);

  const loadUserInteractionStatus = async () => {
    if (!user) return;

    try {
      const followStatus = await socialApi.checkFollowStatus(post.userId);
      setIsFollowing(followStatus.isFollowing);
      
      // Check if user has liked this post (would need additional API endpoint)
      // For now, we'll assume not liked initially
      setIsLiked(false);
    } catch (err) {
      console.error('Failed to load interaction status:', err);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await socialApi.getUserSocialStats(post.userId);
      setUserStats(response.stats);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const handleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        await socialApi.unlikePost(post.id);
        setIsLiked(false);
      } else {
        await socialApi.likePost(post.id);
        setIsLiked(true);
      }
      
      onLike?.(post.id, !isLiked);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || loading || post.userId === user.id) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await socialApi.unfollowUser(post.userId);
        setIsFollowing(false);
      } else {
        await socialApi.followUser(post.userId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post.id);
  };

  const handleReport = () => {
    onReport?.(post.id);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-4">
      {/* User Info Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onUserClick?.(post.userId)}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          <img
            src={post.user?.profile.profilePicture || '/api/placeholder/48/48'}
            alt={post.user?.profile.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              {post.user?.profile.name}
            </h3>
            {post.user?.profile.username && (
              <p className="text-sm text-gray-500">
                @{post.user.profile.username}
              </p>
            )}
            {userStats && (
              <p className="text-xs text-gray-400">
                {formatNumber(userStats.followersCount)} seguidores
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center space-x-2">
          {/* Follow Button */}
          {user && post.userId !== user.id && (
            <button
              onClick={handleFollow}
              disabled={loading}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserMinusIcon className="h-4 w-4" />
                  <span>Seguindo</span>
                </>
              ) : (
                <>
                  <UserPlusIcon className="h-4 w-4" />
                  <span>Seguir</span>
                </>
              )}
            </button>
          )}

          {/* More Actions */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    handleShare();
                    setShowActions(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span>Compartilhar</span>
                </button>
                
                {user && post.userId !== user.id && (
                  <button
                    onClick={() => {
                      handleReport();
                      setShowActions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FlagIcon className="h-4 w-4" />
                    <span>Denunciar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Badges */}
      {post.user?.badges && post.user.badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.user.badges.map((badge) => (
            <span
              key={badge.id}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                badge.type === 'beta_pioneer' ? 'bg-purple-100 text-purple-800' :
                badge.type === 'brand_owner' ? 'bg-blue-100 text-blue-800' :
                badge.type === 'influencer' ? 'bg-pink-100 text-pink-800' :
                badge.type === 'stylist' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {badge.name}
            </span>
          ))}
        </div>
      )}

      {/* Post Engagement Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={!user || loading}
            className="flex items-center space-x-2 text-gray-500 hover:text-pink-500 transition-colors disabled:opacity-50"
          >
            {isLiked ? (
              <HeartSolidIcon className="w-6 h-6 text-pink-500" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
            <span className="text-sm font-medium">
              {formatNumber(post.engagementStats.likes)}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleComment}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <ChatBubbleLeftIcon className="w-6 h-6" />
            <span className="text-sm font-medium">
              {formatNumber(post.engagementStats.comments)}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
          >
            <ShareIcon className="w-6 h-6" />
            <span className="text-sm font-medium">
              {formatNumber(post.engagementStats.shares)}
            </span>
          </button>
        </div>

        {/* Post Type Badge */}
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          post.postType === 'outfit' ? 'bg-pink-100 text-pink-800' :
          post.postType === 'item' ? 'bg-blue-100 text-blue-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {post.postType === 'outfit' ? 'Look' : 
           post.postType === 'item' ? 'Peça' : 'Inspiração'}
        </span>
      </div>

      {/* Wardrobe Items Preview */}
      {post.wardrobeItemIds && post.wardrobeItemIds.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Peças do look ({post.wardrobeItemIds.length})
          </h4>
          <div className="flex space-x-2 overflow-x-auto">
            {post.wardrobeItemIds.slice(0, 4).map((itemId, index) => (
              <div
                key={itemId}
                className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={`/api/placeholder/48/48`}
                  alt={`Item ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {post.wardrobeItemIds.length > 4 && (
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">
                  +{post.wardrobeItemIds.length - 4}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}