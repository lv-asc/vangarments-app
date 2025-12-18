import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d atrás`;
  }

  return formatDate(dateObj);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

// Update getImageUrl to return relative paths to leverage Next.js rewrites
// Update getImageUrl to return relative paths to leverage Next.js rewrites
export function getImageUrl(path: string | undefined | null, size?: 'sm' | 'md' | 'lg' | 'xl'): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;

  // Normalize path
  let cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Handle legacy api/storage prefix
  if (cleanPath.startsWith('api/storage/')) {
    cleanPath = cleanPath.substring('api/'.length); // Becomes storage/...
  }

  // Handle direct uploads folder references (often returned by upload endpoint)
  // Map uploads/... -> storage/uploads/...
  if (cleanPath.startsWith('uploads/')) {
    cleanPath = `storage/${cleanPath}`;
  }

  // If it is a storage path, return relative URL /storage/...
  // This will be proxied by Next.js to the backend
  if (cleanPath.startsWith('storage/')) {
    return `/${cleanPath}`;
  }

  // Fallback for non-storage paths (e.g. public assets)
  // Final fallback for paths that might be public assets or CDN paths
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  const sizeParam = size ? `?w=${getSizeWidth(size)}` : '';

  // If CDN_URL is provided, use it. Otherwise, assume it's a public asset relative to root.
  if (cdnBaseUrl) {
    const url = `${cdnBaseUrl}/${cleanPath}${sizeParam}`;
    console.log('[getImageUrl] CDN path:', path, '->', url);
    return url;
  } else {
    // If it's just a filename "image.jpg", and we don't know where it is...
    // Maybe assume public? context dependent.
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    console.log('[getImageUrl] Fallback path (public/relative):', path, '->', finalPath);
    return finalPath;
  }
}

/**
 * Safely retrieves an avatar URL from a user object that might have different structures
 * (personalInfo.avatarUrl, profile.avatarUrl, or avatarUrl)
 */
export function getUserAvatarUrl(user: any): string | null {
  if (!user) return null;
  return user.personalInfo?.avatarUrl || user.profile?.avatarUrl || user.avatarUrl || null;
}

function getSizeWidth(size: string): number {
  const sizes = {
    sm: 256,
    md: 512,
    lg: 1024,
    xl: 2048,
  };
  return sizes[size as keyof typeof sizes] || 512;
}

export function isValidCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check if it has 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Image compression failed'));
        }
      }, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
}