import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { UserModel } from '../models/User';
import { CalendarEventModel } from '../models/CalendarEvent';

export class AppleCalendarController {
    /**
     * Get Apple Calendar connection status
     */
    static async getConnectionStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const user = await UserModel.findById(userId);
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });

            const appleData = user.appleData as any;
            // Check for calendar credentials, not just Apple ID (which is for OAuth)
            const connected = !!(appleData?.calendarEmail && appleData?.calendarAppPassword);

            res.json({
                success: true,
                data: {
                    connected,
                    email: appleData?.calendarEmail || appleData?.email || null,
                },
            });
        } catch (error) {
            console.error('Error checking Apple Calendar status:', error);
            res.status(500).json({ success: false, error: 'Failed to check connection status' });
        }
    }

    /**
     * Connect Apple Calendar (save credentials)
     */
    static async connectCalendar(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { email, appPassword } = req.body;

            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
            if (!email || !appPassword) return res.status(400).json({ success: false, error: 'Email and App-Specific Password are required' });

            // In a real app, we should validate the credentials by making a lightweight CalDAV request
            // For now, we'll just save them
            const user = await UserModel.findById(userId);
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });

            const appleData = {
                ...(user.appleData || {}),
                calendarEmail: email,
                calendarAppPassword: appPassword, // Note: In production, this should be encrypted
            };

            await UserModel.update(userId, { appleData });

            res.json({ success: true, message: 'Apple Calendar connected successfully' });
        } catch (error) {
            console.error('Error connecting Apple Calendar:', error);
            res.status(500).json({ success: false, error: 'Failed to connect Apple Calendar' });
        }
    }

    /**
     * Add event to Apple Calendar via CalDAV
     */
    /**
     * Add event to Apple Calendar via CalDAV (or ICS download)
     */
    static async addEventToAppleCalendar(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { eventId, eventDetails } = req.body;

            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            // 1. Get event details
            let title, description, startDate, endDate, location, isAllDay;
            if (eventDetails) {
                ({ title, description, startDate, endDate, location } = eventDetails);
                isAllDay = !eventDetails.startTime;
            } else {
                const event = await CalendarEventModel.findById(eventId);
                if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
                title = event.title;
                description = event.description;
                startDate = event.eventDate;
                endDate = event.endDate || event.eventDate;
                location = event.location;
                isAllDay = !event.eventTime;
            }

            // 2. Format as iCalendar (ICS)
            const icsContent = AppleCalendarController.generateICS({
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                location,
                isAllDay
            });

            // 3. Return ICS content
            res.json({
                success: true,
                data: {
                    icsContent,
                    filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
                }
            });

        } catch (error) {
            console.error('Error adding event to Apple Calendar:', error);
            res.status(500).json({ success: false, error: 'Failed to generate Apple Calendar event' });
        }
    }

    /**
     * Generate ICS content for an event
     */
    private static generateICS(data: {
        title: string;
        description?: string;
        startDate: Date;
        endDate: Date;
        location?: string;
        isAllDay?: boolean;
    }) {
        const { title, description, startDate, endDate, location, isAllDay } = data;

        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const startStr = isAllDay
            ? startDate.toISOString().split('T')[0].replace(/-/g, '')
            : startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endStr = isAllDay
            ? new Date(endDate.getTime() + 86400000).toISOString().split('T')[0].replace(/-/g, '')
            : endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Vangarments//NONSGML v1.0//EN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@vangarments.com`,
            `DTSTAMP:${timestamp}`,
            isAllDay ? `DTSTART;VALUE=DATE:${startStr}` : `DTSTART:${startStr}`,
            isAllDay ? `DTEND;VALUE=DATE:${endStr}` : `DTEND:${endStr}`,
            `SUMMARY:${title}`,
            description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
            location ? `LOCATION:${location}` : '',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(line => line !== '').join('\r\n');

        return ics;
    }
}

export const appleCalendarController = {
    getConnectionStatus: AppleCalendarController.getConnectionStatus.bind(AppleCalendarController),
    connectCalendar: AppleCalendarController.connectCalendar.bind(AppleCalendarController),
    addEventToAppleCalendar: AppleCalendarController.addEventToAppleCalendar.bind(AppleCalendarController),
};
