import api from './api';

export interface IPage {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ICreatePageData {
    name: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    isVerified?: boolean;
    isActive?: boolean;
}


export const pageApi = {
    getAll: async () => {
        return api.get<IPage[]>('/pages');
    },

    getPage: async (idOrSlug: string) => {
        return api.get<IPage>(`/pages/${idOrSlug}`);
    },

    create: async (data: ICreatePageData) => {
        return api.post<IPage>('/pages', data);
    },

    update: async (id: string, data: Partial<ICreatePageData>) => {
        return api.put<IPage>(`/pages/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete(`/pages/${id}`);
    }
};
