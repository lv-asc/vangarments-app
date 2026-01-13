'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDaysIcon,
    Squares2X2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    TagIcon,
    SparklesIcon,
    FireIcon,
    TrophyIcon,
    FilmIcon,
    CalendarIcon,
    BellIcon,
    BellSlashIcon,
    XMarkIcon,
    MapPinIcon,
    LinkIcon,
    DocumentIcon,
    UserIcon,
    BuildingStorefrontIcon,
    BriefcaseIcon,
    MagnifyingGlassIcon,
    GlobeAmericasIcon
} from '@heroicons/react/24/outline';
import { COUNTRIES } from '@/lib/constants';
import {
    calendarApi,
    CalendarEvent,
    CalendarEventType,
    EVENT_TYPE_LABELS,
    EVENT_TYPE_COLORS,
} from '@/lib/calendarApi';
import { useAuth } from '@/contexts/AuthWrapper';

const MONTHS = [
    { value: 0, label: 'TODOS' },
    { value: 1, label: 'JAN' },
    { value: 2, label: 'FEV' },
    { value: 3, label: 'MAR' },
    { value: 4, label: 'ABR' },
    { value: 5, label: 'MAI' },
    { value: 6, label: 'JUN' },
    { value: 7, label: 'JUL' },
    { value: 8, label: 'AGO' },
    { value: 9, label: 'SET' },
    { value: 10, label: 'OUT' },
    { value: 11, label: 'NOV' },
    { value: 12, label: 'DEZ' },
];

const EVENT_TYPE_ICONS: Record<string, typeof TagIcon> = {
    item_launch: TagIcon,
    collection_release: SparklesIcon,
    drop: FireIcon,
    fashion_event: CalendarIcon,
    award: TrophyIcon,
    media_release: FilmIcon,
};

type ViewMode = 'calendar' | 'items';

export function CalendarClient() {
    const { token, isAuthenticated, user } = useAuth();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(0); // 0 = all months
    const [selectedRegion, setSelectedRegion] = useState('Global');
    const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
    const [regionSearch, setRegionSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('items');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [subscriptions, setSubscriptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [eventTypes, setEventTypes] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [filterEntity, setFilterEntity] = useState<{ id: string; type: string; name: string } | null>(null);
    const regionDropdownRef = useRef<HTMLDivElement>(null);

    // Get user's country for the "Your Country" option
    const userCountryName = user?.personalInfo?.location?.country || 'Brazil';
    const userCountry = COUNTRIES.find(c => c.name === userCountryName || c.code === userCountryName);

    const regionOptions = [
        { name: 'Global', flag: '🌎' },
        ...(userCountry ? [{ name: userCountry.name, flag: userCountry.flag }] : []),
        ...COUNTRIES.filter(c => c.name !== userCountryName).map(c => ({ name: c.name, flag: c.flag }))
    ];

    const filteredRegions = regionOptions.filter(r =>
        r.name.toLowerCase().includes(regionSearch.toLowerCase())
    );

    // Click outside handler for region dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
                setIsRegionDropdownOpen(false);
            }
        };

        if (isRegionDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isRegionDropdownOpen]);

    // Generate year range (current year back to 2004)
    const years = Array.from({ length: currentYear - 2003 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchEventTypes();
    }, []);

    const fetchEventTypes = async () => {
        try {
            const data = await calendarApi.getEventTypes();
            setEventTypes(data);
        } catch (error) {
            console.error('Error fetching event types:', error);
        }
    };

    // Fetch events and subscriptions when filters change
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const [eventsData, subsData] = await Promise.all([
                    calendarApi.getEvents({
                        year: selectedYear,
                        month: selectedMonth || undefined,
                        region: selectedRegion === 'Global' ? undefined : selectedRegion,
                        type: selectedType || undefined,
                        entityId: filterEntity?.id,
                        entityType: filterEntity?.type
                    }),
                    isAuthenticated ? calendarApi.getSubscriptions(token || '') : Promise.resolve([])
                ]);
                setEvents(eventsData);
                setSubscriptions(subsData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load calendar data');
                setEvents([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [selectedYear, selectedMonth, isAuthenticated, selectedRegion, selectedType, filterEntity]);

    const handleSubscribe = async (eventId: string) => {
        if (!isAuthenticated) return alert('Please login to subscribe to events');
        try {
            const isSubscribed = subscriptions.includes(eventId);
            if (isSubscribed) {
                await calendarApi.unsubscribeFromEvent(eventId, token || '');
                setSubscriptions(subscriptions.filter(id => id !== eventId));
            } else {
                await calendarApi.subscribeToEvent(eventId, token || '');
                setSubscriptions([...subscriptions, eventId]);
            }
        } catch (error) {
            console.error('Subscription error:', error);
        }
    };



    // Group events by date for calendar view
    const eventsByDate = events.reduce((acc, event) => {
        const date = new Date(event.eventDate).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-16 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.history.back()}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <CalendarDaysIcon className="h-4 w-4" />
                                Calendar
                            </button>
                            <button
                                onClick={() => setViewMode('items')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'items'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Squares2X2Icon className="h-4 w-4" />
                                Items
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Year Selector */}
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <div className="relative">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="bg-muted border-none rounded-lg py-1.5 pl-3 pr-8 text-sm font-semibold focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
                                    >
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground rotate-90" />
                                    </div>
                                </div>
                            </div>

                            {/* Region Filter */}
                            <div className="relative" ref={regionDropdownRef}>
                                <button
                                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedRegion !== 'Global'
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'bg-muted border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <GlobeAmericasIcon className="h-4 w-4" />
                                    <span>{selectedRegion}</span>
                                    <ChevronRightIcon className={`h-3 w-3 transition-transform ${isRegionDropdownOpen ? 'rotate-90' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isRegionDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            className="absolute left-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="p-2 border-b border-border bg-muted/30">
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search region..."
                                                        value={regionSearch}
                                                        onChange={(e) => setRegionSearch(e.target.value)}
                                                        autoFocus
                                                        className="w-full bg-background border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto py-1">
                                                {filteredRegions.length > 0 ? (
                                                    filteredRegions.map((region) => (
                                                        <button
                                                            key={region.name}
                                                            onClick={() => {
                                                                setSelectedRegion(region.name);
                                                                setIsRegionDropdownOpen(false);
                                                                setRegionSearch('');
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors ${selectedRegion === region.name ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                                                                }`}
                                                        >
                                                            <span className="text-lg">{region.flag}</span>
                                                            <span className="flex-1 text-left">{region.name}</span>
                                                            {selectedRegion === region.name && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            )}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                        No regions found
                                                    </div>
                                                )}
                                            </div>
                                            {selectedRegion !== 'Global' && (
                                                <div className="p-2 border-t border-border">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRegion('Global');
                                                            setIsRegionDropdownOpen(false);
                                                            setRegionSearch('');
                                                        }}
                                                        className="w-full py-1.5 text-xs font-semibold text-primary hover:underline"
                                                    >
                                                        Clear filter
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Type Filter */}
                            <div className="flex items-center gap-2">
                                <TagIcon className="h-4 w-4 text-muted-foreground" />
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="bg-muted border-none rounded-lg py-1.5 pl-3 pr-8 text-sm font-semibold focus:ring-2 focus:ring-primary cursor-pointer appearance-none"
                                >
                                    <option value="">All Types</option>
                                    {eventTypes.map(type => (
                                        <option key={type.id} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Month Tabs */}
                    <div className="flex gap-1 overflow-x-auto mt-4 pb-1 scrollbar-hide">
                        {MONTHS.map((month) => (
                            <button
                                key={month.value}
                                onClick={() => setSelectedMonth(month.value)}
                                className={`px-3 py-1.5 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${selectedMonth === month.value
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    }`}
                            >
                                {month.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-destructive font-medium">{error}</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-12">
                        <CalendarDaysIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
                        <p className="text-muted-foreground text-sm">
                            No events found for the selected month and region in {selectedYear}.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === 'items' ? (
                            <ItemsView
                                key="items"
                                events={events}
                                subscriptions={subscriptions}
                                onSubscribe={handleSubscribe}
                                onEventClick={setSelectedEvent}
                            />
                        ) : (
                            <CalendarView
                                key="calendar"
                                events={events}
                                eventsByDate={eventsByDate}
                                year={selectedYear}
                                month={selectedMonth}
                                onEventClick={setSelectedEvent}
                            />
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Event Detail Modal */}
            <EventDetailModal
                event={selectedEvent}
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                isSubscribed={selectedEvent ? subscriptions.includes(selectedEvent.id) : false}
                onSubscribe={handleSubscribe}
            />
        </div>
    );
}

// Items Grid View
function ItemsView({
    events,
    subscriptions,
    onSubscribe,
    onEventClick
}: {
    events: CalendarEvent[];
    subscriptions: string[];
    onSubscribe: (id: string) => void;
    onEventClick: (event: CalendarEvent) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
            {events.map((event) => (
                <EventCard
                    key={event.id}
                    event={event}
                    isSubscribed={subscriptions.includes(event.id)}
                    onSubscribe={onSubscribe}
                    onClick={() => onEventClick(event)}
                />
            ))}
        </motion.div>
    );
}

// Event Card Component
function EventCard({
    event,
    isSubscribed,
    onSubscribe,
    onClick
}: {
    event: CalendarEvent;
    isSubscribed: boolean;
    onSubscribe: (id: string) => void;
    onClick: () => void;
}) {
    const Icon = EVENT_TYPE_ICONS[event.eventType] || TagIcon;
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });

    const primaryImage = event.images?.find(img => img.isPrimary)?.url || event.images?.[0]?.url || event.imageUrl;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="group bg-background rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
            {/* Image */}
            <div className="aspect-square relative bg-muted">
                {primaryImage ? (
                    <img
                        src={primaryImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                )}
                {/* Event Type Badge */}
                <div
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-500'
                        }`}
                >
                    {EVENT_TYPE_LABELS[event.eventType] || event.eventType.replace('_', ' ')}
                </div>

                {/* Subscribe Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSubscribe(event.id);
                    }}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-all duration-200 shadow-md ${isSubscribed
                        ? 'bg-primary text-white scale-110'
                        : 'bg-white/90 text-primary hover:scale-110'
                        }`}
                >
                    {isSubscribed ? <BellIcon className="h-4 w-4 fill-current" /> : <BellIcon className="h-4 w-4" />}
                </button>
            </div>

            {/* Content */}
            <div className="p-3">
                <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {event.title}
                </h3>
                {event.description && (
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 leading-tight">
                        {event.description}
                    </p>
                )}
                <div className="flex items-center justify-between mt-auto">
                    {event.brand && (
                        <p className="text-[10px] font-semibold text-muted-foreground truncate max-w-[60%]">
                            {event.brand.brand_name || event.brand.name}
                        </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 ml-auto">{formattedDate}</p>
                </div>

                {/* Tagged Entities Miniature */}
                {event.taggedEntities && event.taggedEntities.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1.5">
                        {event.taggedEntities.slice(0, 2).map((entity, idx) => {
                            const logo = entity.logoUrl || (entity.type === 'brand' && entity.id === event.brandId ? event.brand?.logo : null);
                            const identifier = entity.slug || entity.id;
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
                                <Link
                                    key={idx}
                                    href={href}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background border border-border shadow-sm max-w-[100px] hover:border-primary transition-colors cursor-pointer"
                                    title={entity.name || entity.type}
                                >
                                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-border/50">
                                        {logo ? (
                                            <img src={logo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                {entity.type === 'user' && <UserIcon className="h-2 w-2 text-muted-foreground" />}
                                                {entity.type === 'brand' && <TagIcon className="h-2 w-2 text-muted-foreground" />}
                                                {entity.type === 'store' && <BuildingStorefrontIcon className="h-2 w-2 text-muted-foreground" />}
                                                {entity.type === 'item' && <TagIcon className="h-2 w-2 text-muted-foreground" />}
                                                {entity.type === 'supplier' && <BriefcaseIcon className="h-2 w-2 text-muted-foreground" />}
                                            </>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-foreground truncate">{entity.name || entity.id}</span>
                                </Link>
                            );
                        })}
                        {event.taggedEntities.length > 2 && (
                            <span className="text-[8px] text-muted-foreground flex items-center font-medium">+{event.taggedEntities.length - 2} more</span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function CalendarView({
    events,
    eventsByDate,
    year,
    month,
    onEventClick
}: {
    events: CalendarEvent[];
    eventsByDate: Record<string, CalendarEvent[]>;
    year: number;
    month: number;
    onEventClick: (event: CalendarEvent) => void;
}) {
    // If month is 0 (all), show a monthly overview instead
    if (month === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
                {MONTHS.filter((m) => m.value > 0).map((monthData) => {
                    const monthEvents = events.filter((e) => {
                        const eventMonth = new Date(e.eventDate).getMonth() + 1;
                        return eventMonth === monthData.value;
                    });

                    return (
                        <div
                            key={monthData.value}
                            className="bg-muted/50 rounded-xl p-4 border border-border"
                        >
                            <h3 className="font-bold text-lg mb-3">{monthData.label}</h3>
                            {monthEvents.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No events</p>
                            ) : (
                                <div className="space-y-2">
                                    {monthEvents.slice(0, 3).map((event) => (
                                        <div
                                            key={event.id}
                                            onClick={() => onEventClick(event)}
                                            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded transition-colors"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-400'
                                                    }`}
                                            />
                                            <span className="truncate flex-1">{event.title}</span>
                                        </div>
                                    ))}
                                    {monthEvents.length > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                            +{monthEvents.length - 3} more
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </motion.div>
        );
    }

    // Show calendar grid for specific month
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const paddingDays = Array.from({ length: firstDay }, (_, i) => null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-semibold text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = eventsByDate[dateStr] || [];
                    const hasEvents = dayEvents.length > 0;

                    return (
                        <div
                            key={day}
                            onClick={() => {
                                if (hasEvents) {
                                    // If multiple events, we could open a day overview, 
                                    // for now just open the first one or we can enhance further
                                    onEventClick(dayEvents[0]);
                                }
                            }}
                            className={`min-h-[80px] rounded-lg p-1.5 border transition-all ${hasEvents
                                ? 'border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10'
                                : 'border-transparent hover:border-border'
                                }`}
                        >
                            <div className={`text-xs font-semibold mb-1.5 ${hasEvents ? 'text-primary' : 'text-muted-foreground'}`}>{day}</div>
                            {hasEvents && (
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
                                            }}
                                            className={`w-full flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium text-white truncate hover:brightness-110 transition-all ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-500'} shadow-sm`}
                                            title={event.title}
                                        >
                                            <span className="truncate">{event.title}</span>
                                        </button>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[8px] text-muted-foreground font-semibold px-1">
                                            +{dayEvents.length - 3} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}

// Event Detail Modal Component
function EventDetailModal({
    event,
    isOpen,
    onClose,
    isSubscribed,
    onSubscribe
}: {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    isSubscribed: boolean;
    onSubscribe: (id: string) => void;
}) {
    if (!event) return null;

    const Icon = EVENT_TYPE_ICONS[event.eventType] || TagIcon;
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const allImages = event.images || (event.imageUrl ? [{ url: event.imageUrl, isPrimary: true }] : []);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                        className="relative bg-background w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>

                        {/* Media Section */}
                        <div className="w-full md:w-1/2 h-64 md:h-auto bg-muted relative">
                            {allImages.length > 0 ? (
                                <div className="h-full overflow-y-auto scrollbar-hide">
                                    {allImages.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img.url}
                                            alt={event.title}
                                            className="w-full h-full object-cover border-b border-border last:border-0"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Icon className="h-24 w-24 text-muted-foreground/20" />
                                </div>
                            )}

                            {/* Badge */}
                            <div
                                className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-500'
                                    }`}
                            >
                                {EVENT_TYPE_LABELS[event.eventType] || event.eventType.replace('_', ' ')}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{formattedDate}</span>
                                    {event.eventTime && (
                                        <>
                                            <span className="text-border">•</span>
                                            <span>{event.eventTime}</span>
                                        </>
                                    )}
                                </div>

                                <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
                                    {event.title}
                                </h2>

                                {event.brand && (
                                    <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-xl border border-border">
                                        {event.brand.logo && (
                                            <img src={event.brand.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                                        )}
                                        <div className="font-semibold text-sm">
                                            {event.brand.brand_name || event.brand.name}
                                        </div>
                                    </div>
                                )}

                                {event.description && (
                                    <div className="prose prose-sm dark:prose-invert max-w-none mb-8 text-muted-foreground leading-relaxed">
                                        {event.description}
                                    </div>
                                )}

                                {event.location && (
                                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-6">
                                        <MapPinIcon className="h-4 w-4 mt-0.5 text-primary" />
                                        <div>
                                            <div className="font-semibold text-foreground">Location</div>
                                            <div>{event.location}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Tagged Entities */}
                                {event.taggedEntities && event.taggedEntities.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                                            <TagIcon className="h-4 w-4 text-primary" />
                                            Tagged Entities
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {event.taggedEntities.map((entity, idx) => {
                                                const logo = entity.logoUrl || (entity.type === 'brand' && entity.id === event.brandId ? event.brand?.logo : null);
                                                const identifier = entity.slug || entity.id;
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
                                                    <Link
                                                        key={idx}
                                                        href={href}
                                                        className="inline-flex items-center gap-3 px-4 py-2 bg-background rounded-full border border-border shadow-sm hover:border-primary transition-all cursor-pointer group/entity"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border transition-colors group-hover/entity:border-primary/50">
                                                            {logo ? (
                                                                <img src={logo} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <>
                                                                    {entity.type === 'user' && <UserIcon className="h-4 w-4 text-muted-foreground" />}
                                                                    {entity.type === 'brand' && <TagIcon className="h-4 w-4 text-muted-foreground" />}
                                                                    {entity.type === 'store' && <BuildingStorefrontIcon className="h-4 w-4 text-muted-foreground" />}
                                                                    {entity.type === 'item' && <TagIcon className="h-4 w-4 text-muted-foreground" />}
                                                                    {entity.type === 'supplier' && <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />}
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-foreground leading-none">{entity.name || entity.id}</span>
                                                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mt-1">{entity.type}</span>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Attachments */}
                                {event.attachments && event.attachments.length > 0 && (
                                    <div className="mb-8">
                                        <div className="text-sm font-semibold mb-3">Attachments</div>
                                        <div className="space-y-2">
                                            {event.attachments.map((file, idx) => (
                                                <a
                                                    key={idx}
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                                                >
                                                    <DocumentIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{file.name}</div>
                                                        <div className="text-[10px] text-muted-foreground uppercase">{file.type?.split('/')?.[1] || 'FILE'}</div>
                                                    </div>
                                                    <LinkIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-auto pt-6 border-t border-border">
                                <button
                                    onClick={() => onSubscribe(event.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isSubscribed
                                        ? 'bg-muted text-foreground hover:bg-muted/80'
                                        : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                        }`}
                                >
                                    {isSubscribed ? (
                                        <>
                                            <BellSlashIcon className="h-5 w-5" />
                                            Subscribed
                                        </>
                                    ) : (
                                        <>
                                            <BellIcon className="h-5 w-5" />
                                            Notify Me
                                        </>
                                    )}
                                </button>
                                {event.externalUrl && (
                                    <a
                                        href={event.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors border border-border"
                                        title="Official Link"
                                    >
                                        <LinkIcon className="h-5 w-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
