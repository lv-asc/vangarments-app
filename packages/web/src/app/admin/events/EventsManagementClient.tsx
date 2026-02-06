'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { eventApi } from '@/lib/eventApi';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    TrashIcon,
    CalendarDaysIcon as CalendarDaysIconSolid,
} from '@heroicons/react/20/solid';
import {
    CalendarDaysIcon,
    MapPinIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { EVENT_TYPES } from '@vangarments/shared/constants/event';
import { Event, EventType } from '@vangarments/shared/types';
import EventModal from './components/EventModal';
import { Dialog } from '@headlessui/react'; // Assuming we have headlessui or use standard confirm

export default function EventsManagementClient() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<EventType | ''>('');

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

    useEffect(() => {
        if (!authLoading && (!user || !user.roles?.includes('admin'))) {
            router.push('/');
            return;
        }

        if (user?.roles?.includes('admin')) {
            fetchEvents();
        }
    }, [user, authLoading, router, selectedType]); // Re-fetch when type changes, manually fetch for search on enter

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventApi.listEvents({
                eventType: selectedType || undefined,
                search: searchTerm || undefined
            });
            setEvents(Array.isArray(response) ? response : (response as any).data || []);
        } catch (error) {
            console.error('Failed to fetch events', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

        try {
            await eventApi.deleteEvent(id);
            toast.success('Event deleted');
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const handleOpenModal = (event?: Event) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    if (authLoading || (loading && (!events || !events.length) && !searchTerm && !selectedType)) {
        // Show loading only on initial load or if we have no data at all
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
                        Events Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage global fashion events, weeks, and shows.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        New Event
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border p-2"
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as EventType | '')}
                        className="block rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border p-2 min-w-[200px]"
                    >
                        <option value="">All Event Types</option>
                        {EVENT_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => fetchEvents()}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {events && events.map((event) => (
                        <li key={event.id}>
                            <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50">
                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                    <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                                        {event.masterLogo ? (
                                            <img src={event.masterLogo} alt="" className="h-full w-full object-contain p-1" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-gray-300">
                                                <CalendarDaysIconSolid className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-base font-bold text-gray-900 truncate">{event.name}</p>
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 uppercase tracking-wide">
                                                {event.eventType?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <CalendarDaysIconSolid className="h-4 w-4 text-gray-400" />
                                                <span>
                                                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
                                                    {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
                                                </span>
                                            </div>
                                            {event.venueCity && (
                                                <div className="flex items-center gap-1">
                                                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                                                    <span>{event.venueCity}</span>
                                                </div>
                                            )}
                                            {event.website && (
                                                <div className="flex items-center gap-1">
                                                    <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                                                    <a href={event.website} target="_blank" rel="noreferrer" className="hover:text-purple-600 hover:underline">
                                                        Website
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-5 flex-shrink-0 flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenModal(event)}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                        title="Edit"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {(!events || events.length === 0) && (
                        <li className="px-4 py-12 text-center text-gray-500">
                            <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <p>No events found. Create one to get started.</p>
                        </li>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <EventModal
                    event={editingEvent}
                    onClose={() => { setIsModalOpen(false); setEditingEvent(undefined); }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setEditingEvent(undefined);
                        fetchEvents();
                    }}
                />
            )}
        </div>
    );
}
