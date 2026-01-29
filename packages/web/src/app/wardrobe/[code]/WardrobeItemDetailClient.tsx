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
import BatchPreviewModal from '@/components/wardrobe/BatchPreviewModal';
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

export default function WardrobeItemDetailClient() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

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
    const [showBatchPreview, setShowBatchPreview] = useState(false);
    const [isDeletingImage, setIsDeletingImage] = useState(false);

    // Background Removal Options
    const [showBgOptions, setShowBgOptions] = useState(false);
    const [bgQuality, setBgQuality] = useState<'fast' | 'medium' | 'high'>('medium');
    const [bgFeatherRadius, setBgFeatherRadius] = useState(0);
    const [bgOutputRatio, setBgOutputRatio] = useState<'1:1' | '4:5' | '3:4' | 'original'>('original');
    const [batchPreviewItems, setBatchPreviewItems] = useState<Array<{
        id: string;
        originalUrl: string;
        processedUrl: string;
        originalId: string;
    }>>([]);
    const [pendingBatchImages, setPendingBatchImages] = useState<any[]>([]);

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
        if (code) {
            loadItem();
        }
    }, [code]);

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
                apiClient.getWardrobeItem(code),
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
        router.push(`/wardrobe/${item?.vufsCode}/edit`);
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
                {
                    quality: bgQuality,
                    featherRadius: bgFeatherRadius,
                    outputRatio: bgOutputRatio
                }
            );

            // Refresh item to get new images
            // Or manually update state if response contains new images
            // Since batch endpoint returns multiple, maybe simpler to reload item or merge
            // Assuming response.results is array of new images
            if (response.results) {
                const previewItems: typeof batchPreviewItems = [];
                const newProcessedImages: any[] = [];

                response.results.forEach((res: any) => {
                    if (res.image) {
                        newProcessedImages.push(res.image);
                        // Find the original image for this processed one
                        const originalImg = imagesToProcess.find((img: any) => img.id === res.image.aiAnalysis?.originalImageId);
                        if (originalImg) {
                            previewItems.push({
                                id: res.image.id,
                                originalUrl: originalImg.url,
                                processedUrl: res.image.url,
                                originalId: originalImg.id
                            });
                        }
                    }
                });

                // Store pending images and show preview
                setPendingBatchImages(newProcessedImages);
                setBatchPreviewItems(previewItems);
                setShowBatchPreview(true);
                setShowBgOptions(false);
            }

        } catch (err: any) {
            showMessage('Erro', 'Falha ao remover fundo: ' + (err.message || 'Erro desconhecido'), 'error');
        } finally {
            setIsRemovingBackground(false);
        }
    };

    // Batch Preview Handlers
    const handleBatchPreviewConfirm = async (selectedIds: string[]) => {
        if (!item) return;

        // Only keep the images that were selected
        const selectedImages = pendingBatchImages.filter(img => selectedIds.includes(img.id));

        if (selectedImages.length > 0) {
            const newImages = [...(item.images || []), ...selectedImages];
            setItem({ ...item, images: newImages });
            setShowOriginalBackground(false);
            setSelectedImages(new Set());
            setIsSelectionMode(false);
            toast.success(`${selectedImages.length} imagens salvas`);
        }

        // Clean up
        setShowBatchPreview(false);
        setBatchPreviewItems([]);
        setPendingBatchImages([]);
    };

    const handleBatchPreviewCancel = () => {
        // TODO: optionally delete the processed images from server if not confirmed
        setShowBatchPreview(false);
        setBatchPreviewItems([]);
        setPendingBatchImages([]);
        toast('Processamento cancelado', { icon: '⚠️' });
    };

    const handleOpenMaskEditor = () => {
        router.push(`/wardrobe/bg-editor/${item?.vufsCode}`);
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
                                <div className="relative">
                                    <div className="flex items-stretch">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-white rounded-r-none border-r-0"
                                            onClick={handleRemoveBackground}
                                            loading={isRemovingBackground}
                                        >
                                            <PhotoIcon className="h-4 w-4 mr-1 text-gray-500" />
                                            {selectedImages.size > 0 ? `Remover Fundo (${selectedImages.size})` : 'Remover Fundo'}
                                        </Button>
                                        <button
                                            type="button"
                                            className={`px-2 border border-l-0 border-gray-300 rounded-r-lg transition-colors ${showBgOptions ? 'bg-indigo-50 text-indigo-600' : 'bg-white hover:bg-gray-50 text-gray-500'}`}
                                            onClick={() => setShowBgOptions(!showBgOptions)}
                                            title="Opções de remoção"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Options Panel */}
                                    {showBgOptions && (
                                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-30 w-72">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Opções de Remoção</h4>

                                            {/* Quality */}
                                            <div className="mb-3">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qualidade</label>
                                                <div className="flex bg-gray-100 p-1 rounded-lg mt-1">
                                                    {(['fast', 'medium', 'high'] as const).map((q) => (
                                                        <button
                                                            key={q}
                                                            onClick={() => setBgQuality(q)}
                                                            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${bgQuality === q ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                                                        >
                                                            {q === 'fast' ? 'Rápido' : q === 'medium' ? 'Médio' : 'Alta'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Feather Radius */}
                                            <div className="mb-3">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suavização de Bordas</label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="10"
                                                        value={bgFeatherRadius}
                                                        onChange={(e) => setBgFeatherRadius(Number(e.target.value))}
                                                        className="flex-1"
                                                    />
                                                    <span className="text-xs font-mono text-gray-600 w-8">{bgFeatherRadius}px</span>
                                                </div>
                                            </div>

                                            {/* Aspect Ratio */}
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proporção</label>
                                                <div className="flex bg-gray-100 p-1 rounded-lg mt-1">
                                                    {(['original', '1:1', '4:5', '3:4'] as const).map((r) => (
                                                        <button
                                                            key={r}
                                                            onClick={() => setBgOutputRatio(r)}
                                                            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${bgOutputRatio === r ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
                                                        >
                                                            {r === 'original' ? 'Auto' : r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                <div className="flex flex-wrap gap-2">
                                    {item.metadata.composition.map((comp, index) => (
                                        <span key={index} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600">
                                            {comp.percentage}% {comp.name || comp.material}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {item.metadata.careInstructions && item.metadata.careInstructions.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Cuidados</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {item.metadata.careInstructions.map((instruction, index) => (
                                        <li key={index} className="text-sm text-gray-600">{instruction}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-200">
                            <div className="flex flex-col space-y-3">
                                <Button className="w-full py-6 text-lg font-semibold bg-[#00132d] hover:bg-[#00132d]/90 text-white rounded-xl shadow-lg transition-all active:scale-[0.98]" onClick={handleSellItem}>
                                    <ShoppingBagIcon className="h-6 w-6 mr-2" />
                                    Vender no Marketplace
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="py-4 font-medium rounded-xl border-gray-200 hover:bg-gray-50 transition-colors" onClick={handleEditItem}>
                                        <PencilIcon className="h-5 w-5 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="outline" className="py-4 font-medium rounded-xl border-red-100 text-red-600 hover:bg-red-50 transition-colors" onClick={handleDeleteClick}>
                                        <TrashIcon className="h-5 w-5 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Excluir Item"
                message="Tem certeza que deseja excluir esta peça? Ela será movida para a lixeira."
                confirmText="Excluir"
                type="danger"
                loading={deleting}
            />

            <ConfirmDialog
                isOpen={showUndoConfirm}
                onClose={() => setShowUndoConfirm(false)}
                onConfirm={handleUndoBackgroundRemoval}
                title="Remover Versão Sem Fundo"
                message="Tem certeza que deseja excluir a versão processada desta imagem? A versão original será mantida."
                confirmText="Excluir"
                type="danger"
                loading={isDeletingImage}
            />

            {showBatchPreview && (
                <BatchPreviewModal
                    isOpen={showBatchPreview}
                    items={batchPreviewItems}
                    onConfirm={handleBatchPreviewConfirm}
                    onCancel={handleBatchPreviewCancel}
                />
            )}
        </div>
    );
}
