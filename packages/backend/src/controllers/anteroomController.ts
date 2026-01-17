import { Request, Response } from 'express';
import multer from 'multer';
import { AnteroomModel, ANTEROOM_LIMITS } from '../models/Anteroom';
import { VUFSItemModel } from '../models/VUFSItem';
import { AuthenticatedRequest } from '../utils/auth';
import { VUFSUtils } from '../utils/vufs';
import { LocalStorageService } from '../services/localStorageService';

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});


export class AnteroomController {
  static async addItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const itemData = req.body;

      // Add item to anteroom
      const anteroomItem = await AnteroomModel.addItem(req.user.userId, itemData);

      res.status(201).json({
        message: 'Item added to anteroom for completion',
        item: anteroomItem,
        expiresIn: Math.ceil((anteroomItem.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), // days
      });
    } catch (error) {
      console.error('Add anteroom item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while adding item to anteroom',
        },
      });
    }
  }

  static async getUserItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const items = await AnteroomModel.getUserItems(req.user.userId);

      // Add days remaining for each item
      const itemsWithTimeRemaining = items.map(item => ({
        ...item,
        daysRemaining: Math.max(0, Math.ceil((item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      }));

      res.json({
        items: itemsWithTimeRemaining,
        count: items.length,
      });
    } catch (error) {
      console.error('Get anteroom items error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching anteroom items',
        },
      });
    }
  }

  static async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;
      const itemData = req.body;

      // Check if item exists and belongs to user
      const existingItem = await AnteroomModel.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Anteroom item not found',
          },
        });
      }

      if (existingItem.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own items',
          },
        });
      }

      const updatedItem = await AnteroomModel.updateItem(id, itemData);
      if (!updatedItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Anteroom item not found',
          },
        });
      }

      res.json({
        message: 'Anteroom item updated successfully',
        item: updatedItem,
        daysRemaining: Math.max(0, Math.ceil((updatedItem.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      });
    } catch (error) {
      console.error('Update anteroom item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating anteroom item',
        },
      });
    }
  }

  static async completeItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      // Get anteroom item
      const anteroomItem = await AnteroomModel.findById(id);
      if (!anteroomItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Anteroom item not found',
          },
        });
      }

      if (anteroomItem.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only complete your own items',
          },
        });
      }

      // Check if item is complete enough to move to main catalog
      if (anteroomItem.completionStatus.completionPercentage < 100) {
        return res.status(400).json({
          error: {
            code: 'INCOMPLETE_ITEM',
            message: 'Item must be 100% complete to move to main catalog',
            completionStatus: anteroomItem.completionStatus,
          },
        });
      }

      const { category, brand, metadata, condition } = anteroomItem.itemData;

      // Validate required fields
      const categoryErrors = VUFSUtils.validateCategoryHierarchy(category);
      const brandErrors = VUFSUtils.validateBrandHierarchy(brand);

      if (categoryErrors.length > 0 || brandErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Item data is not valid for completion',
            details: [...categoryErrors, ...brandErrors],
          },
        });
      }

      // Create VUFS item
      const vufsItem = await VUFSItemModel.create({
        ownerId: req.user.userId,
        category,
        brand,
        metadata,
        condition,
      });

      // Remove from anteroom
      await AnteroomModel.removeItem(id);

      res.json({
        message: 'Item completed and moved to main catalog',
        item: vufsItem,
      });
    } catch (error) {
      console.error('Complete anteroom item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while completing anteroom item',
        },
      });
    }
  }

  static async removeItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { id } = req.params;

      // Check if item exists and belongs to user
      const existingItem = await AnteroomModel.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Anteroom item not found',
          },
        });
      }

      if (existingItem.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only remove your own items',
          },
        });
      }

      const removed = await AnteroomModel.removeItem(id);
      if (!removed) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Anteroom item not found',
          },
        });
      }

      res.json({
        message: 'Anteroom item removed successfully',
      });
    } catch (error) {
      console.error('Remove anteroom item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing anteroom item',
        },
      });
    }
  }

  static async cleanupExpired(req: Request, res: Response) {
    try {
      const removedCount = await AnteroomModel.cleanupExpiredItems();

      res.json({
        message: 'Expired anteroom items cleaned up',
        removedCount,
      });
    } catch (error) {
      console.error('Cleanup expired items error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while cleaning up expired items',
        },
      });
    }
  }

  /**
   * Middleware for handling image uploads (up to 10 images)
   */
  static uploadMiddleware = upload.array('images', ANTEROOM_LIMITS.MAX_BATCH_UPLOAD);

  /**
   * Get user's current anteroom item count and limits
   */
  static async getItemCount(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const count = await AnteroomModel.getUserItemCount(req.user.userId);

      res.json({
        current: count.current,
        max: count.max,
        available: count.max - count.current,
        limits: ANTEROOM_LIMITS,
      });
    } catch (error) {
      console.error('Get item count error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching item count',
        },
      });
    }
  }

  /**
   * Add multiple items in batch (up to 10 at once)
   */
  static async addBatchItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const files = req.files as Express.Multer.File[];
      const itemsData = req.body.items ? JSON.parse(req.body.items) : [];

      // If files are uploaded without item data, create item entries for each file
      let batchItems = [];

      if (files && files.length > 0) {
        // Upload images and create item entries
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const itemData = itemsData[i] || {};

          try {
            // Upload image to storage
            const imageResult = await LocalStorageService.uploadImage(
              file.buffer,
              file.originalname,
              file.mimetype,
              'wardrobe',
              req.user!.userId
            );

            batchItems.push({
              images: [{
                url: imageResult.url,
                type: 'front',
                isPrimary: true,
              }],
              itemData,
            });
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
            // Continue with other files
          }
        }
      } else if (itemsData.length > 0) {
        // Items provided without images
        batchItems = itemsData.map((itemData: any) => ({
          images: [],
          itemData,
        }));
      }

      if (batchItems.length === 0) {
        return res.status(400).json({
          error: {
            code: 'NO_ITEMS',
            message: 'No items to add. Please provide images or item data.',
          },
        });
      }

      const result = await AnteroomModel.addBatchItems(req.user.userId, batchItems);

      res.status(201).json({
        message: `Added ${result.added.length} items to anteroom`,
        items: result.added,
        errors: result.errors,
        count: await AnteroomModel.getUserItemCount(req.user.userId),
      });
    } catch (error) {
      console.error('Add batch items error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while adding batch items',
        },
      });
    }
  }

  /**
   * Apply a quality value to multiple items at once
   */
  static async applyQualityBulk(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { itemIds, quality, value } = req.body;

      // Validate input
      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'itemIds must be a non-empty array',
          },
        });
      }

      if (!quality || typeof quality !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'quality must be specified (color, brand, material, condition, category)',
          },
        });
      }

      if (value === undefined || value === null) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'value must be specified',
          },
        });
      }

      const result = await AnteroomModel.applyQualityToMultiple(
        itemIds,
        quality,
        value,
        req.user.userId
      );

      res.json({
        message: `Updated ${result.updated} items with ${quality}`,
        updated: result.updated,
        errors: result.errors,
      });
    } catch (error) {
      console.error('Apply quality bulk error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while applying quality to items',
        },
      });
    }
  }

  /**
   * Add item with image upload support
   */
  static async addItemWithImages(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const files = req.files as Express.Multer.File[];
      const itemData = req.body.itemData ? JSON.parse(req.body.itemData) : {};

      // Check user's current item count
      const count = await AnteroomModel.getUserItemCount(req.user.userId);
      if (count.current >= count.max) {
        return res.status(400).json({
          error: {
            code: 'LIMIT_REACHED',
            message: `Maximum ${count.max} items in anteroom reached`,
            count,
          },
        });
      }

      // Upload images
      const uploadedImages = [];
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const imageResult = await LocalStorageService.uploadImage(
              file.buffer,
              file.originalname,
              file.mimetype,
              'wardrobe',
              req.user!.userId
            );

            uploadedImages.push({
              url: imageResult.url,
              type: i === 0 ? 'front' : 'detail',
              isPrimary: i === 0,
            });
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
          }
        }
      }

      // Add item with images
      const fullItemData = {
        ...itemData,
        images: uploadedImages,
      };

      const anteroomItem = await AnteroomModel.addItem(req.user.userId, fullItemData);

      res.status(201).json({
        message: 'Item added to anteroom for completion',
        item: anteroomItem,
        expiresIn: Math.ceil((anteroomItem.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        count: await AnteroomModel.getUserItemCount(req.user.userId),
      });
    } catch (error) {
      console.error('Add item with images error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while adding item to anteroom',
        },
      });
    }
  }
}