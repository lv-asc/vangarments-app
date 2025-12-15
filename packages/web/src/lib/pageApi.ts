import api from './api';

export interface IPage {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ICreatePageData {
    name: string;
    description?: string;
}

export const pageApi = {
    getAll: async () => {
        return api.get<IPage[]>('/pages');
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
