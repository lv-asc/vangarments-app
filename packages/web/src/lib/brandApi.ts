const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface BrandAccount {
  id: string;
  userId: string;
  brandInfo: {
    name: string;
    description?: string;
    website?: string;
    logo?: string;
    banner?: string;
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
  brandInfo: {
    name: string;
    description?: string;
    website?: string;
    contactInfo?: {
      email?: string;
      phone?: string;
    };
  };
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
    const token = localStorage.getItem('token');
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
}

export const brandApi = new BrandApi();
export default brandApi;