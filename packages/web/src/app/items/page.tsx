import { Metadata } from 'next';
import ItemsPageClient from './ItemsPageClient';

export const metadata: Metadata = {
    title: 'Items',
    description: 'Browse the latest items and collections from our partner brands.',
};

export default function Page() {
    return <ItemsPageClient />;
}
