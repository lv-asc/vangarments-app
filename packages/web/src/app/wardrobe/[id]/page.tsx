// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import toast from 'react-hot-toast';
import {
  ShoppingBagIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  PhotoIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Switch } from '@/components/ui/Switch';
import BackgroundMaskEditor from '@/components/wardrobe/BackgroundMaskEditor';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface WardrobeItem {
  id: string;
  vufsCode: string;
  ownerId: string;
  category: {
    id?: string;
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
    [key: string]: any;
  };
  categoryId?: string;
  brand: {
    id?: string;
    brand: string;
    line?: string;
    [key: string]: any;
  };
  brandId?: string;
  sizeId?: string;
  metadata: {
    name: string;
    composition: Array<{ name?: string; material?: string; percentage: number }>;
    colors: Array<{ name?: string; primary?: string; hex?: string }>;
    careInstructions: string[];
    size?: string;
    pattern?: string;
    fit?: string;
    [key: string]: any;
  };
  condition: {
    status: string;
    description?: string;
  };
  images?: Array<{ url: string; type: string; isPrimary: boolean; id: string; aiAnalysis?: any }>;
  createdAt: string;
  [key: string]: any;
}

interface Attribute {
  slug: string;
  name: string;
  value: string;
  isHidden: boolean;
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
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [showOriginalBackground, setShowOriginalBackground] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const [currentEditorImages, setCurrentEditorImages] = useState<{ original: string, processed: string } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Hidden Fields State
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [hiddenSectionOpen, setHiddenSectionOpen] = useState(false);

  // Message Modal State
  const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'error' }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    if (params.id) {
      loadItem();
    }
  }, [params.id]);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        itemResponse,
        settingsRes,
        typesRes,
        catAttsRes,
        brandAttsRes,
        sizeAttsRes
      ] = await Promise.all([
        apiClient.getWardrobeItem(params.id as string),
        apiClient.getVUFSSettings().catch(e => ({})),
        apiClient.getVUFSAttributeTypes().catch(e => []),
        apiClient.getAllCategoryAttributes().catch(e => []),
        apiClient.getAllBrandAttributes().catch(e => []),
        apiClient.getAllSizeAttributes().catch(e => [])
      ]);

      const fetchedItem = itemResponse.item;
      setItem(fetchedItem);

      const typesData = (typesRes as any).types || typesRes || [];
      const hiddenCols = (settingsRes as any).hidden_wardrobe_columns || [];
      const catAtts = (catAttsRes as any).attributes || catAttsRes || [];
      const brandAtts = (brandAttsRes as any).attributes || brandAttsRes || [];
      const sizeAtts = (sizeAttsRes as any).attributes || sizeAttsRes || [];

      const catId = fetchedItem.categoryId || fetchedItem.category?.id;
      const brandId = fetchedItem.brandId || fetchedItem.brand?.id;
      const sizeId = fetchedItem.sizeId;

      const foundAttributes: Attribute[] = [];

      const addAttribute = (slug: string, value: string) => {
        const typeDef = typesData.find((t: any) => t.slug === slug);
        const name = typeDef ? typeDef.name : slug;
        foundAttributes.push({
          slug,
          name,
          value,
          isHidden: hiddenCols.includes(slug)
        });
      };

      if (catId) {
        catAtts.filter((a: any) => a.category_id === catId).forEach((a: any) => addAttribute(a.attribute_slug, a.value));
      }
      if (brandId) {
        brandAtts.filter((a: any) => a.brand_id === brandId).forEach((a: any) => addAttribute(a.attribute_slug, a.value));
      }
      if (sizeId) {
        sizeAtts.filter((a: any) => a.size_id === sizeId).forEach((a: any) => addAttribute(a.attribute_slug, a.value));
      }

      setAttributes(foundAttributes);

    } catch (err: any) {
      console.error('Error loading item:', err);
      setError(err.message || 'Falha ao carregar item');
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (title: string, message: string, type: 'info' | 'error' = 'info') => {
    setMessageModal({ isOpen: true, title, message, type });
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
      showMessage('Erro', 'Falha ao excluir item: ' + (err.message || 'Erro desconhecido'), 'error');
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
      showMessage('Sucesso', 'Link copiado para a área de transferência!', 'info');
    }
  };

  const handleRemoveBackground = async () => {
    if (!item) return;

    let imagesToProcess = [];
    if (selectedImages.size > 0) {
      imagesToProcess = Array.from(selectedImages).map(id => item.images?.find(img => img.id === id)).filter(Boolean);
    } else {
      // Process current selected image if nothing explicitly selected
      const currentImage = item.images?.[selectedImageIndex];
      if (currentImage && currentImage.type !== 'background_removed') {
        imagesToProcess = [currentImage];
      }
    }

    if (imagesToProcess.length === 0) return;

    setIsRemovingBackground(true);
    try {
      const response = await apiClient.batchRemoveBackground(
        item.id,
        imagesToProcess.map(img => img!.id),
        { model: 'medium', quality: 1.0 }
      );

      // Refresh item to get new images
      // Or manually update state if response contains new images
      // Since batch endpoint returns multiple, maybe simpler to reload item or merge
      // Assuming response.results is array of new images
      if (response.results) {
        const newImages = [...(item.images || [])];
        const addedImages: any[] = [];

        response.results.forEach((res: any) => {
          if (res.image) {
            newImages.push(res.image);
            addedImages.push(res.image);
          }
        });

        setItem({ ...item, images: newImages });
        setShowOriginalBackground(false);
        setSelectedImages(new Set());
        setIsSelectionMode(false);
        toast.success(`${response.results.length} imagens processadas`);

        // Auto-open editor for the current image if it was processed
        const currentOriginalId = item.images?.[selectedImageIndex]?.id;
        if (currentOriginalId) {
          const newProcessed = addedImages.find(img => img.aiAnalysis?.originalImageId === currentOriginalId);
          const originalImg = item.images?.[selectedImageIndex];

          if (newProcessed && originalImg) {
            setCurrentEditorImages({
              original: getImageUrl(originalImg.url),
              processed: getImageUrl(newProcessed.url)
            });
            setShowMaskEditor(true);
          }
        }
      }

    } catch (err: any) {
      showMessage('Erro', 'Falha ao remover fundo: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleOpenMaskEditor = () => {
    const currentImage = item?.images?.[selectedImageIndex];
    if (!item || !currentImage) return;

    // Logic to find pair:
    // If current is original, find processed
    // If current is processed, find original
    let original = currentImage;
    let processed = null;

    const isProcessed = (img: any) => img.type === 'background_removed' || img.imageType === 'background_removed';

    if (isProcessed(currentImage)) {
      processed = currentImage;
      original = item.images?.find(img => img.id === currentImage.aiAnalysis?.originalImageId) || null;
    } else {
      original = currentImage;
      processed = item.images?.find(img => isProcessed(img) && img.aiAnalysis?.originalImageId === original.id);
    }

    // If we are showing original but want to edit, we need the processed one
    if (!showOriginalBackground && isProcessed(currentImage)) {
      // Already have processed selected
    } else if (!showOriginalBackground && processed) {
      // view shows processed but maybe thumbnail logic selected original?
      // Anyway find the pair
    }

    // Simplify:
    // We need both URLs.
    // If we don't have a processed version, we can't edit mask. (Maybe creating one? No, that's remove background)

    if (!original || !processed) {
      showMessage('Aviso', 'Versão sem fundo não encontrada para edição.', 'info');
      return;
    }

    setCurrentEditorImages({
      original: getImageUrl(original.url),
      processed: getImageUrl(processed.url)
    });
    setShowMaskEditor(true);
  };

  const handleSaveMask = async (blob: Blob) => {
    if (!item || !currentEditorImages) return;

    // Find the currently active processed image ID we are editing
    // Re-find based on URLs might be brittle, better store IDs.
    // But let's assume single processed version per original for now or just grab the one we found earlier
    // We need original Image ID to upload to correct endpoint

    // Re-find processed image object from state to get 'originalImageId' relation
    const processedImgObj = item.images?.find(img => getImageUrl(img.url) === currentEditorImages.processed);
    const originalId = processedImgObj?.aiAnalysis?.originalImageId;

    if (!originalId) return;

    try {
      const res = await apiClient.saveProcessedImage(item.id, originalId, blob);
      // Update state
      const newImage = res.image;
      // Replace old processed image in state
      const newImages = item.images?.map(img => img.id === processedImgObj.id ? newImage : img) || [];
      setItem({ ...item, images: newImages });

      setShowMaskEditor(false);
      toast.success('Máscara atualizada com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error('Falha ao salvar máscara');
    }
  };

  const toggleImageSelection = (imageId: string) => {
    const newSet = new Set(selectedImages);
    if (newSet.has(imageId)) {
      newSet.delete(imageId);
    } else {
      newSet.add(imageId);
    }
    setSelectedImages(newSet);
  };

  const handleUndoBackgroundRemoval = async () => {
    if (!item || !item.images) return;
    const currentOriginalImage = item.images[selectedImageIndex];
    if (!currentOriginalImage) return;

    const bgRemovedImage = item.images.find(img =>
      (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
      img.aiAnalysis?.originalImageId === currentOriginalImage.id
    );

    if (!bgRemovedImage) return;

    setIsDeletingImage(true);
    try {
      await apiClient.deleteWardrobeItemImage(item.id, bgRemovedImage.id);

      const updatedImages = item.images.filter(img => img.id !== bgRemovedImage.id);
      setItem({
        ...item,
        images: updatedImages
      });
      setShowOriginalBackground(true);
      setShowUndoConfirm(false);
    } catch (err: any) {
      showMessage('Erro', 'Falha ao desfazer remoção: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setIsDeletingImage(false);
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

  const visibleAttributes = attributes.filter(a => !a.isHidden);
  const hiddenAttributes = attributes.filter(a => a.isHidden);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <span>←</span>
            <span>Voltar</span>
          </Button>

          {item.images && item.images.length > 0 && (
            <div className="flex items-center space-x-2">
              {item.images.some(img =>
                (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
                (img.aiAnalysis?.originalImageId === item.images[selectedImageIndex]?.id ||
                  item.images[selectedImageIndex]?.id === img.id)
              ) ? (
                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`flex items-center space-x-3 px-3 py-1.5 ${!showOriginalBackground ? 'border-r border-gray-200' : ''}`}>
                    <span className={`text-xs font-medium ${showOriginalBackground ? 'text-gray-900' : 'text-gray-500'}`}>Original</span>
                    <Switch
                      checked={!showOriginalBackground}
                      onCheckedChange={(checked) => setShowOriginalBackground(!checked)}
                    />
                    <span className={`text-xs font-medium ${!showOriginalBackground ? 'text-gray-900' : 'text-gray-500'}`}>Sem Fundo</span>
                  </div>
                  {!showOriginalBackground && (
                    <>
                      <button
                        type="button"
                        className="px-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                        onClick={() => setShowUndoConfirm(true)}
                        disabled={isDeletingImage}
                        title="Remover versão sem fundo"
                      >
                        {isDeletingImage ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="px-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none border-l border-gray-200"
                        onClick={handleOpenMaskEditor}
                        title="Editar Máscara"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={handleRemoveBackground}
                  loading={isRemovingBackground}
                >
                  <PhotoIcon className="h-4 w-4 mr-1 text-gray-500" />
                  {selectedImages.size > 0 ? `Remover Fundo (${selectedImages.size})` : 'Remover Fundo'}
                </Button>
              )
              }
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative max-h-[500px] flex items-center justify-center">
              <div className="w-full aspect-square">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={getImageUrl(
                      (!showOriginalBackground &&
                        item.images.find(img => (img.type === 'background_removed' || (img as any).imageType === 'background_removed') &&
                          (img.aiAnalysis?.originalImageId === item.images?.[selectedImageIndex]?.id ||
                            item.images?.[selectedImageIndex]?.type === 'background_removed' || (item.images?.[selectedImageIndex] as any)?.imageType === 'background_removed'))?.url)
                      || item.images[selectedImageIndex]?.url
                      || item.images[0].url
                    )}
                    alt={item.metadata.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {item.images && item.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={isSelectionMode ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedImages(new Set());
                  }}
                >
                  {isSelectionMode ? 'Cancelar' : 'Selecionar'}
                </Button>

                {item.images
                  .filter(img => img.type !== 'background_removed' && (img as any).imageType !== 'background_removed')
                  .map((image, index) => {
                    const originalIndex = item.images!.indexOf(image);

                    // Logic to figure out which thumbnail to show (original or processed) based on global toggle
                    // but independent of selection mode (which acts on original mostly?)
                    // Actually if we select for generic batch processing, we usually select Originals.

                    let thumbnailUrl = image.url;
                    if (!showOriginalBackground) {
                      const bgRemovedImg = item.images!.find(img =>
                        img.type === 'background_removed' &&
                        img.aiAnalysis?.originalImageId === image.id
                      );
                      if (bgRemovedImg) thumbnailUrl = bgRemovedImg.url;
                    }

                    const isSelected = selectedImages.has(image.id);

                    return (
                      <div key={index} className="relative group">
                        <button
                          onClick={() => {
                            if (isSelectionMode) {
                              toggleImageSelection(image.id);
                            } else {
                              setSelectedImageIndex(originalIndex);
                            }
                          }}
                          className={`w-16 h-20 rounded border-2 overflow-hidden flex-shrink-0 relative ${selectedImageIndex === originalIndex ? 'border-[#00132d]' : 'border-gray-200'}
                                ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}
                            `}
                        >
                          <img
                            src={getImageUrl(thumbnailUrl)}
                            alt={`${item.metadata.name} ${index + 1}`}
                            className={`w-full h-full object-cover ${!showOriginalBackground && thumbnailUrl !== image.url ? 'p-1 object-contain' : ''}`}
                          />

                        </button>
                        {isSelectionMode && (
                          <div className="absolute top-1 right-1 pointer-events-none">
                            {isSelected ? (
                              <CheckCircleIcon className="h-5 w-5 text-indigo-600 bg-white rounded-full" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-white bg-black/20" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="space-y-6">
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

            {item.metadata.colors && item.metadata.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Cores</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {item.metadata.colors.map((color, index) => {
                    const colorName = color.name || color.primary || '';
                    return colorName ? (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color.hex || '#6b7280' }}
                        />
                        <span className="text-sm text-gray-600">{colorName}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {item.metadata.composition && item.metadata.composition.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Composição</h3>
                <div className="space-y-1">
                  {item.metadata.composition.map((comp, index) => {
                    const materialName = comp.name || comp.material || '';
                    return materialName ? (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{materialName}</span>
                        <span className="text-gray-900">{comp.percentage}%</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Categoria</h3>
              <div className="text-sm text-gray-600">
                {[item.category.page, item.category.blueSubcategory, item.category.whiteSubcategory]
                  .filter((cat, idx, arr) => cat && arr.indexOf(cat) === idx)
                  .join(' → ')}
              </div>
            </div>

            {item.metadata.size && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Tamanho</h3>
                <div className="text-sm text-gray-600">{item.metadata.size}</div>
              </div>
            )}

            {visibleAttributes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Detalhes</h3>
                <div className="grid grid-cols-2 gap-4">
                  {visibleAttributes.map(attr => (
                    <div key={attr.slug}>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{attr.name}</dt>
                      <dd className="text-sm text-gray-900 mt-1">{attr.value}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hiddenAttributes.length > 0 && (
              <div className="border rounded-lg overflow-hidden bg-gray-50/50">
                <button
                  onClick={() => setHiddenSectionOpen(!hiddenSectionOpen)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <EyeSlashIcon className="h-4 w-4 text-gray-500" />
                    <span>Campos Ocultos ({hiddenAttributes.length})</span>
                  </div>
                  {hiddenSectionOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </button>

                {hiddenSectionOpen && (
                  <div className="p-4 border-t border-gray-200 bg-white grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                    {hiddenAttributes.map(attr => (
                      <div key={attr.slug}>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{attr.name}</dt>
                        <dd className="text-sm text-gray-900 mt-1">{attr.value}</dd>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

            <div className="space-y-3 pt-6 border-t border-gray-200">
              <Button
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleSellItem}
              >
                <ShoppingBagIcon className="h-5 w-5 mr-1" />
                <span>Vender no Marketplace</span>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleEditItem}>
                  <PencilIcon className="h-4 w-4 mr-1" />
                  <span>Editar</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  <span>Excluir</span>
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Adicionado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog for Item Deletion */}
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

      {/* Confirmation Dialog for Undo Background Removal */}
      <ConfirmDialog
        isOpen={showUndoConfirm}
        onClose={() => setShowUndoConfirm(false)}
        onConfirm={handleUndoBackgroundRemoval}
        title="Desfazer Remoção de Fundo"
        message="Tem certeza que deseja excluir a versão sem fundo desta foto? Você precisará processá-la novamente se mudar de ideia."
        confirmLabel="Excluir"
        cancelLabel="Manter"
        variant="danger"
        loading={isDeletingImage}
      />

      {/* Simple Information / Error Modal */}
      <ConfirmDialog
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        onConfirm={() => setMessageModal({ ...messageModal, isOpen: false })}
        title={messageModal.title}
        message={messageModal.message}
        confirmLabel="OK"
        variant={messageModal.type === 'error' ? 'danger' : 'primary'}
      />

      {/* Mask Editor Modal */}
      {showMaskEditor && currentEditorImages && (
        <BackgroundMaskEditor
          isOpen={showMaskEditor}
          onCancel={() => setShowMaskEditor(false)}
          onSave={handleSaveMask}
          originalImageUrl={currentEditorImages.original}
          processedImageUrl={currentEditorImages.processed}
        />
      )}
    </div>
  );
}
