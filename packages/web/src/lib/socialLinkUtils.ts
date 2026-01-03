/**
 * Extracts the domain from a URL, removing protocol, www prefix, and trailing paths.
 * @param url - The full URL (e.g., "https://www.vividasc.com.br/page")
 * @returns The domain (e.g., "vividasc.com.br")
 */
export function extractDomain(url: string | undefined | null): string {
    if (!url) return '';

    try {
        // Handle URLs without protocol
        let processedUrl = url;
        if (!url.includes('://')) {
            processedUrl = 'https://' + url;
        }

        const urlObj = new URL(processedUrl);
        let domain = urlObj.hostname;

        // Remove www. prefix if present
        if (domain.startsWith('www.')) {
            domain = domain.substring(4);
        }

        return domain;
    } catch {
        // If URL parsing fails, try regex fallback
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
        return match ? match[1] : url;
    }
}

/**
 * Gets the display label for a social link.
 * Priority: displayName > extracted domain for websites > platform name
 */
export function getSocialLinkLabel(link: { platform: string; url: string; displayName?: string }): string {
    // If there's a custom displayName, use it
    if (link.displayName) {
        return link.displayName;
    }

    // For website links, show the domain
    const platform = link.platform.toLowerCase();
    if (platform === 'website' || platform === 'site' || platform === 'web') {
        const domain = extractDomain(link.url);
        return domain || link.platform;
    }

    // For other platforms, capitalize the first letter
    return link.platform.charAt(0).toUpperCase() + link.platform.slice(1);
}

/**
 * Checks if a platform string represents a website link (case-insensitive).
 */
export function isWebsitePlatform(platform: string): boolean {
    const p = platform.toLowerCase();
    return p === 'website' || p === 'site' || p === 'web';
}
