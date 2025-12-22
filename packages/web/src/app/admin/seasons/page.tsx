
import { Metadata } from 'next';
import AdminSeasonsPage from './SeasonsClient';

export const metadata: Metadata = {
    title: 'Seasons',
};

export default function Page() {
    return <AdminSeasonsPage />;
}
