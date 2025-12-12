import { apiClient } from './api';

export interface WardrobeItem {
  id: string;
  vufsCode: string;
  ownerId: string;
  category: {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
  };
  brand: {
    brand: string;
    line?: string;
    collaboration?: string;
  };
  metadata: {
    composition: Array<{ material: string; percentage: number }>;
    colors: Array<{ primary: string; undertones: string[] }>;
    careInstructions: string[];
    acquisitionInfo?: {
      date: string | Date;
      price: number;
      store: string;
    };
    pricing?: {
      retailPrice: number;
      currentValue: number;
    };
  };
  condition: {
    status: 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor';
    notes?: string;
    defects: string[];
  };
  ownership: {
    status: 'owned' | 'loaned' | 'sold';
    visibility: 'public' | 'private' | 'friends';
    loanedTo?: string;
    loanDate?: Date;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    imageType: 'front' | 'back' | 'detail' | 'styled';
    isPrimary: boolean;
    aiAnalysis?: any;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWardrobeItemRequest {
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
    acquisitionInfo?: {
      date: string | Date;
      price: number;
      store: string;
    };
    pricing?: {
      retailPrice: number;
      currentValue: number;
    };
  };
  condition?: {
    status: 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor';
    notes?: string;
    defects?: string[];
  };
  ownership?: {
    status: 'owned' | 'loaned' | 'sold';
    visibility: 'public' | 'private' | 'friends';
  };
  useAI?: boolean;
}

export interface WardrobeFilters {
  category?: string;
  brand?: string;
  condition?: string;
  visibility?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AIFeedback {
  itemId: string;
  aiSuggestions: any;
  userCorrections: {
    category?: any;
    brand?: any;
    metadata?: any;
    condition?: any;
  };
  feedbackType: 'correction' | 'confirmation' | 'partial_correction';
}

export class WardrobeAPI {
  /**
   * Create a new wardrobe item with AI processing
   */
  static async createItem(
    images: File[],
    itemData: CreateWardrobeItemRequest = {}
  ): Promise<{
    item: WardrobeItem;
    aiAnalysis?: {
      confidence: any;
      suggestions: any;
      backgroundRemoved: boolean;
    };
  }> {
    const formData = new FormData();

    // Add images
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    // Add item data
    Object.entries(itemData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });

    const response = await apiClient.post<any>('/wardrobe/items', formData);

    return response.data;
  }

  /**
   * Get user's wardrobe items
   */
  static async getItems(filters: WardrobeFilters = {}): Promise<{
    items: WardrobeItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get<any>(`/wardrobe/items?${params.toString()}`);
    // apiClient already unwraps the JSON response, so return it directly
    // Handle both response formats: direct { items, pagination } or wrapped { data: { items, pagination } }
    const data = response?.data || response;
    return {
      items: data?.items || [],
      pagination: data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

  /**
   * Update a wardrobe item
   */
  static async updateItem(
    itemId: string,
    updates: Partial<CreateWardrobeItemRequest>
  ): Promise<{ item: WardrobeItem }> {
    const response = await apiClient.put<any>(`/wardrobe/items/${itemId}`, updates);
    return response.data;
  }

  /**
   * Delete a wardrobe item
   */
  static async deleteItem(itemId: string): Promise<void> {
    await apiClient.delete(`/wardrobe/items/${itemId}`);
  }

  /**
   * Provide AI feedback for training
   */
  static async provideFeedback(feedback: AIFeedback): Promise<void> {
    await apiClient.post('/wardrobe/feedback', feedback);
  }

  /**
   * Reprocess item with updated AI
   */
  static async reprocessWithAI(
    itemId: string,
    imageUrl: string
  ): Promise<{ suggestions: any }> {
    const response = await apiClient.post<any>(`/wardrobe/items/${itemId}/reprocess`, {
      imageUrl,
    });
    return response.data;
  }

  /**
   * Get wardrobe statistics
   */
  static async getStats(): Promise<{
    stats: {
      totalItems: number;
      itemsByCategory: Record<string, number>;
      itemsByBrand: Record<string, number>;
      itemsByCondition: Record<string, number>;
    };
  }> {
    const response = await apiClient.get<any>('/wardrobe/stats');
    return response.data;
  }

  /**
   * Batch sync offline items
   */
  static async syncOfflineItems(items: any[]): Promise<{
    synced: number;
    failed: number;
    errors: any[];
  }> {
    const results = {
      synced: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const item of items) {
      try {
        if (item.needsSync) {
          // Convert offline item format to API format
          const apiItem: CreateWardrobeItemRequest = {
            category: {
              page: this.mapCategoryToPage(item.category),
            },
            brand: item.brand ? { brand: item.brand } : undefined,
            metadata: {
              colors: item.color ? [{ primary: item.color, undertones: [] }] : undefined,
              acquisitionInfo: item.purchasePrice ? {
                date: new Date(),
                price: item.purchasePrice,
                store: 'Unknown',
              } : undefined,
            },
            condition: {
              status: this.mapConditionStatus(item.condition),
              defects: [],
            },
            ownership: {
              status: 'owned',
              visibility: 'public',
            },
            useAI: false, // Don't use AI for offline sync
          };

          // Create item without images first (offline items might not have proper image files)
          await this.createItem([], apiItem);
          results.synced++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          itemId: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private static mapCategoryToPage(category: string): string {
    const categoryMap: Record<string, string> = {
      'tops': 'Apparel',
      'bottoms': 'Apparel',
      'dresses': 'Apparel',
      'shoes': 'Footwear',
      'accessories': 'Apparel',
      'outerwear': 'Apparel',
    };
    return categoryMap[category] || 'Apparel';
  }

  private static mapConditionStatus(condition: string): 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor' {
    const conditionMap: Record<string, 'New' | 'Excellent Used' | 'Good' | 'Fair' | 'Poor'> = {
      'new': 'New',
      'excellent': 'Excellent Used',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
    };
    return conditionMap[condition] || 'Good';
  }
}