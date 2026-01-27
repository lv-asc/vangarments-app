import { apiClient } from './api';
import { Event, EventType } from '@vangarments/shared/types';

export const eventApi = {
    // List events with filters
    listEvents: (filters?: { eventType?: EventType; search?: string }) =>
        apiClient.get<Event[]>('/events', { params: filters }),

    // Get a specific event by ID or slug
    getEvent: (idOrSlug: string) =>
        apiClient.get<Event>(`/events/${idOrSlug}`),

    // Create a new event
    createEvent: (data: Partial<Event>) =>
        apiClient.post<Event>('/events', data),

    // Update an existing event
    updateEvent: (id: string, data: Partial<Event>) =>
        apiClient.put<Event>(`/events/${id}`, data),

    // Delete an event
    deleteEvent: (id: string) =>
        apiClient.delete(`/events/${id}`),
};
