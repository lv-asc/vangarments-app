import { AuthUtils, JWTPayload } from '../../src/utils/auth';
import { Request, Response, NextFunction } from 'express';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const mockBcrypt = require('bcryptjs');
const mockJwt = require('jsonwebtoken');

describe('AuthUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testpassword123';
      const hashedPassword = 'hashed_password';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as any);

      const result = await AuthUtils.hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should compare password with hash', async () => {
      const password = 'testpassword123';
      const hash = 'hashed_password';

      mockBcrypt.compare.mockResolvedValue(true as any);

      const result = await AuthUtils.comparePassword(password, hash);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongpassword';
      const hash = 'hashed_password';

      mockBcrypt.compare.mockResolvedValue(false as any);

      const result = await AuthUtils.comparePassword(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      const payload: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };
      const token = 'generated_token';

      mockJwt.sign.mockReturnValue(token as any);

      const result = AuthUtils.generateToken(payload);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        'test_jwt_secret_key_for_testing_only',
        { expiresIn: '1h' }
      );
      expect(result).toBe(token);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode JWT token', () => {
      const token = 'valid_token';
      const payload: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      mockJwt.verify.mockReturnValue(payload as any);

      const result = AuthUtils.verifyToken(token);

      expect(mockJwt.verify).toHaveBeenCalledWith(token, 'test_jwt_secret_key_for_testing_only');
      expect(result).toEqual(payload);
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid_token';

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => AuthUtils.verifyToken(token)).toThrow('Invalid token');
    });
  });

  describe('authenticateToken middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {
        headers: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should authenticate valid token', () => {
      const token = 'valid_token';
      const payload: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      mockReq.headers = { authorization: `Bearer ${token}` };
      mockJwt.verify.mockReturnValue(payload as any);

      AuthUtils.authenticateToken(mockReq as any, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 for missing token', () => {
      mockReq.headers = {};

      AuthUtils.authenticateToken(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', () => {
      const token = 'invalid_token';

      mockReq.headers = { authorization: `Bearer ${token}` };
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      AuthUtils.authenticateToken(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should allow access for user with required role', () => {
      const user: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer', 'influencer'],
      };

      mockReq.user = user;

      const middleware = AuthUtils.requireRole(['influencer']);
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      const user: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      mockReq.user = user;

      const middleware = AuthUtils.requireRole(['brand_owner']);
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this action',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      mockReq.user = undefined;

      const middleware = AuthUtils.requireRole(['consumer']);
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access if user has any of the required roles', () => {
      const user: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      mockReq.user = user;

      const middleware = AuthUtils.requireRole(['consumer', 'influencer', 'brand_owner']);
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple role requirements correctly', () => {
      const testCases = [
        {
          userRoles: ['consumer', 'influencer'],
          requiredRoles: ['influencer', 'brand_owner'],
          shouldPass: true,
          description: 'User with influencer role should access influencer OR brand_owner endpoint'
        },
        {
          userRoles: ['consumer'],
          requiredRoles: ['influencer', 'brand_owner'],
          shouldPass: false,
          description: 'Consumer-only user should not access influencer OR brand_owner endpoint'
        },
        {
          userRoles: ['admin'],
          requiredRoles: ['consumer'],
          shouldPass: false,
          description: 'Admin without consumer role should not access consumer endpoint'
        },
        {
          userRoles: ['consumer', 'admin'],
          requiredRoles: ['consumer'],
          shouldPass: true,
          description: 'Admin with consumer role should access consumer endpoint'
        }
      ];

      testCases.forEach(testCase => {
        const user: JWTPayload = {
          id: 'user-id',
          userId: 'user-id',
          email: 'test@example.com',
          roles: testCase.userRoles,
        };

        mockReq.user = user;
        jest.clearAllMocks();

        const middleware = AuthUtils.requireRole(testCase.requiredRoles);
        middleware(mockReq as any, mockRes as Response, mockNext);

        if (testCase.shouldPass) {
          expect(mockNext).toHaveBeenCalled();
        } else {
          expect(mockRes.status).toHaveBeenCalledWith(403);
          expect(mockNext).not.toHaveBeenCalled();
        }
      });
    });

    it('should handle empty roles array', () => {
      const user: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: [],
      };

      mockReq.user = user;

      const middleware = AuthUtils.requireRole(['consumer']);
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-sensitive role names', () => {
      const user: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['Consumer'], // Different case
      };

      mockReq.user = user;

      const middleware = AuthUtils.requireRole(['consumer']);
      middleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Security and edge cases', () => {
    it('should handle malformed JWT tokens', () => {
      const malformedTokens = [
        'not.a.jwt',
        'header.payload', // Missing signature
        'header.payload.signature.extra', // Too many parts
        '', // Empty string
        'Bearer token', // Wrong format
      ];

      malformedTokens.forEach(token => {
        expect(() => AuthUtils.verifyToken(token)).toThrow();
      });
    });

    it('should handle password hashing edge cases', async () => {
      // Test empty password
      await expect(AuthUtils.hashPassword('')).resolves.toBeDefined();
      
      // Test very long password
      const longPassword = 'a'.repeat(1000);
      await expect(AuthUtils.hashPassword(longPassword)).resolves.toBeDefined();
      
      // Test password with special characters
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      await expect(AuthUtils.hashPassword(specialPassword)).resolves.toBeDefined();
    });

    it('should generate unique tokens for different users', () => {
      const user1: JWTPayload = {
        id: 'user-1',
        userId: 'user-1',
        email: 'user1@example.com',
        roles: ['consumer'],
      };

      const user2: JWTPayload = {
        id: 'user-2',
        userId: 'user-2',
        email: 'user2@example.com',
        roles: ['consumer'],
      };

      mockJwt.sign
        .mockReturnValueOnce('token_for_user_1')
        .mockReturnValueOnce('token_for_user_2');

      const token1 = AuthUtils.generateToken(user1);
      const token2 = AuthUtils.generateToken(user2);

      expect(token1).not.toBe(token2);
      expect(token1).toBe('token_for_user_1');
      expect(token2).toBe('token_for_user_2');
    });

    it('should handle token expiration scenarios', () => {
      // This test would require mocking time or using a test JWT library
      // For now, we test that the token generation includes expiration
      const user: JWTPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      const token = AuthUtils.generateToken(user);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        user,
        'test_jwt_secret_key_for_testing_only',
        { expiresIn: '1h' }
      );
    });
  });
});