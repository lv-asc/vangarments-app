'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';

// Types
export type ContentType = 'daily' | 'motion' | 'feed';
export type MediaType = 'image' | 'video' | 'mixed';
export type AspectRatio = '1:1' | '4:5' | '9:16';
export type Visibility = 'public' | 'followers' | 'private';

export interface ContentPost {
    id: string;
    userId: string;
    contentType: ContentType;
    mediaUrls: string[];
    mediaType: MediaType;
    thumbnailUrl?: string;
    title?: string;
    caption?: string;
    aspectRatio: AspectRatio;
    audioId?: string;
    audioName?: string;
    audioArtist?: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    visibility: Visibility;
    isArchived: boolean;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        profile: {
            displayName?: string;
            avatarUrl?: string;
            username?: string;
        };
        verificationStatus: string;
    };
    hasLiked?: boolean;
}

export interface ContentDraft {
    id: string;
    userId: string;
    contentType: ContentType;
    draftData: {
        title?: string;
        caption?: string;
        visibility?: Visibility;
        audioId?: string;
        audioName?: string;
        audioArtist?: string;
        aspectRatio?: AspectRatio;
        mediaType?: MediaType;
    };
    mediaUrls: string[];
    thumbnailUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface StoryUser {
    userId: string;
    profile: {
        displayName?: string;
        avatarUrl?: string;
        username?: string;
    };
    stories: {
        id: string;
        mediaUrls: string[];
        mediaType: MediaType;
        thumbnailUrl?: string;
        title?: string;
        caption?: string;
        createdAt: string;
        expiresAt: string;
        hasViewed: boolean;
    }[];
    allViewed: boolean;
}

interface ContentContextType {
    // Feed state
    feedPosts: ContentPost[];
    feedLoading: boolean;
    feedHasMore: boolean;

    // Stories state
    storyUsers: StoryUser[];
    storiesLoading: boolean;
    activeStoryIndex: number | null;

    // Drafts state
    drafts: ContentDraft[];
    draftsLoading: boolean;

    // Actions
    fetchFeed: (type?: ContentType, reset?: boolean, userId?: string) => Promise<void>;
    fetchStories: () => Promise<void>;
    fetchDrafts: (type?: ContentType) => Promise<void>;
    createPost: (data: CreatePostData) => Promise<ContentPost>;
    createDraft: (data: CreateDraftData) => Promise<ContentDraft>;
    publishDraft: (draftId: string) => Promise<ContentPost>;
    deleteDraft: (draftId: string) => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
    recordView: (postId: string) => Promise<void>;
    openStory: (userIndex: number) => void;
    closeStory: () => void;
    refreshContent: () => Promise<void>;
}

interface CreatePostData {
    contentType: ContentType;
    mediaUrls: string[];
    mediaType: MediaType;
    title?: string;
    thumbnailUrl?: string;
    caption?: string;
    aspectRatio?: AspectRatio;
    audioId?: string;
    audioName?: string;
    audioArtist?: string;
    visibility?: Visibility;
}

interface CreateDraftData {
    contentType: ContentType;
    draftData?: ContentDraft['draftData'];
    mediaUrls?: string[];
    thumbnailUrl?: string;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function useContent() {
    const context = useContext(ContentContext);
    if (!context) {
        throw new Error('useContent must be used within a ContentProvider');
    }
    return context;
}

interface ContentProviderProps {
    children: ReactNode;
}

export function ContentProvider({ children }: ContentProviderProps) {
    // Feed state
    const [feedPosts, setFeedPosts] = useState<ContentPost[]>([]);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedHasMore, setFeedHasMore] = useState(true);
    const [feedPage, setFeedPage] = useState(1);
    const [feedType, setFeedType] = useState<ContentType | undefined>();

    // Stories state
    const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
    const [storiesLoading, setStoriesLoading] = useState(false);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

    // Drafts state
    const [drafts, setDrafts] = useState<ContentDraft[]>([]);
    const [draftsLoading, setDraftsLoading] = useState(false);

    // Fetch feed posts
    const fetchFeed = useCallback(async (type?: ContentType, reset = false, userId?: string) => {
        try {
            setFeedLoading(true);
            const page = reset ? 1 : feedPage;

            if (reset) {
                setFeedType(type);
                setFeedPage(1);
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(type && { type }),
                ...(userId && { userId })
            });

            const response = await api.get<any>(`/content/feed?${params}`);
            const { posts, hasMore } = response;

            setFeedPosts(reset ? posts : [...feedPosts, ...posts]);
            setFeedHasMore(hasMore);
            if (!reset) setFeedPage(page + 1);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setFeedLoading(false);
        }
    }, [feedPage, feedPosts]);

    // Fetch stories from followed users
    const fetchStories = useCallback(async () => {
        try {
            setStoriesLoading(true);
            const response = await api.get<any>('/content/stories');
            setStoryUsers(response.users);
        } catch (error) {
            console.error('Error fetching stories:', error);
        } finally {
            setStoriesLoading(false);
        }
    }, []);

    // Fetch user's drafts
    const fetchDrafts = useCallback(async (type?: ContentType) => {
        try {
            setDraftsLoading(true);
            const params = type ? `?type=${type}` : '';
            const response = await api.get<any>(`/content/drafts${params}`);
            setDrafts(response.drafts);
        } catch (error) {
            console.error('Error fetching drafts:', error);
        } finally {
            setDraftsLoading(false);
        }
    }, []);

    // Create a new post
    const createPost = useCallback(async (data: CreatePostData): Promise<ContentPost> => {
        const response = await api.post<any>('/content/posts', data);
        const newPost = response;

        // Add to feed if it matches current filter
        if (!feedType || feedType === data.contentType) {
            setFeedPosts(prev => [newPost, ...prev]);
        }

        return newPost;
    }, [feedType]);

    // Create a draft
    const createDraft = useCallback(async (data: CreateDraftData): Promise<ContentDraft> => {
        const response = await api.post<any>('/content/drafts', data);
        const newDraft = response;
        setDrafts(prev => [newDraft, ...prev]);
        return newDraft;
    }, []);

    // Publish a draft
    const publishDraft = useCallback(async (draftId: string): Promise<ContentPost> => {
        const response = await api.post<any>(`/content/drafts/${draftId}/publish`);
        const newPost = response;

        // Remove from drafts
        setDrafts(prev => prev.filter(d => d.id !== draftId));

        // Add to feed
        setFeedPosts(prev => [newPost, ...prev]);

        return newPost;
    }, []);

    // Delete a draft
    const deleteDraft = useCallback(async (draftId: string): Promise<void> => {
        await api.delete(`/content/drafts/${draftId}`);
        setDrafts(prev => prev.filter(d => d.id !== draftId));
    }, []);

    // Toggle like on a post
    const toggleLike = useCallback(async (postId: string): Promise<void> => {
        try {
            const response = await api.post<any>(`/content/posts/${postId}/like`);
            const { liked } = response;

            setFeedPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        hasLiked: liked,
                        likesCount: liked ? post.likesCount + 1 : post.likesCount - 1
                    };
                }
                return post;
            }));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }, []);

    // Record view (for stories)
    const recordView = useCallback(async (postId: string): Promise<void> => {
        try {
            await api.post<any>(`/content/posts/${postId}/view`);

            // Update local state to mark as viewed
            setStoryUsers(prev => prev.map(user => ({
                ...user,
                stories: user.stories.map(story =>
                    story.id === postId ? { ...story, hasViewed: true } : story
                ),
                allViewed: user.stories.every(s => s.id === postId || s.hasViewed)
            })));
        } catch (error) {
            console.error('Error recording view:', error);
        }
    }, []);

    // Open story viewer
    const openStory = useCallback((userIndex: number) => {
        setActiveStoryIndex(userIndex);
    }, []);

    // Close story viewer
    const closeStory = useCallback(() => {
        setActiveStoryIndex(null);
    }, []);

    // Refresh all content
    const refreshContent = useCallback(async () => {
        await Promise.all([
            fetchFeed(feedType, true),
            fetchStories()
        ]);
    }, [fetchFeed, fetchStories, feedType]);

    const value: ContentContextType = {
        feedPosts,
        feedLoading,
        feedHasMore,
        storyUsers,
        storiesLoading,
        activeStoryIndex,
        drafts,
        draftsLoading,
        fetchFeed,
        fetchStories,
        fetchDrafts,
        createPost,
        createDraft,
        publishDraft,
        deleteDraft,
        toggleLike,
        recordView,
        openStory,
        closeStory,
        refreshContent
    };

    return (
        <ContentContext.Provider value={value}>
            {children}
        </ContentContext.Provider>
    );
}
