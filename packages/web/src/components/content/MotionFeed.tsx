'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ContentPost, useContent } from '@/contexts/ContentContext';
import { HeartIcon as HeartOutline, ChatBubbleLeftRightIcon as ChatOutline, ArrowPathIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface MotionFeedProps {
  posts?: ContentPost[];
  onLoadMore?: () => void;
}

// Sub-component for individual post
function MotionPost({
  post,
  isActive,
  onDoubleTap,
  toggleLike
}: {
  post: ContentPost;
  isActive: boolean;
  onDoubleTap: (postId: string, e: React.MouseEvent) => void;
  toggleLike: (postId: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showAudioInfo, setShowAudioInfo] = useState(false);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked, wait for user interaction
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  return (
    <div
      className="motion-item relative h-full w-full bg-black group"
      onClick={(e) => onDoubleTap(post.id, e)}
    >
      <video
        ref={videoRef}
        src={post.mediaUrls[0]}
        className="h-full w-full object-cover"
        loop
        muted={isMuted}
        playsInline
      />

      {/* Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-white drop-shadow-md">@{post.user?.profile?.username || 'user'}</span>
              <button className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded border border-white/30 backdrop-blur-sm">Follow</button>
            </div>
            <p className="text-sm text-white/90 line-clamp-2 mb-2 drop-shadow-md">{post.caption}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <UserAvatar
              user={{
                name: post.user?.profile?.displayName || post.user?.id || 'User',
                avatar: post.user?.profile?.avatarUrl,
                username: post.user?.profile?.username
              }}
              size="md"
              className="border-2 border-white"
            />

            <button
              className="flex flex-col items-center gap-1 group/btn"
              onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
            >
              {post.hasLiked ? (
                <HeartSolid className="w-8 h-8 text-red-500" />
              ) : (
                <HeartOutline className="w-8 h-8 text-white" />
              )}
              <span className="text-[10px] font-bold text-white">{formatCount(post.likesCount)}</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <ChatOutline className="w-8 h-8 text-white" />
              <span className="text-[10px] font-bold text-white">{formatCount(post.commentsCount)}</span>
            </button>

            {/* Sound button */}
            {post.audioName && (
              <div className="relative">
                <button
                  className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAudioInfo(!showAudioInfo);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </button>
                {showAudioInfo && (
                  <div className="absolute right-full mr-4 bottom-0 bg-white/90 backdrop-blur-md rounded-lg p-3 shadow-xl min-w-[150px] animate-in fade-in slide-in-from-bottom-2 duration-300 z-20">
                    <div className="text-xs font-bold text-black flex items-center gap-2">
                      <span className="animate-spin text-sm">💿</span>
                      Audio Information
                    </div>
                    <div className="mt-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{post.audioName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{post.audioArtist || 'Original Sound'}</p>
                    </div>
                    <button className="mt-2 w-full py-1.5 bg-black text-white rounded text-[10px] font-bold hover:bg-gray-800 transition-colors">
                      Use this sound
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mute Toggle Overlay */}
      <button
        className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10"
        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"></path></svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.414 0A5.982 5.982 0 0115 10a5.982 5.982 0 01-1.757 4.243 1 1 0 01-1.414-1.414A3.981 3.981 0 0013 10c0-1.104-.448-2.098-1.172-2.828a1 1 0 010-1.414z"></path></svg>
        )}
      </button>
    </div>
  );
}

export function MotionFeed({ posts: externalPosts, onLoadMore }: MotionFeedProps) {
  const { feedPosts, feedLoading, feedHasMore, fetchFeed, toggleLike, recordView } = useContent();

  const posts = externalPosts || feedPosts.filter(p => p.contentType === 'motion');

  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    if (!externalPosts && posts.length === 0) {
      fetchFeed('motion');
    }
  }, [externalPosts, fetchFeed, posts.length]);

  // Handle scroll snapping and index update
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const index = Math.round(scrollPos / containerRef.current.clientHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      // Load more if near end
      if (index >= posts.length - 2 && feedHasMore && !feedLoading && onLoadMore) {
        onLoadMore();
      } else if (index >= posts.length - 2 && feedHasMore && !feedLoading) {
        fetchFeed('motion');
      }
    }
  };

  // Record view when active
  useEffect(() => {
    if (posts[currentIndex]) {
      recordView(posts[currentIndex].id);
    }
  }, [currentIndex, posts, recordView]);

  // Double tap to like
  const handleDoubleTap = useCallback((postId: string, e: React.MouseEvent) => {
    // Simple double-tap detection using data attribute
    const target = e.currentTarget as HTMLElement;
    const now = Date.now();
    const lastTap = parseInt(target.dataset.lastTap || '0');

    if (now - lastTap < 300) {
      toggleLike(postId);
      // Show heart animation
      showLikeAnimation(e);
    }

    target.dataset.lastTap = now.toString();
  }, [toggleLike]);

  const showLikeAnimation = (e: React.MouseEvent) => {
    const heart = document.createElement('div');
    heart.className = 'fixed pointer-events-none z-50 animate-like-popup';
    heart.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="color: white; width: 100px; height: 100px; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5))">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>`;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    heart.style.left = `${e.clientX - 50}px`;
    heart.style.top = `${e.clientY - 50}px`;

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

  if (posts.length === 0 && feedLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (posts.length === 0 && !feedLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white p-8 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">No motion videos yet</h3>
        <p className="text-white/60 text-sm max-w-xs">Follow some creators or be the first to post a motion video!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
      onScroll={handleScroll}
    >
      {posts.map((post, index) => (
        <div key={post.id} className="h-full w-full snap-start">
          <MotionPost
            post={post}
            isActive={index === currentIndex}
            onDoubleTap={handleDoubleTap}
            toggleLike={toggleLike}
          />
        </div>
      ))}
    </div>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default MotionFeed;
