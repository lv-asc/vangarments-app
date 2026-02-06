export interface ImageWithType {
    id?: string;
    url: string;
    type?: string;
    imageType?: string;
    sortOrder?: number;
    isPrimary?: boolean;
    aiAnalysis?: { originalImageId?: string };
    originalImageId?: string;
    [key: string]: any;
}

export interface ItemWithImages {
    id: string;
    images: ImageWithType[];
    [key: string]: any;
}

/**
 * Processes images for a wardrobe card based on the "No BG" preference.
 * 
 * @param item The wardrobe item containing images
 * @param showOriginalBackgrounds If true, shows original images. If false, prioritizes background-removed versions.
 * @returns A copy of the item with the 'images' array filtered and sorted for display
 */
export function processImagesForCard<T extends ItemWithImages>(item: T, showOriginalBackgrounds: boolean): T {
    const isProcessed = (img: ImageWithType) =>
        img.type === 'background_removed' || img.imageType === 'background_removed';

    // Sort all images by sortOrder first
    const sortedImages = [...(item.images || [])].sort((a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    // Get originals in sort order
    const originalImages = sortedImages.filter(img => !isProcessed(img));

    // Build image list for card
    let cardImages: ImageWithType[];

    if (!showOriginalBackgrounds) {
        // No BG mode: for each original, prefer its No BG version if available
        cardImages = originalImages.map(orig => {
            const noBgVersion = sortedImages.find(img =>
                isProcessed(img) &&
                (img.aiAnalysis?.originalImageId === orig.id || img.originalImageId === orig.id)
            );
            return noBgVersion || orig;
        });
    } else {
        // Original mode: just use originals
        cardImages = originalImages;
    }

    return {
        ...item,
        images: cardImages
    };
}
