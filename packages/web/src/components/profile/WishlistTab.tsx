import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/utils/imageUrl';
import {
    PlusIcon,
    CheckIcon,
    EllipsisVerticalIcon,
    TrashIcon,
    PencilIcon,
    GlobeAmericasIcon,
    LockClosedIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

export function WishlistTab() {
    const [wishlists, setWishlists] = useState<any[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    // Edit state
    const [editName, setEditName] = useState('');
    const [editVisibility, setEditVisibility] = useState('private');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchWishlists();
    }, []);

    const fetchWishlists = async () => {
        try {
            const lists = await apiClient.getMyWishlists();
            setWishlists(lists);
            if (lists.length > 0 && !activeListId) {
                setActiveListId(lists[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch wishlists', error);
        } finally {
            if (wishlists.length === 0) setLoading(false);
        }
    };

    useEffect(() => {
        if (!activeListId) return;
        fetchItems();

        const current = wishlists.find(w => w.id === activeListId);
        if (current) {
            setEditName(current.name);
            setEditVisibility(current.visibility);
        }
    }, [activeListId]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await apiClient.getWishlistItems(activeListId!);
            setItems(res);
        } catch (e) {
            console.error('Failed to fetch wishlist items', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateWishlist = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        try {
            await apiClient.updateWishlist(activeListId!, {
                name: editName,
                visibility: editVisibility
            });
            toast.success('Wishlist updated');
            setShowSettings(false);
            fetchWishlists();
        } catch (error) {
            toast.error('Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWishlist = async () => {
        if (!window.confirm('Are you sure you want to delete this wishlist?')) return;
        try {
            await apiClient.deleteWishlist(activeListId!);
            toast.success('Wishlist deleted');
            const remaining = wishlists.filter(w => w.id !== activeListId);
            setWishlists(remaining);
            if (remaining.length > 0) {
                setActiveListId(remaining[0].id);
            } else {
                setActiveListId(null);
            }
            setShowSettings(false);
        } catch (error) {
            toast.error('Failed to delete default wishlist');
        }
    };

    const handleCreateWishlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) return;
        setIsSaving(true);
        try {
            const newList = await apiClient.createWishlist(editName, editVisibility);
            setWishlists([...wishlists, newList]);
            setActiveListId(newList.id);
            setShowCreate(false);
            setEditName('');
            toast.success('New wishlist created');
        } catch (error) {
            toast.error('Failed to create');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading && wishlists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4 font-medium">Loading your wishlists...</p>
            </div>
        );
    }

    const activeList = wishlists.find(w => w.id === activeListId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Wishlist Selector */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar border-b border-gray-100">
                {wishlists.map((list) => (
                    <button
                        key={list.id}
                        onClick={() => { setActiveListId(list.id); setShowSettings(false); setShowCreate(false); }}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeListId === list.id
                                ? 'bg-[#00132d] text-white shadow-lg shadow-blue-900/10 scale-105'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                            }`}
                    >
                        {list.name}
                        {list.visibility === 'private' && activeListId === list.id && <LockClosedIcon className="h-3 w-3 inline-block ml-1.5 opacity-70" />}
                    </button>
                ))}
                <button
                    onClick={() => { setShowCreate(true); setShowSettings(false); setActiveListId(null); }}
                    className={`p-2 rounded-full transition-all border-2 border-dashed ${showCreate
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500'
                        }`}
                >
                    <PlusIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Content Area */}
            {showCreate ? (
                <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-100 shadow-xl shadow-blue-500/5 animate-in slide-in-from-bottom-4 duration-300">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <PlusIcon className="h-6 w-6 text-blue-600" />
                        New Wishlist
                    </h3>
                    <form onSubmit={handleCreateWishlist} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="Summer 2026 Collection"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Visibility</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditVisibility('private')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${editVisibility === 'private'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-blue-100'
                                        }`}
                                >
                                    <LockClosedIcon className="h-4 w-4" />
                                    <span className="font-medium">Private</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditVisibility('public')}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${editVisibility === 'public'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-blue-100'
                                        }`}
                                >
                                    <GlobeAmericasIcon className="h-4 w-4" />
                                    <span className="font-medium">Public</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setShowCreate(false); fetchWishlists(); }}
                                className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !editName.trim()}
                                className="flex-[2] py-3 bg-[#00132d] text-white rounded-xl font-bold hover:bg-[#00132d]/90 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/10"
                            >
                                {isSaving ? 'Creating...' : 'Create Wishlist'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : activeList ? (
                <div className="animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-gray-900">{activeList.name}</h3>
                                {!activeList.isDefault && (
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`p-1.5 rounded-lg transition-all ${showSettings ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 font-medium">
                                {activeList.visibility === 'private' ? (
                                    <><LockClosedIcon className="h-4 w-4" /> Private</>
                                ) : (
                                    <><GlobeAmericasIcon className="h-4 w-4" /> Public</>
                                )}
                                <span>•</span>
                                <span>{items.length} items</span>
                            </div>
                        </div>

                        {!activeList.isDefault && (
                            <button
                                onClick={handleDeleteWishlist}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete Wishlist"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {showSettings && !activeList.isDefault && (
                        <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-4 duration-300">
                            <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-4">Edit Wishlist</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-blue-700/60 mb-1 leading-6">NAME</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                                    />
                                </div>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-blue-700/60 mb-1 leading-6">VISIBILITY</label>
                                        <select
                                            value={editVisibility}
                                            onChange={(e) => setEditVisibility(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium text-gray-700"
                                        >
                                            <option value="private">Private (Only you)</option>
                                            <option value="public">Public (Everyone)</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleUpdateWishlist}
                                        disabled={isSaving || !editName.trim()}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
                                    >
                                        {isSaving ? '...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-pulse flex space-x-4">
                                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                <div className="flex-1 space-y-6 py-1">
                                    <div className="h-2 bg-gray-200 rounded"></div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="h-2 bg-gray-200 rounded col-span-2"></div>
                                        <div className="h-2 bg-gray-200 rounded col-span-1"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                            <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm mb-4">
                                <PlusIcon className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">This wishlist is empty</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2 mb-8">Items you add will appear here. Start exploring our collection!</p>
                            <Link href="/search" className="inline-flex items-center px-6 py-3 rounded-xl font-bold bg-[#00132d] text-white hover:bg-black transition-all shadow-lg shadow-blue-900/10">
                                Browse Items
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                            {items.map((entry) => {
                                const item = entry.item;
                                let imageUrl = null;
                                if (item.images) {
                                    const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                                    if (imgs && imgs.length > 0) {
                                        imageUrl = getImageUrl(imgs[0].url || imgs[0].imageUrl);
                                    }
                                }

                                const linkSlug = item.code ? slugify(item.code) : slugify(item.name);

                                return (
                                    <Link
                                        key={entry.skuItemId}
                                        href={`/items/${linkSlug}`}
                                        className="group block"
                                    >
                                        <div className="aspect-[3/4] rounded-2xl bg-gray-100 overflow-hidden relative mb-4 shadow-sm border border-gray-100 transition-all group-hover:shadow-md">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                                                    👕
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-sm text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                <CheckIcon className="h-4 w-4 stroke-[3]" />
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-gray-900 truncate px-1">{item.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1 font-medium px-1">
                                            {item.retailPriceBrl ? `R$ ${Number(item.retailPriceBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Price on request'}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500">Pick a wishlist to start.</p>
                </div>
            )}
        </div>
    );
}
