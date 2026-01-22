import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { UserModel } from '../models/User';
import { CalendarEventModel } from '../models/CalendarEvent';

interface GoogleCalendarEvent {
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    location?: string;
    source?: {
        title: string;
        url: string;
    };
}

export class GoogleCalendarController {
    /**
     * Refresh Google access token using refresh token
     */
    private static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.GOOGLE_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }),
            });

            const data = await response.json();

            if (data.access_token) {
                return {
                    accessToken: data.access_token,
                    expiresIn: data.expires_in || 3600,
                };
            }

            console.error('Failed to refresh Google token:', data);
            return null;
        } catch (error) {
            console.error('Error refreshing Google token:', error);
            return null;
        }
    }

    /**
     * Get valid access token (refresh if expired)
     */
    private static async getValidAccessToken(user: any): Promise<string | null> {
        const googleData = user.googleData;

        if (!googleData?.calendarRefreshToken) {
            return null;
        }

        // Check if token is expired or will expire in the next 5 minutes
        const tokenExpiry = googleData.calendarTokenExpiry ? new Date(googleData.calendarTokenExpiry) : null;
        const isExpired = !tokenExpiry || tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000;

        if (isExpired) {
            // Refresh the token
            const refreshResult = await this.refreshAccessToken(googleData.calendarRefreshToken);

            if (refreshResult) {
                // Update user with new token
                const newGoogleData = {
                    ...googleData,
                    calendarAccessToken: refreshResult.accessToken,
                    calendarTokenExpiry: new Date(Date.now() + refreshResult.expiresIn * 1000).toISOString(),
                };

                await UserModel.update(user.id, { googleData: newGoogleData });
                return refreshResult.accessToken;
            }

            return null;
        }

        return googleData.calendarAccessToken;
    }

    /**
     * Check if user has Google Calendar connected
     */
    static async getConnectionStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const googleData = user.googleData as any;
            const hasCalendarAccess = !!(googleData?.calendarRefreshToken);

            res.json({
                success: true,
                data: {
                    connected: hasCalendarAccess,
                    email: googleData?.email || null,
                },
            });
        } catch (error) {
            console.error('Error checking Google Calendar status:', error);
            res.status(500).json({ success: false, error: 'Failed to check connection status' });
        }
    }

    /**
     * Add a Vangarments calendar event to user's Google Calendar
     */
    static async addEventToGoogleCalendar(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { eventId } = req.body;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            if (!eventId) {
                return res.status(400).json({ success: false, error: 'Event ID is required' });
            }

            // Get user and validate Google Calendar access
            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const accessToken = await GoogleCalendarController.getValidAccessToken(user);

            if (!accessToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Google Calendar not connected',
                    code: 'CALENDAR_NOT_CONNECTED',
                });
            }

            // Get the Vangarments event
            const event = await CalendarEventModel.findById(eventId);

            if (!event) {
                return res.status(404).json({ success: false, error: 'Event not found' });
            }

            // Format event for Google Calendar
            const eventDate = new Date(event.eventDate);
            const hasTime = !!event.eventTime;

            let startDateTime: string;
            let endDateTime: string;

            if (hasTime) {
                // Parse time (expected format: "HH:mm" or "HH:mm:ss")
                const [hours, minutes] = event.eventTime!.split(':').map(Number);
                eventDate.setHours(hours, minutes, 0, 0);
                startDateTime = eventDate.toISOString();

                // Default to 2 hours duration if no end date
                const endDate = event.endDate ? new Date(event.endDate) : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
                endDateTime = endDate.toISOString();
            } else {
                // All-day event
                startDateTime = eventDate.toISOString().split('T')[0];
                const endDate = event.endDate ? new Date(event.endDate) : new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
                endDateTime = endDate.toISOString().split('T')[0];
            }

            // Build description with event details
            let description = event.description || '';

            if (event.brand) {
                description += `\n\nBrand: ${event.brand.brand_name || event.brand.name}`;
            }

            if (event.externalUrl) {
                description += `\n\nMore info: ${event.externalUrl}`;
            }

            description += `\n\n—\nAdded from Vangarments Calendar`;

            const googleEvent: GoogleCalendarEvent = {
                summary: event.title,
                description: description.trim(),
                start: hasTime
                    ? { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' }
                    : { date: startDateTime },
                end: hasTime
                    ? { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' }
                    : { date: endDateTime },
                location: event.location,
                source: {
                    title: 'Vangarments Calendar',
                    url: `${process.env.FRONTEND_URL}/calendar`,
                },
            };

            // Create event in Google Calendar
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(googleEvent),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Google Calendar API error:', result);
                return res.status(response.status).json({
                    success: false,
                    error: result.error?.message || 'Failed to add event to Google Calendar',
                });
            }

            res.json({
                success: true,
                data: {
                    googleEventId: result.id,
                    googleEventUrl: result.htmlLink,
                    message: 'Event added to Google Calendar successfully',
                },
            });
        } catch (error) {
            console.error('Error adding event to Google Calendar:', error);
            res.status(500).json({ success: false, error: 'Failed to add event to Google Calendar' });
        }
    }

    /**
     * Generate Google Calendar URL (fallback for users without connected accounts)
     */
    static generateGoogleCalendarUrl(req: AuthenticatedRequest, res: Response) {
        try {
            const { title, description, startDate, endDate, location, eventTime } = req.query;

            if (!title || !startDate) {
                return res.status(400).json({ success: false, error: 'Title and start date are required' });
            }

            // Format dates for Google Calendar URL
            const start = new Date(startDate as string);
            const end = endDate ? new Date(endDate as string) : new Date(start.getTime() + 24 * 60 * 60 * 1000);

            let dateFormat: string;

            if (eventTime) {
                // Event with specific time
                const [hours, minutes] = (eventTime as string).split(':').map(Number);
                start.setHours(hours, minutes, 0, 0);

                // If no end date provided, default to 2 hours
                if (!endDate) {
                    end.setTime(start.getTime() + 2 * 60 * 60 * 1000);
                }

                dateFormat = `${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
            } else {
                // All-day event
                const startStr = start.toISOString().split('T')[0].replace(/-/g, '');
                const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
                dateFormat = `${startStr}/${endStr}`;
            }

            const params = new URLSearchParams({
                action: 'TEMPLATE',
                text: title as string,
                dates: dateFormat,
            });

            if (description) {
                params.append('details', description as string);
            }

            if (location) {
                params.append('location', location as string);
            }

            const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;

            res.json({
                success: true,
                data: {
                    url: googleCalendarUrl,
                },
            });
        } catch (error) {
            console.error('Error generating Google Calendar URL:', error);
            res.status(500).json({ success: false, error: 'Failed to generate Google Calendar URL' });
        }
    }
}

export const googleCalendarController = {
    getConnectionStatus: GoogleCalendarController.getConnectionStatus.bind(GoogleCalendarController),
    addEventToGoogleCalendar: GoogleCalendarController.addEventToGoogleCalendar.bind(GoogleCalendarController),
    generateGoogleCalendarUrl: GoogleCalendarController.generateGoogleCalendarUrl.bind(GoogleCalendarController),
};
