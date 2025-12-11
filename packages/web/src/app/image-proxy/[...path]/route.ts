// @ts-nocheck
import { NextResponse } from 'next/server';

/**
 * Proxy image requests from the frontend to the backend storage endpoint.
 * This avoids CORS issues by keeping all image requests on the same origin.
 */
export async function GET(request, { params }) {
    const { path } = params; // path is an array of path segments
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    const targetUrl = `${backendUrl}/storage/${path.join('/')}`;

    console.log('[Image Proxy] Request:', {
        path: path.join('/'),
        targetUrl,
        backendUrl
    });

    try {
        const backendResp = await fetch(targetUrl);
        console.log('[Image Proxy] Backend response:', {
            status: backendResp.status,
            contentType: backendResp.headers.get('content-type')
        });

        const contentType = backendResp.headers.get('content-type') || 'application/octet-stream';
        const buffer = await backendResp.arrayBuffer();
        return new NextResponse(buffer, {
            status: backendResp.status,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': backendResp.headers.get('cache-control') || 'public, max-age=31536000',
            },
        });
    } catch (err) {
        console.error('[Image Proxy] Error:', err);
        return new NextResponse('Image not found', { status: 404 });
    }
}
