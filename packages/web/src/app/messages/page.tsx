'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthWrapper';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { getImageUrl, getUserAvatarUrl } from '@/lib/utils';
import {
    ChatBubbleLeftRightIcon,
    MagnifyingGlassIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

import { OnlineIndicator } from '@/components/common/OnlineIndicator';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

import NewConversationModal from '@/components/messaging/NewConversationModal';

interface Conversation {
    id: string;
    conversationType: 'direct' | 'entity' | 'group';
    entityType?: string;
    entityId?: string;
    name?: string;
    lastMessage?: {
        content: string;
        createdAt: string;
        sender?: { username: string };
    };
    unreadCount?: number;
    otherParticipant?: {
        id: string;
        username: string;
        profile: any;
        lastSeenAt?: string;
        verificationStatus?: string;
    };
    entity?: any;
    avatarUrl?: string;
    slug?: string;
    createdAt: string;
    verificationStatus?: string;
}

export default function MessagesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

    useEffect(() => {
        document.title = 'DMs';
    }, []);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const result = await apiClient.getConversations();
            setConversations(result.conversations || []);
        } catch (err: any) {
            console.error('Failed to load conversations:', err);
            if (err.status === 401) {
                router.push('/login');
                return;
            }
            setError(err.message || 'Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleConversationCreated = (conversationId: string, slug?: string, otherUsername?: string) => {
        // For direct conversations, use username-based URL
        if (otherUsername) {
            router.push(`/messages/u/${otherUsername}`);
        } else {
            router.push(`/messages/${slug || conversationId}`);
        }
        // Optionally refresh list
        loadConversations();
    };

    const getConversationUrl = (conv: Conversation): string => {
        // For direct conversations, use username-based URL
        if (conv.conversationType === 'direct' && conv.otherParticipant) {
            return `/messages/u/${conv.otherParticipant.username}`;
        }
        // For group and entity conversations, use slug or ID
        return `/messages/${conv.slug || conv.id}`;
    };

    const getConversationTitle = (conv: Conversation): string => {
        if (conv.name) return conv.name;
        if (conv.conversationType === 'group') return 'Group Chat';
        if (conv.conversationType === 'direct' && conv.otherParticipant) {
            return conv.otherParticipant.profile?.name || conv.otherParticipant.username;
        }
        if (conv.conversationType === 'entity' && conv.entity) {
            return conv.entity.brandInfo?.name || conv.entity.name || 'Entity';
        }
        return 'Conversation';
    };

    const getConversationAvatar = (conv: Conversation): string | null => {
        if (conv.avatarUrl) return conv.avatarUrl;
        if (conv.conversationType === 'direct' && conv.otherParticipant) {
            return getUserAvatarUrl(conv.otherParticipant);
        }
        if (conv.conversationType === 'entity' && conv.entity) {
            // Handle Page logos specifically if entityType is page, or fallback to generic logic
            if (conv.entityType === 'page') {
                return conv.entity.logoUrl || conv.entity.logo || null;
            }
            return conv.entity.brandInfo?.logo || null;
        }
        return null;
    };

    const getAvatarInitial = (conv: Conversation): string => {
        const title = getConversationTitle(conv);
        return title.charAt(0).toUpperCase();
    };

    const formatTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Filter conversations if needed locally, though search bar now opens modal for "global" search.
    // Keeping local filter for now as a fallback or if we want to filter existing convs AND show modal.
    // The requirement says: "Change its name to 'Search/Create Chats'" and presumably use it to open the modal.
    const filteredConversations = conversations;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <ChatBubbleLeftRightIcon className="w-7 h-7" />
                    DMs
                </h1>
                <button
                    onClick={() => setIsNewConversationModalOpen(true)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    title="New Message"
                >
                    <PlusIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <NewConversationModal
                isOpen={isNewConversationModalOpen}
                onClose={() => setIsNewConversationModalOpen(false)}
                onConversationCreated={handleConversationCreated}
            />

            {/* Search - Opens Modal */}
            <div className="relative mb-6 cursor-pointer" onClick={() => setIsNewConversationModalOpen(true)}>
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search/Create Chats"
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all cursor-pointer"
                />
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {/* Conversation List */}
            {filteredConversations.length === 0 ? (
                <div className="text-center py-16">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h2>
                    <p className="text-gray-500">
                        Start a conversation by messaging someone from their profile or using the search above.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredConversations.map((conv) => {
                        // Determine entity tag label
                        let entityLabel = 'Entity';
                        if (conv.conversationType === 'direct') entityLabel = 'User';
                        else if (conv.conversationType === 'group') entityLabel = 'Group';
                        else if (conv.entityType) {
                            // Prioritize brandInfo.businessType
                            const businessType = conv.entity?.brandInfo?.businessType || conv.entityType;
                            if (businessType === 'non_profit') entityLabel = 'Non Profit';
                            else entityLabel = businessType.charAt(0).toUpperCase() + businessType.slice(1);
                        }

                        return (
                            <Link
                                key={conv.id}
                                href={getConversationUrl(conv)}
                                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                                        {getConversationAvatar(conv) ? (
                                            <Image
                                                src={getImageUrl(getConversationAvatar(conv)!)}
                                                alt={getConversationTitle(conv)}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-xl font-medium text-gray-500">
                                                {getAvatarInitial(conv)}
                                            </span>
                                        )}
                                        {/* Status Indicator */}
                                        {conv.conversationType === 'direct' && conv.otherParticipant && (
                                            <div className="absolute right-0 bottom-0 block w-3 h-3 rounded-full border-2 border-white pointer-events-none z-10">
                                                <OnlineIndicator
                                                    lastSeen={conv.otherParticipant.lastSeenAt}
                                                    className="w-full h-full"
                                                    showStatusText={false}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {(conv.unreadCount || 0) > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <h3 className={`font-medium truncate ${(conv.unreadCount || 0) > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {getConversationTitle(conv)}
                                            </h3>
                                            {/* Verified Badge */}
                                            {((conv.conversationType === 'direct' && conv.otherParticipant?.verificationStatus === 'verified') ||
                                                (conv.conversationType === 'entity' && conv.entity?.verificationStatus === 'verified') ||
                                                (conv.verificationStatus === 'verified')) && (
                                                    <VerifiedBadge size="sm" />
                                                )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            {/* Tag */}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${conv.conversationType === 'direct' ? 'bg-gray-100 text-gray-600' :
                                                conv.conversationType === 'group' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-purple-50 text-purple-600'
                                                }`}>
                                                {entityLabel}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {conv.lastMessage?.createdAt
                                                    ? formatTime(conv.lastMessage.createdAt)
                                                    : formatTime(conv.createdAt)
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <p className={`text-sm truncate ${(conv.unreadCount || 0) > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {conv.lastMessage ? (
                                            <>
                                                {user?.username && conv.lastMessage.sender?.username === user.username && 'You: '}
                                                {conv.lastMessage.content}
                                            </>
                                        ) : 'No messages yet'}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
