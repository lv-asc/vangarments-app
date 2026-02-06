'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ContentPost, useContent } from '@/contexts/ContentContext';

interface FeedGalleryProps {
  posts?: ContentPost[];
  onLoadMore?: () => void;
}

export function FeedGallery({ posts: externalPosts, onLoadMore }: FeedGalleryProps) {
  const { feedPosts, feedLoading, feedHasMore, fetchFeed, toggleLike, recordView } = useContent();
  const posts = externalPosts || feedPosts.filter(p => p.contentType === 'feed');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch feed content on mount
  useEffect(() => {
    if (!externalPosts) {
      fetchFeed('feed', true);
    }
  }, [fetchFeed, externalPosts]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && feedHasMore && !feedLoading) {
        onLoadMore?.() || fetchFeed('feed');
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [feedHasMore, feedLoading, onLoadMore, fetchFeed]);

  if (posts.length === 0 && !feedLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-5 text-center text-gray-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 mb-4 text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <p className="text-lg font-semibold mb-1 text-gray-900">No posts yet</p>
        <span className="text-sm">Share your first creation!</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[470px] mx-auto pb-16">
      {posts.map((post) => (
        <FeedPost
          key={post.id}
          post={post}
          onLike={() => toggleLike(post.id)}
        />
      ))}

      <div ref={loadMoreRef} className="h-px" />

      {feedLoading && (
        <div className="flex justify-center p-5">
          <div className="w-6 h-6 border-2 border-gray-800 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

interface FeedPostProps {
  post: ContentPost;
  onLike: () => void;
}

function FeedPost({ post, onLike }: FeedPostProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scale, setScale] = useState(1);
  const [isZooming, setIsZooming] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const mediaCount = post.mediaUrls.length;

  const displayName = post.user?.profile?.displayName || post.user?.profile?.username || 'User';
  const avatarUrl = post.user?.profile?.avatarUrl;
  const hasMultipleMedia = mediaCount > 1;
  const shouldTruncate = post.caption && post.caption.length > 120;

  // Handle carousel scroll
  const handleScroll = () => {
    if (!carouselRef.current || !hasMultipleMedia) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const width = carouselRef.current.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    setCurrentMediaIndex(newIndex);
  };

  // Pinch to zoom (simplified - uses wheel for demo)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setIsZooming(true);
      const newScale = Math.max(1, Math.min(3, scale - e.deltaY * 0.01));
      setScale(newScale);
    }
  };

  const resetZoom = () => {
    setScale(1);
    setIsZooming(false);
  };

  // Double tap to like
  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const now = Date.now();
    const lastTap = parseInt(target.dataset.lastTap || '0');

    if (now - lastTap < 300) {
      onLike();
      showLikeAnimation(e);
    }

    target.dataset.lastTap = now.toString();
  }, [onLike]);

  const showLikeAnimation = (e: React.MouseEvent) => {
    const heart = document.createElement('div');
    heart.className = 'fixed text-5xl pointer-events-none z-50 animate-like-popup';
    heart.innerHTML = '❤️';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    heart.style.left = `${rect.left + rect.width / 2 - 25}px`;
    heart.style.top = `${rect.top + rect.height / 2 - 25}px`;

    // Add animation style if not present
    if (!document.getElementById('like-animation-style')) {
      const style = document.createElement('style');
      style.id = 'like-animation-style';
      style.innerHTML = `
            @keyframes likePopup {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1) translateY(-50px); opacity: 0; }
            }
            .animate-like-popup { animation: likePopup 1s ease-out forwards; }
        `;
      document.head.appendChild(style);
    }

    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
  };

  return (
    <article className="border-b border-gray-200 pb-3 mb-3 bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-gray-600">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{displayName}</span>
            <span className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
        <button className="p-2 text-gray-900 hover:text-gray-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
          </svg>
        </button>
      </header>

      {/* Media */}
      <div
        className="relative w-full aspect-square bg-gray-100 overflow-hidden"
        onClick={handleDoubleTap}
        onWheel={handleWheel}
        onMouseLeave={resetZoom}
      >
        <div
          ref={carouselRef}
          className={`w-full h-full flex ${hasMultipleMedia ? 'overflow-x-auto snap-x snap-mandatory scrollbar-hide' : 'overflow-hidden'}`}
          onScroll={handleScroll}
        >
          {post.mediaUrls.map((url, index) => (
            <div key={index} className="flex-none w-full h-full snap-start">
              {post.mediaType === 'video' || url.includes('.mp4') || url.includes('.webm') ? (
                <video
                  src={url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  poster={post.thumbnailUrl}
                />
              ) : (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `scale(${scale})`,
                    cursor: isZooming ? 'zoom-out' : 'default'
                  }}
                  onClick={isZooming ? resetZoom : undefined}
                />
              )}
            </div>
          ))}
        </div>

        {/* Carousel dots */}
        {hasMultipleMedia && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {post.mediaUrls.map((_, index) => (
              <span
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${index === currentMediaIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Media counter for multiple items */}
        {hasMultipleMedia && (
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {currentMediaIndex + 1}/{mediaCount}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between px-4 py-3">
        <div className="flex gap-4">
          <button className="p-0 hover:opacity-70 transition-opacity" onClick={onLike}>
            <svg
              className={`w-6 h-6 ${post.hasLiked ? 'text-red-500 fill-red-500' : 'text-gray-900'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="p-0 hover:opacity-70 transition-opacity text-gray-900">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="p-0 hover:opacity-70 transition-opacity text-gray-900">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <button className="p-0 hover:opacity-70 transition-opacity text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* Likes count */}
      {post.likesCount > 0 && (
        <div className="px-4 text-sm font-semibold text-gray-900">
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-2 text-sm leading-relaxed text-gray-900">
          <span className="font-semibold mr-1.5">{displayName}</span>
          <span className="text-gray-800">
            {shouldTruncate && !isExpanded
              ? `${post.caption.slice(0, 120)}...`
              : post.caption
            }
          </span>
          {shouldTruncate && !isExpanded && (
            <button className="text-gray-500 text-sm ml-1 hover:text-gray-900" onClick={() => setIsExpanded(true)}>
              more
            </button>
          )}
        </div>
      )}

      {/* Comments preview */}
      {post.commentsCount > 0 && (
        <button className="block px-4 py-1 text-sm text-gray-500 hover:text-gray-900 text-left">
          View all {post.commentsCount} comments
        </button>
      )}
    </article>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export default FeedGallery;
