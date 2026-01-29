import { Metadata } from 'next';
import { cookies } from 'next/headers';
import WardrobeItemDetailClient from './WardrobeItemDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type Props = {
  params: { code: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = params;
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  try {
    const response = await fetch(`${BASE_URL}/wardrobe/items/${code}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      cache: 'no-store',
    });

    if (response.ok) {
      const result = await response.json();
      const item = result.data?.item || result.item;
      if (item && item.metadata?.name) {
        return {
          title: `Wardrobe | ${item.metadata.name}`,
        };
      }
    }
  } catch (error) {
    console.error('[Metadata] Error fetching wardrobe item:', error);
  }

  return {
    title: 'Wardrobe | Item',
  };
}

export default function WardrobeItemDetailPage() {
  return <WardrobeItemDetailClient />;
}
