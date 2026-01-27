import { Metadata } from 'next';
import EventsBrowseClient from './EventsBrowseClient';

export const metadata: Metadata = {
    title: 'Events',
    description: 'Browse fashion events, runway shows, conferences, and more',
};

export default function EventsPage() {
    return <EventsBrowseClient />;
}
