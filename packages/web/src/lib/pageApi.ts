import api from './api';

export interface IPage {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    logoMetadata?: Array<{ url: string; name: string }>;
    bannerMetadata?: Array<{ url: string; positionY?: number }>;
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    foundedBy?: string;
    foundedDate?: string;
    foundedDatePrecision?: 'year' | 'month' | 'day';
    socialLinks?: Array<{ platform: string; url: string }>;
    isVerified: boolean;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ICreatePageData {
    name: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    logoMetadata?: Array<{ url: string; name: string }>;
    bannerMetadata?: Array<{ url: string; positionY?: number }>;
    websiteUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    foundedBy?: string;
    foundedDate?: string;
    foundedDatePrecision?: 'year' | 'month' | 'day';
    socialLinks?: Array<{ platform: string; url: string }>;
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
    },

    // Team Management
    getTeamMembers: async (pageId: string, publicOnly = false) => {
        return api.get<PageTeamMember[]>(`/pages/${pageId}/team${publicOnly ? '?public=true' : ''}`);
    },

    addTeamMember: async (pageId: string, data: any) => {
        return api.post<PageTeamMember>(`/pages/${pageId}/team`, data);
    },

    updateTeamMember: async (pageId: string, memberId: string, data: any) => {
        return api.put<PageTeamMember>(`/pages/${pageId}/team/${memberId}`, data);
    },

    removeTeamMember: async (pageId: string, memberId: string) => {
        return api.delete(`/pages/${pageId}/team/${memberId}`);
    }
};

export interface PageTeamMember {
    id: string;
    pageId: string;
    userId: string;
    roles: string[];
    title?: string;
    isPublic: boolean;
    joinedAt: string;
    user?: {
        id: string;
        name: string;
        avatarUrl?: string;
        username?: string;
    };
}
