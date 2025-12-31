import { Request, Response } from 'express';
import path from 'path';
import { LocalStorageService } from '../services/localStorageService';
import { AuthenticatedRequest } from '../utils/auth';
import multer from 'multer';

export class StorageController {
  /**
   * Middleware for handling image uploads
   */
  static uploadMiddleware = LocalStorageService.uploadMiddleware;

  /**
   * Upload an image to storage
   */
  static async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        });
        return;
      }

      const file = files[0];
      const category = (req.body.category as 'wardrobe' | 'profiles' | 'marketplace' | 'social' | 'documents') || 'social';

      const result = await LocalStorageService.uploadImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        category,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: result,
        url: result.url // Backward compatibility
      });
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Image upload failed',
        },
      });
    }
  }

  /**
   * Serve image files from local storage
   */
  static async serveImage(req: Request, res: Response): Promise<void> {
    try {
      const { category, userId, filename } = req.params;

      // Construct the relative path
      let relativePath: string;
      if (userId) {
        relativePath = path.join('images', category, userId, filename);
      } else {
        relativePath = path.join('images', category, filename);
      }

      // Check if image exists and get info
      const imageInfo = await LocalStorageService.getImageInfo(relativePath);

      if (!imageInfo.exists) {
        res.status(404).json({
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found',
          },
        });
        return;
      }

      // Set appropriate headers
      res.set({
        'Content-Type': imageInfo.mimetype || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Last-Modified': imageInfo.lastModified?.toUTCString(),
      });

      // Check if client has cached version
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince && imageInfo.lastModified) {
        const clientDate = new Date(ifModifiedSince);
        if (clientDate >= imageInfo.lastModified) {
          res.status(304).end();
          return;
        }
      }

      // Stream the image
      const imageStream = LocalStorageService.createImageStream(relativePath);

      imageStream.on('error', (error) => {
        console.error('Error streaming image:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              code: 'STREAM_ERROR',
              message: 'Error serving image',
            },
          });
        }
      });

      imageStream.pipe(res);
    } catch (error) {
      console.error('Serve image error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while serving the image',
        },
      });
    }
  }

  /**
   * Get storage statistics (admin only)
   */
  static async getStorageStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await LocalStorageService.getStorageStats();

      res.json({
        message: 'Storage statistics retrieved successfully',
        stats: {
          ...stats,
          totalSizeFormatted: formatBytes(stats.totalSize),
        },
      });
    } catch (error) {
      console.error('Get storage stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while retrieving storage statistics',
        },
      });
    }
  }

  /**
   * Clean up temporary files (admin only)
   */
  static async cleanupTempFiles(req: Request, res: Response): Promise<void> {
    try {
      const { olderThanHours = 24 } = req.body;

      const deletedCount = await LocalStorageService.cleanupTempFiles(olderThanHours);

      res.json({
        message: 'Temporary files cleaned up successfully',
        deletedCount,
      });
    } catch (error) {
      console.error('Cleanup temp files error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while cleaning up temporary files',
        },
      });
    }
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}