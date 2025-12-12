/**
 * Utility to convert backend image paths to full URLs
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

/**
 * Get or create a cache-busting version.
 * Uses a short TTL to ensure each page navigation gets fresh images.
 * The version is valid for 10 seconds to allow for image loading during the same render cycle.
 */
let sessionCacheVersion: string | null = null;
let sessionCacheTime: number = 0;

function getCacheVersion(): string {
  if (typeof window === 'undefined') {
    // Server-side: use current timestamp
    return Date.now().toString();
  }

  const now = Date.now();

  // Reset cache version every 10 seconds (covers a single page render cycle)
  // This ensures each navigation/refresh gets fresh images
  if (!sessionCacheVersion || (now - sessionCacheTime) > 10000) {
    sessionCacheVersion = now.toString();
    sessionCacheTime = now;
  }

  return sessionCacheVersion;
}

/**
 * Reset the image cache version. Call this when you want to force fresh images.
 */
export function resetImageCache(): void {
  sessionCacheVersion = null;
  sessionCacheTime = 0;
}

/**
 * Converts a backend image path to a proxied URL through Next.js API
 * This avoids CORS issues by serving images from the same origin
 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';

  // If it's an absolute URL pointing to our backend, convert to proxy
  if (path.includes('localhost:3001') || (process.env.NEXT_PUBLIC_API_URL && path.includes(process.env.NEXT_PUBLIC_API_URL))) {
    // Continue to processing below to strip domain and storage prefix
    path = path.replace('http://localhost:3001/api/v1', '').replace('http://localhost:3001', '').replace(process.env.NEXT_PUBLIC_API_URL || '', '');
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Remove /storage prefix if present since we'll add /api/storage
  // NOTE: If we stripped the domain above, the path might start with /storage or //storage
  let cleanPath = path;

  // Clean up any double slashes at the start
  while (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  // Remove storage prefix if present
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring(8);
  }

  // Clean up leading slashes again after storage removal
  while (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  // Use Next.js API route to proxy the image with cache-busting parameter
  const cacheVersion = getCacheVersion();
  const proxiedUrl = `/image-proxy/${cleanPath}?v=${cacheVersion}`;
  // console.log('[getImageUrl]', { input: path, output: proxiedUrl });
  return proxiedUrl;
}

/**
 * Converts an array of image objects to full URLs
 */
export function getImageUrls(images: Array<{ url: string;[key: string]: any }> | undefined | null): Array<{ url: string;[key: string]: any }> {
  if (!images) return [];

  return images.map(img => ({
    ...img,
    url: getImageUrl(img.url)
  }));
}
