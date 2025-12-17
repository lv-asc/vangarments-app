
import { useState, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    currentName?: string;
    currentAvatarUrl?: string;
    onUpdate: (updatedConversation: any) => void;
}

export default function GroupSettingsModal({
    isOpen,
    onClose,
    conversationId,
    currentName,
    currentAvatarUrl,
    onUpdate
}: GroupSettingsModalProps) {
    const [name, setName] = useState(currentName || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsUpdating(true);
        try {
            const updated = await apiClient.updateConversation(conversationId, { name });
            onUpdate(updated);
            onClose();
        } catch (error) {
            console.error('Failed to update group:', error);
            alert('Failed to update group settings');
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

        // TODO: Implement conversation avatar upload
        // Currently dependent on backend support for conversation specific avatars or generic file upload
        // For now, let's assume we can use the generic storage upload and then update the conversation
        setIsUpdating(true);
        try {
            const { url } = await apiClient.uploadFile(file);
            const updated = await apiClient.updateConversation(conversationId, { avatarUrl: url });
            onUpdate(updated);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            alert('Failed to update group avatar');
        } finally {
            setIsUpdating(false);
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
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Group Settings
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-3 group cursor-pointer" onClick={handleAvatarClick}>
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
                                    <p className="text-xs text-gray-500">Click to change avatar</p>
                                </div>

                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Group Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={isUpdating || !name.trim()}
                                            className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2
                        ${isUpdating || !name.trim()
                                                    ? 'bg-gray-300 cursor-not-allowed'
                                                    : 'bg-gray-900 hover:bg-gray-800'
                                                }`}
                                        >
                                            {isUpdating ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
