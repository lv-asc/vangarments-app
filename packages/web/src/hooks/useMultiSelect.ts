'use client';

import { useState, useCallback, useEffect } from 'react';

export interface UseMultiSelectOptions<T> {
    items: T[];
    getItemId: (item: T) => string;
    onSelectionChange?: (selectedIds: Set<string>) => void;
}

export interface UseMultiSelectReturn {
    selectedIds: Set<string>;
    lastSelectedId: string | null;
    handleItemClick: (id: string, event: React.MouseEvent) => void;
    selectAll: () => void;
    clearSelection: () => void;
    isSelected: (id: string) => boolean;
    selectedCount: number;
    handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A reusable hook for multi-selection with keyboard shortcuts.
 * 
 * Supports:
 * - Cmd/Ctrl + Click: Toggle individual item selection
 * - Shift + Click: Range selection (select all between last clicked and current)
 * - Cmd/Ctrl + A: Select all items
 * - Regular click on checkbox: Toggle single item
 */
export function useMultiSelect<T>({
    items,
    getItemId,
    onSelectionChange,
}: UseMultiSelectOptions<T>): UseMultiSelectReturn {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    // Notify parent of selection changes
    useEffect(() => {
        onSelectionChange?.(selectedIds);
    }, [selectedIds, onSelectionChange]);

    // Handle Cmd/Ctrl + A for select all
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+A (Mac) or Ctrl+A (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                // Only handle if not in an input field
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }

                e.preventDefault();
                selectAll();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items]);

    const selectAll = useCallback(() => {
        const allIds = new Set(items.map(getItemId));
        setSelectedIds(allIds);
        if (items.length > 0) {
            setLastSelectedId(getItemId(items[items.length - 1]));
        }
    }, [items, getItemId]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        setLastSelectedId(null);
    }, []);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    /**
     * Handle item click with keyboard modifiers.
     * 
     * - Cmd/Ctrl + Click: Toggle individual selection
     * - Shift + Click: Range selection
     * - Regular Click: Toggle single item (for checkboxes)
     */
    const handleItemClick = useCallback((id: string, event: React.MouseEvent) => {
        const isMetaKey = event.metaKey || event.ctrlKey;
        const isShiftKey = event.shiftKey;

        if (isShiftKey && lastSelectedId !== null) {
            // Range selection: select all items between lastSelectedId and current id
            const itemIds = items.map(getItemId);
            const lastIndex = itemIds.indexOf(lastSelectedId);
            const currentIndex = itemIds.indexOf(id);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = itemIds.slice(start, end + 1);

                setSelectedIds(prev => {
                    const newSelected = new Set(prev);
                    rangeIds.forEach(rangeId => newSelected.add(rangeId));
                    return newSelected;
                });
            }
        } else if (isMetaKey) {
            // Toggle individual selection
            setSelectedIds(prev => {
                const newSelected = new Set(prev);
                if (newSelected.has(id)) {
                    newSelected.delete(id);
                } else {
                    newSelected.add(id);
                }
                return newSelected;
            });
            setLastSelectedId(id);
        } else {
            // Regular click: toggle single item (for checkbox behavior)
            setSelectedIds(prev => {
                const newSelected = new Set(prev);
                if (newSelected.has(id)) {
                    newSelected.delete(id);
                } else {
                    newSelected.add(id);
                }
                return newSelected;
            });
            setLastSelectedId(id);
        }
    }, [items, getItemId, lastSelectedId]);

    /**
     * Handle select all checkbox change
     */
    const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            selectAll();
        } else {
            clearSelection();
        }
    }, [selectAll, clearSelection]);

    return {
        selectedIds,
        lastSelectedId,
        handleItemClick,
        selectAll,
        clearSelection,
        isSelected,
        selectedCount: selectedIds.size,
        handleSelectAll,
    };
}
