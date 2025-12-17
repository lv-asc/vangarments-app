'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    EllipsisVerticalIcon,
    FaceSmileIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    CheckIcon,
    PhotoIcon,
    MicrophoneIcon,
    PaperClipIcon
} from '@heroicons/react/24/outline';

import { OnlineIndicator } from '@/components/common/OnlineIndicator';
import GroupSettingsModal from '@/components/messaging/GroupSettingsModal';
import AudioRecorder from '@/components/messaging/AudioRecorder';
import MentionSuggestions from '@/components/messaging/MentionSuggestions';

interface MessageReaction {
    emoji: string;
    count: number;
    hasReacted: boolean;
}

interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'image' | 'item_share' | 'voice' | 'file';
    createdAt: string;
    editedAt?: string;
    sender?: {
        id: string;
        username: string;
        profile: any;
    };
    reactions?: any[];
    attachments?: any[];
    mentions?: any[];
}

interface Conversation {
    id: string;
    conversationType: 'direct' | 'entity' | 'group';
    otherParticipant?: {
        id: string;
        username: string;
        profile: any;
        lastSeenAt?: string;
    };
    entity?: any;
    name?: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [selectedMentions, setSelectedMentions] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleConversationUpdate = (updatedConversation: any) => {
        setConversation(prev => prev ? { ...prev, ...updatedConversation } : updatedConversation);
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        loadConversation();
        loadMessages();
        loadCurrentUser();
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadCurrentUser = async () => {
        try {
            const user = await apiClient.getCurrentUser();
            setCurrentUserId(user.id);
        } catch (error) {
            console.error('Failed to get current user:', error);
        }
    };

    const loadConversation = async () => {
        try {
            const conv = await apiClient.getConversation(conversationId);
            setConversation(conv);
            apiClient.markConversationAsRead(conversationId);
        } catch (err: any) {
            console.error('Failed to load conversation:', err);
            if (err.status === 401) {
                router.push('/login');
            }
        }
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const result = await apiClient.getMessages(conversationId);
            setMessages(result.messages || []);
        } catch (err: any) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!messageInput.trim() && pendingAttachments.length === 0) || sendingMessage) return;

        const content = messageInput.trim();
        const attachments = [...pendingAttachments];
        const mentions = [...selectedMentions];

        setMessageInput('');
        setPendingAttachments([]);
        setSelectedMentions([]);
        setSendingMessage(true);
        setShowEmojiPicker(false);

        try {
            const newMessage = await apiClient.sendMessage(
                conversationId,
                content,
                attachments.length > 0 && !content ? (attachments[0].attachmentType === 'image' ? 'image' : 'file') : 'text',
                undefined,
                attachments,
                mentions
            );
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessageInput(content);
            setPendingAttachments(attachments);
            setSelectedMentions(mentions);
        } finally {
            setSendingMessage(false);
            inputRef.current?.focus();
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingMedia(true);
        try {
            const newAttachments: any[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const result = await apiClient.uploadMessageMedia(file);

                // Map storage backend response to message_attachments table format
                newAttachments.push({
                    attachmentType: file.type.startsWith('image/') ? 'image' :
                        file.type.startsWith('video/') ? 'video' :
                            file.type.startsWith('audio/') ? 'audio' : 'file',
                    fileUrl: result.url,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type,
                    thumbnailUrl: result.thumbnailUrl
                });
            }
            setPendingAttachments(prev => [...prev, ...newAttachments]);
        } catch (error: any) {
            alert(error.message || 'Media upload failed');
        } finally {
            setUploadingMedia(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removePendingAttachment = (index: number) => {
        setPendingAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleVoiceMessage = async (file: File) => {
        setSendingMessage(true);
        setIsRecording(false);
        try {
            const result = await apiClient.uploadMessageMedia(file);
            const attachment = {
                attachmentType: 'audio',
                fileUrl: result.url,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
            };

            const newMessage = await apiClient.sendMessage(
                conversationId,
                '',
                'voice',
                undefined,
                [attachment]
            );
            setMessages(prev => [...prev, newMessage]);
        } catch (error: any) {
            alert(error.message || 'Failed to send voice message');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const handleEditMessage = async (messageId: string) => {
        if (!editContent.trim()) return;

        try {
            const updatedMessage = await apiClient.editMessage(messageId, editContent.trim());
            setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
            setEditingMessageId(null);
            setEditContent('');
        } catch (error: any) {
            alert(error.message || 'Failed to edit message');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Delete this message?')) return;

        try {
            await apiClient.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (error: any) {
            alert(error.message || 'Failed to delete message. It may be older than 15 minutes.');
        }
    };

    const handleAddReaction = async (messageId: string, emoji: string) => {
        try {
            await apiClient.addReaction(messageId, emoji);
            loadMessages();
            setActiveReactionMessageId(null);
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }
    };

    const insertEmoji = (emoji: string) => {
        setMessageInput(prev => prev + emoji);
        inputRef.current?.focus();
    };

    const getConversationTitle = (): string => {
        if (!conversation) return 'Loading...';
        if (conversation.name) return conversation.name;
        if (conversation.conversationType === 'direct' && conversation.otherParticipant) {
            return conversation.otherParticipant.profile?.name || conversation.otherParticipant.username;
        }
        if (conversation.conversationType === 'entity' && conversation.entity) {
            return conversation.entity.brandInfo?.name || conversation.entity.name || 'Entity';
        }
        return 'DM';
    };

    const getAvatarUrl = (): string | null => {
        if (!conversation) return null;
        if (conversation.conversationType === 'direct' && conversation.otherParticipant?.profile?.avatarUrl) {
            return conversation.otherParticipant.profile.avatarUrl;
        }
        if (conversation.conversationType === 'entity' && conversation.entity?.brandInfo?.logo) {
            return conversation.entity.brandInfo.logo;
        }
        return null;
    };

    const formatMessageTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatMessageDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const shouldShowDateSeparator = (currentMsg: Message, prevMsg?: Message): boolean => {
        if (!prevMsg) return true;
        const currentDate = new Date(currentMsg.createdAt).toDateString();
        const prevDate = new Date(prevMsg.createdAt).toDateString();
        return currentDate !== prevDate;
    };

    const canEditOrDelete = (msg: Message): boolean => {
        if (msg.senderId !== currentUserId) return false;
        const createdAt = new Date(msg.createdAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        return diffMinutes <= 15;
    };

    const handleMentionSelect = (item: any) => {
        const lastAtIndex = messageInput.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const beforeMention = messageInput.substring(0, lastAtIndex);
            const afterMention = messageInput.substring(lastAtIndex + mentionQuery.length + 1);
            const newValue = `${beforeMention}@${item.name} ${afterMention}`;
            setMessageInput(newValue);

            // Add to selected mentions metadata
            setSelectedMentions(prev => [...prev, {
                mentionType: item.type,
                mentionId: item.id,
                mentionText: item.name
            }]);
        }
        setShowMentions(false);
        setMentionQuery('');
        inputRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setMessageInput(val);

        // Simple mention detection: check if typing after an @
        const parts = val.split(' ');
        const lastPart = parts[parts.length - 1];
        if (lastPart.startsWith('@') && lastPart.length > 1) {
            setMentionQuery(lastPart.substring(1));
            setShowMentions(true);
        } else if (showMentions) {
            setShowMentions(false);
        }
    };

    const renderMessageContent = (msg: Message) => {
        if (!msg.mentions || msg.mentions.length === 0) {
            return <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>;
        }

        // Simplistic mention highlight - in a real app would use a more robust parser
        let content = msg.content;
        return (
            <p className="text-sm whitespace-pre-wrap break-words">
                {content.split(/(@\w+)/g).map((part, i) => {
                    const mention = msg.mentions?.find(m => `@${m.mentionText}` === part);
                    if (mention) {
                        return (
                            <span key={i} className="text-blue-400 font-medium cursor-pointer hover:underline">
                                {part}
                            </span>
                        );
                    }
                    return part;
                })}
            </p>
        );
    };
    const groupReactions = (reactions: any[]): MessageReaction[] => {
        const grouped = new Map<string, { count: number; hasReacted: boolean }>();
        for (const r of reactions) {
            const existing = grouped.get(r.emoji) || { count: 0, hasReacted: false };
            existing.count++;
            if (r.userId === currentUserId) existing.hasReacted = true;
            grouped.set(r.emoji, existing);
        }
        return Array.from(grouped.entries()).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            hasReacted: data.hasReacted,
        }));
    };

    if (loading && !conversation) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => router.push('/messages')}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => conversation?.conversationType === 'group' && setIsSettingsOpen(true)}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
                        {getAvatarUrl() ? (
                            <Image
                                src={getImageUrl(getAvatarUrl()!)}
                                alt={getConversationTitle()}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-lg font-medium text-gray-500">
                                {getConversationTitle().charAt(0).toUpperCase()}
                            </span>
                        )}
                        {/* Status Indicator */}
                        {conversation?.conversationType === 'direct' && conversation.otherParticipant && (
                            <div className="absolute right-0 bottom-0 block w-2.5 h-2.5 rounded-full border-2 border-white pointer-events-none z-10">
                                <OnlineIndicator
                                    lastSeen={conversation.otherParticipant.lastSeenAt}
                                    className="w-full h-full"
                                    showStatusText={false}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900 flex items-center gap-2">
                            {getConversationTitle()}
                        </h1>
                        {conversation?.conversationType === 'direct' && conversation.otherParticipant && (
                            <div className="-mt-1">
                                <OnlineIndicator
                                    lastSeen={conversation.otherParticipant.lastSeenAt}
                                    showStatusText={true}
                                />
                            </div>
                        )}
                        {conversation?.conversationType === 'group' && (
                            <span className="text-xs text-gray-500 block -mt-1">Tap to edit info</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => conversation?.conversationType === 'group' ? setIsSettingsOpen(true) : null}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {conversation && (
                <GroupSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    conversationId={conversation.id}
                    currentName={conversation.name}
                    currentAvatarUrl={getAvatarUrl() || undefined}
                    onUpdate={handleConversationUpdate}
                />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    const isOwn = msg.senderId === currentUserId;
                    const prevMsg = messages[index - 1];
                    const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                    const reactions = groupReactions(msg.reactions || []);

                    return (
                        <div key={msg.id}>
                            {showDateSeparator && (
                                <div className="flex items-center gap-4 my-4">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {formatMessageDate(msg.createdAt)}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                            )}

                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                                <div className="relative max-w-[75%]">
                                    {editingMessageId === msg.id ? (
                                        <div className="bg-white border border-gray-300 rounded-lg p-3">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full border-0 resize-none focus:ring-0 text-sm"
                                                rows={2}
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => { setEditingMessageId(null); setEditContent(''); }}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditMessage(msg.id)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl ${isOwn
                                                    ? 'bg-gray-900 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                                                    }`}
                                            >
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mb-2 space-y-2">
                                                        {msg.attachments.map((att) => (
                                                            <div key={att.id} className="rounded-lg overflow-hidden max-w-sm">
                                                                {att.attachmentType === 'image' ? (
                                                                    <div className="relative aspect-square min-w-[200px] cursor-pointer" onClick={() => window.open(getImageUrl(att.fileUrl), '_blank')}>
                                                                        <Image
                                                                            src={getImageUrl(att.fileUrl)}
                                                                            alt={att.fileName || 'Image'}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    </div>
                                                                ) : att.attachmentType === 'video' ? (
                                                                    <video src={getImageUrl(att.fileUrl)} controls className="max-w-full rounded" />
                                                                ) : att.attachmentType === 'audio' ? (
                                                                    <audio src={getImageUrl(att.fileUrl)} controls className="max-w-full" />
                                                                ) : (
                                                                    <a
                                                                        href={getImageUrl(att.fileUrl)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 p-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200"
                                                                    >
                                                                        <PaperClipIcon className="w-4 h-4" />
                                                                        <span className="text-xs truncate max-w-[150px]">{att.fileName || 'File'}</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {renderMessageContent(msg)}
                                                <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <span className="text-xs">{formatMessageTime(msg.createdAt)}</span>
                                                    {msg.editedAt && <span className="text-xs italic">edited</span>}
                                                </div>
                                            </div>

                                            {isOwn && canEditOrDelete(msg) && (
                                                <div className="absolute -left-16 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                                                    <button
                                                        onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); }}
                                                        className="p-1.5 hover:bg-gray-100 rounded"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="p-1.5 hover:bg-gray-100 rounded"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}
                                                className={`absolute ${isOwn ? '-left-8' : '-right-8'} bottom-0 p-1 hover:bg-gray-100 rounded hidden group-hover:block`}
                                            >
                                                <FaceSmileIcon className="w-4 h-4 text-gray-400" />
                                            </button>

                                            {activeReactionMessageId === msg.id && (
                                                <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} -bottom-10 flex gap-1 bg-white border border-gray-200 rounded-full p-1 shadow-lg z-10`}>
                                                    {QUICK_EMOJIS.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleAddReaction(msg.id, emoji)}
                                                            className="p-1 hover:bg-gray-100 rounded-full text-lg"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {reactions.length > 0 && (
                                                <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    {reactions.map(r => (
                                                        <span
                                                            key={r.emoji}
                                                            className={`px-2 py-0.5 text-xs rounded-full ${r.hasReacted ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            {r.emoji} {r.count > 1 && r.count}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
                {showEmojiPicker && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-xl flex flex-wrap gap-2">
                        {['😀', '😂', '😍', '🤔', '😎', '🙌', '👍', '❤️', '🔥', '✨', '🎉', '💪', '🙏', '👋', '🤝', '💯'].map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => insertEmoji(emoji)}
                                className="p-2 hover:bg-gray-200 rounded text-xl"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {pendingAttachments.length > 0 && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-xl flex flex-wrap gap-2">
                        {pendingAttachments.map((att, i) => (
                            <div key={i} className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden group">
                                {att.attachmentType === 'image' ? (
                                    <Image src={getImageUrl(att.fileUrl)} alt="Preview" fill className="object-cover" />
                                ) : att.attachmentType === 'video' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                                        <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">▶</div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-1 text-[10px] text-gray-500 text-center">
                                        <PaperClipIcon className="w-5 h-5 mb-1" />
                                        <span className="truncate w-full">{att.fileName}</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removePendingAttachment(i)}
                                    className="absolute top-1 right-1 p-0.5 bg-gray-900/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {uploadingMedia && (
                            <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg">
                                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                )}

                {isRecording ? (
                    <AudioRecorder
                        onRecordingComplete={handleVoiceMessage}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <FaceSmileIcon className="w-6 h-6 text-gray-500" />
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingMedia}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <PhotoIcon className="w-6 h-6 text-gray-500" />
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                accept="image/*,video/*,application/pdf"
                                onChange={handleMediaUpload}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsRecording(true)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <MicrophoneIcon className="w-6 h-6 text-gray-500" />
                        </button>

                        <div className="flex-1 relative">
                            {showMentions && (
                                <MentionSuggestions
                                    query={mentionQuery}
                                    onSelect={handleMentionSelect}
                                    onClose={() => setShowMentions(false)}
                                />
                            )}
                            <textarea
                                ref={inputRef}
                                value={messageInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                rows={1}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-2xl resize-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                style={{ maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || sendingMessage || uploadingMedia}
                            className={`p-3 rounded-full transition-all ${((messageInput.trim() || pendingAttachments.length > 0) && !sendingMessage && !uploadingMedia)
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {sendingMessage ? (
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <PaperAirplaneIcon className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
