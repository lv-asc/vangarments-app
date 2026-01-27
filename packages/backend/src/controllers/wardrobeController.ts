import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';
import multer from 'multer';
import { VUFSItemModel } from '../models/VUFSItem';
import { ItemImageModel } from '../models/ItemImage';
import { AIProcessingService } from '../services/aiProcessingService';
import { BackgroundRemovalService } from '../services/backgroundRemovalService';
import { LocalStorageService } from '../services/localStorageService';
import { AuthenticatedRequest } from '../utils/auth';
import { VUFSUtils } from '../utils/vufs';
import { WardrobeValidationService } from '../services/wardrobeValidationService';
import { VUFSManagementService } from '../services/vufsManagementService';
import {
  CategoryHierarchy,
  BrandHierarchy,
  ItemMetadata,
  ItemCondition,
  OwnershipInfo
} from '@vangarments/shared';

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

export interface WardrobeItemRequest {
  category?: CategoryHierarchy;
  brand?: BrandHierarchy;
  metadata?: ItemMetadata;
  condition?: ItemCondition;
  ownership?: OwnershipInfo;
  useAI?: boolean;
}

export class WardrobeController {
  /**
   * Upload and process wardrobe item with AI analysis
   */
  static uploadMiddleware = upload.array('images', 10);

  static async createItemWithAI(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('createItemWithAI called');
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      // Handle input data early to check for pre-uploaded images
      let inputData = req.body;
      if (req.body.data) {
        try {
          inputData = JSON.parse(req.body.data);
          console.log('Parsed input data from body.data:', JSON.stringify(inputData, null, 2));
        } catch (e) {
          console.warn('Failed to parse data field as JSON, using raw body');
        }
      }

      const files = req.files as Express.Multer.File[];
      const bodyImages = inputData.images;

      console.log(`Received ${files?.length || 0} files and ${bodyImages?.length || 0} body images`);

      // If no files and no body images, validation fails
      if ((!files || files.length === 0) && (!bodyImages || bodyImages.length === 0)) {
        res.status(400).json({
          error: {
            code: 'INVALID_IMAGES',
            message: 'At least one image is required',
          },
        });
        return;
      }

      // Validate image uploads only if files are provided
      if (files && files.length > 0) {
        const imageValidation = WardrobeValidationService.validateImageUpload(files, 10);
        if (!imageValidation.isValid) {
          console.error('Image validation failed:', imageValidation.errors);
          res.status(400).json({
            error: {
              code: 'INVALID_IMAGES',
              message: 'Image validation failed',
              details: imageValidation.errors,
            },
          });
          return;
        }
      }

      const useAI = inputData.useAI !== undefined ? inputData.useAI : true;
      let aiAnalysis = null;
      let vufsExtraction = null;

      // Process with AI only if files are provided (AI processing relies on buffer)
      if (useAI && files && files.length > 0) {
        const primaryImage = files[0];
        try {
          vufsExtraction = await AIProcessingService.extractVUFSProperties(
            primaryImage.buffer,
            primaryImage.originalname
          );

          aiAnalysis = await AIProcessingService.processItemImage(
            primaryImage.buffer,
            primaryImage.originalname
          );
        } catch (aiError) {
          console.warn('AI processing failed, continuing without AI:', aiError);
        }
      }

      // Merge AI suggestions with user input
      const rawItemData = WardrobeController.mergeAIWithUserInput(inputData, vufsExtraction);

      // Sanitize and validate the merged data
      const sanitizedData = WardrobeValidationService.sanitizeItemData(rawItemData);
      const validation = WardrobeValidationService.validateWardrobeItem(sanitizedData, false);

      if (!validation.isValid) {
        console.error('Validation failed:', JSON.stringify(validation.errors, null, 2));
        console.error('Validation warnings:', JSON.stringify(validation.warnings, null, 2));
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid item data',
            details: validation.errors,
            warnings: validation.warnings,
          },
        });
        return;
      }

      const itemData = sanitizedData;

      // Create VUFS item
      console.log('Creating VUFS item in database...');
      let vufsItem;
      try {
        vufsItem = await VUFSItemModel.create({
          ownerId: req.user.userId,
          category: itemData.category!,
          brand: itemData.brand!,
          metadata: itemData.metadata as any,
          condition: { ...(itemData.condition as any), defects: (itemData.condition as any).defects || [] } as any,
          ownership: itemData.ownership as any,
        });
        console.log('VUFS item created:', vufsItem.id);
      } catch (dbError) {
        console.error('Failed to create VUFS item in DB:', dbError);
        throw dbError; // Re-throw to be caught by outer catch
      }

      // Upload and store images
      const imageRecords = [];

      // Process files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`Processing file ${i + 1}/${files.length}: ${file.originalname}`);

          try {
            // Upload to local storage
            const uploadResult = await LocalStorageService.uploadImage(
              file.buffer,
              file.originalname,
              file.mimetype,
              'wardrobe',
              req.user.userId
            );
            console.log(`File uploaded locally: ${uploadResult.path}`);

            // Determine image type
            const imageType = i === 0 ? 'front' : (i === 1 ? 'back' : 'detail');

            // Store image record with AI analysis for primary image
            const imageRecord = await ItemImageModel.create({
              itemId: vufsItem.id,
              imageUrl: uploadResult.optimizedUrl || uploadResult.url,
              imageType: imageType as any,
              isPrimary: i === 0,
              aiAnalysis: i === 0 ? aiAnalysis : undefined,
              fileSize: uploadResult.size,
              mimeType: uploadResult.mimetype,
            });
            console.log(`Image record created in DB: ${imageRecord.id}`);

            imageRecords.push(imageRecord);
          } catch (imgError) {
            console.error(`Failed to process image ${file.originalname}:`, imgError);
          }
        }
      }

      // Process body images if any (pre-uploaded URLs)
      if (bodyImages && bodyImages.length > 0) {
        for (let i = 0; i < bodyImages.length; i++) {
          const img = bodyImages[i];
          console.log(`Processing body image ${i + 1}/${bodyImages.length}: ${img.url}`);

          try {
            const imageType = img.imageType || (i === 0 ? 'front' : (i === 1 ? 'back' : 'detail'));

            const imageRecord = await ItemImageModel.create({
              itemId: vufsItem.id,
              imageUrl: img.url,
              imageType: imageType as any,
              isPrimary: img.isPrimary || i === 0,
              fileSize: img.size || 0,
              mimeType: img.mimetype || 'image/jpeg',
            });
            console.log(`Image record created from body in DB: ${imageRecord.id}`);

            imageRecords.push(imageRecord);
          } catch (imgError) {
            console.error(`Failed to process body image ${img.url}:`, imgError);
          }
        }
      }

      if (imageRecords.length === 0) {
        throw new Error('All image processing failed');
      }

      // Get complete item with images
      const itemWithImages = {
        ...vufsItem,
        images: imageRecords.map(img => ({
          ...img,
          url: img.imageUrl.startsWith('http')
            ? img.imageUrl
            : `${process.env.API_URL || 'http://localhost:3001'}/${img.imageUrl}`
        })),
      };

      res.status(201).json({
        message: 'Wardrobe item created successfully',
        item: itemWithImages,
        aiAnalysis: aiAnalysis ? {
          confidence: aiAnalysis.confidence,
          suggestions: vufsExtraction?.suggestions,
          backgroundRemoved: aiAnalysis.backgroundRemoved,
        } : null,
      });
    } catch (error) {
      console.error('Create wardrobe item error details:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the item',
        },
      });
    }
  }

  /**
   * Get user's wardrobe items with filtering
   */
  static async getUserWardrobe(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const {
        category,
        brand,
        condition,
        visibility,
        search,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        category: category ? { page: category as string } : undefined,
        brand: brand as string,
        condition: condition as string,
        visibility: visibility as string,
        search: search as string,
      };

      const items = await VUFSItemModel.findByOwner(req.user.userId, filters);

      // Add pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedItems = items.slice(startIndex, endIndex);

      // Fetch images for each item
      const itemsWithImages = await Promise.all(
        paginatedItems.map(async (item) => {
          const images = await ItemImageModel.findByItemId(item.id);
          const imagesWithUrls = images.map(img => ({
            ...img,
            url: img.imageUrl.startsWith('http')
              ? img.imageUrl
              : `${process.env.API_URL || 'http://localhost:3001'}/${img.imageUrl}`
          }));
          return {
            ...item,
            images: imagesWithUrls,
          };
        })
      );

      res.json({
        items: itemsWithImages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: items.length,
          totalPages: Math.ceil(items.length / limitNum),
        },
      });
    } catch (error) {
      console.error('Get wardrobe error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching wardrobe items',
        },
      });
    }
  }

  /**
   * Get single wardrobe item by ID
   */
  static async getItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;

      const item = await VUFSItemModel.findById(id);
      if (!item) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      // Check ownership or visibility
      if (item.ownerId !== req.user.userId && item.ownership.visibility !== 'public') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
        return;
      }

      // Fetch images
      const images = await ItemImageModel.findByItemId(item.id);

      // Construct working URLs for images
      // Assuming backend is serving 'images' statically at root
      // and image.imageUrl is something like 'images/wardrobe/...'
      const imagesWithUrls = images.map(img => ({
        ...img,
        url: img.imageUrl.startsWith('http')
          ? img.imageUrl
          : `${process.env.API_URL || 'http://localhost:3001'}/${img.imageUrl}`
      }));

      const itemWithImages = {
        ...item,
        images: imagesWithUrls,
      };

      res.json({
        data: {
          item: itemWithImages
        }
      });
    } catch (error) {
      console.error('Get item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the item',
        },
      });
    }
  }

  /**
   * Update wardrobe item with AI assistance
   */
  static async updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;
      const updateData = req.body;

      // Check ownership
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      if (existingItem.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own items',
          },
        });
        return;
      }

      // Sanitize and validate update data
      const sanitizedUpdateData = WardrobeValidationService.sanitizeItemData(updateData);
      const validation = WardrobeValidationService.validateWardrobeItem(sanitizedUpdateData, true);

      if (!validation.isValid) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validation.errors,
            warnings: validation.warnings,
          },
        });
        return;
      }

      const validatedUpdateData = sanitizedUpdateData;

      const updatedItem = await VUFSItemModel.update(id, validatedUpdateData as any);

      res.json({
        message: 'Wardrobe item updated successfully',
        item: updatedItem,
      });
    } catch (error) {
      console.error('Update wardrobe item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the item',
        },
      });
    }
  }

  /**
   * Provide AI feedback for training
   */
  static async provideFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { itemId, aiSuggestions, userCorrections, feedbackType } = req.body;

      const feedback = {
        itemId,
        userId: req.user.userId,
        aiSuggestions,
        userCorrections,
        feedbackType,
        timestamp: new Date(),
      };

      await AIProcessingService.storeFeedback(feedback);

      res.json({
        message: 'Feedback stored successfully',
      });
    } catch (error) {
      console.error('Store feedback error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while storing feedback',
        },
      });
    }
  }

  /**
   * Reprocess item with updated AI
   */
  static async reprocessWithAI(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;
      const { imageUrl } = req.body;

      // Check ownership
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      if (existingItem.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only reprocess your own items',
          },
        });
        return;
      }

      if (!imageUrl) {
        res.status(400).json({
          error: {
            code: 'MISSING_IMAGE',
            message: 'Image URL is required for reprocessing',
          },
        });
        return;
      }

      // Download image and reprocess
      // This is a simplified version - in production you'd handle this more robustly
      const response = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      const vufsExtraction = await AIProcessingService.extractVUFSProperties(
        imageBuffer,
        'reprocess.jpg'
      );

      res.json({
        message: 'Item reprocessed successfully',
        suggestions: vufsExtraction,
      });
    } catch (error) {
      console.error('Reprocess item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while reprocessing the item',
        },
      });
    }
  }

  /**
   * Soft-delete wardrobe item (moves to trash)
   */
  static async deleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;

      // Check ownership
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      if (existingItem.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own items',
          },
        });
        return;
      }

      // Soft-delete the item (moves to trash)
      const deleted = await VUFSItemModel.delete(id);

      if (!deleted) {
        res.status(500).json({
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to delete wardrobe item',
          },
        });
        return;
      }

      res.json({
        message: 'Item moved to trash. It will be permanently deleted in 14 days.',
        deletedItemId: id,
      });
    } catch (error) {
      console.error('Delete wardrobe item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the item',
        },
      });
    }
  }

  /**
   * Get user's trash items (soft-deleted)
   */
  static async getTrashItems(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const items = await VUFSItemModel.findDeletedByOwner(req.user.userId);

      // Calculate days until permanent deletion for each item
      const itemsWithExpiry = items.map(item => {
        const deletedAt = item.deletedAt!;
        const expiresAt = new Date(deletedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          ...item,
          expiresAt,
          daysRemaining,
          images: item.images.map(img => ({
            ...img,
            url: img.url.startsWith('http')
              ? img.url
              : `${process.env.API_URL || 'http://localhost:3001'}/${img.url}`
          })),
        };
      });

      res.json({
        items: itemsWithExpiry,
        total: items.length,
      });
    } catch (error) {
      console.error('Get trash items error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching trash items',
        },
      });
    }
  }

  /**
   * Restore item from trash
   */
  static async restoreItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;

      // Check ownership
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in trash',
          },
        });
        return;
      }

      if (existingItem.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only restore your own items',
          },
        });
        return;
      }

      const restored = await VUFSItemModel.restore(id);

      if (!restored) {
        res.status(500).json({
          error: {
            code: 'RESTORE_FAILED',
            message: 'Failed to restore item',
          },
        });
        return;
      }

      res.json({
        message: 'Item restored successfully',
        restoredItemId: id,
      });
    } catch (error) {
      console.error('Restore item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while restoring the item',
        },
      });
    }
  }

  /**
   * Permanently delete item from trash
   */
  static async permanentDeleteItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;

      // Check ownership
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found',
          },
        });
        return;
      }

      if (existingItem.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own items',
          },
        });
        return;
      }

      // Get associated images before permanent deletion
      const images = await ItemImageModel.findByItemId(id);

      // Permanently delete the item
      const deleted = await VUFSItemModel.permanentDelete(id);

      if (!deleted) {
        res.status(500).json({
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to permanently delete item',
          },
        });
        return;
      }

      // Delete associated image files from local storage
      for (const image of images) {
        try {
          const urlPath = image.imageUrl.replace('/storage/', '');
          await LocalStorageService.deleteImage(urlPath);
        } catch (error) {
          console.warn(`Failed to delete image file: ${image.imageUrl}`, error);
        }
      }

      res.json({
        message: 'Item permanently deleted',
        deletedItemId: id,
        deletedImages: images.length,
      });
    } catch (error) {
      console.error('Permanent delete item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while permanently deleting the item',
        },
      });
    }
  }

  /**
   * Get VUFS options for item creation form
   */
  static async getVUFSOptions(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const [categories, brands, colors, materials, careInstructions] = await Promise.all([
        VUFSManagementService.getCategories(),
        VUFSManagementService.getBrands(),
        VUFSManagementService.getColors(),
        VUFSManagementService.getMaterials(),
        VUFSManagementService.getCareInstructions(),
      ]);

      res.json({
        message: 'VUFS options retrieved successfully',
        options: {
          categories,
          brands,
          colors,
          materials,
          careInstructions,
        },
      });
    } catch (error) {
      console.error('Get VUFS options error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching VUFS options',
        },
      });
    }
  }

  /**
   * Get wardrobe statistics
   */
  static async getWardrobeStats(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const stats = await VUFSItemModel.getStatsByOwner(req.user.userId);

      res.json({ stats });
    } catch (error) {
      console.error('Get wardrobe stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching statistics',
        },
      });
    }
  }

  /**
   * Merge AI suggestions with user input
   */

  /**
   * Analyze item image for VUFS properties without creating it
   */
  static async analyzeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
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
            code: 'NO_IMAGE',
            message: 'No image provided for analysis',
          },
        });
        return;
      }

      const image = files[0];

      console.log('=== Analyzing image:', image.originalname, '===');

      // Extract VUFS properties
      const vufsExtraction = await AIProcessingService.extractVUFSProperties(
        image.buffer,
        image.originalname
      );

      console.log('VUFS Extraction result:', JSON.stringify(vufsExtraction, null, 2));

      // We don't perform full processing/upload here, just analysis
      // But we can verify if background removal is possible
      // In a real scenario, we might return a temporary URL of the processed image
      // For now, we return the extraction data

      res.json({
        message: 'Analysis complete',
        analysis: vufsExtraction,
      });

    } catch (error) {
      console.error('Analyze item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while analyzing the item',
        },
      });
    }
  }

  private static mergeAIWithUserInput(
    userInput: WardrobeItemRequest,
    aiExtraction: any
  ): WardrobeItemRequest {
    const merged: WardrobeItemRequest = { ...userInput };

    if (aiExtraction) {
      // Use AI suggestions as defaults, but prioritize user input
      if (!merged.category && aiExtraction.category) {
        merged.category = aiExtraction.category;
      }

      if (!merged.brand && aiExtraction.brand) {
        merged.brand = aiExtraction.brand;
      }

      if (!merged.metadata && aiExtraction.metadata) {
        merged.metadata = aiExtraction.metadata;
      }

      if (!merged.condition && aiExtraction.condition) {
        merged.condition = aiExtraction.condition;
      }
    }

    // Set default ownership if not provided
    if (!merged.ownership) {
      merged.ownership = {
        status: 'owned',
        visibility: 'public',
      };
    }

    return merged;
  }

  /**
   * Batch remove background from multiple images
   */
  static async batchRemoveBackground(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params;
      const { imageIds, options = {} } = req.body;

      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'imageIds array is required',
          },
        });
        return;
      }

      // 1. Fetch item and check ownership
      const item = await VUFSItemModel.findById(id);
      if (!item) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      if (item.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only process your own items',
          },
        });
        return;
      }

      // 2. Fetch all images
      const images = await ItemImageModel.findByItemId(id);
      const successfulIds: string[] = [];
      const results = [];

      // 3. Process each image
      for (const imageId of imageIds) {
        const originalImage = images.find(img => img.id === imageId);
        if (!originalImage) {
          results.push({ imageId, status: 'error', message: 'Image not found' });
          continue;
        }

        try {
          // Load image buffer
          let imageBuffer: Buffer;
          if (originalImage.imageUrl.startsWith('http')) {
            const response = await fetch(originalImage.imageUrl);
            imageBuffer = Buffer.from(await response.arrayBuffer());
          } else {
            const relativePath = originalImage.imageUrl.startsWith('/')
              ? originalImage.imageUrl.replace(/^\//, '').replace(/^storage\//, '')
              : originalImage.imageUrl.replace(/^storage\//, '');

            const fullPath = path.join(process.cwd(), 'storage', relativePath);
            imageBuffer = await fs.readFile(fullPath);
          }

          // Generate hash key for duplicate check? Maybe later.
          // Perform background removal
          const processedBuffer = await BackgroundRemovalService.removeBackground(imageBuffer, options);

          // Save processed image
          const originalFilename = path.basename(originalImage.imageUrl);

          // Check for existing background_removed image
          const existingBgRemoved = images.find(img =>
            img.imageType === 'background_removed' &&
            img.aiAnalysis?.originalImageId === originalImage.id
          );

          if (existingBgRemoved) {
            await ItemImageModel.delete(existingBgRemoved.id);
            // Try delete local file
            if (!existingBgRemoved.imageUrl.startsWith('http')) {
              try {
                const oldPath = path.join(process.cwd(), existingBgRemoved.imageUrl);
                await fs.unlink(oldPath).catch(() => { });
              } catch (e) { }
            }
          }

          const newFilename = `bg_removed_${Date.now()}_${originalFilename}`; // Ensure uniqueness with timestamp

          const uploadResult = await LocalStorageService.uploadImage(
            processedBuffer,
            newFilename,
            'image/png',
            'wardrobe',
            req.user.userId
          );

          const bgRemovedImage = await ItemImageModel.create({
            itemId: item.id,
            imageUrl: uploadResult.optimizedUrl || uploadResult.url,
            imageType: 'background_removed',
            isPrimary: false,
            aiAnalysis: {
              backgroundRemoved: true,
              originalImageId: originalImage.id
            },
            fileSize: uploadResult.size,
            mimeType: uploadResult.mimetype,
          });

          successfulIds.push(imageId);
          results.push({
            imageId,
            status: 'success',
            image: {
              ...bgRemovedImage,
              url: bgRemovedImage.imageUrl.startsWith('http')
                ? bgRemovedImage.imageUrl
                : `${process.env.API_URL || 'http://localhost:3001'}/${bgRemovedImage.imageUrl}`
            }
          });
        } catch (err: any) {
          console.error(`Error processing image ${imageId}:`, err);
          results.push({ imageId, status: 'error', message: err.message });
        }
      }

      res.status(200).json({
        message: 'Batch processing completed',
        results,
        successfulCount: successfulIds.length
      });

    } catch (error) {
      console.error('Batch remove background error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during batch processing',
        },
      });
    }
  }

  /**
   * Save a manually processed image (manual override)
   */
  static async saveProcessedImage(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id, imageId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          error: {
            code: 'MISSING_FILE',
            message: 'No image file uploaded',
          },
        });
        return;
      }

      const file = files[0];

      // 1. Fetch item and check ownership
      const item = await VUFSItemModel.findById(id);
      if (!item) {
        res.status(404).json({ error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' } });
        return;
      }
      if (item.ownerId !== req.user.userId) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        return;
      }

      // 2. Verify original image exists
      const images = await ItemImageModel.findByItemId(id);
      const originalImage = images.find(img => img.id === imageId);
      if (!originalImage) {
        res.status(404).json({ error: { code: 'IMAGE_NOT_FOUND', message: 'Original image not found' } });
        return;
      }

      // 3. Remove ALL existing background_removed images for this item (clean up orphans and old versions)
      const existingBgRemovedImages = images.filter(img =>
        img.imageType === 'background_removed' || (img as any).type === 'background_removed'
      );

      for (const existingBgRemoved of existingBgRemovedImages) {
        await ItemImageModel.delete(existingBgRemoved.id);
        if (!existingBgRemoved.imageUrl.startsWith('http')) {
          try {
            const oldPath = path.join(process.cwd(), existingBgRemoved.imageUrl);
            await fs.unlink(oldPath).catch(() => { });
          } catch (e) {
            console.warn('Failed to delete old bg removed file', e);
          }
        }
      }

      // 4. Upload new image
      // Use original filename but prepend manual_bg_removed_
      const originalFilename = path.basename(originalImage.imageUrl);
      const newFilename = `manual_bg_removed_${Date.now()}_${originalFilename}`;

      const uploadResult = await LocalStorageService.uploadImage(
        file.buffer,
        newFilename,
        file.mimetype,
        'wardrobe',
        req.user.userId
      );

      // 5. Create DB record
      const bgRemovedImage = await ItemImageModel.create({
        itemId: item.id,
        imageUrl: uploadResult.optimizedUrl || uploadResult.url,
        imageType: 'background_removed',
        isPrimary: false,
        aiAnalysis: {
          backgroundRemoved: true,
          originalImageId: originalImage.id,
          isManualOverride: true
        },
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
      });

      res.status(200).json({
        message: 'Processed image saved successfully',
        image: {
          ...bgRemovedImage,
          url: bgRemovedImage.imageUrl.startsWith('http')
            ? bgRemovedImage.imageUrl
            : `${process.env.API_URL || 'http://localhost:3001'}/${bgRemovedImage.imageUrl}`
        }
      });

    } catch (error) {
      console.error('Save processed image error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while saving the image',
        },
      });
    }
  }


  /**
   * Remove background from an existing wardrobe item image
   */
  static async removeImageBackground(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id, imageId } = req.params;
      const options = req.body.options || {}; // Extract options from request body

      // 1. Fetch item and check ownership
      const item = await VUFSItemModel.findById(id);
      if (!item) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      if (item.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only process your own items',
          },
        });
        return;
      }

      // 2. Fetch specific image
      const images = await ItemImageModel.findByItemId(id);
      const originalImage = images.find(img => img.id === imageId);

      if (!originalImage) {
        res.status(404).json({
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found for this item',
          },
        });
        return;
      }

      // 3. Process image background removal
      // Load image buffer (handling both local and remote URLs)
      let imageBuffer: Buffer;
      if (originalImage.imageUrl.startsWith('http')) {
        const response = await fetch(originalImage.imageUrl);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Assume local storage path
        const relativePath = originalImage.imageUrl.startsWith('/')
          ? originalImage.imageUrl.replace(/^\//, '').replace(/^storage\//, '')
          : originalImage.imageUrl.replace(/^storage\//, '');

        const fullPath = path.join(process.cwd(), 'storage', relativePath);
        imageBuffer = await fs.readFile(fullPath);
      }

      // Perform background removal with options
      const processedBuffer = await BackgroundRemovalService.removeBackground(imageBuffer, options);

      // 4. Save processed image
      const originalFilename = path.basename(originalImage.imageUrl);

      // Delete ALL existing background_removed images for this item (clean up orphans and old versions)
      const existingBgRemovedImages = images.filter(img =>
        img.imageType === 'background_removed' || (img as any).type === 'background_removed'
      );

      for (const existingBgRemoved of existingBgRemovedImages) {
        // Delete from DB
        await ItemImageModel.delete(existingBgRemoved.id);

        // Try to delete file if local
        if (!existingBgRemoved.imageUrl.startsWith('http')) {
          try {
            const oldPath = path.join(process.cwd(), existingBgRemoved.imageUrl);
            await fs.unlink(oldPath).catch(() => { });
          } catch (e) {
            console.warn('Failed to delete old background removed file', e);
          }
        }
      }

      const newFilename = `bg_removed_${originalFilename}`;

      const uploadResult = await LocalStorageService.uploadImage(
        processedBuffer,
        newFilename,
        'image/png', // imgly outputs png by default for transparency
        'wardrobe',
        req.user.userId
      );

      // 5. Create image record in DB
      const bgRemovedImage = await ItemImageModel.create({
        itemId: item.id,
        imageUrl: uploadResult.optimizedUrl || uploadResult.url,
        imageType: 'background_removed',
        isPrimary: false, // Don't automatically make it primary
        aiAnalysis: {
          backgroundRemoved: true,
          originalImageId: originalImage.id
        },
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimetype,
      });

      res.status(200).json({
        message: 'Background removed successfully',
        image: {
          ...bgRemovedImage,
          url: bgRemovedImage.imageUrl.startsWith('http')
            ? bgRemovedImage.imageUrl
            : `${process.env.API_URL || 'http://localhost:3001'}/${bgRemovedImage.imageUrl}`
        },
      });

    } catch (error) {
      console.error('Remove background error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing the background',
        },
      });
    }
  }

  /**
   * Delete a specific image from a wardrobe item
   */
  static async deleteItemImage(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id, imageId } = req.params;

      // 1. Fetch item and check ownership
      const item = await VUFSItemModel.findById(id);
      if (!item) {
        res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wardrobe item not found',
          },
        });
        return;
      }

      if (item.ownerId !== req.user.userId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete images from your own items',
          },
        });
        return;
      }

      // 2. Fetch specific image to verify it belongs to this item
      const images = await ItemImageModel.findByItemId(id);
      const imageToDelete = images.find(img => img.id === imageId);

      if (!imageToDelete) {
        res.status(404).json({
          error: {
            code: 'IMAGE_NOT_FOUND',
            message: 'Image not found for this item',
          },
        });
        return;
      }

      // 3. Delete from DB
      await ItemImageModel.delete(imageId);

      // 4. Try to delete file if local
      if (!imageToDelete.imageUrl.startsWith('http')) {
        try {
          const relativePath = imageToDelete.imageUrl.startsWith('/')
            ? imageToDelete.imageUrl.replace(/^\//, '').replace(/^storage\//, '')
            : imageToDelete.imageUrl.replace(/^storage\//, '');

          const fullPath = path.join(process.cwd(), 'storage', relativePath);
          await fs.unlink(fullPath).catch(() => { }); // Ignore error if file not found
        } catch (e) {
          console.warn('Failed to delete image file from storage', e);
        }
      }

      res.status(200).json({
        message: 'Image deleted successfully',
      });

    } catch (error) {
      console.error('Delete item image error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the image',
        },
      });
    }
  }

}