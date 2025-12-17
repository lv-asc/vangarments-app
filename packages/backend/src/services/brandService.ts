import { BrandAccountModel, CreateBrandAccountData, UpdateBrandAccountData, BrandAccount } from '../models/BrandAccount';
import { BrandCatalogModel, CreateBrandCatalogItemData, UpdateBrandCatalogItemData, BrandCatalogItem } from '../models/BrandCatalog';
import { CommissionTrackingModel, CreateCommissionData } from '../models/CommissionTracking';
import { UserModel } from '../models/User';

export interface BrandRegistrationRequest {
  brandName: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessType: 'brand' | 'store' | 'designer' | 'manufacturer';
  partnershipTier?: 'basic' | 'premium' | 'enterprise';
}

export interface BrandPageCustomization {
  logo?: string;
  banner?: string;
  brandColors?: string[];
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  customSections?: Array<{
    title: string;
    content: string;
    type: 'text' | 'image' | 'video';
  }>;
}

export class BrandService {
  /**
   * Register a new brand account
   */
  async registerBrand(userId: string, registrationData: BrandRegistrationRequest): Promise<BrandAccount> {
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Users can have multiple brand accounts - no restriction

    const brandInfo = {
      name: registrationData.brandName,
      description: registrationData.description,
      website: registrationData.website,
      businessType: registrationData.businessType,
      contactInfo: {
        email: registrationData.contactEmail,
        phone: registrationData.contactPhone,
      },
    };

    const brandData: CreateBrandAccountData = {
      userId,
      brandInfo,
      partnershipTier: registrationData.partnershipTier || 'basic',
    };

    const brand = await BrandAccountModel.create(brandData);

    await UserModel.addRole(userId, 'brand_owner');

    return brand;
  }

  /**
   * Get brand account by user ID
   */
  async getBrandByUserId(userId: string): Promise<BrandAccount | null> {
    return await BrandAccountModel.findByUserId(userId);
  }

  /**
   * Update brand page customization
   */
  async updateBrandPage(brandId: string, customization: BrandPageCustomization): Promise<BrandAccount> {
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    const updatedBrandInfo = {
      ...brand.brandInfo,
      logo: customization.logo || brand.brandInfo.logo,
      banner: customization.banner || brand.brandInfo.banner,
      brandColors: customization.brandColors || brand.brandInfo.brandColors,
      socialLinks: customization.socialLinks || brand.brandInfo.socialLinks,
    };

    const updateData: UpdateBrandAccountData = {
      brandInfo: updatedBrandInfo,
    };

    const updatedBrand = await BrandAccountModel.update(brandId, updateData);
    if (!updatedBrand) {
      throw new Error('Failed to update brand');
    }

    return updatedBrand;
  }

  /**
   * Admin update brand details
   */
  async updateBrand(brandId: string, updates: UpdateBrandAccountData): Promise<BrandAccount> {
    const brand = await BrandAccountModel.findBySlugOrId(brandId);
    if (!brand) throw new Error('Brand not found');

    const updateData: UpdateBrandAccountData = {};
    if (updates.brandInfo) updateData.brandInfo = updates.brandInfo;
    if (updates.partnershipTier) updateData.partnershipTier = updates.partnershipTier;
    if (updates.userId !== undefined) updateData.userId = updates.userId;
    // Add other fields as needed

    console.log('BrandService.updateBrand updateData:', JSON.stringify(updateData));
    const updatedBrand = await BrandAccountModel.update(brand.id, updateData);
    if (!updatedBrand) throw new Error('Failed to update brand');

    return updatedBrand;
  }

  /**
   * Add item to brand catalog
   */
  async addToCatalog(brandId: string, catalogData: CreateBrandCatalogItemData): Promise<BrandCatalogItem> {
    // Verify brand exists and is verified
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    if (brand.verificationStatus !== 'verified') {
      throw new Error('Brand must be verified to add catalog items');
    }

    return await BrandCatalogModel.create({
      ...catalogData,
      brandId,
    });
  }

  /**
   * Update catalog item
   */
  async updateCatalogItem(
    brandId: string,
    itemId: string,
    updateData: UpdateBrandCatalogItemData
  ): Promise<BrandCatalogItem> {
    const item = await BrandCatalogModel.findById(itemId);
    if (!item || item.brandId !== brandId) {
      throw new Error('Catalog item not found or access denied');
    }

    const updatedItem = await BrandCatalogModel.update(itemId, updateData);
    if (!updatedItem) {
      throw new Error('Failed to update catalog item');
    }

    return updatedItem;
  }

  /**
   * Get brand catalog with filters
   */
  async getBrandCatalog(
    brandId: string,
    filters: {
      availabilityStatus?: 'available' | 'out_of_stock' | 'discontinued' | 'pre_order';
      priceRange?: { min?: number; max?: number };
      collection?: string;
      season?: string;
      search?: string;
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ items: BrandCatalogItem[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const { items, total } = await BrandCatalogModel.findByBrandId(brandId, filters, limit + 1, offset);

    const hasMore = items.length > limit;
    if (hasMore) {
      items.pop();
    }

    return { items, total, hasMore };
  }

  /**
   * Create commission tracking for a transaction
   */
  async trackCommission(
    transactionId: string,
    brandId: string,
    amount: number,
    commissionRate: number
  ): Promise<void> {
    const commissionData: CreateCommissionData = {
      transactionId,
      brandId,
      amount,
      commissionRate,
    };

    await CommissionTrackingModel.create(commissionData);
  }

  /**
   * Get brand analytics and performance metrics
   */
  async getBrandAnalytics(
    brandId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    overview: {
      totalCatalogItems: number;
      totalSales: number;
      totalCommission: number;
      monthlyViews: number;
    };
    commissions: {
      totalCommissions: number;
      totalPaid: number;
      totalPending: number;
      averageCommissionRate: number;
      transactionCount: number;
      periodBreakdown: Array<{
        period: string;
        commissions: number;
        transactions: number;
      }>;
    };
    catalog: {
      collections: Array<{ collection: string; itemCount: number }>;
      seasons: Array<{ season: string; itemCount: number }>;
    };
  }> {
    const [overview, commissions, collections, seasons] = await Promise.all([
      BrandAccountModel.getAnalytics(brandId),
      CommissionTrackingModel.getCommissionSummary(brandId, period),
      BrandCatalogModel.getCollections(brandId),
      BrandCatalogModel.getSeasons(brandId),
    ]);

    return {
      overview: {
        totalCatalogItems: overview.catalogItems,
        totalSales: overview.totalSales,
        totalCommission: overview.totalCommission,
        monthlyViews: overview.monthlyViews,
      },
      commissions,
      catalog: {
        collections,
        seasons,
      },
    };
  }

  /**
   * Verify brand account
   */
  async verifyBrand(brandId: string, status: 'verified' | 'rejected', notes?: string): Promise<BrandAccount> {
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    const updateData: UpdateBrandAccountData = {
      verificationStatus: status,
    };

    const updatedBrand = await BrandAccountModel.update(brandId, updateData);
    if (!updatedBrand) {
      throw new Error('Failed to update brand verification status');
    }

    // Add verified badge if approved
    if (status === 'verified') {
      await BrandAccountModel.addBadge(brandId, 'verified_brand');
    }

    return updatedBrand;
  }

  /**
   * Upgrade brand partnership tier
   */
  async upgradeBrandTier(
    brandId: string,
    newTier: 'basic' | 'premium' | 'enterprise'
  ): Promise<BrandAccount> {
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    if (brand.verificationStatus !== 'verified') {
      throw new Error('Brand must be verified to upgrade tier');
    }

    const updateData: UpdateBrandAccountData = {
      partnershipTier: newTier,
    };

    const updatedBrand = await BrandAccountModel.update(brandId, updateData);
    if (!updatedBrand) {
      throw new Error('Failed to upgrade brand tier');
    }

    // Add premium partner badge for premium/enterprise tiers
    if (newTier === 'premium' || newTier === 'enterprise') {
      await BrandAccountModel.addBadge(brandId, 'premium_partner');
    }

    return updatedBrand;
  }

  /**
   * Search brands
   */
  async searchBrands(
    query: string,
    filters: {
      verificationStatus?: 'verified' | 'pending' | 'rejected';
      partnershipTier?: 'basic' | 'premium' | 'enterprise';
      businessType?: 'brand' | 'store' | 'designer' | 'manufacturer';
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ brands: BrandAccount[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const searchFilters = {
      ...filters,
      search: query,
    };

    const { brands, total } = await BrandAccountModel.findMany(searchFilters, limit + 1, offset);

    const hasMore = brands.length > limit;
    if (hasMore) {
      brands.pop();
    }

    return { brands, total, hasMore };
  }

  /**
   * Get brand public profile
   */
  async getBrandProfile(brandId: string): Promise<{
    brand: BrandAccount;
    featuredItems: BrandCatalogItem[];
    collections: Array<{ collection: string; itemCount: number }>;
    stats: {
      catalogItems: number;
      followers: number; // TODO: Implement brand following
    };
  }> {
    const brand = await BrandAccountModel.findBySlugOrId(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Get featured items (latest available items) - use resolved brand.id
    const { items: featuredItems } = await BrandCatalogModel.findByBrandId(
      brand.id,
      { availabilityStatus: 'available' },
      8,
      0
    );

    const collections = await BrandCatalogModel.getCollections(brand.id);

    return {
      brand,
      featuredItems,
      collections,
      stats: {
        catalogItems: brand.analytics.totalCatalogItems,
        followers: 0, // TODO: Implement brand following system
      },
    };
  }

  /**
   * Bulk update catalog availability
   */
  async bulkUpdateAvailability(
    brandId: string,
    updates: Array<{ vufsItemId: string; availabilityStatus: string }>
  ): Promise<void> {
    // Verify brand ownership
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    await BrandCatalogModel.bulkUpdateAvailability(brandId, updates);
  }

  /**
   * Get commission history for brand
   */
  async getCommissionHistory(
    brandId: string,
    filters: {
      status?: 'pending' | 'approved' | 'paid' | 'disputed';
      dateRange?: { start: string; end: string };
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ commissions: any[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const commissionFilters = {
      ...filters,
      brandId,
    };

    const { commissions, total } = await CommissionTrackingModel.findMany(
      commissionFilters,
      limit + 1,
      offset
    );

    const hasMore = commissions.length > limit;
    if (hasMore) {
      commissions.pop();
    }

    return { commissions, total, hasMore };
  }

  /**
   * Sync brands from VUFS database to local brand accounts
   */
  async syncVufsBrands(): Promise<number> {
    try {
      // Get a system user (admin) to own these brands
      // We use initializeDefaultAdmin to ensure at least one admin exists
      // In a real scenario, we might want a specific "System" user
      // Import dynamically to avoid circular dependency if AdminAuthService imports BrandService (unlikely but safe)
      const { AdminAuthService } = await import('./adminAuthService');
      const adminUser = await AdminAuthService.initializeDefaultAdmin();

      return await BrandAccountModel.syncFromVufs(adminUser.id);
    } catch (error) {
      console.error('Failed to sync VUFS brands:', error);
      return 0; // Don't fail the request if sync fails
    }
  }

  /**
   * Soft delete a brand
   */
  async softDeleteBrand(brandId: string): Promise<void> {
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) throw new Error('Brand not found');

    const success = await BrandAccountModel.softDelete(brandId);
    if (!success) throw new Error('Failed to delete brand');
  }

  /**
   * Restore a soft-deleted brand
   */
  async restoreBrand(brandId: string): Promise<void> {
    const success = await BrandAccountModel.restore(brandId);
    if (!success) throw new Error('Failed to restore brand or brand not found in trash');
  }

  /**
   * Permanently delete a brand
   */
  async permanentDeleteBrand(brandId: string): Promise<void> {
    const success = await BrandAccountModel.delete(brandId);
    if (!success) throw new Error('Failed to permanently delete brand');
  }

  /**
   * Get all soft-deleted brands (Trash)
   */
  async getTrashBrands(): Promise<BrandAccount[]> {
    return await BrandAccountModel.findDeleted();
  }

  /**
   * Bulk update brands (Admin only)
   */
  async bulkUpdateBrands(
    brandIds: string[],
    updates: {
      tagsToAdd?: string[];
      country?: string;
    }
  ): Promise<void> {
    const updatePromises = brandIds.map(async (brandId) => {
      try {
        const brand = await BrandAccountModel.findById(brandId);
        if (!brand) return; // Skip if not found

        const currentInfo = brand.brandInfo || {};
        const updatedInfo = { ...currentInfo };

        let hasChanges = false;

        // Update Country if provided (overwrite)
        if (updates.country) {
          updatedInfo.country = updates.country;
          hasChanges = true;
        }

        // Add Tags if provided (merge unique)
        if (updates.tagsToAdd && updates.tagsToAdd.length > 0) {
          const currentTags = currentInfo.tags || [];
          const newTags = updates.tagsToAdd.filter(t => !currentTags.includes(t));
          if (newTags.length > 0) {
            updatedInfo.tags = [...currentTags, ...newTags];
            hasChanges = true;
          }
        }

        // Only update if changes were made
        if (hasChanges) {
          await BrandAccountModel.update(brandId, { brandInfo: updatedInfo });
        }

      } catch (error) {
        console.error(`Failed to bulk update brand ${brandId}`, error);
        // Continue with other brands even if one fails
      }
    });

    await Promise.all(updatePromises);
  }

  /**
   * Bulk delete brands (Admin only)
   */
  async bulkDeleteBrands(brandIds: string[]): Promise<void> {
    const deletePromises = brandIds.map(async (brandId) => {
      try {
        await BrandAccountModel.softDelete(brandId);
      } catch (error) {
        console.error(`Failed to bulk delete brand ${brandId}`, error);
      }
    });

    await Promise.all(deletePromises);
  }
}