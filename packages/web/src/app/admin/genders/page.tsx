
import { Metadata } from 'next';
import AdminGendersPage from './GendersClient';

export const metadata: Metadata = {
    title: 'Genders',
};

export default function Page() {
    return <AdminGendersPage />;
}
