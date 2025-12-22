
import { Metadata } from 'next';
import AdminPagesPage from './PagesClient';

export const metadata: Metadata = {
    title: 'Pages',
};

export default function Page() {
    return <AdminPagesPage />;
}
