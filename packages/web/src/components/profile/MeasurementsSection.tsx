'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CountryFlag } from '@/components/ui/flags';

interface RingSizes {
    thumb?: string;
    indexFinger?: string;
    middleFinger?: string;
    ringFinger?: string;
    pinky?: string;
}

interface SizeRange {
    min?: string;
    max?: string;
}

interface CategorySizes {
    shoes?: SizeRange;
    tops?: string[];
    bottoms?: string[];
    dresses?: string[];
    waist?: SizeRange;
    rings?: RingSizes;
}

interface UserMeasurements {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    inseam?: number;
    shoulders?: number;
    armLength?: number;
    sizes?: {
        [standard: string]: CategorySizes;
    };
    preferredStandard?: 'BR' | 'US' | 'EU' | 'UK';
    updatedAt?: string;
}

interface MeasurementsSectionProps {
    measurements?: UserMeasurements;
    onEdit?: () => void;
    isEditing?: boolean;
}

const STANDARDS = [
    { key: 'BR' as const, label: 'Brazil', flag: 'BR' },
    { key: 'US' as const, label: 'United States', flag: 'US' },
    { key: 'EU' as const, label: 'Europe', flag: 'EU' },
    { key: 'UK' as const, label: 'United Kingdom', flag: 'UK' }
];

const FINGER_LABELS: Record<string, string> = {
    thumb: 'Thumb',
    indexFinger: 'Index',
    middleFinger: 'Middle',
    ringFinger: 'Ring',
    pinky: 'Pinky'
};

export function MeasurementsSection({ measurements, onEdit, isEditing = false }: MeasurementsSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [displayStandard, setDisplayStandard] = useState<'BR' | 'US' | 'EU' | 'UK'>(
        measurements?.preferredStandard || 'BR'
    );

    const formatSizeRange = (range?: SizeRange): string => {
        if (!range) return '—';
        const { min, max } = range;
        if (!min && !max) return '—';
        if (min && max && min === max) return `${min} ${displayStandard}`;
        if (min && max) return `${min} - ${max} ${displayStandard}`;
        if (min) return `${min}+ ${displayStandard}`;
        if (max) return `up to ${max} ${displayStandard}`;
        return '—';
    };

    const currentSizes = measurements?.sizes?.[displayStandard];
    const hasAnyData = measurements && (
        measurements.height ||
        measurements.weight ||
        measurements.sizes
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-50 rounded-lg">
                        <svg className="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Measurements & Sizes</h3>
                        <p className="text-sm text-gray-500">Your preferred sizes and body measurements</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                            className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Editar medidas"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    )}
                    {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                    {/* Standard Selector */}
                    <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
                        <span className="text-sm text-gray-500 mr-2">Display in:</span>
                        {STANDARDS.map((standard) => (
                            <button
                                key={standard.key}
                                onClick={() => setDisplayStandard(standard.key)}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${displayStandard === standard.key
                                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <CountryFlag country={standard.flag} size="sm" />
                                <span>{standard.key}</span>
                            </button>
                        ))}
                    </div>

                    {!hasAnyData ? (
                        <div className="py-8 text-center">
                            <p className="text-gray-500">No measurements registered yet.</p>
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="mt-3 text-pink-600 hover:text-pink-700 font-medium text-sm"
                                >
                                    + Add measurements
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Body Measurements */}
                            {(measurements?.height || measurements?.weight) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {measurements?.height && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Height</p>
                                            <p className="text-lg font-semibold text-gray-900">{measurements.height} cm</p>
                                        </div>
                                    )}
                                    {measurements?.weight && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Weight</p>
                                            <p className="text-lg font-semibold text-gray-900">{measurements.weight} kg</p>
                                        </div>
                                    )}
                                    {measurements?.chest && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Bust</p>
                                            <p className="text-lg font-semibold text-gray-900">{measurements.chest} cm</p>
                                        </div>
                                    )}
                                    {measurements?.waist && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Waist</p>
                                            <p className="text-lg font-semibold text-gray-900">{measurements.waist} cm</p>
                                        </div>
                                    )}
                                    {measurements?.hips && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Hips</p>
                                            <p className="text-lg font-semibold text-gray-900">{measurements.hips} cm</p>
                                        </div>
                                    )}
                                    {measurements?.inseam && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Inseam</p>
                                            <p className="text-lg font-semibold text-gray-900">{measurements.inseam} cm</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Size Preferences */}
                            {currentSizes && (
                                <div className="space-y-3">
                                    {/* Shoes */}
                                    {currentSizes.shoes && (currentSizes.shoes.min || currentSizes.shoes.max) && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Footwear</span>
                                            <span className="font-medium text-gray-900">{formatSizeRange(currentSizes.shoes)}</span>
                                        </div>
                                    )}

                                    {/* Waist */}
                                    {currentSizes.waist && (currentSizes.waist.min || currentSizes.waist.max) && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Waist (pants)</span>
                                            <span className="font-medium text-gray-900">{formatSizeRange(currentSizes.waist)}</span>
                                        </div>
                                    )}

                                    {/* Tops */}
                                    {currentSizes.tops && currentSizes.tops.length > 0 && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Tops/Shirts</span>
                                            <span className="font-medium text-gray-900">{currentSizes.tops.join(', ')} {displayStandard}</span>
                                        </div>
                                    )}

                                    {/* Bottoms */}
                                    {currentSizes.bottoms && currentSizes.bottoms.length > 0 && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Pants/Skirts</span>
                                            <span className="font-medium text-gray-900">{currentSizes.bottoms.join(', ')} {displayStandard}</span>
                                        </div>
                                    )}

                                    {/* Dresses */}
                                    {currentSizes.dresses && currentSizes.dresses.length > 0 && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Dresses</span>
                                            <span className="font-medium text-gray-900">{currentSizes.dresses.join(', ')} {displayStandard}</span>
                                        </div>
                                    )}

                                    {/* Rings */}
                                    {currentSizes.rings && Object.keys(currentSizes.rings).length > 0 && (
                                        <div className="pt-2">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Rings</p>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                                {Object.entries(FINGER_LABELS).map(([key, label]) => (
                                                    <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                                                        <p className="text-xs text-gray-500">{label}</p>
                                                        <p className="font-medium text-gray-900">
                                                            {currentSizes.rings?.[key as keyof RingSizes] || '—'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
