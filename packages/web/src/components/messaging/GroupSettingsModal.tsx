import { useState, Fragment, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    CameraIcon,
    UserMinusIcon,
    ShieldCheckIcon,
    PlusIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { AlertModal } from '@/components/ui/AlertModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useRouter } from 'next/navigation';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    currentName?: string;
    currentAvatarUrl?: string;
    currentDescription?: string;
    currentParticipants?: any[];
    onUpdate: (updatedConversation: any) => void;
}

export default function GroupSettingsModal({
    isOpen,
    onClose,
    conversationId,
    currentName,
    currentAvatarUrl,
    currentDescription,
    currentParticipants = [],
    onUpdate
}: GroupSettingsModalProps) {
    const router = useRouter();
    const [name, setName] = useState(currentName || '');
    const [description, setDescription] = useState(currentDescription || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; variant?: 'info' | 'danger' }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info'
    });

    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const showAlert = (title: string, message: string, variant: 'info' | 'danger' = 'info') => {
        setAlertConfig({ isOpen: true, title, message, variant });
    };

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm });
    };

    useEffect(() => {
        if (isOpen) {
            setName(currentName || '');
            setDescription(currentDescription || '');
            // Check if current user is admin
            apiClient.getCurrentUser().then(user => {
                setCurrentUserId(user.id);
                const me = currentParticipants.find(p => p.userId === user.id);
                setIsAdmin(me?.role === 'admin');
            });
        }
    }, [isOpen, currentName, currentDescription, currentParticipants]);

    useEffect(() => {
        if (searchQuery.trim().length > 2) {
            const timeoutId = setTimeout(async () => {
                try {
                    const results = await apiClient.searchUsers(searchQuery);
                    // Filter out already members
                    const filtered = results.filter((u: any) =>
                        !currentParticipants.find(p => p.userId === u.id)
                    );
                    setSearchResults(filtered);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, currentParticipants]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsUpdating(true);
        try {
            const updated = await apiClient.updateConversation(conversationId, {
                name,
                description
            });
            onUpdate(updated);
            if (updated.slug) {
                router.replace(`/messages/${updated.slug}`);
            }
            onClose();
        } catch (error) {
            console.error('Failed to update group:', error);
            showAlert('Wait!', 'Failed to update group settings', 'danger');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUpdating(true);
        try {
            const { url } = await apiClient.uploadFile(file);
            const updated = await apiClient.updateConversation(conversationId, { avatarUrl: url });
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            showAlert('Wait!', 'Failed to update group avatar', 'danger');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddMember = async (userId: string) => {
        try {
            await apiClient.addConversationParticipant(conversationId, userId);
            setSearchQuery('');
            setSearchResults([]);
            // Fetch updated conversation details
            const updated = await apiClient.getConversation(conversationId);
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to add member:', error);
            showAlert('Wait!', 'Failed to add member', 'danger');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        showConfirm('Remove Member?', 'Are you sure you want to remove this member?', async () => {
            try {
                await apiClient.removeConversationParticipant(conversationId, userId);
                const updated = await apiClient.getConversation(conversationId);
                onUpdate(updated);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            } catch (error) {
                console.error('Failed to remove member:', error);
                showAlert('Wait!', 'Failed to remove member', 'danger');
            }
        });
    };

    const toggleRole = async (userId: string, currentRole: string) => {
        try {
            const newRole = currentRole === 'admin' ? 'member' : 'admin';
            await apiClient.updateParticipantRole(conversationId, userId, newRole);
            const updated = await apiClient.getConversation(conversationId);
            onUpdate(updated);
        } catch (error: any) {
            console.error('Failed to update role:', error);
            showAlert('Wait!', error.response?.data?.message || 'Failed to update user role', 'danger');
        }
    };

    const handleLeaveGroup = async () => {
        showConfirm('Leave Group?', 'Are you sure you want to leave this group?', async () => {
            try {
                await apiClient.deleteConversation(conversationId);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                onClose();
                router.push('/messages');
            } catch (error: any) {
                console.error('Failed to leave group:', error);
                showAlert('Wait!', 'Failed to leave group', 'danger');
            }
        });
    };

    const handleDeleteGroup = async () => {
        showConfirm('Delete Group?', 'Are you sure you want to delete this group? This will delete all messages and cannot be undone.', async () => {
            try {
                await apiClient.deleteConversation(conversationId);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                onClose();
                router.push('/messages');
            } catch (error: any) {
                console.error('Failed to delete group:', error);
                showAlert('Wait!', 'Failed to delete group', 'danger');
            }
        });
    };

    const isLastMember = currentParticipants.length <= 1;

    return (
        <>
            <Transition appear show={isOpen} as={Fragment as any}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <Transition.Child
                        as={Fragment as any}
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
                                as={Fragment as any}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-6">
                                        <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
                                            Group Settings
                                        </Dialog.Title>
                                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="flex gap-6 mb-8">
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-2 group cursor-pointer" onClick={handleAvatarClick}>
                                                {currentAvatarUrl ? (
                                                    <Image
                                                        src={getImageUrl(currentAvatarUrl)}
                                                        alt={name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex items-center justify-center w-full h-full text-2xl font-medium text-gray-500">
                                                        {name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CameraIcon className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Change Avatar</p>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1">
                                                    Group Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none font-medium text-sm transition-all"
                                                    placeholder="Enter group name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none font-medium text-sm transition-all min-h-[80px] resize-none"
                                                    placeholder="What's this group about?"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Members ({currentParticipants.length})</h4>
                                            {isAdmin && (
                                                <div className="relative">
                                                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                                        <MagnifyingGlassIcon className="w-3.5 h-3.5 text-gray-500" />
                                                        <input
                                                            type="text"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            placeholder="Add member..."
                                                            className="bg-transparent border-none outline-none text-xs w-32 font-medium"
                                                        />
                                                    </div>

                                                    {searchResults.length > 0 && (
                                                        <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto p-2 space-y-1">
                                                            {searchResults.map(user => (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => handleAddMember(user.id)}
                                                                    className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors group"
                                                                >
                                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                                        {user.profile?.avatarUrl ? (
                                                                            <Image src={getImageUrl(user.profile.avatarUrl)} alt={user.username} fill className="object-cover" />
                                                                        ) : (
                                                                            <span className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-500">{user.username.charAt(0).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-bold flex-1 text-left">{user.username}</span>
                                                                    <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-black" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {currentParticipants.map((participant: any) => (
                                                <div key={participant.userId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors group">
                                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                        {participant.user?.profile?.avatarUrl ? (
                                                            <Image
                                                                src={getImageUrl(participant.user.profile.avatarUrl)}
                                                                alt={participant.user.username}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <span className="flex items-center justify-center w-full h-full text-sm font-bold text-gray-400">
                                                                {participant.user?.username?.charAt(0).toUpperCase() || '?'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="text-sm font-bold truncate">{participant.user?.username}</p>
                                                                {participant.user?.verificationStatus === 'verified' && <VerifiedBadge size="sm" />}
                                                            </div>
                                                            {participant.role === 'admin' && (
                                                                <span className="bg-black text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Admin</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-medium">Joined {new Date(participant.joinedAt).toLocaleDateString()}</p>
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    if (participant.userId === currentUserId && participant.role === 'admin') {
                                                                        showAlert('Access Denied', 'You cannot remove your own admin status', 'danger');
                                                                        return;
                                                                    }
                                                                    toggleRole(participant.userId, participant.role);
                                                                }}
                                                                className={`p-2 rounded-lg transition-colors ${participant.role === 'admin'
                                                                    ? 'text-blue-600 hover:bg-blue-50'
                                                                    : 'text-gray-400 hover:bg-gray-100'
                                                                    } ${participant.userId === currentUserId && participant.role === 'admin'
                                                                        ? 'opacity-50 cursor-not-allowed'
                                                                        : ''
                                                                    }`}
                                                                title={
                                                                    participant.userId === currentUserId && participant.role === 'admin'
                                                                        ? 'You cannot remove your own admin status'
                                                                        : participant.role === 'admin' ? 'Remove Admin' : 'Make Admin'
                                                                }
                                                            >
                                                                <ShieldCheckIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveMember(participant.userId)}
                                                                className={`p-2 rounded-lg transition-colors ${participant.userId === currentUserId
                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                    : 'text-red-500 hover:bg-red-50'
                                                                    }`}
                                                                title={participant.userId === currentUserId ? 'Use "Leave Group" instead' : 'Remove from group'}
                                                                disabled={participant.userId === currentUserId}
                                                            >
                                                                <UserMinusIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <h4 className="text-xs font-bold text-red-600 uppercase mb-3">Danger Zone</h4>
                                        <button
                                            onClick={isLastMember ? handleDeleteGroup : handleLeaveGroup}
                                            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            {isLastMember ? 'Delete Group' : 'Leave Group'}
                                        </button>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={isUpdating || !name.trim()}
                                            className={`flex-[2] py-3 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:shadow-xl
                                            ${isUpdating || !name.trim()
                                                    ? 'bg-gray-200 cursor-not-allowed shadow-none'
                                                    : 'bg-black hover:bg-gray-900 active:scale-[0.98]'
                                                }`}
                                        >
                                            {isUpdating ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <ConfirmationModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                variant="danger"
            />
        </>
    );
}
