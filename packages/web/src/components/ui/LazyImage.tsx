// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import { OptimizedImage } from './OptimizedImage';
import { usePerformance } from '@/hooks/usePerformance';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
  fallbackSrc?: string;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  threshold = 0.1,
  rootMargin = '50px',
  placeholder,
  fallbackSrc,
  priority = false,
  ...props
}: LazyImageProps) {
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { shouldOptimizeImages, isSlowConnection } = usePerformance();

  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Adjust quality based on network conditions
  const getOptimizedQuality = () => {
    if (isSlowConnection) return 60;
    if (shouldOptimizeImages) return 70;
    return 80;
  };

  // Generate low-quality placeholder for slow connections
  const getLowQualityPlaceholder = () => {
    if (!shouldOptimizeImages) return undefined;

    // Generate a very low quality version of the image
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, 10, 10);
    }
    return canvas.toDataURL();
  };

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || (
            <div className="text-gray-400 text-xs">
              {isInView ? 'Carregando...' : ''}
            </div>
          )}
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <OptimizedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          quality={getOptimizedQuality()}
          onLoad={handleLoad}
          fallbackSrc={fallbackSrc}
          blurDataURL={getLowQualityPlaceholder()}
          placeholder={shouldOptimizeImages ? 'blur' : 'empty'}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
}

// Virtualized image grid for better performance with large lists
interface VirtualizedImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  itemHeight?: number;
  className?: string;
  onImageClick?: (image: any) => void;
}

export function VirtualizedImageGrid({
  images,
  columns = 3,
  gap = 16,
  itemHeight = 200,
  className,
  onImageClick,
}: VirtualizedImageGridProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldOptimizeImages } = usePerformance();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const rowHeight = itemHeight + gap;

      const startRow = Math.floor(scrollTop / rowHeight);
      const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);

      const start = Math.max(0, startRow * columns - columns); // Buffer above
      const end = Math.min(images.length, (endRow + 1) * columns + columns); // Buffer below

      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [images.length, columns, itemHeight, gap]);

  const totalRows = Math.ceil(images.length / columns);
  const totalHeight = totalRows * (itemHeight + gap) - gap;

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {images.slice(visibleRange.start, visibleRange.end).map((image, index) => {
          const actualIndex = visibleRange.start + index;
          const row = Math.floor(actualIndex / columns);
          const col = actualIndex % columns;

          return (
            <div
              key={image.id}
              className="absolute cursor-pointer"
              style={{
                top: row * (itemHeight + gap),
                left: col * (100 / columns) + '%',
                width: `calc(${100 / columns}% - ${gap * (columns - 1) / columns}px)`,
                height: itemHeight,
              }}
              onClick={() => onImageClick?.(image)}
            >
              <LazyImage
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="w-full h-full object-cover rounded-lg"
                threshold={shouldOptimizeImages ? 0.3 : 0.1}
                rootMargin={shouldOptimizeImages ? '100px' : '50px'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}