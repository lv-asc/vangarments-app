import { BrandAccountModel } from '../../src/models/BrandAccount';
import { BrandCatalogModel } from '../../src/models/BrandCatalog';
import { CommissionTrackingModel } from '../../src/models/CommissionTracking';
import { VUFSItemModel } from '../../src/models/VUFSItem';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

// Mock VUFSItemModel
jest.mock('../../src/models/VUFSItem', () => ({
  VUFSItemModel: {
    findById: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockVUFSItemModel = VUFSItemModel as jest.Mocked<typeof VUFSItemModel>;

describe('Brand Partnership Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBrandInfo = {
    name: 'Nike',
    description: 'Just Do It',
    website: 'https://nike.com',
    logo: 'https://example.com/nike-logo.png',
    contactInfo: {
      email: 'contact@nike.com',
      phone: '+1-800-344-6453'
    }
  };

  const mockVUFSItem = {
    id: 'vufs456',
    vufsCode: 'VG-1234567890-ABC123DEF456',
    ownerId: 'user123',
    category: { page: 'Footwear', blueSubcategory: 'Sneakers' },
    brand: { brand: 'Nike®', line: 'Air Max' },
    metadata: { name: 'Air Max 90', retailPrice: 129.99 },
    images: [],
    condition: { status: 'New' },
    ownership: { status: 'owned', visibility: 'public' },
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  };

  describe('Complete Brand Partnership Setup Workflow', () => {
    it('should complete full brand partnership setup from registration to commission tracking', async () => {
      // Step 1: Create brand account
      mockDb.query
        // findByUserId check (no existing account)
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
        // create brand account
        .mockResolvedValueOnce({
          rows: [{
            id: 'brand123',
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'pending',
            partnership_tier: 'basic',
            badges: [],
            catalog_items_count: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: []
        });

      const brandAccount = await BrandAccountModel.create({
        userId: 'user123',
        brandInfo: mockBrandInfo
      });

      expect(brandAccount.id).toBe('brand123');
      expect(brandAccount.verificationStatus).toBe('pending');
      expect(brandAccount.partnershipTier).toBe('basic');

      // Step 2: Verify and upgrade brand account
      mockDb.query
        // findById for current data
        .mockResolvedValueOnce({
          rows: [{
            id: 'brand123',
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'pending',
            partnership_tier: 'basic',
            badges: [],
            catalog_items_count: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        // update brand account
        .mockResolvedValueOnce({
          rows: [{
            id: 'brand123',
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'verified',
            partnership_tier: 'premium',
            badges: ['verified', 'premium_partner'],
            catalog_items_count: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: []
        });

      const updatedBrand = await BrandAccountModel.update('brand123', {
        verificationStatus: 'verified',
        partnershipTier: 'premium'
      });

      expect(updatedBrand?.verificationStatus).toBe('verified');
      expect(updatedBrand?.partnershipTier).toBe('premium');

      // Step 3: Add items to brand catalog
      mockVUFSItemModel.findById.mockResolvedValueOnce(mockVUFSItem);

      mockDb.query
        // check if item already exists in catalog
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
        // create catalog item
        .mockResolvedValueOnce({
          rows: [{
            id: 'catalog123',
            brand_id: 'brand123',
            vufs_item_id: 'vufs456',
            official_price: '129.99',
            availability_status: 'available',
            purchase_link: 'https://nike.com/air-max-90',
            brand_specific_data: { sku: 'NK-AIR-001', collection: 'Air Max' },
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: []
        });

      const catalogItem = await BrandCatalogModel.create({
        brandId: 'brand123',
        vufsItemId: 'vufs456',
        officialPrice: 129.99,
        availabilityStatus: 'available',
        purchaseLink: 'https://nike.com/air-max-90',
        brandSpecificData: {
          sku: 'NK-AIR-001',
          collection: 'Air Max'
        }
      });

      expect(catalogItem.brandId).toBe('brand123');
      expect(catalogItem.vufsItemId).toBe('vufs456');
      expect(catalogItem.officialPrice).toBe(129.99);

      // Step 4: Create commission for a sale
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'commission123',
          transaction_id: 'txn123',
          brand_id: 'brand123',
          store_id: null,
          amount: '129.99',
          commission_rate: '0.05',
          commission_amount: '6.50',
          platform_fee: '0.33',
          net_amount: '6.17',
          status: 'pending',
          payment_method: null,
          payment_date: null,
          notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const commission = await CommissionTrackingModel.create({
        transactionId: 'txn123',
        brandId: 'brand123',
        amount: 129.99,
        commissionRate: 0.05 // 5% commission
      });

      expect(commission.brandId).toBe('brand123');
      expect(commission.amount).toBe(129.99);
      expect(commission.commissionAmount).toBe(6.50);
      expect(commission.netAmount).toBe(6.17);
      expect(commission.status).toBe('pending');

      // Step 5: Approve and process commission payment
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'commission123',
          transaction_id: 'txn123',
          brand_id: 'brand123',
          store_id: null,
          amount: '129.99',
          commission_rate: '0.05',
          commission_amount: '6.50',
          platform_fee: '0.33',
          net_amount: '6.17',
          status: 'approved',
          payment_method: null,
          payment_date: null,
          notes: 'Commission approved for payment',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const approvedCommission = await CommissionTrackingModel.update('commission123', {
        status: 'approved',
        notes: 'Commission approved for payment'
      });

      expect(approvedCommission?.status).toBe('approved');

      // Process payment
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.processPayment(['commission123'], 'bank_transfer');

      // Verify all steps completed successfully
      expect(mockDb.query).toHaveBeenCalledTimes(8);
    });
  });

  describe('Brand Catalog Management Workflow', () => {
    it('should handle complete catalog management lifecycle', async () => {
      const brandId = 'brand123';
      
      // Step 1: Add multiple items to catalog
      const catalogItems = [
        { vufsItemId: 'vufs1', officialPrice: 99.99, sku: 'NK-001' },
        { vufsItemId: 'vufs2', officialPrice: 149.99, sku: 'NK-002' },
        { vufsItemId: 'vufs3', officialPrice: 199.99, sku: 'NK-003' }
      ];

      for (let i = 0; i < catalogItems.length; i++) {
        const item = catalogItems[i];
        
        mockVUFSItemModel.findById.mockResolvedValueOnce({
          ...mockVUFSItem,
          id: item.vufsItemId
        });

        mockDb.query
          // check existing
          .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
          // create item
          .mockResolvedValueOnce({
            rows: [{
              id: `catalog${i + 1}`,
              brand_id: brandId,
              vufs_item_id: item.vufsItemId,
              official_price: item.officialPrice.toString(),
              availability_status: 'available',
              purchase_link: null,
              brand_specific_data: { sku: item.sku },
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z'
            }],
            rowCount: 1,
            command: 'INSERT',
            oid: 0,
            fields: []
          });

        const catalogItem = await BrandCatalogModel.create({
          brandId,
          vufsItemId: item.vufsItemId,
          officialPrice: item.officialPrice,
          brandSpecificData: { sku: item.sku }
        });

        expect(catalogItem.vufsItemId).toBe(item.vufsItemId);
        expect(catalogItem.officialPrice).toBe(item.officialPrice);
      }

      // Step 2: Bulk update availability status
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 2,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.bulkUpdateAvailability(brandId, [
        { vufsItemId: 'vufs1', availabilityStatus: 'out_of_stock' },
        { vufsItemId: 'vufs2', availabilityStatus: 'discontinued' }
      ]);

      // Step 3: Get collections and seasons
      mockDb.query
        // get collections
        .mockResolvedValueOnce({
          rows: [
            { collection: 'Air Max', item_count: 15 },
            { collection: 'Air Force', item_count: 8 }
          ],
          rowCount: 2,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        // get seasons
        .mockResolvedValueOnce({
          rows: [
            { season: 'Spring 2024', item_count: 12 },
            { season: 'Fall 2023', item_count: 11 }
          ],
          rowCount: 2,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

      const collections = await BrandCatalogModel.getCollections(brandId);
      const seasons = await BrandCatalogModel.getSeasons(brandId);

      expect(collections).toHaveLength(2);
      expect(seasons).toHaveLength(2);
      expect(collections[0].collection).toBe('Air Max');
      expect(seasons[0].season).toBe('Spring 2024');

      // Verify all operations completed
      expect(mockDb.query).toHaveBeenCalledTimes(9); // 3 creates + 1 bulk update + 2 analytics
    });
  });

  describe('Commission Tracking and Payment Workflow', () => {
    it('should handle complete commission lifecycle from creation to payment', async () => {
      const brandId = 'brand123';
      const transactionId = 'txn123';

      // Step 1: Create commission for transaction
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'commission123',
          transaction_id: transactionId,
          brand_id: brandId,
          store_id: null,
          amount: '500.00',
          commission_rate: '0.10',
          commission_amount: '50.00',
          platform_fee: '2.50',
          net_amount: '47.50',
          status: 'pending',
          payment_method: null,
          payment_date: null,
          notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const commission = await CommissionTrackingModel.create({
        transactionId,
        brandId,
        amount: 500.00,
        commissionRate: 0.10
      });

      expect(commission.commissionAmount).toBe(50.00);
      expect(commission.platformFee).toBe(2.50);
      expect(commission.netAmount).toBe(47.50);

      // Step 2: Get commission summary for brand
      mockDb.query
        // summary query
        .mockResolvedValueOnce({
          rows: [{
            transaction_count: 10,
            total_commissions: '750.00',
            total_paid: '200.00',
            total_pending: '550.00',
            avg_commission_rate: '0.08'
          }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        // period breakdown query
        .mockResolvedValueOnce({
          rows: [
            { period: '2024-01', commissions: '300.00', transactions: 6 },
            { period: '2024-02', commissions: '250.00', transactions: 4 }
          ],
          rowCount: 2,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

      const summary = await CommissionTrackingModel.getCommissionSummary(brandId);

      expect(summary.totalCommissions).toBe(750);
      expect(summary.totalPending).toBe(550);
      expect(summary.transactionCount).toBe(10);
      expect(summary.periodBreakdown).toHaveLength(2);

      // Step 3: Bulk approve pending commissions
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 3,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.bulkApprove(['commission123', 'commission124', 'commission125']);

      // Step 4: Process payment for approved commissions
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 3,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.processPayment(
        ['commission123', 'commission124', 'commission125'],
        'bank_transfer'
      );

      // Verify all operations completed
      expect(mockDb.query).toHaveBeenCalledTimes(6);
    });

    it('should handle commission disputes and resolution', async () => {
      const commissionId = 'commission123';

      // Step 1: Mark commission as disputed
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: commissionId,
          transaction_id: 'txn123',
          brand_id: 'brand123',
          store_id: null,
          amount: '200.00',
          commission_rate: '0.05',
          commission_amount: '10.00',
          platform_fee: '0.50',
          net_amount: '9.50',
          status: 'disputed',
          payment_method: null,
          payment_date: null,
          notes: 'Commission rate disputed by brand',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const disputedCommission = await CommissionTrackingModel.update(commissionId, {
        status: 'disputed',
        notes: 'Commission rate disputed by brand'
      });

      expect(disputedCommission?.status).toBe('disputed');
      expect(disputedCommission?.notes).toBe('Commission rate disputed by brand');

      // Step 2: Resolve dispute and approve
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: commissionId,
          transaction_id: 'txn123',
          brand_id: 'brand123',
          store_id: null,
          amount: '200.00',
          commission_rate: '0.05',
          commission_amount: '10.00',
          platform_fee: '0.50',
          net_amount: '9.50',
          status: 'approved',
          payment_method: null,
          payment_date: null,
          notes: 'Dispute resolved - commission approved',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const resolvedCommission = await CommissionTrackingModel.update(commissionId, {
        status: 'approved',
        notes: 'Dispute resolved - commission approved'
      });

      expect(resolvedCommission?.status).toBe('approved');
      expect(resolvedCommission?.notes).toBe('Dispute resolved - commission approved');

      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Partnership Agreement Workflow', () => {
    it('should handle brand partnership tier upgrades and badge management', async () => {
      const brandId = 'brand123';

      // Step 1: Start with basic tier
      mockDb.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: brandId,
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'pending',
            partnership_tier: 'basic',
            badges: [],
            catalog_items_count: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: []
        });

      const brandAccount = await BrandAccountModel.create({
        userId: 'user123',
        brandInfo: mockBrandInfo
      });

      expect(brandAccount.partnershipTier).toBe('basic');

      // Step 2: Add verification badge
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.addBadge(brandId, 'verified');

      // Step 3: Upgrade to premium tier
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            id: brandId,
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'pending',
            partnership_tier: 'basic',
            badges: ['verified'],
            catalog_items_count: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        .mockResolvedValueOnce({
          rows: [{
            id: brandId,
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'verified',
            partnership_tier: 'premium',
            badges: ['verified'],
            catalog_items_count: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: []
        });

      const upgradedBrand = await BrandAccountModel.update(brandId, {
        verificationStatus: 'verified',
        partnershipTier: 'premium'
      });

      expect(upgradedBrand?.verificationStatus).toBe('verified');
      expect(upgradedBrand?.partnershipTier).toBe('premium');

      // Step 4: Add premium partner badge
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.addBadge(brandId, 'premium_partner');

      // Step 5: Get analytics for premium brand
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{ count: 50 }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        .mockResolvedValueOnce({
          rows: [{ total_sales: '25000.00', total_commission: '1250.00' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

      const analytics = await BrandAccountModel.getAnalytics(brandId);

      expect(analytics.totalCatalogItems).toBe(50);
      expect(analytics.totalSales).toBe(25000);
      expect(analytics.totalCommission).toBe(1250);

      expect(mockDb.query).toHaveBeenCalledTimes(8);
    });

    it('should handle partnership termination workflow', async () => {
      const brandId = 'brand123';

      // Step 1: Remove premium badges
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.removeBadge(brandId, 'premium_partner');

      // Step 2: Downgrade partnership tier
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            id: brandId,
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'verified',
            partnership_tier: 'premium',
            badges: ['verified'],
            catalog_items_count: 25,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        })
        .mockResolvedValueOnce({
          rows: [{
            id: brandId,
            user_id: 'user123',
            brand_info: mockBrandInfo,
            verification_status: 'verified',
            partnership_tier: 'basic',
            badges: ['verified'],
            catalog_items_count: 25,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }],
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: []
        });

      const downgradedBrand = await BrandAccountModel.update(brandId, {
        partnershipTier: 'basic'
      });

      expect(downgradedBrand?.partnershipTier).toBe('basic');

      // Step 3: Process final commission payments
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 2,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.processPayment(['commission1', 'commission2'], 'final_payment');

      expect(mockDb.query).toHaveBeenCalledTimes(4);
    });
  });
});