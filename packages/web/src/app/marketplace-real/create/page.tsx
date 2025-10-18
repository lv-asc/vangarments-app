'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WardrobeItem {
  id: string;
  vufsCode: string;
  item: {
    brand: string;
    pieceType?: string;
    color?: string;
    size?: string;
    material?: string;
  };
  domain: string;
  images?: string[];
}

interface ListingFormData {
  itemId: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  condition: {
    status: string;
    description: string;
    defects?: string[];
    authenticity: string;
  };
  shipping: {
    domestic: {
      available: boolean;
      cost: number;
      estimatedDays: number;
      methods: string[];
    };
    international: {
      available: boolean;
    };
    handlingTime: number;
    returnPolicy: {
      accepted: boolean;
      period?: number;
      conditions?: string[];
      returnShipping: string;
    };
  };
  images: string[];
  category: string;
  tags: string[];
  location: {
    country: string;
    state?: string;
    city?: string;
  };
}

export default function CreateMarketplaceListingPage() {
  const router = useRouter();
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ListingFormData>({
    itemId: '',
    title: '',
    description: '',
    price: 0,
    condition: {
      status: 'good',
      description: '',
      authenticity: 'likely_authentic'
    },
    shipping: {
      domestic: {
        available: true,
        cost: 15,
        estimatedDays: 7,
        methods: ['correios']
      },
      international: {
        available: false
      },
      handlingTime: 2,
      returnPolicy: {
        accepted: true,
        period: 7,
        conditions: ['item_not_as_described'],
        returnShipping: 'buyer'
      }
    },
    images: [],
    category: '',
    tags: [],
    location: {
      country: 'Brazil',
      state: 'SP',
      city: 'São Paulo'
    }
  });

  useEffect(() => {
    loadWardrobeItems();
  }, []);

  const loadWardrobeItems = async () => {
    try {
      const response = await apiClient.getWardrobeItems();
      // Filter items that are not already listed
      const availableItems = response.items?.filter((item: WardrobeItem) => 
        !item.item || (item.item as any).operationalStatus !== 'published'
      ) || [];
      setWardrobeItems(availableItems);
    } catch (err) {
      console.error('Failed to load wardrobe items:', err);
      setError('Falha ao carregar itens do guarda-roupa');
    }
  };

  const handleItemSelect = (item: WardrobeItem) => {
    setSelectedItem(item);
    setFormData(prev => ({
      ...prev,
      itemId: item.id,
      title: `${item.item.brand} ${item.item.pieceType || ''}`.trim(),
      category: item.item.pieceType || item.domain.toLowerCase(),
      tags: [item.item.brand, item.item.color, item.item.material].filter(Boolean) as string[],
      images: item.images || []
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ListingFormData],
          [child]: grandchild ? {
            ...(prev[parent as keyof ListingFormData] as any)[child],
            [grandchild]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      setError('Selecione um item do seu guarda-roupa');
      return;
    }

    if (!formData.title || !formData.description || formData.price <= 0) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.createMarketplaceListing(formData);
      
      if (response.listing) {
        router.push('/marketplace-real');
      } else {
        throw new Error('Falha ao criar anúncio');
      }
    } catch (err: any) {
      console.error('Failed to create listing:', err);
      setError(err.message || 'Falha ao criar anúncio no marketplace');
    } finally {
      setLoading(false);
    }
  };

  const conditionOptions = [
    { value: 'new', label: 'Novo' },
    { value: 'dswt', label: 'Novo com etiqueta' },
    { value: 'never_used', label: 'Nunca usado' },
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bom' },
    { value: 'fair', label: 'Regular' }
  ];

  const authenticityOptions = [
    { value: 'guaranteed', label: 'Garantido autêntico' },
    { value: 'likely_authentic', label: 'Provavelmente autêntico' },
    { value: 'unknown', label: 'Não sei' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Criar Anúncio no Marketplace
          </h1>
          <p className="text-gray-600">
            Venda um item do seu guarda-roupa no marketplace
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Item Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              1. Selecionar Item do Guarda-roupa
            </h2>
            
            {wardrobeItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  Nenhum item disponível no seu guarda-roupa para venda.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/wardrobe')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Adicionar itens ao guarda-roupa
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wardrobeItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedItem?.id === item.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={`${item.item.brand} ${item.item.pieceType}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <PhotoIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">
                      {item.item.brand} {item.item.pieceType}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.item.color} • {item.item.size}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      VUFS: {item.vufsCode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <>
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  2. Informações Básicas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título do anúncio *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Nike Air Max 90 Branco"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Tênis, Camiseta, Jaqueta"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva o item, incluindo detalhes sobre o estado, uso, e características especiais..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço original (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.originalPrice || ''}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Nike, Tênis, Esportivo, Branco"
                    />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  3. Estado do Item
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condição *
                    </label>
                    <select
                      required
                      value={formData.condition.status}
                      onChange={(e) => handleInputChange('condition.status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {conditionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Autenticidade
                    </label>
                    <select
                      value={formData.condition.authenticity}
                      onChange={(e) => handleInputChange('condition.authenticity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {authenticityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição detalhada do estado
                    </label>
                    <textarea
                      rows={3}
                      value={formData.condition.description}
                      onChange={(e) => handleInputChange('condition.description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva sinais de uso, defeitos, ou qualquer detalhe importante sobre o estado do item..."
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  4. Envio e Políticas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custo de envio (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping.domestic.cost}
                      onChange={(e) => handleInputChange('shipping.domestic.cost', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo de entrega (dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.shipping.domestic.estimatedDays}
                      onChange={(e) => handleInputChange('shipping.domestic.estimatedDays', parseInt(e.target.value) || 7)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo de processamento (dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.shipping.handlingTime}
                      onChange={(e) => handleInputChange('shipping.handlingTime', parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período de devolução (dias)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.shipping.returnPolicy.period || 7}
                      onChange={(e) => handleInputChange('shipping.returnPolicy.period', parseInt(e.target.value) || 7)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="acceptReturns"
                        checked={formData.shipping.returnPolicy.accepted}
                        onChange={(e) => handleInputChange('shipping.returnPolicy.accepted', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="acceptReturns" className="ml-2 text-sm text-gray-700">
                        Aceitar devoluções
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando anúncio...' : 'Criar Anúncio'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}