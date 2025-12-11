// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUrl';


interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showSkeleton?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 80,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/assets/images/placeholder.svg',
  showSkeleton = true,
  ...props
}: OptimizedImageProps) {
  // Resolve relative URLs to absolute backend URLs
  const resolvedSrc = getImageUrl(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setCurrentSrc(getImageUrl(src));
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.();
  };

  // Generate blur data URL for placeholder
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  };

  const imageProps = {
    src: currentSrc, // Use currentSrc for the Image component
    alt,
    quality,
    priority,
    loading,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading && showSkeleton && 'opacity-0',
      !isLoading && 'opacity-100',
      className
    ),
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
    ...(placeholder === 'blur' && {
      placeholder: 'blur' as const,
      blurDataURL: blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined),
    }),
    style: {
      objectFit,
      ...props.style,
    },
    ...props,
  };

  return (
    <div className={cn('relative', fill && 'w-full h-full')}>
      {/* Loading skeleton */}
      {isLoading && showSkeleton && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse rounded',
            fill ? 'w-full h-full' : '',
            className
          )}
          style={{
            width: !fill ? width : undefined,
            height: !fill ? height : undefined,
          }}
        />
      )}

      {/* Actual image */}
      <Image
        ref={imgRef}
        {...imageProps}
      />

      {/* Error state */}
      {hasError && currentSrc === fallbackSrc && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm',
            fill ? 'w-full h-full' : '',
            className
          )}
          style={{
            width: !fill ? width : undefined,
            height: !fill ? height : undefined,
          }}
        >
          Imagem não encontrada
        </div>
      )}
    </div>
  );
}

// Specialized image components for different use cases
export function WardrobeItemImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={400}
      className={cn('rounded-lg', className)}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      quality={85}
      {...props}
    />
  );
}

export function OutfitImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={600}
      className={cn('rounded-xl', className)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      quality={90}
      {...props}
    />
  );
}

export function ProfileAvatar({
  src,
  alt,
  size = 'md',
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const dimension = sizeMap[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-full', className)}
      quality={90}
      {...props}
    />
  );
}

export function MarketplaceItemImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={280}
      height={350}
      className={cn('rounded-lg', className)}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      quality={85}
      {...props}
    />
  );
}

export function HeroImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={className}
      sizes="100vw"
      quality={95}
      priority
      {...props}
    />
  );
}