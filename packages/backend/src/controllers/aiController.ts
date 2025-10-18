import { Request, Response } from 'express';
import multer from 'multer';
import { AIProcessingService } from '../services/aiProcessingService';
import { AuthenticatedRequest } from '../utils/auth';

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.single('image');

export class AIController {
  /**
   * Process uploaded image for fashion item recognition
   */
  static async processImage(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_IMAGE',
            message: 'Image file is required',
          },
        });
      }

      const { buffer, originalname } = req.file;

      // Process the image with AI
      const analysisResult = await AIProcessingService.processItemImage(
        buffer,
        originalname
      );

      res.json({
        message: 'Image processed successfully',
        analysis: analysisResult,
        suggestions: {
          vufsData: {
            domain: analysisResult.domain,
            brand: analysisResult.detectedBrand,
            pieceType: analysisResult.detectedPieceType,
            color: analysisResult.detectedColor,
            material: analysisResult.detectedMaterial,
          },
          confidence: analysisResult.confidence,
          needsReview: analysisResult.confidence.overall < 80,
        },
      });
    } catch (error) {
      console.error('Process image error:', error);
      
      if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only image files are allowed',
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'PROCESSING_ERROR',
          message: 'An error occurred while processing the image',
        },
      });
    }
  }

  /**
   * Analyze existing item image by URL
   */
  static async analyzeImageUrl(req: Request, res: Response) {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          error: {
            code: 'MISSING_URL',
            message: 'Image URL is required',
          },
        });
      }

      // Fetch image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(400).json({
          error: {
            code: 'INVALID_URL',
            message: 'Could not fetch image from URL',
          },
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = imageUrl.split('/').pop() || 'image.jpg';

      // Process the image
      const analysisResult = await AIProcessingService.processItemImage(
        buffer,
        filename
      );

      res.json({
        message: 'Image analyzed successfully',
        analysis: analysisResult,
        suggestions: {
          vufsData: {
            domain: analysisResult.domain,
            brand: analysisResult.detectedBrand,
            pieceType: analysisResult.detectedPieceType,
            color: analysisResult.detectedColor,
            material: analysisResult.detectedMaterial,
          },
          confidence: analysisResult.confidence,
          needsReview: analysisResult.confidence.overall < 80,
        },
      });
    } catch (error) {
      console.error('Analyze image URL error:', error);
      res.status(500).json({
        error: {
          code: 'ANALYSIS_ERROR',
          message: 'An error occurred while analyzing the image',
        },
      });
    }
  }

  /**
   * Get AI processing capabilities and supported features
   */
  static async getCapabilities(req: Request, res: Response) {
    try {
      res.json({
        capabilities: {
          backgroundRemoval: true,
          brandDetection: true,
          pieceTypeDetection: true,
          colorDetection: true,
          materialDetection: true,
          textRecognition: true,
          customModelSupport: true,
        },
        supportedDomains: ['APPAREL', 'FOOTWEAR'],
        supportedBrands: ['Adidas®', 'Nike®', 'Zara®', 'H&M', 'Uniqlo®'], // Sample
        supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        maxFileSize: '10MB',
        processingTime: 'Typically 3-10 seconds',
        confidenceThreshold: 70,
      });
    } catch (error) {
      console.error('Get capabilities error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching capabilities',
        },
      });
    }
  }

  /**
   * Batch process multiple images
   */
  static async batchProcess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { imageUrls } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Array of image URLs is required',
          },
        });
      }

      if (imageUrls.length > 10) {
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_IMAGES',
            message: 'Maximum 10 images allowed per batch',
          },
        });
      }

      const results = [];

      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const imageUrl = imageUrls[i];
          const response = await fetch(imageUrl);
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const filename = `batch_${i}_${imageUrl.split('/').pop() || 'image.jpg'}`;

            const analysisResult = await AIProcessingService.processItemImage(
              buffer,
              filename
            );

            results.push({
              index: i,
              imageUrl,
              success: true,
              analysis: analysisResult,
            });
          } else {
            results.push({
              index: i,
              imageUrl,
              success: false,
              error: 'Could not fetch image',
            });
          }
        } catch (error) {
          results.push({
            index: i,
            imageUrl: imageUrls[i],
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        message: `Batch processing completed: ${successCount}/${imageUrls.length} images processed successfully`,
        results,
        summary: {
          total: imageUrls.length,
          successful: successCount,
          failed: imageUrls.length - successCount,
        },
      });
    } catch (error) {
      console.error('Batch process error:', error);
      res.status(500).json({
        error: {
          code: 'BATCH_PROCESSING_ERROR',
          message: 'An error occurred during batch processing',
        },
      });
    }
  }
}