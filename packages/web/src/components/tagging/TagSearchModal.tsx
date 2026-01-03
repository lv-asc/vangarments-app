'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TagSearchResult, TagType } from '@vangarments/shared';
import { tagApi } from '@/lib/tagApi';
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    UserIcon,
    BuildingStorefrontIcon,
    TagIcon,
    MapPinIcon,
    DocumentTextIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

interface TagSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEntity: (result: TagSearchResult) => void;
    onSubmitLocation: (name: string, address?: string) => void;
}

type TabType = 'entities' | 'items' | 'location';

const ENTITY_TYPES: { type: TagType; label: string; icon: React.ReactNode }[] = [
    { type: 'user', label: 'Users', icon: <UserIcon className="w-4 h-4" /> },
    { type: 'brand', label: 'Brands', icon: <BuildingStorefrontIcon className="w-4 h-4" /> },
    { type: 'store', label: 'Stores', icon: <BuildingStorefrontIcon className="w-4 h-4" /> },
    { type: 'page', label: 'Pages', icon: <DocumentTextIcon className="w-4 h-4" /> },
    { type: 'supplier', label: 'Suppliers', icon: <TruckIcon className="w-4 h-4" /> },
];

export default function TagSearchModal({
    isOpen,
    onClose,
    onSelectEntity,
    onSubmitLocation,
}: TagSearchModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('entities');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<TagSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<TagType[]>(['user', 'brand', 'store', 'page', 'supplier']);
    const [locationName, setLocationName] = useState('');
    const [locationAddress, setLocationAddress] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setResults([]);
            setLocationName('');
            setLocationAddress('');
            setActiveTab('entities');
        }
    }, [isOpen]);

    // Debounced search
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            if (activeTab === 'items') {
                const response = await tagApi.searchItems(query, 10);
                setResults(response.results);
            } else if (activeTab === 'entities') {
                const response = await tagApi.searchEntities(query, selectedTypes, 10);
                setResults(response.results);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, selectedTypes]);

    // Handle search input change with debounce
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            performSearch(query);
        }, 300);
    };

    // Toggle entity type filter
    const toggleEntityType = (type: TagType) => {
        setSelectedTypes((prev) => {
            if (prev.includes(type)) {
                return prev.filter((t) => t !== type);
            }
            return [...prev, type];
        });
    };

    // Handle location submission
    const handleLocationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (locationName.trim()) {
            onSubmitLocation(locationName, locationAddress);
        }
    };

    // Get icon for result type
    const getResultIcon = (type: TagType) => {
        switch (type) {
            case 'user':
                return <UserIcon className="w-5 h-5 text-gray-400" />;
            case 'brand':
            case 'store':
                return <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />;
            case 'page':
                return <DocumentTextIcon className="w-5 h-5 text-gray-400" />;
            case 'supplier':
                return <TruckIcon className="w-5 h-5 text-gray-400" />;
            case 'item':
                return <TagIcon className="w-5 h-5 text-gray-400" />;
            default:
                return <TagIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg text-gray-900">Tag someone or something</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        type="button"
                        onClick={() => setActiveTab('entities')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'entities'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        People & Entities
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('items')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'items'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Items
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('location')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'location'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Location
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab !== 'location' ? (
                        <>
                            {/* Search input */}
                            <div className="relative mb-4">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder={activeTab === 'items' ? 'Search items...' : 'Search people, brands...'}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Entity type filters (only for entities tab) */}
                            {activeTab === 'entities' && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {ENTITY_TYPES.map(({ type, label, icon }) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleEntityType(type)}
                                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${selectedTypes.includes(type)
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {icon}
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Results list */}
                            <div className="max-h-64 overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : results.length > 0 ? (
                                    <ul className="divide-y">
                                        {results.map((result) => (
                                            <li key={`${result.type}-${result.id}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectEntity(result)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    {result.imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={result.imageUrl}
                                                            alt={result.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                            {getResultIcon(result.type)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">{result.name}</p>
                                                        {result.subtitle && (
                                                            <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : searchQuery.trim() ? (
                                    <p className="text-center py-8 text-gray-500">No results found</p>
                                ) : (
                                    <p className="text-center py-8 text-gray-500">
                                        Start typing to search...
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Location form */
                        <form onSubmit={handleLocationSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location Name *
                                </label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={locationName}
                                        onChange={(e) => setLocationName(e.target.value)}
                                        placeholder="e.g., Central Park, NYC"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address (optional)
                                </label>
                                <textarea
                                    value={locationAddress}
                                    onChange={(e) => setLocationAddress(e.target.value)}
                                    placeholder="Full address or additional details"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    rows={2}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!locationName.trim()}
                                className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Add Location Tag
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
