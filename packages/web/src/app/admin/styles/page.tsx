
import { Metadata } from 'next';
import AdminStylesPage from './StylesClient';

export const metadata: Metadata = {
    title: 'Styles',
};

export default function Page() {
    return <AdminStylesPage />;
}
