import { apiClient } from './api';

export interface VUFSAttributeValue {
    id: string;
    name: string;
    typeSlug: string;
    parentId?: string | null;
    iconUrl?: string;
    swatchUrl?: string;
}

export interface VUFSBrand {
    id: string;
    name: string;
    type: 'brand' | 'line' | 'collaboration';
    parentId?: string | null;
    logo?: string;
}

export interface VUFSColor {
    id: string;
    name: string;
    hex?: string;
}

export interface VUFSMaterial {
    id: string;
    name: string;
    category?: string;
    iconUrl?: string;
    swatchUrl?: string;
}

export interface VUFSSize {
    id: string;
    name: string;
}

export const vufsApi = {
    getAttributeValues: async (typeSlug: string): Promise<VUFSAttributeValue[]> => {
        const response = await apiClient.get<{ values: VUFSAttributeValue[] }>(`/vufs-management/attributes/${typeSlug}/values`);
        return response.values || [];
    },

    getBrands: async (type?: 'brand' | 'line' | 'collaboration'): Promise<VUFSBrand[]> => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        const response = await apiClient.get<{ brands: VUFSBrand[] }>(`/vufs-management/brands?${params.toString()}`);
        return response.brands || [];
    },

    getColors: async (): Promise<VUFSColor[]> => {
        const response = await apiClient.get<{ colors: VUFSColor[] }>(`/vufs-management/colors`);
        return response.colors || [];
    },

    getMaterials: async (): Promise<VUFSMaterial[]> => {
        const response = await apiClient.get<{ materials: VUFSMaterial[] }>(`/vufs-management/materials`);
        return response.materials || [];
    },

    getSizes: async (): Promise<VUFSSize[]> => {
        const response = await apiClient.get<{ sizes: VUFSSize[] }>(`/vufs-management/sizes`);
        return response.sizes || [];
    },

    getFits: async (): Promise<VUFSAttributeValue[]> => {
        const response = await apiClient.get<{ fits: VUFSAttributeValue[] }>(`/vufs-management/fits`);
        return response.fits || [];
    },

    getPatterns: async (): Promise<VUFSAttributeValue[]> => {
        const response = await apiClient.get<{ patterns: VUFSAttributeValue[] }>(`/vufs-management/patterns`);
        return response.patterns || [];
    },

    getGenders: async (): Promise<VUFSAttributeValue[]> => {
        const response = await apiClient.get<{ genders: VUFSAttributeValue[] }>(`/vufs-management/genders`);
        return response.genders || [];
    }
};
