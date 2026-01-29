import { CategoryHierarchy, BrandHierarchy, ItemMetadata, ItemCondition, OwnershipInfo } from '@vangarments/shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WardrobeItemValidationData {
  category?: CategoryHierarchy;
  brand?: BrandHierarchy;
  metadata?: ItemMetadata;
  condition?: ItemCondition;
  ownership?: OwnershipInfo;
  code?: string; // VUFS code for URL and identification
  images?: any[]; // Images array
}

export class WardrobeValidationService {
  /**
   * Validate complete wardrobe item data
   */
  static validateWardrobeItem(
    itemData: WardrobeItemValidationData,
    isUpdate: boolean = false
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate required fields for creation
    if (!isUpdate) {
      if (!itemData.category) {
        result.errors.push('Category is required');
      }
      if (!itemData.brand) {
        result.errors.push('Brand is required');
      }
      if (!itemData.metadata) {
        result.errors.push('Metadata is required');
      }
      if (!itemData.condition) {
        result.errors.push('Condition is required');
      }
    }

    // Validate category hierarchy
    if (itemData.category) {
      const categoryValidation = this.validateCategoryHierarchy(itemData.category);
      result.errors.push(...categoryValidation.errors);
      result.warnings.push(...categoryValidation.warnings);
    }

    // Validate brand hierarchy
    if (itemData.brand) {
      const brandValidation = this.validateBrandHierarchy(itemData.brand);
      result.errors.push(...brandValidation.errors);
      result.warnings.push(...brandValidation.warnings);
    }

    // Validate metadata
    if (itemData.metadata) {
      const metadataValidation = this.validateMetadata(itemData.metadata);
      result.errors.push(...metadataValidation.errors);
      result.warnings.push(...metadataValidation.warnings);
    }

    // Validate condition
    if (itemData.condition) {
      const conditionValidation = this.validateCondition(itemData.condition);
      result.errors.push(...conditionValidation.errors);
      result.warnings.push(...conditionValidation.warnings);
    }

    // Validate ownership
    if (itemData.ownership) {
      const ownershipValidation = this.validateOwnership(itemData.ownership);
      result.errors.push(...ownershipValidation.errors);
      result.warnings.push(...ownershipValidation.warnings);
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate category hierarchy structure
   */
  private static validateCategoryHierarchy(category: CategoryHierarchy): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check required fields
    if (!category.page) {
      result.errors.push('Category page is required');
    } else if (typeof category.page !== 'string' || category.page.trim().length === 0) {
      result.errors.push('Category page must be a non-empty string');
    }

    // Validate page format (should be a valid VUFS page)
    if (category.page) {
      const validPages = [
        'TOPS', 'BOTTOMS', 'DRESSES', 'OUTERWEAR', 'UNDERWEAR', 'SWIMWEAR',
        'ACCESSORIES', 'SHOES', 'BAGS', 'JEWELRY', 'WATCHES', 'EYEWEAR'
      ];

      if (!validPages.includes(category.page.toUpperCase())) {
        result.warnings.push(`Category page '${category.page}' is not a standard VUFS category`);
      }
    }

    // Validate subcategories if present
    if (category.blueSubcategory && typeof category.blueSubcategory !== 'string') {
      result.errors.push('Category blue subcategory must be a string');
    }

    if (category.whiteSubcategory && typeof category.whiteSubcategory !== 'string') {
      result.errors.push('Category white subcategory must be a string');
    }

    if (category.graySubcategory && typeof category.graySubcategory !== 'string') {
      result.errors.push('Category gray subcategory must be a string');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate brand hierarchy structure
   */
  private static validateBrandHierarchy(brand: BrandHierarchy): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check required fields
    if (!brand.brand) {
      result.errors.push('Brand name is required');
    } else if (typeof brand.brand !== 'string' || brand.brand.trim().length === 0) {
      result.errors.push('Brand name must be a non-empty string');
    }

    // Validate brand name length
    if (brand.brand && brand.brand.length > 100) {
      result.errors.push('Brand name must be 100 characters or less');
    }

    // Validate line if present
    if (brand.line && typeof brand.line !== 'string') {
      result.errors.push('Brand line must be a string');
    }

    if (brand.line && brand.line.length > 100) {
      result.errors.push('Brand line must be 100 characters or less');
    }

    // Validate collaboration if present
    if (brand.collaboration && typeof brand.collaboration !== 'string') {
      result.errors.push('Brand collaboration must be a string');
    }

    if (brand.collaboration && brand.collaboration.length > 100) {
      result.errors.push('Brand collaboration must be 100 characters or less');
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate item metadata
   */
  private static validateMetadata(metadata: ItemMetadata): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate colors
    if (metadata.colors) {
      if (!Array.isArray(metadata.colors)) {
        result.errors.push('Colors must be an array');
      } else {
        metadata.colors.forEach((color: any, index: number) => {
          if (typeof color !== 'object' || !color.primary) {
            result.errors.push(`Color at index ${index} must have a primary color`);
          }
        });
      }
    }

    // Validate composition (materials)
    if (metadata.composition) {
      if (!Array.isArray(metadata.composition)) {
        result.errors.push('Composition must be an array');
      } else {
        metadata.composition.forEach((material: any, index: number) => {
          if (!material.material || typeof material.material !== 'string') {
            result.errors.push(`Material at index ${index} must have a material name`);
          }
          if (typeof material.percentage !== 'number' || material.percentage < 0 || material.percentage > 100) {
            result.errors.push(`Material at index ${index} must have a valid percentage (0-100)`);
          }
        });
      }
    }

    // Validate acquisition info
    if (metadata.acquisitionInfo) {
      if (metadata.acquisitionInfo.purchaseDate) {
        const date = new Date(metadata.acquisitionInfo.purchaseDate);
        if (isNaN(date.getTime())) {
          result.errors.push('Purchase date must be a valid date');
        }
      }
      if (metadata.acquisitionInfo.purchasePrice !== undefined) {
        if (typeof metadata.acquisitionInfo.purchasePrice !== 'number' || metadata.acquisitionInfo.purchasePrice < 0) {
          result.errors.push('Purchase price must be a non-negative number');
        }
      }
      if (metadata.acquisitionInfo.store && typeof metadata.acquisitionInfo.store !== 'string') {
        result.errors.push('Store must be a string');
      }
    }

    // Validate pricing
    if (metadata.pricing) {
      if (typeof metadata.pricing.retailPrice !== 'number' || metadata.pricing.retailPrice < 0) {
        result.errors.push('Retail price must be a non-negative number');
      }
      if (typeof metadata.pricing.currentValue !== 'number' || metadata.pricing.currentValue < 0) {
        result.errors.push('Current value must be a non-negative number');
      }
    }

    // Validate care instructions
    if (metadata.careInstructions) {
      if (!Array.isArray(metadata.careInstructions)) {
        result.errors.push('Care instructions must be an array');
      } else {
        metadata.careInstructions.forEach((instruction: any, index: number) => {
          if (typeof instruction !== 'string' || instruction.trim().length === 0) {
            result.errors.push(`Care instruction at index ${index} must be a non-empty string`);
          }
        });
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate item condition
   */
  private static validateCondition(condition: ItemCondition): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate status
    if (!condition.status) {
      result.errors.push('Condition status is required');
    } else {
      const validStatuses = ['new', 'dswt', 'never_used', 'used'];
      if (!validStatuses.includes(condition.status)) {
        result.errors.push(`Condition status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate description if present
    if (condition.description && typeof condition.description !== 'string') {
      result.errors.push('Condition description must be a string');
    }

    if (condition.description && condition.description.length > 500) {
      result.errors.push('Condition description must be 500 characters or less');
    }

    // Validate wear count if present
    if (condition.wearCount !== undefined) {
      if (typeof condition.wearCount !== 'number' || condition.wearCount < 0) {
        result.errors.push('Wear count must be a non-negative number');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate ownership information
   */
  private static validateOwnership(ownership: OwnershipInfo): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate status
    if (!ownership.status) {
      result.errors.push('Ownership status is required');
    } else {
      const validStatuses = ['owned', 'sold', 'loaned', 'borrowed', 'wishlist'];
      if (!validStatuses.includes(ownership.status)) {
        result.errors.push(`Ownership status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate visibility
    if (!ownership.visibility) {
      result.errors.push('Ownership visibility is required');
    } else {
      const validVisibilities = ['public', 'friends', 'private'];
      if (!validVisibilities.includes(ownership.visibility)) {
        result.errors.push(`Ownership visibility must be one of: ${validVisibilities.join(', ')}`);
      }
    }

    // Validate EntityRefs (owner, lentTo, lentBy)
    const validateEntityRef = (ref: any, fieldName: string) => {
      if (!ref) return;
      if (typeof ref !== 'object') {
        result.errors.push(`${fieldName} must be an object`);
        return;
      }
      if (!ref.id) result.errors.push(`${fieldName} must have an ID`);
      if (!ref.name) result.errors.push(`${fieldName} must have a name`);
      if (!ref.type) result.errors.push(`${fieldName} must have a type`);
    };

    if (ownership.owner) validateEntityRef(ownership.owner, 'Owner');
    if (ownership.lentTo) validateEntityRef(ownership.lentTo, 'Lent To');
    if (ownership.lentBy) validateEntityRef(ownership.lentBy, 'Lent By');

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate image upload data
   */
  static validateImageUpload(
    files: Express.Multer.File[],
    maxFiles: number = 5,
    maxFileSize: number = 10 * 1024 * 1024 // 10MB
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!files || files.length === 0) {
      result.errors.push('At least one image is required');
      result.isValid = false;
      return result;
    }

    if (files.length > maxFiles) {
      result.errors.push(`Maximum ${maxFiles} images allowed`);
    }

    files.forEach((file, index) => {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        result.errors.push(`File ${index + 1} is not an image`);
      }

      // Validate file size
      if (file.size > maxFileSize) {
        result.errors.push(`File ${index + 1} exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`);
      }

      // Validate supported formats
      const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedFormats.includes(file.mimetype)) {
        result.warnings.push(`File ${index + 1} format '${file.mimetype}' may not be fully supported`);
      }
    });

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Sanitize and normalize item data
   */
  static sanitizeItemData(itemData: WardrobeItemValidationData): WardrobeItemValidationData {
    const sanitized: WardrobeItemValidationData = {};

    // Sanitize category
    if (itemData.category) {
      sanitized.category = {
        page: itemData.category.page?.trim(),
        blueSubcategory: itemData.category.blueSubcategory?.trim(),
        whiteSubcategory: itemData.category.whiteSubcategory?.trim(),
        graySubcategory: itemData.category.graySubcategory?.trim(),
      };
    }

    // Sanitize brand
    if (itemData.brand) {
      sanitized.brand = {
        brand: itemData.brand.brand?.trim(),
        line: itemData.brand.line?.trim(),
        collaboration: itemData.brand.collaboration?.trim(),
      };
    }

    // Sanitize metadata
    if (itemData.metadata) {
      sanitized.metadata = {
        ...itemData.metadata,
        careInstructions: itemData.metadata.careInstructions?.map((instruction: any) => instruction.trim()).filter(Boolean),
      };
    }

    // Sanitize condition
    if (itemData.condition) {
      sanitized.condition = {
        ...itemData.condition,
        description: itemData.condition.description?.trim(),
      };
    }

    // Copy ownership as-is (already validated)
    if (itemData.ownership) {
      sanitized.ownership = { ...itemData.ownership };
    }

    // Pass through code if provided (for VUFS code/slug)
    if (itemData.code) {
      sanitized.code = itemData.code.trim();
    }

    // Pass through images if provided
    if (itemData.images) {
      sanitized.images = itemData.images;
    }

    return sanitized;
  }
}