
import { Metadata } from 'next';
import AdminJournalismPage from './JournalismClient';

export const metadata: Metadata = {
    title: 'Journalism',
};

export default function Page() {
    return <AdminJournalismPage />;
}
