import {
    MediaTag,
    CreateMediaTagRequest,
    UpdateMediaTagRequest,
    TaggedContentResponse,
    TagSearchResponse,
    TagType,
    TagSourceType,
} from '@vangarments/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class TagApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || error.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data || data;
    }

    // ============ Tag CRUD Operations ============

    /**
     * Add a tag to an image
     */
    async addTag(request: CreateMediaTagRequest): Promise<MediaTag> {
        return this.request<MediaTag>('/tags', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    /**
     * Get tags for a specific source (lookbook, post, etc.)
     */
    async getTagsBySource(
        sourceType: TagSourceType,
        sourceId: string,
        imageUrl?: string
    ): Promise<MediaTag[]> {
        const params = new URLSearchParams({
            sourceType,
            sourceId,
            ...(imageUrl && { imageUrl }),
        });
        return this.request<MediaTag[]>(`/tags?${params.toString()}`);
    }

    /**
     * Get a single tag by ID
     */
    async getTag(tagId: string): Promise<MediaTag> {
        return this.request<MediaTag>(`/tags/${tagId}`);
    }

    /**
     * Update a tag's position
     */
    async updateTag(tagId: string, updates: UpdateMediaTagRequest): Promise<MediaTag> {
        return this.request<MediaTag>(`/tags/${tagId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Delete a tag
     */
    async deleteTag(tagId: string): Promise<void> {
        await this.request(`/tags/${tagId}`, {
            method: 'DELETE',
        });
    }

    // ============ Search Operations ============

    /**
     * Search for taggable entities (users, brands, stores, pages, suppliers)
     */
    async searchEntities(
        query: string,
        types?: TagType[],
        limit?: number
    ): Promise<TagSearchResponse> {
        const params = new URLSearchParams({ q: query });
        if (types && types.length > 0) {
            params.set('types', types.join(','));
        }
        if (limit) {
            params.set('limit', limit.toString());
        }
        return this.request<TagSearchResponse>(`/tags/search/entities?${params.toString()}`);
    }

    /**
     * Search for items to tag
     */
    async searchItems(query: string, limit?: number): Promise<TagSearchResponse> {
        const params = new URLSearchParams({ q: query });
        if (limit) {
            params.set('limit', limit.toString());
        }
        return this.request<TagSearchResponse>(`/tags/search/items?${params.toString()}`);
    }

    // ============ Tagged Content Operations ============

    /**
     * Get content where a user is tagged
     */
    async getTaggedContentForUser(userId: string, page = 1, limit = 20): Promise<TaggedContentResponse> {
        return this.request<TaggedContentResponse>(
            `/users/${userId}/tagged?page=${page}&limit=${limit}`
        );
    }

    /**
     * Get content where a brand is tagged
     */
    async getTaggedContentForBrand(brandId: string, page = 1, limit = 20): Promise<TaggedContentResponse> {
        return this.request<TaggedContentResponse>(
            `/brands/${brandId}/tagged?page=${page}&limit=${limit}`
        );
    }

    /**
     * Get content where a store is tagged
     */
    async getTaggedContentForStore(storeId: string, page = 1, limit = 20): Promise<TaggedContentResponse> {
        return this.request<TaggedContentResponse>(
            `/stores/${storeId}/tagged?page=${page}&limit=${limit}`
        );
    }

    /**
     * Get content where a page is tagged
     */
    async getTaggedContentForPage(pageId: string, page = 1, limit = 20): Promise<TaggedContentResponse> {
        return this.request<TaggedContentResponse>(
            `/pages/${pageId}/tagged?page=${page}&limit=${limit}`
        );
    }

    /**
     * Get content where a supplier is tagged
     */
    async getTaggedContentForSupplier(supplierId: string, page = 1, limit = 20): Promise<TaggedContentResponse> {
        return this.request<TaggedContentResponse>(
            `/suppliers/${supplierId}/tagged?page=${page}&limit=${limit}`
        );
    }

    /**
     * Get content where an item is tagged
     */
    async getTaggedContentForItem(itemId: string, page = 1, limit = 20): Promise<TaggedContentResponse> {
        return this.request<TaggedContentResponse>(
            `/items/${itemId}/tagged?page=${page}&limit=${limit}`
        );
    }

    // ============ Helper Methods ============

    /**
     * Get tagged content for any entity type
     */
    async getTaggedContent(
        entityType: TagType,
        entityId: string,
        page = 1,
        limit = 20
    ): Promise<TaggedContentResponse> {
        switch (entityType) {
            case 'user':
                return this.getTaggedContentForUser(entityId, page, limit);
            case 'brand':
                return this.getTaggedContentForBrand(entityId, page, limit);
            case 'store':
                return this.getTaggedContentForStore(entityId, page, limit);
            case 'page':
                return this.getTaggedContentForPage(entityId, page, limit);
            case 'supplier':
                return this.getTaggedContentForSupplier(entityId, page, limit);
            case 'item':
                return this.getTaggedContentForItem(entityId, page, limit);
            default:
                throw new Error(`Unsupported entity type: ${entityType}`);
        }
    }
}

export const tagApi = new TagApiClient();
export default tagApi;
