'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  HeartIcon,
  ShoppingBagIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// Mock marketplace data
const mockMarketplaceItems = [
  {
    id: '1',
    name: 'Blazer Preto Zara',
    brand: 'Zara',
    size: 'M',
    condition: 'excellent',
    originalPrice: 299.90,
    currentPrice: 150.00,
    images: ['/api/placeholder/300/400'],
    seller: {
      name: 'Maria Santos',
      avatar: '/api/placeholder/40/40',
      rating: 4.8,
      location: 'São Paulo, SP'
    },
    postedAt: '2024-01-15',
    isFavorite: false,
    category: 'outerwear',
    description: 'Blazer em excelente estado, usado poucas vezes. Perfeito para looks profissionais.',
    tags: ['profissional', 'blazer', 'preto']
  },
  {
    id: '2',
    name: 'Vestido Floral Farm',
    brand: 'Farm',
    size: 'P',
    condition: 'new',
    originalPrice: 259.90,
    currentPrice: 180.00,
    images: ['/api/placeholder/300/500'],
    seller: {
      name: 'Ana Costa',
      avatar: '/api/placeholder/40/40',
      rating: 4.9,
      location: 'Rio de Janeiro, RJ'
    },
    postedAt: '2024-01-14',
    isFavorite: true,
    category: 'dresses',
    description: 'Vestido novo com etiqueta, nunca usado. Estampa exclusiva da coleção verão.',
    tags: ['floral', 'novo', 'verão']
  },
  {
    id: '3',
    name: 'Tênis Nike Air Force',
    brand: 'Nike',
    size: '37',
    condition: 'good',
    originalPrice: 499.90,
    currentPrice: 280.00,
    images: ['/api/placeholder/300/300'],
    seller: {
      name: 'Julia Lima',
      avatar: '/api/placeholder/40/40',
      rating: 4.7,
      location: 'Belo Horizonte, MG'
    },
    postedAt: '2024-01-13',
    isFavorite: false,
    category: 'shoes',
    description: 'Tênis em bom estado, com sinais normais de uso. Muito confortável.',
    tags: ['tênis', 'nike', 'branco']
  }
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [condition, setCondition] = useState('all');
  const [marketplaceItems, setMarketplaceItems] = useState(mockMarketplaceItems);

  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'tops', label: 'Blusas e Camisetas' },
    { value: 'bottoms', label: 'Calças e Saias' },
    { value: 'dresses', label: 'Vestidos' },
    { value: 'shoes', label: 'Calçados' },
    { value: 'accessories', label: 'Acessórios' },
    { value: 'outerwear', label: 'Casacos e Jaquetas' },
  ];

  const priceRanges = [
    { value: 'all', label: 'Todos os Preços' },
    { value: '0-50', label: 'Até R$ 50' },
    { value: '50-100', label: 'R$ 50 - R$ 100' },
    { value: '100-200', label: 'R$ 100 - R$ 200' },
    { value: '200-500', label: 'R$ 200 - R$ 500' },
    { value: '500+', label: 'Acima de R$ 500' },
  ];

  const conditions = [
    { value: 'all', label: 'Todas as Condições' },
    { value: 'new', label: 'Novo com Etiqueta' },
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bom' },
    { value: 'fair', label: 'Regular' },
  ];

  const conditionLabels = {
    new: 'Novo',
    excellent: 'Excelente',
    good: 'Bom',
    fair: 'Regular',
    poor: 'Desgastado',
  };

  const conditionColors = {
    new: 'bg-green-100 text-green-800',
    excellent: 'bg-emerald-100 text-emerald-800',
    good: 'bg-yellow-100 text-yellow-800',
    fair: 'bg-orange-100 text-orange-800',
    poor: 'bg-red-100 text-red-800',
  };

  const handleToggleFavorite = (itemId: string) => {
    setMarketplaceItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const filteredItems = marketplaceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCondition = condition === 'all' || item.condition === condition;
    
    let matchesPrice = true;
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
      matchesPrice = item.currentPrice >= min && (max ? item.currentPrice <= max : true);
    }
    
    return matchesSearch && matchesCategory && matchesCondition && matchesPrice;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    return `${diffInDays} dias atrás`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marketplace
          </h1>
          <p className="text-gray-600">
            Descubra peças únicas e venda itens do seu guarda-roupa
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por item, marca, vendedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {conditions.map(cond => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>

              <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <FunnelIcon className="h-5 w-5" />
                <span>Mais Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}
          </p>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
            <option>Mais Recentes</option>
            <option>Menor Preço</option>
            <option>Maior Preço</option>
            <option>Mais Populares</option>
          </select>
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="marketplace-item">
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300" />
                  
                  {/* Top Actions */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${conditionColors[item.condition as keyof typeof conditionColors]}`}>
                      {conditionLabels[item.condition as keyof typeof conditionLabels]}
                    </span>
                    
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="p-2 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                    >
                      {item.isFavorite ? (
                        <HeartSolidIcon className="h-4 w-4 text-red-500" />
                      ) : (
                        <HeartIcon className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-white bg-opacity-95 rounded-lg px-3 py-2">
                      <div className="text-lg font-bold text-gray-900">
                        R$ {item.currentPrice.toFixed(2)}
                      </div>
                      {item.originalPrice > item.currentPrice && (
                        <div className="text-xs text-gray-500 line-through">
                          R$ {item.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span>{item.brand}</span>
                    <span>Tam: {item.size}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Seller Info */}
                  <div className="flex items-center space-x-2 mb-3 pb-3 border-b border-gray-100">
                    <img
                      src={item.seller.avatar}
                      alt={item.seller.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {item.seller.name}
                        </span>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-600 ml-1">
                            {item.seller.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {item.seller.location}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {formatTimeAgo(item.postedAt)}
                    </div>
                    <Button size="sm" className="flex items-center space-x-1">
                      <ShoppingBagIcon className="h-4 w-4" />
                      <span>Comprar</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Tente ajustar os filtros ou buscar por outros termos.
            </p>
            <Button variant="outline">
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* Load More */}
        {filteredItems.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Carregar Mais Itens
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}