import { removeBackground, Config } from '@imgly/background-removal-node';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Extended configuration options for background removal
export interface ExtendedConfig extends Config {
    /**
     * Quality setting - affects model size and processing time
     * - 'fast': Small model, fastest processing (good for previews)
     * - 'medium': Medium model, balanced quality/speed (default)
     * - 'high': Large model, best quality (slowest)
     */
    quality?: 'fast' | 'medium' | 'high';

    /**
     * Edge feathering radius in pixels (0-10, default 0 = no feathering)
     * Softens edges for more natural blending
     */
    featherRadius?: number;

    /**
     * Attempt to retain drop shadow (experimental)
     */
    retainShadow?: boolean;

    /**
     * Output aspect ratio - if set, centers garment in padded canvas
     * Options: '1:1', '4:5', '3:4', 'original'
     */
    outputRatio?: '1:1' | '4:5' | '3:4' | 'original';
}

export class BackgroundRemovalService {
    /**
     * Remove background from an image buffer with enhanced options
     * @param imageBuffer The original image buffer
     * @param config Optional configuration for the background removal
     * @returns Processed image buffer with background removed
     */
    static async removeBackground(imageBuffer: Buffer, config?: ExtendedConfig): Promise<Buffer> {
        console.log('BackgroundRemovalService: Starting background removal...');
        const startTime = Date.now();

        // Extract extended options
        const quality = config?.quality || 'medium';
        const featherRadius = config?.featherRadius || 0;
        const outputRatio = config?.outputRatio || 'original';
        const retainShadow = config?.retainShadow || false;

        // Map quality to imgly model configuration
        const modelConfig = this.getModelConfig(quality);

        console.log(`BackgroundRemovalService: Quality=${quality}, Feather=${featherRadius}px, Ratio=${outputRatio}`);

        try {
            // Auto-rotate image based on EXIF data before processing
            // This ensures the image isn't sideways if it has orientation metadata
            const rotatedBuffer = await sharp(imageBuffer).rotate().toBuffer();

            // Create a Blob from the buffer for imgly
            const metadata = await sharp(rotatedBuffer).metadata();
            const mimeType = metadata.format === 'jpeg' ? 'image/jpeg'
                : metadata.format === 'png' ? 'image/png'
                    : metadata.format === 'webp' ? 'image/webp'
                        : 'image/png';

            const blob = new Blob([rotatedBuffer as any], { type: mimeType });

            // Calculate absolute path to resources
            const rootDir = path.resolve(process.cwd(), '../../');
            const publicPath = `file://${path.join(rootDir, 'node_modules/@imgly/background-removal-node/dist/')}`;

            // Remove background with imgly
            const resultBlob = await removeBackground(blob, {
                publicPath,
                progress: (key, current, total) => {
                    if (current === total) {
                        console.log(`BackgroundRemovalService: ${key} completed`);
                    }
                },
                ...modelConfig,
                ...config
            });

            // Convert Blob back to Buffer
            const arrayBuffer = await resultBlob.arrayBuffer();
            let resultBuffer = Buffer.from(arrayBuffer);

            // Apply edge feathering if requested
            if (featherRadius > 0) {
                resultBuffer = await this.applyEdgeFeathering(resultBuffer, featherRadius);
            }

            // Apply aspect ratio padding if requested
            if (outputRatio !== 'original') {
                resultBuffer = await this.applyAspectRatio(resultBuffer, outputRatio);
            }

            const duration = (Date.now() - startTime) / 1000;
            console.log(`BackgroundRemovalService: Background removal completed in ${duration.toFixed(2)}s`);

            return resultBuffer;
        } catch (error) {
            console.error('BackgroundRemovalService: Failed to remove background:', error);
            throw new Error(`Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get model configuration based on quality setting
     */
    private static getModelConfig(quality: 'fast' | 'medium' | 'high'): Partial<Config> {
        switch (quality) {
            case 'fast':
                return { model: 'small' };
            case 'high':
                return { model: 'large' };
            case 'medium':
            default:
                return { model: 'medium' };
        }
    }

    /**
     * Apply edge feathering to soften mask edges
     * Uses alpha channel blur for natural edge blending
     */
    private static async applyEdgeFeathering(imageBuffer: Buffer, radius: number): Promise<Buffer> {
        console.log(`BackgroundRemovalService: Applying edge feather radius=${radius}px`);

        const clampedRadius = Math.min(Math.max(radius, 1), 10);
        const sigma = clampedRadius / 2;

        // Extract alpha channel, blur it slightly, then recombine
        const image = sharp(imageBuffer);
        const { width, height } = await image.metadata();

        // Get raw RGBA data
        const { data, info } = await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Blur only the alpha channel using sharp
        // Create a separate alpha image, blur it, then recombine
        const alphaChannel = Buffer.alloc(info.width * info.height);
        for (let i = 0; i < info.width * info.height; i++) {
            alphaChannel[i] = data[i * 4 + 3];
        }

        // Blur the alpha channel
        const blurredAlpha = await sharp(alphaChannel, {
            raw: { width: info.width, height: info.height, channels: 1 }
        })
            .blur(sigma)
            .raw()
            .toBuffer();

        // Recombine with blurred alpha
        for (let i = 0; i < info.width * info.height; i++) {
            data[i * 4 + 3] = blurredAlpha[i];
        }

        // Output as PNG with new alpha
        return sharp(data, {
            raw: { width: info.width, height: info.height, channels: 4 }
        })
            .png()
            .toBuffer();
    }

    /**
     * Apply aspect ratio padding to center garment in canvas
     */
    private static async applyAspectRatio(imageBuffer: Buffer, ratio: '1:1' | '4:5' | '3:4'): Promise<Buffer> {
        console.log(`BackgroundRemovalService: Applying aspect ratio ${ratio}`);

        const image = sharp(imageBuffer);
        const metadata = await image.metadata();
        const { width = 0, height = 0 } = metadata;

        let targetWidth: number;
        let targetHeight: number;

        switch (ratio) {
            case '1:1':
                targetWidth = targetHeight = Math.max(width, height);
                break;
            case '4:5':
                if (width / height > 4 / 5) {
                    targetWidth = width;
                    targetHeight = Math.round(width * 5 / 4);
                } else {
                    targetHeight = height;
                    targetWidth = Math.round(height * 4 / 5);
                }
                break;
            case '3:4':
                if (width / height > 3 / 4) {
                    targetWidth = width;
                    targetHeight = Math.round(width * 4 / 3);
                } else {
                    targetHeight = height;
                    targetWidth = Math.round(height * 3 / 4);
                }
                break;
            default:
                return imageBuffer;
        }

        // Add padding to center the image
        const paddingX = Math.round((targetWidth - width) / 2);
        const paddingY = Math.round((targetHeight - height) / 2);

        return sharp(imageBuffer)
            .extend({
                top: paddingY,
                bottom: paddingY,
                left: paddingX,
                right: paddingX,
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
            })
            .png()
            .toBuffer();
    }

    /**
     * Helper to determine if an image should have its background removed by default
     */
    static shouldRemoveBackground(imageType: string): boolean {
        const typesToAutoProcess = ['front', 'back'];
        return typesToAutoProcess.includes(imageType.toLowerCase());
    }
}
