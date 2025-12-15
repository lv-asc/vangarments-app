
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Marketplace',
    description: 'Buy and sell fashion items',
};

export default function MarketplaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
