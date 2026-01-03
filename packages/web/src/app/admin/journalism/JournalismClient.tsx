'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { journalismApi, IJournalismData } from '@/lib/journalismApi';
import JournalismForm from '@/components/admin/JournalismForm';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function AdminJournalismPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<IJournalismData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<IJournalismData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null; itemTitle: string }>({
        isOpen: false,
        itemId: null,
        itemTitle: ''
    });

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            fetchItems();
        }
    }, [user, authLoading, router]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await journalismApi.getAll();
            setItems(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsEditing(true);
    };

    const handleEdit = (item: IJournalismData) => {
        setEditingItem(item);
        setIsEditing(true);
    };

    const handleDelete = async (id: string, title?: string) => {
        if (!deleteConfirm.isOpen) {
            setDeleteConfirm({
                isOpen: true,
                itemId: id,
                itemTitle: title || 'this content'
            });
            return;
        }

        try {
            await journalismApi.delete(id);
            toast.success('Deleted successfully');
            fetchItems();
        } catch (error) {
            toast.error('Failed to delete');
        } finally {
            setDeleteConfirm({ isOpen: false, itemId: null, itemTitle: '' });
        }
    };

    const handleSuccess = () => {
        setIsEditing(false);
        setEditingItem(null);
        fetchItems();
    };

    if (authLoading || (loading && !items.length && !isEditing)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10">
                <JournalismForm
                    initialData={editingItem}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Journalism Management</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage News, Columns, and Articles.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Content
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {items.map((item) => (
                        <li key={item.id}>
                            <div className="px-4 py-4 flex items-center sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex text-sm font-medium text-blue-600 truncate">
                                            <span className="mr-2 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                                                {item.type}
                                            </span>
                                            {item.title}
                                            {!item.published && <span className="ml-2 text-yellow-500 text-xs bg-yellow-50 px-1 rounded border border-yellow-100">Draft</span>}
                                        </div>
                                        <div className="mt-1 flex items-center text-sm text-gray-500">

                                            <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id!, item.title)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {items.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No content found. Start by creating a new article.
                        </li>
                    )}
                </ul>
            </div>
            <ConfirmationModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, itemId: null, itemTitle: '' })}
                onConfirm={() => deleteConfirm.itemId && handleDelete(deleteConfirm.itemId)}
                title="Delete Content"
                message={`Are you sure you want to delete "${deleteConfirm.itemTitle}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
