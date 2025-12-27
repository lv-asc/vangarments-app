import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search',
    description: 'Search for fashion items, brands, and more',
};

export default function DiscoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
