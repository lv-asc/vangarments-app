
import { Metadata } from 'next';
import AdminColorsPage from './ColorsClient';

export const metadata: Metadata = {
    title: 'Colors',
};

export default function Page() {
    return <AdminColorsPage />;
}
