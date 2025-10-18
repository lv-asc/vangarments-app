'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { MagnifyingGlassIcon, FunnelIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface MarketplaceListing {
  id: string;
  itemId: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  condition: {
    status: string;
    description: string;
  };
  images: string[];
  status: string;
  views: number;
  likes: number;
  watchers: number;
  category: string;
  tags: string[];
  location: {
    country: string;
    state?: string;
    city?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MarketplaceFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  brand?: string;
  size?: string;
  color?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export default function RealMarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    page: 1,
    limit: 20,
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [categories, setCategories] = useState<any>({});
  const [stats, setStats] = useState<any>({});

  // Load marketplace data
  useEffect(() => {
    loadMarketplaceData();
    loadCategories();
    loadStats();
  }, [filters]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use enhanced search if there are filters, otherwise get basic listings
      const response = filters.search || filters.category || filters.brand || filters.minPrice || filters.maxPrice
        ? await apiClient.searchMarketplace({ q: filters.search, ...filters })
        : await apiClient.getMarketplaceItems(filters);
      
      setListings(response.listings || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });

      // Store search suggestions and facets if available
      if (response.suggestions) {
        console.log('Search suggestions:', response.suggestions);
      }
      if (response.facets) {
        console.log('Search facets:', response.facets);
      }
      if (response.recommendations) {
        console.log('Recommendations:', response.recommendations);
      }
    } catch (err: any) {
      console.error('Failed to load marketplace data:', err);
      setError(err.message || 'Failed to load marketplace listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.getMarketplaceCategories();
      setCategories(response.categories || {});
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.getMarketplaceStats();
      setStats(response.stats || {});
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const handleToggleLike = async (listingId: string) => {
    try {
      await apiClient.toggleMarketplaceLike(listingId);
      // Refresh the listing data to get updated like count
      loadMarketplaceData();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const formatPrice = (price: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatCondition = (condition: any) => {
    const conditionMap: Record<string, string> = {
      'new': 'Novo',
      'dswt': 'Novo com etiqueta',
      'never_used': 'Nunca usado',
      'excellent': 'Excelente',
      'good': 'Bom',
      'fair': 'Regular',
      'poor': 'Ruim'
    };
    return conditionMap[condition.status] || condition.status;
  };

  if (loading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando marketplace...</p>
        </div>
      </div>
    );
  }

  if (error && listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar marketplace</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMarketplaceData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marketplace Real
          </h1>
          <p className="text-gray-600">
            Compre e venda peças de moda com dados reais e persistentes
          </p>
          {stats.totalListings && (
            <div className="mt-4 flex gap-6 text-sm text-gray-500">
              <span>{stats.totalListings} anúncios ativos</span>
              <span>{stats.totalSellers} vendedores</span>
              <span>Preço médio: {formatPrice(stats.averagePrice)}</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por marca, categoria, ou descrição..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              >
                <option value="">Todas as categorias</option>
                {categories.apparel?.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {categories.footwear?.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="newest">Mais recentes</option>
                <option value="price_low">Menor preço</option>
                <option value="price_high">Maior preço</option>
                <option value="most_watched">Mais populares</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condição</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.condition || ''}
                  onChange={(e) => handleFilterChange('condition', e.target.value || undefined)}
                >
                  <option value="">Todas</option>
                  {categories.conditions?.map((condition: string) => (
                    <option key={condition} value={condition}>
                      {formatCondition({ status: condition })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço mínimo</label>
                <input
                  type="number"
                  placeholder="R$ 0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço máximo</label>
                <input
                  type="number"
                  placeholder="R$ 1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  placeholder="Ex: Nike, Adidas..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.brand || ''}
                  onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {loading ? 'Carregando...' : `${pagination.total} resultados encontrados`}
            </p>
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item encontrado</h3>
            <p className="text-gray-500 mb-4">
              Tente ajustar os filtros ou criar o primeiro anúncio no marketplace.
            </p>
            <button
              onClick={() => setFilters({ page: 1, limit: 20, sortBy: 'newest' })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative aspect-[3/4] bg-gray-200">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Like button */}
                  <button
                    onClick={() => handleToggleLike(listing.id)}
                    className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <HeartIcon className="h-5 w-5 text-gray-600" />
                  </button>

                  {/* Status badge */}
                  {listing.status !== 'active' && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                      {listing.status === 'sold' ? 'Vendido' : listing.status}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {listing.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(listing.price, listing.currency)}
                      </span>
                      {listing.originalPrice && listing.originalPrice > listing.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {formatPrice(listing.originalPrice, listing.currency)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatCondition(listing.condition)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{listing.category}</span>
                    <div className="flex items-center gap-2">
                      <span>{listing.views} visualizações</span>
                      <span>{listing.likes} curtidas</span>
                    </div>
                  </div>

                  {listing.tags && listing.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {listing.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-lg ${
                      pagination.page === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}