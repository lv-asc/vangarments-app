import { VUFSCatalogModel, CreateVUFSItemData, UpdateVUFSItemData, VUFSFilters } from '../../src/models/VUFSCatalog';
import { 
  VUFSItem, 
  ApparelItem, 
  FootwearItem, 
  VUFSDomain, 
  OperationalStatus,
  VUFSCatalogEntry 
} from '@vangarments/shared/types/vufs';
import { VUFSUtils } from '../../src/utils/vufs';
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
    validateVUFSItem: jest.fn(() => []),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockVUFSUtils = VUFSUtils as jest.Mocked<typeof VUFSUtils>;

describe('VUFSCatalogModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockApparelItem: Omit<ApparelItem, 'createdDate' | 'operationalStatus' | 'platformExports'> = {
    sku: 'APP-NIK-TSH-0001',
    brand: 'Nike®',
    model: 'Air Force 1',
    style: ['Casual', 'Streetwear'],
    pattern: '2 – Lightweight',
    material: 'Cotton',
    pieceType: 'T-Shirts',
    fit: 'Regular',
    color: 'Black',
    size: 'M',
    gender: 'Male',
    condition: 'New',
    photographed: true,
    price: 99.99,
    owner: 'user123',
    supplier: 'Nike Store',
    sold: false,
    repassStatus: false
  };

  const mockFootwearItem: Omit<FootwearItem, 'createdDate' | 'operationalStatus' | 'platformExports'> = {
    sku: 'FTW-NIK-SNE-0001',
    brand: 'Nike®',
    modelType: 'Sneakers',
    upperMaterial: 'Leather',
    soleType: 'Rubber',
    laceType: 'Laced',
    color: 'Black',
    size: '42',
    heelHeight: 2,
    gender: 'Male',
    condition: 'New',
    photographed: true,
    price: 199.99,
    owner: 'user123',
    supplier: 'Nike Store',
    sold: false,
    repassStatus: false
  };

  const mockCreateData: CreateVUFSItemData = {
    domain: 'APPAREL',
    item: mockApparelItem,
    createdBy: 'admin123'
  };

  const mockDbRow = {
    id: 'catalog123',
    vufs_code: 'APP-NIK-TSH-0001',
    domain: 'APPAREL',
    item_data: JSON.stringify({
      ...mockApparelItem,
      createdDate: new Date('2024-01-15T10:00:00Z'),
      operationalStatus: 'photographed',
      platformExports: []
    }),
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    created_by: 'admin123',
    last_modified_by: 'admin123'
  };

  describe('create', () => {
    it('should create a new VUFS catalog entry successfully', async () => {
      mockVUFSUtils.validateVUFSItem.mockReturnValue([]);
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.create(mockCreateData);

      expect(mockVUFSUtils.validateVUFSItem).toHaveBeenCalledWith(mockApparelItem);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vufs_catalog'),
        expect.arrayContaining([
          'APP-NIK-TSH-0001', // VUFS code (using SKU)
          'APPAREL',
          expect.stringContaining('"operationalStatus":"photographed"'),
          'admin123'
        ])
      );

      expect(result).toEqual({
        id: 'catalog123',
        vufsCode: 'APP-NIK-TSH-0001',
        domain: 'APPAREL',
        item: expect.objectContaining({
          ...mockApparelItem,
          operationalStatus: 'photographed',
          platformExports: []
        }),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
        createdBy: 'admin123',
        lastModifiedBy: 'admin123'
      });
    });

    it('should set operational status to not_photographed when item is not photographed', async () => {
      const itemNotPhotographed = { ...mockApparelItem, photographed: false };
      const createDataNotPhotographed = {
        ...mockCreateData,
        item: itemNotPhotographed
      };

      mockVUFSUtils.validateVUFSItem.mockReturnValue([]);
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          ...mockDbRow,
          item_data: JSON.stringify({
            ...itemNotPhotographed,
            createdDate: new Date('2024-01-15T10:00:00Z'),
            operationalStatus: 'not_photographed',
            platformExports: []
          })
        }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.create(createDataNotPhotographed);

      expect(result.item.operationalStatus).toBe('not_photographed');
    });

    it('should throw error when validation fails', async () => {
      const validationErrors = ['SKU is required', 'Brand is required'];
      mockVUFSUtils.validateVUFSItem.mockReturnValue(validationErrors);

      await expect(VUFSCatalogModel.create(mockCreateData))
        .rejects
        .toThrow('Validation failed: SKU is required, Brand is required');

      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should handle footwear items', async () => {
      const footwearCreateData: CreateVUFSItemData = {
        domain: 'FOOTWEAR',
        item: mockFootwearItem,
        createdBy: 'admin123'
      };

      mockVUFSUtils.validateVUFSItem.mockReturnValue([]);
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          ...mockDbRow,
          domain: 'FOOTWEAR',
          vufs_code: 'FTW-NIK-SNE-0001',
          item_data: JSON.stringify({
            ...mockFootwearItem,
            createdDate: new Date('2024-01-15T10:00:00Z'),
            operationalStatus: 'photographed',
            platformExports: []
          })
        }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.create(footwearCreateData);

      expect(result.domain).toBe('FOOTWEAR');
      expect(result.vufsCode).toBe('FTW-NIK-SNE-0001');
      expect(result.item).toEqual(expect.objectContaining(mockFootwearItem));
    });
  });

  describe('findById', () => {
    it('should find catalog entry by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.findById('catalog123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vufs_catalog WHERE id = $1',
        ['catalog123']
      );

      expect(result).toEqual({
        id: 'catalog123',
        vufsCode: 'APP-NIK-TSH-0001',
        domain: 'APPAREL',
        item: expect.objectContaining(mockApparelItem),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
        createdBy: 'admin123',
        lastModifiedBy: 'admin123'
      });
    });

    it('should return null when entry not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByVUFSCode', () => {
    it('should find catalog entry by VUFS code successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.findByVUFSCode('APP-NIK-TSH-0001');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM vufs_catalog WHERE vufs_code = $1',
        ['APP-NIK-TSH-0001']
      );

      expect(result).toBeDefined();
      expect(result?.vufsCode).toBe('APP-NIK-TSH-0001');
    });

    it('should return null when VUFS code not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.findByVUFSCode('NONEXISTENT-CODE');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    const mockSearchResults = {
      items: [mockDbRow],
      total: 1
    };

    it('should search without filters', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const result = await VUFSCatalogModel.search({});

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should apply domain filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { domain: 'APPAREL' };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE domain = $1'),
        expect.arrayContaining(['APPAREL'])
      );
    });

    it('should apply brand filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { brand: 'Nike' };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("item_data->>'brand' ILIKE"),
        expect.arrayContaining(['%Nike%'])
      );
    });

    it('should apply owner filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { owner: 'user123' };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("item_data->>'owner' ="),
        expect.arrayContaining(['user123'])
      );
    });

    it('should apply operational status filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { operationalStatus: 'photographed' };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("item_data->>'operationalStatus' ="),
        expect.arrayContaining(['photographed'])
      );
    });

    it('should apply condition filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { condition: 'New' };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("item_data->>'condition' ="),
        expect.arrayContaining(['New'])
      );
    });

    it('should apply sold filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { sold: true };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("(item_data->>'sold')::boolean ="),
        expect.arrayContaining([true])
      );
    });

    it('should apply photographed filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { photographed: false };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("(item_data->>'photographed')::boolean ="),
        expect.arrayContaining([false])
      );
    });

    it('should apply price range filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { priceRange: { min: 50, max: 150 } };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("(item_data->>'price')::numeric BETWEEN"),
        expect.arrayContaining([50, 150])
      );
    });

    it('should apply search filter', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = { search: 'nike' };
      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('vufs_code ILIKE'),
        expect.arrayContaining(['%nike%'])
      );
    });

    it('should apply multiple filters', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDbRow], rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const filters: VUFSFilters = {
        domain: 'APPAREL',
        brand: 'Nike',
        owner: 'user123',
        condition: 'New',
        sold: false,
        photographed: true,
        priceRange: { min: 50, max: 200 },
        search: 'shirt'
      };

      await VUFSCatalogModel.search(filters);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['APPAREL', '%Nike%', 'user123', 'New', false, true, 50, 200, '%shirt%'])
      );
    });

    it('should handle pagination', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: Array(25).fill(mockDbRow), rowCount: 25, command: 'SELECT', oid: 0, fields: [] });

      const result = await VUFSCatalogModel.search({}, 25, 50);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([25, 50])
      );

      expect(result.total).toBe(100);
      expect(result.items).toHaveLength(25);
    });
  });

  describe('update', () => {
    const updateData: UpdateVUFSItemData = {
      item: {
        price: 129.99,
        condition: 'Excellent Used'
      },
      operationalStatus: 'published'
    };

    it('should update catalog entry successfully', async () => {
      // Mock findById call
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update call
      const updatedRow = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...JSON.parse(mockDbRow.item_data),
          price: 129.99,
          condition: 'Excellent Used',
          operationalStatus: 'published'
        })
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [updatedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.update('catalog123', updateData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE vufs_catalog'),
        expect.arrayContaining([
          expect.stringContaining('"price":129.99'),
          'catalog123'
        ])
      );

      expect(result).toBeDefined();
      expect(result?.item.price).toBe(129.99);
      expect(result?.item.condition).toBe('Excellent Used');
      expect(result?.item.operationalStatus).toBe('published');
    });

    it('should return null when entry not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.update('nonexistent', updateData);

      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      // Mock findById call
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update call
      const updatedRow = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...JSON.parse(mockDbRow.item_data),
          operationalStatus: 'sold'
        })
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [updatedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const partialUpdate: UpdateVUFSItemData = {
        operationalStatus: 'sold'
      };

      const result = await VUFSCatalogModel.update('catalog123', partialUpdate);

      expect(result?.item.operationalStatus).toBe('sold');
    });
  });

  describe('markAsSold', () => {
    it('should mark item as sold successfully', async () => {
      const soldRow = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...JSON.parse(mockDbRow.item_data),
          sold: true,
          soldPrice: 89.99,
          operationalStatus: 'sold'
        })
      };

      // Mock first findById call (called by markAsSold)
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock second findById call (called by update method)
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update query
      mockDb.query.mockResolvedValueOnce({
        rows: [soldRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.markAsSold('catalog123', 89.99);

      expect(result?.item.sold).toBe(true);
      expect(result?.item.soldPrice).toBe(89.99);
      expect(result?.item.operationalStatus).toBe('sold');
    });

    it('should add platform export when platform provided', async () => {
      const soldRow = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...JSON.parse(mockDbRow.item_data),
          sold: true,
          soldPrice: 89.99,
          operationalStatus: 'sold',
          platformExports: [{
            platform: 'shopify',
            exportedAt: expect.any(Date),
            status: 'published'
          }]
        })
      };

      // Mock first findById call (called by markAsSold)
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock second findById call (called by update method)
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update query
      mockDb.query.mockResolvedValueOnce({
        rows: [soldRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.markAsSold('catalog123', 89.99, 'shopify');

      expect(result?.item.platformExports).toHaveLength(1);
      expect(result?.item.platformExports?.[0].platform).toBe('shopify');
      expect(result?.item.platformExports?.[0].status).toBe('published');
    });

    it('should return null when item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.markAsSold('nonexistent', 89.99);

      expect(result).toBeNull();
    });
  });

  describe('markAsRepassed', () => {
    it('should mark item as repassed successfully', async () => {
      const repassedRow = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...JSON.parse(mockDbRow.item_data),
          repassStatus: true,
          operationalStatus: 'repassed'
        })
      };

      // Mock first findById call (called by markAsRepassed)
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock second findById call (called by update method)
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock update query
      mockDb.query.mockResolvedValueOnce({
        rows: [repassedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.markAsRepassed('catalog123');

      expect(result?.item.repassStatus).toBe(true);
      expect(result?.item.operationalStatus).toBe('repassed');
    });

    it('should return null when item not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.markAsRepassed('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByOperationalStatus', () => {
    it('should get items by operational status', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.getByOperationalStatus('photographed');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("item_data->>'operationalStatus' = $1"),
        ['photographed']
      );

      expect(result).toHaveLength(1);
      expect(result[0].item.operationalStatus).toBe('photographed');
    });
  });

  describe('getItemsReadyForRepass', () => {
    it('should get items ready for repass', async () => {
      const soldButNotRepassedRow = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...JSON.parse(mockDbRow.item_data),
          sold: true,
          repassStatus: false
        })
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [soldButNotRepassedRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.getItemsReadyForRepass();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("(item_data->>'sold')::boolean = true"),
      );

      expect(result).toHaveLength(1);
      expect(result[0].item.sold).toBe(true);
      expect(result[0].item.repassStatus).toBe(false);
    });
  });

  describe('getOwnerStats', () => {
    it('should calculate owner statistics', async () => {
      const mockStatsRow = {
        total_items: '10',
        sold_items: '3',
        total_revenue: '450.00',
        pending_repass: '150.00',
        average_price: '99.99'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockStatsRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.getOwnerStats('user123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("item_data->>'owner' = $1"),
        ['user123']
      );

      expect(result).toEqual({
        totalItems: 10,
        soldItems: 3,
        totalRevenue: 450.00,
        pendingRepass: 150.00,
        averagePrice: 99.99
      });
    });

    it('should handle null values in statistics', async () => {
      const mockStatsRow = {
        total_items: '0',
        sold_items: '0',
        total_revenue: '0',
        pending_repass: '0',
        average_price: '0'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockStatsRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.getOwnerStats('user123');

      expect(result).toEqual({
        totalItems: 0,
        soldItems: 0,
        totalRevenue: 0,
        pendingRepass: 0,
        averagePrice: 0
      });
    });
  });

  describe('delete', () => {
    it('should delete catalog entry successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.delete('catalog123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM vufs_catalog WHERE id = $1',
        ['catalog123']
      );

      expect(result).toBe(true);
    });

    it('should return false when entry not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await VUFSCatalogModel.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('mapToCatalogEntry', () => {
    it('should handle string JSON data', () => {
      const rowWithStringJson = {
        ...mockDbRow,
        item_data: JSON.stringify({
          ...mockApparelItem,
          createdDate: new Date('2024-01-15T10:00:00Z'),
          operationalStatus: 'photographed',
          platformExports: []
        })
      };

      const result = (VUFSCatalogModel as any).mapToCatalogEntry(rowWithStringJson);

      expect(result.item).toEqual(expect.objectContaining(mockApparelItem));
    });

    it('should handle object JSON data', () => {
      const itemData = {
        ...mockApparelItem,
        createdDate: new Date('2024-01-15T10:00:00Z'),
        operationalStatus: 'photographed' as OperationalStatus,
        platformExports: []
      };

      const rowWithObjectJson = {
        ...mockDbRow,
        item_data: itemData
      };

      const result = (VUFSCatalogModel as any).mapToCatalogEntry(rowWithObjectJson);

      expect(result.item).toEqual(itemData);
    });

    it('should parse dates correctly', () => {
      const result = (VUFSCatalogModel as any).mapToCatalogEntry(mockDbRow);

      expect(result.createdAt).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result.updatedAt).toEqual(new Date('2024-01-15T10:00:00Z'));
    });
  });
});