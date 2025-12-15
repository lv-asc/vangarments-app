
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Discover',
    description: 'Explore fashion content and trends',
};

export default function DiscoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
