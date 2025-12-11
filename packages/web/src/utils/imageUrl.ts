/**
 * Utility to convert backend image paths to full URLs
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

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

  // Use Next.js API route to proxy the image (moved to /image-proxy to avoid rewrites)
  const proxiedUrl = `/image-proxy/${cleanPath}`;
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
