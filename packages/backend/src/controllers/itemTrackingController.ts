import { Request, Response } from 'express';
import { ItemTrackingModel } from '../models/ItemTracking';
import { VUFSItemModel } from '../models/VUFSItem';
import { AuthenticatedRequest } from '../utils/auth';
import { ItemTrackingUtils } from '../utils/itemTracking';

export class ItemTrackingController {
  // Loan Management
  static async createLoan(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { itemId, loaneeId, loaneeName, expectedReturnDate, notes } = req.body;

      // Verify item ownership
      const item = await VUFSItemModel.findById(itemId);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found',
          },
        });
      }

      if (item.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only loan your own items',
          },
        });
      }

      const loan = await ItemTrackingModel.createLoan({
        itemId,
        loaneeId,
        loaneeName,
        loanDate: new Date(),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
        notes,
      });

      res.status(201).json({
        message: 'Loan created successfully',
        loan,
      });
    } catch (error) {
      console.error('Create loan error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the loan',
        },
      });
    }
  }

  static async returnItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { loanId } = req.params;
      const { returnDate, notes } = req.body;

      const loan = await ItemTrackingModel.findLoanById(loanId);
      if (!loan) {
        return res.status(404).json({
          error: {
            code: 'LOAN_NOT_FOUND',
            message: 'Loan not found',
          },
        });
      }

      // Verify item ownership
      const item = await VUFSItemModel.findById(loan.itemId);
      if (!item || item.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only manage loans for your own items',
          },
        });
      }

      const updatedLoan = await ItemTrackingModel.updateLoan(loanId, {
        actualReturnDate: returnDate ? new Date(returnDate) : new Date(),
        notes: notes || loan.notes,
      });

      res.json({
        message: 'Item returned successfully',
        loan: updatedLoan,
      });
    } catch (error) {
      console.error('Return item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while returning the item',
        },
      });
    }
  }

  static async getUserLoans(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { status } = req.query;

      let loans;
      if (status === 'active') {
        loans = await ItemTrackingModel.getActiveLoans(req.user.userId);
      } else if (status === 'overdue') {
        loans = await ItemTrackingModel.getOverdueLoans(req.user.userId);
      } else {
        loans = await ItemTrackingModel.getLoansByUser(req.user.userId);
      }

      res.json({
        loans,
        count: loans.length,
      });
    } catch (error) {
      console.error('Get user loans error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching loans',
        },
      });
    }
  }

  // Wishlist Management
  static async addToWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { itemReference, desiredItem } = req.body;

      const wishlistItem = await ItemTrackingModel.createWishlistItem({
        userId: req.user.userId,
        itemReference,
        desiredItem,
      });

      res.status(201).json({
        message: 'Item added to wishlist',
        item: wishlistItem,
      });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while adding to wishlist',
        },
      });
    }
  }

  static async getUserWishlist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const wishlist = await ItemTrackingModel.getUserWishlist(req.user.userId);

      res.json({
        wishlist,
        count: wishlist.length,
      });
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching wishlist',
        },
      });
    }
  }

  static async updateWishlistItem(req: AuthenticatedRequest, res: Response) {
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
      const { itemReference, desiredItem } = req.body;

      // Verify ownership
      const existingItem = await ItemTrackingModel.findWishlistItemById(id);
      if (!existingItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wishlist item not found',
          },
        });
      }

      if (existingItem.userId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own wishlist items',
          },
        });
      }

      const updatedItem = await ItemTrackingModel.updateWishlistItem(id, {
        itemReference,
        desiredItem,
      });

      res.json({
        message: 'Wishlist item updated successfully',
        item: updatedItem,
      });
    } catch (error) {
      console.error('Update wishlist item error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating wishlist item',
        },
      });
    }
  }

  static async removeFromWishlist(req: AuthenticatedRequest, res: Response) {
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

      // Verify ownership
      const existingItem = await ItemTrackingModel.findWishlistItemById(id);
      if (!existingItem) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wishlist item not found',
          },
        });
      }

      if (existingItem.userId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only remove your own wishlist items',
          },
        });
      }

      const deleted = await ItemTrackingModel.deleteWishlistItem(id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Wishlist item not found',
          },
        });
      }

      res.json({
        message: 'Item removed from wishlist',
      });
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while removing from wishlist',
        },
      });
    }
  }

  // Usage Tracking
  static async recordWear(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { itemId } = req.params;

      // Verify item ownership
      const item = await VUFSItemModel.findById(itemId);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found',
          },
        });
      }

      if (item.ownerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only track wear for your own items',
          },
        });
      }

      await ItemTrackingModel.recordItemWear(itemId);
      const wearCount = await ItemTrackingModel.getItemWearCount(itemId);

      res.json({
        message: 'Wear recorded successfully',
        wearCount,
      });
    } catch (error) {
      console.error('Record wear error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while recording wear',
        },
      });
    }
  }

  static async getItemUsage(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      const item = await VUFSItemModel.findById(itemId);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found',
          },
        });
      }

      const wearCount = await ItemTrackingModel.getItemWearCount(itemId);
      const usageHistory = await ItemTrackingModel.getItemUsageHistory(itemId, 20);

      // Calculate usage insights
      const acquisitionDate = (item.metadata as any).acquisitionInfo?.purchaseDate || item.createdAt;
      const usageInsights = ItemTrackingUtils.calculateUsageInsights(wearCount, acquisitionDate);

      // Generate care schedule
      const careSchedule = ItemTrackingUtils.generateCareSchedule(
        (item.metadata.composition || []) as any,
        item.category,
        wearCount
      );

      res.json({
        itemId,
        wearCount,
        usageHistory,
        usageInsights,
        careSchedule,
      });
    } catch (error) {
      console.error('Get item usage error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching item usage',
        },
      });
    }
  }

  static async getUserUsageStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const stats = await ItemTrackingModel.getUserUsageStats(req.user.userId);

      res.json({ stats });
    } catch (error) {
      console.error('Get usage stats error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching usage stats',
        },
      });
    }
  }

  // Care Instructions
  static async generateCareInstructions(req: Request, res: Response) {
    try {
      const { materials, category } = req.body;

      if (!materials || !Array.isArray(materials)) {
        return res.status(400).json({
          error: {
            code: 'MISSING_MATERIALS',
            message: 'Materials array is required',
          },
        });
      }

      // Validate materials
      const validationErrors = ItemTrackingUtils.validateComposition(materials);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_MATERIALS',
            message: 'Invalid material composition',
            details: validationErrors,
          },
        });
      }

      const careSchedule = ItemTrackingUtils.generateCareSchedule(materials, category || {});

      res.json({
        materials,
        category,
        careSchedule,
      });
    } catch (error) {
      console.error('Generate care instructions error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while generating care instructions',
        },
      });
    }
  }
}