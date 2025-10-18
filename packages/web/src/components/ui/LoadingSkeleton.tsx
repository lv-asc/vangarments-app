import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'image';
  lines?: number;
  animate?: boolean;
}

export function LoadingSkeleton({ 
  className, 
  variant = 'default',
  lines = 1,
  animate = true 
}: LoadingSkeletonProps) {
  const baseClasses = cn(
    'bg-gray-200 rounded',
    animate && 'animate-pulse',
    className
  );

  if (variant === 'card') {
    return (
      <div className={cn('p-4 space-y-3', className)}>
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              'h-4 bg-gray-200 rounded animate-pulse',
              i === lines - 1 && 'w-3/4'
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('w-10 h-10 bg-gray-200 rounded-full animate-pulse', className)} />
    );
  }

  if (variant === 'image') {
    return (
      <div className={cn('w-full h-48 bg-gray-200 rounded animate-pulse', className)} />
    );
  }

  return <div className={baseClasses} />;
}

// Specialized skeleton components for different sections
export function WardrobeItemSkeleton() {
  return (
    <div className="fashion-card p-4 space-y-3">
      <LoadingSkeleton variant="image" className="h-48" />
      <LoadingSkeleton variant="text" lines={2} />
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-6 w-20" />
        <LoadingSkeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function OutfitSkeleton() {
  return (
    <div className="fashion-card p-4 space-y-4">
      <div className="flex items-center space-x-3">
        <LoadingSkeleton variant="avatar" />
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <LoadingSkeleton variant="image" className="h-64" />
      <LoadingSkeleton variant="text" lines={2} />
      <div className="flex space-x-4">
        <LoadingSkeleton className="h-8 w-16" />
        <LoadingSkeleton className="h-8 w-16" />
        <LoadingSkeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function MarketplaceItemSkeleton() {
  return (
    <div className="marketplace-item p-4 space-y-3">
      <LoadingSkeleton variant="image" className="h-56" />
      <LoadingSkeleton variant="text" lines={2} />
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-6 w-24" />
        <LoadingSkeleton className="h-6 w-20" />
      </div>
      <div className="flex items-center space-x-2">
        <LoadingSkeleton variant="avatar" className="w-6 h-6" />
        <LoadingSkeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function SocialFeedSkeleton() {
  return (
    <div className="feed-item">
      <div className="feed-item-header">
        <LoadingSkeleton variant="avatar" />
        <div className="ml-3 space-y-1">
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-3 w-24" />
        </div>
      </div>
      <LoadingSkeleton variant="image" className="h-80" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton variant="text" lines={2} />
        <div className="flex space-x-4">
          <LoadingSkeleton className="h-8 w-16" />
          <LoadingSkeleton className="h-8 w-16" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <LoadingSkeleton variant="avatar" className="w-20 h-20" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-6 w-40" />
          <LoadingSkeleton className="h-4 w-32" />
          <LoadingSkeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center space-y-1">
          <LoadingSkeleton className="h-6 w-12 mx-auto" />
          <LoadingSkeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <LoadingSkeleton className="h-6 w-12 mx-auto" />
          <LoadingSkeleton className="h-4 w-16 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <LoadingSkeleton className="h-6 w-12 mx-auto" />
          <LoadingSkeleton className="h-4 w-16 mx-auto" />
        </div>
      </div>
    </div>
  );
}