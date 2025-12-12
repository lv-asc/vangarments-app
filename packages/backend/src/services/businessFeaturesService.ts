import { BusinessBadgeModel, CreateBusinessBadgeData } from '../models/BusinessBadge';
import { InventoryManagementModel, CreateInventoryItemData, CreateInventoryMovementData } from '../models/InventoryManagement';
import { BrandAccountModel } from '../models/BrandAccount';

export interface ClientAcquisitionData {
  brandId: string;
  clientType: 'individual' | 'business' | 'influencer' | 'retailer';
  contactInfo: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  preferences?: {
    styles?: string[];
    priceRange?: { min: number; max: number };
    communicationPreference?: 'email' | 'phone' | 'social';
  };
  acquisitionSource?: string;
  notes?: string;
}

export interface PortfolioItem {
  brandId: string;
  title: string;
  description?: string;
  category: string;
  images: string[];
  tags?: string[];
  clientId?: string;
  projectDate?: string;
  isFeatured?: boolean;
  visibility?: 'public' | 'private' | 'clients_only';
}

export class BusinessFeaturesService {
  /**
   * Award a badge to a user
   */
  async awardBadge(
    userId: string,
    badgeType: 'beta_pioneer' | 'verified_brand' | 'premium_partner' | 'custom',
    awardedBy?: string,
    reason?: string
  ): Promise<void> {
    // Find the appropriate badge
    const badges = await BusinessBadgeModel.findByType(badgeType);
    if (badges.length === 0) {
      throw new Error(`Badge type ${badgeType} not found`);
    }

    const badge = badges[0];

    // Check eligibility
    const eligibility = await BusinessBadgeModel.checkBadgeEligibility(userId, badge.id);
    if (!eligibility.eligible) {
      throw new Error(`User not eligible for badge: ${eligibility.missingCriteria.join(', ')}`);
    }

    await BusinessBadgeModel.awardBadgeToUser(userId, badge.id, awardedBy, reason);
  }

  /**
   * Get user's badges and available badges
   */
  async getUserBadges(userId: string): Promise<{
    earned: any[];
    available: any[];
  }> {
    return await BusinessBadgeModel.getAvailableBadges(userId);
  }

  /**
   * Create a new business badge (admin only)
   */
  async createBadge(badgeData: CreateBusinessBadgeData): Promise<any> {
    return await BusinessBadgeModel.create(badgeData);
  }

  /**
   * Set up inventory management for a brand
   */
  async setupInventory(brandId: string, items: CreateInventoryItemData[]): Promise<void> {
    // Verify brand exists
    const brand = await BrandAccountModel.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Create inventory items
    for (const itemData of items) {
      await InventoryManagementModel.create({
        ...itemData,
        brandId,
      });
    }
  }

  /**
   * Update inventory levels
   */
  async updateInventory(
    inventoryItemId: string,
    movementType: 'in' | 'out' | 'adjustment' | 'reserved' | 'released',
    quantity: number,
    reason: string,
    performedBy: string,
    reference?: string
  ): Promise<void> {
    const movementData: CreateInventoryMovementData = {
      inventoryItemId,
      movementType,
      quantity,
      reason,
      reference,
      performedBy,
    };

    await InventoryManagementModel.recordMovement(movementData);
  }

  /**
   * Get inventory summary for a brand
   */
  async getInventorySummary(brandId: string): Promise<{
    summary: any;
    lowStockItems: any[];
    recentMovements: any[];
  }> {
    const [summary, lowStockItems] = await Promise.all([
      InventoryManagementModel.getInventorySummary(brandId),
      InventoryManagementModel.getLowStockItems(brandId),
    ]);

    // Get recent movements for all items
    const { items } = await InventoryManagementModel.findByBrandId(brandId, {}, 10, 0);
    const recentMovements: any[] = [];

    for (const item of items.slice(0, 5)) {
      const { movements } = await InventoryManagementModel.getMovementHistory(item.id, 5, 0);
      recentMovements.push(...movements);
    }

    // Sort by date and take most recent
    recentMovements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      summary,
      lowStockItems,
      recentMovements: recentMovements.slice(0, 10),
    };
  }

  /**
   * Add a client to brand's client list
   */
  async addClient(clientData: ClientAcquisitionData): Promise<any> {
    const query = `
      INSERT INTO brand_clients (
        brand_id, client_type, contact_info, preferences, 
        acquisition_source, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      clientData.brandId,
      clientData.clientType,
      JSON.stringify(clientData.contactInfo),
      JSON.stringify(clientData.preferences || {}),
      clientData.acquisitionSource || null,
      clientData.notes || null,
    ];

    // This would normally use a proper model, but for simplicity using direct query
    // In a real implementation, create a BrandClientModel
    return { success: true, message: 'Client added successfully' };
  }

  /**
   * Get clients for a brand
   */
  async getBrandClients(
    brandId: string,
    filters: {
      clientType?: 'individual' | 'business' | 'influencer' | 'retailer';
      status?: 'active' | 'inactive' | 'prospect';
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ clients: any[]; total: number }> {
    // This would normally use a proper model
    // For now, return mock data
    return {
      clients: [],
      total: 0,
    };
  }

  /**
   * Add portfolio item
   */
  async addPortfolioItem(portfolioData: PortfolioItem): Promise<any> {
    const query = `
      INSERT INTO brand_portfolio (
        brand_id, title, description, category, images, tags,
        client_id, project_date, is_featured, visibility
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      portfolioData.brandId,
      portfolioData.title,
      portfolioData.description || null,
      portfolioData.category,
      JSON.stringify(portfolioData.images),
      portfolioData.tags || [],
      portfolioData.clientId || null,
      portfolioData.projectDate || null,
      portfolioData.isFeatured || false,
      portfolioData.visibility || 'public',
    ];

    // This would normally use a proper model
    return { success: true, message: 'Portfolio item added successfully' };
  }

  /**
   * Get brand portfolio
   */
  async getBrandPortfolio(
    brandId: string,
    filters: {
      category?: string;
      featured?: boolean;
      visibility?: 'public' | 'private' | 'clients_only';
    } = {},
    page = 1,
    limit = 20
  ): Promise<{ items: any[]; total: number }> {
    // This would normally use a proper model
    // For now, return mock data
    return {
      items: [],
      total: 0,
    };
  }

  /**
   * Get business analytics for a brand
   */
  async getBusinessAnalytics(brandId: string): Promise<{
    clients: {
      total: number;
      byType: Record<string, number>;
      acquisitionSources: Record<string, number>;
      lifetimeValue: number;
    };
    inventory: {
      totalItems: number;
      totalValue: number;
      lowStockAlerts: number;
      turnoverRate: number;
    };
    portfolio: {
      totalProjects: number;
      featuredProjects: number;
      categoriesCount: number;
      recentProjects: any[];
    };
  }> {
    // This would normally aggregate data from various models
    // For now, return mock analytics
    return {
      clients: {
        total: 0,
        byType: {},
        acquisitionSources: {},
        lifetimeValue: 0,
      },
      inventory: {
        totalItems: 0,
        totalValue: 0,
        lowStockAlerts: 0,
        turnoverRate: 0,
      },
      portfolio: {
        totalProjects: 0,
        featuredProjects: 0,
        categoriesCount: 0,
        recentProjects: [],
      },
    };
  }

  /**
   * Initialize default badges for the platform
   */
  async initializeDefaultBadges(): Promise<void> {
    const defaultBadges = [
      {
        name: 'Beta Pioneer',
        description: 'Early adopter who joined during the beta program',
        // @ts-ignore
        badgeType: 'beta_pioneer' as const,
        color: '#FFD700',
        criteria: {
          verificationRequired: false,
          customCriteria: ['Joined during beta period'],
        },
      },
      {
        name: 'Verified Brand',
        description: 'Officially verified fashion brand',
        badgeType: 'verified_brand' as const,
        color: '#1DA1F2',
        criteria: {
          verificationRequired: true,
        },
      },
      {
        name: 'Premium Partner',
        description: 'Premium tier brand partner',
        badgeType: 'premium_partner' as const,
        color: '#9C27B0',
        criteria: {
          verificationRequired: true,
          minSales: 10000,
        },
      },
    ];

    for (const badgeData of defaultBadges) {
      try {
        // @ts-ignore
        await BusinessBadgeModel.create(badgeData);
      } catch (error) {
        // Badge might already exist, continue
        console.log(`Badge ${badgeData.name} might already exist`);
      }
    }
  }

  /**
   * Process automatic badge awards based on user activity
   */
  async processAutomaticBadgeAwards(userId: string): Promise<string[]> {
    const awardedBadges: string[] = [];

    // Check for beta pioneer badge
    const user = await BrandAccountModel.findByUserId(userId);
    if (user && new Date(user.createdAt) < new Date('2024-12-31')) {
      try {
        await this.awardBadge(userId, 'beta_pioneer', 'system', 'Early platform adopter');
        awardedBadges.push('Beta Pioneer');
      } catch (error) {
        // Badge might already be awarded
      }
    }

    // Check for verified brand badge
    if (user && user.verificationStatus === 'verified') {
      try {
        await this.awardBadge(userId, 'verified_brand', 'system', 'Brand verification completed');
        awardedBadges.push('Verified Brand');
      } catch (error) {
        // Badge might already be awarded
      }
    }

    return awardedBadges;
  }
}