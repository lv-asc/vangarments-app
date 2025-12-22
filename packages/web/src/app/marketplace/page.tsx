
import { Metadata } from 'next';
import MarketplacePage from './MarketplacePageClient';

export const metadata: Metadata = {
    title: 'Marketplace',
};

export default function Page() {
    return <MarketplacePage />;
}
