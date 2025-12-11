// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import {
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { SocialPost, StyleRecommendation } from '@vangarments/shared';
import { socialApi } from '../../lib/socialApi';
import { UserInteractionPanel } from './UserInteractionPanel';
import { CommentSystem } from './CommentSystem';

interface PersonalizedFeedProps {
  userId: string;
  onPostClick: (post: SocialPost) => void;
  onUserClick: (userId: string) => void;
  onTagClick: (tag: string) => void;
}

interface FeedPreferences {
  showFollowing: boolean;
  showRecommended: boolean;
  showTrending: boolean;
  preferredStyles: string[];
  preferredOccasions: string[];
  contentTypes: ('outfit' | 'item' | 'inspiration')[];
}

export function PersonalizedFeed({
  userId,
  onPostClick,
  onUserClick,
  onTagClick
}: PersonalizedFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [preferences, setPreferences] = useState<FeedPreferences>({
    showFollowing: true,
    showRecommended: true,
    showTrending: true,
    preferredStyles: [],
    preferredOccasions: [],
    contentTypes: ['outfit', 'item', 'inspiration']
  });
  const [loading, setLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const feedSections = [
    { id: 'following', name: 'Seguindo', icon: UserGroupIcon, enabled: preferences.showFollowing },
    { id: 'recommended', name: 'Para Você', icon: SparklesIcon, enabled: preferences.showRecommended },
    { id: 'trending', name: 'Em Alta', icon: ArrowTrendingUpIcon, enabled: preferences.showTrending }
  ];

  const styleOptions = [
    'casual', 'formal', 'boho', 'minimalista', 'vintage', 'streetwear',
    'elegante', 'romântico', 'esportivo', 'alternativo'
  ];

  const occasionOptions = [
    'trabalho', 'casual', 'festa', 'encontro', 'viagem', 'exercício',
    'evento-especial', 'dia-a-dia'
  ];

  useEffect(() => {
    loadPersonalizedFeed();
    loadStyleRecommendations();
  }, [userId, preferences]);

  const loadPersonalizedFeed = async () => {
    setLoading(true);
    try {
      // Determine feed type based on preferences
      let feedType: 'following' | 'discover' | 'personal' = 'discover';
      if (preferences.showFollowing && !preferences.showRecommended) {
        feedType = 'following';
      } else if (!preferences.showFollowing && !preferences.showRecommended && preferences.showTrending) {
        feedType = 'discover';
      }

      const response = await socialApi.getFeed({
        feedType,
        page: 1,
        limit: 20
      });

      setPosts(response.posts);
    } catch (error) {
      console.error('Failed to load personalized feed:', error);
      // Fallback to mock data if API fails
      const mockPosts: SocialPost[] = [
        {
          id: '1',
          userId: 'user1',
          postType: 'outfit',
          content: {
            title: 'Look minimalista para o trabalho',
            description: 'Apostei no minimalismo hoje: blazer estruturado + calça alfaiataria. Menos é mais!',
            imageUrls: ['/api/placeholder/400/600'],
            tags: ['minimalista', 'trabalho', 'blazer', 'alfaiataria']
          },
          wardrobeItemIds: ['item1', 'item2'],
          engagementStats: { likes: 156, comments: 23, shares: 8 },
          visibility: 'public',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'user1',
            profile: {
              name: 'Sofia Mendes',
              username: 'sofia_minimal',
              profilePicture: '/api/placeholder/40/40'
            },
            badges: [{ id: '1', type: 'stylist', name: 'Stylist', description: 'Consultora de estilo' }]
          }
        }
      ];
      setPosts(mockPosts);
    } finally {
      setLoading(false);
    }
  };

  const loadStyleRecommendations = async () => {
    // Mock style recommendations
    const mockRecommendations: StyleRecommendation[] = [
      {
        type: 'similar_style',
        confidence: 0.85,
        items: [],
        reason: 'Baseado no seu interesse por looks minimalistas',
        basedOn: {
          userPosts: []
        }
      }
    ];

    setRecommendations(mockRecommendations);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        setLikedPosts(prev => new Set(prev).add(postId));
      } else {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }

      // Update post engagement stats
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
            ...post,
            engagementStats: {
              ...post.engagementStats,
              likes: post.engagementStats.likes + (isLiked ? 1 : -1)
            }
          }
          : post
      ));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      if (savedPosts.has(postId)) {
        // Unsave
        setSavedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        // TODO: API call to unsave
      } else {
        // Save
        setSavedPosts(prev => new Set(prev).add(postId));
        // TODO: API call to save
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const updatePreferences = (newPreferences: Partial<FeedPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Agora há pouco';
    if (diffInHours < 24) return `${diffInHours}h atrás`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;

    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feed Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seu Feed</h1>
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
          <span>Personalizar</span>
        </button>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Preferências do Feed
          </h3>

          {/* Feed Sections */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Seções do Feed</h4>
            <div className="space-y-2">
              {feedSections.map((section) => (
                <label key={section.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(e) => {
                      const key = `show${section.id.charAt(0).toUpperCase() + section.id.slice(1)}` as keyof FeedPreferences;
                      updatePreferences({ [key]: e.target.checked });
                    }}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <section.icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{section.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Styles */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Estilos Preferidos</h4>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    const newStyles = preferences.preferredStyles.includes(style)
                      ? preferences.preferredStyles.filter(s => s !== style)
                      : [...preferences.preferredStyles, style];
                    updatePreferences({ preferredStyles: newStyles });
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${preferences.preferredStyles.includes(style)
                      ? 'bg-pink-100 text-pink-800 border border-pink-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tipos de Conteúdo</h4>
            <div className="flex space-x-4">
              {[
                { id: 'outfit', name: 'Looks' },
                { id: 'item', name: 'Peças' },
                { id: 'inspiration', name: 'Inspiração' }
              ].map((type) => (
                <label key={type.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={preferences.contentTypes.includes(type.id as any)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...preferences.contentTypes, type.id as any]
                        : preferences.contentTypes.filter(t => t !== type.id);
                      updatePreferences({ contentTypes: newTypes });
                    }}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">{type.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Style Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-[#fff7d7] to-[#fff7d7]/50 border border-[#00132d]/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <SparklesIcon className="h-5 w-5 text-[#00132d]" />
            <h3 className="font-semibold text-gray-900">Recomendado para Você</h3>
          </div>
          <p className="text-sm text-gray-700">
            {recommendations[0].reason}
          </p>
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Post Content */}
            <div className="px-4 pt-4 pb-3">
              {post.content.title && (
                <h2 className="font-semibold text-gray-900 mb-2">
                  {post.content.title}
                </h2>
              )}
              {post.content.description && (
                <p className="text-gray-700 mb-3">
                  {post.content.description}
                </p>
              )}

              {/* Tags */}
              {post.content.tags && post.content.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.content.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onTagClick(tag)}
                      className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Post Image */}
            <div className="relative">
              <img
                src={post.content.imageUrls[0]}
                alt={post.content.title}
                className="w-full h-auto object-cover cursor-pointer"
                onClick={() => onPostClick(post)}
              />

              {/* Post type badge */}
              <div className="absolute top-3 left-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${post.postType === 'outfit' ? 'bg-pink-100 text-pink-800' :
                    post.postType === 'item' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                  }`}>
                  {post.postType === 'outfit' ? 'Look' :
                    post.postType === 'item' ? 'Peça' : 'Inspiração'}
                </span>
              </div>
            </div>

            {/* User Interaction Panel */}
            <div className="p-4">
              <UserInteractionPanel
                post={post}
                onLike={handleLike}
                onComment={() => onPostClick(post)}
                onShare={() => console.log('Share post:', post.id)}
                onReport={() => console.log('Report post:', post.id)}
                onUserClick={onUserClick}
              />
            </div>

            {/* Comments Preview */}
            {post.comments && post.comments.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <CommentSystem
                  postId={post.id}
                  initialComments={post.comments.slice(0, 3)} // Show first 3 comments
                  onCommentAdded={(comment) => {
                    setPosts(prev => prev.map(p =>
                      p.id === post.id
                        ? {
                          ...p,
                          engagementStats: {
                            ...p.engagementStats,
                            comments: p.engagementStats.comments + 1
                          }
                        }
                        : p
                    ));
                  }}
                  onCommentDeleted={(commentId) => {
                    setPosts(prev => prev.map(p =>
                      p.id === post.id
                        ? {
                          ...p,
                          engagementStats: {
                            ...p.engagementStats,
                            comments: Math.max(0, p.engagementStats.comments - 1)
                          }
                        }
                        : p
                    ));
                  }}
                />

                {post.engagementStats.comments > 3 && (
                  <button
                    onClick={() => onPostClick(post)}
                    className="text-sm text-gray-500 hover:text-gray-700 mt-2"
                  >
                    Ver todos os {post.engagementStats.comments} comentários
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
            <span>Carregando seu feed personalizado...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Seu feed está vazio
          </h3>
          <p className="text-gray-500 mb-4">
            Siga mais pessoas ou ajuste suas preferências para ver conteúdo personalizado
          </p>
          <button
            onClick={() => setShowPreferences(true)}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Personalizar Feed
          </button>
        </div>
      )}
    </div>
  );
}