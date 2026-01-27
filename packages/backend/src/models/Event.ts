import { db } from '../database/connection';
import { Event, EventType, SocialLink } from '@vangarments/shared/types';

interface ContactInfo {
    email?: string;
    phone?: string;
    address?: string;
}

interface LogoMetadata {
    url: string;
    name?: string;
}

interface BannerItem {
    url: string;
    positionY?: number;
}

export class EventModel {
    static async create(data: {
        name: string;
        slug: string;
        eventType: EventType;
        masterLogo?: string;
        logoMetadata?: LogoMetadata[];
        banner?: string;
        banners?: BannerItem[];
        primaryColor?: string;
        secondaryColor?: string;
        venueName?: string;
        venueAddress?: string;
        venueCity?: string;
        venueCountry?: string;
        startDate?: string;
        endDate?: string;
        organizerName?: string;
        organizerId?: string;
        website?: string;
        description?: string;
        contactInfo?: ContactInfo;
        socialLinks?: SocialLink[];
        isRecurring?: boolean;
        recurrencePattern?: 'yearly' | 'biannual' | 'quarterly';
    }): Promise<Event> {
        const query = `
            INSERT INTO events (
                name, slug, event_type, master_logo, logo_metadata, banner, banners,
                primary_color, secondary_color, venue_name, venue_address, venue_city,
                venue_country, start_date, end_date, organizer_name, organizer_id,
                website, description, contact_info, social_links, is_recurring, recurrence_pattern
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *
        `;
        const values = [
            data.name, data.slug, data.eventType, data.masterLogo,
            JSON.stringify(data.logoMetadata || []),
            data.banner, JSON.stringify(data.banners || []),
            data.primaryColor, data.secondaryColor, data.venueName, data.venueAddress,
            data.venueCity, data.venueCountry, data.startDate, data.endDate,
            data.organizerName, data.organizerId, data.website, data.description,
            JSON.stringify(data.contactInfo || {}), JSON.stringify(data.socialLinks || []),
            data.isRecurring || false, data.recurrencePattern
        ];
        const { rows } = await db.query(query, values);
        return this.mapRowToEvent(rows[0]);
    }

    static async findById(id: string): Promise<Event | null> {
        const { rows } = await db.query('SELECT * FROM events WHERE id = $1 AND deleted_at IS NULL', [id]);
        if (rows.length === 0) return null;
        return this.mapRowToEvent(rows[0]);
    }

    static async findBySlug(slug: string): Promise<Event | null> {
        const { rows } = await db.query('SELECT * FROM events WHERE slug = $1 AND deleted_at IS NULL', [slug]);
        if (rows.length === 0) return null;
        return this.mapRowToEvent(rows[0]);
    }

    static async findMany(filters: { eventType?: EventType; search?: string; city?: string; country?: string } = {}): Promise<Event[]> {
        let query = 'SELECT * FROM events WHERE deleted_at IS NULL';
        const values: any[] = [];

        if (filters.eventType) {
            values.push(filters.eventType);
            query += ` AND event_type = $${values.length}`;
        }

        if (filters.search) {
            values.push(`%${filters.search}%`);
            query += ` AND (name ILIKE $${values.length} OR description ILIKE $${values.length})`;
        }

        if (filters.city) {
            values.push(filters.city);
            query += ` AND venue_city = $${values.length}`;
        }

        if (filters.country) {
            values.push(filters.country);
            query += ` AND venue_country = $${values.length}`;
        }

        query += ' ORDER BY start_date DESC, name ASC';
        const { rows } = await db.query(query, values);
        return rows.map(row => this.mapRowToEvent(row));
    }

    static async update(id: string, data: Partial<Event & { logoMetadata?: LogoMetadata[] }>): Promise<Event | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (data.name) { fields.push(`name = $${i++}`); values.push(data.name); }
        if (data.slug) { fields.push(`slug = $${i++}`); values.push(data.slug); }
        if (data.eventType) { fields.push(`event_type = $${i++}`); values.push(data.eventType); }
        if (data.masterLogo !== undefined) { fields.push(`master_logo = $${i++}`); values.push(data.masterLogo); }
        if (data.logoMetadata !== undefined) { fields.push(`logo_metadata = $${i++}`); values.push(JSON.stringify(data.logoMetadata)); }
        if (data.banner !== undefined) { fields.push(`banner = $${i++}`); values.push(data.banner); }
        if (data.banners !== undefined) { fields.push(`banners = $${i++}`); values.push(JSON.stringify(data.banners)); }
        if (data.primaryColor !== undefined) { fields.push(`primary_color = $${i++}`); values.push(data.primaryColor); }
        if (data.secondaryColor !== undefined) { fields.push(`secondary_color = $${i++}`); values.push(data.secondaryColor); }
        if (data.venueName !== undefined) { fields.push(`venue_name = $${i++}`); values.push(data.venueName); }
        if (data.venueAddress !== undefined) { fields.push(`venue_address = $${i++}`); values.push(data.venueAddress); }
        if (data.venueCity !== undefined) { fields.push(`venue_city = $${i++}`); values.push(data.venueCity); }
        if (data.venueCountry !== undefined) { fields.push(`venue_country = $${i++}`); values.push(data.venueCountry); }
        if (data.startDate !== undefined) { fields.push(`start_date = $${i++}`); values.push(data.startDate); }
        if (data.endDate !== undefined) { fields.push(`end_date = $${i++}`); values.push(data.endDate); }
        if (data.organizerName !== undefined) { fields.push(`organizer_name = $${i++}`); values.push(data.organizerName); }
        if (data.organizerId !== undefined) { fields.push(`organizer_id = $${i++}`); values.push(data.organizerId); }
        if (data.website !== undefined) { fields.push(`website = $${i++}`); values.push(data.website); }
        if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
        if (data.contactInfo !== undefined) { fields.push(`contact_info = $${i++}`); values.push(JSON.stringify(data.contactInfo)); }
        if (data.socialLinks !== undefined) { fields.push(`social_links = $${i++}`); values.push(JSON.stringify(data.socialLinks)); }
        if (data.isRecurring !== undefined) { fields.push(`is_recurring = $${i++}`); values.push(data.isRecurring); }
        if (data.recurrencePattern !== undefined) { fields.push(`recurrence_pattern = $${i++}`); values.push(data.recurrencePattern); }
        if (data.verificationStatus !== undefined) { fields.push(`verification_status = $${i++}`); values.push(data.verificationStatus); }

        if (fields.length === 0) return this.findById(id);

        values.push(id);
        const query = `
            UPDATE events 
            SET ${fields.join(', ')}, updated_at = NOW() 
            WHERE id = $${i} AND deleted_at IS NULL
            RETURNING *
        `;
        const { rows } = await db.query(query, values);
        if (rows.length === 0) return null;
        return this.mapRowToEvent(rows[0]);
    }

    static async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query('UPDATE events SET deleted_at = NOW() WHERE id = $1', [id]);
        return (rowCount || 0) > 0;
    }

    static mapRowToEvent(row: any): Event {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            eventType: row.event_type,
            masterLogo: row.master_logo,
            logoMetadata: row.logo_metadata || [],
            banner: row.banner,
            banners: row.banners || [],
            primaryColor: row.primary_color,
            secondaryColor: row.secondary_color,
            venueName: row.venue_name,
            venueAddress: row.venue_address,
            venueCity: row.venue_city,
            venueCountry: row.venue_country,
            startDate: row.start_date ? (typeof row.start_date === 'string' ? row.start_date : row.start_date.toISOString().split('T')[0]) : undefined,
            endDate: row.end_date ? (typeof row.end_date === 'string' ? row.end_date : row.end_date.toISOString().split('T')[0]) : undefined,
            organizerName: row.organizer_name,
            organizerId: row.organizer_id,
            website: row.website,
            description: row.description,
            contactInfo: row.contact_info || {},
            socialLinks: row.social_links || [],
            isRecurring: row.is_recurring,
            recurrencePattern: row.recurrence_pattern,
            verificationStatus: row.verification_status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
