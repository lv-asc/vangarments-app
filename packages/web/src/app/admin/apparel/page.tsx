
import { Metadata } from 'next';
import AdminApparelPage from './ApparelClient';

export const metadata: Metadata = {
    title: 'Apparel',
};

export default function Page() {
    return <AdminApparelPage />;
}
