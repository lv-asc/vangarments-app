'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { socialApi } from '@/lib/socialApi';
import { SocialPost } from '@vangarments/shared';
import Link from 'next/link';

// Helper for images
const getImageUrl = (url: string | undefined | null) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/api')) return url;
    let path = url.startsWith('/') ? url.substring(1) : url;
    if (path.startsWith('storage/')) path = path.substring('storage/'.length);
    return `/api/storage/${path}`;
};

export default function PostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [post, setPost] = useState<SocialPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (slug) loadPost();
    }, [slug]);

    const loadPost = async () => {
        try {
            setLoading(true);
            const data = await socialApi.getPost(slug);
            setPost(data);
        } catch (err: any) {
            console.error(err);
            setError('Post not found.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>;

    if (error || !post) return (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <Link href="/social" className="text-blue-600 hover:underline">Back to Feed</Link>
        </div>
    );

    const { content, user } = post;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <Link href={`/u/${user?.profile.username || '#'}`}>
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                {user?.profile.profilePicture ? (
                                    <img src={getImageUrl(user.profile.profilePicture)} alt={user.profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                        {user?.profile.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </Link>
                        <div>
                            <Link href={`/u/${user?.profile.username || '#'}`} className="font-semibold text-gray-900 hover:underline">
                                {user?.profile.name}
                            </Link>
                            <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="aspect-square bg-gray-100">
                    {content.imageUrls.length > 0 && (
                        <img
                            src={getImageUrl(content.imageUrls[0])}
                            alt={content.title || 'Post image'}
                            className="w-full h-full object-contain bg-black"
                        />
                    )}
                </div>
                {content.imageUrls.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto p-2">
                        {content.imageUrls.map((url, i) => (
                            <div key={i} className="w-20 h-20 flex-shrink-0 cursor-pointer border border-gray-200">
                                <img src={getImageUrl(url)} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    <h1 className="text-xl font-bold mb-2">{content.title}</h1>
                    <p className="text-gray-800 whitespace-pre-wrap">{content.description}</p>

                    {content.tags && content.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {content.tags.map(tag => (
                                <span key={tag} className="text-blue-600 text-sm">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="p-4 border-t border-gray-50 flex gap-6 text-gray-600">
                    <div>❤️ {post.engagementStats.likes} likes</div>
                    <div>💬 {post.engagementStats.comments} comments</div>
                </div>
            </div>
        </div>
    );
}
