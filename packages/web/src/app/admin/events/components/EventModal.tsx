'use client';

import React, { useState } from 'react';
import { Event, EventType } from '@vangarments/shared/types';
import { EVENT_TYPES } from '@vangarments/shared/constants';
import { eventApi } from '@/lib/eventApi';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface EventModalProps {
    event?: Event;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EventModal({ event, onClose, onSuccess }: EventModalProps) {
    const [formData, setFormData] = useState<Partial<Event>>(event ? {
        ...event,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ''
    } : {
        name: '',
        slug: '',
        eventType: 'runway_show' as EventType,
        startDate: '',
        endDate: '',
        venueName: '',
        venueCity: '',
        venueAddress: '',
        website: '',
        description: '',
        banner: '',
        masterLogo: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate as string).toISOString() : undefined,
                endDate: formData.endDate ? new Date(formData.endDate as string).toISOString() : undefined
            };

            if (event) {
                await eventApi.updateEvent(event.id, payload);
                toast.success('Event updated');
            } else {
                await eventApi.createEvent(payload);
                toast.success('Event created');
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to save event', error);
            toast.error('Failed to save event');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (name: string) => {
        // Only auto-generate slug for new events or if slug is empty
        if (!event) {
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, name, slug }));
        } else {
            setFormData(prev => ({ ...prev, name }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">{event ? 'Edit Event' : 'New Event'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Event Name *</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Paris Fashion Week 2026"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Slug *</label>
                            <div className="flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    /events/
                                </span>
                                <input
                                    required
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    className="flex-1 min-w-0 block w-full px-4 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Type *</label>
                            <select
                                required
                                value={formData.eventType}
                                onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value as EventType }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {EVENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
                            <input
                                type="url"
                                value={formData.website || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Start Date *</label>
                            <input
                                required
                                type="datetime-local"
                                value={formData.startDate as string}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                            <input
                                type="datetime-local"
                                value={formData.endDate as string}
                                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-1 mt-2 mb-3">Venue Details</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Venue Name</label>
                            <input
                                type="text"
                                value={formData.venueName || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Grand Palais"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                value={formData.venueCity || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, venueCity: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Paris"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                            <input
                                type="text"
                                value={formData.venueAddress || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 3 Avenue du Général Eisenhower, 75008 Paris"
                            />
                        </div>

                        <div className="col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 border-b pb-1 mt-2 mb-3">Branding</h3>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Banner Image URL</label>
                            <input
                                type="url"
                                value={formData.banner || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, banner: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Logo URL</label>
                            <input
                                type="url"
                                value={formData.masterLogo || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, masterLogo: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                                placeholder="Event description..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (event ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
