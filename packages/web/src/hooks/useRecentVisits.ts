
import { useState, useEffect } from 'react';

const RECENT_VISITS_KEY = 'vangarments_recent_visits';
const MAX_RECENTS = 10;

export interface RecentVisit {
    id: string;
    name: string;
    logo?: string;
    businessType: string; // brand, store, supplier, etc.
    type: 'brand' | 'store' | 'user' | 'item' | 'post' | 'page' | 'editorial';
    slug?: string;
    brandName?: string; // for items
    brandSlug?: string; // for items
    username?: string; // for users
    verificationStatus?: string;
    visitedAt: number;
}

export function useRecentVisits() {
    const [recents, setRecents] = useState<RecentVisit[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_VISITS_KEY);
            if (stored) {
                setRecents(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load recent visits', e);
        }
    }, []);

    const addVisit = (visit: Omit<RecentVisit, 'visitedAt'>) => {
        try {
            console.log('useRecentVisits: Adding visit:', visit);
            const newVisit = { ...visit, visitedAt: Date.now() };

            setRecents(prev => {
                // Remove existing if present (to move to top)
                const filtered = prev.filter(item => item.id !== visit.id);

                // Add new to beginning
                const updated = [newVisit, ...filtered].slice(0, MAX_RECENTS);

                // Save to localStorage
                localStorage.setItem(RECENT_VISITS_KEY, JSON.stringify(updated));
                console.log('useRecentVisits: Updated recents:', updated);
                return updated;
            });
        } catch (e) {
            console.error('Failed to save recent visit', e);
        }
    };

    const clearHistory = () => {
        localStorage.removeItem(RECENT_VISITS_KEY);
        setRecents([]);
    };

    return { recents, addVisit, clearHistory };
}
