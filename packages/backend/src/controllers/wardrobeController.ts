import { Request, Response } from 'express';
import multer from 'multer';
import { VUFSItemModel } from '../models/VUFSItem';
import { ItemImageModel } from '../models/ItemImage';
import { AIProcessingService } from '../services/aiProcessingService';
import { AWSService } from '../services/awsService';
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
  static uploadMiddleware = upload.array('images', 5);

  static async createItemWithAI(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      
      // Validate image uploads
      const imageValidation = WardrobeValidationService.validateImageUpload(files);
      if (!imageValidation.isValid) {
        res.status(400).json({
          error: {
            code: 'INVALID_IMAGES',
            message: 'Image validation failed',
            details: imageValidation.errors,
          },
        });
        return;
      }

      const { useAI = true } = req.body;
      const primaryImage = files[0];

      let aiAnalysis = null;
      let vufsExtraction = null;

      // Process with AI if requested
      if (useAI) {
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
      const rawItemData = this.mergeAIWithUserInput(req.body, vufsExtraction);
      
      // Sanitize and validate the merged data
      const sanitizedData = WardrobeValidationService.sanitizeItemData(rawItemData);
      const validation = WardrobeValidationService.validateWardrobeItem(sanitizedData, false);
      
      if (!validation.isValid) {
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
      const vufsItem = await VUFSItemModel.create({
        ownerId: req.user.userId,
        category: itemData.category,
        brand: itemData.brand,
        metadata: itemData.metadata,
        condition: itemData.condition,
        ownership: itemData.ownership,
      });

      // Upload and store images locally
      const imageRecords = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload to local storage
        const uploadResult = await LocalStorageService.uploadImage(
          file.buffer,
          file.originalname,
          file.mimetype,
          'wardrobe',
          req.user.userId
        );
        
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
        
        imageRecords.push(imageRecord);
      }

      // Get complete item with images
      const itemWithImages = {
        ...vufsItem,
        images: imageRecords,
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
      console.error('Create wardrobe item error:', error);
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
          return {
            ...item,
            images,
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

      const updatedItem = await VUFSItemModel.update(id, validatedUpdateData);

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
   * Delete wardrobe item with permanent effects
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

      // Get associated images before deletion
      const images = await ItemImageModel.findByItemId(id);

      // Delete the item (this will cascade delete images due to foreign key constraint)
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

      // Delete associated image files from local storage
      for (const image of images) {
        try {
          // Extract relative path from URL
          const urlPath = image.imageUrl.replace('/storage/', '');
          await LocalStorageService.deleteImage(urlPath);
        } catch (error) {
          console.warn(`Failed to delete image file: ${image.imageUrl}`, error);
          // Continue with deletion even if file cleanup fails
        }
      }

      res.json({
        message: 'Wardrobe item deleted successfully',
        deletedItemId: id,
        deletedImages: images.length,
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


}