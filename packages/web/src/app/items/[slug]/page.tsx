import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

/**
 * Strip size suffix from product name (e.g., "Asphalt T-Shirt (Black) [S]" -> "Asphalt T-Shirt (Black)")
 */
function stripSizeSuffix(name: string): string {
    // Remove common size suffixes like [S], [M], [L], [XL], [XXL], [XS], [XXS], [XXXL] etc.
    return name.replace(/\s*\[(X{0,3}S|X{0,4}L|M|[0-9]+)\]\s*$/i, '').trim();
}

type Props = {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const { slug } = params;
    try {
        console.log(`[Metadata] Generating for slug: ${slug}`);
        // SKU search endpoint is now public for SEO/metadata purposes
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

        // Initial search using the full slug (handles codes and direct matches)
        const initialParams = new URLSearchParams({
            term: slug,
            parentsOnly: 'true'
        });

        const initialUrl = `${baseURL}/skus/search?${initialParams.toString()}`;
        console.log(`[Metadata] Initial fetch from: ${initialUrl}`);

        let response = await fetch(initialUrl, { cache: 'no-store' });
        let result = response.ok ? await response.json() : { skus: [] };

        // If no results, try the keyword-extracted search
        if (!result.skus || result.skus.length === 0) {
            const slugParts = slug.split('-');
            const meaningfulParts = slugParts.filter(part =>
                part.length > 2 && !['asc', 'sk', 'ct', 'rf', 'teh', 'tsh', 'bk', 'm'].includes(part.toLowerCase())
            );

            const searchTerm = meaningfulParts.join(' ');
            if (searchTerm && searchTerm !== slug) {
                const searchParams = new URLSearchParams({
                    term: searchTerm,
                    parentsOnly: 'true'
                });

                const url = `${baseURL}/skus/search?${searchParams.toString()}`;
                console.log(`[Metadata] Retrying with search term: "${searchTerm}" from: ${url}`);

                response = await fetch(url, { cache: 'no-store' });
                if (response.ok) {
                    result = await response.json();
                }
            }
        }

        // Final fallback: strip size suffix if still no results
        if (!result.skus || result.skus.length === 0) {
            const parts = slug.split('-');
            if (parts.length > 1) {
                const potentialSize = parts[parts.length - 1];
                if (/^(x{0,3}s|x{0,4}l|m|[0-9]+)$/i.test(potentialSize)) {
                    parts.pop();
                    const potentialBase = parts.join('-');
                    const baseParams = new URLSearchParams({
                        term: potentialBase,
                        parentsOnly: 'true'
                    });

                    const baseUrl = `${baseURL}/skus/search?${baseParams.toString()}`;
                    console.log(`[Metadata] Retrying with base SKU: "${potentialBase}" from: ${baseUrl}`);
                    const baseResponse = await fetch(baseUrl, { cache: 'no-store' });
                    if (baseResponse.ok) {
                        result = await baseResponse.json();
                    }
                }
            }
        }

        if (result.skus && result.skus.length > 0) {
            const product = result.skus[0];
            const title = stripSizeSuffix(product.name);
            console.log(`[Metadata] Setting title to: ${title}`);

            return {
                title: title,
                description: product.description || `Buy ${title} on Vangarments`,
                openGraph: {
                    title: title,
                    description: product.description || `Buy ${title} on Vangarments`,
                    images: product.images?.[0]?.url ? [product.images[0].url] : [],
                }
            };
        } else {
            console.log(`[Metadata] No SKUs found for slug: "${slug}"`);
        }
    } catch (error) {
        console.error('[Metadata] Exception:', error);
    }

    // Fallback: Format the slug into a readable title
    const fallbackTitle = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    console.log(`[Metadata] Falling back to formatted slug: "${fallbackTitle}"`);
    return {
        title: fallbackTitle,
        description: `View details for ${fallbackTitle} on Vangarments`
    };
}

export default function Page() {
    return <ProductPageClient />;
}
