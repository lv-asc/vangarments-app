
import { Metadata } from 'next';
import ProfilePage from './ProfilePageClient';

export const metadata: Metadata = {
    title: 'Profile',
};

export default function Page() {
    return <ProfilePage />;
}
