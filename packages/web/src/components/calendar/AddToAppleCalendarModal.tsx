import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '@/lib/calendarApi';
import { XMarkIcon, CalendarDaysIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface AddToAppleCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: CalendarEvent;
    onConfirm: (details: {
        title: string;
        description: string;
        startDate: string;
        startTime?: string;
        endDate?: string;
        endTime?: string;
        location?: string;
    }) => void;
    isSubmitting: boolean;
    mode: 'sync' | 'download';
}

export function AddToAppleCalendarModal({
    isOpen,
    onClose,
    event,
    onConfirm,
    isSubmitting,
    mode
}: AddToAppleCalendarModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [isAllDay, setIsAllDay] = useState(false);

    useEffect(() => {
        if (event) {
            setTitle(event.title);

            // Build description
            let desc = event.description || '';
            if (event.brand) {
                desc += `\n\nBrand: ${event.brand.brand_name || event.brand.name}`;
            }
            if (event.externalUrl) {
                desc += `\n\nMore info: ${event.externalUrl}`;
            }
            desc += `\n\n—\nAdded from Vangarments Calendar`;
            setDescription(desc);

            // Dates
            const startD = new Date(event.eventDate);
            setStartDate(startD.toISOString().split('T')[0]);

            if (event.eventTime) {
                setStartTime(event.eventTime);
                setIsAllDay(false);

                // Set end date/time default (2 hours later)
                const endD = event.endDate ? new Date(event.endDate) : new Date(startD.getTime() + 2 * 60 * 60 * 1000);
                setEndDate(endD.toISOString().split('T')[0]);

                // Format HH:mm
                const hours = endD.getHours().toString().padStart(2, '0');
                const minutes = endD.getMinutes().toString().padStart(2, '0');
                setEndTime(`${hours}:${minutes}`);
            } else {
                setIsAllDay(true);
                setStartTime('');
                const endD = event.endDate ? new Date(event.endDate) : new Date(startD);
                setEndDate(endD.toISOString().split('T')[0]);
                setEndTime('');
            }

            setLocation(event.location || '');
        }
    }, [event]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            title,
            description,
            startDate,
            startTime: isAllDay ? undefined : startTime,
            endDate,
            endTime: isAllDay ? undefined : endTime,
            location
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-background w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h3 className="text-xl font-bold">
                        {mode === 'sync' ? 'Add to Apple Calendar' : 'Download Event'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Event Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                    </div>

                    {/* Checkbox All Day */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allDayApple"
                                checked={isAllDay}
                                onChange={(e) => setIsAllDay(e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="allDayApple" className="text-sm font-medium cursor-pointer">All Day Event</label>
                        </div>

                        {mode === 'download' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 w-fit">
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span className="text-xs font-semibold">Generates a universal .ics calendar file</span>
                            </div>
                        )}
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" /> Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>
                        {!isAllDay && (
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4 text-muted-foreground" /> Start Time
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required={!isAllDay}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" /> End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        {!isAllDay && (
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4 text-muted-foreground" /> End Time
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <MapPinIcon className="h-4 w-4 text-muted-foreground" /> Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Add location"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                        />
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-border hover:bg-muted font-medium transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 font-medium transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {mode === 'sync' ? 'Syncing...' : 'Downloading...'}
                                </>
                            ) : (
                                <>
                                    {mode === 'sync' ? (
                                        <>
                                            <img src="/icons/apple-calendar-real.png" alt="" className="h-4 w-4 object-contain" />
                                            Sync to Apple Calendar
                                        </>
                                    ) : (
                                        <>
                                            <CalendarDaysIcon className="h-4 w-4" />
                                            Download .ics File
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
