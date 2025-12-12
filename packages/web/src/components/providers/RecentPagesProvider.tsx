'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface RecentPage {
    path: string;
    title: string;
    visitedAt: number;
}

interface RecentPagesContextType {
    recentPages: RecentPage[];
    trackPageVisit: (path: string, title: string) => void;
    clearRecentPages: () => void;
}

const RecentPagesContext = createContext<RecentPagesContextType | undefined>(undefined);

const STORAGE_KEY = 'vangarments_recent_pages';
const MAX_RECENT_PAGES = 8;

// Pages to exclude from tracking (auth pages, etc.)
const EXCLUDED_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export function RecentPagesProvider({ children }: { children: React.ReactNode }) {
    const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
    const pathname = usePathname();

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setRecentPages(parsed);
                    }
                }
            } catch (e) {
                console.error('Failed to load recent pages:', e);
            }
        }
    }, []);

    // Save to localStorage when recentPages changes
    useEffect(() => {
        if (typeof window !== 'undefined' && recentPages.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(recentPages));
            } catch (e) {
                console.error('Failed to save recent pages:', e);
            }
        }
    }, [recentPages]);

    // Track page visit
    const trackPageVisit = useCallback((path: string, title: string) => {
        if (EXCLUDED_PATHS.some(excluded => path.startsWith(excluded))) {
            return;
        }

        setRecentPages(prev => {
            // Remove existing entry for this path
            const filtered = prev.filter(p => p.path !== path);

            // Add new entry at the beginning
            const newEntry: RecentPage = {
                path,
                title: title || path,
                visitedAt: Date.now()
            };

            // Keep only the most recent MAX_RECENT_PAGES
            return [newEntry, ...filtered].slice(0, MAX_RECENT_PAGES);
        });
    }, []);

    // Clear recent pages
    const clearRecentPages = useCallback(() => {
        setRecentPages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // Auto-track current page (with a default title based on path)
    useEffect(() => {
        if (pathname && !EXCLUDED_PATHS.some(excluded => pathname.startsWith(excluded))) {
            // Generate a readable title from the path
            const segments = pathname.split('/').filter(Boolean);
            const title = segments.length > 0
                ? segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' > ')
                : 'Home';

            trackPageVisit(pathname, title);
        }
    }, [pathname, trackPageVisit]);

    return (
        <RecentPagesContext.Provider value={{ recentPages, trackPageVisit, clearRecentPages }}>
            {children}
        </RecentPagesContext.Provider>
    );
}

export function useRecentPages() {
    const context = useContext(RecentPagesContext);
    if (context === undefined) {
        throw new Error('useRecentPages must be used within a RecentPagesProvider');
    }
    return context;
}
