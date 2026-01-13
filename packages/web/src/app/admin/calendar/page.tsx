import CalendarAdmin from '@/components/admin/CalendarAdmin';

export const metadata = {
    title: 'Calendar',
};

export default function AdminCalendarPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="p-6">
                <CalendarAdmin />
            </div>
        </div>
    );
}
