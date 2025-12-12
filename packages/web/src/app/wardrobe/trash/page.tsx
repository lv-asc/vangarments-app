// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    ArrowLeftIcon,
    TrashIcon,
    ArrowPathIcon,
    ClockIcon,
    PhotoIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';

interface TrashItem {
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
        colors: Array<{ name: string; hex?: string }>;
        size?: string;
    };
    images?: Array<{ url: string; type: string; isPrimary: boolean }>;
    deletedAt: string;
    expiresAt: string;
    daysRemaining: number;
}

export default function TrashPage() {
    const router = useRouter();
    const [items, setItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        itemId: string | null;
        action: 'restore' | 'delete' | null;
        itemName: string;
    }>({ isOpen: false, itemId: null, action: null, itemName: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadTrashItems();
    }, []);

    const loadTrashItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.getTrashItems();
            setItems(response.items || []);
        } catch (err: any) {
            console.error('Error loading trash items:', err);
            setError(err.message || 'Falha ao carregar lixeira');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = (item: TrashItem) => {
        setConfirmDialog({
            isOpen: true,
            itemId: item.id,
            action: 'restore',
            itemName: item.metadata.name
        });
    };

    const handlePermanentDeleteClick = (item: TrashItem) => {
        setConfirmDialog({
            isOpen: true,
            itemId: item.id,
            action: 'delete',
            itemName: item.metadata.name
        });
    };

    const handleConfirm = async () => {
        if (!confirmDialog.itemId || !confirmDialog.action) return;

        setActionLoading(true);
        try {
            if (confirmDialog.action === 'restore') {
                await apiClient.restoreWardrobeItem(confirmDialog.itemId);
            } else {
                await apiClient.permanentDeleteWardrobeItem(confirmDialog.itemId);
            }
            await loadTrashItems();
        } catch (err: any) {
            alert(`Falha: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setActionLoading(false);
            setConfirmDialog({ isOpen: false, itemId: null, action: null, itemName: '' });
        }
    };

    const getImageSrc = (item: TrashItem) => {
        const primaryImage = item.images?.find(img => img.isPrimary) || item.images?.[0];
        if (!primaryImage) return null;
        return primaryImage.url.startsWith('http') ? primaryImage.url : getImageUrl(primaryImage.url);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/wardrobe')}
                                className="flex items-center"
                            >
                                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                                Voltar
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                    <TrashIcon className="h-8 w-8 mr-3 text-gray-500" />
                                    Lixeira
                                </h1>
                                <p className="text-gray-600">
                                    {items.length} {items.length === 1 ? 'item' : 'itens'} na lixeira
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-amber-800 font-medium">Itens expiram automaticamente</p>
                            <p className="text-amber-700 text-sm">
                                Os itens na lixeira serão permanentemente excluídos após 14 dias. Restaure-os antes do prazo para recuperá-los.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                        <Button variant="outline" onClick={loadTrashItems} className="mt-2">
                            Tentar Novamente
                        </Button>
                    </div>
                )}

                {/* Items Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                                <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => {
                            const imageSrc = getImageSrc(item);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Image */}
                                    <div className="aspect-[3/4] bg-gray-100 relative">
                                        {imageSrc ? (
                                            <img
                                                src={imageSrc}
                                                alt={item.metadata.name}
                                                className="w-full h-full object-cover opacity-75"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <PhotoIcon className="h-16 w-16 text-gray-300" />
                                            </div>
                                        )}

                                        {/* Expiry Badge */}
                                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${item.daysRemaining <= 3
                                                ? 'bg-red-100 text-red-700'
                                                : item.daysRemaining <= 7
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            <ClockIcon className="h-3 w-3" />
                                            <span>{item.daysRemaining} dias</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-medium text-gray-900 truncate">{item.metadata.name}</h3>
                                        <p className="text-sm text-gray-500">{item.brand.brand}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Excluído em {new Date(item.deletedAt).toLocaleDateString('pt-BR')}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex space-x-2 mt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestoreClick(item)}
                                                className="flex-1 flex items-center justify-center text-green-600 border-green-200 hover:bg-green-50"
                                            >
                                                <ArrowPathIcon className="h-4 w-4 mr-1" />
                                                Restaurar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePermanentDeleteClick(item)}
                                                className="flex-1 flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <TrashIcon className="h-4 w-4 mr-1" />
                                                Excluir
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <TrashIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Lixeira vazia
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Itens excluídos do seu guarda-roupa aparecerão aqui por 14 dias antes de serem permanentemente removidos.
                        </p>
                        <Button onClick={() => router.push('/wardrobe')}>
                            Voltar ao Guarda-roupa
                        </Button>
                    </div>
                )}
            </main>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, itemId: null, action: null, itemName: '' })}
                onConfirm={handleConfirm}
                title={confirmDialog.action === 'restore' ? 'Restaurar Item' : 'Excluir Permanentemente'}
                message={confirmDialog.action === 'restore'
                    ? `Deseja restaurar "${confirmDialog.itemName}" de volta ao seu guarda-roupa?`
                    : `Tem certeza que deseja excluir permanentemente "${confirmDialog.itemName}"? Esta ação não pode ser desfeita e todas as imagens serão removidas.`
                }
                confirmLabel={confirmDialog.action === 'restore' ? 'Restaurar' : 'Excluir Permanentemente'}
                cancelLabel="Cancelar"
                variant={confirmDialog.action === 'restore' ? 'default' : 'danger'}
                loading={actionLoading}
            />
        </div>
    );
}
