import { apiClient } from './api';

// Types matching backend Anteroom model
export interface CompletionStatus {
    hasRequiredPhotos: boolean;
    hasCategory: boolean;
    hasBrand: boolean;
    hasCondition: boolean;
    hasColor: boolean;
    hasMaterial: boolean;
    completionPercentage: number;
}

export interface AnteroomImage {
    url: string;
    type: string;
    isPrimary: boolean;
}

export interface AnteroomItem {
    id: string;
    ownerId: string;
    itemData: {
        category?: {
            page: string;
            blueSubcategory?: string;
            whiteSubcategory?: string;
            graySubcategory?: string;
        };
        brand?: {
            brand: string;
            line?: string;
            collaboration?: string;
        };
        metadata?: {
            composition?: Array<{ material: string; percentage: number }>;
            colors?: Array<{ primary: string; undertones: string[] }>;
            careInstructions?: string[];
        };
        condition?: {
            status: 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor';
            notes?: string;
            defects?: string[];
        };
    };
    images: AnteroomImage[];
    completionStatus: CompletionStatus;
    daysRemaining: number;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface AnteroomLimits {
    MAX_BATCH_UPLOAD: number;
    MAX_TOTAL_ITEMS: number;
    EXPIRY_DAYS: number;
}

export interface ItemCountResponse {
    current: number;
    max: number;
    available: number;
    limits: AnteroomLimits;
}

export interface BulkQualityUpdate {
    itemIds: string[];
    quality: 'color' | 'brand' | 'material' | 'condition' | 'category';
    value: any;
}

/**
 * AnteroomAPI - Frontend API client for Anteroom staging area
 * Handles batch uploads, bulk quality updates, and item management
 */
export class AnteroomAPI {
    /**
     * Get all anteroom items for the current user
     */
    static async getItems(): Promise<{ items: AnteroomItem[]; count: number }> {
        const response = await apiClient.get<any>('/anteroom/items');
        const data = response?.data || response;
        return {
            items: data?.items || [],
            count: data?.count || 0,
        };
    }

    /**
     * Get current item count and limits
     */
    static async getItemCount(): Promise<ItemCountResponse> {
        const response = await apiClient.get<any>('/anteroom/count');
        const data = response?.data || response;
        return {
            current: data?.current || 0,
            max: data?.max || 50,
            available: data?.available || 50,
            limits: data?.limits || {
                MAX_BATCH_UPLOAD: 10,
                MAX_TOTAL_ITEMS: 50,
                EXPIRY_DAYS: 14,
            },
        };
    }

    /**
     * Add a single item with optional images
     */
    static async addItem(
        images: File[],
        itemData: Partial<AnteroomItem['itemData']> = {}
    ): Promise<{ item: AnteroomItem; expiresIn: number; count: ItemCountResponse }> {
        const formData = new FormData();

        images.forEach((image) => {
            formData.append('images', image);
        });

        formData.append('itemData', JSON.stringify(itemData));

        const response = await apiClient.post<any>('/anteroom/items/with-images', formData);
        return response.data;
    }

    /**
     * Add multiple items in a batch (up to 10 at once)
     */
    static async addBatchItems(
        images: File[],
        itemsData: Partial<AnteroomItem['itemData']>[] = []
    ): Promise<{
        message: string;
        items: AnteroomItem[];
        errors: string[];
        count: ItemCountResponse;
    }> {
        const formData = new FormData();

        images.forEach((image) => {
            formData.append('images', image);
        });

        if (itemsData.length > 0) {
            formData.append('items', JSON.stringify(itemsData));
        }

        const response = await apiClient.post<any>('/anteroom/items/batch', formData);
        return response.data;
    }

    /**
     * Update a single anteroom item
     */
    static async updateItem(
        id: string,
        itemData: Partial<AnteroomItem['itemData']>
    ): Promise<{ item: AnteroomItem; daysRemaining: number }> {
        const response = await apiClient.put<any>(`/anteroom/items/${id}`, itemData);
        return response.data;
    }

    /**
     * Apply a quality value to multiple items at once (filter mode)
     */
    static async applyQualityBulk(
        update: BulkQualityUpdate
    ): Promise<{ message: string; updated: number; errors: string[] }> {
        const response = await apiClient.post<any>('/anteroom/items/bulk-update', update);
        return response.data;
    }

    /**
     * Complete an item and move it to the main wardrobe
     */
    static async completeItem(id: string): Promise<{ message: string; item: any }> {
        const response = await apiClient.post<any>(`/anteroom/items/${id}/complete`);
        return response.data;
    }

    /**
     * Remove an item from the anteroom
     */
    static async removeItem(id: string): Promise<{ message: string }> {
        const response = await apiClient.delete<any>(`/anteroom/items/${id}`);
        return response.data || { message: 'Item removed successfully' };
    }

    /**
     * Check if user can add more items
     */
    static async canAddItems(count: number = 1): Promise<boolean> {
        const itemCount = await this.getItemCount();
        return itemCount.available >= count;
    }

    /**
     * Get remaining capacity for batch upload
     */
    static async getRemainingCapacity(): Promise<{
        canUpload: boolean;
        available: number;
        maxBatch: number;
        effectiveMax: number;
    }> {
        const itemCount = await this.getItemCount();
        const maxBatch = itemCount.limits.MAX_BATCH_UPLOAD;
        const effectiveMax = Math.min(maxBatch, itemCount.available);

        return {
            canUpload: itemCount.available > 0,
            available: itemCount.available,
            maxBatch,
            effectiveMax,
        };
    }
}

export default AnteroomAPI;
