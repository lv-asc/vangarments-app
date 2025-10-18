import { VUFSUtils } from '../../src/utils/vufs';
import { 
  VUFSItem, 
  ApparelItem, 
  FootwearItem, 
  VUFSDomain,
  CategoryHierarchy,
  BrandHierarchy,
  ConsignmentSettings,
  ExportPlatform
} from '@vangarments/shared/types/vufs';

// Mock constants for testing
const DEFAULT_CONSIGNMENT_SETTINGS: ConsignmentSettings = {
  defaultCommissionRate: 0.30,
  platformFeeRates: {
    nuvem_shop: 0.05,
    shopify: 0.029,
    vinted: 0.05,
    magazine_luiza: 0.15,
    ebay: 0.10,
    google_shopping: 0.00,
    dropper: 0.08,
  },
  paymentTerms: 7,
  minimumPayout: 50.00,
  autoRepassThreshold: 1000.00,
};

describe('VUFSUtils', () => {
  describe('VUFS Code Generation and Validation', () => {
    describe('generateSKU', () => {
      it('should generate valid apparel SKU', () => {
        const sku = VUFSUtils.generateSKU('APPAREL', 'Nike®', 'T-Shirt', 1);
        expect(sku).toMatch(/^APP-NIK-TS-\d{4}$/);
        expect(sku).toBe('APP-NIK-TS-0001');
      });

      it('should generate valid footwear SKU', () => {
        const sku = VUFSUtils.generateSKU('FOOTWEAR', 'Adidas®', 'Sneakers', 42);
        expect(sku).toMatch(/^FTW-ADI-SNE-\d{4}$/);
        expect(sku).toBe('FTW-ADI-SNE-0042');
      });

      it('should handle multi-word brands correctly', () => {
        const sku = VUFSUtils.generateSKU('APPAREL', 'Calvin Klein®', 'Jeans', 5);
        expect(sku).toBe('APP-CK-JEA-0005');
      });

      it('should handle single word brands correctly', () => {
        const sku = VUFSUtils.generateSKU('FOOTWEAR', 'Vans®', 'Boots', 123);
        expect(sku).toBe('FTW-VAN-BOO-0123');
      });

      it('should pad sequence numbers correctly', () => {
        const sku1 = VUFSUtils.generateSKU('APPAREL', 'Nike®', 'Shirt', 1);
        const sku2 = VUFSUtils.generateSKU('APPAREL', 'Nike®', 'Shirt', 99);
        const sku3 = VUFSUtils.generateSKU('APPAREL', 'Nike®', 'Shirt', 9999);

        expect(sku1).toBe('APP-NIK-SHI-0001');
        expect(sku2).toBe('APP-NIK-SHI-0099');
        expect(sku3).toBe('APP-NIK-SHI-9999');
      });
    });

    describe('isValidVUFSCode', () => {
      it('should validate correct VUFS code format', () => {
        const validCodes = [
          'VG-ABCD-EFGH-12345678',
          'VG-TOPS-NIKE-A1B2C3D4',
          'VG-SHOE-ADAS-ZYXWVUTS'
        ];

        validCodes.forEach(code => {
          expect(VUFSUtils.isValidVUFSCode(code)).toBe(true);
        });
      });

      it('should reject invalid VUFS code formats', () => {
        const invalidCodes = [
          'VG-ABC-EFGH-12345678', // Category code too short
          'VG-ABCD-EFG-12345678', // Brand code too short
          'VG-ABCD-EFGH-1234567', // Unique ID too short
          'VG-ABCD-EFGH-123456789', // Unique ID too long
          'VG-abcd-EFGH-12345678', // Lowercase category
          'VG-ABCD-efgh-12345678', // Lowercase brand
          'XX-ABCD-EFGH-12345678', // Wrong prefix
          'VG_ABCD_EFGH_12345678', // Wrong separator
          'VGABCDEFGH12345678', // No separators
          '', // Empty string
          'VG-ABCD-EFGH', // Missing unique ID
        ];

        invalidCodes.forEach(code => {
          expect(VUFSUtils.isValidVUFSCode(code)).toBe(false);
        });
      });
    });

    describe('parseVUFSCode', () => {
      it('should parse valid VUFS code correctly', () => {
        const code = 'VG-TOPS-NIKE-A1B2C3D4';
        const parsed = VUFSUtils.parseVUFSCode(code);

        expect(parsed).toEqual({
          prefix: 'VG',
          categoryCode: 'TOPS',
          brandCode: 'NIKE',
          uniqueId: 'A1B2C3D4'
        });
      });

      it('should return null for invalid VUFS code', () => {
        const invalidCode = 'INVALID-CODE';
        const parsed = VUFSUtils.parseVUFSCode(invalidCode);

        expect(parsed).toBeNull();
      });
    });
  });

  describe('Category Hierarchy Validation', () => {
    describe('validateCategoryHierarchy', () => {
      it('should validate complete category hierarchy', () => {
        const validCategory: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: 'Tops',
          whiteSubcategory: 'T-Shirts',
          graySubcategory: 'Basic Tee'
        };

        const errors = VUFSUtils.validateCategoryHierarchy(validCategory);
        expect(errors).toHaveLength(0);
      });

      it('should require page category', () => {
        const invalidCategory: CategoryHierarchy = {
          page: '',
          blueSubcategory: 'Tops',
          whiteSubcategory: 'T-Shirts',
          graySubcategory: 'Basic Tee'
        };

        const errors = VUFSUtils.validateCategoryHierarchy(invalidCategory);
        expect(errors).toContain('Page category is required');
      });

      it('should require blue subcategory', () => {
        const invalidCategory: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: '',
          whiteSubcategory: 'T-Shirts',
          graySubcategory: 'Basic Tee'
        };

        const errors = VUFSUtils.validateCategoryHierarchy(invalidCategory);
        expect(errors).toContain('Blue subcategory is required');
      });

      it('should require white subcategory', () => {
        const invalidCategory: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: 'Tops',
          whiteSubcategory: '',
          graySubcategory: 'Basic Tee'
        };

        const errors = VUFSUtils.validateCategoryHierarchy(invalidCategory);
        expect(errors).toContain('White subcategory is required');
      });

      it('should require gray subcategory', () => {
        const invalidCategory: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: 'Tops',
          whiteSubcategory: 'T-Shirts',
          graySubcategory: ''
        };

        const errors = VUFSUtils.validateCategoryHierarchy(invalidCategory);
        expect(errors).toContain('Gray subcategory is required');
      });

      it('should handle whitespace-only values', () => {
        const invalidCategory: CategoryHierarchy = {
          page: '   ',
          blueSubcategory: '\t',
          whiteSubcategory: '\n',
          graySubcategory: '  \t\n  '
        };

        const errors = VUFSUtils.validateCategoryHierarchy(invalidCategory);
        expect(errors).toHaveLength(4);
        expect(errors).toContain('Page category is required');
        expect(errors).toContain('Blue subcategory is required');
        expect(errors).toContain('White subcategory is required');
        expect(errors).toContain('Gray subcategory is required');
      });

      it('should return multiple errors for multiple missing fields', () => {
        const invalidCategory: CategoryHierarchy = {
          page: '',
          blueSubcategory: '',
          whiteSubcategory: 'T-Shirts',
          graySubcategory: 'Basic Tee'
        };

        const errors = VUFSUtils.validateCategoryHierarchy(invalidCategory);
        expect(errors).toHaveLength(2);
        expect(errors).toContain('Page category is required');
        expect(errors).toContain('Blue subcategory is required');
      });
    });

    describe('normalizeCategoryHierarchy', () => {
      it('should normalize category hierarchy text', () => {
        const category: CategoryHierarchy = {
          page: '  clothing  ',
          blueSubcategory: 'TOPS',
          whiteSubcategory: 't-shirts',
          graySubcategory: 'basic   tee'
        };

        const normalized = VUFSUtils.normalizeCategoryHierarchy(category);

        expect(normalized).toEqual({
          page: 'Clothing',
          blueSubcategory: 'Tops',
          whiteSubcategory: 'T-shirts',
          graySubcategory: 'Basic Tee'
        });
      });

      it('should handle multiple spaces correctly', () => {
        const category: CategoryHierarchy = {
          page: 'athletic    wear',
          blueSubcategory: 'performance     gear',
          whiteSubcategory: 'moisture   wicking',
          graySubcategory: 'dry    fit    tee'
        };

        const normalized = VUFSUtils.normalizeCategoryHierarchy(category);

        expect(normalized).toEqual({
          page: 'Athletic Wear',
          blueSubcategory: 'Performance Gear',
          whiteSubcategory: 'Moisture Wicking',
          graySubcategory: 'Dry Fit Tee'
        });
      });

      it('should preserve already normalized text', () => {
        const category: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: 'Tops',
          whiteSubcategory: 'T-shirts',
          graySubcategory: 'Basic Tee'
        };

        const normalized = VUFSUtils.normalizeCategoryHierarchy(category);

        expect(normalized).toEqual(category);
      });
    });
  });

  describe('Brand Hierarchy Validation', () => {
    describe('validateBrandHierarchy', () => {
      it('should validate complete brand hierarchy', () => {
        const validBrand: BrandHierarchy = {
          brand: 'Nike®',
          line: 'Air Jordan',
          collaboration: 'Travis Scott'
        };

        const errors = VUFSUtils.validateBrandHierarchy(validBrand);
        expect(errors).toHaveLength(0);
      });

      it('should validate brand hierarchy without optional fields', () => {
        const validBrand: BrandHierarchy = {
          brand: 'Nike®'
        };

        const errors = VUFSUtils.validateBrandHierarchy(validBrand);
        expect(errors).toHaveLength(0);
      });

      it('should require brand name', () => {
        const invalidBrand: BrandHierarchy = {
          brand: '',
          line: 'Air Jordan'
        };

        const errors = VUFSUtils.validateBrandHierarchy(invalidBrand);
        expect(errors).toContain('Brand name is required');
      });

      it('should reject empty line if provided', () => {
        const invalidBrand: BrandHierarchy = {
          brand: 'Nike®',
          line: '',
          collaboration: 'Travis Scott'
        };

        const errors = VUFSUtils.validateBrandHierarchy(invalidBrand);
        expect(errors).toContain('Brand line cannot be empty if provided');
      });

      it('should reject empty collaboration if provided', () => {
        const invalidBrand: BrandHierarchy = {
          brand: 'Nike®',
          line: 'Air Jordan',
          collaboration: ''
        };

        const errors = VUFSUtils.validateBrandHierarchy(invalidBrand);
        expect(errors).toContain('Brand collaboration cannot be empty if provided');
      });

      it('should handle whitespace-only brand name', () => {
        const invalidBrand: BrandHierarchy = {
          brand: '   ',
          line: 'Air Jordan'
        };

        const errors = VUFSUtils.validateBrandHierarchy(invalidBrand);
        expect(errors).toContain('Brand name is required');
      });

      it('should return multiple errors for multiple issues', () => {
        const invalidBrand: BrandHierarchy = {
          brand: '',
          line: '',
          collaboration: ''
        };

        const errors = VUFSUtils.validateBrandHierarchy(invalidBrand);
        expect(errors).toHaveLength(3);
        expect(errors).toContain('Brand name is required');
        expect(errors).toContain('Brand line cannot be empty if provided');
        expect(errors).toContain('Brand collaboration cannot be empty if provided');
      });
    });

    describe('normalizeBrandHierarchy', () => {
      it('should normalize brand hierarchy text', () => {
        const brand: BrandHierarchy = {
          brand: '  nike®  ',
          line: 'AIR JORDAN',
          collaboration: 'travis scott'
        };

        const normalized = VUFSUtils.normalizeBrandHierarchy(brand);

        expect(normalized).toEqual({
          brand: 'Nike®',
          line: 'Air Jordan',
          collaboration: 'Travis Scott'
        });
      });

      it('should handle undefined optional fields', () => {
        const brand: BrandHierarchy = {
          brand: '  adidas®  '
        };

        const normalized = VUFSUtils.normalizeBrandHierarchy(brand);

        expect(normalized).toEqual({
          brand: 'Adidas®',
          line: undefined,
          collaboration: undefined
        });
      });

      it('should preserve already normalized text', () => {
        const brand: BrandHierarchy = {
          brand: 'Nike®',
          line: 'Air Jordan',
          collaboration: 'Travis Scott'
        };

        const normalized = VUFSUtils.normalizeBrandHierarchy(brand);

        expect(normalized).toEqual(brand);
      });
    });
  });

  describe('Metadata Management and Validation', () => {
    describe('validateVUFSItem', () => {
      const validApparelItem: Partial<ApparelItem> = {
        sku: 'APP-NIK-TSH-0001',
        brand: 'Nike®',
        pieceType: 'T-Shirts',
        material: 'Cotton',
        fit: 'Regular',
        color: 'Black',
        size: 'M',
        gender: 'Male',
        condition: 'New',
        price: 99.99,
        owner: 'user123',
        photographed: true,
        sold: false,
        repassStatus: false,
        style: ['Casual'],
        pattern: '2 – Lightweight'
      };

      const validFootwearItem: Partial<FootwearItem> = {
        sku: 'FTW-NIK-SNE-0001',
        brand: 'Nike®',
        modelType: 'Sneakers',
        upperMaterial: 'Leather',
        soleType: 'Rubber',
        laceType: 'Laced',
        color: 'Black',
        size: '42',
        gender: 'Male',
        condition: 'New',
        price: 199.99,
        owner: 'user123',
        photographed: true,
        sold: false,
        repassStatus: false
      };

      it('should validate complete apparel item', () => {
        const errors = VUFSUtils.validateVUFSItem(validApparelItem);
        expect(errors).toHaveLength(0);
      });

      it('should validate complete footwear item', () => {
        const errors = VUFSUtils.validateVUFSItem(validFootwearItem);
        expect(errors).toHaveLength(0);
      });

      it('should require SKU', () => {
        const item = { ...validApparelItem };
        delete item.sku;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('SKU is required');
      });

      it('should require brand', () => {
        const item = { ...validApparelItem };
        delete item.brand;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Brand is required');
      });

      it('should require color', () => {
        const item = { ...validApparelItem };
        delete item.color;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Color is required');
      });

      it('should require size', () => {
        const item = { ...validApparelItem };
        delete item.size;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Size is required');
      });

      it('should require gender', () => {
        const item = { ...validApparelItem };
        delete item.gender;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Gender is required');
      });

      it('should require condition', () => {
        const item = { ...validApparelItem };
        delete item.condition;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Condition is required');
      });

      it('should require valid price', () => {
        const item1 = { ...validApparelItem, price: 0 };
        const item2 = { ...validApparelItem, price: -10 };
        const item3 = { ...validApparelItem };
        delete item3.price;

        const errors1 = VUFSUtils.validateVUFSItem(item1);
        const errors2 = VUFSUtils.validateVUFSItem(item2);
        const errors3 = VUFSUtils.validateVUFSItem(item3);

        expect(errors1).toContain('Valid price is required');
        expect(errors2).toContain('Valid price is required');
        expect(errors3).toContain('Valid price is required');
      });

      it('should require owner', () => {
        const item = { ...validApparelItem };
        delete item.owner;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Owner is required');
      });

      it('should require apparel-specific fields', () => {
        const item = { ...validApparelItem };
        delete (item as any).pieceType;
        delete (item as any).material;
        delete (item as any).fit;

        // Add pieceType to make it an apparel item
        (item as any).pieceType = undefined;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Piece type is required for apparel');
        expect(errors).toContain('Material is required for apparel');
        expect(errors).toContain('Fit is required for apparel');
      });

      it('should require footwear-specific fields', () => {
        const item = { ...validFootwearItem };
        delete (item as any).modelType;
        delete (item as any).upperMaterial;
        delete (item as any).soleType;
        delete (item as any).laceType;

        // Add modelType to make it a footwear item
        (item as any).modelType = undefined;

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors).toContain('Model type is required for footwear');
        expect(errors).toContain('Upper material is required for footwear');
        expect(errors).toContain('Sole type is required for footwear');
        expect(errors).toContain('Lace type is required for footwear');
      });

      it('should return multiple errors for multiple missing fields', () => {
        const item: Partial<VUFSItem> = {
          sku: 'APP-NIK-TSH-0001'
        };

        const errors = VUFSUtils.validateVUFSItem(item);
        expect(errors.length).toBeGreaterThan(5);
        expect(errors).toContain('Brand is required');
        expect(errors).toContain('Color is required');
        expect(errors).toContain('Size is required');
        expect(errors).toContain('Gender is required');
        expect(errors).toContain('Condition is required');
        expect(errors).toContain('Valid price is required');
        expect(errors).toContain('Owner is required');
      });
    });

    describe('generateSearchKeywords', () => {
      it('should generate keywords from category and brand', () => {
        const category: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: 'Tops',
          whiteSubcategory: 'T-Shirts',
          graySubcategory: 'Basic Tee'
        };

        const brand: BrandHierarchy = {
          brand: 'Nike®',
          line: 'Sportswear',
          collaboration: 'Travis Scott'
        };

        const keywords = VUFSUtils.generateSearchKeywords(category, brand);

        expect(keywords).toContain('clothing');
        expect(keywords).toContain('tops');
        expect(keywords).toContain('t-shirts');
        expect(keywords).toContain('basic tee');
        expect(keywords).toContain('nike®');
        expect(keywords).toContain('sportswear');
        expect(keywords).toContain('travis scott');
        expect(keywords).toContain('clothing tops');
        expect(keywords).toContain('nike® t-shirts');
      });

      it('should handle brand without optional fields', () => {
        const category: CategoryHierarchy = {
          page: 'Footwear',
          blueSubcategory: 'Athletic',
          whiteSubcategory: 'Running',
          graySubcategory: 'Road Running'
        };

        const brand: BrandHierarchy = {
          brand: 'Adidas®'
        };

        const keywords = VUFSUtils.generateSearchKeywords(category, brand);

        expect(keywords).toContain('footwear');
        expect(keywords).toContain('athletic');
        expect(keywords).toContain('running');
        expect(keywords).toContain('road running');
        expect(keywords).toContain('adidas®');
        expect(keywords).toContain('footwear athletic');
        expect(keywords).toContain('adidas® running');
      });

      it('should return unique keywords only', () => {
        const category: CategoryHierarchy = {
          page: 'Clothing',
          blueSubcategory: 'Clothing',
          whiteSubcategory: 'Apparel',
          graySubcategory: 'Garment'
        };

        const brand: BrandHierarchy = {
          brand: 'Nike®',
          line: 'Nike®'
        };

        const keywords = VUFSUtils.generateSearchKeywords(category, brand);
        const uniqueKeywords = [...new Set(keywords)];

        expect(keywords.length).toBe(uniqueKeywords.length);
      });

      it('should convert all keywords to lowercase', () => {
        const category: CategoryHierarchy = {
          page: 'CLOTHING',
          blueSubcategory: 'TOPS',
          whiteSubcategory: 'T-SHIRTS',
          graySubcategory: 'BASIC TEE'
        };

        const brand: BrandHierarchy = {
          brand: 'NIKE®',
          line: 'SPORTSWEAR'
        };

        const keywords = VUFSUtils.generateSearchKeywords(category, brand);

        keywords.forEach(keyword => {
          expect(keyword).toBe(keyword.toLowerCase());
        });
      });
    });
  });

  describe('Financial Calculations', () => {
    describe('calculateFinancials', () => {
      it('should calculate financials with default settings', () => {
        const soldPrice = 1000;
        const platform: ExportPlatform = 'shopify';

        const result = VUFSUtils.calculateFinancials(soldPrice, platform);

        expect(result.grossAmount).toBe(1000);
        expect(result.platformFee).toBe(29); // 2.9% of 1000
        expect(result.commission).toBe(291.3); // 30% of (1000 - 29)
        expect(result.netToOwner).toBe(679.7); // 971 - 291.3
      });

      it('should calculate financials with custom settings', () => {
        const soldPrice = 500;
        const platform: ExportPlatform = 'vinted';
        const customSettings: ConsignmentSettings = {
          ...DEFAULT_CONSIGNMENT_SETTINGS,
          defaultCommissionRate: 0.25, // 25%
          platformFeeRates: {
            ...DEFAULT_CONSIGNMENT_SETTINGS.platformFeeRates,
            vinted: 0.08 // 8%
          }
        };

        const result = VUFSUtils.calculateFinancials(soldPrice, platform, customSettings);

        expect(result.grossAmount).toBe(500);
        expect(result.platformFee).toBe(40); // 8% of 500
        expect(result.commission).toBe(115); // 25% of (500 - 40)
        expect(result.netToOwner).toBe(345); // 460 - 115
      });

      it('should handle zero platform fee', () => {
        const soldPrice = 200;
        const platform: ExportPlatform = 'google_shopping'; // 0% fee

        const result = VUFSUtils.calculateFinancials(soldPrice, platform);

        expect(result.grossAmount).toBe(200);
        expect(result.platformFee).toBe(0);
        expect(result.commission).toBe(60); // 30% of 200
        expect(result.netToOwner).toBe(140); // 200 - 60
      });

      it('should handle unknown platform with default fee', () => {
        const soldPrice = 300;
        const platform = 'unknown_platform' as ExportPlatform;

        const result = VUFSUtils.calculateFinancials(soldPrice, platform);

        expect(result.grossAmount).toBe(300);
        expect(result.platformFee).toBe(0); // Default to 0 for unknown platform
        expect(result.commission).toBe(90); // 30% of 300
        expect(result.netToOwner).toBe(210); // 300 - 90
      });
    });

    describe('shouldAutoRepass', () => {
      it('should return true for amounts above threshold', () => {
        const result = VUFSUtils.shouldAutoRepass(1500);
        expect(result).toBe(true);
      });

      it('should return false for amounts below threshold', () => {
        const result = VUFSUtils.shouldAutoRepass(500);
        expect(result).toBe(false);
      });

      it('should return true for amounts equal to threshold', () => {
        const result = VUFSUtils.shouldAutoRepass(1000);
        expect(result).toBe(true);
      });

      it('should use custom threshold when provided', () => {
        const customSettings: ConsignmentSettings = {
          ...DEFAULT_CONSIGNMENT_SETTINGS,
          autoRepassThreshold: 2000
        };

        const result1 = VUFSUtils.shouldAutoRepass(1500, customSettings);
        const result2 = VUFSUtils.shouldAutoRepass(2000, customSettings);
        const result3 = VUFSUtils.shouldAutoRepass(2500, customSettings);

        expect(result1).toBe(false);
        expect(result2).toBe(true);
        expect(result3).toBe(true);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('generateExportFilename', () => {
      it('should generate filename with current timestamp', () => {
        const platform: ExportPlatform = 'shopify';
        const filename = VUFSUtils.generateExportFilename(platform);

        expect(filename).toMatch(/^vufs_export_shopify_\d{4}-\d{2}-\d{2}_\d{6}\.csv$/);
      });

      it('should generate filename with custom timestamp', () => {
        const platform: ExportPlatform = 'vinted';
        const timestamp = new Date('2024-01-15T14:30:45Z');
        const filename = VUFSUtils.generateExportFilename(platform, timestamp);

        expect(filename).toBe('vufs_export_vinted_2024-01-15_143045.csv');
      });

      it('should handle different platforms', () => {
        const platforms: ExportPlatform[] = ['nuvem_shop', 'ebay', 'magazine_luiza'];
        const timestamp = new Date('2024-01-15T14:30:45Z');

        platforms.forEach(platform => {
          const filename = VUFSUtils.generateExportFilename(platform, timestamp);
          expect(filename).toBe(`vufs_export_${platform}_2024-01-15_143045.csv`);
        });
      });
    });
  });
});