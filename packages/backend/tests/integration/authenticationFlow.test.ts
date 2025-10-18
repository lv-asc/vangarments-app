/**
 * Comprehensive integration tests for authentication and user management flows
 * Tests the complete end-to-end authentication process including CPF validation,
 * user registration, login, role management, and token handling
 */

import request from 'supertest';
import express from 'express';
import { AuthController } from '../../src/controllers/authController';
import { UserModel } from '../../src/models/User';
import { AuthUtils } from '../../src/utils/auth';
import { CPFValidator } from '../../src/utils/cpf';

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/utils/auth');
jest.mock('../../src/utils/cpf');
jest.mock('@vangarments/shared', () => ({
  UserRegistrationSchema: {
    safeParse: jest.fn(),
  },
}));

import { UserRegistrationSchema } from '@vangarments/shared';

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockAuthUtils = AuthUtils as jest.Mocked<typeof AuthUtils>;
const mockCPFValidator = CPFValidator as jest.Mocked<typeof CPFValidator>;
const mockUserRegistrationSchema = UserRegistrationSchema as jest.Mocked<typeof UserRegistrationSchema>;

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);
app.get('/auth/profile', AuthUtils.authenticateToken, AuthController.getProfile);
app.put('/auth/profile', AuthUtils.authenticateToken, AuthController.updateProfile);
app.post('/auth/refresh', AuthUtils.authenticateToken, AuthController.refreshToken);

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Registration Flow', () => {
    const validUserData = {
      cpf: '111.444.777-35',
      email: 'newuser@example.com',
      password: 'securepassword123',
      name: 'João Silva',
      birthDate: '1990-05-15',
      gender: 'male',
    };

    it('should complete full registration flow successfully', async () => {
      // Mock successful validation
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...validUserData,
          birthDate: new Date(validUserData.birthDate),
        },
      });

      // Mock CPF validation
      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // Mock user doesn't exist
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);

      // Mock password hashing
      mockAuthUtils.hashPassword.mockResolvedValue('$2b$12$hashedpassword');

      // Mock user creation
      const createdUser = {
        id: 'new-user-id',
        cpf: '11144477735',
        email: 'newuser@example.com',
        personalInfo: {
          name: 'João Silva',
          birthDate: new Date('1990-05-15'),
          gender: 'male',
          location: {},
        },
        measurements: {},
        preferences: {},
        badges: [],
        socialLinks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserModel.create.mockResolvedValue(createdUser);
      mockUserModel.addRole.mockResolvedValue();
      mockAuthUtils.generateToken.mockReturnValue('registration_jwt_token');

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token', 'registration_jwt_token');
      expect(response.body.user.id).toBe('new-user-id');

      // Verify all steps were called correctly
      expect(mockCPFValidator.isValid).toHaveBeenCalledWith('111.444.777-35');
      expect(mockCPFValidator.clean).toHaveBeenCalledWith('111.444.777-35');
      expect(mockUserModel.findByCPF).toHaveBeenCalledWith('11144477735');
      expect(mockUserModel.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockAuthUtils.hashPassword).toHaveBeenCalledWith('securepassword123');
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: '11144477735',
          email: 'newuser@example.com',
          passwordHash: '$2b$12$hashedpassword',
          name: 'João Silva',
          birthDate: expect.any(Date),
          gender: 'male',
        })
      );
      expect(mockUserModel.addRole).toHaveBeenCalledWith('new-user-id', 'consumer');
    });

    it('should handle registration with existing CPF', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...validUserData,
          birthDate: new Date(validUserData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // Mock existing user with same CPF
      mockUserModel.findByCPF.mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
      } as any);

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.error.code).toBe('CPF_ALREADY_EXISTS');
      expect(response.body.error.message).toBe('An account with this CPF already exists');

      // Should not proceed to create user
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should handle registration with existing email', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...validUserData,
          birthDate: new Date(validUserData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      mockUserModel.findByCPF.mockResolvedValue(null);
      // Mock existing user with same email
      mockUserModel.findByEmail.mockResolvedValue({
        id: 'existing-user-id',
        cpf: '98765432100',
      } as any);

      const response = await request(app)
        .post('/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(response.body.error.message).toBe('An account with this email already exists');

      // Should not proceed to create user
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('Complete Login Flow', () => {
    const loginCredentials = {
      email: 'user@example.com',
      password: 'userpassword123',
    };

    it('should complete full login flow successfully', async () => {
      const existingUser = {
        id: 'existing-user-id',
        cpf: '11144477735',
        email: 'user@example.com',
        personalInfo: {
          name: 'Maria Santos',
          birthDate: new Date('1985-03-20'),
          gender: 'female',
          location: {},
        },
        measurements: {},
        preferences: {},
        badges: [],
        socialLinks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock user lookup
      mockUserModel.findByEmail.mockResolvedValue(existingUser);
      mockUserModel.getPasswordHash.mockResolvedValue('$2b$12$hashedpassword');
      
      // Mock password verification
      mockAuthUtils.comparePassword.mockResolvedValue(true);
      
      // Mock role retrieval
      mockUserModel.getUserRoles.mockResolvedValue(['consumer', 'influencer']);
      
      // Mock token generation
      mockAuthUtils.generateToken.mockReturnValue('login_jwt_token');

      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token', 'login_jwt_token');
      expect(response.body.user.id).toBe('existing-user-id');

      // Verify all steps were called correctly
      expect(mockUserModel.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockUserModel.getPasswordHash).toHaveBeenCalledWith('existing-user-id');
      expect(mockAuthUtils.comparePassword).toHaveBeenCalledWith('userpassword123', '$2b$12$hashedpassword');
      expect(mockUserModel.getUserRoles).toHaveBeenCalledWith('existing-user-id');
      expect(mockAuthUtils.generateToken).toHaveBeenCalledWith({
        userId: 'existing-user-id',
        email: 'user@example.com',
        roles: ['consumer', 'influencer'],
      });
    });

    it('should handle login with non-existent user', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password');

      // Should not proceed to password verification
      expect(mockUserModel.getPasswordHash).not.toHaveBeenCalled();
      expect(mockAuthUtils.comparePassword).not.toHaveBeenCalled();
    });

    it('should handle login with incorrect password', async () => {
      const existingUser = {
        id: 'existing-user-id',
        email: 'user@example.com',
      };

      mockUserModel.findByEmail.mockResolvedValue(existingUser as any);
      mockUserModel.getPasswordHash.mockResolvedValue('$2b$12$hashedpassword');
      
      // Mock password verification failure
      mockAuthUtils.comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password');

      // Should not proceed to role retrieval
      expect(mockUserModel.getUserRoles).not.toHaveBeenCalled();
      expect(mockAuthUtils.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('Profile Management Flow', () => {
    it('should retrieve user profile successfully', async () => {
      const userProfile = {
        id: 'user-id',
        cpf: '11144477735',
        email: 'user@example.com',
        personalInfo: {
          name: 'Carlos Oliveira',
          birthDate: new Date('1992-08-10'),
          gender: 'male',
          location: {
            country: 'Brazil',
            state: 'SP',
            city: 'São Paulo',
          },
        },
        measurements: {
          height: 175,
          weight: 70,
          sizes: {
            BR: { shirt: 'M', pants: '42' },
            US: { shirt: 'M', pants: '32' },
          },
        },
        preferences: {
          favoriteColors: ['blue', 'black'],
          preferredBrands: ['Nike', 'Adidas'],
        },
        badges: [],
        socialLinks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock authentication
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'user-id',
          email: 'user@example.com',
          roles: ['consumer'],
        };
        next();
      });

      mockUserModel.findById.mockResolvedValue(userProfile);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe('user-id');
      expect(response.body.user.personalInfo.name).toBe('Carlos Oliveira');
      expect(response.body.user.measurements.height).toBe(175);
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Carlos Oliveira Santos',
        measurements: {
          height: 180,
          weight: 75,
          sizes: {
            BR: { shirt: 'L', pants: '44' },
          },
        },
        preferences: {
          favoriteColors: ['blue', 'green', 'black'],
          preferredBrands: ['Nike', 'Adidas', 'Puma'],
        },
      };

      const updatedUser = {
        id: 'user-id',
        personalInfo: {
          name: 'Carlos Oliveira Santos',
          birthDate: new Date('1992-08-10'),
          gender: 'male',
          location: {},
        },
        measurements: updateData.measurements,
        preferences: updateData.preferences,
      };

      // Mock authentication
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'user-id',
          email: 'user@example.com',
          roles: ['consumer'],
        };
        next();
      });

      mockUserModel.update.mockResolvedValue(updatedUser as any);

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.personalInfo.name).toBe('Carlos Oliveira Santos');
      expect(response.body.user.measurements.height).toBe(180);

      expect(mockUserModel.update).toHaveBeenCalledWith('user-id', updateData);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token with updated roles', async () => {
      // Mock authentication with old token
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          userId: 'user-id',
          email: 'user@example.com',
          roles: ['consumer'], // Old roles in token
        };
        next();
      });

      // Mock updated roles from database
      mockUserModel.getUserRoles.mockResolvedValue(['consumer', 'influencer', 'brand_owner']);
      mockAuthUtils.generateToken.mockReturnValue('refreshed_jwt_token');

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer old_token')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('token', 'refreshed_jwt_token');

      // Verify new token includes updated roles
      expect(mockAuthUtils.generateToken).toHaveBeenCalledWith({
        userId: 'user-id',
        email: 'user@example.com',
        roles: ['consumer', 'influencer', 'brand_owner'],
      });
    });
  });

  describe('Brazilian Market Specific Integration Tests', () => {
    it('should handle complete Brazilian user registration flow', async () => {
      const brazilianUserData = {
        cpf: '123.456.789-09',
        email: 'usuario@exemplo.com.br',
        password: 'senhaSegura123',
        name: 'Ana Paula Silva',
        birthDate: '1988-12-03',
        gender: 'female',
      };

      // Mock successful Brazilian CPF validation
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...brazilianUserData,
          birthDate: new Date(brazilianUserData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('12345678909');

      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockAuthUtils.hashPassword.mockResolvedValue('$2b$12$hashedpassword');

      const createdUser = {
        id: 'brazilian-user-id',
        cpf: '12345678909',
        email: 'usuario@exemplo.com.br',
        personalInfo: {
          name: 'Ana Paula Silva',
          birthDate: new Date('1988-12-03'),
          gender: 'female',
          location: {},
        },
        measurements: {},
        preferences: {},
        badges: [],
        socialLinks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserModel.create.mockResolvedValue(createdUser);
      mockUserModel.addRole.mockResolvedValue();
      mockAuthUtils.generateToken.mockReturnValue('brazilian_user_token');

      const response = await request(app)
        .post('/auth/register')
        .send(brazilianUserData)
        .expect(201);

      expect(response.body.user.personalInfo.name).toBe('Ana Paula Silva');
      expect(response.body.user.cpf).toBe('12345678909');
      expect(mockCPFValidator.clean).toHaveBeenCalledWith('123.456.789-09');
    });

    it('should enforce CPF uniqueness across different email domains', async () => {
      const sameCPFDifferentEmails = [
        {
          cpf: '111.444.777-35',
          email: 'user1@gmail.com',
          password: 'password123',
          name: 'User One',
          birthDate: '1990-01-01',
          gender: 'male',
        },
        {
          cpf: '111.444.777-35', // Same CPF
          email: 'user2@yahoo.com', // Different email
          password: 'password456',
          name: 'User Two',
          birthDate: '1991-02-02',
          gender: 'female',
        },
      ];

      // First registration should succeed
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...sameCPFDifferentEmails[0],
          birthDate: new Date(sameCPFDifferentEmails[0].birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockAuthUtils.hashPassword.mockResolvedValue('$2b$12$hashedpassword');

      const firstUser = {
        id: 'first-user-id',
        cpf: '11144477735',
        email: 'user1@gmail.com',
      };

      mockUserModel.create.mockResolvedValue(firstUser as any);
      mockUserModel.addRole.mockResolvedValue();
      mockAuthUtils.generateToken.mockReturnValue('first_user_token');

      await request(app)
        .post('/auth/register')
        .send(sameCPFDifferentEmails[0])
        .expect(201);

      // Second registration with same CPF should fail
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...sameCPFDifferentEmails[1],
          birthDate: new Date(sameCPFDifferentEmails[1].birthDate),
        },
      });

      // Mock existing user with same CPF
      mockUserModel.findByCPF.mockResolvedValue(firstUser as any);

      const response = await request(app)
        .post('/auth/register')
        .send(sameCPFDifferentEmails[1])
        .expect(409);

      expect(response.body.error.code).toBe('CPF_ALREADY_EXISTS');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          cpf: '111.444.777-35',
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          birthDate: new Date('1990-01-01'),
          gender: 'male',
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // Simulate network timeout
      mockUserModel.findByCPF.mockRejectedValue(new Error('Connection timeout'));

      const response = await request(app)
        .post('/auth/register')
        .send({
          cpf: '111.444.777-35',
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
        })
        .expect(500);

      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle concurrent registration attempts', async () => {
      const userData = {
        cpf: '111.444.777-35',
        email: 'concurrent@example.com',
        password: 'password123',
        name: 'Concurrent User',
        birthDate: '1990-01-01',
        gender: 'male',
      };

      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...userData,
          birthDate: new Date(userData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // First call - no existing user
      mockUserModel.findByCPF.mockResolvedValueOnce(null);
      mockUserModel.findByEmail.mockResolvedValueOnce(null);

      // Second call - user now exists (race condition)
      mockUserModel.findByCPF.mockResolvedValueOnce({
        id: 'existing-user-id',
        email: 'concurrent@example.com',
      } as any);

      mockAuthUtils.hashPassword.mockResolvedValue('$2b$12$hashedpassword');

      // First registration attempt
      const createdUser = {
        id: 'new-user-id',
        cpf: '11144477735',
        email: 'concurrent@example.com',
      };

      mockUserModel.create.mockResolvedValue(createdUser as any);
      mockUserModel.addRole.mockResolvedValue();
      mockAuthUtils.generateToken.mockReturnValue('jwt_token');

      const firstResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(firstResponse.body.user.id).toBe('new-user-id');

      // Second registration attempt should fail
      const secondResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(secondResponse.body.error.code).toBe('CPF_ALREADY_EXISTS');
    });
  });
});