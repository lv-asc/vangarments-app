// @ts-nocheck
import { NextResponse } from 'next/server';

/**
 * Proxy image requests from the frontend to the backend storage endpoint.
 * This avoids CORS issues by keeping all image requests on the same origin.
 */
export async function GET(request, { params }) {
    const { path } = params; // path is an array of path segments
    // Strip both /api/v1 and /api to get the root URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v1)?$/, '') || 'http://localhost:3001';
    const targetUrl = `${backendUrl}/storage/${path.join('/')}`;

    console.log('[Image Proxy] Request:', {
        path: path.join('/'),
        targetUrl,
        backendUrl
    });

    try {
        const backendResp = await fetch(targetUrl, {
            cache: 'no-store', // Always fetch fresh from backend
        });
        console.log('[Image Proxy] Backend response:', {
            status: backendResp.status,
            contentType: backendResp.headers.get('content-type')
        });

        const contentType = backendResp.headers.get('content-type') || 'application/octet-stream';
        const buffer = await backendResp.arrayBuffer();

        // Only cache successful responses
        const cacheControl = backendResp.ok
            ? 'public, max-age=3600, stale-while-revalidate=86400' // Cache for 1 hour, revalidate in background for 1 day
            : 'no-store, no-cache, must-revalidate'; // Don't cache errors

        return new NextResponse(buffer, {
            status: backendResp.status,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': cacheControl,
            },
        });
    } catch (err) {
        console.error('[Image Proxy] Error:', err);
        return new NextResponse('Image not found', {
            status: 404,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate', // Don't cache errors
            },
        });
    }
}
