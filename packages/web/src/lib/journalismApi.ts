import api from './api';

export interface MediaItem {
    url: string;
    isPrimary?: boolean;
    title?: string;
    type: 'image' | 'video';
}

export interface Attachment {
    name: string;
    url: string;
    size: number;
    type: string;
}

export interface IJournalismData {
    id?: string;
    title: string;
    content: string;
    type: 'News' | 'Column' | 'Article';
    images: MediaItem[];
    videos: MediaItem[];
    attachments: Attachment[];
    authorIds: string[];
    pageIds: string[];
    published: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const journalismApi = {
    getAll: async (filters: { type?: string; published?: boolean } = {}) => {
        const query = new URLSearchParams();
        if (filters.type) query.append('type', filters.type);
        if (filters.published !== undefined) query.append('published', String(filters.published));
        return api.get<IJournalismData[]>(`/journalism?${query.toString()}`);
    },

    getById: async (id: string) => {
        return api.get<IJournalismData>(`/journalism/${id}`);
    },

    create: async (data: Omit<IJournalismData, 'id' | 'createdAt' | 'updatedAt'>) => {
        return api.post<IJournalismData>('/journalism', data);
    },

    update: async (id: string, data: Partial<IJournalismData>) => {
        return api.put<IJournalismData>(`/journalism/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete(`/journalism/${id}`);
    }
};
