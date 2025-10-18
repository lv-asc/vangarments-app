import { Request, Response } from 'express';
import { AnteroomModel } from '../models/Anteroom';
import { VUFSItemModel } from '../models/VUFSItem';
import { AuthenticatedRequest } from '../utils/auth';
import { VUFSUtils } from '../utils/vufs';

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
}