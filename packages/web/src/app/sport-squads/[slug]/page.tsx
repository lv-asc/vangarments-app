import SportSquadClient from './SportSquadClient';

export const metadata = {
    title: 'Sport Squad | Vangarments',
    description: 'Explore the collection, history, and official items of your favorite sports squads.',
};

export default function SportSquadPage({ params }: { params: { slug: string } }) {
    return <SportSquadClient slug={params.slug} />;
}
