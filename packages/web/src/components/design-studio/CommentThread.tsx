'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CanvasComment } from './InfiniteCanvas';
import { UserCircleIcon, PaperAirplaneIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';

interface CommentThreadProps {
    comments: CanvasComment[];
    position: { x: number; y: number };
    onAddReply: (text: string) => void;
    onResolve: () => void;
    onClose: () => void;
    currentUser: { id: string; name: string; avatar?: string };
}

export default function CommentThread({
    comments,
    position,
    onAddReply,
    onResolve,
    onClose,
    currentUser
}: CommentThreadProps) {
    const [replyText, setReplyText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (replyText.trim()) {
            onAddReply(replyText);
            setReplyText('');
        }
    };

    return (
        <div
            className="fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 flex flex-col overflow-hidden transition-all animate-in slide-in-from-right-4"
            style={{
                maxHeight: '80vh'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center space-x-2">
                    <div className="bg-pink-100 text-pink-600 rounded-full p-1">
                        <UserCircleIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Comentários</span>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={onResolve}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Resolve Thread"
                    >
                        <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Close"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-4">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                        {comment.userAvatar ? (
                            <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                            <UserCircleIcon className="w-8 h-8 text-gray-300 flex-shrink-0" />
                        )}
                        <div className="flex-1 space-y-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                                <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                        No comments yet. Start the conversation!
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-gray-50">
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply... (@ to mention)"
                        className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="absolute right-1 p-1.5 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <PaperAirplaneIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
