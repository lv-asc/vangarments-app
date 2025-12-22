
import { Metadata } from 'next';
import AdminNonProfitsPage from './NonProfitsClient';

export const metadata: Metadata = {
    title: 'Non-Profits',
};

export default function Page() {
    return <AdminNonProfitsPage />;
}
