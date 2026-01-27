'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, MapPinIcon, BuildingOfficeIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Event, EventType } from '@vangarments/shared/types';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
    runway_show: 'Runway Show',
    fashion_week: 'Fashion Week',
    brand_sale: 'Brand Sale',
    conference: 'Conference',
    pop_up: 'Pop-Up',
    exhibition: 'Exhibition',
};

const EVENT_TYPE_COLORS: Record<EventType, { bg: string; text: string }> = {
    runway_show: { bg: 'bg-purple-50', text: 'text-purple-600' },
    fashion_week: { bg: 'bg-blue-50', text: 'text-blue-600' },
    brand_sale: { bg: 'bg-green-50', text: 'text-green-600' },
    conference: { bg: 'bg-orange-50', text: 'text-orange-600' },
    pop_up: { bg: 'bg-pink-50', text: 'text-pink-600' },
    exhibition: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
};

async function fetchEvents(eventType?: EventType): Promise<Event[]> {
    const url = eventType
        ? `${API_URL}/api/events?eventType=${eventType}`
        : `${API_URL}/api/events`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
}

export default function EventsBrowseClient() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

    useEffect(() => {
        fetchData();
    }, [activeFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await fetchEvents(activeFilter === 'all' ? undefined : activeFilter);
            setEvents(data);
        } catch (error) {
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const filterTabs: { id: EventType | 'all'; label: string }[] = [
        { id: 'all', label: 'All Events' },
        { id: 'fashion_week', label: 'Fashion Weeks' },
        { id: 'runway_show', label: 'Runway Shows' },
        { id: 'brand_sale', label: 'Brand Sales' },
        { id: 'conference', label: 'Conferences' },
        { id: 'pop_up', label: 'Pop-Ups' },
        { id: 'exhibition', label: 'Exhibitions' },
    ];

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'TBA';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-100 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter italic">
                            Fashion Events
                        </h1>
                        <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                            Discover runway shows, fashion weeks, brand sales, conferences, and exclusive pop-ups from around the world.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Filter Tabs */}
                <div className="flex justify-center mb-12 overflow-x-auto">
                    <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
                        {filterTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === tab.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-72 bg-gray-200 rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map(event => {
                            const colors = EVENT_TYPE_COLORS[event.eventType];
                            return (
                                <Link
                                    key={event.id}
                                    href={`/events/${event.slug}`}
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    {/* Banner */}
                                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                                        {event.banner ? (
                                            <img
                                                src={event.banner}
                                                alt={event.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <CalendarDaysIcon className="h-16 w-16 text-gray-200" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-3 py-1 ${colors.bg} ${colors.text} text-[10px] font-black uppercase tracking-widest rounded-full`}>
                                                {EVENT_TYPE_LABELS[event.eventType]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="h-14 w-14 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border flex-shrink-0">
                                                {event.masterLogo ? (
                                                    <img src={event.masterLogo} alt={event.name} className="h-full w-full object-contain p-2" />
                                                ) : (
                                                    <CalendarDaysIcon className="h-7 w-7 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors truncate">
                                                    {event.name}
                                                </h3>
                                                {event.organizerName && (
                                                    <p className="text-gray-400 text-xs uppercase tracking-wider truncate">
                                                        By {event.organizerName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                                                <span>
                                                    {formatDate(event.startDate)}
                                                    {event.endDate && event.endDate !== event.startDate && (
                                                        <> - {formatDate(event.endDate)}</>
                                                    )}
                                                </span>
                                            </div>
                                            {(event.venueCity || event.venueCountry) && (
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                                    <span>
                                                        {[event.venueCity, event.venueCountry].filter(Boolean).join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {event.description && (
                                            <p className="text-gray-400 text-sm line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {!loading && events.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                        <CalendarDaysIcon className="h-16 w-16 mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-2">No Events Found</h3>
                        <p className="text-gray-400">
                            {activeFilter === 'all'
                                ? 'Our events calendar is currently being populated. Check back soon.'
                                : `No ${EVENT_TYPE_LABELS[activeFilter as EventType]} events available at the moment.`
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
