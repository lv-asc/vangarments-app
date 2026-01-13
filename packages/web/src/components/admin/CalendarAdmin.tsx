'use client';

import React, { useState, useEffect } from 'react';
import {
    CalendarDaysIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    XCircleIcon,
    FunnelIcon,
    XMarkIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { calendarApi, CalendarEvent, CalendarEventType, CalendarEventTypeRecord } from '@/lib/calendarApi';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import MediaUploader from './MediaUploader';
import { ImageTagEditor } from '@/components/tagging';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import SearchableCombobox from '../ui/Combobox';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export default function CalendarAdmin() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [filterType, setFilterType] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [eventTypes, setEventTypes] = useState<CalendarEventTypeRecord[]>([]);
    const [isTypeManagementOpen, setIsTypeManagementOpen] = useState(false);
    const [filterEntity, setFilterEntity] = useState<{ id: string; type: string; name: string } | null>(null);
    const [entitySearch, setEntitySearch] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: format(new Date(), 'yyyy-MM-dd'),
        eventType: 'item_launch' as CalendarEventType,
        isPublished: true,
        isFeatured: false,
        imageUrl: '',
        externalUrl: '',
        location: '',
        eventTime: '',
        images: [] as any[],
        videos: [] as any[],
        attachments: [] as any[],
        taggedEntities: [] as any[]
    });

    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [taggingModal, setTaggingModal] = useState<{ isOpen: boolean; imageUrl: string; eventId?: string }>({
        isOpen: false,
        imageUrl: ''
    });

    // Unified entity state
    const [allEntities, setAllEntities] = useState<any[]>([]);

    const vufsBrands = allEntities
        .filter(e => (e.entityType?.toLowerCase() || e.type?.toLowerCase()) === 'brand')
        .map(e => ({
            id: e.id,
            name: e.brandInfo?.name || e.name || 'Unknown Brand',
            image: e.brandInfo?.logo || e.logoUrl
        }));

    const vufsStores = allEntities
        .filter(e => (e.entityType?.toLowerCase() || e.type?.toLowerCase()) === 'store')
        .map(e => ({
            id: e.id,
            name: e.brandInfo?.name || e.name || 'Unknown Store',
            image: e.brandInfo?.logo || e.logoUrl
        }));

    const vufsSuppliers = allEntities
        .filter(e => (e.entityType?.toLowerCase() || e.type?.toLowerCase()) === 'supplier')
        .map(e => ({
            id: e.id,
            name: e.brandInfo?.name || e.name || 'Unknown Supplier',
            image: e.brandInfo?.logo || e.logoUrl
        }));

    const vufsUsers = allEntities
        .filter(e => (e.entityType?.toLowerCase() || e.type?.toLowerCase()) === 'user')
        .map(e => ({
            id: e.id,
            name: e.brandInfo?.name || e.name || 'Unknown User',
            image: e.brandInfo?.logo || e.logoUrl
        }));

    const vufsNonProfits = allEntities
        .filter(e => (e.entityType?.toLowerCase() || e.type?.toLowerCase()) === 'non_profit')
        .map(e => ({
            id: e.id,
            name: e.brandInfo?.name || e.name || 'Unknown Non-Profit',
            image: e.brandInfo?.logo || e.logoUrl
        }));

    const vufsPages = allEntities
        .filter(e => (e.entityType?.toLowerCase() || e.type?.toLowerCase()) === 'page')
        .map(e => ({
            id: e.id,
            name: e.brandInfo?.name || e.name || 'Unknown Page',
            image: e.brandInfo?.logo || e.logoUrl
        }));

    useEffect(() => {
        fetchAllEntities();
    }, []);

    const fetchAllEntities = async () => {
        try {
            const entities = await apiClient.getAllEntities();
            setAllEntities(entities || []);
        } catch (error) {
            console.error('Failed to fetch entities for tagging', error);
        }
    };

    useEffect(() => {
        fetchYears();
        fetchEvents();
        fetchEventTypes();
    }, [selectedYear, filterType, filterEntity]);

    const fetchEventTypes = async () => {
        try {
            const data = await calendarApi.getEventTypes();
            setEventTypes(data);
        } catch (error) {
            console.error('Error fetching event types:', error);
        }
    };

    const fetchYears = async () => {
        try {
            const data = await calendarApi.getAvailableYears();
            setYears(data);
        } catch (error) {
            console.error('Error fetching years:', error);
        }
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const data = await calendarApi.getEvents({
                year: selectedYear,
                type: (filterType || undefined) as any,
                entityId: filterEntity?.id,
                entityType: filterEntity?.type
            });
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncSKUs = async () => {
        setIsSyncing(true);
        try {
            const tokens = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            if (!tokens) throw new Error('No authentication token found');
            await calendarApi.syncSKUs(tokens);
            await fetchEvents();
            alert('Sync completed successfully!');
        } catch (error) {
            console.error('Error syncing SKUs:', error);
            alert('Failed to sync: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const tokens = Cookies.get('auth_token') || localStorage.getItem('auth_token') || '';
            await calendarApi.deleteEvent(id, tokens);
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const openModal = (event?: CalendarEvent) => {
        if (event) {
            setEditingEventId(event.id);
            setFormData({
                title: event.title,
                description: event.description || '',
                eventDate: format(new Date(event.eventDate), 'yyyy-MM-dd'),
                eventType: event.eventType,
                isPublished: event.isPublished,
                isFeatured: event.isFeatured,
                imageUrl: event.imageUrl || '',
                externalUrl: event.externalUrl || '',
                location: event.location || '',
                eventTime: event.eventTime || '',
                images: event.images || [],
                videos: event.videos || [],
                attachments: event.attachments || [],
                taggedEntities: event.taggedEntities || []
            });
        } else {
            setEditingEventId(null);
            setFormData({
                title: '',
                description: '',
                eventDate: format(new Date(), 'yyyy-MM-dd'),
                eventType: 'item_launch',
                isPublished: true,
                isFeatured: false,
                imageUrl: '',
                externalUrl: '',
                location: '',
                eventTime: '',
                images: [],
                videos: [],
                attachments: [],
                taggedEntities: []
            });
        }
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const tokens = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            if (!tokens) throw new Error('No authentication token found');

            if (editingEventId) {
                await calendarApi.updateEvent(editingEventId, formData as any, tokens);
                toast.success('Event updated successfully');
            } else {
                await calendarApi.createEvent(formData as any, tokens);
                toast.success('Event created successfully');
            }

            setIsModalOpen(false);
            await fetchEvents();
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTagImage = (imageUrl: string, index: number) => {
        setTaggingModal({
            isOpen: true,
            imageUrl,
            eventId: editingEventId || undefined
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const tokens = Cookies.get('auth_token') || localStorage.getItem('auth_token');
        if (!tokens) return;

        try {
            const uploadFormData = new FormData();
            for (let i = 0; i < files.length; i++) {
                uploadFormData.append('files', files[i]);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${tokens}`
                },
                body: uploadFormData
            });

            const data = await response.json();
            if (data.success) {
                const newAttachments = data.urls.map((url: string, idx: number) => ({
                    url,
                    name: files[idx].name,
                    type: files[idx].type
                }));
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, ...newAttachments]
                }));
                toast.success('Files uploaded successfully');
            }
        } catch (error) {
            console.error('File upload failed:', error);
            toast.error('Failed to upload files');
        }
    };

    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#00132d]">Calendar Management</h1>
                    <p className="text-muted-foreground">Manage drops, launches, and fashion events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncSKUs}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync from SKUs
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00132d] text-white rounded-lg hover:bg-[#00132d]/90 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Event
                    </button>
                    <button
                        onClick={() => setIsTypeManagementOpen(true)}
                        className="p-2 border border-border bg-white rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title="Manage Event Types"
                    >
                        <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>
                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-muted pl-3 pr-7 py-1.5 rounded-lg text-sm border-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                        {years.length > 0 ? years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        )) : (
                            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                        )}
                    </select>
                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-muted px-3 py-1.5 rounded-lg text-sm border-none focus:ring-1 focus:ring-primary"
                >
                    <option value="">All Types</option>
                    {eventTypes.map(type => (
                        <option key={type.id} value={type.value}>{type.label}</option>
                    ))}
                </select>

                <div className="w-64">
                    <SearchableCombobox
                        label="Filter by Entity"
                        options={allEntities.map(entity => ({
                            id: entity.id,
                            name: entity.brandInfo?.name || entity.name,
                            type: entity.entityType?.toLowerCase() || entity.type,
                            image: entity.brandInfo?.logo || entity.logoUrl || entity.image,
                        })).sort((a, b) => a.type.localeCompare(b.type))}
                        value={filterEntity?.name || ''}
                        onChange={(name) => {
                            if (!name) {
                                setFilterEntity(null);
                                return;
                            }
                            const selected = allEntities.find(e => (e.brandInfo?.name || e.name) === name);
                            if (selected) {
                                setFilterEntity({
                                    id: selected.id,
                                    name: selected.brandInfo?.name || selected.name,
                                    type: selected.entityType?.toLowerCase() || selected.type
                                });
                            }
                        }}
                    />
                </div>
                {filterEntity && (
                    <button
                        onClick={() => setFilterEntity(null)}
                        className="text-xs text-primary hover:underline"
                    >
                        Clear entity filter
                    </button>
                )}
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Event</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date/Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Entities</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading events...
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    No events found for this filter.
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {event.images && event.images.length > 0 ? (
                                                <img src={event.images.find(img => img.isPrimary)?.url || event.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                            ) : event.imageUrl ? (
                                                <img src={event.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <CalendarDaysIcon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-[#00132d]">{event.title}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">{event.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium">
                                            {event.eventDate ? format(new Date(event.eventDate), 'MMM dd, yyyy') : 'No date'}
                                        </div>
                                        {event.eventTime && <div className="text-xs text-muted-foreground">{event.eventTime}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground text-center">
                                            {eventTypes.find(t => t.value === event.eventType)?.label || event.eventType.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {event.taggedEntities?.slice(0, 3).map((entity, i) => {
                                                const identifier = entity.slug || entity.id;
                                                // Default public routes
                                                let href = `/`;

                                                switch (entity.type) {
                                                    case 'brand': href = `/brands/${identifier}`; break;
                                                    case 'store': href = `/stores/${identifier}`; break;
                                                    case 'supplier': href = `/suppliers/${identifier}`; break;
                                                    case 'page': href = `/pages/${identifier}`; break;
                                                    case 'non_profit': href = `/non-profits/${identifier}`; break;
                                                    case 'user': href = `/u/${identifier}`; break;
                                                    case 'item': href = `/items/${identifier}`; break;
                                                }

                                                return (
                                                    <a
                                                        key={i}
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-100 hover:bg-blue-100 transition-colors"
                                                    >
                                                        {entity.logoUrl && <img src={entity.logoUrl} className="w-3 h-3 rounded-full object-cover" alt="" />}
                                                        <span className="max-w-[80px] truncate">{entity.name || entity.type}</span>
                                                    </a>
                                                );
                                            })}
                                            {event.taggedEntities && event.taggedEntities.length > 3 && (
                                                <span className="text-[10px] text-muted-foreground">+{event.taggedEntities.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {event.isPublished ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircleIcon className="h-3 w-3" /> Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <XCircleIcon className="h-3 w-3" /> Draft
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(event)}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                <h2 className="text-xl font-bold">Add Calendar Event</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-muted border-none rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Event Type</label>
                                        <select
                                            value={formData.eventType}
                                            onChange={e => setFormData({ ...formData, eventType: e.target.value as any })}
                                            className="w-full bg-muted border-none rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        >
                                            {eventTypes.map(type => (
                                                <option key={type.id} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Event Date</label>
                                        <input
                                            required
                                            type="date"
                                            value={formData.eventDate}
                                            onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                                            className="w-full bg-muted border-none rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Description</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-muted border-none rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-4 border-t border-border pt-4">
                                        <h3 className="text-sm font-semibold">Media & Attachments</h3>

                                        <MediaUploader
                                            type="image"
                                            label="Photos"
                                            media={formData.images}
                                            onChange={(images) => setFormData({ ...formData, images })}
                                            onTagImage={handleTagImage}
                                            helperText="Upload photos and tag entities on them."
                                        />

                                        <MediaUploader
                                            type="video"
                                            label="Videos"
                                            media={formData.videos}
                                            onChange={(videos) => setFormData({ ...formData, videos })}
                                            helperText="Upload event videos."
                                        />

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Attachments</label>
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleFileUpload}
                                                    className="block w-full text-sm text-slate-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-full file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-violet-50 file:text-violet-700
                                                    hover:file:bg-violet-100"
                                                />
                                                {formData.attachments.length > 0 && (
                                                    <ul className="divide-y divide-border border border-border rounded-lg bg-white overflow-hidden">
                                                        {formData.attachments.map((file, idx) => (
                                                            <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                                                                <span className="truncate">{file.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAttachment(idx)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-4 border-t border-border pt-4">
                                        <h3 className="text-sm font-semibold">Tagged Entities (General)</h3>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.taggedEntities.map((entity: any, idx: number) => (
                                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                    {entity.name || entity.type}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: prev.taggedEntities.filter((_, i) => i !== idx)
                                                        }))}
                                                    >
                                                        <XMarkIcon className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <SearchableCombobox
                                                label="Add Brand"
                                                options={vufsBrands}
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const brand = vufsBrands.find(b => b.name === name);
                                                    if (brand) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: [...prev.taggedEntities, { type: 'brand', id: brand.id, name: brand.name }]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <SearchableCombobox
                                                label="Add Store"
                                                options={vufsStores}
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const store = vufsStores.find(s => s.name === name);
                                                    if (store) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: [...prev.taggedEntities, { type: 'store', id: store.id, name: store.name }]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <SearchableCombobox
                                                label="Add Supplier"
                                                options={vufsSuppliers}
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const supplier = vufsSuppliers.find(s => s.name === name);
                                                    if (supplier) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: [...prev.taggedEntities, { type: 'supplier', id: supplier.id, name: supplier.name }]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <SearchableCombobox
                                                label="Add User"
                                                options={vufsUsers}
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const user = vufsUsers.find(u => u.name === name);
                                                    if (user) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: [...prev.taggedEntities, { type: 'user', id: user.id, name: user.name }]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <SearchableCombobox
                                                label="Add Non-Profit"
                                                options={vufsNonProfits}
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const nonProfit = vufsNonProfits.find(n => n.name === name);
                                                    if (nonProfit) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: [...prev.taggedEntities, { type: 'non_profit', id: nonProfit.id, name: nonProfit.name }]
                                                        }));
                                                    }
                                                }}
                                            />
                                            <SearchableCombobox
                                                label="Add Page"
                                                options={vufsPages}
                                                value={null}
                                                onChange={(name) => {
                                                    if (!name) return;
                                                    const page = vufsPages.find(p => p.name === name);
                                                    if (page) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            taggedEntities: [...prev.taggedEntities, { type: 'page', id: page.id, name: page.name }]
                                                        }));
                                                    }
                                                }}
                                            />
                                        </div>

                                    </div>
                                </div>
                                <div className="flex items-center gap-4 py-2 border-t border-border mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPublished}
                                            onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm">Published</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isFeatured}
                                            onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm">Featured</span>
                                    </label>
                                </div>
                                <div className="flex gap-3 justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="px-6 py-2 bg-[#00132d] text-white rounded-lg hover:bg-[#00132d]/90 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Event'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Image Tagging Modal */}
            {taggingModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
                            <h2 className="text-xl font-bold">Tag Image</h2>
                            <button onClick={() => setTaggingModal(prev => ({ ...prev, isOpen: false }))} className="p-2 hover:bg-muted rounded-full">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                            <ImageTagEditor
                                imageUrl={taggingModal.imageUrl}
                                sourceType="post_image"
                                sourceId={taggingModal.eventId || 'temp'}
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-border bg-white text-right">
                            <button
                                onClick={() => setTaggingModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2 bg-[#00132d] text-white rounded-lg hover:bg-[#00132d]/90 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Type Management Modal */}
            <EventTypeManagementModal
                isOpen={isTypeManagementOpen}
                onClose={() => {
                    setIsTypeManagementOpen(false);
                    fetchEventTypes();
                }}
                types={eventTypes}
            />
        </div>
    );
}

function EventTypeManagementModal({ isOpen, onClose, types }: { isOpen: boolean; onClose: () => void; types: CalendarEventTypeRecord[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newType, setNewType] = useState({ value: '', label: '', icon: 'tag', color: 'bg-blue-500' });

    const handleAddType = async () => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token') || '';
            await calendarApi.createEventType(newType, token);
            setIsAdding(false);
            setNewType({ value: '', label: '', icon: 'tag', color: 'bg-blue-500' });
            onClose();
            toast.success('Event type added');
        } catch (error) {
            toast.error('Failed to add event type');
        }
    };

    const handleDeleteType = async (id: string) => {
        if (!confirm('Are you sure? System types cannot be deleted.')) return;
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token') || '';
            await calendarApi.deleteEventType(id, token);
            onClose();
            toast.success('Event type deleted');
        } catch (error) {
            toast.error('Cannot delete system types');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Manage Event Types</h2>
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full"><XMarkIcon className="h-5 w-5" /></button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {types.map(type => (
                                <div key={type.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${type.color || 'bg-gray-400'}`} />
                                        <div>
                                            <div className="font-semibold text-sm">{type.label}</div>
                                            <div className="text-xs text-muted-foreground">{type.value}</div>
                                        </div>
                                    </div>
                                    {!type.is_system && (
                                        <button onClick={() => handleDeleteType(type.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-4 w-4" /></button>
                                    )}
                                </div>
                            ))}

                            {isAdding ? (
                                <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-3">
                                    <input placeholder="Value (e.g. fashion_show)" className="w-full text-sm p-2 rounded border" value={newType.value} onChange={e => setNewType({ ...newType, value: e.target.value })} />
                                    <input placeholder="Label (e.g. Fashion Show)" className="w-full text-sm p-2 rounded border" value={newType.label} onChange={e => setNewType({ ...newType, label: e.target.value })} />
                                    <div className="flex gap-2">
                                        <button onClick={handleAddType} className="flex-1 py-2 bg-[#00132d] text-white rounded-lg text-sm">Save</button>
                                        <button onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-white border border-border rounded-lg text-sm">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setIsAdding(true)} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all text-sm font-medium">+ Add Custom Type</button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
