// API Client for Vangarments Platform
// Handles authentication, error handling, and request/response interceptors

import Cookies from 'js-cookie';
import { performanceMonitor } from './performanceMonitoring';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  user?: any;
  token?: string;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp?: string;
    requestId?: string;
  };
}

class ApiErrorClass extends Error {
  public code: string;
  public details?: any;
  public status?: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

interface RequestInterceptor {
  (config: RequestInit): RequestInit | Promise<RequestInit>;
}

interface ResponseInterceptor {
  onFulfilled?: (response: Response) => Response | Promise<Response>;
  onRejected?: (error: any) => any;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    this.loadToken();
    this.setupDefaultInterceptors();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      // Try to get token from secure cookie first, then fallback to localStorage
      this.token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
    }
  }

  private saveToken(token: string, roles?: string[]): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      // Store in secure cookie (preferred) and localStorage (fallback)
      Cookies.set('auth_token', token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      // key-fix: Set user-role cookie for middleware if roles provided
      if (roles) {
        if (roles.includes('admin')) {
          Cookies.set('user-role', 'admin', {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });
        } else {
          Cookies.remove('user-role');
        }
      }

      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      Cookies.remove('auth_token');
      Cookies.remove('user-role');
      localStorage.removeItem('auth_token');
    }
  }

  private setupDefaultInterceptors(): void {
    // Request interceptor for adding auth headers
    this.addRequestInterceptor((config) => {
      const headers = new Headers(config.headers);

      if (this.token) {
        headers.set('Authorization', `Bearer ${this.token}`);
      }

      // Add default headers
      if (!headers.has('Content-Type') && config.body && typeof config.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }

      headers.set('X-Requested-With', 'XMLHttpRequest');

      return {
        ...config,
        headers,
      };
    });

    // Response interceptor for handling token refresh
    this.addResponseInterceptor({
      onRejected: async (error) => {
        const originalRequest = error.config;

        // Don't try to refresh token for login/register requests or if no token exists
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/register');

        if (error.status === 401 && !originalRequest?._retry && this.token && !isAuthEndpoint) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest?.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.request(originalRequest.url.replace(this.baseURL, ''), originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            if (originalRequest?.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.request(originalRequest.url.replace(this.baseURL, ''), originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.removeToken();
            // Redirect to login or emit auth error event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:token-expired'));
            }
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        throw error;
      },
    });
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token!);
      }
    });

    this.failedQueue = [];
  }

  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = performance.now();

    // Apply request interceptors
    let config: RequestInit = {
      cache: 'no-store', // Disable caching to prevent stale data
      ...options,
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        ...options.headers
      }
    };
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    try {
      let response = await fetch(url, config);
      const duration = performance.now() - startTime;

      // Record performance metric
      performanceMonitor.measureApiRequest(
        endpoint,
        config.method?.toUpperCase() || 'GET',
        duration,
        response.status
      );

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onFulfilled) {
          response = await interceptor.onFulfilled(response);
        }
      }

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorData = typeof data === 'object' && data.error ? data.error : data;
        const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || `HTTP ${response.status}: ${response.statusText}`);

        const apiError = new ApiErrorClass(
          errorMessage,
          typeof errorData === 'object' ? errorData.code || 'HTTP_ERROR' : 'HTTP_ERROR',
          typeof errorData === 'object' ? errorData.details : undefined,
          response.status
        );

        // Store original request config for retry logic
        (apiError as any).config = { ...config, url };

        // Apply response error interceptors
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onRejected) {
            try {
              return await interceptor.onRejected(apiError);
            } catch (interceptorError) {
              throw interceptorError;
            }
          }
        }

        throw apiError;
      }

      return data;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Record failed request performance
      performanceMonitor.measureApiRequest(
        endpoint,
        config.method?.toUpperCase() || 'GET',
        duration,
        0 // Network error
      );

      if (error instanceof ApiErrorClass) {
        throw error;
      }

      // Handle network errors
      const networkError = new ApiErrorClass(
        error instanceof Error ? error.message : 'Network error occurred',
        'NETWORK_ERROR',
        undefined,
        0
      );

      // Apply response error interceptors for network errors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          try {
            return await interceptor.onRejected(networkError);
          } catch (interceptorError) {
            throw interceptorError;
          }
        }
      }

      throw networkError;
    }
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<{
    user: any;
    token: string;
  }> {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Backend returns { message, user, token } directly
    if (!response.token) {
      throw new ApiErrorClass('No token received from server', 'AUTH_ERROR');
    }
    this.saveToken(response.token, response.user.roles);
    return { user: response.user, token: response.token };
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    genderOther?: string;
    bodyType?: 'male' | 'female';
    telephone: string;
  }): Promise<{
    user: any;
    token: string;
  }> {
    // Format CPF for backend validation
    const formattedCPF = this.formatCPF(userData.cpf);

    const requestData = {
      ...userData,
      cpf: formattedCPF,
      birthDate: userData.birthDate || new Date().toISOString(),
      gender: userData.gender || 'prefer-not-to-say',
    };

    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    // Backend returns { message, user, token } directly
    if (!response.token) {
      throw new ApiErrorClass('No token received from server', 'AUTH_ERROR');
    }
    this.saveToken(response.token, response.user.roles);
    return { user: response.user, token: response.token };
  }

  async logout(): Promise<void> {
    try {
      // Backend doesn't have logout endpoint yet, just remove token
      this.removeToken();
    } catch (error) {
      // Always remove token even if logout request fails
      this.removeToken();
    }
  }

  async getCurrentUser(): Promise<any> {
    const response = await this.request<any>('/auth/profile');
    return response.user;
  }

  async refreshToken(): Promise<string> {
    const response = await this.request<any>('/auth/refresh', {
      method: 'POST',
    });

    if (!response.token) {
      throw new ApiErrorClass('No token received from server', 'AUTH_ERROR');
    }
    this.saveToken(response.token);
    return response.token;
  }

  // CPF formatting helper
  private formatCPF(cpf: string): string {
    // Remove all non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');

    // Add formatting if not already formatted
    if (cleanCPF.length === 11) {
      return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return cpf; // Return as-is if already formatted or invalid length
  }

  // CPF validation helper (public static method)
  public static validateCPF(cpf: string): boolean {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '');

    // Check if it has 11 digits
    if (cleanCPF.length !== 11) return false;

    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    // Validate CPF algorithm
    let sum = 0;
    let remainder;

    // Validate first digit
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    // Validate second digit
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<{ profile: any }> {
    const response = await this.request<any>(`/users/${userId}/profile`);
    return response as any;
  }

  async getMyMemberships(): Promise<{
    memberships: Array<{
      brandId: string;
      brandName: string;
      brandSlug?: string;
      brandLogo?: string;
      businessType: string;
      roles: string[];
      title?: string;
      isOwner: boolean;
      followersCount: number;
    }>;
  }> {
    const response = await this.request<any>('/users/my-memberships');
    return response as any;
  }

  async getFollowRelationship(userId: string): Promise<{ isFollowing: boolean, status?: 'pending' | 'accepted' }> {
    const response = await this.request<any>(`/social/users/${userId}/follow-status`);
    return response.data;
  }

  async getFollowers(userId: string, page = 1, limit = 20, q?: string): Promise<{ users: any[]; hasMore: boolean }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (q) params.append('q', q);
    const response = await this.request<any>(`/social/users/${userId}/followers?${params.toString()}`);
    return response.data;
  }

  async getFollowing(userId: string, page = 1, limit = 20, q?: string): Promise<{ users: any[]; hasMore: boolean }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (q) params.append('q', q);
    const response = await this.request<any>(`/social/users/${userId}/following?${params.toString()}`);
    return response.data;
  }

  async getFollowingEntities(userId: string, entityType?: string, page = 1, limit = 50, q?: string): Promise<{ entities: any[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (entityType) params.append('entityType', entityType);
    if (q) params.append('q', q);
    const response = await this.request<any>(`/social/users/${userId}/following-entities?${params.toString()}`);
    return response.data;
  }

  async getPublicProfile(username: string): Promise<{ profile: any }> {
    const response = await this.request<any>(`/users/u/${username}`);
    return response as any;
  }

  async checkUsernameAvailability(username: string): Promise<{ available: boolean; error?: string }> {
    const response = await this.request<any>(`/users/check-username/${encodeURIComponent(username)}`);
    return response as any;
  }

  async lookupCEP(cep: string): Promise<{ data: any }> {
    const response = await this.request<any>(`/users/lookup-cep/${encodeURIComponent(cep)}`);
    return response as any;
  }

  async updateProfile(profileData: {
    name?: string;
    username?: string;
    location?: any;
    measurements?: any;
    preferences?: any;
    bio?: string;
    socialLinks?: any[];
    roles?: string[];
  }): Promise<any> {
    const response = await this.request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data || response.user;
  }

  async searchUsers(query: string, limit = 5): Promise<any[]> {
    const response = await this.request<any>(`/users?search=${encodeURIComponent(query)}&limit=${limit}`);
    return (response as any).users || response.data || [];
  }

  async getUsers(): Promise<any[]> {
    const response = await this.request<any>('/admin/users');
    return (response as any).users || response.data || response;
  }

  async deleteUser(userId: string, force?: boolean): Promise<void> {
    const query = force ? '?force=true' : '';
    await this.request(`/users/${userId}${query}`, {
      method: 'DELETE',
    });
  }

  async restoreUser(userId: string): Promise<void> {
    await this.request(`/users/${userId}/restore`, {
      method: 'POST',
    });
  }

  async adminCreateUser(userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    roles?: string[];
    birthDate?: string;
    gender?: string;
    cpf?: string;
  }): Promise<any> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    // Use the request method to handle interceptors
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${this.baseURL}/users/avatar`;
    console.log('[API] uploadAvatar calling:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('[API] uploadAvatar response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('[API] uploadAvatar failed data:', data);
      const errorData = data.error || data;
      throw new ApiErrorClass(
        errorData.message || 'Avatar upload failed',
        errorData.code || 'UPLOAD_ERROR',
        errorData.details,
        response.status
      );
    }

    return data.data || data;
  }

  async uploadBanner(file: File): Promise<{ bannerUrl: string }> {
    const formData = new FormData();
    formData.append('banner', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${this.baseURL}/users/banner`;
    console.log('[API] uploadBanner calling:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('[API] uploadBanner response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('[API] uploadBanner failed data:', data);
      const errorData = data.error || data;
      throw new ApiErrorClass(
        errorData.message || 'Banner upload failed',
        errorData.code || 'UPLOAD_ERROR',
        errorData.details,
        response.status
      );
    }

    return data.data || data;
  }

  async updateProfileImages(profileImages: string[]): Promise<{ profileImages: string[]; avatarUrl: string }> {
    const response = await this.request<any>('/users/profile-images', {
      method: 'PUT',
      body: JSON.stringify({ profileImages }),
    });
    return response.data || response;
  }

  async updateBannerImages(bannerImages: string[]): Promise<{ bannerImages: string[]; bannerUrl: string }> {
    const response = await this.request<any>('/users/banner-images', {
      method: 'PUT',
      body: JSON.stringify({ bannerImages }),
    });
    return response.data || response;
  }

  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/storage/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiErrorClass(data.message || 'File upload failed');
    }

    return data.data || data;
  }

  // Wardrobe Methods
  async getWardrobeItems(filters?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/wardrobe/items${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<any>(endpoint);
    return response as any; // Cast to any to bypass ApiResponse type definition mismatch
  }

  async getWardrobeItem(itemId: string): Promise<{ item: any }> {
    const response = await this.request<any>(`/wardrobe/items/${itemId}`);
    return response.data;
  }


  async analyzeImage(file: File): Promise<{ analysis: any }> {
    const formData = new FormData();
    formData.append('image', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/wardrobe/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiErrorClass(data.message || 'Analysis failed');
    }

    return data;
  }

  async createWardrobeItemMultipart(formData: FormData): Promise<any> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/wardrobe/items`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Parse error details if available
      const errorData = data.error || data;
      throw new ApiErrorClass(
        errorData.message || 'Failed to create item',
        errorData.code || 'CREATE_ERROR',
        errorData.details,
        response.status
      );
    }

    return data.data || data.item;
  }

  async createWardrobeItem(itemData: any): Promise<any> {
    const response = await this.request<any>('/wardrobe/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    return response.data;
  }

  async updateWardrobeItem(itemId: string, itemData: any): Promise<any> {
    const response = await this.request<any>(`/wardrobe/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
    return response.data;
  }

  async deleteWardrobeItem(itemId: string): Promise<void> {
    await this.request(`/wardrobe/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Trash/Soft-delete Methods
  async getTrashItems(): Promise<{
    items: any[];
    total: number;
  }> {
    const response = await this.request<any>('/wardrobe/trash');
    return response as any;
  }

  async restoreWardrobeItem(itemId: string): Promise<void> {
    await this.request(`/wardrobe/trash/${itemId}/restore`, {
      method: 'POST',
    });
  }

  async permanentDeleteWardrobeItem(itemId: string): Promise<void> {
    await this.request(`/wardrobe/trash/${itemId}`, {
      method: 'DELETE',
    });
  }

  async uploadItemImage(itemId: string, file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/wardrobe/items/${itemId}/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiErrorClass(data.message || 'Image upload failed');
    }

    return data.data;
  }

  // Marketplace Methods
  async getMarketplaceItems(filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    brand?: string;
    size?: string;
    color?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    listings: any[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/marketplace/items?${params.toString()}`;
    const response = await this.request<any>(endpoint);
    return response as any;
  }

  async addVUFSCategory(data: { name: string; level: string; parentId?: string }) {
    return this.request('/vufs-management/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteVUFSCategory(id: string) {
    return this.request(`/vufs-management/categories/${id}`, { method: 'DELETE' });
  }

  async updateVUFSCategory(id: string, updates: string | { name?: string; parentId?: string | null }) {
    // Backward compatibility for existing calls passing just a string
    const body = typeof updates === 'string' ? { name: updates } : updates;
    return this.request(`/vufs-management/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  async getVUFSCategories() {
    const response = await this.request<any>('/vufs-management/categories');
    return (response as any).categories || response.data || response;
  }

  async getDeletedVUFSCategories() {
    const response = await this.request<any>('/vufs-management/categories/trash');
    return (response as any).categories || response.data || response;
  }

  async restoreVUFSCategory(id: string) {
    return this.request(`/vufs-management/categories/${id}/restore`, { method: 'POST' });
  }

  async permanentlyDeleteVUFSCategory(id: string) {
    return this.request(`/vufs-management/categories/${id}/permanent`, { method: 'DELETE' });
  }

  // --- BRANDS ---

  async getVUFSBrands() {
    const response = await this.request<any>('/vufs-management/brands');
    return (response as any).brands || response.data || response;
  }
  async addVUFSBrand(name: string, type: string = 'brand', parentId?: string) {
    return this.request('/vufs-management/brands', { method: 'POST', body: JSON.stringify({ name, type, parentId }) });
  }
  async deleteVUFSBrand(id: string) { return this.request(`/vufs-management/brands/${id}`, { method: 'DELETE' }); }
  async updateVUFSBrand(id: string, name: string) { return this.request(`/vufs-management/brands/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }

  // --- COLORS ---

  // --- STANDARDS ---
  async getVUFSStandards() {
    const response = await this.request<any>('/vufs-management/standards');
    return (response as any).standards || response.data || response;
  }
  async addVUFSStandard(data: { name: string, label: string, region?: string, category?: string, approach?: string, description?: string }) {
    return this.request('/vufs-management/standards', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateVUFSStandard(id: string, data: { name: string, label: string, region?: string, category?: string, approach?: string, description?: string }) {
    return this.request(`/vufs-management/standards/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
  async deleteVUFSStandard(id: string) {
    return this.request(`/vufs-management/standards/${id}`, { method: 'DELETE' });
  }
  async getVUFSColors() {
    const response = await this.request<any>('/vufs-management/colors');
    return (response as any).colors || response.data || response;
  }
  async addVUFSColor(name: string, hex: string = '#000000') {
    return this.request('/vufs-management/colors', { method: 'POST', body: JSON.stringify({ name, hex }) });
  }
  async deleteVUFSColor(id: string) { return this.request(`/vufs-management/colors/${id}`, { method: 'DELETE' }); }
  async updateVUFSColor(id: string, name: string) { return this.request(`/vufs-management/colors/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }

  // --- MATERIALS ---
  async getVUFSMaterials() {
    const response = await this.request<any>('/vufs-management/materials');
    return (response as any).materials || response.data || response;
  }
  async addVUFSMaterial(name: string, category: string = 'natural') {
    return this.request('/vufs-management/materials', { method: 'POST', body: JSON.stringify({ name, category }) });
  }
  async deleteVUFSMaterial(id: string) { return this.request(`/vufs-management/materials/${id}`, { method: 'DELETE' }); }
  async updateVUFSMaterial(id: string, name: string) { return this.request(`/vufs-management/materials/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }

  // --- PATTERNS ---
  async getVUFSPatterns() {
    const response = await this.request<any>('/vufs-management/patterns');
    return (response as any).patterns || response.data || response;
  }
  async addVUFSPattern(name: string) {
    return this.request('/vufs-management/patterns', { method: 'POST', body: JSON.stringify({ name }) });
  }
  async deleteVUFSPattern(id: string) { return this.request(`/vufs-management/patterns/${id}`, { method: 'DELETE' }); }
  async updateVUFSPattern(id: string, name: string) { return this.request(`/vufs-management/patterns/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }

  // --- FITS ---
  async getVUFSFits() {
    const response = await this.request<any>('/vufs-management/fits');
    return (response as any).fits || response.data || response;
  }
  async addVUFSFit(name: string) {
    return this.request('/vufs-management/fits', { method: 'POST', body: JSON.stringify({ name }) });
  }
  async deleteVUFSFit(id: string) { return this.request(`/vufs-management/fits/${id}`, { method: 'DELETE' }); }
  async updateVUFSFit(id: string, name: string) { return this.request(`/vufs-management/fits/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }

  // --- GENDERS ---
  async getVUFSGenders() {
    const response = await this.request<any>('/vufs-management/genders');
    return (response as any).genders || response.data || response;
  }
  async addVUFSGender(name: string) {
    return this.request('/vufs-management/genders', { method: 'POST', body: JSON.stringify({ name }) });
  }
  async deleteVUFSGender(id: string) { return this.request(`/vufs-management/genders/${id}`, { method: 'DELETE' }); }
  async updateVUFSGender(id: string, name: string) { return this.request(`/vufs-management/genders/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }


  // --- EXTENDED COLORS (Admin Page) ---
  async getAllColors() { const res = await this.request<any[]>('/colors'); return res as any as any[]; }
  async createColor(data: { name: string; hexCode?: string; groupIds?: string[] }) {
    return this.request('/colors', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateColor(id: string, data: { name?: string; hexCode?: string; groupIds?: string[] }) {
    return this.request(`/colors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteColor(id: string) { return this.request(`/colors/${id}`, { method: 'DELETE' }); }

  async getColorGroups() { const res = await this.request<any[]>('/colors/groups/all'); return res as any as any[]; }
  async createColorGroup(name: string, representativeColor?: string) {
    return this.request('/colors/groups', { method: 'POST', body: JSON.stringify({ name, representativeColor }) });
  }
  async updateColorGroup(id: string, name: string, representativeColor?: string, colorIds?: string[]) {
    return this.request(`/colors/groups/${id}`, { method: 'PUT', body: JSON.stringify({ name, representativeColor, colorIds }) });
  }
  async deleteColorGroup(id: string) { return this.request(`/colors/groups/${id}`, { method: 'DELETE' }); }

  // --- MEDIA LABELS (Admin Page) ---
  async getAllMediaLabels() { const res = await this.request<any[]>('/media-labels'); return res as any as any[]; }
  async createMediaLabel(data: { name: string; groupIds?: string[] }) {
    return this.request('/media-labels', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateMediaLabel(id: string, data: { name?: string; groupIds?: string[] }) {
    return this.request(`/media-labels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteMediaLabel(id: string) { return this.request(`/media-labels/${id}`, { method: 'DELETE' }); }

  async getMediaLabelGroups() { const res = await this.request<any[]>('/media-labels/groups/all'); return res as any as any[]; }
  async createMediaLabelGroup(name: string, representativeColor?: string) {
    return this.request('/media-labels/groups', { method: 'POST', body: JSON.stringify({ name, representativeColor }) });
  }
  async updateMediaLabelGroup(id: string, name: string, representativeColor?: string, labelIds?: string[]) {
    return this.request(`/media-labels/groups/${id}`, { method: 'PUT', body: JSON.stringify({ name, representativeColor, labelIds }) });
  }
  async deleteMediaLabelGroup(id: string) { return this.request(`/media-labels/groups/${id}`, { method: 'DELETE' }); }

  // --- CONDITIONS (Admin Page) ---
  async getAllConditions() { const res = await this.request<any[]>('/conditions'); return res as any as any[]; }
  async createCondition(data: { name: string; rating: number; group: 'new' | 'used' }) {
    return this.request('/conditions', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateCondition(id: string, data: { name?: string; rating?: number; group?: 'new' | 'used' }) {
    return this.request(`/conditions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteCondition(id: string) { return this.request(`/conditions/${id}`, { method: 'DELETE' }); }


  // --- EXTENDED SIZES (Admin Page) ---
  async getAllSizes() { const res = await this.request<any[]>('/sizes'); return res as any as any[]; }
  async createSize(data: { name: string; sortOrder?: number; conversions?: any[]; validCategoryIds?: number[] }) {
    return this.request('/sizes', { method: 'POST', body: JSON.stringify(data) });
  }
  async updateSize(id: string, data: { name?: string; sortOrder?: number; conversions?: any[]; validCategoryIds?: number[] }) {
    return this.request(`/sizes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async reorderSizes(orders: { id: string; sortOrder: number }[]) {
    return this.request('/sizes/reorder', { method: 'PUT', body: JSON.stringify({ orders }) });
  }
  async deleteSize(id: string) { return this.request(`/sizes/${id}`, { method: 'DELETE' }); }

  // --- SKU Global Management ---
  async getAllSKUs(params: { page?: number; limit?: number; search?: string; brandId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.brandId) query.append('brandId', params.brandId);

    const response = await this.request<any>(`/skus?${query.toString()}`);
    return response as any;
  }
  // --- SIZES ---
  async getVUFSSizes() {
    const response = await this.request<any>('/vufs-management/sizes');
    return (response as any).sizes || response.data || response;
  }
  async addVUFSSize(name: string) {
    return this.request('/vufs-management/sizes', { method: 'POST', body: JSON.stringify({ name }) });
  }
  async deleteVUFSSize(id: string) { return this.request(`/vufs-management/sizes/${id}`, { method: 'DELETE' }); }
  async updateVUFSSize(id: string, name: string) { return this.request(`/vufs-management/sizes/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }

  async bulkAddVUFSItems(type: string, items: string[], attributeSlug?: string) {
    return this.request('/vufs-management/bulk', {
      method: 'POST',
      body: JSON.stringify({ type, items, attributeSlug })
    });
  }

  // --- DYNAMIC ATTRIBUTES ---
  async getVUFSAttributeTypes() {
    const response = await this.request<any>('/vufs-management/attributes');
    return (response as any).types || response.data || response;
  }
  async addVUFSAttributeType(slug: string, name: string) {
    return this.request('/vufs-management/attributes', { method: 'POST', body: JSON.stringify({ slug, name }) });
  }
  async updateVUFSAttributeType(slug: string, name: string) {
    return this.request(`/vufs-management/attributes/${slug}`, { method: 'PATCH', body: JSON.stringify({ name }) });
  }
  async deleteVUFSAttributeType(slug: string) { return this.request(`/vufs-management/attributes/${slug}`, { method: 'DELETE' }); }

  async getVUFSAttributeValues(typeSlug: string) {
    const response = await this.request<any>(`/vufs-management/attributes/${typeSlug}/values`);
    return (response as any).values || response.data || response;
  }
  async addVUFSAttributeValue(typeSlug: string, name: string, parentId?: string) {
    return this.request(`/vufs-management/attributes/${typeSlug}/values`, { method: 'POST', body: JSON.stringify({ name, parentId }) });
  }
  async updateVUFSAttributeValue(id: string, updates: { name?: string; parentId?: string | null }) {
    return this.request(`/vufs-management/attributes/values/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }
  async deleteVUFSAttributeValue(id: string) { return this.request(`/vufs-management/attributes/values/${id}`, { method: 'DELETE' }); }
  async reorderVUFSAttributeValues(orders: { id: string; sortOrder: number }[]) {
    return this.request('/vufs-management/attributes/values/reorder', { method: 'PUT', body: JSON.stringify({ orders }) });
  }
  async changeVUFSAttributeHierarchy(id: string, targetLevel: string, newParentId?: string | null) {
    return this.request(`/vufs-management/attributes/values/${id}/hierarchy`, {
      method: 'PUT',
      body: JSON.stringify({ targetLevel, newParentId })
    });
  }
  async getVUFSAttributeValueDescendants(id: string) {
    const response = await this.request<any>(`/vufs-management/attributes/values/${id}/descendants`);
    return (response as any).descendants || [];
  }

  // --- MATRIX VIEW ---

  async getAllCategoryAttributes() {
    return this.request('/vufs-management/matrix').then((res: any) => (res as any).attributes || res.data || res);
  }

  async setCategoryAttribute(categoryId: string | number, attributeSlug: string, value: string) {
    return this.request('/vufs-management/matrix', {
      method: 'POST',
      body: JSON.stringify({ categoryId, attributeSlug, value })
    });
  }

  async getAllBrandAttributes() {
    return this.request('/vufs-management/matrix/brands').then((res: any) => (res as any).attributes || res.data || res);
  }

  async setBrandAttribute(brandId: string, attributeSlug: string, value: string) {
    return this.request(`/vufs-management/matrix/brands`, {
      method: 'POST',
      body: JSON.stringify({ brandId, attributeSlug, value })
    });
  }

  async getAllSizeAttributes() {
    return this.request(`/vufs-management/matrix/sizes`).then((res: any) => (res as any).attributes || res.data || res);
  }

  async setSizeAttribute(sizeId: string, attributeSlug: string, value: string) {
    return this.request(`/vufs-management/matrix/sizes`, {
      method: 'POST',
      body: JSON.stringify({ sizeId, attributeSlug, value })
    });
  }

  async copyMatrixValueToSimilar(sourceType: 'category' | 'brand', sourceId: string, attrSlug: string) {
    return this.request('/vufs-management/matrix/copy-to-similar', {
      method: 'POST',
      body: JSON.stringify({ sourceType, sourceId, attrSlug })
    });
  }

  // --- GLOBAL SETTINGS ---
  async getVUFSSettings() {
    return this.request<Record<string, any>>('/vufs-management/settings');
  }
  async updateVUFSSettings(key: string, value: any) {
    return this.request('/vufs-management/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    });
  }

  async createMarketplaceListing(listingData: any): Promise<any> {
    const response = await this.request<any>('/marketplace/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
    return response;
  }
  async getMarketplaceListing(id: string): Promise<any> {
    const response = await this.request<any>(`/marketplace/listings/${id}`);
    return response;
  }

  async updateMarketplaceListing(id: string, updateData: any): Promise<any> {
    const response = await this.request<any>(`/marketplace/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response;
  }

  async deleteMarketplaceListing(id: string): Promise<any> {
    const response = await this.request<any>(`/marketplace/listings/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  async getUserMarketplaceListings(status?: string): Promise<any> {
    const params = status ? `?status=${status}` : '';
    const response = await this.request<any>(`/marketplace/listings/my${params}`);
    return response;
  }

  async toggleMarketplaceLike(listingId: string): Promise<any> {
    const response = await this.request<any>(`/marketplace/listings/${listingId}/like`, {
      method: 'POST',
    });
    return response;
  }

  async getMarketplaceStats(): Promise<any> {
    const response = await this.request<any>('/marketplace/stats');
    return response;
  }

  async getMarketplaceCategories(): Promise<any> {
    const response = await this.request<any>('/marketplace/categories');
    return response;
  }

  async searchMarketplace(filters: any): Promise<any> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<any>(`/marketplace/discovery/search?${params.toString()}`);
    return response;
  }

  async getMarketplaceTrending(category?: string, timeframe?: string, limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (timeframe) params.append('timeframe', timeframe);
    if (limit) params.append('limit', limit.toString());

    const response = await this.request<any>(`/marketplace/trending?${params.toString()}`);
    return response;
  }

  async getMarketplaceSimilar(itemId: string, limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await this.request<any>(`/marketplace/similar/${itemId}?${params.toString()}`);
    return response;
  }

  async getMarketplaceRecommendations(limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());

    const response = await this.request<any>(`/marketplace/feed?${params.toString()}`);
    return response;
  }

  // Social Methods
  async getSocialFeed(params?: { feedType?: string; page?: number; limit?: number }): Promise<{
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.feedType) searchParams.set('feedType', params.feedType);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await this.request<any>(`/social/feed?${searchParams.toString()}`);
    return response.data;
  }

  async createPost(postData: any): Promise<any> {
    const response = await this.request<any>('/social/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return response.data;
  }

  async togglePostLike(postId: string, like: boolean): Promise<void> {
    await this.request(`/social/posts/${postId}/like`, {
      method: like ? 'POST' : 'DELETE',
    });
  }

  async likePost(postId: string): Promise<void> {
    await this.request(`/social/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async followUser(userId: string): Promise<any> {
    return this.request<any>(`/social/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<any> {
    return this.request<any>(`/social/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  // --- SKU MANAGEMENT ---
  async createSKU(brandId: string, skuData: any) {
    console.log('[ApiClient] createSKU calling URL:', `/skus/brands/${brandId}/skus`, 'with data:', skuData);
    const response = await this.request<any>(`/skus/brands/${brandId}/skus`, {
      method: 'POST',
      body: JSON.stringify(skuData)
    });
    return (response as any).data || response;
  }

  async getBrandSKUs(brandId: string) {
    const response = await this.request<any>(`/skus/brands/${brandId}/skus`);
    return (response as any).data || response;
  }

  async searchSKUs(term: string, brandId?: string) {
    const params = new URLSearchParams();
    if (term) params.append('term', term);
    if (brandId) params.append('brandId', brandId);

    const response = await this.request<any>(`/skus/search?${params.toString()}`);
    return (response as any).data || response || { skus: [] };
  }

  async getSKU(id: string) {
    const response = await this.request<any>(`/skus/skus/${id}`);
    return (response as any).data || response;
  }

  async updateSKU(id: string, updateData: any) {
    const response = await this.request<any>(`/skus/skus/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    return (response as any).data || response;
  }

  async deleteSKU(id: string) {
    const response = await this.request<any>(`/skus/skus/${id}`, {
      method: 'DELETE'
    });
    return (response as any).data || response;
  }

  async getDeletedSKUs(params?: { search?: string; brandId?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.brandId) searchParams.append('brandId', params.brandId);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await this.request<any>(`/skus/trash?${searchParams.toString()}`);
    return (response as any).data || response;
  }

  async restoreSKU(id: string) {
    const response = await this.request<any>(`/skus/skus/${id}/restore`, {
      method: 'POST'
    });
    return (response as any).data || response;
  }

  async permanentDeleteSKU(id: string) {
    const response = await this.request<any>(`/skus/skus/${id}/permanent`, {
      method: 'DELETE'
    });
    return (response as any).data || response;
  }

  // --- BRAND LINE MANAGEMENT ---
  async createBrandLine(brandId: string, data: { name: string; logo?: string; description?: string; collabBrandId?: string | null; designerId?: string | null; tags?: string[] }) {
    const response = await this.request<any>(`/brands/${brandId}/lines`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return (response as any).data || response;
  }

  async getBrandLines(brandId: string) {
    const response = await this.request<any>(`/brands/${brandId}/lines`);
    return (response as any).data || response;
  }

  async updateBrandLine(id: string, data: { name?: string; logo?: string; description?: string; collabBrandId?: string | null; designerId?: string | null; tags?: string[] }) {
    const response = await this.request<any>(`/brands/lines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return (response as any).data || response;
  }

  async deleteBrandLine(id: string) {
    const response = await this.request<any>(`/brands/lines/${id}`, {
      method: 'DELETE'
    });
    return (response as any).data || response;
  }

  async getBrandCollections(brandId: string) {
    const response = await this.request<any>(`/brands/${brandId}/collections?publishedOnly=false`);
    return (response as any).data || response;
  }

  async createBrandCollection(brandId: string, data: any) {
    const response = await this.request<any>(`/brands/${brandId}/collections`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return (response as any).data || response;
  }

  async updateBrandCollection(brandId: string, collectionId: string, data: any) {
    const response = await this.request<any>(`/brands/${brandId}/collections/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return (response as any).data || response;
  }

  async deleteBrandCollection(brandId: string, collectionId: string) {
    const response = await this.request<any>(`/brands/${brandId}/collections/${collectionId}`, {
      method: 'DELETE'
    });
    return (response as any).data || response;
  }

  async bulkUpdateBrands(brandIds: string[], updates: { tagsToAdd?: string[]; country?: string }) {
    const response = await this.request<any>('/brands/bulk', {
      method: 'PUT',
      body: JSON.stringify({ brandIds, updates })
    });
    return (response as any).data || response;
  }

  async bulkDeleteBrands(brandIds: string[]) {
    const response = await this.request<any>('/brands/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ brandIds })
    });
    return (response as any).data || response;
  }

  // Utility Methods
  get isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.request<{ status: string; timestamp: string }>('/health');
    return (response as any).data || response as { status: string; timestamp: string };
  }

  // Generic request method for custom endpoints
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    const response = await this.request<T>(url);
    return (response as any).data || response as T;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return (response as any).data || response as T;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return (response as any).data || response as T;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: 'DELETE',
    });
    return (response as any).data || response as T;
  }

  // ============== Entity Follow Methods ==============

  /**
   * Follow an entity (brand, store, supplier, page)
   */
  async followEntity(entityType: 'brand' | 'store' | 'supplier' | 'page', entityId: string): Promise<any> {
    const response = await this.request<any>(`/social/entities/${entityType}/${entityId}/follow`, {
      method: 'POST',
    });
    return response.data || response;
  }

  /**
   * Unfollow an entity
   */
  async unfollowEntity(entityType: 'brand' | 'store' | 'supplier' | 'page', entityId: string): Promise<void> {
    await this.request(`/social/entities/${entityType}/${entityId}/follow`, {
      method: 'DELETE',
    });
  }

  /**
   * Check if current user is following an entity
   */
  async isFollowingEntity(entityType: 'brand' | 'store' | 'supplier' | 'page', entityId: string): Promise<boolean> {
    const response = await this.request<any>(`/social/entities/${entityType}/${entityId}/follow-status`);
    return response.data?.isFollowing || false;
  }

  /**
   * Get entities the current user is following
   */
  async getFollowingEntities(
    userId: string,
    entityType?: 'brand' | 'store' | 'supplier' | 'page',
    page = 1,
    limit = 50
  ): Promise<{ entities: any[]; total: number; hasMore: boolean }> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (entityType) params.append('entityType', entityType);
    const response = await this.request<any>(`/social/users/${userId}/following-entities?${params}`);
    return response.data || response;
  }

  /**
   * Get followers of an entity
   */
  async getEntityFollowers(
    entityType: 'brand' | 'store' | 'supplier' | 'page',
    entityId: string,
    page = 1,
    limit = 20
  ): Promise<{ followers: any[]; total: number; hasMore: boolean }> {
    const response = await this.request<any>(
      `/social/entities/${entityType}/${entityId}/followers?page=${page}&limit=${limit}`
    );
    return response.data || response;
  }

  // ============== Direct Messaging Methods ==============

  /**
   * Get all conversations (inbox)
   */
  async getConversations(limit = 20, offset = 0): Promise<{ conversations: any[]; total: number }> {
    const response = await this.request<any>(`/messages/conversations?limit=${limit}&offset=${offset}`);
    return response.data || response;
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<any> {
    const response = await this.request<any>(`/messages/conversations/${conversationId}`);
    return response.data?.conversation || response;
  }

  /**
   * Start or get existing conversation with a user
   * @param recipientIdOrUsernames - Single recipient ID (UUID) or array of usernames
   * @param entityType - For entity conversations (brand, store, supplier, page)
   * @param entityId - Entity ID for entity conversations
   */
  async startConversation(recipientIdOrUsernames?: string | string[], entityType?: string, entityId?: string): Promise<any> {
    const body: any = {};

    if (recipientIdOrUsernames) {
      if (Array.isArray(recipientIdOrUsernames)) {
        // Array of usernames - send first one as recipientUsername for direct, or handle as group
        if (recipientIdOrUsernames.length === 1) {
          // Single username - direct conversation
          body.recipientUsername = recipientIdOrUsernames[0];
        } else {
          // Multiple - this would be a group chat, not supported yet via username
          body.participantIds = recipientIdOrUsernames;
        }
      } else {
        // Single value - check if it's a UUID or username
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recipientIdOrUsernames);
        if (isUUID) {
          body.recipientId = recipientIdOrUsernames;
        } else {
          body.recipientUsername = recipientIdOrUsernames;
        }
      }
    }

    if (entityType) body.entityType = entityType;
    if (entityId) body.entityId = entityId;

    const response = await this.request<any>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data?.conversation || response;
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<{ messages: any[]; total: number }> {
    const response = await this.request<any>(
      `/messages/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
    );
    return response.data || response;
  }

  /**
   * Update user activity status
   */
  async updateActivity(): Promise<void> {
    await this.request('/users/activity', { method: 'POST' });
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'item_share' | 'voice' | 'file' = 'text',
    metadata?: any,
    attachments?: any[],
    mentions?: any[]
  ): Promise<any> {
    const response = await this.request<any>(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType, metadata, attachments, mentions }),
    });
    return response.data?.message || response;
  }

  /**
   * Edit a message (only within 15 minutes)
   */
  async editMessage(messageId: string, content: string): Promise<any> {
    const response = await this.request<any>(`/messages/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return response.data?.message || response;
  }

  /**
   * Check if a message can be edited
   */
  async canEditMessage(messageId: string): Promise<boolean> {
    const response = await this.request<any>(`/messages/messages/${messageId}/can-edit`);
    return response.data?.canEdit || false;
  }

  /**
   * Mark a conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.request(`/messages/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(): Promise<number> {
    const response = await this.request<any>('/messages/unread-count');
    return response.data?.unreadCount || 0;
  }

  /**
   * Delete a message (only within 15 minutes)
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.request(`/messages/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<any> {
    const response = await this.request<any>(`/messages/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
    return response.data?.reaction || response;
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await this.request(`/messages/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get reactions for a message
   */
  async getMessageReactions(messageId: string): Promise<any[]> {
    const response = await this.request<any>(`/messages/messages/${messageId}/reactions`);
    return response.data?.reactions || [];
  }

  /**
   * Create a group conversation
   */
  async createGroupConversation(participantIds: string[], name?: string): Promise<any> {
    const response = await this.request<any>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantIds, name }),
    });
    return response.data?.conversation || response;
  }
  async updateConversation(conversationId: string, updates: { name?: string; avatarUrl?: string; description?: string }): Promise<any> {
    const response = await this.request<any>(`/messages/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response.data?.conversation || response;
  }

  async addConversationParticipant(conversationId: string, userId: string): Promise<any> {
    return this.request<any>(`/messages/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeConversationParticipant(conversationId: string, userId: string): Promise<any> {
    return this.request<any>(`/messages/conversations/${conversationId}/participants/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateParticipantRole(conversationId: string, userId: string, role: 'admin' | 'member'): Promise<any> {
    return this.request<any>(`/messages/conversations/${conversationId}/participants/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async getConversationMedia(conversationId: string): Promise<any> {
    const response = await this.request<any>(`/messages/conversations/${conversationId}/media`);
    return response.data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.request(`/messages/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async uploadMessageMedia(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', file); // Field name should match storage controller's uploadMiddleware

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/messages/upload-media`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiErrorClass(data.error?.message || data.message || 'Media upload failed');
    }

    return data.data || data;
  }

  // ==================== PRIVACY SETTINGS ====================

  async updatePrivacySettings(settings: {
    isPrivate?: boolean;
    wardrobe?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
    activity?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
    outfits?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
    marketplace?: { visibility: 'public' | 'followers' | 'custom' | 'hidden'; exceptUsers?: string[] };
    height?: boolean;
    weight?: boolean;
    birthDate?: boolean;
    gender?: boolean;
    telephone?: boolean;
  }) {
    return this.request<{ success: boolean; privacySettings: any }>('/users/privacy', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ==================== FOLLOW REQUESTS ====================

  async getFollowRequests(page = 1, limit = 20) {
    return this.request<{ success: boolean; requests: any[]; pagination: any }>(
      `/users/follow-requests?page=${page}&limit=${limit}`
    );
  }

  async getFollowRequestCount() {
    return this.request<{ success: boolean; count: number }>('/users/follow-requests/count');
  }

  async acceptFollowRequest(requesterId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/users/follow-requests/${requesterId}/accept`,
      { method: 'POST' }
    );
  }

  async declineFollowRequest(requesterId: string) {
    return this.request<{ success: boolean; message: string }>(
      `/users/follow-requests/${requesterId}`,
      { method: 'DELETE' }
    );
  }

  async getFollowStatus(userId: string) {
    return this.request<{ success: boolean; status: 'none' | 'pending' | 'accepted' }>(
      `/users/follow-status/${userId}`
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class and error class for error handling
export { ApiClient };
export { ApiErrorClass as ApiError };

// Export types
export type { ApiResponse, ApiErrorResponse };

// Error handling utilities
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiErrorClass) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof ApiErrorClass && error.code === 'NETWORK_ERROR';
};

export const isAuthError = (error: unknown): boolean => {
  return error instanceof ApiErrorClass && (
    error.status === 401 ||
    error.code === 'UNAUTHORIZED' ||
    error.code === 'INVALID_CREDENTIALS' ||
    error.code === 'TOKEN_EXPIRED'
  );
};


export const isValidationError = (error: unknown): boolean => {
  return error instanceof ApiErrorClass && (
    error.status === 400 ||
    error.code === 'VALIDATION_ERROR' ||
    error.code === 'INVALID_CPF'
  );
};

export const api = new ApiClient();
export default api;