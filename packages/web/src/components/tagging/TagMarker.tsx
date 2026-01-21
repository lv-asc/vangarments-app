'use client';

import React, { useState } from 'react';
import { MediaTag } from '@vangarments/shared';
import Link from 'next/link';
import {
    UserIcon,
    BuildingStorefrontIcon,
    TagIcon,
    MapPinIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';

interface TagMarkerProps {
    tag: MediaTag;
    onDelete?: () => void;
    onClick?: () => void;
}

// Get the appropriate icon for a tag type
function getTagIcon(tagType: string) {
    switch (tagType) {
        case 'user':
            return <UserIcon className="w-3 h-3" />;
        case 'brand':
        case 'store':
        case 'page':
        case 'supplier':
            return <BuildingStorefrontIcon className="w-3 h-3" />;
        case 'item':
            return <TagIcon className="w-3 h-3" />;
        case 'location':
            return <MapPinIcon className="w-3 h-3" />;
        default:
            return <TagIcon className="w-3 h-3" />;
    }
}

// Get the link URL for a tagged entity
function getTagLink(tag: MediaTag): string | null {
    if (tag.tagType === 'location') return null;

    if (tag.tagType === 'location') return null;

    const slug = tag.taggedEntity?.slug;
    const id = tag.taggedEntityId || tag.taggedItemId;

    // Prioritize slug for prettier URLs, fallback to ID
    const identifier = slug || id;

    if (!identifier) return null;

    switch (tag.tagType) {
        case 'user':
            return `/u/${identifier}`;
        case 'brand':
            return `/brands/${identifier}`;
        case 'store':
            return `/stores/${identifier}`;
        case 'page':
            return `/pages/${identifier}`;
        case 'supplier':
            return `/suppliers/${identifier}`;
        case 'item':
            return `/items/${identifier}`;
        default:
            return null;
    }
}

// Get display name for a tag
function getTagDisplayName(tag: MediaTag): string {
    if (tag.tagType === 'location') {
        return tag.locationName || 'Unknown Location';
    }
    if (tag.taggedEntity) {
        return tag.taggedEntity.name;
    }
    if (tag.taggedItem) {
        return tag.taggedItem.name;
    }
    return 'Unknown';
}

// Get subtitle for tag tooltip
function getTagSubtitle(tag: MediaTag): string | null {
    if (tag.tagType === 'location' && tag.locationAddress) {
        return tag.locationAddress;
    }
    if (tag.taggedItem?.brandName) {
        return tag.taggedItem.brandName;
    }
    if (tag.taggedEntity?.subtitle) {
        return tag.taggedEntity.subtitle; // Use subtitle from search result (e.g. @username)
    }
    if (tag.taggedEntity?.type) {
        return tag.taggedEntity.type.charAt(0).toUpperCase() + tag.taggedEntity.type.slice(1);
    }
    return null;
}

export default function TagMarker({ tag, onDelete, onClick }: TagMarkerProps) {
    const [isHovered, setIsHovered] = useState(false);

    const link = getTagLink(tag);
    const displayName = getTagDisplayName(tag);
    const subtitle = getTagSubtitle(tag);
    const icon = getTagIcon(tag.tagType);
    const imageUrl = tag.taggedEntity?.imageUrl || tag.taggedItem?.imageUrl;

    // Determine tooltip position to prevent overflow
    const tooltipPositionClass = tag.positionX > 70 ? 'right-0' : 'left-0';

    const tooltipContent = (
        <div className="flex items-center gap-3 p-3">
            {/* Avatar/Image */}
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{displayName}</p>
                {tag.description && (
                    <p className="text-xs text-blue-600 font-medium truncate">{tag.description}</p>
                )}
                {subtitle && (
                    <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                )}
            </div>

            {/* Delete button */}
            {onDelete && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                >
                    <XMarkIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );

    return (
        <div
            className="absolute z-10"
            style={{
                left: `${tag.positionX}%`,
                top: `${tag.positionY}%`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Marker dot */}
            <div
                className={`
          relative -translate-x-1/2 -translate-y-1/2
          w-6 h-6 rounded-full
          flex items-center justify-center
          cursor-pointer transition-all duration-200
          ${isHovered
                        ? 'bg-white text-gray-900 scale-125'
                        : 'bg-black/60 text-white hover:bg-black/80'}
          border-2 border-white shadow-lg
        `}
                onClick={onClick}
            >
                {icon}
            </div>

            {/* Expanded tooltip on hover */}
            {isHovered && (
                <div
                    className={`
            absolute ${tooltipPositionClass} mt-2
            bg-white rounded-lg shadow-xl
            min-w-[200px] max-w-[280px]
            overflow-hidden
            transform -translate-x-1/2
            z-20
          `}
                    style={{ left: tag.positionX > 70 ? 'auto' : '50%' }}
                >
                    {/* Wrap tooltip in link if available and not in edit mode */}
                    {link && !onDelete ? (
                        <Link href={link} className="block hover:bg-gray-50 transition-colors">
                            {tooltipContent}
                        </Link>
                    ) : (
                        tooltipContent
                    )}
                </div>
            )}
        </div>
    );
}
