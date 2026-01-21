import { apiClient } from './api';

interface BrandAccount {
  id: string;
  userId: string;
  brandInfo: {
    name: string;
    slug?: string;
    description?: string;
    website?: string;
    logo?: string;
    banner?: string;
    banners?: Array<{
      url: string;
      positionY?: number; // 0-100
    }>; // Array of banner objects
    socialLinks?: Array<{
      platform: string;
      url: string;
    }>;
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    brandColors?: string[];
    brandStyle?: string[];
    country?: string;
    tags?: string[];
    businessType?: 'brand' | 'store' | 'designer' | 'manufacturer' | 'non_profit';
    skuRef?: string;
  };
  profileData?: {
    bio?: string;
    foundedDate?: string;
    foundedDatePrecision?: 'year' | 'month' | 'day';
    foundedBy?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    additionalLogos?: string[];
    logoMetadata?: Array<{ url: string; name: string }>;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  partnershipTier: 'basic' | 'premium' | 'enterprise';
  badges: string[];
  analytics: {
    totalCatalogItems: number;
    totalSales: number;
    totalCommission: number;
    monthlyViews: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateBrandAccountData {
  userId?: string; // Optional for admin creation
  brandInfo: {
    name: string;
    slug?: string;
    description?: string;
    website?: string;
    logo?: string;
    banner?: string;
    banners?: string[];
    contactInfo?: {
      email?: string;
      phone?: string;
    };
    country?: string;
    tags?: string[];
    skuRef?: string;
  };
  businessType?: 'brand' | 'store' | 'designer' | 'manufacturer' | 'non_profit';
  partnershipTier?: 'basic' | 'premium' | 'enterprise';
}

interface CatalogItem {
  id: string;
  vufsCode: string;
  name: string;
  description: string;
  category: {
    page: string;
    blueSubcategory: string;
    whiteSubcategory: string;
    graySubcategory: string;
  };
  pricing: {
    retailPrice: number;
    salePrice?: number;
    currency: string;
  };
  availability: 'available' | 'out_of_stock' | 'discontinued';
  metadata: {
    materials: Array<{
      name: string;
      percentage: number;
    }>;
    colors: string[];
    sizes: string[];
    careInstructions: string[];
  };
  purchaseLink?: string;
}

class BrandApi {
  // Brand Account Management
  async getBrandAccount(): Promise<{ brandAccount: BrandAccount | null }> {
    try {
      const response = await apiClient.get<{ brandAccount: BrandAccount }>('/brands/account');
      return response;
    } catch (error: any) {
      if (error.status === 404) {
        return { brandAccount: null };
      }
      throw error;
    }
  }

  async getBrands(params?: { limit?: number; page?: number; search?: string; businessType?: string; country?: string; verificationStatus?: string; partnershipTier?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.search) query.append('q', params.search);
    if (params?.businessType) query.append('businessType', params.businessType);
    if (params?.country) query.append('country', params.country);
    if (params?.verificationStatus) query.append('verificationStatus', params.verificationStatus);
    if (params?.partnershipTier) query.append('partnershipTier', params.partnershipTier);

    const response = await apiClient.get<any>(`/brands/search?${query.toString()}`);
    return response.brands || [];
  }

  async getBrand(brandId: string): Promise<BrandAccount> {
    const result = await apiClient.get<any>(`/brands/${brandId}`);
    return result.brand;
  }

  async createBrandAccount(data: CreateBrandAccountData): Promise<BrandAccount> {
    return apiClient.post<BrandAccount>('/brands/account', data);
  }

  async updateBrandAccount(updates: Partial<CreateBrandAccountData>): Promise<BrandAccount> {
    return apiClient.put<BrandAccount>('/brands/account', updates);
  }

  // Admin Methods
  async adminCreateBrand(data: CreateBrandAccountData & { userId: string }): Promise<BrandAccount> {
    // Transform nested data to flat structure expected by backend
    const payload = {
      userId: data.userId,
      brandName: data.brandInfo.name,
      description: data.brandInfo.description,
      website: data.brandInfo.website,
      contactEmail: data.brandInfo.contactInfo?.email,
      contactPhone: data.brandInfo.contactInfo?.phone,
      businessType: data.businessType || 'brand',
      partnershipTier: data.partnershipTier || 'basic',
      country: data.brandInfo.country,
      tags: data.brandInfo.tags,
      skuRef: data.brandInfo.skuRef
    };

    const result = await apiClient.post<any>('/brands', payload);
    return result.brand || result;
  }

  async updateBrand(brandId: string, updates: Partial<CreateBrandAccountData>): Promise<BrandAccount> {
    const result = await apiClient.put<any>(`/brands/${brandId}`, updates);
    return result.brand || result;
  }

  async deleteBrand(brandId: string): Promise<void> {
    await apiClient.delete(`/brands/${brandId}`);
  }

  async restoreBrand(brandId: string): Promise<void> {
    await apiClient.put(`/brands/${brandId}/restore`, {});
  }

  async permanentDeleteBrand(brandId: string): Promise<void> {
    await apiClient.delete(`/brands/${brandId}/permanent`);
  }

  async getTrashBrands(): Promise<BrandAccount[]> {
    const response = await apiClient.get<any>('/brands/trash');
    return response.brands || [];
  }

  // Catalog Management
  async getCatalogItems(filters?: {
    search?: string;
    category?: string;
    availability?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CatalogItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.availability) params.append('availability', filters.availability);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return apiClient.get(`/brands/catalog?${params}`);
  }

  async getBrandCatalog(brandId: string, filters?: any): Promise<{ items: any[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.collection) params.append('collection', filters.collection);

    const result = await apiClient.get<any>(`/brands/${brandId}/catalog?${params}`);
    return result;
  }

  async addCatalogItem(item: Omit<CatalogItem, 'id' | 'vufsCode'>): Promise<CatalogItem> {
    return apiClient.post('/brands/catalog', item);
  }

  async updateCatalogItem(itemId: string, updates: Partial<CatalogItem>): Promise<CatalogItem> {
    return apiClient.put(`/brands/catalog/${itemId}`, updates);
  }

  async deleteCatalogItem(itemId: string): Promise<void> {
    await apiClient.delete(`/brands/catalog/${itemId}`);
  }

  // Partnership Management
  async getPartnerships(): Promise<any[]> {
    return apiClient.get('/brands/partnerships');
  }

  async getPartnershipRequests(): Promise<any[]> {
    return apiClient.get('/brands/partnership-requests');
  }

  async approvePartnershipRequest(requestId: string): Promise<void> {
    await apiClient.post(`/brands/partnership-requests/${requestId}/approve`, {});
  }

  async rejectPartnershipRequest(requestId: string): Promise<void> {
    await apiClient.post(`/brands/partnership-requests/${requestId}/reject`, {});
  }

  // Analytics and Commission Tracking
  async getAnalytics(dateRange?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) params.append('range', dateRange);

    return apiClient.get(`/brands/analytics?${params}`);
  }

  async getCommissionData(dateRange?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) params.append('range', dateRange);

    return apiClient.get(`/brands/commissions?${params}`);
  }

  async getTransactions(filters?: {
    status?: string;
    partnerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.partnerId) params.append('partnerId', filters.partnerId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return apiClient.get(`/brands/transactions?${params}`);
  }

  // ============ BRAND PROFILE ============

  async getBrandProfile(brandId: string): Promise<BrandFullProfile> {
    const response = await apiClient.get<BrandFullProfile>(`/brands/${brandId}/profile`);
    return response;
  }

  async getNationalities(): Promise<string[]> {
    const response = await apiClient.get<{ success: boolean, nationalities: string[] }>('/brands/nationalities');
    return response.nationalities || [];
  }

  async getBrandsLines(brandIds: string[]): Promise<any[]> {
    if (!brandIds.length) return [];
    const response = await apiClient.get<{ success: boolean, lines: any[] }>(`/brands/lines-bulk?ids=${brandIds.join(',')}`);
    return response.lines || [];
  }

  async getBrandsCollections(brandIds: string[]): Promise<any[]> {
    if (!brandIds.length) return [];
    const response = await apiClient.get<{ success: boolean, collections: any[] }>(`/brands/collections-bulk?ids=${brandIds.join(',')}`);
    return response.collections || [];
  }

  async updateProfileData(brandId: string, data: BrandProfileData): Promise<BrandAccount> {
    const result = await apiClient.put<any>(`/brands/${brandId}/profile`, data);
    return result.brand;
  }

  // ============ TEAM MANAGEMENT ============

  async getTeamMembers(brandId: string, publicOnly = true): Promise<BrandTeamMember[]> {
    const params = new URLSearchParams();
    params.append('publicOnly', publicOnly.toString());

    const result = await apiClient.get<any>(`/brands/${brandId}/team?${params}`);
    return result.team;
  }

  async addTeamMember(brandId: string, data: { userId: string; roles: BrandRole[]; title?: string; isPublic?: boolean }): Promise<BrandTeamMember> {
    const result = await apiClient.post<any>(`/brands/${brandId}/team`, data);
    return result.member;
  }

  async updateTeamMember(brandId: string, memberId: string, data: { roles?: BrandRole[]; title?: string; isPublic?: boolean }): Promise<BrandTeamMember> {
    const result = await apiClient.put<any>(`/brands/${brandId}/team/${memberId}`, data);
    return result.member;
  }

  async removeTeamMember(brandId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/brands/${brandId}/team/${memberId}`);
  }

  // ============ LOOKBOOK MANAGEMENT ============

  async getLookbooks(brandId: string, publishedOnly = true): Promise<BrandLookbook[]> {
    const params = new URLSearchParams();
    params.append('publishedOnly', publishedOnly.toString());

    const result = await apiClient.get<any>(`/brands/${brandId}/lookbooks?${params}`);
    return result.lookbooks;
  }

  async getLookbook(brandId: string, lookbookId: string): Promise<{ lookbook: BrandLookbook; items: any[] }> {
    const result = await apiClient.get<any>(`/brands/${brandId}/lookbooks/${lookbookId}`);
    return result;
  }

  async createLookbook(brandId: string, data: CreateLookbookData): Promise<BrandLookbook> {
    const result = await apiClient.post<any>(`/brands/${brandId}/lookbooks`, data);
    return result.lookbook;
  }

  async updateLookbook(brandId: string, lookbookId: string, data: Partial<CreateLookbookData> & { isPublished?: boolean }): Promise<BrandLookbook> {
    const result = await apiClient.put<any>(`/brands/${brandId}/lookbooks/${lookbookId}`, data);
    return result.lookbook;
  }

  async deleteLookbook(brandId: string, lookbookId: string): Promise<void> {
    await apiClient.delete(`/brands/${brandId}/lookbooks/${lookbookId}`);
  }

  async addLookbookItems(brandId: string, lookbookId: string, items: Array<{ itemId: string; sortOrder?: number }>): Promise<any[]> {
    const result = await apiClient.post<any>(`/brands/${brandId}/lookbooks/${lookbookId}/items`, { items });
    return result.items;
  }

  // ============ COLLECTION MANAGEMENT ============

  async getCollections(brandId: string, publishedOnly = true): Promise<BrandCollection[]> {
    const params = new URLSearchParams();
    params.append('publishedOnly', publishedOnly.toString());

    const result = await apiClient.get<any>(`/brands/${brandId}/collections?${params}`);
    return result.collections;
  }

  async getCollection(brandId: string, collectionId: string): Promise<{ collection: BrandCollection; items: any[] }> {
    const result = await apiClient.get<any>(`/brands/${brandId}/collections/${collectionId}`);
    return result;
  }

  async createCollection(brandId: string, data: CreateCollectionData): Promise<BrandCollection> {
    const result = await apiClient.post<any>(`/brands/${brandId}/collections`, data);
    return result.collection;
  }

  async updateCollection(brandId: string, collectionId: string, data: Partial<CreateCollectionData> & { isPublished?: boolean }): Promise<BrandCollection> {
    const result = await apiClient.put<any>(`/brands/${brandId}/collections/${collectionId}`, data);
    return result.collection;
  }

  async deleteCollection(brandId: string, collectionId: string): Promise<void> {
    await apiClient.delete(`/brands/${brandId}/collections/${collectionId}`);
  }

  async addCollectionItems(brandId: string, collectionId: string, items: Array<{ itemId: string; sortOrder?: number }>): Promise<any[]> {
    const result = await apiClient.post<any>(`/brands/${brandId}/collections/${collectionId}/items`, { items });
    return result.items;
  }

  // ============ VERIFICATION ============

  async verifyBrand(brandId: string, status: 'verified' | 'rejected', reason?: string): Promise<BrandAccount> {
    const result = await apiClient.put<any>(`/brands/${brandId}/verify`, { status, notes: reason });
    return result.brand || result;
  }

  // ============ SOCIAL / FOLLOWERS ============

  async followEntity(entityType: string, entityId: string, actingAs?: { type: string; id: string }): Promise<void> {
    await apiClient.post(`/entities/${entityType}/${entityId}/follow`, { actingAs });
  }

  async unfollowEntity(entityType: string, entityId: string, actingAs?: { type: string; id: string }): Promise<void> {
    await apiClient.delete(`/entities/${entityType}/${entityId}/follow`, { data: { actingAs } });
  }

  async getEntityFollowers(entityType: string, entityId: string, page = 1, limit = 20): Promise<{ followers: any[]; total: number; hasMore: boolean }> {
    const result = await apiClient.get<any>(`/entities/${entityType}/${entityId}/followers?page=${page}&limit=${limit}`);
    return result;
  }

  async getEntityFollowing(entityType: string, entityId: string, page = 1, limit = 20, targetType?: string): Promise<{ following: any[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (targetType) params.append('targetType', targetType);

    const result = await apiClient.get<any>(`/entities/${entityType}/${entityId}/following?${params}`);
    return result;
  }

  async checkEntityFollowStatus(entityType: string, entityId: string): Promise<{ isFollowing: boolean; isFollower: boolean }> {
    const result = await apiClient.get<any>(`/entities/${entityType}/${entityId}/follow-status`);
    return result;
  }
}

// ============ TYPE EXPORTS ============

export type BrandRole = 'CEO' | 'CFO' | 'Founder' | 'CD' | 'Marketing' | 'Seller' | 'Designer' | 'Model' | 'Ambassador' | 'Other';

export interface BrandProfileData {
  bio?: string;
  foundedDate?: string;
  foundedDatePrecision?: 'year' | 'month' | 'day';
  foundedBy?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  additionalLogos?: string[];
  logoMetadata?: Array<{ url: string; name: string }>;
  socialLinks?: Array<{ platform: string; url: string }>;
}

export interface BrandTeamMember {
  id: string;
  brandId: string;
  userId: string;
  roles: BrandRole[];
  title?: string;
  isPublic: boolean;
  joinedAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
    username?: string;
    verificationStatus?: 'verified' | 'rejected' | 'pending' | 'unverified';
  };
}

export interface BrandLookbook {
  id: string;
  brandId: string;
  collectionId?: string;
  name: string;
  slug?: string;
  description?: string;
  coverImageUrl?: string;
  images?: string[];
  season?: string;
  year?: number;
  isPublished: boolean;
  publishedAt?: string;
  itemCount?: number;
}

export interface CreateLookbookData {
  collectionId?: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  images?: string[];
  season?: string;
  year?: number;
}

export interface BrandCollection {
  id: string;
  brandId: string;
  name: string;
  slug?: string;
  description?: string;
  coverImageUrl?: string;
  collectionType?: 'Seasonal' | 'Capsule' | 'Collaboration' | 'Limited' | 'Core' | 'Other';
  season?: string;
  year?: number;
  isPublished: boolean;
  publishedAt?: string;
  itemCount?: number;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  coverImageUrl?: string;
  collectionType?: 'Seasonal' | 'Capsule' | 'Collaboration' | 'Limited' | 'Core' | 'Other';
  season?: string;
  year?: number;
}

export interface BrandFullProfile {
  brand: BrandAccount;
  team: BrandTeamMember[];
  lookbooks: BrandLookbook[];
  collections: BrandCollection[];
  followerCount: number;
  followingCount: number;
}

export type { BrandAccount, CatalogItem };
export const brandApi = new BrandApi();
export default brandApi;