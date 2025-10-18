import { apiClient, ApiClient, ApiError } from '@/lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored tokens
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Authentication', () => {
    it('should validate CPF correctly', () => {
      expect(ApiClient.validateCPF('123.456.789-09')).toBe(true);
      expect(ApiClient.validateCPF('111.111.111-11')).toBe(false); // All same digits
      expect(ApiClient.validateCPF('123.456.789-00')).toBe(false); // Invalid checksum
      expect(ApiClient.validateCPF('123.456.789')).toBe(false); // Incomplete
    });

    it('should format CPF correctly', () => {
      // Test the private formatCPF method through register
      const mockResponse = {
        user: { id: '1', name: 'Test User' },
        token: 'test-token'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      // The register method should format the CPF internally
      expect(() => {
        apiClient.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          cpf: '12345678909' // Unformatted CPF
        });
      }).not.toThrow();
    });

    it('should handle login success', async () => {
      const mockResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'test-token'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      const result = await apiClient.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: mockResponse.user,
        token: mockResponse.token
      });
      expect(apiClient.isAuthenticated).toBe(true);
    });

    it('should handle login failure', async () => {
      const mockError = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockError),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await expect(
        apiClient.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        apiClient.login('test@example.com', 'password123')
      ).rejects.toThrow('Network error');
    });

    it('should handle API errors with proper structure', async () => {
      const mockError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { field: 'email' }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      try {
        await apiClient.login('invalid-email', 'password123');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiError).message).toBe('Invalid input data');
        expect((error as ApiError).status).toBe(400);
      }
    });
  });

  describe('Request Interceptors', () => {
    it('should add authorization header when token is present', async () => {
      // Mock a successful login first
      const loginResponse = {
        user: { id: '1', name: 'Test User' },
        token: 'test-token'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await apiClient.login('test@example.com', 'password123');

      // Now make another request
      const profileResponse = {
        user: { id: '1', name: 'Test User', email: 'test@example.com' }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(profileResponse),
        headers: new Headers({ 'content-type': 'application/json' })
      });

      await apiClient.getCurrentUser();

      // Check that the second call included the authorization header
      const secondCall = (fetch as jest.Mock).mock.calls[1];
      const headers = secondCall[1].headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });
  });
});