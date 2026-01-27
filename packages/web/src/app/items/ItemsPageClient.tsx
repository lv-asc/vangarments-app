'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { skuApi, SKUItem } from '@/lib/skuApi';
import SKUCard from '@/components/ui/SKUCard';
import ItemsFilter, { ItemsFilters } from '@/components/common/ItemsFilter';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ItemsPageClient() {
    const [skus, setSkus] = useState<SKUItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ItemsFilters>({});

    const [total, setTotal] = useState(0);

    const fetchSKUs = useCallback(async () => {
        setLoading(true);
        try {
            const result = await skuApi.searchSKUs(searchQuery, {
                brandId: filters.brandId,
                styleId: filters.styleId,
                patternId: filters.patternId,
                fitId: filters.fitId,
                genderId: filters.genderId,
                apparelId: filters.apparelId,
                materialId: filters.materialId,
                lineId: filters.lineId,
                collection: filters.collection,
                sizeId: filters.sizeId,
                nationality: filters.nationality,
                years: filters.years,
                months: filters.months,
                days: filters.days,
                colorId: filters.colorId,
                subcategory1Id: filters.subcategory1Id,
                subcategory2Id: filters.subcategory2Id,
                subcategory3Id: filters.subcategory3Id,
                parentsOnly: true,
                limit: 50
            });
            setSkus(result.skus);
            setTotal(result.total || 0);
        } catch (error) {
            console.error('Failed to fetch SKUs', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSKUs();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchSKUs]);

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    return (
        <ItemsFilter
            filters={filters}
            onChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
        >
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                        {skus.map((sku, index) => (
                            <div key={sku.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                                <SKUCard item={sku} />
                            </div>
                        ))}
                    </div>
                    {skus.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <MagnifyingGlassIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No items found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                            <button
                                onClick={clearFilters}
                                className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </ItemsFilter>
    );
}
