'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface MentionSuggestionsProps {
    query: string;
    onSelect: (item: { id: string; name: string; type: 'user' | 'brand' | 'store' | 'supplier' }) => void;
    onClose: () => void;
}

export default function MentionSuggestions({ query, onSelect, onClose }: MentionSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                // Search both users and entities
                // For now, we'll focus on users and search them using the existing searchUsers
                const users = await apiClient.searchUsers(query, 5);

                // Map users to a common format
                const userSuggestions = users.map((u: any) => ({
                    id: u.id,
                    name: u.username,
                    displayName: u.profile?.name || u.username,
                    avatar: u.profile?.avatarUrl,
                    type: 'user'
                }));

                // In a real app, we'd also search brands/stores etc.
                // For now we'll just use users as a proof of concept
                setSuggestions(userSuggestions);
            } catch (error) {
                console.error('Failed to fetch mention suggestions:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % Math.max(1, suggestions.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
            } else if (e.key === 'Enter' && suggestions.length > 0) {
                e.preventDefault();
                onSelect(suggestions[activeIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestions, activeIndex, onSelect, onClose]);

    if (query.length < 1 || (suggestions.length === 0 && !loading)) return null;

    return (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Suggestions
            </div>

            <div className="max-h-60 overflow-y-auto">
                {loading ? (
                    <div className="p-4 flex justify-center">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                ) : suggestions.length > 0 ? (
                    suggestions.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
                                {item.avatar ? (
                                    <Image
                                        src={getImageUrl(item.avatar)}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                    {item.displayName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    @{item.name}
                                </div>
                            </div>
                            <div className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium uppercase">
                                {item.type}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-4 text-sm text-gray-500 text-center">
                        No results found
                    </div>
                )}
            </div>
        </div>
    );
}
