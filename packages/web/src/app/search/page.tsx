
import { Metadata } from 'next';
import DiscoverPage from './DiscoverPageClient';

export const metadata: Metadata = {
    title: 'Search',
};

export default function Page() {
    return <DiscoverPage />;
}
