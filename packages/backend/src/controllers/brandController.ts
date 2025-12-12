import { Request, Response } from 'express';
import { BrandService } from '../services/brandService';
import { AuthenticatedRequest } from '../utils/auth';

const brandService = new BrandService();

export class BrandController {
  /**
   * Register a new brand account
   */
  async registerBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { brandName, description, website, contactEmail, contactPhone, businessType, partnershipTier } = req.body;

      if (!brandName) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Brand name is required',
          },
        });
        return;
      }

      const brand = await brandService.registerBrand(userId, {
        brandName,
        description,
        website,
        contactEmail,
        contactPhone,
        businessType,
        partnershipTier,
      });

      res.status(201).json({
        success: true,
        data: { brand },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'BRAND_REGISTRATION_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get current user's brand account
   */
  async getBrandAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const brandAccount = await brandService.getBrandByUserId(userId);

      if (!brandAccount) {
        res.status(404).json({
          error: {
            code: 'BRAND_NOT_FOUND',
            message: 'Brand account not found for this user',
          },
        });
        return;
      }

      res.json({
        success: true,
        brandAccount,
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_BRAND_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Create brand account (Admin)
   */
  async createBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // TODO: Add admin role check if not done in middleware
      const { userId, brandName, description, website, contactEmail, contactPhone, businessType, partnershipTier } = req.body;

      if (!userId || !brandName) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID and Brand Name are required',
          },
        });
        return;
      }

      const brand = await brandService.registerBrand(userId, {
        brandName,
        description,
        website,
        contactEmail,
        contactPhone,
        businessType: businessType || 'brand',
        partnershipTier: partnershipTier || 'basic',
      });

      res.status(201).json({
        success: true,
        data: { brand },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'CREATE_BRAND_FAILED',
          message: error.message,
        },
      });
    }
  }


  /**
   * Get brand profile
   */
  async getBrandProfile(req: Request, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;

      const profile = await brandService.getBrandProfile(brandId);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: 'BRAND_NOT_FOUND',
          message: error.message,
        },
      });
    }
  }

  /**
   * Update brand page customization
   */
  async updateBrandPage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { logo, banner, brandColors, socialLinks, customSections } = req.body;

      // TODO: Verify user owns this brand
      const brand = await brandService.updateBrandPage(brandId, {
        logo,
        banner,
        brandColors,
        socialLinks,
        customSections,
      });

      res.json({
        success: true,
        data: { brand },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPDATE_BRAND_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Add item to brand catalog
   */
  async addToCatalog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { vufsItemId, officialPrice, availabilityStatus, purchaseLink, brandSpecificData } = req.body;

      if (!vufsItemId) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'VUFS item ID is required',
          },
        });
        return;
      }

      const catalogItem = await brandService.addToCatalog(brandId, {
        brandId,
        vufsItemId,
        officialPrice,
        availabilityStatus,
        purchaseLink,
        brandSpecificData,
      });

      res.status(201).json({
        success: true,
        data: { catalogItem },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'ADD_TO_CATALOG_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Update catalog item
   */
  async updateCatalogItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId, itemId } = req.params;
      const { officialPrice, availabilityStatus, purchaseLink, brandSpecificData } = req.body;

      const catalogItem = await brandService.updateCatalogItem(brandId, itemId, {
        officialPrice,
        availabilityStatus,
        purchaseLink,
        brandSpecificData,
      });

      res.json({
        success: true,
        data: { catalogItem },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPDATE_CATALOG_ITEM_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get brand catalog
   */
  async getBrandCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const {
        availabilityStatus,
        minPrice,
        maxPrice,
        collection,
        season,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: any = {};
      if (availabilityStatus) filters.availabilityStatus = availabilityStatus;
      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) filters.priceRange.min = parseFloat(minPrice as string);
        if (maxPrice) filters.priceRange.max = parseFloat(maxPrice as string);
      }
      if (collection) filters.collection = collection as string;
      if (season) filters.season = season as string;
      if (search) filters.search = search as string;

      const catalog = await brandService.getBrandCatalog(
        brandId,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          ...catalog,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_CATALOG_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get brand analytics
   */
  async getBrandAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { period = 'month' } = req.query;

      // TODO: Verify user owns this brand
      const analytics = await brandService.getBrandAnalytics(
        brandId,
        period as 'week' | 'month' | 'quarter' | 'year'
      );

      res.json({
        success: true,
        data: { analytics },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_ANALYTICS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Search brands
   */
  async searchBrands(req: Request, res: Response): Promise<void> {
    try {
      const { q: query = '', verificationStatus, partnershipTier, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (verificationStatus) filters.verificationStatus = verificationStatus;
      if (partnershipTier) filters.partnershipTier = partnershipTier;

      const results = await brandService.searchBrands(
        query as string,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          ...results,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'SEARCH_BRANDS_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Verify brand (admin only)
   */
  async verifyBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { status, notes } = req.body;

      // TODO: Check if user has admin role
      if (!req.user!.roles.includes('admin')) {
        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Admin access required',
          },
        });
        return;
      }

      if (!['verified', 'rejected'].includes(status)) {
        res.status(400).json({
          error: {
            code: 'INVALID_STATUS',
            message: 'Status must be verified or rejected',
          },
        });
        return;
      }

      const brand = await brandService.verifyBrand(brandId, status, notes);

      res.json({
        success: true,
        data: { brand },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'VERIFY_BRAND_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Upgrade brand tier
   */
  async upgradeBrandTier(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { tier } = req.body;

      if (!['basic', 'premium', 'enterprise'].includes(tier)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TIER',
            message: 'Tier must be basic, premium, or enterprise',
          },
        });
        return;
      }

      // TODO: Verify user owns this brand and handle payment for upgrades
      const brand = await brandService.upgradeBrandTier(brandId, tier);

      res.json({
        success: true,
        data: { brand },
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPGRADE_TIER_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Bulk update catalog availability
   */
  async bulkUpdateAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Updates array is required',
          },
        });
        return;
      }

      // TODO: Verify user owns this brand
      await brandService.bulkUpdateAvailability(brandId, updates);

      res.json({
        success: true,
        message: 'Availability updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'BULK_UPDATE_FAILED',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get commission history
   */
  async getCommissionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { brandId } = req.params;
      const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (startDate && endDate) {
        filters.dateRange = {
          start: startDate as string,
          end: endDate as string,
        };
      }

      // TODO: Verify user owns this brand
      const history = await brandService.getCommissionHistory(
        brandId,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          ...history,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: {
          code: 'GET_COMMISSION_HISTORY_FAILED',
          message: error.message,
        },
      });
    }
  }
}