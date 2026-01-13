import { CalendarClient } from '@/components/calendar/CalendarClient';

export const metadata = {
    title: 'Calendar',
    description: 'Upcoming item launches, collection releases, fashion events, and more.',
};

export default function CalendarPage() {
    return <CalendarClient />;
}
