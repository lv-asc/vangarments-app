import { BrandAccountModel, CreateBrandAccountData, UpdateBrandAccountData, BrandAccount } from '../../src/models/BrandAccount';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('BrandAccountModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBrandInfo = {
    name: 'Nike',
    description: 'Just Do It',
    website: 'https://nike.com',
    logo: 'https://example.com/nike-logo.png',
    banner: 'https://example.com/nike-banner.png',
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/nike' },
      { platform: 'twitter', url: 'https://twitter.com/nike' }
    ],
    contactInfo: {
      email: 'contact@nike.com',
      phone: '+1-800-344-6453',
      address: 'One Bowerman Drive, Beaverton, OR 97005'
    },
    brandColors: ['#000000', '#FFFFFF'],
    brandStyle: ['Athletic', 'Streetwear']
  };

  const mockCreateData: CreateBrandAccountData = {
    userId: 'user123',
    brandInfo: mockBrandInfo,
    partnershipTier: 'premium'
  };

  const mockDbRow = {
    id: 'brand123',
    user_id: 'user123',
    brand_info: mockBrandInfo,
    verification_status: 'pending',
    partnership_tier: 'premium',
    badges: ['verified', 'premium_partner'],
    catalog_items_count: 25,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  describe('create', () => {
    it('should create a new brand account successfully', async () => {
      // Mock findByUserId to return null (no existing account)
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock the insert query
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.create(mockCreateData);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO brand_accounts'),
        [
          'user123',
          JSON.stringify(mockBrandInfo),
          'premium',
          'pending'
        ]
      );

      expect(result).toEqual({
        id: 'brand123',
        userId: 'user123',
        brandInfo: mockBrandInfo,
        verificationStatus: 'pending',
        partnershipTier: 'premium',
        badges: ['verified', 'premium_partner'],
        analytics: {
          totalCatalogItems: 25,
          totalSales: 0,
          totalCommission: 0,
          monthlyViews: 0
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should use default partnership tier when not provided', async () => {
      const createDataWithoutTier = {
        userId: 'user123',
        brandInfo: mockBrandInfo
      };

      mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await BrandAccountModel.create(createDataWithoutTier);

      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO brand_accounts'),
        expect.arrayContaining(['basic'])
      );
    });

    it('should throw error when user already has a brand account', async () => {
      // Mock findByUserId to return existing account
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await expect(BrandAccountModel.create(mockCreateData))
        .rejects.toThrow('User already has a brand account');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should find brand account by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.findById('brand123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ba.*'),
        ['brand123']
      );

      expect(result).toEqual({
        id: 'brand123',
        userId: 'user123',
        brandInfo: mockBrandInfo,
        verificationStatus: 'pending',
        partnershipTier: 'premium',
        badges: ['verified', 'premium_partner'],
        analytics: {
          totalCatalogItems: 25,
          totalSales: 0,
          totalCommission: 0,
          monthlyViews: 0
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should return null when brand account not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find brand account by user ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.findByUserId('user123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ba.user_id = $1'),
        ['user123']
      );

      expect(result).toBeDefined();
      expect(result?.userId).toBe('user123');
    });

    it('should return null when user has no brand account', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.findByUserId('user123');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    const mockMultipleRows = [
      { ...mockDbRow, id: 'brand1', total: '3' },
      { ...mockDbRow, id: 'brand2', total: '3' },
      { ...mockDbRow, id: 'brand3', total: '3' }
    ];

    it('should find brands without filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.findMany();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY ba.created_at DESC'),
        [20, 0]
      );

      expect(result.brands).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should apply verification status filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.findMany({ verificationStatus: 'verified' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ba.verification_status = $1'),
        expect.arrayContaining(['verified'])
      );
    });

    it('should apply partnership tier filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.findMany({ partnershipTier: 'enterprise' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ba.partnership_tier = $1'),
        expect.arrayContaining(['enterprise'])
      );
    });

    it('should apply search filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.findMany({ search: 'Nike' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("ba.brand_info->>'name' ILIKE"),
        expect.arrayContaining(['%Nike%'])
      );
    });

    it('should apply multiple filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.findMany({
        verificationStatus: 'verified',
        partnershipTier: 'premium',
        search: 'Nike'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ba.verification_status = $1 AND ba.partnership_tier = $2'),
        expect.arrayContaining(['verified', 'premium', '%Nike%'])
      );
    });

    it('should apply pagination', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.findMany({}, 10, 20);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        expect.arrayContaining([10, 20])
      );
    });
  });

  describe('update', () => {
    const updateData: UpdateBrandAccountData = {
      brandInfo: {
        name: 'Nike Updated',
        description: 'Updated description'
      },
      verificationStatus: 'verified',
      partnershipTier: 'enterprise'
    };

    it('should update brand account successfully', async () => {
      // Mock findById for getting current data
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update query
      const updatedRow = {
        ...mockDbRow,
        brand_info: { ...mockBrandInfo, ...updateData.brandInfo },
        verification_status: 'verified',
        partnership_tier: 'enterprise'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [updatedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.update('brand123', updateData);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('UPDATE brand_accounts'),
        expect.arrayContaining([
          JSON.stringify({ ...mockBrandInfo, ...updateData.brandInfo }),
          'verified',
          'enterprise',
          'brand123'
        ])
      );

      expect(result).toBeDefined();
      expect(result?.verificationStatus).toBe('verified');
      expect(result?.partnershipTier).toBe('enterprise');
    });

    it('should return null when brand account not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.update('nonexistent', updateData);

      expect(result).toBeNull();
    });

    it('should throw error when no fields to update', async () => {
      await expect(BrandAccountModel.update('brand123', {}))
        .rejects.toThrow('No fields to update');
    });

    it('should merge brand info with existing data', async () => {
      const partialUpdate = {
        brandInfo: { name: 'Nike Updated' }
      };

      // Mock findById
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.update('brand123', partialUpdate);

      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('UPDATE brand_accounts'),
        expect.arrayContaining([
          JSON.stringify({ ...mockBrandInfo, name: 'Nike Updated' })
        ])
      );
    });
  });

  describe('delete', () => {
    it('should delete brand account successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.delete('brand123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM brand_accounts WHERE id = $1',
        ['brand123']
      );

      expect(result).toBe(true);
    });

    it('should return false when brand account not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getAnalytics', () => {
    it('should return brand analytics successfully', async () => {
      // Mock catalog items count
      mockDb.query.mockResolvedValueOnce({
        rows: [{ count: 25 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock sales and commission data
      mockDb.query.mockResolvedValueOnce({
        rows: [{ total_sales: '15000.00', total_commission: '750.00' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.getAnalytics('brand123');

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        totalCatalogItems: 25,
        totalSales: 15000,
        totalCommission: 750,
        monthlyViews: expect.any(Number),
        topSellingItems: [],
        revenueByMonth: []
      });
    });

    it('should handle zero sales data', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ count: 0 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [{ total_sales: null, total_commission: null }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandAccountModel.getAnalytics('brand123');

      expect(result.totalCatalogItems).toBe(0);
      expect(result.totalSales).toBe(0);
      expect(result.totalCommission).toBe(0);
    });
  });

  describe('addBadge', () => {
    it('should add badge to brand account', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.addBadge('brand123', 'verified');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('badges = COALESCE(badges'),
        ['brand123', JSON.stringify(['verified'])]
      );
    });
  });

  describe('removeBadge', () => {
    it('should remove badge from brand account', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandAccountModel.removeBadge('brand123', 'verified');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('badges = badges - $2'),
        ['brand123', 'verified']
      );
    });
  });
});