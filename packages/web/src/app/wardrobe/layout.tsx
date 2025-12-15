
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Wardrobe',
    description: 'Manage your digital wardrobe items',
};

export default function WardrobeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
