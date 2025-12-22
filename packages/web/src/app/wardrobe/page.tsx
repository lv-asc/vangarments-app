
import { Metadata } from 'next';
import WardrobePage from './WardrobePageClient';

export const metadata: Metadata = {
    title: 'Wardrobe',
};

export default function Page() {
    return <WardrobePage />;
}
