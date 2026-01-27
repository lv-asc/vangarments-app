import { Request, Response } from 'express';
import { EventModel } from '../models/Event';
import { EventService } from '../services/eventService';

export class EventController {
    // Events CRUD
    static async listEvents(req: Request, res: Response) {
        try {
            const { eventType, search, city, country } = req.query;
            const events = await EventModel.findMany({
                eventType: eventType as any,
                search: search as string,
                city: city as string,
                country: country as string
            });
            res.json(events);
        } catch (error) {
            console.error('Failed to list events:', error);
            res.status(500).json({ error: 'Failed to list events' });
        }
    }

    static async createEvent(req: Request, res: Response) {
        try {
            const event = await EventModel.create(req.body);
            res.status(201).json(event);
        } catch (error) {
            console.error('Failed to create event:', error);
            res.status(500).json({ error: 'Failed to create event' });
        }
    }

    static async getEvent(req: Request, res: Response) {
        try {
            const event = await EventService.getFullDetails(req.params.id);
            if (!event) return res.status(404).json({ error: 'Event not found' });
            res.json(event);
        } catch (error) {
            console.error('Failed to fetch event:', error);
            res.status(500).json({ error: 'Failed to fetch event' });
        }
    }

    static async updateEvent(req: Request, res: Response) {
        try {
            const event = await EventModel.update(req.params.id, req.body);
            if (!event) return res.status(404).json({ error: 'Event not found' });
            res.json(event);
        } catch (error) {
            console.error('Failed to update event:', error);
            res.status(500).json({ error: 'Failed to update event' });
        }
    }

    static async deleteEvent(req: Request, res: Response) {
        try {
            const success = await EventModel.delete(req.params.id);
            res.json({ success });
        } catch (error) {
            console.error('Failed to delete event:', error);
            res.status(500).json({ error: 'Failed to delete event' });
        }
    }
}
