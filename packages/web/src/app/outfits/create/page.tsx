import { Metadata } from 'next';
import OutfitEditorClient from '@/components/outfits/OutfitEditorClient';

export const metadata: Metadata = {
    title: 'Outfits | Create',
    description: 'Create a new outfit.',
};

export default function CreateOutfitPage() {
    return <OutfitEditorClient mode="create" />;
}
