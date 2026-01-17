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
    officialItemLink?: string;

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
    releaseDate?: string | Date;
}

export interface ReleaseDateOptions {
    years: number[];
    months: number[];
    days: number[];
}

export const skuApi = {
    getAllSKUs: async (options?: { limit?: number; offset?: number; parentsOnly?: boolean }): Promise<{ skus: SKUItem[] }> => {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.parentsOnly !== undefined) params.append('parentsOnly', options.parentsOnly.toString());

        const response = await apiClient.get<{ skus: SKUItem[] }>(`/skus?${params.toString()}`);
        return response;
    },

    searchSKUs: async (term: string = '', options?: {
        brandId?: string;
        styleId?: string;
        patternId?: string;
        fitId?: string;
        genderId?: string;
        apparelId?: string;
        materialId?: string;
        sizeId?: string;
        lineId?: string;
        collection?: string;
        nationality?: string;
        years?: string;
        months?: string;
        days?: string;
        parentsOnly?: boolean;
        limit?: number;
        offset?: number;
        page?: number;
    }): Promise<{ skus: SKUItem[], total: number }> => {
        const params = new URLSearchParams();
        if (term) params.append('term', term);

        // Append all filter options
        if (options) {
            const filterKeys = [
                'brandId', 'styleId', 'patternId', 'fitId', 'genderId',
                'apparelId', 'materialId', 'sizeId', 'lineId', 'collection',
                'nationality', 'years', 'months', 'days'
            ];
            filterKeys.forEach(key => {
                const value = options[key as keyof typeof options];
                if (value !== undefined && value !== '') {
                    params.append(key, String(value));
                }
            });
        }

        const parentsOnly = options?.parentsOnly !== undefined ? options.parentsOnly : true;
        params.append('parentsOnly', parentsOnly.toString());

        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.page) params.append('page', options.page.toString());

        const response = await apiClient.get<{ skus: SKUItem[], total: number }>(`/skus/search?${params.toString()}`);
        return response;
    },

    getBrandSKUs: async (brandId: string, filters?: any): Promise<{ skus: SKUItem[] }> => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get<{ skus: SKUItem[] }>(`/skus/brands/${brandId}/skus?${params.toString()}`);
        return response;
    },

    getRelatedSKUs: async (skuId: string, type: 'collection' | 'brand', limit = 8): Promise<SKUItem[]> => {
        const response = await apiClient.get<SKUItem[]>(`/skus/${skuId}/related?type=${type}&limit=${limit}`);
        return response;
    },

    getReleaseDateOptions: async (): Promise<ReleaseDateOptions> => {
        const response = await apiClient.get<ReleaseDateOptions>('/skus/release-date-options');
        return response;
    }
};
