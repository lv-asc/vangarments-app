'use client';

import React, { useState } from 'react';
import {
    SwatchIcon,
    TagIcon,
    BeakerIcon,
    SparklesIcon,
    FolderIcon,
    XMarkIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface QualityApplicationPanelProps {
    selectedCount: number;
    onApply: (quality: string, value: any) => void;
    onCancel: () => void;
    isApplying?: boolean;
}

type QualityType = 'color' | 'brand' | 'material' | 'condition' | 'category';

/**
 * QualityApplicationPanel - Apply qualities to selected items
 * Supports both individual and bulk (filter) mode
 */
export function QualityApplicationPanel({
    selectedCount,
    onApply,
    onCancel,
    isApplying = false,
}: QualityApplicationPanelProps) {
    const [selectedQuality, setSelectedQuality] = useState<QualityType | null>(null);
    const [qualityValue, setQualityValue] = useState<any>(null);

    // Quality options
    const qualityOptions = [
        {
            key: 'color' as QualityType,
            label: 'Color',
            icon: SwatchIcon,
            description: 'Set primary color'
        },
        {
            key: 'brand' as QualityType,
            label: 'Brand',
            icon: TagIcon,
            description: 'Set brand name'
        },
        {
            key: 'material' as QualityType,
            label: 'Material',
            icon: BeakerIcon,
            description: 'Set fabric/material'
        },
        {
            key: 'condition' as QualityType,
            label: 'Condition',
            icon: SparklesIcon,
            description: 'Set item condition'
        },
        {
            key: 'category' as QualityType,
            label: 'Category',
            icon: FolderIcon,
            description: 'Set category'
        },
    ];

    // Common color options
    const colorOptions = [
        { value: 'Black', hex: '#000000' },
        { value: 'White', hex: '#FFFFFF' },
        { value: 'Navy', hex: '#1E3A5F' },
        { value: 'Blue', hex: '#3B82F6' },
        { value: 'Red', hex: '#EF4444' },
        { value: 'Green', hex: '#22C55E' },
        { value: 'Yellow', hex: '#EAB308' },
        { value: 'Pink', hex: '#EC4899' },
        { value: 'Purple', hex: '#8B5CF6' },
        { value: 'Gray', hex: '#6B7280' },
        { value: 'Brown', hex: '#92400E' },
        { value: 'Beige', hex: '#D4C8BE' },
    ];

    // Condition options
    const conditionOptions = [
        'New',
        'Excellent Used',
        'Good',
        'Fair',
        'Poor',
    ];

    // Material options
    const materialOptions = [
        'Cotton',
        'Polyester',
        'Wool',
        'Silk',
        'Linen',
        'Denim',
        'Leather',
        'Cashmere',
        'Nylon',
        'Viscose',
    ];

    const handleApply = () => {
        if (selectedQuality && qualityValue) {
            onApply(selectedQuality, qualityValue);
        }
    };

    const renderValueSelector = () => {
        switch (selectedQuality) {
            case 'color':
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Select a color to apply:</p>
                        <div className="grid grid-cols-6 gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setQualityValue(color.value)}
                                    className={`
                    w-10 h-10 rounded-lg border-2 transition-all
                    ${qualityValue === color.value
                                            ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110'
                                            : 'border-gray-200 hover:border-gray-400'
                                        }
                  `}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.value}
                                />
                            ))}
                        </div>
                        {qualityValue && (
                            <p className="text-sm font-medium text-gray-700">Selected: {qualityValue}</p>
                        )}
                    </div>
                );

            case 'condition':
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Select condition:</p>
                        <div className="flex flex-wrap gap-2">
                            {conditionOptions.map((condition) => (
                                <button
                                    key={condition}
                                    onClick={() => setQualityValue(condition)}
                                    className={`
                    px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${qualityValue === condition
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                        }
                  `}
                                >
                                    {condition}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'material':
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Select material:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {materialOptions.map((material) => (
                                <button
                                    key={material}
                                    onClick={() => setQualityValue(material)}
                                    className={`
                    px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left
                    ${qualityValue === material
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                        }
                  `}
                                >
                                    {material}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'brand':
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Enter brand name:</p>
                        <input
                            type="text"
                            value={qualityValue || ''}
                            onChange={(e) => setQualityValue(e.target.value)}
                            placeholder="Brand name"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                );

            case 'category':
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">Enter category page:</p>
                        <select
                            value={qualityValue?.page || ''}
                            onChange={(e) => setQualityValue({ page: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Select category</option>
                            <option value="Apparel">Apparel</option>
                            <option value="Footwear">Footwear</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Bags">Bags</option>
                            <option value="Jewelry">Jewelry</option>
                        </select>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                    Apply Quality to {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
                </h3>
                <button
                    onClick={onCancel}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Quality Type Selection */}
            <div className="grid grid-cols-5 gap-2">
                {qualityOptions.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => {
                            setSelectedQuality(key);
                            setQualityValue(null);
                        }}
                        className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all
              ${selectedQuality === key
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-400'
                            }
            `}
                    >
                        <Icon className={`w-5 h-5 ${selectedQuality === key ? 'text-indigo-600' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${selectedQuality === key ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Value Selector */}
            {selectedQuality && (
                <div className="pt-2 border-t border-gray-100">
                    {renderValueSelector()}
                </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                    onClick={handleApply}
                    disabled={!selectedQuality || !qualityValue || isApplying}
                    className="flex items-center gap-2"
                >
                    {isApplying ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Applying...
                        </>
                    ) : (
                        <>
                            <CheckIcon className="w-4 h-4" />
                            Apply to {selectedCount} {selectedCount === 1 ? 'item' : 'items'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default QualityApplicationPanel;
