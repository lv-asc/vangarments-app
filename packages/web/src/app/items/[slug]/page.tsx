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

        // Extract meaningful search terms from the slug
        // Slug format: brand-product-code or product-name-with-dashes
        // Try to extract product name keywords (skip common short words, brand codes, etc.)
        const slugParts = slug.split('-');
        const meaningfulParts = slugParts.filter(part =>
            part.length > 2 && !['asc', 'sk', 'ct', 'rf', 'teh', 'tsh', 'bk', 'm'].includes(part.toLowerCase())
        );

        // Create search term from meaningful parts
        const searchTerm = meaningfulParts.join(' ');
        console.log(`[Metadata] Extracted search term: "${searchTerm}" from slug parts: ${JSON.stringify(meaningfulParts)}`);

        const searchParams = new URLSearchParams({
            term: searchTerm || slug,
            parentsOnly: 'true'
        });

        const url = `${baseURL}/skus/search?${searchParams.toString()}`;
        console.log(`[Metadata] Fetching from: ${url}`);

        let response = await fetch(url, {
            cache: 'no-store'
        });

        if (response.ok) {
            let result = await response.json();
            console.log(`[Metadata] Found ${result.skus?.length || 0} SKUs`);

            // If no results, try stripping size suffix (e.g. -xl, -l, -s)
            if (!result.skus || result.skus.length === 0) {
                const parts = slug.split('-');
                if (parts.length > 1) {
                    const potentialSize = parts[parts.length - 1];
                    // Check if potential size is a common size
                    if (/^(x{0,3}s|x{0,4}l|m|[0-9]+)$/i.test(potentialSize)) {
                        parts.pop();
                        const potentialBase = parts.join('-');
                        // Try to extract meaningful parts again from the base
                        const baseSlugParts = potentialBase.split('-');
                        const baseMeaningfulParts = baseSlugParts.filter(part =>
                            part.length > 2 && !['asc', 'sk', 'ct', 'rf', 'teh', 'tsh', 'bk', 'm'].includes(part.toLowerCase())
                        );
                        const baseSearchTerm = baseMeaningfulParts.join(' ');

                        const baseParams = new URLSearchParams({
                            term: baseSearchTerm || potentialBase,
                            parentsOnly: 'true'
                        });

                        const baseUrl = `${baseURL}/skus/search?${baseParams.toString()}`;
                        console.log(`[Metadata] Retrying with stripped suffix from: ${baseUrl}`);
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
                console.log(`[Metadata] No SKUs found for term: "${searchTerm || slug}"`);
            }
        } else {
            console.log(`[Metadata] API Error: ${response.status}`);
        }
    } catch (error) {
        console.error('[Metadata] Exception:', error);
    }

    console.log(`[Metadata] Falling back to "Product"`);
    return {
        title: 'Product',
    };
}

export default function Page() {
    return <ProductPageClient />;
}
