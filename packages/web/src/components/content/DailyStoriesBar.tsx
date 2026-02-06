'use client';

import React from 'react';
import { useContent, StoryUser } from '@/contexts/ContentContext';

interface DailyStoriesBarProps {
    onAddStory?: () => void;
}

export function DailyStoriesBar({ onAddStory }: DailyStoriesBarProps) {
    const { storyUsers, storiesLoading, openStory } = useContent();

    if (storiesLoading) {
        return (
            <div className="daily-stories-bar">
                <div className="stories-container">
                    {/* Loading skeletons */}
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="story-avatar-wrapper">
                            <div className="story-avatar skeleton" />
                            <span className="story-username skeleton-text" />
                        </div>
                    ))}
                </div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    return (
        <div className="daily-stories-bar">
            <div className="stories-container">
                {/* Add Story Button */}
                {onAddStory && (
                    <div className="story-avatar-wrapper" onClick={onAddStory}>
                        <div className="story-avatar add-story">
                            <svg className="add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </div>
                        <span className="story-username">Your Story</span>
                    </div>
                )}

                {/* Story Avatars */}
                {storyUsers.map((user, index) => (
                    <StoryAvatar
                        key={user.userId}
                        user={user}
                        onClick={() => openStory(index)}
                    />
                ))}

                {storyUsers.length === 0 && !onAddStory && (
                    <div className="no-stories">
                        <p>No stories yet. Follow others to see their updates!</p>
                    </div>
                )}
            </div>
            <style jsx>{styles}</style>
        </div>
    );
}

interface StoryAvatarProps {
    user: StoryUser;
    onClick: () => void;
}

function StoryAvatar({ user, onClick }: StoryAvatarProps) {
    const displayName = user.profile?.displayName || user.profile?.username || 'User';
    const avatarUrl = user.profile?.avatarUrl;

    return (
        <div className="story-avatar-wrapper" onClick={onClick}>
            <div className={`story-ring ${user.allViewed ? 'viewed' : 'unviewed'}`}>
                <div className="story-avatar">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} />
                    ) : (
                        <span className="avatar-initial">{displayName.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            </div>
            <span className="story-username">{displayName}</span>
            <style jsx>{avatarStyles}</style>
        </div>
    );
}

const styles = `
  .daily-stories-bar {
    width: 100%;
    padding: 12px 0;
    background: var(--bg-primary, #000);
    border-bottom: 1px solid var(--border-color, #262626);
    overflow: hidden;
  }
  
  .stories-container {
    display: flex;
    gap: 12px;
    padding: 0 16px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .stories-container::-webkit-scrollbar {
    display: none;
  }
  
  .story-avatar-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  
  .story-avatar-wrapper:hover {
    transform: scale(1.05);
  }
  
  .story-avatar-wrapper:active {
    transform: scale(0.95);
  }
  
  .story-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-secondary, #1a1a1a);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .story-avatar.skeleton {
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .story-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .story-avatar.add-story {
    border: 2px dashed var(--accent-color, #8b5cf6);
    background: transparent;
  }
  
  .add-icon {
    width: 24px;
    height: 24px;
    color: var(--accent-color, #8b5cf6);
  }
  
  .story-username {
    font-size: 11px;
    color: var(--text-secondary, #a0a0a0);
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }
  
  .skeleton-text {
    width: 48px;
    height: 12px;
    border-radius: 4px;
    background: var(--bg-tertiary, #2a2a2a);
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .no-stories {
    padding: 20px;
    text-align: center;
    color: var(--text-tertiary, #666);
    font-size: 13px;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const avatarStyles = `
  .story-ring {
    padding: 2px;
    border-radius: 50%;
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  }
  
  .story-ring.viewed {
    background: var(--border-color, #3a3a3a);
  }
  
  .story-ring.unviewed {
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
  }
  
  .story-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--bg-primary, #000);
    border: 2px solid var(--bg-primary, #000);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .story-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-initial {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }
`;

export default DailyStoriesBar;
