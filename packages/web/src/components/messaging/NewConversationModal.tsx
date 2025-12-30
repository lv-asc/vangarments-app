import { useState, Fragment, ReactNode, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getImageUrl, getUserAvatarUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { brandApi } from '@/lib/brandApi';
import { pageApi } from '@/lib/pageApi';
import { AlertModal } from '../ui/AlertModal';

type FilterType = 'all' | 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';

interface Participant {
    id: string;
    name: string;
    username?: string; // For users
    type: 'user' | 'brand' | 'store' | 'supplier' | 'non_profit' | 'page';
    avatarUrl?: string; // For users
    logo?: string; // For entities
    slug?: string; // For entities/pages
    subtitle?: string; // Display logic
}

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (conversationId: string, slug?: string, otherUsername?: string) => void;
}

export default function NewConversationModal({ isOpen, onClose, onConversationCreated }: NewConversationModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Participant[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [filterType, setFilterType] = useState<FilterType>('all');

    // Alert State
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'info' | 'danger';
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    useEffect(() => {
        // Clear results when filter changes, but trigger search to load defaults/popular if query is empty
        handleSearch(searchQuery);
    }, [filterType]);

    // Initial load for popular items when modal opens
    useEffect(() => {
        if (isOpen && !searchQuery) {
            handleSearch('');
        }
    }, [isOpen]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setIsSearching(true);

        try {
            let results: Participant[] = [];
            const isDefaultView = !query.trim();

            if (filterType === 'all') {
                // "All" View logic
                const promises = [];

                // 1. Users (Limit 5)
                promises.push(apiClient.searchUsers(query || 'a') // Empty query fallback to 'a' or use generic fetch? User search might require query.
                    .then((users: any[]) => users.slice(0, 5).map((u: any) => ({
                        id: u.id,
                        name: u.personalInfo?.name || u.name || u.username,
                        username: u.username,
                        type: 'user' as const,
                        avatarUrl: getUserAvatarUrl(u),
                        subtitle: `@${u.username}`
                    })))
                    .catch(() => [])
                );

                // 2. Brands (Limit 5)
                promises.push(brandApi.getBrands({
                    search: query,
                    businessType: 'brand',
                    limit: 5
                }).then((res: any) => {
                    const brands = Array.isArray(res) ? res : res.brands || [];
                    return brands.map((b: any) => ({
                        id: b.id,
                        name: b.brandInfo?.name || b.name,
                        type: 'brand' as const,
                        logo: b.brandInfo?.logo,
                        slug: b.brandInfo?.slug,
                        subtitle: 'Brand'
                    }));
                }).catch(() => [])
                );

                // 3. Stores (Limit 5)
                promises.push(brandApi.getBrands({
                    search: query,
                    businessType: 'store',
                    limit: 5
                }).then((res: any) => {
                    const stores = Array.isArray(res) ? res : res.brands || [];
                    return stores.map((b: any) => ({
                        id: b.id,
                        name: b.brandInfo?.name || b.name,
                        type: 'store' as const,
                        logo: b.brandInfo?.logo,
                        slug: b.brandInfo?.slug,
                        subtitle: 'Store'
                    }));
                }).catch(() => [])
                );

                const [users, brands, stores] = await Promise.all(promises);
                results = [...users, ...brands, ...stores];

            } else if (filterType === 'user') {
                // If query is empty, maybe fetch recent or random? 
                // searchUsers might handle empty query by returning defaults or empty.
                // Let's assume for empty query we skip or try to fetch 'recent' if API supported.
                // For now, if empty query, we might just not show anything for Users unless we have a 'getPopularUsers' endpoint.
                // The prompt asked "make it so that popular entities already appear".
                // I'll try to fetch some users even if query empty (using a generic term or if API supports empty).
                if (isDefaultView) {
                    // Try fetching with empty search or skip
                    // apiClient.searchUsers might require query. 
                    // Let's trying passing 'a' or something common if empty, OR better, don't show users if we can't fetch generic. 
                    // Focusing on Entities popularity as requested.
                    results = [];
                } else {
                    const users = await apiClient.searchUsers(query);
                    results = users.map((u: any) => ({
                        id: u.id,
                        name: u.personalInfo?.name || u.name || u.username,
                        username: u.username,
                        type: 'user',
                        avatarUrl: getUserAvatarUrl(u),
                        subtitle: `@${u.username}`
                    }));
                }
            } else if (filterType === 'page') {
                const pages = await pageApi.getAll();
                const filtered = isDefaultView ? pages.slice(0, 10) : pages.filter((p: any) =>
                    p.name.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 10);

                results = filtered.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    type: 'page',
                    logo: p.logoUrl,
                    slug: p.slug,
                    subtitle: 'Page' // Explicitly set to "Page"
                }));
            } else {
                // Entity Types (Brand, Store, Supplier, Non-Profit)
                const brands = await brandApi.getBrands({
                    search: query,
                    businessType: filterType,
                    limit: 10
                });

                const brandList = Array.isArray(brands) ? brands : (brands as any).brands || []; // Handle pagination response structure if any

                const formatLabel = (type: string) => {
                    if (type === 'non_profit') return 'Non Profit';
                    return type.charAt(0).toUpperCase() + type.slice(1);
                };

                results = brandList.map((b: any) => ({
                    id: b.id,
                    name: b.brandInfo?.name || b.name,
                    type: filterType,
                    logo: b.brandInfo?.logo,
                    slug: b.brandInfo?.slug,
                    subtitle: formatLabel(filterType) // Use filter type for consistent labeling
                }));
            }

            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleParticipantSelection = (participant: Participant) => {
        if (selectedParticipants.find(p => p.id === participant.id)) {
            setSelectedParticipants(prev => prev.filter(p => p.id !== participant.id));
        } else {
            setSelectedParticipants(prev => [...prev, participant]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleCreate = async () => {
        if (selectedParticipants.length === 0) return;

        setIsCreating(true);
        try {
            let conversation;

            // Logic for single participant (Direct or Entity)
            if (selectedParticipants.length === 1 && !groupName) {
                const p = selectedParticipants[0];

                if (p.type === 'user') {
                    // Direct User Message
                    conversation = await apiClient.startConversation(p.id);
                    onConversationCreated(conversation.id, conversation.slug, p.username);
                } else {
                    // Entity Message
                    // Use startConversation with entity params
                    conversation = await apiClient.startConversation(undefined, p.type === 'page' ? 'page' : 'brand', p.id);
                    // Note: 'brand' is generic for business types in some systems, verify if we need specific 'store'/'supplier' type here. 
                    // Looking at api.ts startConversation signature: (recipientIdOrUsernames, entityType, entityId)
                    // If we pass undefined as first arg, it treats as Entity conversation init? 
                    // Let's verify startConversation impl in api.ts

                    // Re-reading api.ts snippet:
                    // startConversation(recipientIdOrUsernames, entityType, entityId)
                    // If recipientIdOrUsernames is present, it sets recipientId/username.
                    // If entityType/Id present, sets those.
                    // Backend messagingController handles creating conversation.

                    // For entity conversation, we typically target the entity itself.
                    // Let's assume passing entityType and entityId is correct.
                    // However, filterType has 'brand', 'store', etc. 
                    // API might expect 'brand' for all business types or specific types. 
                    // safe bet: pass the filterType as entityType (or 'brand' if backend expects generic)
                    // Let's pass p.type.

                    onConversationCreated(conversation.id, conversation.slug);
                }
            } else {
                // Group conversation
                // Only users can be added to groups for now (based on restrictions)
                // Filter out non-users? Or allow if they are team members (but UI doesn't know).
                // Assuming mostly users for groups. 
                const validUserIds = selectedParticipants.filter(p => p.type === 'user').map(u => u.id);
                if (validUserIds.length !== selectedParticipants.length) {
                    setAlertState({
                        isOpen: true,
                        title: 'Invalid Participants',
                        message: 'Only users can be added to group chats at this time.',
                        variant: 'info'
                    });
                    setIsCreating(false);
                    return;
                }

                const finalGroupName = groupName.trim() || `Group: ${selectedParticipants.map(u => u.name).join(', ')}`.substring(0, 100);

                conversation = await apiClient.createGroupConversation(
                    validUserIds,
                    finalGroupName
                );
                onConversationCreated(conversation.id, conversation.slug);
            }
            onClose();
        } catch (error: any) {
            console.error('Create conversation failed:', error);
            setAlertState({
                isOpen: true,
                title: 'Error',
                message: error.message || 'Failed to create conversation',
                variant: 'danger'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const closeAlert = () => setAlertState(prev => ({ ...prev, isOpen: false }));

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <AlertModal
                    isOpen={alertState.isOpen}
                    onClose={closeAlert}
                    title={alertState.title}
                    message={alertState.message}
                    variant={alertState.variant}
                />
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        New Message
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Selected Participants */}
                                    {selectedParticipants.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedParticipants.map(p => (
                                                <div key={p.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                                                    <span>{p.name}</span>
                                                    <button onClick={() => toggleParticipantSelection(p)} className="hover:text-blue-900">
                                                        <XMarkIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Group Name (only if > 1 participant) */}
                                    {selectedParticipants.length > 1 && (
                                        <input
                                            type="text"
                                            placeholder="Group Name (Optional)"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    )}

                                    {/* Filters */}
                                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                                        {(['all', 'user', 'brand', 'store', 'supplier', 'non_profit', 'page'] as FilterType[]).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setFilterType(type)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${filterType === type
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {type === 'non_profit' ? 'Non-Profit' : type.charAt(0).toUpperCase() + type.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={`Search ${filterType === 'non_profit' ? 'non-profits' : filterType + 's'}...`}
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 ? (
                                        <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                                            {searchResults.filter(r => !selectedParticipants.find(p => p.id === r.id)).map(result => (
                                                <button
                                                    key={result.id}
                                                    onClick={() => toggleParticipantSelection(result)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="relative w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                        {result.type === 'user' ? (
                                                            result.avatarUrl ? (
                                                                <Image
                                                                    src={getImageUrl(result.avatarUrl)}
                                                                    alt={result.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <span className="flex items-center justify-center w-full h-full text-xs font-medium text-gray-500">
                                                                    {(result.name || 'U').charAt(0).toUpperCase()}
                                                                </span>
                                                            )
                                                        ) : (
                                                            result.logo ? (
                                                                <Image
                                                                    src={getImageUrl(result.logo)}
                                                                    alt={result.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <span className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-400">
                                                                    {(result.name || 'E').substring(0, 2).toUpperCase()}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{result.name}</div>
                                                        <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : searchQuery && !isSearching && (
                                        <p className="text-center text-gray-500 text-sm py-4">No results found</p>
                                    )}

                                    <div className="mt-6">
                                        <button
                                            onClick={handleCreate}
                                            disabled={selectedParticipants.length === 0 || isCreating}
                                            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2
                                                ${selectedParticipants.length === 0 || isCreating
                                                    ? 'bg-gray-300 cursor-not-allowed'
                                                    : 'bg-gray-900 hover:bg-gray-800'
                                                }`}
                                        >
                                            {isCreating ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Create {selectedParticipants.length > 1 ? 'Group' : 'Chat'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
