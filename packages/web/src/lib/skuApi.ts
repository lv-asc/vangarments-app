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
        years?: string;
        months?: string;
        days?: string;
        parentsOnly?: boolean;
        limit?: number;
        page?: number;
    }): Promise<{ skus: SKUItem[], total: number }> => {
        const params = new URLSearchParams();
        if (term) params.append('term', term);
        if (options?.brandId) params.append('brandId', options.brandId);
        if (options?.styleId) params.append('styleId', options.styleId);
        if (options?.patternId) params.append('patternId', options.patternId);
        if (options?.fitId) params.append('fitId', options.fitId);
        if (options?.genderId) params.append('genderId', options.genderId);
        if (options?.apparelId) params.append('apparelId', options.apparelId);
        if (options?.materialId) params.append('materialId', options.materialId);
        if (options?.sizeId) params.append('sizeId', options.sizeId);
        if (options?.lineId) params.append('lineId', options.lineId);
        if (options?.collection) params.append('collection', options.collection);
        if (options?.years) params.append('years', options.years);
        if (options?.months) params.append('months', options.months);
        if (options?.days) params.append('days', options.days);

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
        const response = await apiClient.get<SKUItem[]>(`/skus/skus/${skuId}/related?type=${type}&limit=${limit}`);
        return response;
    },

    getReleaseDateOptions: async (): Promise<ReleaseDateOptions> => {
        const response = await apiClient.get<ReleaseDateOptions>('/skus/release-date-options');
        return response;
    }
};
