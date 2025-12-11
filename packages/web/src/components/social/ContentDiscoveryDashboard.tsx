// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import {
  FireIcon,
  SparklesIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  HashtagIcon,
  TrendingUpIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { SocialPost, ContentCategory, TrendingTag } from '@vangarments/shared';

interface ContentDiscoveryDashboardProps {
  onPostClick: (post: SocialPost) => void;
  onUserClick: (userId: string) => void;
  onTagClick: (tag: string) => void;
  onCategoryClick: (category: string) => void;
}

export function ContentDiscoveryDashboard({
  onPostClick,
  onUserClick,
  onTagClick,
  onCategoryClick
}: ContentDiscoveryDashboardProps) {
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const tabs = [
    { id: 'trending', name: 'Em Alta', icon: FireIcon, description: 'Conteúdo mais popular' },
    { id: 'new', name: 'Novidades', icon: SparklesIcon, description: 'Postagens recentes' },
    { id: 'following', name: 'Seguindo', icon: UserGroupIcon, description: 'De quem você segue' },
  ];

  const filterOptions = [
    { id: 'outfit', name: 'Looks', color: 'bg-pink-100 text-pink-800' },
    { id: 'item', name: 'Peças', color: 'bg-blue-100 text-blue-800' },
    { id: 'inspiration', name: 'Inspiração', color: 'bg-purple-100 text-purple-800' },
  ];

  // Mock data - replace with actual API calls
  useEffect(() => {
    loadContent();
    loadCategories();
    loadTrendingTags();
  }, [activeTab, selectedFilters]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Mock API call
      const mockPosts: SocialPost[] = [
        {
          id: '1',
          userId: 'user1',
          postType: 'outfit',
          content: {
            title: 'Look perfeito para o trabalho',
            description: 'Blazer + jeans = combinação certeira para um dia produtivo no escritório!',
            imageUrls: ['/api/placeholder/400/600'],
            tags: ['trabalho', 'casual-chic', 'blazer', 'jeans']
          },
          wardrobeItemIds: ['item1', 'item2'],
          engagementStats: { likes: 234, comments: 18, shares: 5 },
          visibility: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'user1',
            profile: {
              name: 'Ana Silva',
              username: 'ana_style',
              profilePicture: '/api/placeholder/40/40'
            },
            badges: [{ id: '1', type: 'influencer', name: 'Influencer', description: 'Influenciadora de moda' }]
          }
        },
        {
          id: '2',
          userId: 'user2',
          postType: 'outfit',
          content: {
            title: 'Vestido floral para almoço especial',
            description: 'Nada como um vestido floral para um almoço especial com as amigas',
            imageUrls: ['/api/placeholder/400/700'],
            tags: ['feminino', 'floral', 'almoço', 'elegante']
          },
          wardrobeItemIds: ['item3'],
          engagementStats: { likes: 189, comments: 12, shares: 3 },
          visibility: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'user2',
            profile: {
              name: 'Mariana Costa',
              username: 'mari_fashion',
              profilePicture: '/api/placeholder/40/40'
            }
          }
        }
      ];

      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    // Mock categories
    const mockCategories: ContentCategory[] = [
      { id: 'work', name: 'Trabalho', description: 'Looks profissionais', imageUrl: '/api/placeholder/200/200', postCount: 1234 },
      { id: 'casual', name: 'Casual', description: 'Dia a dia', imageUrl: '/api/placeholder/200/200', postCount: 2567 },
      { id: 'party', name: 'Festa', description: 'Eventos especiais', imageUrl: '/api/placeholder/200/200', postCount: 890 },
      { id: 'date', name: 'Encontro', description: 'Looks românticos', imageUrl: '/api/placeholder/200/200', postCount: 456 }
    ];

    setCategories(mockCategories);
  };

  const loadTrendingTags = async () => {
    // Mock trending tags
    const mockTags: TrendingTag[] = [
      { tag: 'blazer', postCount: 234, growth: 15.2 },
      { tag: 'jeans', postCount: 189, growth: 8.7 },
      { tag: 'vestido', postCount: 156, growth: 22.1 },
      { tag: 'casual-chic', postCount: 134, growth: 12.5 },
      { tag: 'trabalho', postCount: 98, growth: 18.9 }
    ];

    setTrendingTags(mockTags);
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleLike = async (postId: string) => {
    // TODO: Implement like functionality
    console.log('Like post:', postId);
  };

  const handleShare = async (postId: string) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Descobrir
        </h1>
        <p className="text-gray-600">
          Inspire-se com looks incríveis da nossa comunidade
        </p>
      </div>

      {/* Categories Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorias</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className="relative aspect-square rounded-xl overflow-hidden group hover:scale-105 transition-transform"
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all" />
              <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm opacity-90">{category.postCount} posts</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          <TrendingUpIcon className="h-6 w-6 inline mr-2" />
          Tags em Alta
        </h2>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <button
              key={tag.tag}
              onClick={() => onTagClick(tag.tag)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-pink-300 hover:bg-pink-50 transition-colors"
            >
              <HashtagIcon className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{tag.tag}</span>
              <span className="text-sm text-green-600">+{tag.growth}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar looks, usuárias, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Filtros:</span>
            </div>
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedFilters.includes(filter.id)
                    ? filter.color
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Grid */}
      <div className="masonry-grid">
        {posts.map((post) => (
          <div key={post.id} className="masonry-item">
            <div className="fashion-card overflow-hidden group cursor-pointer">
              {/* Image */}
              <div className="relative" onClick={() => onPostClick(post)}>
                <img
                  src={post.content.imageUrls[0]}
                  alt={post.content.title}
                  className="w-full h-auto object-cover"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    <EyeIcon className="h-4 w-4 inline mr-2" />
                    Ver Detalhes
                  </button>
                </div>

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

              {/* Content */}
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <button
                    onClick={() => onUserClick(post.userId)}
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={post.user?.profile.profilePicture || '/api/placeholder/32/32'}
                      alt={post.user?.profile.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {post.user?.profile.name}
                      </p>
                      {post.user?.profile.username && (
                        <p className="text-xs text-gray-500">
                          @{post.user.profile.username}
                        </p>
                      )}
                    </div>
                  </button>

                  {post.user?.badges && post.user.badges.length > 0 && (
                    <div className="flex space-x-1">
                      {post.user.badges.slice(0, 2).map((badge) => (
                        <span
                          key={badge.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          title={badge.description}
                        >
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title */}
                {post.content.title && (
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {post.content.title}
                  </h3>
                )}

                {/* Description */}
                {post.content.description && (
                  <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                    {post.content.description}
                  </p>
                )}

                {/* Tags */}
                {post.content.tags && post.content.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.content.tags.slice(0, 3).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => onTagClick(tag)}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-700 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                    {post.content.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{post.content.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-pink-500 transition-colors"
                    >
                      <HeartIcon className="w-5 h-5" />
                      <span className="text-sm">{post.engagementStats.likes}</span>
                    </button>
                    <button
                      onClick={() => onPostClick(post)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                      <span className="text-sm">{post.engagementStats.comments}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={loadContent}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Carregando...' : 'Carregar mais looks'}
          </button>
        </div>
      )}
    </div>
  );
}