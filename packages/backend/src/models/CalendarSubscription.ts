import { db } from '../database/connection';

export interface CalendarSubscription {
    id: string;
    userId: string;
    eventId: string;
    remindAt1h: boolean;
    remindAt24h: boolean;
    createdAt: Date;
}

export interface CreateCalendarSubscriptionData {
    userId: string;
    eventId: string;
    remindAt1h?: boolean;
    remindAt24h?: boolean;
}

export const CalendarSubscriptionModel = {
    async subscribe(data: CreateCalendarSubscriptionData): Promise<CalendarSubscription> {
        const query = `
      INSERT INTO calendar_event_subscriptions (user_id, event_id, remind_at_1h, remind_at_24h)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, event_id) DO UPDATE SET
        remind_at_1h = EXCLUDED.remind_at_1h,
        remind_at_24h = EXCLUDED.remind_at_24h
      RETURNING 
        id, 
        user_id as "userId", 
        event_id as "eventId", 
        remind_at_1h as "remindAt1h", 
        remind_at_24h as "remindAt24h", 
        created_at as "createdAt"
    `;
        const values = [
            data.userId,
            data.eventId,
            data.remindAt1h ?? true,
            data.remindAt24h ?? true
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    async unsubscribe(userId: string, eventId: string): Promise<boolean> {
        const query = `
      DELETE FROM calendar_event_subscriptions
      WHERE user_id = $1 AND event_id = $2
    `;
        const result = await db.query(query, [userId, eventId]);
        return (result.rowCount || 0) > 0;
    },

    async isSubscribed(userId: string, eventId: string): Promise<boolean> {
        const query = `
      SELECT 1 FROM calendar_event_subscriptions
      WHERE user_id = $1 AND event_id = $2
    `;
        const result = await db.query(query, [userId, eventId]);
        return result.rows.length > 0;
    },

    async getUserSubscriptions(userId: string): Promise<string[]> {
        const query = `
      SELECT event_id FROM calendar_event_subscriptions
      WHERE user_id = $1
    `;
        const result = await db.query(query, [userId]);
        return result.rows.map(row => row.event_id);
    },

    async getUpcomingReminders(thresholdMinutes: number): Promise<any[]> {
        // This will be used by the notification service
        const query = `
      SELECT 
        s.user_id, 
        s.event_id, 
        e.title as event_title, 
        e.event_date, 
        e.event_time,
        s.remind_at_1h,
        s.remind_at_24h
      FROM calendar_event_subscriptions s
      JOIN calendar_events e ON s.event_id = e.id
      WHERE e.event_date = CURRENT_DATE
      -- Logic for actual time-based reminders would go here
    `;
        // For now returning empty as we'll refine the logic in the service
        return [];
    }
};
