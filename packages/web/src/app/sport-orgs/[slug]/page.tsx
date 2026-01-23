import SportOrgProfileClient from './SportOrgProfileClient';
import { sportOrgApi } from '@/lib/sportOrgApi';

export default function Page({ params }: { params: { slug: string } }) {
    return <SportOrgProfileClient slug={params.slug} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    try {
        const org = await sportOrgApi.getOrg(params.slug);

        if (!org) {
            return {
                title: 'Sport ORG Not Found',
            };
        }

        return {
            title: {
                absolute: `Sport ORG @${org.name}`,
            },
            description: org.description || `View the official profile of ${org.name} on Vangarments.`,
        };
    } catch (error) {
        return {
            title: `Sport ORG Profile`,
            description: `View the official profile of this sport organization on Vangarments.`,
        };
    }
}
