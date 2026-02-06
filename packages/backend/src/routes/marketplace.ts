import { Router, Request, Response } from 'express';
import { MarketplaceModel, CreateListingData } from '../models/Marketplace';
import { MarketplaceFilters } from '@vangarments/shared/types/marketplace';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ============================================
// PUBLIC ROUTES (no auth required for browsing)
// ============================================

/**
 * GET /marketplace
 * Browse marketplace listings with filters
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            category,
            brand,
            condition,
            minPrice,
            maxPrice,
            search,
            sortBy,
            limit = '50',
            offset = '0'
        } = req.query;

        const filters: MarketplaceFilters = {};

        if (category) filters.category = category as string;
        if (brand) filters.brand = brand as string;
        if (condition) filters.condition = (condition as string).split(',');
        if (minPrice || maxPrice) {
            filters.priceRange = {
                min: minPrice ? parseFloat(minPrice as string) : 0,
                max: maxPrice ? parseFloat(maxPrice as string) : 999999
            };
        }
        if (search) filters.search = search as string;
        if (sortBy) filters.sortBy = sortBy as any;

        const result = await MarketplaceModel.searchListings(
            filters,
            parseInt(limit as string),
            parseInt(offset as string)
        );

        res.json({
            success: true,
            data: result.listings,
            total: result.total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });
    } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch listings' });
    }
});

/**
 * GET /marketplace/u/:code
 * Get a single listing by item code (SKU)
 */
router.get('/u/:code', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const listing = await MarketplaceModel.findByCode(code);

        if (!listing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }

        // Increment view count (don't wait for it)
        MarketplaceModel.incrementViews(listing.id).catch(console.error);

        res.json({ success: true, data: listing });
    } catch (error) {
        console.error('Error fetching listing by code:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch listing' });
    }
});

/**
 * GET /marketplace/:id
 * Get a single listing by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const listing = await MarketplaceModel.findById(id);

        if (!listing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }

        // Increment view count (don't wait for it)
        MarketplaceModel.incrementViews(id).catch(console.error);

        res.json({ success: true, data: listing });
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch listing' });
    }
});

/**
 * GET /marketplace/seller/:userId
 * Get all listings from a specific seller
 */
router.get('/seller/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        const listings = await MarketplaceModel.getSellerListings(
            userId,
            status as string | undefined
        );

        const profile = await MarketplaceModel.getSellerProfile(userId);

        res.json({
            success: true,
            data: {
                listings,
                seller: profile
            }
        });
    } catch (error) {
        console.error('Error fetching seller listings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch seller listings' });
    }
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * GET /marketplace/my-listings
 * Get the logged-in user's own listings
 */
router.get('/my-listings', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { status } = req.query;
        const listings = await MarketplaceModel.getSellerListings(userId, status as string | undefined);

        res.json({ success: true, data: listings });
    } catch (error) {
        console.error('Error fetching my listings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch your listings' });
    }
});

/**
 * POST /marketplace
 * Create a new marketplace listing
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const {
            itemId,
            title,
            description,
            price,
            condition,
            shipping,
            images,
            category,
            tags,
            location
        } = req.body;

        // Validate required fields
        if (!itemId || !title || !price || !condition || !shipping) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: itemId, title, price, condition, shipping'
            });
        }

        const listingData: CreateListingData = {
            itemId,
            sellerId: userId,
            title,
            description: description || '',
            price: parseFloat(price),
            condition,
            shipping,
            images: images || [],
            category: category || 'other',
            tags: tags || [],
            location: location || { country: 'BR' }
        };

        const listing = await MarketplaceModel.createListing(listingData);

        res.status(201).json({ success: true, data: listing });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ success: false, error: 'Failed to create listing' });
    }
});

/**
 * PUT /marketplace/:id
 * Update a listing (only owner can update)
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Check ownership
        const existing = await MarketplaceModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }
        if (existing.sellerId !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this listing' });
        }

        const updateData = req.body;
        const updated = await MarketplaceModel.updateListing(id, updateData);

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ success: false, error: 'Failed to update listing' });
    }
});

/**
 * DELETE /marketplace/:id
 * Delete a listing (only owner can delete)
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Check ownership
        const existing = await MarketplaceModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }
        if (existing.sellerId !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this listing' });
        }

        await MarketplaceModel.deleteListing(id);

        res.json({ success: true, message: 'Listing deleted' });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({ success: false, error: 'Failed to delete listing' });
    }
});

/**
 * POST /marketplace/:id/like
 * Toggle like on a listing
 */
router.post('/:id/like', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { id } = req.params;
        const isLiked = await MarketplaceModel.toggleLike(id, userId);

        res.json({ success: true, data: { liked: isLiked } });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle like' });
    }
});

/**
 * POST /marketplace/:id/purchase
 * Purchase a listing (mock payment for now)
 */
router.post('/:id/purchase', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { id } = req.params;
        const { shippingAddress, paymentMethod = 'mock' } = req.body;

        if (!shippingAddress) {
            return res.status(400).json({ success: false, error: 'Shipping address is required' });
        }

        // Get the listing
        const listing = await MarketplaceModel.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }
        if (listing.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Listing is not available for purchase' });
        }
        if (listing.sellerId === userId) {
            return res.status(400).json({ success: false, error: 'Cannot purchase your own listing' });
        }

        // Calculate fees (mock)
        const platformFee = listing.price * 0.10; // 10% platform fee
        const paymentFee = listing.price * 0.03; // 3% payment processing
        const shippingFee = listing.shipping?.domestic?.cost || 0;

        // Create transaction
        const transaction = await MarketplaceModel.createTransaction({
            listingId: id,
            buyerId: userId,
            sellerId: listing.sellerId,
            amount: listing.price + shippingFee,
            fees: {
                platformFee,
                paymentFee,
                shippingFee
            },
            shippingAddress,
            paymentMethod
        });

        // Mark listing as sold
        await MarketplaceModel.updateStatus(id, 'sold');

        res.status(201).json({
            success: true,
            data: transaction,
            message: 'Purchase successful! (Mock payment - no actual charges made)'
        });
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ success: false, error: 'Failed to process purchase' });
    }
});

/**
 * POST /marketplace/:id/offer
 * Make an offer on a listing
 */
router.post('/:id/offer', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const { id } = req.params;
        const { amount, message } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, error: 'Valid offer amount is required' });
        }

        // Get the listing
        const listing = await MarketplaceModel.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, error: 'Listing not found' });
        }
        if (listing.status !== 'active') {
            return res.status(400).json({ success: false, error: 'Listing is not available for offers' });
        }
        if (listing.sellerId === userId) {
            return res.status(400).json({ success: false, error: 'Cannot make an offer on your own listing' });
        }

        // For now, just return success (full offer system would need its own table)
        // The MarketplaceOffer type exists but we'd need to implement the offers table queries
        res.status(201).json({
            success: true,
            data: {
                id: `offer_${Date.now()}`,
                listingId: id,
                buyerId: userId,
                amount: parseFloat(amount),
                message: message || '',
                status: 'pending',
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
                createdAt: new Date()
            },
            message: 'Offer sent to seller (mock - notification system coming soon)'
        });
    } catch (error) {
        console.error('Error making offer:', error);
        res.status(500).json({ success: false, error: 'Failed to make offer' });
    }
});

export default router;
