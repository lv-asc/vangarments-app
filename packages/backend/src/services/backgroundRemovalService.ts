import { removeBackground, Config } from '@imgly/background-removal-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export class BackgroundRemovalService {
    /**
     * Remove background from an image buffer
     * @param imageBuffer The original image buffer
     * @param config Optional configuration for the background removal
     * @returns Processed image buffer with background removed
     */
    static async removeBackground(imageBuffer: Buffer, config?: Config): Promise<Buffer> {
        console.log('BackgroundRemovalService: Starting background removal...');
        if (config) {
            console.log('BackgroundRemovalService: Using custom config:', JSON.stringify(config));
        }
        const startTime = Date.now();

        try {
            // Create a Blob from the buffer for imgly
            // Detect mime type using sharp to ensure imgly handles it correctly
            const metadata = await sharp(imageBuffer).metadata();
            const mimeType = metadata.format === 'jpeg' ? 'image/jpeg'
                : metadata.format === 'png' ? 'image/png'
                    : metadata.format === 'webp' ? 'image/webp'
                        : 'image/png'; // Default fallback

            const blob = new Blob([imageBuffer as any], { type: mimeType });

            // Calculate absolute path to resources in root node_modules
            // Assuming we are in packages/backend, root is two levels up
            const rootDir = path.resolve(process.cwd(), '../../');
            const publicPath = `file://${path.join(rootDir, 'node_modules/@imgly/background-removal-node/dist/')}`;

            // Remove background
            const resultBlob = await removeBackground(blob, {
                publicPath,
                progress: (key, current, total) => {
                    // Log progress periodically if needed
                    if (current === total) {
                        console.log(`BackgroundRemovalService: ${key} completed`);
                    }
                },
                ...config
            });

            // Convert Blob back to Buffer
            const arrayBuffer = await resultBlob.arrayBuffer();
            const resultBuffer = Buffer.from(arrayBuffer);

            const duration = (Date.now() - startTime) / 1000;
            console.log(`BackgroundRemovalService: Background removal completed in ${duration.toFixed(2)}s`);

            return resultBuffer;
        } catch (error) {
            console.error('BackgroundRemovalService: Failed to remove background:', error);
            throw new Error(`Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Helper to determine if an image should have its background removed by default
     * (e.g., based on its type or user settings)
     */
    static shouldRemoveBackground(imageType: string): boolean {
        const typesToAutoProcess = ['front', 'back'];
        return typesToAutoProcess.includes(imageType.toLowerCase());
    }
}
