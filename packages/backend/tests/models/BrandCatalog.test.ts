import { BrandCatalogModel, CreateBrandCatalogItemData, UpdateBrandCatalogItemData, BrandCatalogItem } from '../../src/models/BrandCatalog';
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

describe('BrandCatalogModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBrandSpecificData = {
    sku: 'NK-AIR-001',
    collection: 'Air Max',
    season: 'Spring 2024',
    launchDate: '2024-03-01',
    materials: ['Leather', 'Mesh', 'Rubber'],
    careInstructions: ['Wipe clean with damp cloth', 'Air dry only']
  };

  const mockCreateData: CreateBrandCatalogItemData = {
    brandId: 'brand123',
    vufsItemId: 'vufs456',
    officialPrice: 129.99,
    availabilityStatus: 'available',
    purchaseLink: 'https://nike.com/air-max-90',
    brandSpecificData: mockBrandSpecificData
  };

  const mockDbRow = {
    id: 'catalog123',
    brand_id: 'brand123',
    vufs_item_id: 'vufs456',
    official_price: '129.99',
    availability_status: 'available',
    purchase_link: 'https://nike.com/air-max-90',
    brand_specific_data: mockBrandSpecificData,
    brand_info: { name: 'Nike', description: 'Just Do It' },
    category_hierarchy: { page: 'Footwear', blueSubcategory: 'Sneakers' },
    brand_hierarchy: { brand: 'Nike®', line: 'Air Max' },
    vufs_metadata: { name: 'Air Max 90', retailPrice: 129.99 },
    total: '10',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
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

  describe('create', () => {
    it('should create a new brand catalog item successfully', async () => {
      // Mock VUFS item exists
      mockVUFSItemModel.findById.mockResolvedValueOnce(mockVUFSItem);

      // Mock no existing catalog item
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock successful insert
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.create(mockCreateData);

      expect(mockVUFSItemModel.findById).toHaveBeenCalledWith('vufs456');
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO brand_catalog_items'),
        [
          'brand123',
          'vufs456',
          129.99,
          'available',
          'https://nike.com/air-max-90',
          JSON.stringify(mockBrandSpecificData)
        ]
      );

      expect(result).toEqual({
        id: 'catalog123',
        brandId: 'brand123',
        vufsItemId: 'vufs456',
        officialPrice: 129.99,
        availabilityStatus: 'available',
        purchaseLink: 'https://nike.com/air-max-90',
        brandSpecificData: mockBrandSpecificData,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should use default availability status when not provided', async () => {
      const createDataWithoutStatus = {
        brandId: 'brand123',
        vufsItemId: 'vufs456',
        officialPrice: 129.99
      };

      mockVUFSItemModel.findById.mockResolvedValueOnce(mockVUFSItem);
      mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await BrandCatalogModel.create(createDataWithoutStatus);

      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO brand_catalog_items'),
        expect.arrayContaining(['available'])
      );
    });

    it('should throw error when VUFS item not found', async () => {
      mockVUFSItemModel.findById.mockResolvedValueOnce(null);

      await expect(BrandCatalogModel.create(mockCreateData))
        .rejects.toThrow('VUFS item not found');

      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should throw error when item already exists in catalog', async () => {
      mockVUFSItemModel.findById.mockResolvedValueOnce(mockVUFSItem);

      // Mock existing catalog item
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await expect(BrandCatalogModel.create(mockCreateData))
        .rejects.toThrow('Item already exists in brand catalog');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it('should handle null optional fields', async () => {
      const minimalCreateData = {
        brandId: 'brand123',
        vufsItemId: 'vufs456'
      };

      mockVUFSItemModel.findById.mockResolvedValueOnce(mockVUFSItem);
      mockDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'SELECT', oid: 0, fields: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      await BrandCatalogModel.create(minimalCreateData);

      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('INSERT INTO brand_catalog_items'),
        expect.arrayContaining([null, null, null])
      );
    });
  });

  describe('findById', () => {
    it('should find catalog item by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.findById('catalog123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT bci.*'),
        ['catalog123']
      );

      expect(result).toEqual({
        id: 'catalog123',
        brandId: 'brand123',
        vufsItemId: 'vufs456',
        officialPrice: 129.99,
        availabilityStatus: 'available',
        purchaseLink: 'https://nike.com/air-max-90',
        brandSpecificData: mockBrandSpecificData,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should return null when catalog item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByVufsItemId', () => {
    it('should find catalog item by VUFS item ID', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.findByVufsItemId('vufs456');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE bci.vufs_item_id = $1'),
        ['vufs456']
      );

      expect(result).toBeDefined();
      expect(result?.vufsItemId).toBe('vufs456');
    });

    it('should find catalog item by VUFS item ID and brand ID', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.findByVufsItemId('vufs456', 'brand123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('AND bci.brand_id = $2'),
        ['vufs456', 'brand123']
      );

      expect(result).toBeDefined();
    });

    it('should return null when not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.findByVufsItemId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByBrandId', () => {
    const mockMultipleRows = [
      { ...mockDbRow, id: 'catalog1' },
      { ...mockDbRow, id: 'catalog2' },
      { ...mockDbRow, id: 'catalog3' }
    ];

    it('should find catalog items by brand ID without filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.findByBrandId('brand123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE bci.brand_id = $1'),
        expect.arrayContaining(['brand123', 20, 0])
      );

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(10);
    });

    it('should apply availability status filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.findByBrandId('brand123', { availabilityStatus: 'out_of_stock' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('bci.availability_status = $2'),
        expect.arrayContaining(['brand123', 'out_of_stock'])
      );
    });

    it('should apply price range filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.findByBrandId('brand123', {
        priceRange: { min: 50, max: 200 }
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('bci.official_price >= $2 AND bci.official_price <= $3'),
        expect.arrayContaining(['brand123', 50, 200])
      );
    });

    it('should apply collection filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.findByBrandId('brand123', { collection: 'Air Max' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("bci.brand_specific_data->>'collection' ILIKE"),
        expect.arrayContaining(['brand123', '%Air Max%'])
      );
    });

    it('should apply season filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.findByBrandId('brand123', { season: 'Spring' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("bci.brand_specific_data->>'season' ILIKE"),
        expect.arrayContaining(['brand123', '%Spring%'])
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

      await BrandCatalogModel.findByBrandId('brand123', { search: 'Air Max' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("vi.metadata->>'name' ILIKE"),
        expect.arrayContaining(['brand123', '%Air Max%'])
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

      await BrandCatalogModel.findByBrandId('brand123', {}, 10, 20);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        expect.arrayContaining(['brand123', 10, 20])
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

      await BrandCatalogModel.findByBrandId('brand123', {
        availabilityStatus: 'available',
        priceRange: { min: 100 },
        collection: 'Air Max',
        search: 'Nike'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('bci.availability_status = $2'),
        expect.arrayContaining(['brand123', 'available', 100, '%Air Max%', '%Nike%'])
      );
    });
  });

  describe('update', () => {
    const updateData: UpdateBrandCatalogItemData = {
      officialPrice: 149.99,
      availabilityStatus: 'out_of_stock',
      purchaseLink: 'https://nike.com/air-max-90-updated',
      brandSpecificData: {
        sku: 'NK-AIR-001-UPDATED',
        collection: 'Air Max Updated'
      }
    };

    it('should update catalog item successfully', async () => {
      // Mock findById for merging brand specific data
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
        official_price: '149.99',
        availability_status: 'out_of_stock',
        purchase_link: 'https://nike.com/air-max-90-updated'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [updatedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.update('catalog123', updateData);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('UPDATE brand_catalog_items'),
        expect.arrayContaining([
          149.99,
          'out_of_stock',
          'https://nike.com/air-max-90-updated',
          JSON.stringify({
            ...mockBrandSpecificData,
            ...updateData.brandSpecificData
          }),
          'catalog123'
        ])
      );

      expect(result).toBeDefined();
      expect(result?.officialPrice).toBe(149.99);
      expect(result?.availabilityStatus).toBe('out_of_stock');
    });

    it('should return null when catalog item not found for update', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.update('nonexistent', updateData);

      expect(result).toBeNull();
    });

    it('should return null when catalog item not found for final update', async () => {
      // Mock findById success
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update failure
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.update('catalog123', updateData);

      expect(result).toBeNull();
    });

    it('should throw error when no fields to update', async () => {
      await expect(BrandCatalogModel.update('catalog123', {}))
        .rejects.toThrow('No fields to update');
    });

    it('should handle undefined price update', async () => {
      const updateWithUndefinedPrice = { 
        officialPrice: undefined,
        availabilityStatus: 'out_of_stock' as const
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.update('catalog123', updateWithUndefinedPrice);

      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('official_price = $1'),
        expect.arrayContaining([undefined, 'out_of_stock'])
      );
    });
  });

  describe('delete', () => {
    it('should delete catalog item successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.delete('catalog123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM brand_catalog_items WHERE id = $1',
        ['catalog123']
      );

      expect(result).toBe(true);
    });

    it('should return false when catalog item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulkUpdateAvailability', () => {
    it('should update availability for multiple items', async () => {
      const updates = [
        { vufsItemId: 'vufs1', availabilityStatus: 'out_of_stock' },
        { vufsItemId: 'vufs2', availabilityStatus: 'discontinued' }
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 2,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await BrandCatalogModel.bulkUpdateAvailability('brand123', updates);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE brand_catalog_items'),
        expect.arrayContaining(['brand123', 'vufs1', 'out_of_stock', 'vufs2', 'discontinued'])
      );
    });

    it('should handle empty updates array', async () => {
      await BrandCatalogModel.bulkUpdateAvailability('brand123', []);

      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('getCollections', () => {
    it('should return collections with item counts', async () => {
      const mockCollectionRows = [
        { collection: 'Air Max', item_count: 15 },
        { collection: 'Air Force', item_count: 8 },
        { collection: 'Dunk', item_count: 5 }
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockCollectionRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.getCollections('brand123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("brand_specific_data->>'collection'"),
        ['brand123']
      );

      expect(result).toEqual([
        { collection: 'Air Max', itemCount: 15 },
        { collection: 'Air Force', itemCount: 8 },
        { collection: 'Dunk', itemCount: 5 }
      ]);
    });

    it('should handle empty collections', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.getCollections('brand123');

      expect(result).toEqual([]);
    });
  });

  describe('getSeasons', () => {
    it('should return seasons with item counts', async () => {
      const mockSeasonRows = [
        { season: 'Spring 2024', item_count: 12 },
        { season: 'Fall 2023', item_count: 8 },
        { season: 'Summer 2024', item_count: 6 }
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockSeasonRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.getSeasons('brand123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("brand_specific_data->>'season'"),
        ['brand123']
      );

      expect(result).toEqual([
        { season: 'Spring 2024', itemCount: 12 },
        { season: 'Fall 2023', itemCount: 8 },
        { season: 'Summer 2024', itemCount: 6 }
      ]);
    });

    it('should handle empty seasons', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await BrandCatalogModel.getSeasons('brand123');

      expect(result).toEqual([]);
    });
  });
});