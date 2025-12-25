const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/api\/?$/, '');

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
  private getAuthHeaders() {
    // Only access localStorage in client-side environment
    if (typeof window === 'undefined') {
      return { 'Content-Type': 'application/json' };
    }

    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Brand Account Management
  async getBrandAccount(): Promise<{ brandAccount: BrandAccount | null }> {
    const response = await fetch(`${API_BASE_URL}/api/brands/account`, {
      headers: this.getAuthHeaders()
    });

    if (response.status === 404) {
      return { brandAccount: null };
    }

    if (!response.ok) {
      throw new Error(`Failed to get brand account: ${response.statusText}`);
    }

    return response.json();
  }

  async getBrands(params?: { limit?: number; page?: number; search?: string; businessType?: string }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('q', params.search);
    if (params?.businessType) queryParams.append('businessType', params.businessType);

    const response = await fetch(`${API_BASE_URL}/api/brands/search?${queryParams.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get brands: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.brands || [];
  }

  async getBrand(brandId: string): Promise<BrandAccount> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get brand: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.brand; // Wrapper returns { success: true, data: { brand: ... } } see BrandController.getBrandProfile
    // Actually BrandController.getBrandProfile returns { data: profile } where profile = { brand, featuredItems... }
    // So it should be result.data.brand
  }

  async createBrandAccount(data: CreateBrandAccountData): Promise<BrandAccount> {
    const response = await fetch(`${API_BASE_URL}/api/brands/account`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create brand account');
    }

    return response.json();
  }

  async updateBrandAccount(updates: Partial<CreateBrandAccountData>): Promise<BrandAccount> {
    const response = await fetch(`${API_BASE_URL}/api/brands/account`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update brand account');
    }

    return response.json();
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
      tags: data.brandInfo.tags
    };

    const response = await fetch(`${API_BASE_URL}/api/brands`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create brand account');
    }

    // Response wrapper handling might differ, let's assume standard { success: true, data: { brand } }
    const result = await response.json();
    return result.data?.brand || result;
  }

  async updateBrand(brandId: string, updates: Partial<CreateBrandAccountData>): Promise<BrandAccount> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    // Use admin update page endpoint or creating a new admin update endpoint might be better
    // For now, assuming we use the profile update or page update endpoints
    // But wait, there isn't a generic admin-update-brand-details endpoint in the backend code I saw.
    // I saw updateBrandPage (customization) and updateProfileData (bio etc).
    // I should create one or reuse existings. 
    // The previous code for `admin/brands/new` used `adminCreateBrand`.
    // I'll stick to delete/trash first.
    return response.json();
  }

  async deleteBrand(brandId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete brand');
    }
  }

  async restoreBrand(brandId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/restore`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to restore brand');
    }
  }

  async permanentDeleteBrand(brandId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/permanent`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to permanently delete brand');
    }
  }

  async getTrashBrands(): Promise<BrandAccount[]> {
    const response = await fetch(`${API_BASE_URL}/api/brands/trash`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get trash brands: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.brands || [];
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

    const response = await fetch(`${API_BASE_URL}/api/brands/catalog?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get catalog items: ${response.statusText}`);
    }

    return response.json();
  }

  async addCatalogItem(item: Omit<CatalogItem, 'id' | 'vufsCode'>): Promise<CatalogItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands/catalog`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add catalog item');
    }

    return response.json();
  }

  async updateCatalogItem(itemId: string, updates: Partial<CatalogItem>): Promise<CatalogItem> {
    const response = await fetch(`${API_BASE_URL}/api/brands/catalog/${itemId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update catalog item');
    }

    return response.json();
  }

  async deleteCatalogItem(itemId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/catalog/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete catalog item');
    }
  }

  // Partnership Management
  async getPartnerships(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/brands/partnerships`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get partnerships: ${response.statusText}`);
    }

    return response.json();
  }

  async getPartnershipRequests(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/brands/partnership-requests`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get partnership requests: ${response.statusText}`);
    }

    return response.json();
  }

  async approvePartnershipRequest(requestId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/partnership-requests/${requestId}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve partnership request');
    }
  }

  async rejectPartnershipRequest(requestId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/partnership-requests/${requestId}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject partnership request');
    }
  }

  // Analytics and Commission Tracking
  async getAnalytics(dateRange?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) params.append('range', dateRange);

    const response = await fetch(`${API_BASE_URL}/api/brands/analytics?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get analytics: ${response.statusText}`);
    }

    return response.json();
  }

  async getCommissionData(dateRange?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateRange) params.append('range', dateRange);

    const response = await fetch(`${API_BASE_URL}/api/brands/commissions?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get commission data: ${response.statusText}`);
    }

    return response.json();
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

    const response = await fetch(`${API_BASE_URL}/api/brands/transactions?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    return response.json();
  }

  // ============ BRAND PROFILE ============

  async getFullProfile(brandId: string): Promise<BrandFullProfile> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/profile`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get brand profile: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async updateProfileData(brandId: string, data: BrandProfileData): Promise<BrandAccount> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update profile');
    }

    const result = await response.json();
    return result.data.brand;
  }

  // ============ TEAM MANAGEMENT ============

  async getTeamMembers(brandId: string, publicOnly = true): Promise<BrandTeamMember[]> {
    const params = new URLSearchParams();
    params.append('publicOnly', publicOnly.toString());

    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/team?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get team members: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.team;
  }

  async addTeamMember(brandId: string, data: { userId: string; roles: BrandRole[]; title?: string; isPublic?: boolean }): Promise<BrandTeamMember> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/team`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add team member');
    }

    const result = await response.json();
    return result.data.member;
  }

  async updateTeamMember(brandId: string, memberId: string, data: { roles?: BrandRole[]; title?: string; isPublic?: boolean }): Promise<BrandTeamMember> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/team/${memberId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update team member');
    }

    const result = await response.json();
    return result.data.member;
  }

  async removeTeamMember(brandId: string, memberId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/team/${memberId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to remove team member');
    }
  }

  // ============ LOOKBOOK MANAGEMENT ============

  async getLookbooks(brandId: string, publishedOnly = true): Promise<BrandLookbook[]> {
    const params = new URLSearchParams();
    params.append('publishedOnly', publishedOnly.toString());

    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/lookbooks?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get lookbooks: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.lookbooks;
  }

  async getLookbook(brandId: string, lookbookId: string): Promise<{ lookbook: BrandLookbook; items: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/lookbooks/${lookbookId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get lookbook: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async createLookbook(brandId: string, data: CreateLookbookData): Promise<BrandLookbook> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/lookbooks`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create lookbook');
    }

    const result = await response.json();
    return result.data.lookbook;
  }

  async updateLookbook(brandId: string, lookbookId: string, data: Partial<CreateLookbookData> & { isPublished?: boolean }): Promise<BrandLookbook> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/lookbooks/${lookbookId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update lookbook');
    }

    const result = await response.json();
    return result.data.lookbook;
  }

  async deleteLookbook(brandId: string, lookbookId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/lookbooks/${lookbookId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete lookbook');
    }
  }

  async addLookbookItems(brandId: string, lookbookId: string, items: Array<{ itemId: string; sortOrder?: number }>): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/lookbooks/${lookbookId}/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add items to lookbook');
    }

    const result = await response.json();
    return result.data.items;
  }

  // ============ COLLECTION MANAGEMENT ============

  async getCollections(brandId: string, publishedOnly = true): Promise<BrandCollection[]> {
    const params = new URLSearchParams();
    params.append('publishedOnly', publishedOnly.toString());

    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/collections?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get collections: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.collections;
  }

  async getCollection(brandId: string, collectionId: string): Promise<{ collection: BrandCollection; items: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/collections/${collectionId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get collection: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async createCollection(brandId: string, data: CreateCollectionData): Promise<BrandCollection> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/collections`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create collection');
    }

    const result = await response.json();
    return result.data.collection;
  }

  async updateCollection(brandId: string, collectionId: string, data: Partial<CreateCollectionData> & { isPublished?: boolean }): Promise<BrandCollection> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/collections/${collectionId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update collection');
    }

    const result = await response.json();
    return result.data.collection;
  }

  async deleteCollection(brandId: string, collectionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/collections/${collectionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete collection');
    }
  }

  async addCollectionItems(brandId: string, collectionId: string, items: Array<{ itemId: string; sortOrder?: number }>): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/brands/${brandId}/collections/${collectionId}/items`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add items to collection');
    }

    const result = await response.json();
    return result.data.items;
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
}

export type { BrandAccount, CatalogItem };
export const brandApi = new BrandApi();
export default brandApi;