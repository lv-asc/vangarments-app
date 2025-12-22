
import { Metadata } from 'next';
import AdminPatternsPage from './PatternsClient';

export const metadata: Metadata = {
    title: 'Patterns',
};

export default function Page() {
    return <AdminPatternsPage />;
}
