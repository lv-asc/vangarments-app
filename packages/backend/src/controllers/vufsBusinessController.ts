import { Request, Response } from 'express';
import { VUFSCatalogModel } from '../models/VUFSCatalog';
import { AuthenticatedRequest } from '../utils/auth';
import { VUFSUtils } from '../utils/vufs';
import {
  VUFSItem,
  ApparelItem,
  FootwearItem,
  VUFSDomain,
  ExportPlatform
} from '@vangarments/shared/types/vufs';

export class VUFSBusinessController {
  /**
   * Create new catalog item (APPAREL or FOOTWEAR)
   */
  static async createCatalogItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { domain, item } = req.body;

      if (!domain || !['APPAREL', 'FOOTWEAR'].includes(domain)) {
        return res.status(400).json({
          error: { code: 'INVALID_DOMAIN', message: 'Domain must be APPAREL or FOOTWEAR' }
        });
      }

      const catalogEntry = await VUFSCatalogModel.create({
        domain: domain as VUFSDomain,
        item,
        createdBy: req.user.userId,
      });

      res.status(201).json({
        message: 'Catalog item created successfully',
        entry: catalogEntry,
      });
    } catch (error) {
      console.error('Create catalog item error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }

  /**
   * Search catalog with advanced filters
   */
  static async searchCatalog(req: Request, res: Response) {
    try {
      const {
        domain, brand, owner, operationalStatus, condition, sold, photographed,
        minPrice, maxPrice, search, page = 1, limit = 50
      } = req.query;

      const filters: any = {};
      if (domain) filters.domain = domain;
      if (brand) filters.brand = brand;
      if (owner) filters.owner = owner;
      if (operationalStatus) filters.operationalStatus = operationalStatus;
      if (condition) filters.condition = condition;
      if (sold !== undefined) filters.sold = sold === 'true';
      if (photographed !== undefined) filters.photographed = photographed === 'true';
      if (minPrice || maxPrice) {
        filters.priceRange = {
          min: minPrice ? parseFloat(minPrice as string) : 0,
          max: maxPrice ? parseFloat(maxPrice as string) : 999999
        };
      }
      if (search) filters.search = search;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await VUFSCatalogModel.search(filters, limitNum, offset);

      res.json({
        items: result.items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum)
        }
      });
    } catch (error) {
      console.error('Search catalog error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Search failed' }
      });
    }
  }

  /**
   * Mark item as sold and calculate financials
   */
  static async markItemSold(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { id } = req.params;
      const { soldPrice, platform } = req.body;

      if (!soldPrice || soldPrice <= 0) {
        return res.status(400).json({
          error: { code: 'INVALID_PRICE', message: 'Valid sold price is required' }
        });
      }

      // Mark as sold
      const updatedEntry = await VUFSCatalogModel.markAsSold(id, soldPrice, platform);
      if (!updatedEntry) {
        return res.status(404).json({
          error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' }
        });
      }

      // Calculate financials
      const financials = VUFSUtils.calculateFinancials(
        soldPrice,
        platform as ExportPlatform
      );

      res.json({
        message: 'Item marked as sold',
        entry: updatedEntry,
        financials,
        autoRepass: VUFSUtils.shouldAutoRepass(soldPrice)
      });
    } catch (error) {
      console.error('Mark item sold error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }

  /**
   * Generate platform export data
   */
  static async generatePlatformExport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { platform } = req.query;

      if (!platform) {
        return res.status(400).json({
          error: { code: 'MISSING_PLATFORM', message: 'Platform parameter is required' }
        });
      }

      const entry = await VUFSCatalogModel.findById(id);
      if (!entry) {
        return res.status(404).json({
          error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' }
        });
      }

      const platformData = VUFSUtils.generatePlatformData(
        entry.item,
        platform as ExportPlatform
      );

      res.json({
        item: entry,
        platformData,
        exportFilename: VUFSUtils.generateExportFilename(platform as ExportPlatform)
      });
    } catch (error) {
      console.error('Generate platform export error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }

  /**
   * Get items by operational status
   */
  static async getItemsByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;

      const validStatuses = ['not_photographed', 'photographed', 'published', 'sold', 'repassed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: { code: 'INVALID_STATUS', message: 'Invalid operational status' }
        });
      }

      const items = await VUFSCatalogModel.getByOperationalStatus(status as any);

      res.json({
        status,
        items,
        count: items.length
      });
    } catch (error) {
      console.error('Get items by status error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }

  /**
   * Get owner statistics and performance
   */
  static async getOwnerStats(req: Request, res: Response) {
    try {
      const { owner } = req.params;

      const stats = await VUFSCatalogModel.getOwnerStats(owner);

      res.json({
        owner,
        stats,
        performance: {
          sellThroughRate: stats.totalItems > 0 ? (stats.soldItems / stats.totalItems) * 100 : 0,
          averageSalePrice: stats.soldItems > 0 ? stats.totalRevenue / stats.soldItems : 0,
        }
      });
    } catch (error) {
      console.error('Get owner stats error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }

  /**
   * Get items ready for repass (financial processing)
   */
  static async getItemsForRepass(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const items = await VUFSCatalogModel.getItemsReadyForRepass();

      const itemsWithFinancials = items.map(item => {
        const soldPrice = item.item.soldPrice || 0;
        const financials = VUFSUtils.calculateFinancials(soldPrice, 'nuvem_shop'); // Default platform

        return {
          ...item,
          financials
        };
      });

      res.json({
        items: itemsWithFinancials,
        count: items.length,
        totalPendingAmount: itemsWithFinancials.reduce((sum, item) => sum + item.financials.netToOwner, 0)
      });
    } catch (error) {
      console.error('Get items for repass error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }

  /**
   * Process repass (mark as paid to owner)
   */
  static async processRepass(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      const { id } = req.params;

      const updatedEntry = await VUFSCatalogModel.markAsRepassed(id);
      if (!updatedEntry) {
        return res.status(404).json({
          error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' }
        });
      }

      res.json({
        message: 'Repass processed successfully',
        entry: updatedEntry
      });
    } catch (error) {
      console.error('Process repass error:', error);
      res.status(500).json({
        error: { code: 'INTERNAL_SERVER_ERROR', message: (error as any).message }
      });
    }
  }
}