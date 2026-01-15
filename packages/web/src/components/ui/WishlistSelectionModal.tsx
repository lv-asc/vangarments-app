import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { XMarkIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface WishlistSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    skuItemId: string;
    onStatusChange?: (onAnyWishlist: boolean) => void;
}

export default function WishlistSelectionModal({ isOpen, onClose, skuItemId, onStatusChange }: WishlistSelectionModalProps) {
    const [wishlists, setWishlists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemInLists, setItemInLists] = useState<Set<string>>(new Set());
    const [showCreate, setShowCreate] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadWishlists();
        }
    }, [isOpen, skuItemId]);

    const loadWishlists = async () => {
        setLoading(true);
        try {
            const [lists, itemsResponse] = await Promise.all([
                api.getMyWishlists(),
                // We need to check which lists have this item. 
                // Currently backend doesn't have a direct "which wishlists is this item in" endpoint.
                // I'll fetch all items for all lists (not efficient) or just check by default.
                // Better: Backend should provide this. But for now, let's fetch list items.
                Promise.all((await api.getMyWishlists()).map(async (l: any) => {
                    const items = await api.getWishlistItems(l.id);
                    return { id: l.id, hasItem: items.some((i: any) => i.skuItemId === skuItemId) };
                }))
            ]);

            setWishlists(lists);
            const inLists = new Set<string>();
            itemsResponse.forEach(r => {
                if (r.hasItem) inLists.add(r.id);
            });
            setItemInLists(inLists);
        } catch (error) {
            console.error('Failed to load wishlists', error);
            toast.error('Failed to load wishlists');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = async (wishlistId: string) => {
        try {
            const result = await api.toggleWishlist(skuItemId, wishlistId);
            const nextInLists = new Set(itemInLists);
            if (result.added) {
                nextInLists.add(wishlistId);
                toast.success('Added to wishlist');
            } else {
                nextInLists.delete(wishlistId);
                toast.success('Removed from wishlist');
            }
            setItemInLists(nextInLists);
            if (onStatusChange) {
                onStatusChange(nextInLists.size > 0);
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        setIsCreating(true);
        try {
            const newList = await api.createWishlist(newListName);
            setWishlists([...wishlists, newList]);

            // Automatically add item to the new list
            await api.toggleWishlist(skuItemId, newList.id);
            const nextInLists = new Set(itemInLists);
            nextInLists.add(newList.id);
            setItemInLists(nextInLists);

            setNewListName('');
            setShowCreate(false);
            toast.success(`Created and added to "${newListName}"`);

            if (onStatusChange) {
                onStatusChange(true);
            }
        } catch (error) {
            toast.error('Failed to create wishlist');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Add to Wishlist</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-gray-500 mt-3">Loading your wishlists...</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            {wishlists.map((list) => (
                                <button
                                    key={list.id}
                                    onClick={() => toggleItem(list.id)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-gray-900 group-hover:text-blue-700">{list.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {list.isDefault ? 'Default List' : list.visibility === 'private' ? 'Private' : 'Public'}
                                        </span>
                                    </div>
                                    <div className={`h-6 w-6 rounded-md flex items-center justify-center border-2 transition-all ${itemInLists.has(list.id)
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-white border-gray-200 text-transparent group-hover:border-blue-200'
                                        }`}>
                                        <CheckIcon className="h-4 w-4 stroke-[3]" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {!showCreate ? (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full mt-6 py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Create New Wishlist</span>
                        </button>
                    ) : (
                        <form onSubmit={handleCreateList} className="mt-6 flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl animate-in slide-in-from-top-4 duration-200">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Wishlist Name</label>
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="e.g., Summer Favorites"
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isCreating || !newListName.trim()}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/10"
                            >
                                {isCreating ? 'Creating...' : 'Create and Add Item'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
