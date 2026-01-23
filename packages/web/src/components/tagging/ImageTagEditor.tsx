'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MediaTag, TagType, TagSourceType, TagSearchResult } from '@vangarments/shared';
import { tagApi } from '@/lib/tagApi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import TagSearchModal from './TagSearchModal';
import TagMarker from './TagMarker';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
    // const [showTags, setShowTags] = useState(true); // Removed as requested
    const [isEditing, setIsEditing] = useState(false);
    const [pendingTag, setPendingTag] = useState<PendingTag | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);

    // Sync tags state with existingTags prop
    React.useEffect(() => {
        setTags(existingTags);
    }, [existingTags]);

    // Description Modal State
    const [descriptionModal, setDescriptionModal] = useState<{
        isOpen: boolean;
        entity: TagSearchResult | null;
        description: string;
        tagIdToUpdate?: string;
    }>({
        isOpen: false,
        entity: null,
        description: '',
        tagIdToUpdate: undefined as string | undefined // Add this to track editing state
    });
    const descriptionInputRef = useRef<HTMLInputElement>(null);

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

    // Handle entity tag selection (Step 1: Open Description Modal)
    const handleEntitySelect = (result: TagSearchResult) => {
        setIsSearchModalOpen(false); // Close search modal first
        setDescriptionModal({
            isOpen: true,
            entity: result,
            description: ''
        });
        // Auto-focus input after modal opens
        setTimeout(() => descriptionInputRef.current?.focus(), 100);
    };

    // Handle Final Submission (Step 2: Create Tag)
    const handleDescriptionSubmit = async () => {
        if (!descriptionModal.entity) return;

        const { entity, description, tagIdToUpdate } = descriptionModal;

        // Validation: Check for duplicates
        const isDuplicate = tags.some(tag => {
            if (entity.type === 'item') {
                return tag.tagType === 'item' && tag.taggedItemId === entity.id;
            } else {
                return tag.tagType === entity.type && tag.taggedEntityId === entity.id;
            }
        });

        if (isDuplicate) {
            toast.error(`"${entity.name}" is already tagged in this image.`);
            return;
        }


        // Check if we are updating or adding new
        if (tagIdToUpdate) {
            setIsLoading(true);
            try {
                // If updating, we only support description updates technically, 
                // but if entity changed (not possible in current UI flow as we open modal with entity),
                // we'd need to handle that.
                // The current flow for "Edit" just re-opens the description modal with the EXISTING entity.

                const updateRequest = {
                    description: description?.trim() || undefined
                } as any; // Cast to any to avoid type mismatch if UpdateMediaTagRequest is incomplete in shared lib

                const updatedTag = await tagApi.updateTag(tagIdToUpdate, updateRequest);

                const updatedTags = tags.map(t => t.id === tagIdToUpdate ? updatedTag : t);
                setTags(updatedTags);
                onTagsChange?.(updatedTags);
                toast.success(`Updated tag for ${entity.name}`);
            } catch (error: any) {
                toast.error(error.message || 'Failed to update tag');
            } finally {
                setIsLoading(false);
                setDescriptionModal({ isOpen: false, entity: null, description: '', tagIdToUpdate: undefined });
            }
        } else {
            // Creating NEW tag
            if (!pendingTag) return;

            setIsLoading(true);
            try {
                const tagRequest = {
                    sourceType,
                    sourceId,
                    imageUrl,
                    positionX: pendingTag.positionX,
                    positionY: pendingTag.positionY,
                    tagType: entity.type,
                    taggedEntityId: entity.type === 'item' ? undefined : entity.id,
                    taggedItemId: entity.type === 'item' ? entity.id : undefined,
                    description: description?.trim() || undefined,
                };

                const newTag = await tagApi.addTag(tagRequest);
                if (!newTag || !newTag.id) {
                    throw new Error('Server returned an invalid tag object');
                }
                const updatedTags = [...tags, newTag];
                setTags(updatedTags);
                onTagsChange?.(updatedTags);
                toast.success(`Tagged ${entity.name}${description ? ` as "${description}"` : ''}`);
            } catch (error: any) {
                toast.error(error.message || 'Failed to add tag');
            } finally {
                setIsLoading(false);
                setPendingTag(null);
                setDescriptionModal({ isOpen: false, entity: null, description: '', tagIdToUpdate: undefined });
            }
        }
    };

    // Handle location input (now with coordinates from Google Maps)
    const handleLocationSubmit = async (locationData: {
        name: string;
        address?: string;
        lat?: number;
        lng?: number;
    }) => {
        const { name, address, lat, lng } = locationData;
        if (!pendingTag || !name.trim()) return;

        // Validation: Limit to one location per image
        const hasLocation = tags.some(tag => tag.tagType === 'location');
        if (hasLocation) {
            toast.error('Only one location per image is allowed.');
            return;
        }

        setIsLoading(true);
        try {
            const tagRequest = {
                sourceType,
                sourceId,
                imageUrl,
                positionX: pendingTag.positionX,
                positionY: pendingTag.positionY,
                tagType: 'location' as TagType,
                locationName: name.trim(),
                locationAddress: address?.trim(),
                locationLat: lat,
                locationLng: lng,
            };

            const newTag = await tagApi.addTag(tagRequest);
            if (!newTag || !newTag.id) {
                throw new Error('Server returned an invalid tag object');
            }
            const updatedTags = [...tags, newTag];
            setTags(updatedTags);
            onTagsChange?.(updatedTags);
            toast.success(`Added location: ${name}`);
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

    // Handle tag editing
    const handleEditTag = (tag: MediaTag) => {
        // Construct a TagSearchResult-like object from the tag
        // This allows us to reuse the Description Modal
        const entity: TagSearchResult = {
            id: tag.taggedEntityId || tag.taggedItemId || '',
            name: tag.taggedEntity?.name || tag.taggedItem?.name || 'Unknown',
            type: tag.tagType,
            imageUrl: tag.taggedEntity?.imageUrl || tag.taggedItem?.imageUrl,
            subtitle: tag.taggedEntity?.subtitle
        };

        setDescriptionModal({
            isOpen: true,
            entity,
            description: tag.description || '',
            tagIdToUpdate: tag.id
        });

        // Auto-focus input
        setTimeout(() => descriptionInputRef.current?.focus(), 100);
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

                {!readOnly && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
                        {isEditing ? 'Click image to add tag' : 'Click + to add tags'}
                    </div>
                )}

                {/* Existing tags - Always show */}
                {tags.filter(tag => !!tag && !!tag.id).map((tag) => (
                    <TagMarker
                        key={tag.id}
                        tag={tag}
                        onDelete={!readOnly ? () => handleDeleteTag(tag.id) : undefined}
                        onEdit={!readOnly ? () => handleEditTag(tag) : undefined}
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
                    {/* Toggle tags visibility - REMOVED */}{/* Toggle tags visibility - REMOVED */}

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

            {/* Description Input Modal */}
            <Modal
                isOpen={descriptionModal.isOpen}
                onClose={() => setDescriptionModal({ ...descriptionModal, isOpen: false, tagIdToUpdate: undefined })}
                title={`Details for ${descriptionModal.entity?.name}`}
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role or Description (optional)
                        </label>
                        <input
                            ref={descriptionInputRef}
                            type="text"
                            value={descriptionModal.description}
                            onChange={(e) => setDescriptionModal({ ...descriptionModal, description: e.target.value })}
                            placeholder='e.g., "Designer", "Model", "Photographer"'
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleDescriptionSubmit();
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => handleDescriptionSubmit()} // Submit empty description
                        >
                            Skip
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleDescriptionSubmit}
                        >
                            Save Tag
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
