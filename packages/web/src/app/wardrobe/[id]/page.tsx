// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import {
  ShoppingBagIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  PhotoIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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

export default function WardrobeItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadItem();
    }
  }, [params.id]);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getWardrobeItem(params.id as string);
      setItem(response.item);
    } catch (err: any) {
      console.error('Error loading item:', err);
      setError(err.message || 'Falha ao carregar item');
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSellItem = () => {
    router.push(`/marketplace/create?itemId=${item?.id}`);
  };

  const handleEditItem = () => {
    router.push(`/wardrobe/${item?.id}/edit`);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!item) return;

    setDeleting(true);
    try {
      await apiClient.deleteWardrobeItem(item.id);
      router.push('/wardrobe');
    } catch (err: any) {
      alert('Falha ao excluir item: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item?.metadata.name,
        text: `Confira esta peça: ${item?.metadata.name} - ${item?.brand.brand}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Item não encontrado'}
            </h1>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            ←
            <span>Voltar</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {item.images && item.images.length > 0 ? (
                <img
                  src={getImageUrl(item.images[selectedImageIndex]?.url || item.images[0].url)}
                  alt={item.metadata.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {item.images && item.images.length > 1 && (
              <div className="flex space-x-2">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-20 rounded border-2 overflow-hidden ${selectedImageIndex === index ? 'border-[#00132d]' : 'border-gray-200'
                      }`}
                  >
                    <img
                      src={getImageUrl(image.url)}
                      alt={`${item.metadata.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{item.metadata.name}</h1>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    {isFavorite ? <HeartSolidIcon className="h-5 w-5 text-red-500" /> : <HeartIcon className="h-5 w-5" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <ShareIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <p className="text-lg text-gray-600 mb-2">
                {item.brand.brand} {item.brand.line && `• ${item.brand.line}`}
              </p>

              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getConditionColor(item.condition.status)}`}>
                  {getConditionLabel(item.condition.status)}
                </span>
                <span className="text-sm text-gray-500">Código: {item.vufsCode}</span>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Cores</h3>
              <div className="flex items-center space-x-2">
                {item.metadata.colors.map((color, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: color.hex || '#gray' }}
                    />
                    <span className="text-sm text-gray-600">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Composition */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Composição</h3>
              <div className="space-y-1">
                {item.metadata.composition.map((comp, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{comp.name}</span>
                    <span className="text-gray-900">{comp.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Categoria</h3>
              <div className="text-sm text-gray-600">
                {item.category.page} → {item.category.blueSubcategory} → {item.category.whiteSubcategory}
              </div>
            </div>

            {/* Care Instructions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Cuidados</h3>
              <ul className="space-y-1">
                {item.metadata.careInstructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>

            {/* Condition Description */}
            {item.condition.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Observações</h3>
                <p className="text-sm text-gray-600">{item.condition.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <Button
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleSellItem}
              >
                <ShoppingBagIcon className="h-5 w-5 mr-1" />
                <span>Vender no Marketplace</span>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleEditItem}
                  className="flex items-center justify-center space-x-2"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  <span>Editar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  <span>Excluir</span>
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Adicionado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Peça"
        message="Tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

