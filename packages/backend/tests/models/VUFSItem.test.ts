import { VUFSItemModel, CreateVUFSItemData, UpdateVUFSItemData } from '../../src/models/VUFSItem';
import { VUFSItem, CategoryHierarchy, BrandHierarchy, ItemMetadata, ItemCondition, OwnershipInfo } from '@vangarments/shared/types/vufs';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

// Mock the VUFSUtils
jest.mock('../../src/utils/vufs', () => ({
  VUFSUtils: {
    normalizeCategoryHierarchy: jest.fn((category) => category),
    normalizeBrandHierarchy: jest.fn((brand) => brand),
    generateSearchKeywords: jest.fn(() => ['test', 'keywords']),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('VUFSItemModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategoryHierarchy: CategoryHierarchy = {
    page: 'Clothing',
    blueSubcategory: 'Tops',
    whiteSubcategory: 'T-Shirts',
    graySubcategory: 'Basic Tee'
  };

  const mockBrandHierarchy: BrandHierarchy = {
    brand: 'Nike®',
    line: 'Sportswear',
    collaboration: 'Travis Scott'
  };

  const mockMetadata: ItemMetadata = {
    composition: [{ material: 'Cotton', percentage: 100 }],
    colors: [{ primary: 'Black', undertones: ['Dark Gray'] }],
    careInstructions: ['Machine wash cold', 'Tumble dry low'],
    acquisitionInfo: {
      date: '2024-01-15T00:00:00.000Z',
      price: 99.99,
      store: 'Nike Store'
    },
    pricing: {
      retailPrice: 99.99,
      currentValue: 79.99
    }
  };

  const mockCondition: ItemCondition = {
    status: 'New',
    notes: 'Brand new with tags',
    defects: []
  };

  const mockOwnership: OwnershipInfo = {
    status: 'owned',
    visibility: 'public'
  };

  const mockCreateData: CreateVUFSItemData = {
    ownerId: 'user123',
    category: mockCategoryHierarchy,
    brand: mockBrandHierarchy,
    metadata: mockMetadata,
    condition: mockCondition,
    ownership: mockOwnership
  };

  const mockDbRow = {
    id: 'item123',
    vufs_code: 'VG-1234567890-ABC123DEF456',
    owner_id: 'user123',
    category_hierarchy: JSON.stringify(mockCategoryHierarchy),
    brand_hierarchy: JSON.stringify(mockBrandHierarchy),
    metadata: JSON.stringify(mockMetadata),
    condition_info: JSON.stringify(mockCondition),
    ownership_info: JSON.stringify(mockOwnership),
    search_keywords: ['test', 'keywords'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  describe('create', () => {
    it('should create a new VUFS item successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.create(mockCreateData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vufs_items'),
        expect.arrayContaining([
          expect.stringMatching(/^VG-\d+-[a-z0-9]+$/), // VUFS code pattern
          'user123',
          JSON.stringify(mockCategoryHierarchy),
          JSON.stringify(mockBrandHierarchy),
          JSON.stringify(mockMetadata),
          JSON.stringify(mockCondition),
          JSON.stringify(mockOwnership),
          ['test', 'keywords']
        ])
      );

      expect(result).toEqual({
        id: 'item123',
        vufsCode: 'VG-1234567890-ABC123DEF456',
        ownerId: 'user123',
        category: mockCategoryHierarchy,
        brand: mockBrandHierarchy,
        metadata: mockMetadata,
        images: [],
        condition: mockCondition,
        ownership: mockOwnership,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      });
    });

    it('should use default ownership if not provided', async () => {
      const createDataWithoutOwnership = { ...mockCreateData };
      delete createDataWithoutOwnership.ownership;

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.create(createDataWithoutOwnership);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vufs_items'),
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          JSON.stringify({ status: 'owned', visibility: 'public' }),
          expect.anything()
        ])
      );
    });

    it('should generate unique VUFS codes', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'INSERT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ ...mockDbRow, id: 'item124', vufs_code: 'VG-1234567891-DEF456GHI789' }], rowCount: 1, command: 'INSERT', oid: 0, fields: [] });

      const result1 = await VUFSItemModel.create(mockCreateData);
      const result2 = await VUFSItemModel.create(mockCreateData);

      expect(result1.vufsCode).not.toBe(result2.vufsCode);
    });
  });

  describe('findById', () => {
    it('should find item by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.findById('item123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vufs_items WHERE id = $1',
        ['item123']
      );

      expect(result).toEqual({
        id: 'item123',
        vufsCode: 'VG-1234567890-ABC123DEF456',
        ownerId: 'user123',
        category: mockCategoryHierarchy,
        brand: mockBrandHierarchy,
        metadata: mockMetadata,
        images: [],
        condition: mockCondition,
        ownership: mockOwnership,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      });
    });

    it('should return null when item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByVUFSCode', () => {
    it('should find item by VUFS code successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.findByVUFSCode('VG-1234567890-ABC123DEF456');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vufs_items WHERE vufs_code = $1',
        ['VG-1234567890-ABC123DEF456']
      );

      expect(result).toBeDefined();
      expect(result?.vufsCode).toBe('VG-1234567890-ABC123DEF456');
    });

    it('should return null when VUFS code not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.findByVUFSCode('VG-NONEXISTENT-CODE');

      expect(result).toBeNull();
    });
  });

  describe('findByOwner', () => {
    it('should find items by owner without filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.findByOwner('user123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vufs_items WHERE owner_id = $1 ORDER BY created_at DESC',
        ['user123']
      );

      expect(result).toHaveLength(1);
      expect(result[0].ownerId).toBe('user123');
    });

    it('should apply category filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.findByOwner('user123', {
        category: { page: 'Clothing' }
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("category_hierarchy->>'page' ILIKE"),
        expect.arrayContaining(['user123', '%Clothing%'])
      );
    });

    it('should apply brand filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.findByOwner('user123', {
        brand: 'Nike'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("brand_hierarchy->>'brand' ILIKE"),
        expect.arrayContaining(['user123', '%Nike%'])
      );
    });

    it('should apply condition filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.findByOwner('user123', {
        condition: 'New'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("condition_info->>'status' ="),
        expect.arrayContaining(['user123', 'New'])
      );
    });

    it('should apply visibility filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.findByOwner('user123', {
        visibility: 'public'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("ownership_info->>'visibility' ="),
        expect.arrayContaining(['user123', 'public'])
      );
    });

    it('should apply search filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.findByOwner('user123', {
        search: 'nike'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('= ANY(search_keywords)'),
        expect.arrayContaining(['user123', 'nike', '%nike%'])
      );
    });

    it('should apply multiple filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.findByOwner('user123', {
        category: { page: 'Clothing' },
        brand: 'Nike',
        condition: 'New',
        visibility: 'public',
        search: 'shirt'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("category_hierarchy->>'page' ILIKE"),
        expect.arrayContaining(['user123', '%Clothing%', '%Nike%', 'New', 'public', 'shirt', '%shirt%'])
      );
    });
  });

  describe('update', () => {
    const updateData: UpdateVUFSItemData = {
      category: {
        page: 'Updated Clothing',
        blueSubcategory: 'Updated Tops',
        whiteSubcategory: 'Updated T-Shirts',
        graySubcategory: 'Updated Basic Tee'
      },
      metadata: {
        ...mockMetadata,
        pricing: {
          retailPrice: 129.99,
          currentValue: 99.99
        }
      }
    };

    it('should update item successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...mockDbRow, category_hierarchy: JSON.stringify(updateData.category) }],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.update('item123', updateData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vufs_items'),
        expect.arrayContaining([
          JSON.stringify(updateData.category),
          JSON.stringify(updateData.metadata),
          'item123'
        ])
      );

      expect(result).toBeDefined();
      expect(result?.category).toEqual(updateData.category);
    });

    it('should return null when item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.update('nonexistent', updateData);

      expect(result).toBeNull();
    });

    it('should return current item when no updates provided', async () => {
      // Mock findById call
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.update('item123', {});

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vufs_items WHERE id = $1',
        ['item123']
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe('item123');
    });
  });

  describe('delete', () => {
    it('should delete item successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.delete('item123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM vufs_items WHERE id = $1',
        ['item123']
      );

      expect(result).toBe(true);
    });

    it('should return false when item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('search', () => {
    it('should search items by term', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.search('nike');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('= ANY(search_keywords)'),
        expect.arrayContaining(['nike', '%nike%'])
      );

      expect(result).toHaveLength(1);
    });

    it('should apply filters in search', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await VUFSItemModel.search('nike', {
        category: { page: 'Clothing' },
        brand: 'Nike',
        visibility: 'public'
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("category_hierarchy->>'page' ILIKE"),
        expect.arrayContaining(['nike', '%nike%', '%Clothing%', '%Nike%', 'public'])
      );
    });

    it('should limit results to 50', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: Array(50).fill(mockDbRow),
        rowCount: 50,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.search('test');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50'),
        expect.anything()
      );

      expect(result).toHaveLength(50);
    });
  });

  describe('getStatsByOwner', () => {
    it('should return owner statistics', async () => {
      const mockStatsRows = [
        { total_items: '5', category: 'Clothing', brand: 'Nike®', condition: 'New' },
        { total_items: '3', category: 'Footwear', brand: 'Adidas®', condition: 'Used' },
        { total_items: '2', category: 'Clothing', brand: 'Nike®', condition: 'Used' }
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockStatsRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.getStatsByOwner('user123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY'),
        ['user123']
      );

      expect(result).toEqual({
        totalItems: 10, // 5 + 3 + 2
        itemsByCategory: {
          'Clothing': 7, // 5 + 2
          'Footwear': 3
        },
        itemsByBrand: {
          'Nike®': 7, // 5 + 2
          'Adidas®': 3
        },
        itemsByCondition: {
          'New': 5,
          'Used': 5 // 3 + 2
        }
      });
    });

    it('should handle empty statistics', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSItemModel.getStatsByOwner('user123');

      expect(result).toEqual({
        totalItems: 0,
        itemsByCategory: {},
        itemsByBrand: {},
        itemsByCondition: {}
      });
    });
  });

  describe('mapToVUFSItem', () => {
    it('should handle string JSON data', () => {
      const rowWithStringJson = {
        ...mockDbRow,
        category_hierarchy: JSON.stringify(mockCategoryHierarchy),
        brand_hierarchy: JSON.stringify(mockBrandHierarchy),
        metadata: JSON.stringify(mockMetadata),
        condition_info: JSON.stringify(mockCondition),
        ownership_info: JSON.stringify(mockOwnership)
      };

      // Access the private method through the class
      const result = (VUFSItemModel as any).mapToVUFSItem(rowWithStringJson);

      expect(result.category).toEqual(mockCategoryHierarchy);
      expect(result.brand).toEqual(mockBrandHierarchy);
      expect(result.metadata).toEqual(mockMetadata);
      expect(result.condition).toEqual(mockCondition);
      expect(result.ownership).toEqual(mockOwnership);
    });

    it('should handle object JSON data', () => {
      const rowWithObjectJson = {
        ...mockDbRow,
        category_hierarchy: mockCategoryHierarchy,
        brand_hierarchy: mockBrandHierarchy,
        metadata: mockMetadata,
        condition_info: mockCondition,
        ownership_info: mockOwnership
      };

      const result = (VUFSItemModel as any).mapToVUFSItem(rowWithObjectJson);

      expect(result.category).toEqual(mockCategoryHierarchy);
      expect(result.brand).toEqual(mockBrandHierarchy);
      expect(result.metadata).toEqual(mockMetadata);
      expect(result.condition).toEqual(mockCondition);
      expect(result.ownership).toEqual(mockOwnership);
    });

    it('should set empty images array', () => {
      const result = (VUFSItemModel as any).mapToVUFSItem(mockDbRow);

      expect(result.images).toEqual([]);
    });

    it('should parse dates correctly', () => {
      const result = (VUFSItemModel as any).mapToVUFSItem(mockDbRow);

      expect(result.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result.updatedAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });
  });
});