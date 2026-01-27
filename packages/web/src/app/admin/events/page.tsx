import EventsManagementClient from './EventsManagementClient';

export const metadata = {
    title: 'Events Management',
    description: 'Manage fashion events, fashion weeks, sales, and more.',
};

export default function AdminEventsPage() {
    return <EventsManagementClient />;
}
