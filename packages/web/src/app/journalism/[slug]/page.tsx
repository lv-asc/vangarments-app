'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { journalismApi, IJournalismData } from '@/lib/journalismApi';
import Link from 'next/link';

// Helper to resolve image URLs (reused from brands - move to utils later?)
const getImageUrl = (url: string | undefined | null) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/api')) return url;
    let path = url.startsWith('/') ? url.substring(1) : url;
    if (path.startsWith('storage/')) path = path.substring('storage/'.length);
    return `/api/storage/${path}`;
};

export default function JournalismPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [item, setItem] = useState<IJournalismData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (slug) loadContent();
    }, [slug]);

    const loadContent = async () => {
        try {
            setLoading(true);
            const data = await journalismApi.getById(slug);
            setItem(data);
        } catch (err: any) {
            console.error(err);
            setError('Content not found or could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>;

    if (error || !item) return (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'Article not found.'}</p>
            <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mb-4">
                {item.type}
            </span>
            <h1 className="text-4xl font-bold mb-2">{item.title}</h1>
            <div className="text-gray-500 mb-8 flex items-center gap-4">
                <span>{new Date(item.createdAt || '').toLocaleDateString()}</span>
                {/* Author display if available */}
            </div>

            {/* Media Gallery (if any) */}
            {item.images && item.images.length > 0 && (
                <div className="mb-8">
                    <img
                        src={getImageUrl(item.images[0].url)}
                        alt={item.title}
                        className="w-full h-auto rounded-lg shadow-sm"
                    />
                    {item.images.length > 1 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            {item.images.slice(1).map((img, idx) => (
                                <img key={idx} src={getImageUrl(img.url)} className="rounded shadow-sm" />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: item.content }} />

            {/* Attachments */}
            {item.attachments && item.attachments.length > 0 && (
                <div className="mt-12 border-t pt-6">
                    <h3 className="font-semibold mb-4">Attachments</h3>
                    <ul className="space-y-2">
                        {item.attachments.map((att, idx) => (
                            <li key={idx}>
                                <a href={getImageUrl(att.url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                    📎 {att.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
