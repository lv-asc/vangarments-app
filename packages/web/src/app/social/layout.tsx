
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Social',
    description: 'Connect with the Vangarments community',
};

export default function SocialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
