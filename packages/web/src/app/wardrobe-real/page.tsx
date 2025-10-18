'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PhotoIcon,
  HeartIcon,
  ShoppingBagIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface WardrobeItem {
  id: string;
  vufsCode: string;
  ownerId: string;
  category: {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
  };
  brand: {
    brand: string;
    line?: string;
  };
  metadata: {
    name: string;
    composition: Array<{ name: string; percentage: number }>;
    colors: Array<{ name: string; hex?: string }>;
    careInstructions: string[];
  };
  condition: {
    status: string;
    description?: string;
  };
  images?: Array<{ url: string; type: string; isPrimary: boolean }>;
  createdAt: string;
}

export default function RealWardrobePage() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, [selectedCategory]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/wardrobe/items?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data.items || []);
      } else {
        console.error('Failed to load wardrobe items');
        // Show sample items for demonstration
        setItems(getSampleItems());
      }
    } catch (error) {
      console.error('Error loading wardrobe:', error);
      // Show sample items for demonstration
      setItems(getSampleItems());
    } finally {
      setLoading(false);
    }
  };

  const getSampleItems = (): WardrobeItem[] => [
    {
      id: '1',
      vufsCode: 'VG-001',
      ownerId: 'user1',
      category: {
        page: 'APPAREL',
        blueSubcategory: 'TOPS',
        whiteSubcategory: 'SHIRTS',
        graySubcategory: 'CASUAL_SHIRTS'
      },
      brand: {
        brand: 'Zara',
        line: 'Basic'
      },
      metadata: {
        name: 'Blusa Branca Básica',
        composition: [{ name: 'Algodão', percentage: 100 }],
        colors: [{ name: 'Branco', hex: '#FFFFFF' }],
        careInstructions: ['Lavar à máquina', 'Não usar alvejante']
      },
      condition: {
        status: 'excellent',
        description: 'Excelente estado, pouco uso'
      },
      images: [{ url: '/api/placeholder/300/400', type: 'front', isPrimary: true }],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      vufsCode: 'VG-002',
      ownerId: 'user1',
      category: {
        page: 'APPAREL',
        blueSubcategory: 'BOTTOMS',
        whiteSubcategory: 'JEANS',
        graySubcategory: 'SKINNY_JEANS'
      },
      brand: {
        brand: 'Levis',
        line: '511'
      },
      metadata: {
        name: 'Jeans Skinny Azul',
        composition: [
          { name: 'Algodão', percentage: 98 },
          { name: 'Elastano', percentage: 2 }
        ],
        colors: [{ name: 'Azul', hex: '#4169E1' }],
        careInstructions: ['Lavar à máquina água fria', 'Secar à sombra']
      },
      condition: {
        status: 'good',
        description: 'Bom estado, uso regular'
      },
      images: [{ url: '/api/placeholder/300/400', type: 'front', isPrimary: true }],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const categories = [
    { value: 'all', label: 'Todas as Peças' },
    { value: 'TOPS', label: 'Blusas e Camisas' },
    { value: 'BOTTOMS', label: 'Calças e Saias' },
    { value: 'DRESSES', label: 'Vestidos' },
    { value: 'OUTERWEAR', label: 'Casacos' },
    { value: 'SHOES', label: 'Calçados' },
    { value: 'ACCESSORIES', label: 'Acessórios' }
  ];

  const getConditionColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'excellent': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'excellent': return 'Excelente';
      case 'good': return 'Bom';
      case 'fair': return 'Regular';
      case 'poor': return 'Ruim';
      default: return status;
    }
  };

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  const handleViewItem = (item: WardrobeItem) => {
    router.push(`/wardrobe-real/${item.id}`);
  };

  const handleSellItem = (item: WardrobeItem) => {
    router.push(`/marketplace-real/create?itemId=${item.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Guarda-roupa</h1>
              <p className="text-gray-600">{items.length} peças catalogadas</p>
            </div>
            <Button 
              className="flex items-center space-x-2"
              onClick={() => setShowAddModal(true)}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Adicionar Peça</span>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar peças..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && loadItems()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00132d]"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00132d]"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                
                <Button variant="outline" onClick={loadItems}>
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Item Image */}
                <div className="relative aspect-[3/4] bg-gray-100">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0].url}
                      alt={item.metadata.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                  >
                    {favorites.has(item.id) ? (
                      <HeartSolidIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <HeartIcon className="h-4 w-4 text-gray-600" />
                    )}
                  </button>

                  {/* Condition Badge */}
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(item.condition.status)}`}>
                      {getConditionLabel(item.condition.status)}
                    </span>
                  </div>
                </div>

                {/* Item Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {item.metadata.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {item.brand.brand} {item.brand.line && `• ${item.brand.line}`}
                  </p>

                  <div className="flex items-center space-x-1 mb-3">
                    {item.metadata.colors.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: color.hex || '#gray' }}
                        title={color.name}
                      />
                    ))}
                    {item.metadata.colors.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{item.metadata.colors.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    {item.category.whiteSubcategory} • {item.vufsCode}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewItem(item)}
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleSellItem(item)}
                    >
                      <ShoppingBagIcon className="h-3 w-3 mr-1" />
                      Vender
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Seu guarda-roupa está vazio
            </h3>
            <p className="text-gray-600 mb-6">
              Comece adicionando suas primeiras peças para organizar e descobrir novas combinações.
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Adicionar Primeira Peça
            </Button>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Nova Peça</h2>
              <p className="text-gray-600 mb-6">
                Esta funcionalidade conectará com o sistema real de criação de itens VUFS.
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddModal(false);
                    // Navigate to real item creation
                    window.location.href = '/wardrobe/add';
                  }}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}