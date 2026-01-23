
import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SportOrgEditor from '../components/SportOrgEditor';

// Helper to fetch data
async function getOrg(slug: string) {
    // Use localhost for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
        const res = await fetch(`${baseUrl}/sport-orgs/${slug}`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            console.error('Failed to fetch org:', res.status, res.statusText);
            return null;
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching org:', error);
        return null;
    }
}

type Props = {
    params: { slug: string }
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const org = await getOrg(params.slug);

    if (!org) {
        return {
            title: 'Sport ORG Not Found | Vangarments Admin'
        };
    }

    return {
        title: `Sport ORG @${org.name}`
    };
}

export default async function EditSportOrgPage({ params }: Props) {
    const org = await getOrg(params.slug);

    // If org not found, show 404 page
    if (!org) {
        return notFound();
    }

    return <SportOrgEditor orgId={org.id} />;
}
