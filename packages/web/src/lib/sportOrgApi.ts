import { apiClient } from './api';
import { SportOrg, SportDepartment, SportSquad, SportLeague, SportOrgType } from '@vangarments/shared';

export const sportOrgApi = {
    // Orgs
    listOrgs: (filters?: { orgType?: SportOrgType; search?: string }) =>
        apiClient.get<SportOrg[]>('/sport-orgs', { params: filters }),

    getOrg: (id: string) =>
        apiClient.get<SportOrg>(`/sport-orgs/${id}`),

    createOrg: (data: Partial<SportOrg>) =>
        apiClient.post<SportOrg>('/sport-orgs', data),

    updateOrg: (id: string, data: Partial<SportOrg>) =>
        apiClient.put<SportOrg>(`/sport-orgs/${id}`, data),

    deleteOrg: (id: string) =>
        apiClient.delete(`/sport-orgs/${id}`),

    // Departments
    listDepartments: (orgId: string) =>
        apiClient.get<{ data: SportDepartment[] }>(`/sport-orgs/${orgId}/departments`),

    createDepartment: (orgId: string, data: Partial<SportDepartment>) =>
        apiClient.post<SportDepartment>(`/sport-orgs/${orgId}/departments`, data),

    // Squads
    createSquad: (orgId: string, deptId: string, data: Partial<SportSquad>) =>
        apiClient.post<SportSquad>(`/sport-orgs/${orgId}/departments/${deptId}/squads`, data),

    quickAddSquads: (orgId: string, deptId: string, template: string) =>
        apiClient.post<SportSquad[]>(`/sport-orgs/${orgId}/departments/${deptId}/squads/quick-add`, { template }),

    // Leagues
    listLeagues: (filters?: { sportType?: string; search?: string }) =>
        apiClient.get<SportLeague[]>('/sport-orgs/leagues/list', { params: filters }),

    createLeague: (data: Partial<SportLeague>) =>
        apiClient.post<SportLeague>('/sport-orgs/leagues', data),

    linkSquadToLeague: (squadId: string, leagueId: string, season: string) =>
        apiClient.post(`/sport-orgs/squads/${squadId}/leagues`, { leagueId, season }),
};
