import { CalendarSubscriptionModel } from '../models/CalendarSubscription';
import { NotificationModel } from '../models/Notification';
import { db } from '../database/connection';

export class EventNotificationService {
    /**
     * Checks for upcoming events and sends notifications to subscribed users.
     * This should be called by a cron job or a periodic interval.
     */
    static async processReminders() {
        console.log('[EventNotificationService] Processing event reminders...');

        try {
            // 1. Get events starting in ~1 hour (that haven't had 1h reminder sent)
            // 2. Get events starting in ~24 hours (that haven't had 24h reminder sent)

            const query = `
        SELECT 
          s.id as subscription_id,
          s.user_id,
          s.event_id,
          e.title as event_title,
          e.event_date,
          e.event_time,
          s.remind_at_1h,
          s.remind_at_24h
        FROM calendar_event_subscriptions s
        JOIN calendar_events e ON s.event_id = e.id
        WHERE e.is_published = true
        AND (
          -- 24h reminder: event is tomorrow
          (s.remind_at_24h = true AND e.event_date = CURRENT_DATE + INTERVAL '1 day')
          OR
          -- 1h reminder: event is today and time is close (simplified logic)
          (s.remind_at_1h = true AND e.event_date = CURRENT_DATE)
        )
      `;

            const result = await db.query(query);

            for (const row of result.rows) {
                // Create notification
                await NotificationModel.create({
                    userId: row.user_id,
                    type: 'calendar_reminder',
                    title: `Upcoming Event: ${row.event_title}`,
                    message: `The event "${row.event_title}" is starting soon! Check the details in your calendar.`,
                    link: `/calendar/event/${row.event_id}`,
                    entityId: row.event_id,
                    metadata: {
                        eventType: 'calendar_reminder',
                        eventId: row.event_id,
                        eventTitle: row.event_title
                    }
                });

                // Update subscription to prevent duplicate reminders (simplified)
                // In a real system, we'd have columns like last_reminded_at
            }

            console.log(`[EventNotificationService] Sent ${result.rows.length} reminders.`);
        } catch (error) {
            console.error('[EventNotificationService] Error processing reminders:', error);
        }
    }

    /**
     * Auto-sync SKUs to Calendar events
     */
    static async syncSKUsToCalendar() {
        console.log('[EventNotificationService] Syncing SKUs to calendar...');
        try {
            const query = `
        INSERT INTO calendar_events (
          event_type, title, description, event_date, sku_item_id, brand_id, is_published, created_at
        )
        SELECT 
          'item_launch',
          name,
          description,
          release_date,
          id,
          brand_id,
          true,
          NOW()
        FROM sku_items
        WHERE release_date IS NOT NULL
        AND id NOT IN (SELECT sku_item_id FROM calendar_events WHERE sku_item_id IS NOT NULL)
        ON CONFLICT DO NOTHING
      `;
            const result = await db.query(query);
            console.log(`[EventNotificationService] Created ${result.rowCount} calendar events from SKUs.`);
        } catch (error) {
            console.error('[EventNotificationService] Error syncing SKUs:', error);
        }
    }
}
