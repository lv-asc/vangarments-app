import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface LazyLoadingResult<T extends HTMLElement> {
  isVisible: boolean;
  ref: React.RefObject<T | null>;
}

/**
 * Hook for lazy loading elements when they come into view
 */
export function useLazyLoading<T extends HTMLElement = HTMLElement>(options: LazyLoadingOptions = {}): LazyLoadingResult<T> {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { isVisible, ref };
}

interface LazyImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Lazy loading image component with thumbnail placeholder
 */
export function LazyImage({
  src,
  thumbnailSrc,
  alt,
  className = '',
  onLoad,
  onError,
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isVisible, ref } = useLazyLoading<HTMLDivElement>({ threshold: 0.1, rootMargin: '100px' });

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`relative overflow-hidden ${className}`}>
      {/* Thumbnail placeholder */}
      {thumbnailSrc && !imageLoaded && !imageError && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          loading="eager"
        />
      )}

      {/* Main image */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Loading placeholder */}
      {!thumbnailSrc && !imageLoaded && !imageError && isVisible && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error placeholder */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface LazyListOptions<T> {
  items: T[];
  pageSize?: number;
  loadMoreThreshold?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

interface LazyListResult<T> {
  visibleItems: T[];
  isLoadingMore: boolean;
  loadMoreRef: React.RefObject<HTMLElement>;
}

/**
 * Hook for lazy loading list items with infinite scroll
 */
export function useLazyList<T>({
  items,
  pageSize = 20,
  loadMoreThreshold = 0.8,
  hasMore = false,
  onLoadMore,
}: LazyListOptions<T>): LazyListResult<T> {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLElement>(null);
  const { isVisible } = useLazyLoading({
    threshold: loadMoreThreshold,
    triggerOnce: false,
  });

  // Initialize visible items
  useEffect(() => {
    setVisibleItems(items.slice(0, pageSize));
  }, [items, pageSize]);

  // Load more when intersection is detected
  useEffect(() => {
    if (isVisible && hasMore && !isLoadingMore && onLoadMore) {
      setIsLoadingMore(true);
      onLoadMore();
    }
  }, [isVisible, hasMore, isLoadingMore, onLoadMore]);

  // Reset loading state when new items arrive
  useEffect(() => {
    if (isLoadingMore && items.length > visibleItems.length) {
      setIsLoadingMore(false);
      setVisibleItems(items);
    }
  }, [items.length, visibleItems.length, isLoadingMore, items]);

  return {
    visibleItems,
    isLoadingMore,
    loadMoreRef,
  };
}

/**
 * Hook for debounced search with lazy loading
 */
export function useDebouncedSearch(
  searchTerm: string,
  delay: number = 300
): string {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedTerm;
}

/**
 * Hook for virtual scrolling large lists
 */
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export function useVirtualScroll(
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  };
}