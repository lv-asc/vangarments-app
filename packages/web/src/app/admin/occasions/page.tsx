
import { Metadata } from 'next';
import AdminOccasionsPage from './OccasionsClient';

export const metadata: Metadata = {
    title: 'Occasions',
};

export default function Page() {
    return <AdminOccasionsPage />;
}
