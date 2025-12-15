import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

export interface LocalImageUploadResult {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  optimizedPath?: string;
  optimizedUrl?: string;
}

export class LocalStorageService {
  private static readonly STORAGE_ROOT = path.join(process.cwd(), 'storage');
  private static readonly IMAGES_DIR = path.join(this.STORAGE_ROOT, 'images');
  private static readonly UPLOADS_DIR = path.join(this.STORAGE_ROOT, 'uploads');
  private static readonly TEMP_DIR = path.join(this.STORAGE_ROOT, 'temp');

  // Configure multer for file uploads
  static readonly uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB (increased for video)
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'));
      }
    },
  }).array('image', 5); // Allow up to 5 files, field name 'image' (kept for compatibility)

  /**
   * Initialize storage directories
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.STORAGE_ROOT, { recursive: true });
      await fs.mkdir(this.IMAGES_DIR, { recursive: true });
      await fs.mkdir(this.UPLOADS_DIR, { recursive: true });
      await fs.mkdir(this.TEMP_DIR, { recursive: true });

      // Create subdirectories for organized storage
      await fs.mkdir(path.join(this.IMAGES_DIR, 'wardrobe'), { recursive: true });
      await fs.mkdir(path.join(this.IMAGES_DIR, 'profiles'), { recursive: true });
      await fs.mkdir(path.join(this.IMAGES_DIR, 'marketplace'), { recursive: true });
      await fs.mkdir(path.join(this.IMAGES_DIR, 'social'), { recursive: true });

      console.log('Local storage directories initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage directories:', error);
      throw error;
    }
  }

  /**
   * Upload and process file locally
   */
  static async uploadImage(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    category: 'wardrobe' | 'profiles' | 'marketplace' | 'social' = 'wardrobe',
    userId?: string
  ): Promise<LocalImageUploadResult & {
    thumbnailPath?: string;
    thumbnailUrl?: string;
    mediumPath?: string;
    mediumUrl?: string;
  }> {
    try {
      // Generate unique filename
      const fileId = uuidv4();
      const extension = path.extname(originalName) || (mimetype.startsWith('video/') ? '.mp4' : '.jpg');
      const filename = `${fileId}${extension}`;
      const isVideo = mimetype.startsWith('video/');

      // Create user-specific directory if userId provided
      let targetDir = path.join(this.IMAGES_DIR, category);
      if (userId) {
        targetDir = path.join(targetDir, userId);
        await fs.mkdir(targetDir, { recursive: true });
      }

      // Create thumbnails directory
      const thumbnailsDir = path.join(this.STORAGE_ROOT, 'images', 'thumbnails');
      await fs.mkdir(thumbnailsDir, { recursive: true });

      const filePath = path.join(targetDir, filename);
      const relativePath = path.relative(this.STORAGE_ROOT, filePath);

      // Write original file
      await fs.writeFile(filePath, buffer);

      let variants: any = {};

      if (!isVideo) {
        // Generate multiple variants concurrently for images
        const [optimizedPath, thumbnailPath, mediumPath] = await Promise.all([
          // Optimized version (800px max)
          (async () => {
            const optimizedFilename = `${fileId}_optimized${extension}`;
            const optimizedPath = path.join(targetDir, optimizedFilename);
            await this.optimizeImage(buffer, optimizedPath, mimetype);
            return path.relative(this.STORAGE_ROOT, optimizedPath);
          })(),

          // Thumbnail version (150px max)
          (async () => {
            const thumbnailFilename = `${fileId}_thumb${extension}`;
            const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
            await this.generateThumbnail(buffer, thumbnailPath, mimetype);
            return path.relative(this.STORAGE_ROOT, thumbnailPath);
          })(),

          // Medium version (400px max)
          (async () => {
            const mediumFilename = `${fileId}_medium${extension}`;
            const mediumPath = path.join(targetDir, mediumFilename);
            await this.generateMediumImage(buffer, mediumPath, mimetype);
            return path.relative(this.STORAGE_ROOT, mediumPath);
          })(),
        ]);

        variants = {
          optimizedPath,
          optimizedUrl: `/storage/${optimizedPath.replace(/\\/g, '/')}`,
          thumbnailPath,
          thumbnailUrl: `/storage/${thumbnailPath.replace(/\\/g, '/')}`,
          mediumPath,
          mediumUrl: `/storage/${mediumPath.replace(/\\/g, '/')}`,
        };
      }

      // Get file stats
      const stats = await fs.stat(filePath);

      const result = {
        id: fileId,
        originalName,
        filename,
        path: relativePath,
        url: `/storage/${relativePath.replace(/\\/g, '/')}`,
        size: stats.size,
        mimetype,
        ...variants
      };

      console.log(`File uploaded successfully: ${filename}`);
      return result;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize image using Sharp with advanced compression
   */
  private static async optimizeImage(
    buffer: Buffer,
    outputPath: string,
    mimetype: string
  ): Promise<void> {
    try {
      let sharpInstance = sharp(buffer).rotate(); // Auto-rotate based on EXIF

      // Get image metadata for optimization decisions
      const metadata = await sharpInstance.metadata();
      const { width, height, format } = metadata;

      // Determine optimal dimensions based on image size and usage
      let targetWidth = width;
      let targetHeight = height;

      if (width && height) {
        // For very large images, resize more aggressively
        if (width > 2000 || height > 2000) {
          const aspectRatio = width / height;
          if (aspectRatio > 1) {
            targetWidth = 1200;
            targetHeight = Math.round(1200 / aspectRatio);
          } else {
            targetHeight = 1200;
            targetWidth = Math.round(1200 * aspectRatio);
          }
        } else if (width > 1200 || height > 1200) {
          const aspectRatio = width / height;
          if (aspectRatio > 1) {
            targetWidth = 800;
            targetHeight = Math.round(800 / aspectRatio);
          } else {
            targetHeight = 800;
            targetWidth = Math.round(800 * aspectRatio);
          }
        }
      }

      // Apply resizing if needed
      if (targetWidth !== width || targetHeight !== height) {
        sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      // Apply format-specific optimizations with better compression
      if (mimetype.includes('jpeg') || mimetype.includes('jpg')) {
        sharpInstance = sharpInstance.jpeg({
          quality: 82, // Slightly lower quality for better compression
          progressive: true,
          mozjpeg: true,
          optimiseScans: true,
          optimiseCoding: true,
        });
      } else if (mimetype.includes('png')) {
        sharpInstance = sharpInstance.png({
          quality: 80,
          progressive: true,
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: true,
          palette: true, // Use palette for smaller files when possible
        });
      } else if (mimetype.includes('webp')) {
        sharpInstance = sharpInstance.webp({
          quality: 80,
          effort: 6,
          lossless: false,
          nearLossless: false,
          smartSubsample: true,
        });
      } else {
        // Convert other formats to JPEG for better compression
        sharpInstance = sharpInstance.jpeg({
          quality: 82,
          progressive: true,
          mozjpeg: true,
        });
      }

      // Apply additional optimizations
      sharpInstance = sharpInstance
        .sharpen() // Slight sharpening after resize
        .normalise(); // Normalize colors for better compression

      await sharpInstance.toFile(outputPath);

      // Log compression results
      const originalSize = buffer.length;
      const optimizedStats = await fs.stat(outputPath);
      const compressionRatio = ((originalSize - optimizedStats.size) / originalSize * 100).toFixed(1);

      console.log(`Image optimized: ${originalSize} bytes -> ${optimizedStats.size} bytes (${compressionRatio}% reduction)`);

    } catch (error) {
      console.error('Image optimization failed:', error);
      // If optimization fails, copy original file
      await fs.writeFile(outputPath, buffer);
    }
  }

  /**
   * Generate thumbnail image (150px max)
   */
  private static async generateThumbnail(
    buffer: Buffer,
    outputPath: string,
    mimetype: string
  ): Promise<void> {
    try {
      await sharp(buffer)
        .resize(150, 150, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 75,
          progressive: true,
        })
        .toFile(outputPath);
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      // Fallback: copy original file
      await fs.writeFile(outputPath, buffer);
    }
  }

  /**
   * Generate medium image (400px max)
   */
  private static async generateMediumImage(
    buffer: Buffer,
    outputPath: string,
    mimetype: string
  ): Promise<void> {
    try {
      let sharpInstance = sharp(buffer);

      const metadata = await sharpInstance.metadata();
      if (metadata.width && metadata.width > 400) {
        sharpInstance = sharpInstance.resize(400, null, {
          withoutEnlargement: true,
          fit: 'inside',
        });
      }

      if (mimetype.includes('jpeg') || mimetype.includes('jpg')) {
        sharpInstance = sharpInstance.jpeg({
          quality: 85,
          progressive: true,
        });
      } else if (mimetype.includes('png')) {
        sharpInstance = sharpInstance.png({
          quality: 85,
          compressionLevel: 8,
        });
      } else if (mimetype.includes('webp')) {
        sharpInstance = sharpInstance.webp({
          quality: 85,
        });
      } else {
        sharpInstance = sharpInstance.jpeg({
          quality: 85,
          progressive: true,
        });
      }

      await sharpInstance.toFile(outputPath);
    } catch (error) {
      console.error('Medium image generation failed:', error);
      await fs.writeFile(outputPath, buffer);
    }
  }

  /**
   * Delete image file and all its variants
   */
  static async deleteImage(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.STORAGE_ROOT, relativePath);
      const parsedPath = path.parse(fullPath);
      const baseFilename = parsedPath.name.replace(/_optimized|_thumb|_medium$/, '');

      // List of all possible variants to delete
      const variantsToDelete = [
        fullPath, // Original file
        path.join(parsedPath.dir, `${baseFilename}_optimized${parsedPath.ext}`),
        path.join(parsedPath.dir, `${baseFilename}_medium${parsedPath.ext}`),
        path.join(this.STORAGE_ROOT, 'images', 'thumbnails', `${baseFilename}_thumb${parsedPath.ext}`),
      ];

      let deletedCount = 0;

      for (const variantPath of variantsToDelete) {
        try {
          await fs.unlink(variantPath);
          deletedCount++;
        } catch (error) {
          // Variant might not exist, continue with others
        }
      }

      console.log(`Image deleted successfully: ${relativePath} (${deletedCount} variants removed)`);
      return deletedCount > 0;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  /**
   * Get image file info
   */
  static async getImageInfo(relativePath: string): Promise<{
    exists: boolean;
    size?: number;
    mimetype?: string;
    lastModified?: Date;
  }> {
    try {
      const fullPath = path.join(this.STORAGE_ROOT, relativePath);
      const stats = await fs.stat(fullPath);

      // Determine mimetype from extension
      const ext = path.extname(relativePath).toLowerCase();
      let mimetype = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') mimetype = 'image/jpeg';
      else if (ext === '.png') mimetype = 'image/png';
      else if (ext === '.webp') mimetype = 'image/webp';
      else if (ext === '.gif') mimetype = 'image/gif';

      return {
        exists: true,
        size: stats.size,
        mimetype,
        lastModified: stats.mtime,
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Clean up temporary files older than specified hours
   */
  static async cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
    try {
      const files = await fs.readdir(this.TEMP_DIR);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.TEMP_DIR, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} temporary files`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    categoryCounts: Record<string, number>;
  }> {
    try {
      const stats = {
        totalImages: 0,
        totalSize: 0,
        categoryCounts: {} as Record<string, number>,
      };

      const categories = ['wardrobe', 'profiles', 'marketplace', 'social'];

      for (const category of categories) {
        const categoryPath = path.join(this.IMAGES_DIR, category);
        try {
          const categoryStats = await this.getDirectoryStats(categoryPath);
          stats.totalImages += categoryStats.fileCount;
          stats.totalSize += categoryStats.totalSize;
          stats.categoryCounts[category] = categoryStats.fileCount;
        } catch (error) {
          stats.categoryCounts[category] = 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalImages: 0,
        totalSize: 0,
        categoryCounts: {},
      };
    }
  }

  /**
   * Get directory statistics recursively
   */
  private static async getDirectoryStats(dirPath: string): Promise<{
    fileCount: number;
    totalSize: number;
  }> {
    let fileCount = 0;
    let totalSize = 0;

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);

        if (item.isDirectory()) {
          const subStats = await this.getDirectoryStats(itemPath);
          fileCount += subStats.fileCount;
          totalSize += subStats.totalSize;
        } else if (item.isFile()) {
          const stats = await fs.stat(itemPath);
          fileCount++;
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return { fileCount, totalSize };
  }

  /**
   * Create a readable stream for an image
   */
  static createImageStream(relativePath: string): NodeJS.ReadableStream {
    const fullPath = path.join(this.STORAGE_ROOT, relativePath);
    return require('fs').createReadStream(fullPath);
  }

  /**
   * Check if image exists
   */
  static async imageExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.STORAGE_ROOT, relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}