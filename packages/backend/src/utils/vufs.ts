/**
 * VUFS (Vangarments Universal Fashion Standard) utilities
 * Based on your comprehensive 1-year development work
 * Core system for standardized fashion item cataloging with business logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  VUFSItem,
  ApparelItem,
  FootwearItem,
  VUFSDomain,
  PlatformProductData,
  ExportPlatform,
  FinancialRecord,
  ConsignmentSettings,
  CategoryHierarchy,
  BrandHierarchy
} from '@vangarments/shared/types/vufs';
// Mock constants for now - these would normally come from shared/constants
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

const PLATFORM_GENDER_MAPPING: Record<ExportPlatform, Record<string, string>> = {
  nuvem_shop: {
    'Male': 'Masculino',
    'Female': 'Feminino',
    "Men's": 'Masculino',
    "Women's": 'Feminino',
    'Unisex': 'Unissex',
  },
  shopify: {
    'Male': 'Men',
    'Female': 'Women',
    "Men's": 'Men',
    "Women's": 'Women',
    'Unisex': 'Unisex',
  },
  vinted: {
    'Male': 'Men',
    'Female': 'Women',
    "Men's": 'Men',
    "Women's": 'Women',
    'Unisex': 'Unisex',
  },
  magazine_luiza: {},
  ebay: {},
  google_shopping: {},
  dropper: {},
};

export class VUFSUtils {
  /**
   * Generate SKU based on your system
   * APPAREL: APP-{BRAND_CODE}-{PIECE_CODE}-{SEQUENCE}
   * FOOTWEAR: FTW-{BRAND_CODE}-{TYPE_CODE}-{SEQUENCE}
   */
  static generateSKU(domain: VUFSDomain, brand: string, type: string, sequence: number): string {
    const brandCode = this.getBrandCode(brand);
    const typeCode = this.getTypeCode(type);
    const sequenceStr = sequence.toString().padStart(4, '0');

    if (domain === 'APPAREL') {
      return `APP-${brandCode}-${typeCode}-${sequenceStr}`;
    } else {
      return `FTW-${brandCode}-${typeCode}-${sequenceStr}`;
    }
  }

  /**
   * Get brand code from brand name
   */
  private static getBrandCode(brand: string): string {
    // Remove ® symbol and get initials
    const cleanBrand = brand.replace('®', '');
    const words = cleanBrand.split(' ');

    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }

    return words.map(word => word[0]).join('').substring(0, 3).toUpperCase();
  }

  /**
   * Get type code from piece type or footwear type
   */
  private static getTypeCode(type: string): string {
    const words = type.split(/[\s-]+/); // Split on spaces and hyphens
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }

    return words.map(word => word[0]).join('').substring(0, 3).toUpperCase();
  }

  /**
   * Calculate financial breakdown for consignment
   */
  static calculateFinancials(
    soldPrice: number,
    platform: ExportPlatform,
    settings: ConsignmentSettings = DEFAULT_CONSIGNMENT_SETTINGS
  ): {
    grossAmount: number;
    platformFee: number;
    commission: number;
    netToOwner: number;
  } {
    const platformFeeRate = settings.platformFeeRates[platform] || 0;
    const platformFee = soldPrice * platformFeeRate;
    const afterPlatformFee = soldPrice - platformFee;
    const commission = afterPlatformFee * settings.defaultCommissionRate;
    const netToOwner = afterPlatformFee - commission;

    return {
      grossAmount: soldPrice,
      platformFee,
      commission,
      netToOwner,
    };
  }

  /**
   * Extract initials from text
   */
  private static getInitials(text: string, maxLength: number): string {
    const words = text.trim().split(/\s+/);
    let initials = '';

    for (const word of words) {
      if (initials.length >= maxLength) break;
      if (word.length > 0) {
        initials += word[0];
      }
    }

    // Pad with X if needed
    while (initials.length < maxLength) {
      initials += 'X';
    }

    return initials.substring(0, maxLength);
  }

  /**
   * Validate VUFS code format
   */
  static isValidVUFSCode(code: string): boolean {
    const pattern = /^VG-[A-Z]{4}-[A-Z]{4}-[A-Z0-9]{8}$/;
    return pattern.test(code);
  }

  /**
   * Parse VUFS code to extract components
   */
  static parseVUFSCode(code: string): {
    prefix: string;
    categoryCode: string;
    brandCode: string;
    uniqueId: string;
  } | null {
    if (!this.isValidVUFSCode(code)) {
      return null;
    }

    const parts = code.split('-');
    return {
      prefix: parts[0],
      categoryCode: parts[1],
      brandCode: parts[2],
      uniqueId: parts[3],
    };
  }

  /**
   * Validate category hierarchy
   */
  static validateCategoryHierarchy(category: CategoryHierarchy): string[] {
    const errors: string[] = [];

    if (!category.page || category.page.trim().length === 0) {
      errors.push('Page category is required');
    }

    if (!category.blueSubcategory || category.blueSubcategory.trim().length === 0) {
      errors.push('Blue subcategory is required');
    }

    if (!category.whiteSubcategory || category.whiteSubcategory.trim().length === 0) {
      errors.push('White subcategory is required');
    }

    if (!category.graySubcategory || category.graySubcategory.trim().length === 0) {
      errors.push('Gray subcategory is required');
    }

    return errors;
  }

  /**
   * Validate brand hierarchy
   */
  static validateBrandHierarchy(brand: BrandHierarchy): string[] {
    const errors: string[] = [];

    if (!brand.brand || brand.brand.trim().length === 0) {
      errors.push('Brand name is required');
    }

    // Line and collaboration are optional, but if provided, cannot be empty
    if (brand.line !== undefined && brand.line.trim().length === 0) {
      errors.push('Brand line cannot be empty if provided');
    }

    if (brand.collaboration !== undefined && brand.collaboration.trim().length === 0) {
      errors.push('Brand collaboration cannot be empty if provided');
    }

    return errors;
  }

  /**
   * Normalize category hierarchy for consistency
   */
  static normalizeCategoryHierarchy(category: CategoryHierarchy): CategoryHierarchy {
    return {
      page: this.normalizeText(category.page),
      blueSubcategory: this.normalizeText(category.blueSubcategory),
      whiteSubcategory: this.normalizeText(category.whiteSubcategory),
      graySubcategory: this.normalizeText(category.graySubcategory),
    };
  }

  /**
   * Normalize brand hierarchy for consistency
   */
  static normalizeBrandHierarchy(brand: BrandHierarchy): BrandHierarchy {
    return {
      brand: this.normalizeText(brand.brand),
      line: brand.line ? this.normalizeText(brand.line) : undefined,
      collaboration: brand.collaboration ? this.normalizeText(brand.collaboration) : undefined,
    };
  }

  /**
   * Normalize text for consistency
   */
  private static normalizeText(text: string): string {
    return text.trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate search keywords from VUFS item data
   */
  static generateSearchKeywords(category: CategoryHierarchy, brand: BrandHierarchy): string[] {
    const keywords = new Set<string>();

    // Add category keywords
    keywords.add(category.page.toLowerCase());
    keywords.add(category.blueSubcategory.toLowerCase());
    keywords.add(category.whiteSubcategory.toLowerCase());
    keywords.add(category.graySubcategory.toLowerCase());

    // Add brand keywords
    keywords.add(brand.brand.toLowerCase());
    if (brand.line) keywords.add(brand.line.toLowerCase());
    if (brand.collaboration) keywords.add(brand.collaboration.toLowerCase());

    // Add combined keywords
    keywords.add(`${category.page} ${category.blueSubcategory}`.toLowerCase());
    keywords.add(`${brand.brand} ${category.whiteSubcategory}`.toLowerCase());

    return Array.from(keywords);
  }

  /**
   * Generate platform-specific product data
   */
  static generatePlatformData(
    item: VUFSItem,
    platform: ExportPlatform,
    images: string[] = []
  ): PlatformProductData {
    const isApparel = 'pieceType' in item;

    // Generate title
    const title = this.generateProductTitle(item);

    // Generate description
    const description = this.generateProductDescription(item);

    // Generate tags
    const tags = this.generateProductTags(item);

    // Map gender for platform
    const platformGender = PLATFORM_GENDER_MAPPING[platform]?.[item.gender] || item.gender;

    // Generate platform category
    const platformCategory = this.mapToPlatformCategory(item, platform);

    return {
      title,
      description,
      tags,
      seoTitle: title,
      slug: this.generateSlug(title),
      handle: this.generateSlug(title),
      pricing: {
        price: item.price,
        currency: 'BRL',
      },
      platformCategory,
      platformGender,
      images,
    };
  }

  /**
   * Generate product title based on your system
   */
  private static generateProductTitle(item: VUFSItem): string {
    const isApparel = 'pieceType' in item;

    if (isApparel) {
      const apparel = item as ApparelItem;
      const parts = [
        apparel.brand,
        apparel.model || apparel.pieceType,
        apparel.color,
        apparel.size,
        apparel.condition !== 'New' ? `(${apparel.condition})` : '',
      ].filter(Boolean);

      return parts.join(' ');
    } else {
      const footwear = item as FootwearItem;
      const parts = [
        footwear.brand,
        footwear.modelType,
        footwear.color,
        footwear.size,
        footwear.condition !== 'New' ? `(${footwear.condition})` : '',
      ].filter(Boolean);

      return parts.join(' ');
    }
  }

  /**
   * Generate product description
   */
  private static generateProductDescription(item: VUFSItem): string {
    const isApparel = 'pieceType' in item;

    let description = `${item.brand} ${isApparel ? (item as ApparelItem).pieceType : (item as FootwearItem).modelType}\n\n`;

    description += `Condition: ${item.condition}\n`;
    description += `Size: ${item.size}\n`;
    description += `Color: ${item.color}\n`;
    description += `Gender: ${item.gender}\n\n`;

    if (isApparel) {
      const apparel = item as ApparelItem;
      description += `Material: ${apparel.material}\n`;
      description += `Fit: ${apparel.fit}\n`;
      if (apparel.style.length > 0) {
        description += `Style: ${apparel.style.join(', ')}\n`;
      }
    } else {
      const footwear = item as FootwearItem;
      description += `Upper Material: ${footwear.upperMaterial}\n`;
      description += `Sole Type: ${footwear.soleType}\n`;
      description += `Lace Type: ${footwear.laceType}\n`;
      if (footwear.heelHeight) {
        description += `Heel Height: ${footwear.heelHeight}cm\n`;
      }
    }

    return description;
  }

  /**
   * Generate product tags
   */
  private static generateProductTags(item: VUFSItem): string[] {
    const isApparel = 'pieceType' in item;
    const tags = [
      item.brand,
      item.color,
      item.gender,
      item.condition,
    ];

    if (isApparel) {
      const apparel = item as ApparelItem;
      tags.push(apparel.pieceType, apparel.material, apparel.fit);
      tags.push(...apparel.style);
    } else {
      const footwear = item as FootwearItem;
      tags.push(footwear.modelType, footwear.upperMaterial, footwear.soleType);
    }

    return tags.filter(Boolean);
  }

  /**
   * Generate URL-friendly slug
   */
  private static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Map to platform-specific category
   */
  private static mapToPlatformCategory(item: VUFSItem, platform: ExportPlatform): string {
    const isApparel = 'pieceType' in item;

    // This would be expanded based on each platform's category structure
    if (platform === 'shopify') {
      if (isApparel) {
        const apparel = item as ApparelItem;
        return `Clothing > ${apparel.pieceType}`;
      } else {
        return 'Shoes';
      }
    }

    // Default mapping
    return isApparel ? (item as ApparelItem).pieceType : (item as FootwearItem).modelType;
  }

  /**
   * Validate VUFS item data
   */
  static validateVUFSItem(item: Partial<VUFSItem>): string[] {
    const errors: string[] = [];

    if (!item.sku) errors.push('SKU is required');
    if (!item.brand) errors.push('Brand is required');
    if (!item.color) errors.push('Color is required');
    if (!item.size) errors.push('Size is required');
    if (!item.gender) errors.push('Gender is required');
    if (!item.condition) errors.push('Condition is required');
    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push('Valid price is required');
    }
    if (!item.owner) errors.push('Owner is required');

    // Domain-specific validation
    if ('pieceType' in item) {
      // Apparel validation
      if (!item.pieceType) errors.push('Piece type is required for apparel');
      if (!(item as any).material) errors.push('Material is required for apparel');
      if (!(item as any).fit) errors.push('Fit is required for apparel');
    } else if ('modelType' in item) {
      // Footwear validation
      if (!item.modelType) errors.push('Model type is required for footwear');
      if (!(item as any).upperMaterial) errors.push('Upper material is required for footwear');
      if (!(item as any).soleType) errors.push('Sole type is required for footwear');
      if (!(item as any).laceType) errors.push('Lace type is required for footwear');
    }

    return errors;
  }

  /**
   * Check if item should be auto-repassed
   */
  static shouldAutoRepass(
    soldPrice: number,
    settings: ConsignmentSettings = DEFAULT_CONSIGNMENT_SETTINGS
  ): boolean {
    return soldPrice >= settings.autoRepassThreshold;
  }

  /**
   * Generate export filename for platform
   */
  static generateExportFilename(platform: ExportPlatform, timestamp: Date = new Date()): string {
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');

    return `vufs_export_${platform}_${dateStr}_${timeStr}.csv`;
  }
}