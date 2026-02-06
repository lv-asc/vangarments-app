import { Metadata } from 'next';
import OutfitsClient from './OutfitsClient';

export const metadata: Metadata = {
    title: 'Outfits',
    description: 'Manage and organize your outfits.',
};

export default function OutfitListPage() {
    return <OutfitsClient />;
}
