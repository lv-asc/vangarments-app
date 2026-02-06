'use client';

import React, { useState } from 'react';
import { WardrobeGrid } from '../wardrobe/WardrobeGrid';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ItemSelectorProps {
    onSelectItem: (item: any) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function ItemSelector({ onSelectItem, isOpen }: Omit<ItemSelectorProps, 'onClose'>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [mode, setMode] = useState<'wardrobe' | 'sandbox'>('wardrobe');

    if (!isOpen) return null;

    return (
        <div className="w-80 h-full bg-white flex flex-col border-r border-gray-100 shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Add Item</h2>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                    <button
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'wardrobe'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                        onClick={() => setMode('wardrobe')}
                    >
                        My Wardrobe
                    </button>
                    <button
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'sandbox'
                            ? 'bg-[#00132d] text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                        onClick={() => setMode('sandbox')}
                    >
                        Sandbox Mode
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder={mode === 'wardrobe' ? "Search wardrobe..." : "Search global catalog..."}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-200 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'Top', 'Bottom', 'Shoes', 'Accessories'].map((cat) => (
                        <button
                            key={cat}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === cat
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat === 'all' ? 'All Categories' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <WardrobeGrid
                    viewMode="grid"
                    searchQuery={searchQuery}
                    selectedCategory={category}
                    gridColumns="grid-cols-2"
                    isCompact={true}
                    mode={mode}
                    onItemClick={(item) => {
                        onSelectItem({ ...item, itemType: mode === 'sandbox' ? 'sku' : 'vufs' });
                    }}
                />
            </div>
        </div>
    );
}
