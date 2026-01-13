// Media Tagging types for Vangarments
// Supports tagging users, brands, stores, pages, suppliers, items, and locations on images

export type TagSourceType = 'lookbook_image' | 'post_image' | 'wardrobe_image' | 'sku_image';
export type TagType = 'user' | 'brand' | 'store' | 'page' | 'supplier' | 'item' | 'location';

export interface MediaTag {
    id: string;
    sourceType: TagSourceType;
    sourceId: string;
    imageUrl: string;
    positionX: number;  // 0-100 percentage
    positionY: number;  // 0-100 percentage
    tagType: TagType;
    taggedEntityId?: string;
    taggedItemId?: string;
    locationName?: string;
    locationAddress?: string;
    locationLat?: number;
    locationLng?: number;
    description?: string;  // Optional description like "Designer", "Model", etc.
    createdBy: string;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
    // Populated on fetch
    taggedEntity?: TaggedEntityInfo;
    taggedItem?: TaggedItemInfo;
}

export interface TaggedEntityInfo {
    id: string;
    type: TagType;
    name: string;
    slug?: string;
    imageUrl?: string;
}

export interface TaggedItemInfo {
    id: string;
    name: string;
    imageUrl?: string;
    brandName?: string;
}

// API Request types
export interface CreateMediaTagRequest {
    sourceType: TagSourceType;
    sourceId: string;
    imageUrl: string;
    positionX: number;
    positionY: number;
    tagType: TagType;
    taggedEntityId?: string;
    taggedItemId?: string;
    locationName?: string;
    locationAddress?: string;
    locationLat?: number;
    locationLng?: number;
    description?: string;
}

export interface UpdateMediaTagRequest {
    positionX?: number;
    positionY?: number;
    isApproved?: boolean;
}

// API Response types
export interface TaggedContentItem {
    tag: MediaTag;
    source: {
        type: TagSourceType;
        id: string;
        imageUrl: string;
        title?: string;
        owner?: {
            id: string;
            name: string;
            imageUrl?: string;
            type: 'user' | 'brand';
        };
    };
}

export interface TaggedContentResponse {
    items: TaggedContentItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Search request for taggable entities
export interface TagSearchRequest {
    query: string;
    types?: TagType[];  // Filter by entity types
    limit?: number;
}

export interface TagSearchResult {
    id: string;
    type: TagType;
    name: string;
    slug?: string;
    imageUrl?: string;
    subtitle?: string;  // e.g., "@username" for users, "Brand" for brands
}

export interface TagSearchResponse {
    results: TagSearchResult[];
    query: string;
}
