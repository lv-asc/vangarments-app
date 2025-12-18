
import { useState, Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getImageUrl, getUserAvatarUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface User {
    id: string;
    name: string;
    username: string;
    personalInfo?: {
        name?: string;
        avatarUrl?: string;
    };
    profile?: {
        avatarUrl?: string;
    };
}

interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (conversationId: string) => void;
}

export default function NewConversationModal({ isOpen, onClose, onConversationCreated }: NewConversationModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            // Use existing user search endpoint (needs fallback if not exists)
            // Assuming GET /users?search=query exists and returns { users: [] }
            const users = await apiClient.searchUsers(query);

            // Map users to ensure names and avatars are correctly handled from personalInfo
            const mappedUsers = users.map((u: any) => ({
                id: u.id,
                name: u.personalInfo?.name || u.name || u.username,
                username: u.username,
                avatarUrl: getUserAvatarUrl(u)
            }));

            setSearchResults(mappedUsers as any);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const toggleUserSelection = (user: User) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers(prev => [...prev, user]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;

        setIsCreating(true);
        try {
            let conversation;
            if (selectedUsers.length === 1 && !groupName) {
                // Direct conversation
                conversation = await apiClient.startConversation(selectedUsers[0].id);
            } else {
                // Group conversation
                // Backend requires a name, so generate one if not provided
                const finalGroupName = groupName.trim() || `Group: ${selectedUsers.map(u => u.name).join(', ')}`.substring(0, 100);

                conversation = await apiClient.createGroupConversation(
                    selectedUsers.map(u => u.id),
                    finalGroupName
                );
            }
            onConversationCreated(conversation.id);
            onClose();
        } catch (error: any) {
            console.error('Create conversation failed:', error);
            alert(error.message || 'Failed to create conversation');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                                    {/* Selected Users */}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map(user => (
                                                <div key={user.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                                                    <span>{user.name}</span>
                                                    <button onClick={() => toggleUserSelection(user)} className="hover:text-blue-900">
                                                        <XMarkIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Group Name (only if > 1 user) */}
                                    {selectedUsers.length > 1 && (
                                        <input
                                            type="text"
                                            placeholder="Group Name (Optional)"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    )}

                                    {/* User Search */}
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 ? (
                                        <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                                            {searchResults.filter(user => !selectedUsers.find(u => u.id === user.id)).map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => toggleUserSelection(user)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="relative w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                        {getUserAvatarUrl(user) ? (
                                                            <Image
                                                                src={getImageUrl(getUserAvatarUrl(user))}
                                                                alt={user.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span className="flex items-center justify-center w-full h-full text-xs font-medium text-gray-500">
                                                                {(user.name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-xs text-gray-500">@{user.username}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : searchQuery && !isSearching && (
                                        <p className="text-center text-gray-500 text-sm py-4">No users found</p>
                                    )}

                                    <div className="mt-6">
                                        <button
                                            onClick={handleCreate}
                                            disabled={selectedUsers.length === 0 || isCreating}
                                            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2
                        ${selectedUsers.length === 0 || isCreating
                                                    ? 'bg-gray-300 cursor-not-allowed'
                                                    : 'bg-gray-900 hover:bg-gray-800'
                                                }`}
                                        >
                                            {isCreating ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Create {selectedUsers.length > 1 ? 'Group' : 'Chat'}
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
