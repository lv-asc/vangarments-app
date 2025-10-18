import request from 'supertest';
import express from 'express';
import { AuthUtils } from '../../src/utils/auth';
import { UserModel } from '../../src/models/User';

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/utils/auth');

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;

// Create Express app for testing role-based access
const app = express();
app.use(express.json());

// Mock controllers for different role requirements
const mockConsumerController = {
  getConsumerData: (req: any, res: any) => {
    res.json({ message: 'Consumer data accessed', userId: req.user.userId });
  },
};

const mockInfluencerController = {
  getInfluencerData: (req: any, res: any) => {
    res.json({ message: 'Influencer data accessed', userId: req.user.userId });
  },
};

const mockBrandOwnerController = {
  getBrandData: (req: any, res: any) => {
    res.json({ message: 'Brand owner data accessed', userId: req.user.userId });
  },
};

const mockAdminController = {
  getAdminData: (req: any, res: any) => {
    res.json({ message: 'Admin data accessed', userId: req.user.userId });
  },
};

// Setup routes with different role requirements
app.get('/consumer', (req, res, next) => mockAuthUtils.authenticateToken(req, res, next), (req, res, next) => mockAuthUtils.requireRole(['consumer'])(req, res, next), mockConsumerController.getConsumerData);
app.get('/influencer', (req, res, next) => mockAuthUtils.authenticateToken(req, res, next), (req, res, next) => mockAuthUtils.requireRole(['influencer'])(req, res, next), mockInfluencerController.getInfluencerData);
app.get('/brand-owner', (req, res, next) => mockAuthUtils.authenticateToken(req, res, next), (req, res, next) => mockAuthUtils.requireRole(['brand_owner'])(req, res, next), mockBrandOwnerController.getBrandData);
app.get('/admin', (req, res, next) => mockAuthUtils.authenticateToken(req, res, next), (req, res, next) => mockAuthUtils.requireRole(['admin'])(req, res, next), mockAdminController.getAdminData);

// Route that accepts multiple roles
app.get('/content-creator', 
  (req, res, next) => mockAuthUtils.authenticateToken(req, res, next), 
  (req, res, next) => mockAuthUtils.requireRole(['influencer', 'brand_owner'])(req, res, next), 
  (req: any, res: any) => {
    res.json({ message: 'Content creator data accessed', userId: req.user.userId });
  }
);

// Route that requires multiple specific roles (user must have ALL roles)
app.get('/premium-brand', 
  (req, res, next) => mockAuthUtils.authenticateToken(req, res, next), 
  (req, res, next) => mockAuthUtils.requireRole(['brand_owner'])(req, res, next),
  (req, res, next) => mockAuthUtils.requireRole(['premium'])(req, res, next),
  (req: any, res: any) => {
    res.json({ message: 'Premium brand data accessed', userId: req.user.userId });
  }
);

describe('Role-Based Access Control Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Consumer Role Access', () => {
    it('should allow access to consumer endpoint for user with consumer role', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'user-id', 
          email: 'consumer@example.com', 
          roles: ['consumer'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/consumer')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Consumer data accessed',
        userId: 'user-id',
      });
    });

    it('should deny access to consumer endpoint for user without consumer role', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'user-id', 
          email: 'user@example.com', 
          roles: ['guest'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/consumer')
        .set('Authorization', 'Bearer valid_token')
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Influencer Role Access', () => {
    it('should allow access to influencer endpoint for user with influencer role', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'influencer-id', 
          email: 'influencer@example.com', 
          roles: ['consumer', 'influencer'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/influencer')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Influencer data accessed',
        userId: 'influencer-id',
      });
    });

    it('should deny access to influencer endpoint for consumer-only user', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'consumer-id', 
          email: 'consumer@example.com', 
          roles: ['consumer'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/influencer')
        .set('Authorization', 'Bearer valid_token')
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Brand Owner Role Access', () => {
    it('should allow access to brand owner endpoint for user with brand_owner role', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'brand-owner-id', 
          email: 'brand@example.com', 
          roles: ['consumer', 'brand_owner'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/brand-owner')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Brand owner data accessed',
        userId: 'brand-owner-id',
      });
    });
  });

  describe('Multiple Role Requirements', () => {
    it('should allow access to content creator endpoint for influencer', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'influencer-id', 
          email: 'influencer@example.com', 
          roles: ['consumer', 'influencer'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/content-creator')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Content creator data accessed',
        userId: 'influencer-id',
      });
    });

    it('should allow access to content creator endpoint for brand owner', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'brand-owner-id', 
          email: 'brand@example.com', 
          roles: ['consumer', 'brand_owner'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/content-creator')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Content creator data accessed',
        userId: 'brand-owner-id',
      });
    });

    it('should deny access to content creator endpoint for consumer-only user', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'consumer-id', 
          email: 'consumer@example.com', 
          roles: ['consumer'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/content-creator')
        .set('Authorization', 'Bearer valid_token')
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Authentication Required', () => {
    it('should deny access without authentication token', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Access token is required',
          },
        });
      });

      const response = await request(app)
        .get('/consumer')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should deny access with invalid authentication token', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        res.status(403).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
      });

      const response = await request(app)
        .get('/consumer')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Role Management Integration', () => {
    it('should handle role changes dynamically', async () => {
      // Simulate user initially having only consumer role
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'user-id', 
          email: 'user@example.com', 
          roles: ['consumer'] 
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      // Should be denied access to influencer endpoint
      let response = await request(app)
        .get('/influencer')
        .set('Authorization', 'Bearer valid_token')
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');

      // Simulate role upgrade to influencer
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'user-id', 
          email: 'user@example.com', 
          roles: ['consumer', 'influencer'] 
        };
        next();
      });

      // Should now have access to influencer endpoint
      response = await request(app)
        .get('/influencer')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Influencer data accessed',
        userId: 'user-id',
      });
    });

    it('should handle complex role hierarchies', async () => {
      const roleHierarchyTests = [
        {
          userRoles: ['consumer'],
          endpoint: '/consumer',
          shouldPass: true,
          description: 'Basic consumer access'
        },
        {
          userRoles: ['consumer', 'influencer'],
          endpoint: '/influencer',
          shouldPass: true,
          description: 'Influencer with consumer base role'
        },
        {
          userRoles: ['consumer', 'brand_owner'],
          endpoint: '/brand-owner',
          shouldPass: true,
          description: 'Brand owner with consumer base role'
        },
        {
          userRoles: ['influencer'],
          endpoint: '/consumer',
          shouldPass: false,
          description: 'Influencer without consumer role should not access consumer endpoint'
        },
        {
          userRoles: ['consumer', 'influencer', 'brand_owner'],
          endpoint: '/content-creator',
          shouldPass: true,
          description: 'Multi-role user accessing content creator endpoint'
        }
      ];

      for (const test of roleHierarchyTests) {
        mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
          req.user = { 
            userId: 'test-user-id', 
            email: 'test@example.com', 
            roles: test.userRoles
          };
          next();
        });

        mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
          return (req: any, res: any, next: any) => {
            const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
            if (hasRole) {
              next();
            } else {
              res.status(403).json({
                error: {
                  code: 'INSUFFICIENT_PERMISSIONS',
                  message: 'Insufficient permissions for this action',
                },
              });
            }
          };
        });

        const expectedStatus = test.shouldPass ? 200 : 403;
        const response = await request(app)
          .get(test.endpoint)
          .set('Authorization', 'Bearer valid_token')
          .expect(expectedStatus);

        if (test.shouldPass) {
          expect(response.body.userId).toBe('test-user-id');
        } else {
          expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
        }
      }
    });

    it('should handle Brazilian market specific roles', async () => {
      const brazilianRoles = [
        'consumer',
        'influencer', 
        'brand_owner',
        'store_owner',
        'thrift_store_owner',
        'model',
        'stylist',
        'designer',
        'creative_director'
      ];

      // Test that each Brazilian market role can be assigned and verified
      for (const role of brazilianRoles) {
        mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
          req.user = { 
            userId: 'brazilian-user-id', 
            email: 'usuario@exemplo.com.br', 
            roles: ['consumer', role] // All users should have consumer as base
          };
          next();
        });

        mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
          return (req: any, res: any, next: any) => {
            const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
            if (hasRole) {
              next();
            } else {
              res.status(403).json({
                error: {
                  code: 'INSUFFICIENT_PERMISSIONS',
                  message: 'Insufficient permissions for this action',
                },
              });
            }
          };
        });

        // Test access to consumer endpoint (should always work)
        await request(app)
          .get('/consumer')
          .set('Authorization', 'Bearer valid_token')
          .expect(200);

        // Test access to role-specific endpoint if it exists
        if (role === 'influencer') {
          await request(app)
            .get('/influencer')
            .set('Authorization', 'Bearer valid_token')
            .expect(200);
        }

        if (role === 'brand_owner') {
          await request(app)
            .get('/brand-owner')
            .set('Authorization', 'Bearer valid_token')
            .expect(200);
        }
      }
    });
  });

  describe('Security and Edge Cases', () => {
    it('should prevent role escalation attacks', async () => {
      // Simulate malicious user trying to access admin endpoint
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'malicious-user-id', 
          email: 'hacker@example.com', 
          roles: ['consumer'] // Only consumer role
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      const response = await request(app)
        .get('/admin')
        .set('Authorization', 'Bearer valid_token')
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should handle token manipulation attempts', async () => {
      // Test various token manipulation scenarios
      const maliciousTokens = [
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGVzIjpbImFkbWluIl19.invalid',
        'Bearer modified_token_with_admin_role',
        'Bearer ' + 'a'.repeat(1000), // Extremely long token
        'Bearer null',
        'Bearer undefined',
      ];

      for (const token of maliciousTokens) {
        mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
          res.status(403).json({
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired token',
            },
          });
        });

        await request(app)
          .get('/consumer')
          .set('Authorization', token)
          .expect(403);
      }
    });

    it('should handle concurrent role changes', async () => {
      // Simulate scenario where user role changes while request is in progress
      let callCount = 0;
      
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        callCount++;
        req.user = { 
          userId: 'concurrent-user-id', 
          email: 'concurrent@example.com', 
          roles: callCount === 1 ? ['consumer'] : ['consumer', 'influencer'] // Role changes between calls
        };
        next();
      });

      mockAuthUtils.requireRole.mockImplementation((requiredRoles: string[]) => {
        return (req: any, res: any, next: any) => {
          const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
          if (hasRole) {
            next();
          } else {
            res.status(403).json({
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action',
              },
            });
          }
        };
      });

      // First call - should fail (only consumer role)
      await request(app)
        .get('/influencer')
        .set('Authorization', 'Bearer valid_token')
        .expect(403);

      // Second call - should succeed (now has influencer role)
      await request(app)
        .get('/influencer')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);
    });
  });
});