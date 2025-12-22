
import { Metadata } from 'next';
import AdminFitsPage from './FitsClient';

export const metadata: Metadata = {
    title: 'Fits',
};

export default function Page() {
    return <AdminFitsPage />;
}
