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

  private saveToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      // Store in secure cookie (preferred) and localStorage (fallback)
      Cookies.set('auth_token', token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      Cookies.remove('auth_token');
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
    let config = { ...options };
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
        const apiError = new ApiErrorClass(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || 'HTTP_ERROR',
          errorData.details,
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
    this.saveToken(response.token);
    return { user: response.user, token: response.token };
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
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
    this.saveToken(response.token);
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
  async updateProfile(profileData: {
    name?: string;
    location?: any;
    measurements?: any;
    preferences?: any;
  }): Promise<any> {
    const response = await this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.user;
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    // Use the request method to handle interceptors
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    const response = await fetch(`${this.baseURL}/users/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
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
    return response.data;
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

    const endpoint = `/marketplace/listings${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<any>(endpoint);
    return response;
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
  async getSocialFeed(page = 1, limit = 20): Promise<{
    posts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await this.request<any>(`/social/feed?page=${page}&limit=${limit}`);
    return response.data;
  }

  async createPost(postData: any): Promise<any> {
    const response = await this.request<any>('/social/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return response.data;
  }

  async likePost(postId: string): Promise<void> {
    await this.request(`/social/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async followUser(userId: string): Promise<void> {
    await this.request(`/social/users/${userId}/follow`, {
      method: 'POST',
    });
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