import { Metadata } from 'next';
import { cookies } from 'next/headers';
import OutfitDetailClient from './OutfitDetailClient';

interface PageProps {
    params: {
        slug: string;
    };
}

async function getOutfit(slug: string) {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
        const res = await fetch(`${baseUrl}/outfits/slug/${slug}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 0 } // Don't cache for now
        });

        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const outfit = await getOutfit(params.slug);

    return {
        title: outfit ? `Outfits | ${outfit.name}` : 'Outfits',
    };
}

export default async function OutfitDetailPage({ params }: PageProps) {
    const outfit = await getOutfit(params.slug);

    if (!outfit) {
        return (
            <div className="p-8 text-center text-red-600">
                Outfit not found
            </div>
        );
    }

    return <OutfitDetailClient outfit={outfit} />;
}
