import React from 'react';
import { Metadata } from 'next';
import { apiClient } from '@/lib/api';
import ListingDetailView from '@/components/marketplace/ListingDetailView';
import { notFound } from 'next/navigation';

interface Props {
    params: { code: string };
}

/**
 * Generate dynamic metadata for the marketplace item
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        // We fetch on the server to get the title
        const listing = await apiClient.getMarketplaceListingByCode(params.code);

        if (!listing) {
            return {
                title: 'Item Not Found | Marketplace',
            };
        }

        return {
            title: `Marketplace | ${listing.title}`,
            description: listing.description || `Buy ${listing.title} on Vangarments marketplace`,
            openGraph: {
                title: `Marketplace | ${listing.title}`,
                description: listing.description,
                images: listing.images?.[0] ? [listing.images[0]] : [],
            },
        };
    } catch (error) {
        return {
            title: 'Marketplace Item',
        };
    }
}

/**
 * Server component for the marketplace item detail page
 */
export default async function MarketplaceItemPage({ params }: Props) {
    try {
        const listing = await apiClient.getMarketplaceListingByCode(params.code);

        if (!listing) {
            notFound();
        }

        // Fetch seller profile
        let seller = null;
        try {
            const sellerData = await apiClient.getSellerListings(listing.sellerId);
            seller = sellerData.seller;
        } catch (e) {
            console.error('Failed to fetch seller for listing detail page', e);
        }

        return (
            <ListingDetailView
                initialListing={listing}
                initialSeller={seller}
            />
        );
    } catch (error) {
        console.error('Error in MarketplaceItemPage:', error);
        notFound();
    }
}
