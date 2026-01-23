'use client';

import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseFormDraftPersistenceOptions<T> {
    /** Unique key for this form's draft storage */
    storageKey: string;
    /** Current form data to persist */
    data: T;
    /** Setter for form data (used to restore) */
    setData: (data: T) => void;
    /** Whether the form is currently loading data from the server */
    isLoading?: boolean;
    /** Whether this is a new entity (vs editing existing) */
    isNew?: boolean;
    /** Optional: Additional data objects to persist (e.g., logos, banners arrays) */
    additionalData?: Record<string, any>;
    /** Optional: Setters for additional data */
    additionalSetters?: Record<string, (value: any) => void>;
    /** Optional: Disable the "Restored draft" toast notification */
    silentRestore?: boolean;
}

/**
 * Hook to persist form drafts to localStorage.
 * 
 * Features:
 * - Auto-saves form state on every change
 * - Restores draft on mount (for new entities only by default)
 * - Provides clearDraft function to call on successful save
 * 
 * Usage:
 * ```tsx
 * const { clearDraft } = useFormDraftPersistence({
 *   storageKey: `brand-draft-${brandId || 'new'}`,
 *   data: formData,
 *   setData: setFormData,
 *   isLoading: loading,
 *   isNew: !brandId,
 *   additionalData: { logos, banners },
 *   additionalSetters: { logos: setLogos, banners: setBanners }
 * });
 * 
 * // In your submit handler:
 * const handleSubmit = async () => {
 *   await api.save(formData);
 *   clearDraft(); // Clear the draft on success
 * };
 * ```
 */
export function useFormDraftPersistence<T extends Record<string, any>>({
    storageKey,
    data,
    setData,
    isLoading = false,
    isNew = true,
    additionalData = {},
    additionalSetters = {},
    silentRestore = false
}: UseFormDraftPersistenceOptions<T>) {
    const hasRestoredRef = useRef(false);
    const isInitialMountRef = useRef(true);

    // Save draft to localStorage whenever data changes
    useEffect(() => {
        // Don't save during initial mount or while loading from server
        if (isInitialMountRef.current || isLoading) {
            isInitialMountRef.current = false;
            return;
        }

        const draft = {
            data,
            additionalData,
            savedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(draft));
        } catch (e) {
            console.warn('[useFormDraftPersistence] Failed to save draft:', e);
        }
    }, [storageKey, data, additionalData, isLoading]);

    // Restore draft from localStorage on mount (only for new entities)
    useEffect(() => {
        // Only restore for new entities, and only once
        if (!isNew || hasRestoredRef.current) return;
        hasRestoredRef.current = true;

        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return;

            const draft = JSON.parse(saved);

            // Restore main data
            if (draft.data) {
                setData(draft.data);
            }

            // Restore additional data
            if (draft.additionalData) {
                Object.keys(draft.additionalData).forEach(key => {
                    const setter = additionalSetters[key];
                    if (setter && draft.additionalData[key] !== undefined) {
                        setter(draft.additionalData[key]);
                    }
                });
            }

            if (!silentRestore) {
                const savedAt = draft.savedAt ? new Date(draft.savedAt) : null;
                const timeAgo = savedAt ? getTimeAgo(savedAt) : '';
                toast.success(
                    `Restored unsaved draft${timeAgo ? ` from ${timeAgo}` : ''}`,
                    { id: 'draft-restored', duration: 4000 }
                );
            }
        } catch (e) {
            console.warn('[useFormDraftPersistence] Failed to restore draft:', e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isNew, storageKey]);

    // Clear draft from localStorage
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch (e) {
            console.warn('[useFormDraftPersistence] Failed to clear draft:', e);
        }
    }, [storageKey]);

    return { clearDraft };
}

// Helper to format time ago
function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

export default useFormDraftPersistence;
