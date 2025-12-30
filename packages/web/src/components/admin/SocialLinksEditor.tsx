'use client';

import React, { useState } from 'react';
import { SocialIcon } from '../ui/social-icons';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Favicon } from '../ui/Favicon';

// Platforms that allow multiple entries
const MULTI_ENTRY_PLATFORMS = ['Website'];
const MAX_MULTI_ENTRIES = 5;

const SOCIAL_PLATFORMS = [
    'Website', 'X (Twitter)', 'Discord', 'Instagram', 'YouTube', 'Snapchat', 'Pinterest', 'TikTok',
    'Facebook', 'Spotify', 'Apple Music', 'YouTube Music', 'LinkedIn', 'WhatsApp', 'Telegram'
];

export interface SocialLink {
    id?: string; // Unique ID for multi-entry platforms
    platform: string;
    url: string;
}

interface SocialLinksEditorProps {
    socialLinks: SocialLink[];
    onChange: (links: SocialLink[]) => void;
    label?: string;
}

interface SortableSocialLinkItemProps {
    id: string;
    platform: string;
    url: string;
    index?: number; // For displaying "Website 2", "Website 3", etc.
    onChange: (url: string) => void;
    onRemove: () => void;
}

function SortableSocialLinkItem({ id, platform, url, index, onChange, onRemove }: SortableSocialLinkItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const displayName = index && index > 1 ? `${platform} ${index}` : platform;

    const faviconUrl = platform === 'Website' && url ? url : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center space-x-2 group bg-white p-2 rounded-md border border-gray-200"
        >
            {/* Drag Handle */}
            <button
                type="button"
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
                {...attributes}
                {...listeners}
            >
                <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="w-32 flex items-center space-x-2 flex-shrink-0">
                {faviconUrl ? (
                    <Favicon
                        url={faviconUrl}
                        className="h-4 w-4 rounded-sm"
                        fallbackIcon={
                            <SocialIcon
                                platform={platform}
                                size="sm"
                                className="text-gray-400"
                            />
                        }
                    />
                ) : (
                    <SocialIcon
                        platform={platform}
                        size="sm"
                        className="text-gray-400"
                    />
                )}
                <span className="text-sm text-gray-600 truncate">{displayName}</span>
            </div>

            <input
                type="text"
                value={url}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 text-sm border-gray-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                placeholder={`Your ${platform} URL`}
            />

            <button
                type="button"
                onClick={onRemove}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// Helper to generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Ensure all links have IDs
const ensureIds = (links: SocialLink[]): SocialLink[] => {
    if (!links) return [];
    return links.map(link => ({
        ...link,
        id: link.id || generateId()
    }));
};

export default function SocialLinksEditor({ socialLinks = [], onChange, label = 'Social Links' }: SocialLinksEditorProps) {
    const [showAllWebsites, setShowAllWebsites] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Ensure all links have IDs
    const linksWithIds = ensureIds(socialLinks);

    // Count entries per platform
    const platformCounts = linksWithIds.reduce((acc, link) => {
        acc[link.platform] = (acc[link.platform] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Get website links specifically
    const websiteLinks = linksWithIds.filter(l => l.platform === 'Website');
    const otherLinks = linksWithIds.filter(l => l.platform !== 'Website');

    // Determine which websites to show (first one always, rest hidden unless expanded)
    const visibleWebsites = showAllWebsites ? websiteLinks : websiteLinks.slice(0, 1);
    const hiddenWebsiteCount = websiteLinks.length - 1;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = linksWithIds.findIndex(link => link.id === active.id);
            const newIndex = linksWithIds.findIndex(link => link.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onChange(arrayMove(linksWithIds, oldIndex, newIndex));
            }
        }
    };

    const handleUrlChange = (id: string, url: string) => {
        const newLinks = linksWithIds.map(link =>
            link.id === id ? { ...link, url } : link
        );
        onChange(newLinks);
    };

    const handleRemove = (id: string) => {
        onChange(linksWithIds.filter(link => link.id !== id));
    };

    const handleAdd = (platform: string) => {
        const newLink: SocialLink = {
            id: generateId(),
            platform,
            url: ''
        };
        onChange([...linksWithIds, newLink]);
    };

    // Check which platforms can still be added
    const canAddPlatform = (platform: string) => {
        const count = platformCounts[platform] || 0;
        if (MULTI_ENTRY_PLATFORMS.includes(platform)) {
            return count < MAX_MULTI_ENTRIES;
        }
        return count === 0;
    };

    const availablePlatforms = SOCIAL_PLATFORMS.filter(canAddPlatform);

    // Get index for Website display (Website, Website 2, Website 3, etc.)
    const getWebsiteIndex = (link: SocialLink) => {
        if (link.platform !== 'Website') return undefined;
        const websiteLinks = linksWithIds.filter(l => l.platform === 'Website');
        return websiteLinks.findIndex(l => l.id === link.id) + 1;
    };

    // Combine for display: visible websites first, then other links
    const displayLinks = [...visibleWebsites, ...otherLinks];

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {linksWithIds.length > 0 && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={displayLinks.map(link => link.id!)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {displayLinks.map((link) => (
                                <SortableSocialLinkItem
                                    key={link.id}
                                    id={link.id!}
                                    platform={link.platform}
                                    url={link.url}
                                    index={getWebsiteIndex(link)}
                                    onChange={(url) => handleUrlChange(link.id!, url)}
                                    onRemove={() => handleRemove(link.id!)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Expand/collapse button for additional websites */}
            {hiddenWebsiteCount > 0 && !showAllWebsites && (
                <button
                    type="button"
                    onClick={() => setShowAllWebsites(true)}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <ChevronDownIcon className="h-4 w-4 mr-1" />
                    Show {hiddenWebsiteCount} more website{hiddenWebsiteCount > 1 ? 's' : ''}
                </button>
            )}

            {showAllWebsites && websiteLinks.length > 1 && (
                <button
                    type="button"
                    onClick={() => setShowAllWebsites(false)}
                    className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ChevronUpIcon className="h-4 w-4 mr-1" />
                    Hide extra websites
                </button>
            )}

            {availablePlatforms.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 w-full">Add a link:</span>
                    {availablePlatforms.map((platform) => {
                        const count = platformCounts[platform] || 0;
                        const isMulti = MULTI_ENTRY_PLATFORMS.includes(platform);
                        const showCount = isMulti && count > 0;

                        return (
                            <button
                                key={platform}
                                type="button"
                                onClick={() => handleAdd(platform)}
                                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                <PlusIcon className="h-3 w-3 mr-1" />
                                {platform}
                                {showCount && <span className="ml-1 text-gray-400">({count}/{MAX_MULTI_ENTRIES})</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {linksWithIds.length === 0 && (
                <p className="text-sm text-gray-500 italic">No social links added yet. Click a platform above to add one.</p>
            )}
        </div>
    );
}
