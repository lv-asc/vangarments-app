/**
 * Comprehensive unit tests for Marketplace model
 * Tests condition assessment logic, listing management, and transaction handling
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { MarketplaceModel, CreateListingData } from '../../src/models/Marketplace';
import { DetailedCondition, ShippingOptions } from '@vangarments/shared/types/marketplace';

// Mock database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

const { db } = require('../../src/database/connection');
const mockDb = db as jest.Mocked<typeof db>;

describe('MarketplaceModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Condition Assessment Logic', () => {
    describe('createListing with condition validation', () => {
      it('should create listing with detailed condition assessment for new items', async () => {
        const condition: DetailedCondition = {
          status: 'new',
          description: 'Brand new with tags, never worn',
          defects: [],
          wearSigns: [],
          alterations: [],
          authenticity: 'guaranteed',
          boxIncluded: true,
          tagsIncluded: true,
          receiptIncluded: true,
        };

        const listingData: CreateListingData = {
          itemId: 'item-123',
          sellerId: 'seller-456',
          title: 'Brand New Nike Air Max',
          description: 'Never worn, still in original box',
          price: 299.99,
          condition,
          shipping: {
            domestic: { available: true, cost: 15, estimatedDays: 3, methods: ['standard'] },
            international: { available: false },
            handlingTime: 1,
            returnPolicy: { accepted: true, period: 30, conditions: ['original_condition'], returnShipping: 'buyer' },
          },
          images: ['image1.jpg', 'image2.jpg'],
          category: 'Sneakers',
          tags: ['Nike', 'Air Max'],
          location: { country: 'Brazil', state: 'SP', city: 'São Paulo' },
        };

        const mockDbResult = {
          rows: [{
            id: 'listing-123',
            item_id: 'item-123',
            seller_id: 'seller-456',
            title: 'Brand New Nike Air Max',
            description: 'Never worn, still in original box',
            price: 299.99,
            condition_info: JSON.stringify(condition),
            shipping_options: JSON.stringify(listingData.shipping),
            images: ['image1.jpg', 'image2.jpg'],
            category: 'Sneakers',
            tags: ['Nike', 'Air Max'],
            location: JSON.stringify(listingData.location),
            status: 'active',
            views: 0,
            likes: 0,
            watchers: 0,
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01'),
            expires_at: null,
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.createListing(listingData);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO marketplace_listings'),
          expect.arrayContaining([
            'item-123',
            'seller-456',
            'Brand New Nike Air Max',
            'Never worn, still in original box',
            299.99,
            JSON.stringify(condition),
            JSON.stringify(listingData.shipping),
            ['image1.jpg', 'image2.jpg'],
            'Sneakers',
            ['Nike', 'Air Max'],
            JSON.stringify(listingData.location),
            null,
          ])
        );

        expect(result.condition.status).toBe('new');
        expect(result.condition.authenticity).toBe('guaranteed');
        expect(result.condition.boxIncluded).toBe(true);
        expect(result.condition.tagsIncluded).toBe(true);
        expect(result.condition.receiptIncluded).toBe(true);
      });

      it('should create listing with used condition and detailed defects', async () => {
        const condition: DetailedCondition = {
          status: 'good',
          description: 'Gently used with minor wear signs',
          defects: ['small_scuff_on_heel', 'slight_sole_wear'],
          wearSigns: ['creasing_on_toe_box', 'minor_dirt_on_outsole'],
          alterations: [],
          authenticity: 'likely_authentic',
          boxIncluded: false,
          tagsIncluded: false,
          receiptIncluded: false,
        };

        const listingData: CreateListingData = {
          itemId: 'item-456',
          sellerId: 'seller-789',
          title: 'Used Adidas Ultraboost',
          description: 'Worn a few times, still in great condition',
          price: 120.00,
          condition,
          shipping: {
            domestic: { available: true, cost: 12, estimatedDays: 5, methods: ['standard'] },
            international: { available: true, cost: 25, estimatedDays: 10, restrictions: ['no_liquids'] },
            handlingTime: 2,
            returnPolicy: { accepted: true, period: 14, conditions: ['as_described'], returnShipping: 'buyer' },
          },
          images: ['used1.jpg', 'used2.jpg', 'defect1.jpg'],
          category: 'Sneakers',
          tags: ['Adidas', 'Ultraboost'],
          location: { country: 'Brazil', state: 'RJ' },
        };

        const mockDbResult = {
          rows: [{
            id: 'listing-456',
            item_id: 'item-456',
            seller_id: 'seller-789',
            title: 'Used Adidas Ultraboost',
            description: 'Worn a few times, still in great condition',
            price: 120.00,
            condition_info: JSON.stringify(condition),
            shipping_options: JSON.stringify(listingData.shipping),
            images: ['used1.jpg', 'used2.jpg', 'defect1.jpg'],
            category: 'Sneakers',
            tags: ['Adidas', 'Ultraboost'],
            location: JSON.stringify(listingData.location),
            status: 'active',
            views: 0,
            likes: 0,
            watchers: 0,
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01'),
            expires_at: null,
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.createListing(listingData);

        expect(result.condition.status).toBe('good');
        expect(result.condition.defects).toEqual(['small_scuff_on_heel', 'slight_sole_wear']);
        expect(result.condition.wearSigns).toEqual(['creasing_on_toe_box', 'minor_dirt_on_outsole']);
        expect(result.condition.authenticity).toBe('likely_authentic');
        expect(result.condition.boxIncluded).toBe(false);
      });

      it('should validate condition status enum values', async () => {
        const validStatuses = ['new', 'dswt', 'never_used', 'excellent', 'good', 'fair', 'poor'];
        
        for (const status of validStatuses) {
          const condition: DetailedCondition = {
            status: status as any,
            description: `Item in ${status} condition`,
            defects: [],
            wearSigns: [],
            alterations: [],
            authenticity: 'guaranteed',
          };

          const listingData: CreateListingData = {
            itemId: `item-${status}`,
            sellerId: 'seller-123',
            title: `Test Item ${status}`,
            description: 'Test description',
            price: 100,
            condition,
            shipping: {
              domestic: { available: true, cost: 10, estimatedDays: 3, methods: ['standard'] },
              international: { available: false },
              handlingTime: 1,
              returnPolicy: { accepted: true, period: 30, conditions: [], returnShipping: 'buyer' },
            },
            images: [],
            category: 'Test',
            location: { country: 'Brazil' },
          };

          const mockDbResult = {
            rows: [{
              id: `listing-${status}`,
              condition_info: JSON.stringify(condition),
              // ... other fields
              created_at: new Date(),
              updated_at: new Date(),
            }],
          };

          mockDb.query.mockResolvedValue(mockDbResult as any);

          const result = await MarketplaceModel.createListing(listingData);
          expect(result.condition.status).toBe(status);
        }
      });

      it('should handle authenticity verification levels', async () => {
        const authenticityLevels = ['guaranteed', 'likely_authentic', 'unknown', 'replica'];
        
        for (const authenticity of authenticityLevels) {
          const condition: DetailedCondition = {
            status: 'good',
            description: 'Test item',
            defects: [],
            wearSigns: [],
            alterations: [],
            authenticity: authenticity as any,
          };

          const listingData: CreateListingData = {
            itemId: `item-auth-${authenticity}`,
            sellerId: 'seller-123',
            title: `Test Item ${authenticity}`,
            description: 'Test description',
            price: 100,
            condition,
            shipping: {
              domestic: { available: true, cost: 10, estimatedDays: 3, methods: ['standard'] },
              international: { available: false },
              handlingTime: 1,
              returnPolicy: { accepted: true, period: 30, conditions: [], returnShipping: 'buyer' },
            },
            images: [],
            category: 'Test',
            location: { country: 'Brazil' },
          };

          const mockDbResult = {
            rows: [{
              id: `listing-auth-${authenticity}`,
              condition_info: JSON.stringify(condition),
              created_at: new Date(),
              updated_at: new Date(),
            }],
          };

          mockDb.query.mockResolvedValue(mockDbResult as any);

          const result = await MarketplaceModel.createListing(listingData);
          expect(result.condition.authenticity).toBe(authenticity);
        }
      });
    });

    describe('updateListing condition changes', () => {
      it('should update condition assessment when item condition changes', async () => {
        const originalCondition: DetailedCondition = {
          status: 'excellent',
          description: 'Nearly perfect condition',
          defects: [],
          wearSigns: ['minimal_wear'],
          alterations: [],
          authenticity: 'guaranteed',
        };

        const updatedCondition: DetailedCondition = {
          status: 'good',
          description: 'Good condition with some wear',
          defects: ['small_scratch'],
          wearSigns: ['minimal_wear', 'slight_fading'],
          alterations: [],
          authenticity: 'guaranteed',
        };

        const mockDbResult = {
          rows: [{
            id: 'listing-123',
            condition_info: JSON.stringify(updatedCondition),
            created_at: new Date(),
            updated_at: new Date(),
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.updateListing('listing-123', {
          condition: updatedCondition,
        });

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE marketplace_listings'),
          expect.arrayContaining([
            JSON.stringify(updatedCondition),
            'listing-123',
          ])
        );

        expect(result?.condition.status).toBe('good');
        expect(result?.condition.defects).toContain('small_scratch');
        expect(result?.condition.wearSigns).toContain('slight_fading');
      });
    });
  });

  describe('Transaction Management', () => {
    describe('createTransaction', () => {
      it('should create transaction with proper fee calculation', async () => {
        const transactionData = {
          listingId: 'listing-123',
          buyerId: 'buyer-456',
          sellerId: 'seller-789',
          amount: 200.00,
          fees: {
            platformFee: 10.00, // 5%
            paymentFee: 5.80,   // 2.9%
            shippingFee: 15.00,
          },
          shippingAddress: {
            name: 'João Silva',
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01234-567',
            country: 'Brazil',
            phone: '+5511999999999',
          },
          paymentMethod: 'credit_card',
        };

        const expectedNetAmount = 200.00 - 10.00 - 5.80; // 184.20

        const mockDbResult = {
          rows: [{
            id: 'transaction-123',
            listing_id: 'listing-123',
            buyer_id: 'buyer-456',
            seller_id: 'seller-789',
            amount: 200.00,
            fees: JSON.stringify(transactionData.fees),
            net_amount: expectedNetAmount,
            shipping_address: JSON.stringify(transactionData.shippingAddress),
            payment_method: 'credit_card',
            status: 'pending_payment',
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-01'),
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.createTransaction(transactionData);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO marketplace_transactions'),
          expect.arrayContaining([
            'listing-123',
            'buyer-456',
            'seller-789',
            200.00,
            JSON.stringify(transactionData.fees),
            expectedNetAmount,
            JSON.stringify(transactionData.shippingAddress),
            'credit_card',
            'pending_payment',
          ])
        );

        expect(result.id).toBe('transaction-123');
        expect(result.amount).toBe(200.00);
        expect(result.netAmount).toBe(expectedNetAmount);
        expect(result.fees.platformFee).toBe(10.00);
        expect(result.fees.paymentFee).toBe(5.80);
        expect(result.status).toBe('pending_payment');
      });

      it('should handle Brazilian shipping address format', async () => {
        const brazilianAddress = {
          name: 'Maria Santos',
          street: 'Av. Paulista, 1000, Apto 501',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01310-100',
          country: 'Brazil',
          phone: '+5511987654321',
        };

        const transactionData = {
          listingId: 'listing-456',
          buyerId: 'buyer-789',
          sellerId: 'seller-123',
          amount: 150.00,
          fees: {
            platformFee: 7.50,
            paymentFee: 4.35,
            shippingFee: 12.00,
          },
          shippingAddress: brazilianAddress,
          paymentMethod: 'pix',
        };

        const mockDbResult = {
          rows: [{
            id: 'transaction-456',
            shipping_address: JSON.stringify(brazilianAddress),
            payment_method: 'pix',
            status: 'pending_payment',
            created_at: new Date(),
            updated_at: new Date(),
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.createTransaction(transactionData);

        expect(result.shipping.address.name).toBe('Maria Santos');
        expect(result.shipping.address.street).toBe('Av. Paulista, 1000, Apto 501');
        expect(result.shipping.address.postalCode).toBe('01310-100');
        expect(result.paymentMethod).toBe('pix');
      });
    });

    describe('Transaction Status Updates', () => {
      it('should update listing status when transaction is created', async () => {
        const mockDbResult = {
          rows: [{
            id: 'listing-123',
            status: 'reserved',
            updated_at: new Date(),
            created_at: new Date(),
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.updateStatus('listing-123', 'reserved');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE marketplace_listings'),
          ['reserved', 'listing-123']
        );

        expect(result?.status).toBe('reserved');
      });

      it('should handle all valid listing status transitions', async () => {
        const validStatuses = ['draft', 'active', 'sold', 'reserved', 'expired', 'removed', 'under_review'];
        
        for (const status of validStatuses) {
          const mockDbResult = {
            rows: [{
              id: 'listing-test',
              status,
              updated_at: new Date(),
              created_at: new Date(),
            }],
          };

          mockDb.query.mockResolvedValue(mockDbResult as any);

          const result = await MarketplaceModel.updateStatus('listing-test', status);
          expect(result?.status).toBe(status);
        }
      });
    });
  });

  describe('Search and Filtering', () => {
    describe('searchListings with condition filters', () => {
      it('should filter listings by condition status', async () => {
        const filters = {
          condition: ['new', 'dswt', 'never_used'],
          priceRange: { min: 50, max: 300 },
        };

        const mockCountResult = { rows: [{ total: '5' }] };
        const mockListingsResult = {
          rows: [
            {
              id: 'listing-1',
              condition_info: JSON.stringify({ status: 'new' }),
              price: 100,
              created_at: new Date(),
              updated_at: new Date(),
            },
            {
              id: 'listing-2',
              condition_info: JSON.stringify({ status: 'dswt' }),
              price: 150,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };

        mockDb.query
          .mockResolvedValueOnce(mockCountResult as any)
          .mockResolvedValueOnce(mockListingsResult as any);

        const result = await MarketplaceModel.searchListings(filters, 50, 0);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining("condition_info->>'status' = ANY($2)"),
          expect.arrayContaining([
            'active',
            ['new', 'dswt', 'never_used'],
          ])
        );

        expect(result.listings).toHaveLength(2);
        expect(result.total).toBe(5);
      });

      it('should filter by price range', async () => {
        const filters = {
          priceRange: { min: 100, max: 200 },
        };

        const mockCountResult = { rows: [{ total: '3' }] };
        const mockListingsResult = {
          rows: [
            {
              id: 'listing-1',
              price: 150,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };

        mockDb.query
          .mockResolvedValueOnce(mockCountResult as any)
          .mockResolvedValueOnce(mockListingsResult as any);

        await MarketplaceModel.searchListings(filters, 50, 0);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('price BETWEEN $2 AND $3'),
          expect.arrayContaining([
            'active',
            100,
            200,
          ])
        );
      });

      it('should search by text in title, description, and tags', async () => {
        const filters = {
          search: 'Nike Air Max',
        };

        const mockCountResult = { rows: [{ total: '2' }] };
        const mockListingsResult = {
          rows: [
            {
              id: 'listing-1',
              title: 'Nike Air Max 90',
              description: 'Classic Nike sneaker',
              tags: ['Nike', 'Air Max'],
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };

        mockDb.query
          .mockResolvedValueOnce(mockCountResult as any)
          .mockResolvedValueOnce(mockListingsResult as any);

        await MarketplaceModel.searchListings(filters, 50, 0);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('title ILIKE $2 OR description ILIKE $2 OR $3 = ANY(tags)'),
          expect.arrayContaining([
            'active',
            '%Nike Air Max%',
            'Nike Air Max',
          ])
        );
      });
    });
  });

  describe('Seller Profile and Analytics', () => {
    describe('getSellerProfile', () => {
      it('should retrieve comprehensive seller profile with ratings and stats', async () => {
        const mockDbResult = {
          rows: [{
            id: 'seller-123',
            display_name: 'João Vendedor',
            total_listings: '15',
            total_sales: '8',
            rating: '4.5',
            member_since: new Date('2022-01-01'),
          }],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await MarketplaceModel.getSellerProfile('seller-123');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('COUNT(ml.id) as total_listings'),
          ['seller-123']
        );

        expect(result?.userId).toBe('seller-123');
        expect(result?.displayName).toBe('João Vendedor');
        expect(result?.totalListings).toBe(15);
        expect(result?.totalSales).toBe(8);
        expect(result?.rating).toBe(4.5);
        expect(result?.verificationStatus.email).toBe(true);
      });

      it('should return null for non-existent seller', async () => {
        mockDb.query.mockResolvedValue({ rows: [] } as any);

        const result = await MarketplaceModel.getSellerProfile('non-existent-seller');

        expect(result).toBeNull();
      });
    });
  });

  describe('Like and Engagement Features', () => {
    describe('toggleLike', () => {
      it('should add like when user has not liked the listing', async () => {
        // Mock check for existing like (none found)
        mockDb.query
          .mockResolvedValueOnce({ rows: [] } as any) // Check query
          .mockResolvedValueOnce({} as any) // Insert like
          .mockResolvedValueOnce({} as any); // Update likes count

        const result = await MarketplaceModel.toggleLike('listing-123', 'user-456');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT id FROM listing_likes WHERE listing_id = $1 AND user_id = $2',
          ['listing-123', 'user-456']
        );

        expect(mockDb.query).toHaveBeenCalledWith(
          'INSERT INTO listing_likes (listing_id, user_id) VALUES ($1, $2)',
          ['listing-123', 'user-456']
        );

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE marketplace_listings SET likes = likes + 1 WHERE id = $1',
          ['listing-123']
        );

        expect(result).toBe(true);
      });

      it('should remove like when user has already liked the listing', async () => {
        // Mock check for existing like (found)
        mockDb.query
          .mockResolvedValueOnce({ rows: [{ id: 'like-123' }] } as any) // Check query
          .mockResolvedValueOnce({} as any) // Delete like
          .mockResolvedValueOnce({} as any); // Update likes count

        const result = await MarketplaceModel.toggleLike('listing-123', 'user-456');

        expect(mockDb.query).toHaveBeenCalledWith(
          'DELETE FROM listing_likes WHERE listing_id = $1 AND user_id = $2',
          ['listing-123', 'user-456']
        );

        expect(mockDb.query).toHaveBeenCalledWith(
          'UPDATE marketplace_listings SET likes = likes - 1 WHERE id = $1',
          ['listing-123']
        );

        expect(result).toBe(false);
      });
    });

    describe('incrementViews', () => {
      it('should increment view count for listing', async () => {
        mockDb.query.mockResolvedValue({} as any);

        await MarketplaceModel.incrementViews('listing-123');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE marketplace_listings SET views = views + 1'),
          ['listing-123']
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(MarketplaceModel.findById('listing-123')).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid JSON in condition_info', async () => {
      const mockDbResult = {
        rows: [{
          id: 'listing-123',
          condition_info: 'invalid json',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      await expect(MarketplaceModel.findById('listing-123')).rejects.toThrow();
    });

    it('should handle constraint violations during transaction creation', async () => {
      mockDb.query.mockRejectedValue(new Error('foreign key constraint violation'));

      const transactionData = {
        listingId: 'non-existent-listing',
        buyerId: 'buyer-123',
        sellerId: 'seller-456',
        amount: 100,
        fees: { platformFee: 5, paymentFee: 3, shippingFee: 10 },
        shippingAddress: {
          name: 'Test User',
          street: 'Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'Brazil',
        },
        paymentMethod: 'credit_card',
      };

      await expect(MarketplaceModel.createTransaction(transactionData)).rejects.toThrow('foreign key constraint violation');
    });
  });
});