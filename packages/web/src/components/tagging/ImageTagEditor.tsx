'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MediaTag, TagType, TagSourceType, TagSearchResult } from '@vangarments/shared';
import { tagApi } from '@/lib/tagApi';
import TagSearchModal from './TagSearchModal';
import TagMarker from './TagMarker';
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ImageTagEditorProps {
    imageUrl: string;
    sourceType: TagSourceType;
    sourceId: string;
    existingTags?: MediaTag[];
    onTagsChange?: (tags: MediaTag[]) => void;
    readOnly?: boolean;
    className?: string;
}

interface PendingTag {
    positionX: number;
    positionY: number;
}

export default function ImageTagEditor({
    imageUrl,
    sourceType,
    sourceId,
    existingTags = [],
    onTagsChange,
    readOnly = false,
    className = '',
}: ImageTagEditorProps) {
    const [tags, setTags] = useState<MediaTag[]>(existingTags);
    const [showTags, setShowTags] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [pendingTag, setPendingTag] = useState<PendingTag | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    // Handle click on image to place a tag
    const handleImageClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (readOnly || !isEditing) return;

            const rect = imageRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            // Clamp values to 0-100
            const positionX = Math.max(0, Math.min(100, x));
            const positionY = Math.max(0, Math.min(100, y));

            setPendingTag({ positionX, positionY });
            setIsSearchModalOpen(true);
        },
        [readOnly, isEditing]
    );

    // Handle entity tag selection
    const handleEntitySelect = async (result: TagSearchResult) => {
        if (!pendingTag) return;

        // Prompt for optional description
        const description = prompt(`Add an optional description for ${result.name}:\n(e.g., "Designer", "Model", "Photographer")\n\nLeave empty if not needed:`);

        setIsLoading(true);
        try {
            const tagRequest = {
                sourceType,
                sourceId,
                imageUrl,
                positionX: pendingTag.positionX,
                positionY: pendingTag.positionY,
                tagType: result.type,
                taggedEntityId: result.type === 'item' ? undefined : result.id,
                taggedItemId: result.type === 'item' ? result.id : undefined,
                description: description?.trim() || undefined,
            };

            const newTag = await tagApi.addTag(tagRequest);
            const updatedTags = [...tags, newTag];
            setTags(updatedTags);
            onTagsChange?.(updatedTags);
            toast.success(`Tagged ${result.name}${description ? ` as "${description}"` : ''}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to add tag');
        } finally {
            setIsLoading(false);
            setPendingTag(null);
            setIsSearchModalOpen(false);
        }
    };

    // Handle location input (for free-text location)
    const handleLocationSubmit = async (locationName: string, locationAddress?: string) => {
        if (!pendingTag || !locationName.trim()) return;

        setIsLoading(true);
        try {
            const tagRequest = {
                sourceType,
                sourceId,
                imageUrl,
                positionX: pendingTag.positionX,
                positionY: pendingTag.positionY,
                tagType: 'location' as TagType,
                locationName: locationName.trim(),
                locationAddress: locationAddress?.trim(),
            };

            const newTag = await tagApi.addTag(tagRequest);
            const updatedTags = [...tags, newTag];
            setTags(updatedTags);
            onTagsChange?.(updatedTags);
            toast.success(`Added location: ${locationName}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to add location');
        } finally {
            setIsLoading(false);
            setPendingTag(null);
            setIsSearchModalOpen(false);
        }
    };

    // Handle tag deletion
    const handleDeleteTag = async (tagId: string) => {
        try {
            await tagApi.deleteTag(tagId);
            const updatedTags = tags.filter(t => t.id !== tagId);
            setTags(updatedTags);
            onTagsChange?.(updatedTags);
            toast.success('Tag removed');
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove tag');
        }
    };

    // Cancel pending tag
    const handleCancelPending = () => {
        setPendingTag(null);
        setIsSearchModalOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Image container */}
            <div
                ref={imageRef}
                className={`relative cursor-${isEditing ? 'crosshair' : 'default'} select-none`}
                onClick={handleImageClick}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt="Tagged image"
                    className="w-full h-auto"
                    draggable={false}
                />

                {/* Existing tags */}
                {showTags && tags.map((tag) => (
                    <TagMarker
                        key={tag.id}
                        tag={tag}
                        onDelete={!readOnly && isEditing ? () => handleDeleteTag(tag.id) : undefined}
                    />
                ))}

                {/* Pending tag marker */}
                {pendingTag && (
                    <div
                        className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse z-20"
                        style={{
                            left: `${pendingTag.positionX}%`,
                            top: `${pendingTag.positionY}%`,
                        }}
                    />
                )}

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Controls */}
            {!readOnly && (
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                    {/* Toggle tags visibility */}
                    <button
                        type="button"
                        onClick={() => setShowTags(!showTags)}
                        className={`p-2 rounded-full ${showTags ? 'bg-white text-gray-800' : 'bg-gray-800/60 text-white'
                            } shadow-md transition-colors`}
                        title={showTags ? 'Hide tags' : 'Show tags'}
                    >
                        <TagIcon className="w-5 h-5" />
                    </button>

                    {/* Toggle edit mode */}
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2 rounded-full ${isEditing ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                            } shadow-md transition-colors`}
                        title={isEditing ? 'Done editing' : 'Add tags'}
                    >
                        {isEditing ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                    </button>
                </div>
            )}

            {/* Tag count badge */}
            {tags.length > 0 && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
                    {tags.length} tag{tags.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* Search Modal */}
            <TagSearchModal
                isOpen={isSearchModalOpen}
                onClose={handleCancelPending}
                onSelectEntity={handleEntitySelect}
                onSubmitLocation={handleLocationSubmit}
            />
        </div>
    );
}
