
import { Metadata } from 'next';
import OutfitsPage from './OutfitsPageClient';

export const metadata: Metadata = {
    title: 'Outfits',
};

export default function Page() {
    return <OutfitsPage />;
}
