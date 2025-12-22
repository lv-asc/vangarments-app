
import { Metadata } from 'next';
import AdminBrandsPage from './BrandsClient';

export const metadata: Metadata = {
    title: 'Brands',
};

export default function Page() {
    return <AdminBrandsPage />;
}
