'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useContent, StoryUser } from '@/contexts/ContentContext';

interface DailyStoryViewerProps {
    onClose?: () => void;
}

export function DailyStoryViewer({ onClose }: DailyStoryViewerProps) {
    const { storyUsers, activeStoryIndex, closeStory, recordView } = useContent();

    const [currentUserIndex, setCurrentUserIndex] = useState(0);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const STORY_DURATION = 5000; // 5 seconds per story
    const PROGRESS_INTERVAL = 50; // Update progress every 50ms

    // Initialize with active story index
    useEffect(() => {
        if (activeStoryIndex !== null) {
            setCurrentUserIndex(activeStoryIndex);
            setCurrentStoryIndex(0);
            setProgress(0);
        }
    }, [activeStoryIndex]);

    // Get current user and story
    const currentUser = storyUsers[currentUserIndex];
    const currentStory = currentUser?.stories[currentStoryIndex];

    // Record view when story becomes active
    useEffect(() => {
        if (currentStory && !currentStory.hasViewed) {
            recordView(currentStory.id);
        }
    }, [currentStory, recordView]);

    // Progress timer
    useEffect(() => {
        if (activeStoryIndex === null || isPaused || !currentStory) return;

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / (STORY_DURATION / PROGRESS_INTERVAL));

                if (newProgress >= 100) {
                    // Move to next story
                    goToNextStory();
                    return 0;
                }
                return newProgress;
            });
        }, PROGRESS_INTERVAL);

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [activeStoryIndex, isPaused, currentStory, currentUserIndex, currentStoryIndex]);

    // Go to next story
    const goToNextStory = useCallback(() => {
        if (!currentUser) return;

        if (currentStoryIndex < currentUser.stories.length - 1) {
            // Next story for same user
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentUserIndex < storyUsers.length - 1) {
            // Move to next user
            setCurrentUserIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            // End of all stories
            handleClose();
        }
    }, [currentUser, currentStoryIndex, currentUserIndex, storyUsers.length]);

    // Go to previous story
    const goToPrevStory = useCallback(() => {
        if (currentStoryIndex > 0) {
            // Previous story for same user
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else if (currentUserIndex > 0) {
            // Move to previous user's last story
            const prevUser = storyUsers[currentUserIndex - 1];
            setCurrentUserIndex(prev => prev - 1);
            setCurrentStoryIndex(prevUser.stories.length - 1);
            setProgress(0);
        }
        // If already at first story of first user, just restart
        else {
            setProgress(0);
        }
    }, [currentStoryIndex, currentUserIndex, storyUsers]);

    // Handle close
    const handleClose = useCallback(() => {
        closeStory();
        onClose?.();
    }, [closeStory, onClose]);

    // Handle tap navigation
    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        if (x < width * 0.3) {
            // Left side - go back
            goToPrevStory();
        } else if (x > width * 0.7) {
            // Right side - go forward
            goToNextStory();
        }
        // Middle - pause/unpause (handled by hold)
    };

    // Touch handlers for swipe down to close
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        setIsPaused(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        // Could add visual feedback for swipe gesture here
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) {
            setIsPaused(false);
            return;
        }

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };

        const deltaY = touchEnd.y - touchStartRef.current.y;
        const deltaX = Math.abs(touchEnd.x - touchStartRef.current.x);

        // If swiped down significantly and more vertical than horizontal
        if (deltaY > 100 && deltaY > deltaX * 2) {
            handleClose();
        }

        touchStartRef.current = null;
        setIsPaused(false);
    };

    // Handle hold to pause
    const handleMouseDown = () => setIsPaused(true);
    const handleMouseUp = () => setIsPaused(false);

    if (activeStoryIndex === null || !currentUser || !currentStory) {
        return null;
    }

    const displayName = currentUser.profile?.displayName || currentUser.profile?.username || 'User';
    const avatarUrl = currentUser.profile?.avatarUrl;

    return (
        <div className="story-viewer-overlay">
            <div
                ref={containerRef}
                className="story-viewer"
                onClick={handleTap}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Progress bars */}
                <div className="progress-bar-container">
                    {currentUser.stories.map((_, index) => (
                        <div key={index} className="progress-bar-wrapper">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: index < currentStoryIndex
                                        ? '100%'
                                        : index === currentStoryIndex
                                            ? `${progress}%`
                                            : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-header">
                    <div className="story-user-info">
                        <div className="story-avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} />
                            ) : (
                                <span>{displayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="story-meta">
                            <span className="story-username">{displayName}</span>
                            <span className="story-time">{formatTimeAgo(currentStory.createdAt)}</span>
                        </div>
                    </div>
                    <button className="close-button" onClick={handleClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Story content */}
                <div className="story-content">
                    {currentStory.mediaType === 'video' ? (
                        <video
                            key={currentStory.id}
                            src={currentStory.mediaUrls[0]}
                            autoPlay
                            muted
                            playsInline
                            loop
                            className="story-media"
                        />
                    ) : (
                        <img
                            key={currentStory.id}
                            src={currentStory.mediaUrls[0]}
                            alt=""
                            className="story-media"
                        />
                    )}

                    {currentStory.caption && (
                        <div className="story-caption">
                            <p>{currentStory.caption}</p>
                        </div>
                    )}
                </div>

                {/* Navigation hints */}
                <div className="nav-hint nav-hint-left" />
                <div className="nav-hint nav-hint-right" />
            </div>
            <style jsx>{styles}</style>
        </div>
    );
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
}

const styles = `
  .story-viewer-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }
  
  .story-viewer {
    position: relative;
    width: 100%;
    max-width: 400px;
    height: 100%;
    max-height: 100vh;
    background: #000;
    display: flex;
    flex-direction: column;
    user-select: none;
    touch-action: pan-y;
  }
  
  .progress-bar-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    z-index: 10;
  }
  
  .progress-bar-wrapper {
    flex: 1;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 1px;
    overflow: hidden;
  }
  
  .progress-bar-fill {
    height: 100%;
    background: #fff;
    transition: width 0.05s linear;
  }
  
  .story-header {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    z-index: 10;
  }
  
  .story-user-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .story-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-secondary, #1a1a1a);
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .story-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .story-avatar span {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }
  
  .story-meta {
    display: flex;
    flex-direction: column;
  }
  
  .story-username {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }
  
  .story-time {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .close-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  
  .close-button svg {
    width: 24px;
    height: 24px;
    color: #fff;
  }
  
  .story-content {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .story-media {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .story-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 40px 16px 20px;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
  }
  
  .story-caption p {
    color: #fff;
    font-size: 14px;
    line-height: 1.4;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }
  
  .nav-hint {
    position: absolute;
    top: 60px;
    bottom: 0;
    width: 30%;
    cursor: pointer;
  }
  
  .nav-hint-left {
    left: 0;
  }
  
  .nav-hint-right {
    right: 0;
  }
`;

export default DailyStoryViewer;
