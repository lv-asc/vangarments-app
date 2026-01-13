const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type CalendarEventType = string;

export interface CalendarEvent {
    id: string;
    eventType: CalendarEventType;
    title: string;
    description?: string;
    eventDate: string;
    eventTime?: string;
    endDate?: string;
    skuItemId?: string;
    brandId?: string;
    collectionId?: string;
    location?: string;
    imageUrl?: string;
    images?: Array<{ url: string; isPrimary: boolean; labelId?: string }>;
    videos?: Array<{ url: string; title?: string; labelId?: string }>;
    attachments?: Array<{ url: string; name: string; type: string }>;
    taggedEntities?: Array<{ type: string; id: string; name?: string; logoUrl?: string; slug?: string }>;
    externalUrl?: string;
    isFeatured: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    // Joined data
    skuItem?: any;
    brand?: any;
    collection?: any;
    releaseDate?: string;
}

export interface CalendarEventFilters {
    year?: number;
    month?: number;
    type?: CalendarEventType;
    brandId?: string;
    featured?: boolean;
    published?: boolean;
    region?: string;
    entityId?: string;
    entityType?: string;
}

export interface CalendarEventTypeRecord {
    id: string;
    value: string;
    label: string;
    icon: string;
    color?: string;
    is_system: boolean;
}

export interface EventTypeOption {
    value: CalendarEventType;
    label: string;
    icon: string;
}

// Get calendar events with filters
export async function getCalendarEvents(filters: CalendarEventFilters = {}): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();

    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.brandId) params.append('brandId', filters.brandId);
    if (filters.featured) params.append('featured', 'true');
    if (filters.region) params.append('region', filters.region);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.entityType) params.append('entityType', filters.entityType);

    const response = await fetch(`${API_BASE_URL}/calendar/events?${params.toString()}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch calendar events');
    }

    return data.data;
}

// Get single calendar event
export async function getCalendarEvent(id: string): Promise<CalendarEvent> {
    const response = await fetch(`${API_BASE_URL}/calendar/events/${id}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch calendar event');
    }

    return data.data;
}

// Get available years
export async function getAvailableYears(): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/calendar/years`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch available years');
    }

    return data.data;
}

// Get event type options
export async function getEventTypes(): Promise<CalendarEventTypeRecord[]> {
    const response = await fetch(`${API_BASE_URL}/calendar/event-types`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch event types');
    }

    return data.data;
}

// Create event type
export async function createEventType(data: Partial<CalendarEventTypeRecord>, token: string): Promise<CalendarEventTypeRecord> {
    const response = await fetch(`${API_BASE_URL}/calendar/event-types`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to create event type');
    return result.data;
}

// Update event type
export async function updateEventType(id: string, data: Partial<CalendarEventTypeRecord>, token: string): Promise<CalendarEventTypeRecord> {
    const response = await fetch(`${API_BASE_URL}/calendar/event-types/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to update event type');
    return result.data;
}

// Delete event type
export async function deleteEventType(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calendar/event-types/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to delete event type');
}

// Create calendar event (requires auth)
export async function createCalendarEvent(
    eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'skuItem' | 'brand' | 'collection'>,
    token: string
): Promise<CalendarEvent> {
    const response = await fetch(`${API_BASE_URL}/calendar/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
    });
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to create calendar event');
    }

    return data.data;
}

// Update calendar event (requires auth)
export async function updateCalendarEvent(
    id: string,
    eventData: Partial<CalendarEvent>,
    token: string
): Promise<CalendarEvent> {
    const response = await fetch(`${API_BASE_URL}/calendar/events/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
    });
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to update calendar event');
    }

    return data.data;
}

// Delete calendar event (requires auth)
export async function deleteCalendarEvent(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calendar/events/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to delete calendar event');
    }
}

// Subscribe to a calendar event
export async function subscribeToEvent(
    eventId: string,
    token: string,
    reminders: { remindAt1h?: boolean; remindAt24h?: boolean } = {}
): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/calendar/subscribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId, ...reminders }),
    });
    const data = await response.json();
    return data;
}

// Unsubscribe from a calendar event
export async function unsubscribeFromEvent(eventId: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/calendar/unsubscribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
    });
    const data = await response.json();
    return data;
}

// Get user subscriptions
export async function getUserSubscriptions(token: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/calendar/subscriptions`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data.data || [];
}

// Sync SKUs to calendar
export async function syncSKUs(token: string, brandId?: string): Promise<any> {
    const url = brandId ? `${API_BASE_URL}/calendar/sync-skus?brandId=${brandId}` : `${API_BASE_URL}/calendar/sync-skus`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    return data;
}

// Group common API functions into a single object for easier import
export const calendarApi = {
    getEvents: getCalendarEvents,
    getEvent: getCalendarEvent,
    getAvailableYears,
    getEventTypes,
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
    subscribeToEvent,
    unsubscribeFromEvent,
    getSubscriptions: getUserSubscriptions,
    syncSKUs,
    createEventType,
    updateEventType,
    deleteEventType,
};

// Event type display helpers
export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
    item_launch: 'Item Launch',
    collection_release: 'Collection Release',
    drop: 'Drop',
    fashion_event: 'Fashion Event',
    award: 'Award',
    media_release: 'Media Release',
};

export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
    item_launch: 'bg-blue-500',
    collection_release: 'bg-purple-500',
    drop: 'bg-orange-500',
    fashion_event: 'bg-pink-500',
    award: 'bg-yellow-500',
    media_release: 'bg-green-500',
};
