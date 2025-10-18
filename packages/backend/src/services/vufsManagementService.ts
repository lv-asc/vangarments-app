import { CategoryHierarchy, BrandHierarchy, ItemMetadata, Material, Color } from '@vangarments/shared';

export interface VUFSCategoryOption {
  id: string;
  name: string;
  level: 'page' | 'blue' | 'white' | 'gray';
  parentId?: string;
  description?: string;
  isActive: boolean;
}

export interface VUFSBrandOption {
  id: string;
  name: string;
  type: 'brand' | 'line' | 'collaboration';
  parentId?: string;
  description?: string;
  isActive: boolean;
}

export interface VUFSColorOption {
  id: string;
  name: string;
  hex: string;
  undertones: string[];
  isActive: boolean;
}

export interface VUFSMaterialOption {
  id: string;
  name: string;
  category: 'natural' | 'synthetic' | 'blend';
  properties: string[];
  isActive: boolean;
}

export interface VUFSCareInstructionOption {
  id: string;
  instruction: string;
  category: 'washing' | 'drying' | 'ironing' | 'dry_cleaning' | 'storage';
  isActive: boolean;
}

export class VUFSManagementService {
  /**
   * Get all available VUFS categories in hierarchical structure
   */
  static async getCategories(): Promise<VUFSCategoryOption[]> {
    // For now, return predefined categories
    // In a real implementation, this would come from a database
    return [
      // Page level (top level)
      { id: 'tops', name: 'Tops', level: 'page', isActive: true },
      { id: 'bottoms', name: 'Bottoms', level: 'page', isActive: true },
      { id: 'dresses', name: 'Dresses', level: 'page', isActive: true },
      { id: 'outerwear', name: 'Outerwear', level: 'page', isActive: true },
      { id: 'underwear', name: 'Underwear', level: 'page', isActive: true },
      { id: 'swimwear', name: 'Swimwear', level: 'page', isActive: true },
      { id: 'accessories', name: 'Accessories', level: 'page', isActive: true },
      { id: 'shoes', name: 'Shoes', level: 'page', isActive: true },
      
      // Blue subcategories (second level)
      { id: 'shirts', name: 'Shirts', level: 'blue', parentId: 'tops', isActive: true },
      { id: 't-shirts', name: 'T-Shirts', level: 'blue', parentId: 'tops', isActive: true },
      { id: 'blouses', name: 'Blouses', level: 'blue', parentId: 'tops', isActive: true },
      { id: 'sweaters', name: 'Sweaters', level: 'blue', parentId: 'tops', isActive: true },
      
      { id: 'jeans', name: 'Jeans', level: 'blue', parentId: 'bottoms', isActive: true },
      { id: 'trousers', name: 'Trousers', level: 'blue', parentId: 'bottoms', isActive: true },
      { id: 'shorts', name: 'Shorts', level: 'blue', parentId: 'bottoms', isActive: true },
      { id: 'skirts', name: 'Skirts', level: 'blue', parentId: 'bottoms', isActive: true },
      
      { id: 'casual-dresses', name: 'Casual Dresses', level: 'blue', parentId: 'dresses', isActive: true },
      { id: 'formal-dresses', name: 'Formal Dresses', level: 'blue', parentId: 'dresses', isActive: true },
      { id: 'cocktail-dresses', name: 'Cocktail Dresses', level: 'blue', parentId: 'dresses', isActive: true },
      
      // White subcategories (third level)
      { id: 'button-down', name: 'Button Down', level: 'white', parentId: 'shirts', isActive: true },
      { id: 'polo', name: 'Polo', level: 'white', parentId: 'shirts', isActive: true },
      { id: 'henley', name: 'Henley', level: 'white', parentId: 'shirts', isActive: true },
      
      { id: 'crew-neck', name: 'Crew Neck', level: 'white', parentId: 't-shirts', isActive: true },
      { id: 'v-neck', name: 'V-Neck', level: 'white', parentId: 't-shirts', isActive: true },
      { id: 'scoop-neck', name: 'Scoop Neck', level: 'white', parentId: 't-shirts', isActive: true },
      
      // Gray subcategories (fourth level)
      { id: 'long-sleeve-button', name: 'Long Sleeve', level: 'gray', parentId: 'button-down', isActive: true },
      { id: 'short-sleeve-button', name: 'Short Sleeve', level: 'gray', parentId: 'button-down', isActive: true },
      
      { id: 'basic-crew', name: 'Basic', level: 'gray', parentId: 'crew-neck', isActive: true },
      { id: 'graphic-crew', name: 'Graphic', level: 'gray', parentId: 'crew-neck', isActive: true },
    ];
  }

  /**
   * Get categories by level and parent
   */
  static async getCategoriesByLevel(
    level: 'page' | 'blue' | 'white' | 'gray',
    parentId?: string
  ): Promise<VUFSCategoryOption[]> {
    const allCategories = await this.getCategories();
    return allCategories.filter(cat => 
      cat.level === level && 
      cat.parentId === parentId &&
      cat.isActive
    );
  }

  /**
   * Get all available brands
   */
  static async getBrands(): Promise<VUFSBrandOption[]> {
    // For now, return predefined brands
    // In a real implementation, this would come from a database
    return [
      // Main brands
      { id: 'nike', name: 'Nike', type: 'brand', isActive: true },
      { id: 'adidas', name: 'Adidas', type: 'brand', isActive: true },
      { id: 'zara', name: 'Zara', type: 'brand', isActive: true },
      { id: 'h&m', name: 'H&M', type: 'brand', isActive: true },
      { id: 'uniqlo', name: 'Uniqlo', type: 'brand', isActive: true },
      { id: 'levi\'s', name: 'Levi\'s', type: 'brand', isActive: true },
      { id: 'calvin-klein', name: 'Calvin Klein', type: 'brand', isActive: true },
      { id: 'tommy-hilfiger', name: 'Tommy Hilfiger', type: 'brand', isActive: true },
      { id: 'gap', name: 'Gap', type: 'brand', isActive: true },
      { id: 'old-navy', name: 'Old Navy', type: 'brand', isActive: true },
      
      // Brand lines
      { id: 'nike-air', name: 'Air', type: 'line', parentId: 'nike', isActive: true },
      { id: 'nike-dri-fit', name: 'Dri-FIT', type: 'line', parentId: 'nike', isActive: true },
      { id: 'adidas-originals', name: 'Originals', type: 'line', parentId: 'adidas', isActive: true },
      { id: 'adidas-performance', name: 'Performance', type: 'line', parentId: 'adidas', isActive: true },
      { id: 'zara-basic', name: 'Basic', type: 'line', parentId: 'zara', isActive: true },
      { id: 'zara-trf', name: 'TRF', type: 'line', parentId: 'zara', isActive: true },
      
      // Collaborations
      { id: 'nike-off-white', name: 'Off-White', type: 'collaboration', parentId: 'nike', isActive: true },
      { id: 'adidas-yeezy', name: 'Yeezy', type: 'collaboration', parentId: 'adidas', isActive: true },
      { id: 'h&m-designer', name: 'Designer Collaborations', type: 'collaboration', parentId: 'h&m', isActive: true },
    ];
  }

  /**
   * Get brands by type and parent
   */
  static async getBrandsByType(
    type: 'brand' | 'line' | 'collaboration',
    parentId?: string
  ): Promise<VUFSBrandOption[]> {
    const allBrands = await this.getBrands();
    return allBrands.filter(brand => 
      brand.type === type && 
      brand.parentId === parentId &&
      brand.isActive
    );
  }

  /**
   * Get all available colors
   */
  static async getColors(): Promise<VUFSColorOption[]> {
    return [
      { id: 'black', name: 'Black', hex: '#000000', undertones: [], isActive: true },
      { id: 'white', name: 'White', hex: '#FFFFFF', undertones: [], isActive: true },
      { id: 'gray', name: 'Gray', hex: '#808080', undertones: ['cool', 'warm'], isActive: true },
      { id: 'navy', name: 'Navy', hex: '#000080', undertones: ['blue'], isActive: true },
      { id: 'blue', name: 'Blue', hex: '#0000FF', undertones: ['cool'], isActive: true },
      { id: 'light-blue', name: 'Light Blue', hex: '#ADD8E6', undertones: ['cool'], isActive: true },
      { id: 'red', name: 'Red', hex: '#FF0000', undertones: ['warm'], isActive: true },
      { id: 'burgundy', name: 'Burgundy', hex: '#800020', undertones: ['red', 'purple'], isActive: true },
      { id: 'green', name: 'Green', hex: '#008000', undertones: ['cool'], isActive: true },
      { id: 'light-green', name: 'Light Green', hex: '#90EE90', undertones: ['cool'], isActive: true },
      { id: 'yellow', name: 'Yellow', hex: '#FFFF00', undertones: ['warm'], isActive: true },
      { id: 'orange', name: 'Orange', hex: '#FFA500', undertones: ['warm'], isActive: true },
      { id: 'purple', name: 'Purple', hex: '#800080', undertones: ['cool'], isActive: true },
      { id: 'pink', name: 'Pink', hex: '#FFC0CB', undertones: ['warm', 'cool'], isActive: true },
      { id: 'brown', name: 'Brown', hex: '#A52A2A', undertones: ['warm'], isActive: true },
      { id: 'beige', name: 'Beige', hex: '#F5F5DC', undertones: ['warm'], isActive: true },
      { id: 'cream', name: 'Cream', hex: '#FFFDD0', undertones: ['warm'], isActive: true },
      { id: 'silver', name: 'Silver', hex: '#C0C0C0', undertones: ['cool'], isActive: true },
      { id: 'gold', name: 'Gold', hex: '#FFD700', undertones: ['warm'], isActive: true },
    ];
  }

  /**
   * Get all available materials
   */
  static async getMaterials(): Promise<VUFSMaterialOption[]> {
    return [
      // Natural materials
      { id: 'cotton', name: 'Cotton', category: 'natural', properties: ['breathable', 'soft', 'absorbent'], isActive: true },
      { id: 'linen', name: 'Linen', category: 'natural', properties: ['breathable', 'lightweight', 'wrinkle-prone'], isActive: true },
      { id: 'wool', name: 'Wool', category: 'natural', properties: ['warm', 'moisture-wicking', 'odor-resistant'], isActive: true },
      { id: 'silk', name: 'Silk', category: 'natural', properties: ['luxurious', 'smooth', 'temperature-regulating'], isActive: true },
      { id: 'cashmere', name: 'Cashmere', category: 'natural', properties: ['soft', 'warm', 'lightweight'], isActive: true },
      { id: 'leather', name: 'Leather', category: 'natural', properties: ['durable', 'water-resistant', 'ages-well'], isActive: true },
      { id: 'denim', name: 'Denim', category: 'natural', properties: ['durable', 'structured', 'cotton-based'], isActive: true },
      
      // Synthetic materials
      { id: 'polyester', name: 'Polyester', category: 'synthetic', properties: ['wrinkle-resistant', 'quick-dry', 'durable'], isActive: true },
      { id: 'nylon', name: 'Nylon', category: 'synthetic', properties: ['strong', 'elastic', 'lightweight'], isActive: true },
      { id: 'acrylic', name: 'Acrylic', category: 'synthetic', properties: ['wool-like', 'lightweight', 'warm'], isActive: true },
      { id: 'spandex', name: 'Spandex/Elastane', category: 'synthetic', properties: ['stretchy', 'form-fitting', 'recovery'], isActive: true },
      { id: 'polyurethane', name: 'Polyurethane', category: 'synthetic', properties: ['flexible', 'water-resistant', 'leather-like'], isActive: true },
      { id: 'viscose', name: 'Viscose/Rayon', category: 'synthetic', properties: ['silk-like', 'breathable', 'drapes-well'], isActive: true },
      
      // Blends
      { id: 'cotton-polyester', name: 'Cotton-Polyester Blend', category: 'blend', properties: ['comfortable', 'easy-care', 'durable'], isActive: true },
      { id: 'cotton-spandex', name: 'Cotton-Spandex Blend', category: 'blend', properties: ['stretchy', 'comfortable', 'form-fitting'], isActive: true },
      { id: 'wool-cashmere', name: 'Wool-Cashmere Blend', category: 'blend', properties: ['soft', 'warm', 'luxurious'], isActive: true },
      { id: 'linen-cotton', name: 'Linen-Cotton Blend', category: 'blend', properties: ['breathable', 'soft', 'less-wrinkled'], isActive: true },
    ];
  }

  /**
   * Get materials by category
   */
  static async getMaterialsByCategory(category: 'natural' | 'synthetic' | 'blend'): Promise<VUFSMaterialOption[]> {
    const allMaterials = await this.getMaterials();
    return allMaterials.filter(material => material.category === category && material.isActive);
  }

  /**
   * Get all available care instructions
   */
  static async getCareInstructions(): Promise<VUFSCareInstructionOption[]> {
    return [
      // Washing
      { id: 'machine-wash-cold', instruction: 'Machine wash cold', category: 'washing', isActive: true },
      { id: 'machine-wash-warm', instruction: 'Machine wash warm', category: 'washing', isActive: true },
      { id: 'hand-wash-only', instruction: 'Hand wash only', category: 'washing', isActive: true },
      { id: 'do-not-wash', instruction: 'Do not wash', category: 'washing', isActive: true },
      { id: 'gentle-cycle', instruction: 'Gentle cycle', category: 'washing', isActive: true },
      
      // Drying
      { id: 'tumble-dry-low', instruction: 'Tumble dry low', category: 'drying', isActive: true },
      { id: 'tumble-dry-medium', instruction: 'Tumble dry medium', category: 'drying', isActive: true },
      { id: 'air-dry', instruction: 'Air dry', category: 'drying', isActive: true },
      { id: 'lay-flat-to-dry', instruction: 'Lay flat to dry', category: 'drying', isActive: true },
      { id: 'do-not-tumble-dry', instruction: 'Do not tumble dry', category: 'drying', isActive: true },
      
      // Ironing
      { id: 'iron-low-heat', instruction: 'Iron on low heat', category: 'ironing', isActive: true },
      { id: 'iron-medium-heat', instruction: 'Iron on medium heat', category: 'ironing', isActive: true },
      { id: 'iron-high-heat', instruction: 'Iron on high heat', category: 'ironing', isActive: true },
      { id: 'do-not-iron', instruction: 'Do not iron', category: 'ironing', isActive: true },
      { id: 'steam-iron', instruction: 'Steam iron safe', category: 'ironing', isActive: true },
      
      // Dry cleaning
      { id: 'dry-clean-only', instruction: 'Dry clean only', category: 'dry_cleaning', isActive: true },
      { id: 'dry-clean-recommended', instruction: 'Dry clean recommended', category: 'dry_cleaning', isActive: true },
      { id: 'do-not-dry-clean', instruction: 'Do not dry clean', category: 'dry_cleaning', isActive: true },
      
      // Storage
      { id: 'hang-to-store', instruction: 'Hang to store', category: 'storage', isActive: true },
      { id: 'fold-to-store', instruction: 'Fold to store', category: 'storage', isActive: true },
      { id: 'store-flat', instruction: 'Store flat', category: 'storage', isActive: true },
      { id: 'cedar-protection', instruction: 'Use cedar protection', category: 'storage', isActive: true },
    ];
  }

  /**
   * Get care instructions by category
   */
  static async getCareInstructionsByCategory(
    category: 'washing' | 'drying' | 'ironing' | 'dry_cleaning' | 'storage'
  ): Promise<VUFSCareInstructionOption[]> {
    const allInstructions = await this.getCareInstructions();
    return allInstructions.filter(instruction => instruction.category === category && instruction.isActive);
  }

  /**
   * Build category hierarchy from selections
   */
  static buildCategoryHierarchy(
    page?: string,
    blueSubcategory?: string,
    whiteSubcategory?: string,
    graySubcategory?: string
  ): CategoryHierarchy {
    return {
      page: page || '',
      blueSubcategory: blueSubcategory || '',
      whiteSubcategory: whiteSubcategory || '',
      graySubcategory: graySubcategory || '',
    };
  }

  /**
   * Build brand hierarchy from selections
   */
  static buildBrandHierarchy(
    brand?: string,
    line?: string,
    collaboration?: string
  ): BrandHierarchy {
    return {
      brand: brand || '',
      line,
      collaboration,
    };
  }

  /**
   * Build item metadata from selections
   */
  static buildItemMetadata(
    composition: Material[],
    colors: Color[],
    careInstructions: string[],
    acquisitionInfo?: {
      purchaseDate?: Date;
      purchasePrice?: number;
      store?: string;
      receiptUrl?: string;
    },
    pricing?: {
      retailPrice?: number;
      currentValue?: number;
      marketValue?: number;
    }
  ): ItemMetadata {
    return {
      composition,
      colors,
      careInstructions,
      acquisitionInfo: acquisitionInfo || {},
      pricing: pricing || {},
    };
  }

  /**
   * Search categories by name
   */
  static async searchCategories(query: string): Promise<VUFSCategoryOption[]> {
    const allCategories = await this.getCategories();
    const lowerQuery = query.toLowerCase();
    
    return allCategories.filter(category =>
      category.name.toLowerCase().includes(lowerQuery) &&
      category.isActive
    );
  }

  /**
   * Search brands by name
   */
  static async searchBrands(query: string): Promise<VUFSBrandOption[]> {
    const allBrands = await this.getBrands();
    const lowerQuery = query.toLowerCase();
    
    return allBrands.filter(brand =>
      brand.name.toLowerCase().includes(lowerQuery) &&
      brand.isActive
    );
  }

  /**
   * Search materials by name
   */
  static async searchMaterials(query: string): Promise<VUFSMaterialOption[]> {
    const allMaterials = await this.getMaterials();
    const lowerQuery = query.toLowerCase();
    
    return allMaterials.filter(material =>
      material.name.toLowerCase().includes(lowerQuery) &&
      material.isActive
    );
  }

  /**
   * Get category path (breadcrumb)
   */
  static async getCategoryPath(categoryId: string): Promise<VUFSCategoryOption[]> {
    const allCategories = await this.getCategories();
    const path: VUFSCategoryOption[] = [];
    
    let currentCategory = allCategories.find(cat => cat.id === categoryId);
    
    while (currentCategory) {
      path.unshift(currentCategory);
      if (currentCategory.parentId) {
        currentCategory = allCategories.find(cat => cat.id === currentCategory!.parentId);
      } else {
        break;
      }
    }
    
    return path;
  }

  /**
   * Get brand path (breadcrumb)
   */
  static async getBrandPath(brandId: string): Promise<VUFSBrandOption[]> {
    const allBrands = await this.getBrands();
    const path: VUFSBrandOption[] = [];
    
    let currentBrand = allBrands.find(brand => brand.id === brandId);
    
    while (currentBrand) {
      path.unshift(currentBrand);
      if (currentBrand.parentId) {
        currentBrand = allBrands.find(brand => brand.id === currentBrand!.parentId);
      } else {
        break;
      }
    }
    
    return path;
  }
}