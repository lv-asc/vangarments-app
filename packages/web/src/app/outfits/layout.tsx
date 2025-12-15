
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Outfits',
    description: 'Create and manage your outfits',
};

export default function OutfitsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
