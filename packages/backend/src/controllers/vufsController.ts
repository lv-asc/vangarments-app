import { Request, Response } from 'express';
import { VUFSItemSchema } from '@vangarments/shared';
import { VUFSItemModel } from '../models/VUFSItem';
import { AuthenticatedRequest } from '../utils/auth';
import { VUFSUtils } from '../utils/vufs';

export class VUFSController {
  static async createItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Validate input data
      const validationResult = VUFSItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid item data',
            details: validationResult.error.errors,
          },
        });
      }

      const { category, brand, metadata, condition } = validationResult.data;

      // Validate category hierarchy
      const categoryErrors = VUFSUtils.validateCategoryHierarchy(category);
      if (categoryErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Invalid category hierarchy',
            details: categoryErrors,
          },
        });
      }

      // Validate brand hierarchy
      const brandErrors = VUFSUtils.validateBrandHierarchy(brand);
      if (brandErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_BRAND',
            message: 'Invalid brand hierarchy',
            details: brandErrors,
          },
        });
      }

      // Create VUFS item
      const item = await VUFSItemModel.create({
        ownerId: req.user.userId,
        category,
        brand,
        metadata,
        condition,
      });

      res.status(201).json({
        message: 'VUFS item created successfully',
        item,
      });
    } catch (error) {
      console.error('Create VUFS item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the item',
        },
      });
    }
  }

  static async getItem(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const item = await VUFSItemModel.findById(id);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
          },
        });
      }

      res.json({ item });
    } catch (error) {
      console.error('Get VUFS item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the item',
        },
      });
    }
  }

  static async getItemByVUFSCode(req: Request, res: Response) {
    try {
      const { vufsCode } = req.params;

      if (!VUFSUtils.isValidVUFSCode(vufsCode)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_VUFS_CODE',
            message: 'Invalid VUFS code format',
          },
        });
      }

      const item = await VUFSItemModel.findByVUFSCode(vufsCode);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
          },
        });
      }

      res.json({ item });
    } catch (error) {
      console.error('Get VUFS item by code error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the item',
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

      const { category, brand, condition, visibility, search } = req.query;

      const filters = {
        category: category ? { page: category as string } : undefined,
        brand: brand as string,
        condition: condition as string,
        visibility: visibility as string,
        search: search as string,
      };

      const items = await VUFSItemModel.findByOwner(req.user.userId, filters);

      res.json({
        items,
        count: items.length,
      });
    } catch (error) {
      console.error('Get user items error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching items',
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

      // Check if item exists and belongs to user
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
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

      const { category, brand, metadata, condition, ownership } = req.body;

      // Validate category if provided
      if (category) {
        const categoryErrors = VUFSUtils.validateCategoryHierarchy(category);
        if (categoryErrors.length > 0) {
          return res.status(400).json({
            error: {
              code: 'INVALID_CATEGORY',
              message: 'Invalid category hierarchy',
              details: categoryErrors,
            },
          });
        }
      }

      // Validate brand if provided
      if (brand) {
        const brandErrors = VUFSUtils.validateBrandHierarchy(brand);
        if (brandErrors.length > 0) {
          return res.status(400).json({
            error: {
              code: 'INVALID_BRAND',
              message: 'Invalid brand hierarchy',
              details: brandErrors,
            },
          });
        }
      }

      const updatedItem = await VUFSItemModel.update(id, {
        category,
        brand,
        metadata,
        condition,
        ownership,
      });

      if (!updatedItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
          },
        });
      }

      res.json({
        message: 'VUFS item updated successfully',
        item: updatedItem,
      });
    } catch (error) {
      console.error('Update VUFS item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the item',
        },
      });
    }
  }

  static async deleteItem(req: AuthenticatedRequest, res: Response) {
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
      const existingItem = await VUFSItemModel.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
          },
        });
      }

      if (existingItem.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own items',
          },
        });
      }

      const deleted = await VUFSItemModel.delete(id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
          },
        });
      }

      res.json({
        message: 'VUFS item deleted successfully',
      });
    } catch (error) {
      console.error('Delete VUFS item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the item',
        },
      });
    }
  }

  static async searchItems(req: Request, res: Response) {
    try {
      const { q, category, brand, visibility } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query is required',
          },
        });
      }

      const filters = {
        category: category ? { page: category as string } : undefined,
        brand: brand as string,
        visibility: visibility as string || 'public',
      };

      const items = await VUFSItemModel.search(q, filters);

      res.json({
        query: q,
        items,
        count: items.length,
      });
    } catch (error) {
      console.error('Search VUFS items error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching items',
        },
      });
    }
  }

  static async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const stats = await VUFSItemModel.getStatsByOwner(req.user.userId);

      res.json({ stats });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching stats',
        },
      });
    }
  }

  static async validateVUFSCode(req: Request, res: Response) {
    try {
      const { code } = req.params;

      const isValid = VUFSUtils.isValidVUFSCode(code);
      const parsed = VUFSUtils.parseVUFSCode(code);

      res.json({
        code,
        isValid,
        parsed,
      });
    } catch (error) {
      console.error('Validate VUFS code error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while validating the code',
        },
      });
    }
  }
}