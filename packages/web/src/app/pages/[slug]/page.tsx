'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { pageApi, IPage } from '@/lib/pageApi';
import Link from 'next/link';

// Page interface: name, description. Where is content?
// Checking Page model: content is NOT in IPage interface?
// Checking backend PageModel: it has 'content' column?
// Let's re-read PageModel.ts.

function PageContent({ page }: { page: any }) {
    // If description stores HTML/Markdown:
    return (
        <div className="prose max-w-none">
            {/* Assuming description is potentially rich text */}
            {page.description ? (
                <div dangerouslySetInnerHTML={{ __html: page.description }} />
            ) : (
                <p>No content.</p>
            )}
        </div>
    );
}

export default function StaticPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [page, setPage] = useState<IPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (slug) loadPage();
    }, [slug]);

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
        <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-6">{page.name}</h1>
            <PageContent page={page} />
        </div>
    );
}
