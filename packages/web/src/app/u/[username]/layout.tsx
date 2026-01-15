import { Metadata } from 'next';
import ProfileLayoutClient from './ProfileLayoutClient';

interface Props {
    children: React.ReactNode;
    params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Decoding might be needed for special characters, but usually params are decoded.
    // If username contains encoded chars, we might want decodeURIComponent(params.username).
    // Safest to try to decode just in case.
    const username = decodeURIComponent(params.username);
    return {
        title: `User @${username}`,
    };
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ProfileLayoutClient>{children}</ProfileLayoutClient>;
}
