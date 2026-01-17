'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
    CheckCircleIcon,
    PencilIcon,
    TrashIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { ExpiryBadge } from '@/components/ui/ExpiryIndicator';
import { getImageUrl } from '@/utils/imageUrl';
import type { AnteroomItem } from '@/lib/anteroomApi';

interface AnteroomItemCardProps {
    item: AnteroomItem;
    isSelected?: boolean;
    selectionMode?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onEdit?: (item: AnteroomItem) => void;
    onComplete?: (item: AnteroomItem) => void;
    onRemove?: (item: AnteroomItem) => void;
}

/**
 * AnteroomItemCard - Displays a single anteroom item with completion status
 */
export function AnteroomItemCard({
    item,
    isSelected = false,
    selectionMode = false,
    onSelect,
    onEdit,
    onComplete,
    onRemove,
}: AnteroomItemCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Get the primary image or first available
    const primaryImage = item.images?.find(img => img.isPrimary) || item.images?.[0];
    const imageUrl = primaryImage?.url ? getImageUrl(primaryImage.url) : null;

    // Extract display info from itemData
    const categoryName = item.itemData?.category?.page || 'Uncategorized';
    const brandName = item.itemData?.brand?.brand || 'No brand';
    const conditionStatus = item.itemData?.condition?.status || 'Not set';

    // Completion percentage
    const completionPercent = item.completionStatus?.completionPercentage || 0;
    const isComplete = completionPercent >= 100;

    // Handle selection toggle
    const handleClick = () => {
        if (selectionMode && onSelect) {
            onSelect(item.id, !isSelected);
        } else if (onEdit) {
            onEdit(item);
        }
    };

    // Completion progress color
    const getProgressColor = (): string => {
        if (completionPercent >= 100) return 'bg-emerald-500';
        if (completionPercent >= 75) return 'bg-blue-500';
        if (completionPercent >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div
            className={`
        relative group rounded-xl overflow-hidden bg-white shadow-sm
        border-2 transition-all duration-200 cursor-pointer
        ${isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }
      `}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-square bg-gray-100">
                {imageUrl && !imageError ? (
                    <Image
                        src={imageUrl}
                        alt={`${categoryName} - ${brandName}`}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Expiry Badge - Top Right */}
                <div className="absolute top-2 right-2">
                    <ExpiryBadge daysRemaining={item.daysRemaining} />
                </div>

                {/* Selection Checkbox - Top Left */}
                {selectionMode && (
                    <div className="absolute top-2 left-2">
                        <div
                            className={`
                w-6 h-6 rounded-full flex items-center justify-center
                transition-colors duration-150
                ${isSelected
                                    ? 'bg-indigo-500'
                                    : 'bg-white/80 border-2 border-gray-300'
                                }
              `}
                        >
                            {isSelected && (
                                <CheckCircleSolidIcon className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>
                )}

                {/* Hover Actions */}
                {isHovered && !selectionMode && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}
                            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                            title="Edit item"
                        >
                            <PencilIcon className="w-5 h-5 text-gray-700" />
                        </button>
                        {isComplete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onComplete?.(item); }}
                                className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                                title="Move to wardrobe"
                            >
                                <ArrowRightIcon className="w-5 h-5 text-white" />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove?.(item); }}
                            className="p-2 rounded-full bg-white/90 hover:bg-red-50 transition-colors"
                            title="Remove item"
                        >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                        </button>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="p-3">
                {/* Category & Brand */}
                <div className="mb-2">
                    <p className="font-medium text-gray-900 truncate text-sm">{categoryName}</p>
                    <p className="text-xs text-gray-500 truncate">{brandName}</p>
                </div>

                {/* Completion Progress */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Completion</span>
                        <span className={`font-medium ${isComplete ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {completionPercent}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${getProgressColor()}`}
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>

                {/* Completion Checklist Summary */}
                <div className="mt-2 flex flex-wrap gap-1">
                    {[
                        { key: 'hasRequiredPhotos', label: 'Photos' },
                        { key: 'hasCategory', label: 'Category' },
                        { key: 'hasBrand', label: 'Brand' },
                        { key: 'hasCondition', label: 'Condition' },
                    ].map(({ key, label }) => {
                        const isChecked = item.completionStatus?.[key as keyof typeof item.completionStatus];
                        return (
                            <span
                                key={key}
                                className={`
                  inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded
                  ${isChecked
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }
                `}
                            >
                                {isChecked && <CheckCircleIcon className="w-3 h-3" />}
                                {label}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default AnteroomItemCard;
