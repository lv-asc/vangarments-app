import { Request, Response } from 'express';
import { CalendarEventModel, CreateCalendarEventData, UpdateCalendarEventData, CalendarEventType, CalendarEventTypeModel } from '../models/CalendarEvent';
import { CalendarSubscriptionModel } from '../models/CalendarSubscription';
import { SKUItemModel } from '../models/SKUItem';
import { EventNotificationService } from '../services/EventNotificationService';

export const calendarController = {
    // GET /calendar/events
    async getEvents(req: Request, res: Response) {
        try {
            const { year, month, type, brandId, featured, region, entityId, entityType } = req.query;

            const currentYear = new Date().getFullYear();
            const queryYear = year ? parseInt(year as string) : currentYear;
            const queryMonth = month ? parseInt(month as string) : undefined;

            const events = await CalendarEventModel.findByMonth(queryYear, queryMonth, {
                eventType: type as CalendarEventType | undefined,
                brandId: brandId as string | undefined,
                isFeatured: featured === 'true' ? true : undefined,
                isPublished: true,
                region: region as string | undefined,
                entityId: entityId as string | undefined,
                entityType: entityType as string | undefined
            });

            res.json({
                success: true,
                data: events,
                meta: {
                    year: queryYear,
                    month: queryMonth,
                    count: events.length
                }
            });
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch calendar events'
            });
        }
    },

    // GET /calendar/events/:id
    async getEventById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const event = await CalendarEventModel.findById(id);

            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: 'Calendar event not found'
                });
            }

            res.json({ success: true, data: event });
        } catch (error) {
            console.error('Error fetching calendar event:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch calendar event'
            });
        }
    },

    // POST /calendar/events
    async createEvent(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const eventData: CreateCalendarEventData = {
                ...req.body,
                createdBy: userId
            };

            // Validate required fields
            if (!eventData.eventType || !eventData.title || !eventData.eventDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: eventType, title, eventDate'
                });
            }

            const event = await CalendarEventModel.create(eventData);
            res.status(201).json({ success: true, data: event });
        } catch (error) {
            console.error('Error creating calendar event:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create calendar event'
            });
        }
    },

    // PUT /calendar/events/:id
    async updateEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData: UpdateCalendarEventData = req.body;

            const event = await CalendarEventModel.update(id, updateData);

            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: 'Calendar event not found'
                });
            }

            res.json({ success: true, data: event });
        } catch (error) {
            console.error('Error updating calendar event:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update calendar event'
            });
        }
    },

    // DELETE /calendar/events/:id
    async deleteEvent(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await CalendarEventModel.delete(id);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Calendar event not found'
                });
            }

            res.json({ success: true, message: 'Event deleted successfully' });
        } catch (error) {
            console.error('Error deleting calendar event:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete calendar event'
            });
        }
    },

    // GET /calendar/years
    async getAvailableYears(req: Request, res: Response) {
        try {
            const years = await CalendarEventModel.getAvailableYears();

            // If no events exist, return current year and a few past years
            if (years.length === 0) {
                const currentYear = new Date().getFullYear();
                const defaultYears = Array.from({ length: 23 }, (_, i) => currentYear - i);
                return res.json({ success: true, data: defaultYears });
            }

            res.json({ success: true, data: years });
        } catch (error) {
            console.error('Error fetching available years:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch available years'
            });
        }
    },

    // GET /calendar/event-types
    async getEventTypes(req: Request, res: Response) {
        try {
            const eventTypes = await CalendarEventTypeModel.findAll();
            res.json({ success: true, data: eventTypes });
        } catch (error) {
            console.error('Error fetching event types:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch event types' });
        }
    },

    // POST /calendar/event-types
    async createEventType(req: Request, res: Response) {
        try {
            const data = req.body;
            const eventType = await CalendarEventTypeModel.create(data);
            res.status(201).json({ success: true, data: eventType });
        } catch (error) {
            console.error('Error creating event type:', error);
            res.status(500).json({ success: false, error: 'Failed to create event type' });
        }
    },

    // PUT /calendar/event-types/:id
    async updateEventType(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const eventType = await CalendarEventTypeModel.update(id, data);
            if (!eventType) return res.status(404).json({ success: false, error: 'Event type not found' });
            res.json({ success: true, data: eventType });
        } catch (error) {
            console.error('Error updating event type:', error);
            res.status(500).json({ success: false, error: 'Failed to update event type' });
        }
    },

    // DELETE /calendar/event-types/:id
    async deleteEventType(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const success = await CalendarEventTypeModel.delete(id);
            if (!success) return res.status(400).json({ success: false, error: 'Failed to delete event type (it might be a system type)' });
            res.json({ success: true, message: 'Event type deleted successfully' });
        } catch (error) {
            console.error('Error deleting event type:', error);
            res.status(500).json({ success: false, error: 'Failed to delete event type' });
        }
    },

    // POST /calendar/subscribe
    async subscribe(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { eventId, remindAt1h, remindAt24h } = req.body;

            if (!eventId) {
                return res.status(400).json({ success: false, error: 'Event ID is required' });
            }

            const subscription = await CalendarSubscriptionModel.subscribe({
                userId,
                eventId,
                remindAt1h,
                remindAt24h
            });

            res.json({ success: true, data: subscription });
        } catch (error) {
            console.error('Error subscribing to event:', error);
            res.status(500).json({ success: false, error: 'Failed to subscribe to event' });
        }
    },

    // POST /calendar/unsubscribe
    async unsubscribe(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { eventId } = req.body;

            if (!eventId) {
                return res.status(400).json({ success: false, error: 'Event ID is required' });
            }

            const success = await CalendarSubscriptionModel.unsubscribe(userId, eventId);
            res.json({ success, message: success ? 'Unsubscribed successfully' : 'Subscription not found' });
        } catch (error) {
            console.error('Error unsubscribing from event:', error);
            res.status(500).json({ success: false, error: 'Failed to unsubscribe from event' });
        }
    },

    // GET /calendar/subscriptions
    async getSubscriptions(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const subscriptions = await CalendarSubscriptionModel.getUserSubscriptions(userId);
            res.json({ success: true, data: subscriptions });
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
        }
    },

    // POST /calendar/sync-skus
    async syncSKUs(req: Request, res: Response) {
        try {
            // Call the service to sync SKUs with release dates to calendar events
            await EventNotificationService.syncSKUsToCalendar();
            res.json({ success: true, message: 'Sync completed successfully' });
        } catch (error) {
            console.error('Error syncing SKUs to calendar:', error);
            res.status(500).json({ success: false, error: 'Failed to sync SKUs' });
        }
    }
};
