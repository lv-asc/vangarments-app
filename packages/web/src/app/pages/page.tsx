'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { pageApi, IPage } from '../../lib/pageApi';
import { getImageUrl } from '../../lib/utils';
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import EntityFilterBar from '../../components/ui/EntityFilterBar';

const MotionDiv = motion.div as any;

export default function PagesDirectoryPage() {
    const [pages, setPages] = useState<IPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({
        verificationStatus: '',
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load pages
    useEffect(() => {
        loadPages();
    }, [debouncedSearch, filters]);

    const loadPages = async () => {
        try {
            setLoading(true);
            const response = await pageApi.getAll({
                search: debouncedSearch,
                verificationStatus: filters.verificationStatus,
                limit: 50
            });
            // Based on pageApi.getAll update, it returns { pages: IPage[], pagination: ... }
            setPages(response.pages || []);
        } catch (error) {
            console.error('Failed to load pages', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-6"
                    >
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <DocumentTextIcon className="h-10 w-10 text-blue-600" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
                        Discover Pages
                    </h1>
                    <p className="max-w-xl mx-auto text-xl text-gray-500 mb-8">
                        Explore curated pages, collections, and fashion spaces.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search pages..."
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-shadow hover:shadow-md"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <EntityFilterBar
                filters={filters}
                onFilterChange={setFilters}
                showTier={false}
                showCountry={false}
            />

            {/* Pages Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : pages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {pages.map((page) => (
                            <PageCard key={page.id} page={page} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-medium text-gray-900">No pages found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PageCard({ page }: { page: IPage }) {
    return (
        <Link href={`/pages/${page.slug || page.id}`} className="group block h-full">
            <MotionDiv
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-gray-100 flex flex-col"
            >
                {/* Banner Header */}
                <div className="h-32 bg-gray-200 relative">
                    {page.bannerUrl ? (
                        <img
                            src={getImageUrl(page.bannerUrl)}
                            alt={`${page.name} banner`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors" />
                    )}

                    {/* Logo Overlay */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md border border-gray-100">
                            {page.logoUrl ? (
                                <img
                                    src={getImageUrl(page.logoUrl)}
                                    alt={`${page.name} logo`}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center text-xl font-bold text-gray-400">
                                    {page.name ? page.name.charAt(0) : '?'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-10 pb-6 px-4 text-center flex-1 flex flex-col">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {page.name}
                        </h3>
                        {page.isVerified && (
                            <VerifiedBadge size="sm" />
                        )}
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                        {page.description || 'No description available'}
                    </p>

                    <div className="text-xs text-gray-400 flex items-center justify-center gap-4 border-t border-gray-50 pt-3 mt-auto">
                        <span>{page.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
            </MotionDiv>
        </Link>
    );
}
