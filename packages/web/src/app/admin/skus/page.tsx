
import { Metadata } from 'next';
import AdminSkusPage from './SkusClient';

export const metadata: Metadata = {
    title: 'SKUs',
};

export default function Page() {
    return <AdminSkusPage />;
}
