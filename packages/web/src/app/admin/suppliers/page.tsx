
import { Metadata } from 'next';
import AdminSuppliersPage from './SuppliersClient';

export const metadata: Metadata = {
    title: 'Suppliers',
};

export default function Page() {
    return <AdminSuppliersPage />;
}
