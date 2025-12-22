
import { Metadata } from 'next';
import AdminSizesPage from './SizesClient';

export const metadata: Metadata = {
    title: 'Sizes',
};

export default function Page() {
    return <AdminSizesPage />;
}
