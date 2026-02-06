'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { PlusIcon, TrashIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function OutfitsClient() {
    const [outfits, setOutfits] = useState<any[]>([]);
    const [deletedOutfits, setDeletedOutfits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTrash, setShowTrash] = useState(false);

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        outfitId: string | null;
        outfitName: string;
        isDeleting: boolean;
    }>({
        isOpen: false,
        outfitId: null,
        outfitName: '',
        isDeleting: false
    });

    // Restore confirmation modal state
    const [restoreModal, setRestoreModal] = useState<{
        isOpen: boolean;
        outfitId: string | null;
        outfitName: string;
        isRestoring: boolean;
    }>({
        isOpen: false,
        outfitId: null,
        outfitName: '',
        isRestoring: false
    });

    // Permanent delete confirmation modal state
    const [permanentDeleteModal, setPermanentDeleteModal] = useState<{
        isOpen: boolean;
        outfitId: string | null;
        outfitName: string;
        isDeleting: boolean;
    }>({
        isOpen: false,
        outfitId: null,
        outfitName: '',
        isDeleting: false
    });

    useEffect(() => {
        loadOutfits();
    }, []);

    const loadOutfits = async () => {
        try {
            // @ts-ignore
            const data = await apiClient.getOutfits();
            setOutfits(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load outfits');
        } finally {
            setLoading(false);
        }
    };

    const loadDeletedOutfits = async () => {
        try {
            // @ts-ignore
            const data = await apiClient.getDeletedOutfits();
            setDeletedOutfits(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load deleted outfits');
        }
    };

    const handleTrashToggle = () => {
        if (!showTrash && deletedOutfits.length === 0) {
            loadDeletedOutfits();
        }
        setShowTrash(!showTrash);
    };

    const handleDeleteClick = (e: React.MouseEvent, outfit: any) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            outfitId: outfit.id,
            outfitName: outfit.name,
            isDeleting: false
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.outfitId) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        try {
            // @ts-ignore
            await apiClient.deleteOutfit(deleteModal.outfitId);
            const deletedOutfit = outfits.find(o => o.id === deleteModal.outfitId);
            setOutfits(outfits.filter(o => o.id !== deleteModal.outfitId));
            if (deletedOutfit) {
                setDeletedOutfits(prev => [{ ...deletedOutfit, deletedAt: new Date().toISOString() }, ...prev]);
            }
            toast.success('Outfit moved to trash');
            setDeleteModal({ isOpen: false, outfitId: null, outfitName: '', isDeleting: false });
        } catch (err) {
            toast.error('Failed to delete outfit');
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleRestoreClick = (e: React.MouseEvent, outfit: any) => {
        e.preventDefault();
        e.stopPropagation();
        setRestoreModal({
            isOpen: true,
            outfitId: outfit.id,
            outfitName: outfit.name,
            isRestoring: false
        });
    };

    const handleRestoreConfirm = async () => {
        if (!restoreModal.outfitId) return;

        setRestoreModal(prev => ({ ...prev, isRestoring: true }));

        try {
            // @ts-ignore
            await apiClient.restoreOutfit(restoreModal.outfitId);
            const restoredOutfit = deletedOutfits.find(o => o.id === restoreModal.outfitId);
            setDeletedOutfits(deletedOutfits.filter(o => o.id !== restoreModal.outfitId));
            if (restoredOutfit) {
                setOutfits(prev => [{ ...restoredOutfit, deletedAt: null }, ...prev]);
            }
            toast.success('Outfit restored');
            setRestoreModal({ isOpen: false, outfitId: null, outfitName: '', isRestoring: false });
        } catch (err) {
            toast.error('Failed to restore outfit');
            setRestoreModal(prev => ({ ...prev, isRestoring: false }));
        }
    };

    const handlePermanentDeleteClick = (e: React.MouseEvent, outfit: any) => {
        e.preventDefault();
        e.stopPropagation();
        setPermanentDeleteModal({
            isOpen: true,
            outfitId: outfit.id,
            outfitName: outfit.name,
            isDeleting: false
        });
    };

    const handlePermanentDeleteConfirm = async () => {
        if (!permanentDeleteModal.outfitId) return;

        setPermanentDeleteModal(prev => ({ ...prev, isDeleting: true }));

        try {
            // @ts-ignore
            await apiClient.permanentDeleteOutfit(permanentDeleteModal.outfitId);
            setDeletedOutfits(deletedOutfits.filter(o => o.id !== permanentDeleteModal.outfitId));
            toast.success('Outfit permanently deleted');
            setPermanentDeleteModal({ isOpen: false, outfitId: null, outfitName: '', isDeleting: false });
        } catch (err) {
            toast.error('Failed to permanently delete outfit');
            setPermanentDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading your outfits...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#00132d]">My Outfits</h1>
                    <p className="text-gray-500 mt-2">Manage and organize your looks</p>
                </div>
                <Link href="/outfits/create" className="bg-[#00132d] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-[#00132d]/90 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    <span>New Outfit</span>
                </Link>
            </div>

            {outfits.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-600 mb-4">You haven't created any outfits yet.</p>
                    <Link
                        href="/outfits/create"
                        className="text-[#00132d] font-semibold hover:underline"
                    >
                        Create your first outfit
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {outfits.map((outfit) => (
                        <Link
                            key={outfit.id}
                            href={`/outfits/${outfit.slug || outfit.id}`}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                            <div className="aspect-square bg-gray-100 relative group-hover:opacity-90 transition-opacity">
                                {outfit.previewUrl ? (
                                    <img
                                        src={outfit.previewUrl}
                                        alt={outfit.name}
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-400 p-4">
                                        <div className="text-center">
                                            <span className="text-4xl">👔</span>
                                            <p className="text-sm mt-2">No Preview</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 group-hover:text-[#00132d] transition-colors">{outfit.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{new Date(outfit.updatedAt).toLocaleDateString()}</p>
                            </div>

                            <button
                                onClick={(e) => handleDeleteClick(e, outfit)}
                                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </Link>
                    ))}
                </div>
            )}

            {/* Trash Section */}
            <div className="mt-12 border-t border-gray-200 pt-8">
                <button
                    onClick={handleTrashToggle}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                    <span className="font-medium">Trash</span>
                    {deletedOutfits.length > 0 && (
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{deletedOutfits.length}</span>
                    )}
                    {showTrash ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                </button>

                {showTrash && (
                    <div className="mt-6">
                        {deletedOutfits.length === 0 ? (
                            <p className="text-gray-500 text-sm">No deleted outfits</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {deletedOutfits.map((outfit) => (
                                    <div
                                        key={outfit.id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm group relative opacity-75"
                                    >
                                        <div className="aspect-square bg-gray-100 relative">
                                            {outfit.previewUrl ? (
                                                <img
                                                    src={outfit.previewUrl}
                                                    alt={outfit.name}
                                                    className="w-full h-full object-contain p-2 grayscale"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-400 p-4">
                                                    <div className="text-center">
                                                        <span className="text-4xl">👔</span>
                                                        <p className="text-sm mt-2">No Preview</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-700">{outfit.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Deleted {outfit.deletedAt ? new Date(outfit.deletedAt).toLocaleDateString() : 'recently'}
                                            </p>
                                        </div>

                                        {/* Restore and Delete buttons */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleRestoreClick(e, outfit)}
                                                className="p-2 bg-white/90 rounded-full text-green-600 hover:bg-green-50"
                                                title="Restore"
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handlePermanentDeleteClick(e, outfit)}
                                                className="p-2 bg-white/90 rounded-full text-red-600 hover:bg-red-50"
                                                title="Delete permanently"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal (soft delete) */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, outfitId: null, outfitName: '', isDeleting: false })}
                onConfirm={handleDeleteConfirm}
                title="Move to Trash"
                message={<>Are you sure you want to move <strong>{deleteModal.outfitName}</strong> to trash? You can restore it later.</>}
                confirmText="Move to Trash"
                cancelText="Cancel"
                variant="danger"
                isLoading={deleteModal.isDeleting}
            />

            {/* Restore Confirmation Modal */}
            <ConfirmationModal
                isOpen={restoreModal.isOpen}
                onClose={() => setRestoreModal({ isOpen: false, outfitId: null, outfitName: '', isRestoring: false })}
                onConfirm={handleRestoreConfirm}
                title="Restore Outfit"
                message={<>Restore <strong>{restoreModal.outfitName}</strong> to your outfits?</>}
                confirmText="Restore"
                cancelText="Cancel"
                variant="primary"
                isLoading={restoreModal.isRestoring}
            />

            {/* Permanent Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={permanentDeleteModal.isOpen}
                onClose={() => setPermanentDeleteModal({ isOpen: false, outfitId: null, outfitName: '', isDeleting: false })}
                onConfirm={handlePermanentDeleteConfirm}
                title="Delete Permanently"
                message={<>Are you sure you want to <strong>permanently delete</strong> <strong>{permanentDeleteModal.outfitName}</strong>? This cannot be undone.</>}
                confirmText="Delete Permanently"
                cancelText="Cancel"
                variant="danger"
                isLoading={permanentDeleteModal.isDeleting}
            />
        </div>
    );
}
