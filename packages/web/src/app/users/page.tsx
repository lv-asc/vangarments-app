import { Metadata } from 'next';
import UsersPageClient from './UsersPageClient';

export const metadata: Metadata = {
    title: 'Users',
    description: 'Discover and connect with fashion enthusiasts, designers, and stylists on Vangarments.',
};

export default function Page() {
    return <UsersPageClient />;
}
