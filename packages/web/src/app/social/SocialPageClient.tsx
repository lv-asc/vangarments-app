// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { socialApi } from '@/lib/socialApi';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlusIcon,
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface SocialPost {
  id: string;
  userId: string;
  postType: 'outfit' | 'item' | 'inspiration';
  content: {
    title?: string;
    description?: string;
    imageUrls: string[];
    tags?: string[];
  };
  engagementStats: {
    likes: number;
    comments: number;
    shares: number;
  };
  user?: {
    id: string;
    profile: {
      name: string;
      profilePicture?: string;
    };
  };
  createdAt: string;
}

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'discover' | 'following' | 'personal'>('discover');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
  }, [feedType]);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await socialApi.getFeed({
        feedType,
        limit: 20
      });
      setPosts(response.posts || []);
    } catch (err: any) {
      console.error('Error loading feed:', err);
      setError(err.message || 'Falha ao carregar feed');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        await socialApi.unlikePost(postId);
      } else {
        await socialApi.likePost(postId);
      }

      const newLikedPosts = new Set(likedPosts);
      if (isLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);

      // Update post likes count
      setPosts(posts.map(post =>
        post.id === postId
          ? {
            ...post,
            engagementStats: {
              ...post.engagementStats,
              likes: post.engagementStats.likes + (isLiked ? -1 : 1)
            }
          }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'outfit': return 'Look';
      case 'item': return 'Peça';
      case 'inspiration': return 'Inspiração';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social</h1>
              <p className="text-gray-600">Descubra looks e inspirações da comunidade</p>
            </div>
            <Button
              className="flex items-center space-x-2"
              onClick={() => window.location.href = '/social/create'}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Criar Post</span>
            </Button>
          </div>

          {/* Feed Type Selector */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            {[
              { key: 'discover', label: 'Descobrir', icon: MagnifyingGlassIcon },
              { key: 'following', label: 'Seguindo', icon: UserGroupIcon },
              { key: 'personal', label: 'Meus Posts', icon: HeartIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFeedType(key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${feedType === key
                  ? 'bg-[#00132d] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 mb-2">{error}</p>
            <Button variant="outline" onClick={loadFeed} size="sm">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  </div>
                </div>
                <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {post.user?.profile.profilePicture ? (
                        <img
                          src={post.user.profile.profilePicture}
                          alt={post.user.profile.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#00132d] flex items-center justify-center">
                          <span className="text-[#fff7d7] text-sm font-bold">
                            {post.user?.profile.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {post.user?.profile.name || 'Usuário'}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{getPostTypeLabel(post.postType)}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${post.postType === 'outfit' ? 'bg-blue-100 text-blue-800' :
                      post.postType === 'item' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                      {getPostTypeLabel(post.postType)}
                    </span>
                  </div>
                </div>

                {/* Post Image */}
                {post.content.imageUrls && post.content.imageUrls.length > 0 && (
                  <div className="relative">
                    <img
                      src={post.content.imageUrls[0]}
                      alt={post.content.title || 'Post image'}
                      className="w-full h-96 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {post.content.imageUrls.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                        +{post.content.imageUrls.length - 1}
                      </div>
                    )}
                  </div>
                )}

                {/* Post Content */}
                <div className="p-6">
                  {post.content.title && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.content.title}
                    </h2>
                  )}

                  {post.content.description && (
                    <p className="text-gray-700 mb-4">
                      {post.content.description}
                    </p>
                  )}

                  {/* Tags */}
                  {post.content.tags && post.content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.content.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Engagement Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        {likedPosts.has(post.id) ? (
                          <HeartSolidIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <HeartIcon className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium">{post.engagementStats.likes}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                        <ChatBubbleLeftIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">{post.engagementStats.comments}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                        <ShareIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">{post.engagementStats.shares}</span>
                      </button>
                    </div>

                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feedType === 'following' ? 'Nenhum post de quem você segue' :
                feedType === 'personal' ? 'Você ainda não criou nenhum post' :
                  'Nenhum post encontrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {feedType === 'following' ? 'Siga outros usuários para ver seus posts aqui.' :
                feedType === 'personal' ? 'Compartilhe seus looks e inspirações com a comunidade.' :
                  'Seja o primeiro a compartilhar algo incrível!'}
            </p>
            <Button onClick={() => window.location.href = '/social/create'}>
              Criar Primeiro Post
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
