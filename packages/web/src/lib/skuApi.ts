import { apiClient } from './api';

export interface SKUItem {
    id: string;
    brandId: string;
    name: string;
    code: string;
    collection?: string;
    line?: string;
    lineId?: string;
    description?: string;
    materials?: string[];
    retailPriceBrl?: number;
    retailPriceUsd?: number;
    retailPriceEur?: number;
    images: Array<{
        url: string;
        isPrimary: boolean;
        labelId?: string;
    }>;
    brand?: {
        name: string;
        logo?: string;
    };
    category: {
        level1: string;
        level2: string;
        level3: string;
        page: string;
        cleanPath: string;
    };
    lineInfo?: {
        id: string;
        name: string;
        logo?: string;
    };
}

export const skuApi = {
    getAllSKUs: async (options?: { limit?: number; offset?: number }): Promise<{ skus: SKUItem[] }> => {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());

        const response = await apiClient.get<{ skus: SKUItem[] }>(`/skus?${params.toString()}`);
        return response;
    },

    searchSKUs: async (term: string, brandId?: string): Promise<{ skus: SKUItem[] }> => {
        const params = new URLSearchParams();
        if (term) params.append('term', term);
        if (brandId) params.append('brandId', brandId);

        const response = await apiClient.get<{ skus: SKUItem[] }>(`/skus/search?${params.toString()}`);
        return response;
    },

    getBrandSKUs: async (brandId: string, filters?: any): Promise<{ skus: SKUItem[] }> => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get<{ skus: SKUItem[] }>(`/skus/brands/${brandId}/skus?${params.toString()}`);
        return response;
    }
};

