import { Request, Response } from 'express';
import { MarketplaceModel } from '../models/Marketplace';
import { MarketplaceEnhancedModel } from '../models/MarketplaceEnhanced';
import { VUFSCatalogModel } from '../models/VUFSCatalog';
import { AuthenticatedRequest } from '../utils/auth';
import { VUFSUtils } from '../utils/vufs';

export class MarketplaceController {
  /**
   * Create new marketplace listing
   */
  static async createListing(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { 
        itemId, title, description, price, condition, shipping, 
        images, category, tags, location, expiresAt 
      } = req.body;

      if (!itemId || !title || !price || !condition || !shipping) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Item ID, title, price, condition, and shipping are required',
          },
        });
      }

      // Verify item exists and belongs to user
      const item = await VUFSCatalogModel.findById(itemId);
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'VUFS item not found',
          },
        });
      }

      if (item.item.owner !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only list your own items',
          },
        });
      }

      // Check if item is already listed
      const existingListings = await MarketplaceEnhancedModel.getSellerListings(req.user.userId, 'active');
      const alreadyListed = existingListings.some(listing => listing.itemId === itemId);
      
      if (alreadyListed) {
        return res.status(409).json({
          error: {
            code: 'ITEM_ALREADY_LISTED',
            message: 'This item is already listed in the marketplace',
          },
        });
      }

      const listing = await MarketplaceEnhancedModel.createListing({
        itemId,
        sellerId: req.user.userId,
        title,
        description: description || '',
        price: parseFloat(price),
        condition,
        shipping,
        images: images || [],
        category: category || item.domain,
        tags: tags || [],
        location: location || { country: 'Brazil' },
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Update VUFS item status to published
      await VUFSCatalogModel.update(itemId, {
        operationalStatus: 'published',
      });

      res.status(201).json({
        message: 'Listing created successfully',
        listing,
      });
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the listing',
        },
      });
    }
  }

  /**
   * Search marketplace listings
   */
  static async searchListings(req: Request, res: Response) {
    try {
      const {
        category, brand, condition, minPrice, maxPrice, size, color,
        country, state, freeShipping, search, sortBy, page = 1, limit = 20
      } = req.query;

      const filters: any = {};
      
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (condition) filters.condition = Array.isArray(condition) ? condition : [condition];
      if (minPrice || maxPrice) {
        filters.priceRange = {
          min: minPrice ? parseFloat(minPrice as string) : 0,
          max: maxPrice ? parseFloat(maxPrice as string) : 999999,
        };
      }
      if (search) filters.search = search;
      if (sortBy) filters.sortBy = sortBy;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await MarketplaceEnhancedModel.searchListings(filters, limitNum, offset);

      res.json({
        listings: result.listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          pages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      console.error('Search listings error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while searching listings',
        },
      });
    }
  }

  /**
   * Get listing by ID
   */
  static async getListing(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const listing = await MarketplaceEnhancedModel.findById(id);
      if (!listing) {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      // Increment view count (but not for the seller)
      const userId = (req as AuthenticatedRequest).user?.userId;
      if (userId !== listing.sellerId) {
        await MarketplaceEnhancedModel.incrementViews(id);
      }

      // Get VUFS item details
      const vufsItem = await VUFSCatalogModel.findById(listing.itemId);
      
      // Get seller profile
      const sellerProfile = await MarketplaceEnhancedModel.getSellerProfile(listing.sellerId);

      res.json({
        listing: {
          ...listing,
          views: listing.views + (userId !== listing.sellerId ? 1 : 0),
        },
        vufsItem,
        seller: sellerProfile,
      });
    } catch (error) {
      console.error('Get listing error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching the listing',
        },
      });
    }
  }

  /**
   * Get user's listings
   */
  static async getUserListings(req: AuthenticatedRequest, res: Response) {
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

      const listings = await MarketplaceEnhancedModel.getSellerListings(
        req.user.userId,
        status as string
      );

      res.json({
        listings,
        count: listings.length,
      });
    } catch (error) {
      console.error('Get user listings error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching listings',
        },
      });
    }
  }

  /**
   * Update listing
   */
  static async updateListing(req: AuthenticatedRequest, res: Response) {
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
      const updateData = req.body;

      // Check if listing exists and belongs to user
      const existingListing = await MarketplaceModel.findById(id);
      if (!existingListing) {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      if (existingListing.sellerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own listings',
          },
        });
      }

      const updatedListing = await MarketplaceEnhancedModel.updateListing(id, updateData);

      res.json({
        message: 'Listing updated successfully',
        listing: updatedListing,
      });
    } catch (error) {
      console.error('Update listing error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while updating the listing',
        },
      });
    }
  }

  /**
   * Delete listing
   */
  static async deleteListing(req: AuthenticatedRequest, res: Response) {
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

      // Check if listing exists and belongs to user
      const existingListing = await MarketplaceModel.findById(id);
      if (!existingListing) {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      if (existingListing.sellerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own listings',
          },
        });
      }

      const deleted = await MarketplaceEnhancedModel.deleteListing(id);
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      res.json({
        message: 'Listing deleted successfully',
      });
    } catch (error) {
      console.error('Delete listing error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while deleting the listing',
        },
      });
    }
  }

  /**
   * Toggle like on listing
   */
  static async toggleLike(req: AuthenticatedRequest, res: Response) {
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

      const listing = await MarketplaceEnhancedModel.findById(id);
      if (!listing) {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      const isLiked = await MarketplaceEnhancedModel.toggleLike(id, req.user.userId);

      res.json({
        message: isLiked ? 'Listing liked' : 'Listing unliked',
        isLiked,
      });
    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while toggling like',
        },
      });
    }
  }

  /**
   * Create purchase transaction
   */
  static async createTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { listingId, shippingAddress, paymentMethod } = req.body;

      if (!listingId || !shippingAddress || !paymentMethod) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Listing ID, shipping address, and payment method are required',
          },
        });
      }

      const listing = await MarketplaceEnhancedModel.findById(listingId);
      if (!listing) {
        return res.status(404).json({
          error: {
            code: 'LISTING_NOT_FOUND',
            message: 'Listing not found',
          },
        });
      }

      if (listing.status !== 'active') {
        return res.status(400).json({
          error: {
            code: 'LISTING_NOT_AVAILABLE',
            message: 'This listing is no longer available',
          },
        });
      }

      if (listing.sellerId === req.user.userId) {
        return res.status(400).json({
          error: {
            code: 'CANNOT_BUY_OWN_ITEM',
            message: 'You cannot purchase your own listing',
          },
        });
      }

      // Calculate fees
      const platformFeeRate = 0.05; // 5%
      const paymentFeeRate = 0.029; // 2.9%
      
      const platformFee = listing.price * platformFeeRate;
      const paymentFee = listing.price * paymentFeeRate;
      const shippingFee = listing.shipping.domestic.cost || 0;

      const fees = {
        platformFee,
        paymentFee,
        shippingFee,
      };

      const transaction = await MarketplaceEnhancedModel.createTransaction({
        listingId,
        buyerId: req.user.userId,
        sellerId: listing.sellerId,
        amount: listing.price + shippingFee,
        fees,
        shippingAddress,
        paymentMethod,
      });

      // Update listing status to reserved
      await MarketplaceEnhancedModel.updateStatus(listingId, 'reserved');

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction,
        paymentRequired: true,
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the transaction',
        },
      });
    }
  }

  /**
   * Get seller profile
   */
  static async getSellerProfile(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;

      const profile = await MarketplaceEnhancedModel.getSellerProfile(sellerId);
      if (!profile) {
        return res.status(404).json({
          error: {
            code: 'SELLER_NOT_FOUND',
            message: 'Seller profile not found',
          },
        });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Get seller profile error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching seller profile',
        },
      });
    }
  }

  /**
   * Get marketplace categories and filters
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = {
        apparel: [
          'Shirts', 'Jackets', 'Pants', 'Dresses', 'Tops', 'Shorts',
          'Sweats', 'Tank Tops', 'Accessories', 'Bags', 'Jewelry'
        ],
        footwear: [
          'Sneakers', 'Boots', 'Dress Shoes', 'Sandals', 'Athletic', 'Casual'
        ],
        conditions: [
          'new', 'dswt', 'never_used', 'excellent', 'good', 'fair'
        ],
        priceRanges: [
          { label: 'Under R$50', min: 0, max: 50 },
          { label: 'R$50 - R$100', min: 50, max: 100 },
          { label: 'R$100 - R$200', min: 100, max: 200 },
          { label: 'R$200 - R$500', min: 200, max: 500 },
          { label: 'Over R$500', min: 500, max: 999999 },
        ],
        sortOptions: [
          { value: 'newest', label: 'Newest First' },
          { value: 'price_low', label: 'Price: Low to High' },
          { value: 'price_high', label: 'Price: High to Low' },
          { value: 'most_watched', label: 'Most Popular' },
        ],
      };

      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching categories',
        },
      });
    }
  }
}