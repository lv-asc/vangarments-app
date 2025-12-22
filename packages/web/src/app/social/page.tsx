
import { Metadata } from 'next';
import SocialPage from './SocialPageClient';

export const metadata: Metadata = {
    title: 'Social',
};

export default function Page() {
    return <SocialPage />;
}
