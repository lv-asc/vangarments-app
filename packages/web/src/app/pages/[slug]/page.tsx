'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { pageApi, IPage } from '@/lib/pageApi';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { GlobeAltIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { FollowEntityButton } from '@/components/social/FollowEntityButton';

export default function StaticPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [page, setPage] = useState<IPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (slug) loadPage();
    }, [slug]);

    // Update document title when page is loaded
    useEffect(() => {
        if (page) {
            document.title = `Page @${page.name}`;
        }
    }, [page]);

    const loadPage = async () => {
        try {
            setLoading(true);
            const data = await pageApi.getPage(slug);
            setPage(data);
        } catch (err: any) {
            console.error(err);
            setError('Page not found.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>;

    if (error || !page) return (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Banner */}
            {page.bannerUrl && (
                <div className="w-full h-48 md:h-64 bg-gray-200 overflow-hidden">
                    <img
                        src={getImageUrl(page.bannerUrl)}
                        alt={`${page.name} banner`}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header with Logo and Name */}
                <div className="flex items-start gap-6 mb-8">
                    {page.logoUrl ? (
                        <div className="w-24 h-24 rounded-xl bg-white shadow-md overflow-hidden flex-shrink-0 border border-gray-100">
                            <img
                                src={getImageUrl(page.logoUrl)}
                                alt={page.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400 flex-shrink-0">
                            {page.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">{page.name}</h1>
                            {page.isVerified && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    ✓ Verified
                                </span>
                            )}
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                            {page.websiteUrl && (
                                <a
                                    href={page.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                >
                                    <GlobeAltIcon className="w-4 h-4" />
                                    Website
                                </a>
                            )}
                            {page.foundedDate && (
                                <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    Founded {page.foundedDate.split('-')[0]}
                                    {page.foundedBy && ` by ${page.foundedBy}`}
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {(page.instagramUrl || page.twitterUrl || page.facebookUrl || (page.socialLinks && page.socialLinks.length > 0)) && (
                            <div className="flex items-center gap-3 mt-4">
                                {page.instagramUrl && (
                                    <a href={page.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                    </a>
                                )}
                                {page.twitterUrl && (
                                    <a href={page.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    </a>
                                )}
                                {page.facebookUrl && (
                                    <a href={page.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    </a>
                                )}
                                {page.socialLinks?.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {link.platform}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Follow Button */}
                        <div className="mt-4">
                            <FollowEntityButton
                                entityType="page"
                                entityId={page.id}
                                size="md"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                {page.description && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                        <div className="prose prose-gray max-w-none text-gray-600">
                            <p>{page.description}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

