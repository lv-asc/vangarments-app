'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    CalendarDaysIcon,
    MapPinIcon,
    GlobeAltIcon,
    EnvelopeIcon,
    PhoneIcon,
    ArrowTopRightOnSquareIcon,
    ClockIcon,
    ArrowPathIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { Event, EventType } from '@vangarments/shared/types';
import { useRecentVisits } from '@/hooks/useRecentVisits';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EventProfileClientProps {
    slug: string;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
    runway_show: 'Runway Show',
    fashion_week: 'Fashion Week',
    brand_sale: 'Brand Sale',
    conference: 'Conference',
    pop_up: 'Pop-Up',
    exhibition: 'Exhibition',
};

const RECURRENCE_LABELS: Record<string, string> = {
    yearly: 'Annual Event',
    biannual: 'Biannual Event',
    quarterly: 'Quarterly Event',
};

async function fetchEvent(slug: string): Promise<Event> {
    const response = await fetch(`${API_URL}/api/events/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch event');
    return response.json();
}

async function followEvent(eventId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/social/follows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ entityId: eventId, entityType: 'event' })
    });
    if (!response.ok) throw new Error('Failed to follow event');
}

async function unfollowEvent(eventId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/social/follows`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ entityId: eventId, entityType: 'event' })
    });
    if (!response.ok) throw new Error('Failed to unfollow event');
}

async function checkFollowStatus(eventId: string, token: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/api/social/follows/check?entityId=${eventId}&entityType=event`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.isFollowing;
}

export default function EventProfileClient({ slug }: EventProfileClientProps) {
    const router = useRouter();
    const { addVisit } = useRecentVisits();
    const { user, token } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (slug) {
            loadEvent();
        }
    }, [slug]);

    useEffect(() => {
        if (event && token) {
            checkFollowStatus(event.id, token).then(setIsFollowing);
        }
    }, [event, token]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const data = await fetchEvent(slug);

            if (!data) {
                setError('Event not found');
                return;
            }

            setEvent(data);

            // Add to recent visits
            addVisit({
                id: data.id,
                name: data.name,
                logo: data.masterLogo,
                businessType: 'event' as any,
                type: 'event' as any,
                slug: data.slug || slug,
                verificationStatus: data.verificationStatus || 'unverified'
            });

            document.title = `Event - ${data.name}`;

        } catch (err: any) {
            console.error('Failed to load event:', err);
            setError(err.message || 'Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = useCallback(async () => {
        if (!event || !token) {
            toast.error('Please sign in to follow events');
            return;
        }

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowEvent(event.id, token);
                setIsFollowing(false);
                toast.success('Unfollowed event');
            } else {
                await followEvent(event.id, token);
                setIsFollowing(true);
                toast.success('Following event');
            }
        } catch (err) {
            toast.error('Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    }, [event, token, isFollowing]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'TBA';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
                    <p className="text-gray-600 mb-4">{error || 'The event could not be loaded.'}</p>
                    <Link href="/events" className="text-blue-600 hover:underline">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Banner */}
            <div
                className="h-64 bg-gradient-to-br from-gray-200 to-gray-100 relative"
                style={event.banner ? { backgroundImage: `url(${event.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                <div className="absolute inset-0 bg-black/20"></div>
                {event.primaryColor && (
                    <div
                        className="absolute inset-0 opacity-50"
                        style={{ background: `linear-gradient(135deg, ${event.primaryColor} 0%, ${event.secondaryColor || event.primaryColor} 100%)` }}
                    ></div>
                )}
            </div>

            {/* Profile Header */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Logo */}
                        <div className="w-32 h-32 bg-gray-50 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {event.masterLogo ? (
                                <img src={event.masterLogo} alt={event.name} className="w-full h-full object-contain p-3" />
                            ) : (
                                <CalendarDaysIcon className="h-16 w-16 text-gray-300" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-full">
                                            {EVENT_TYPE_LABELS[event.eventType]}
                                        </span>
                                        {event.verificationStatus === 'verified' && (
                                            <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                                        )}
                                        {event.isRecurring && event.recurrencePattern && (
                                            <span className="flex items-center gap-1 text-gray-400 text-xs">
                                                <ArrowPathIcon className="h-4 w-4" />
                                                {RECURRENCE_LABELS[event.recurrencePattern]}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl font-black text-gray-900 uppercase italic mb-2">
                                        {event.name}
                                    </h1>
                                    {event.organizerName && (
                                        <p className="text-gray-500">
                                            Organized by <span className="font-semibold">{event.organizerName}</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                    className={`px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-all ${isFollowing
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        } ${followLoading ? 'opacity-50' : ''}`}
                                >
                                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-6 mt-6 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <ClockIcon className="h-5 w-5" />
                                    <span>
                                        {formatDate(event.startDate)}
                                        {event.endDate && event.endDate !== event.startDate && (
                                            <> — {formatDate(event.endDate)}</>
                                        )}
                                    </span>
                                </div>
                                {(event.venueCity || event.venueCountry) && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPinIcon className="h-5 w-5" />
                                        <span>
                                            {[event.venueName, event.venueCity, event.venueCountry].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                                {event.website && (
                                    <a
                                        href={event.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                                    >
                                        <GlobeAltIcon className="h-5 w-5" />
                                        <span>Visit Website</span>
                                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description & Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {event.description && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-black text-gray-900 uppercase mb-4">About</h2>
                                <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                            </div>
                        )}

                        {event.venueAddress && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-black text-gray-900 uppercase mb-4">Venue</h2>
                                <div className="flex items-start gap-3">
                                    <MapPinIcon className="h-6 w-6 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        {event.venueName && <p className="font-semibold text-gray-900">{event.venueName}</p>}
                                        <p className="text-gray-600">{event.venueAddress}</p>
                                        <p className="text-gray-500">
                                            {[event.venueCity, event.venueCountry].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        {(event.contactInfo?.email || event.contactInfo?.phone) && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-black text-gray-900 uppercase mb-4">Contact</h2>
                                <div className="space-y-3">
                                    {event.contactInfo.email && (
                                        <a
                                            href={`mailto:${event.contactInfo.email}`}
                                            className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                                        >
                                            <EnvelopeIcon className="h-5 w-5" />
                                            <span>{event.contactInfo.email}</span>
                                        </a>
                                    )}
                                    {event.contactInfo.phone && (
                                        <a
                                            href={`tel:${event.contactInfo.phone}`}
                                            className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                                        >
                                            <PhoneIcon className="h-5 w-5" />
                                            <span>{event.contactInfo.phone}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Social Links */}
                        {event.socialLinks && event.socialLinks.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                <h2 className="text-lg font-black text-gray-900 uppercase mb-4">Social</h2>
                                <div className="flex flex-wrap gap-2">
                                    {event.socialLinks.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors capitalize"
                                        >
                                            {link.platform}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-24"></div>
        </div>
    );
}
