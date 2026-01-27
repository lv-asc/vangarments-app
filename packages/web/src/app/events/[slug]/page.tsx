import { Metadata } from 'next';
import EventProfileClient from './EventProfileClient';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const formattedName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return {
        title: formattedName,
        description: `Details about ${formattedName} fashion event`,
    };
}

export default async function EventPage({ params }: Props) {
    const { slug } = await params;
    return <EventProfileClient slug={slug} />;
}
