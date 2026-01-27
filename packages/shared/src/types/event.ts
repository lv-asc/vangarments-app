// Event Types
import { SocialLink, LogoMetadata, BannerItem } from './sportOrg';

export type EventType =
    | 'runway_show'
    | 'fashion_week'
    | 'brand_sale'
    | 'conference'
    | 'pop_up'
    | 'exhibition';

export interface EventContactInfo {
    email?: string;
    phone?: string;
    address?: string;
}

export interface Event {
    id: string;
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
    contactInfo?: EventContactInfo;
    socialLinks?: SocialLink[];
    isRecurring?: boolean;
    recurrencePattern?: 'yearly' | 'biannual' | 'quarterly';
    verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
    createdAt: string;
    updatedAt: string;
}
