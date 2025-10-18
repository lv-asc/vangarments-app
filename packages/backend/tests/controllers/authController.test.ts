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

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      cpf: '111.444.777-35',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      birthDate: '1990-01-01',
      gender: 'male',
    };

    it('should register a new user successfully', async () => {
      // Mock validation success
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...validRegistrationData,
          birthDate: new Date(validRegistrationData.birthDate),
        },
      });

      // Mock CPF validation
      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // Mock user doesn't exist
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);

      // Mock password hashing
      mockAuthUtils.hashPassword.mockResolvedValue('hashed_password');

      // Mock user creation
      const mockUser = {
        id: 'user-id',
        cpf: '11144477735',
        email: 'test@example.com',
        personalInfo: {
          name: 'Test User',
          birthDate: new Date('1990-01-01'),
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

      mockUserModel.create.mockResolvedValue(mockUser);
      mockUserModel.addRole.mockResolvedValue();

      // Mock token generation
      mockAuthUtils.generateToken.mockReturnValue('jwt_token');

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toEqual({
        message: 'User registered successfully',
        user: expect.objectContaining({
          id: mockUser.id,
          cpf: mockUser.cpf,
          email: mockUser.email,
          personalInfo: expect.objectContaining({
            name: mockUser.personalInfo.name,
            gender: mockUser.personalInfo.gender,
          }),
        }),
        token: 'jwt_token',
      });

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cpf: '11144477735',
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          name: 'Test User',
          birthDate: expect.any(Date),
          gender: 'male',
        })
      );

      expect(mockUserModel.addRole).toHaveBeenCalledWith('user-id', 'consumer');
    });

    it('should return 400 for invalid input data', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ message: 'Invalid email format' }],
        },
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid CPF', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: { 
          ...validRegistrationData, 
          cpf: 'invalid-cpf',
          birthDate: new Date(validRegistrationData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(false);

      const response = await request(app)
        .post('/auth/register')
        .send({ ...validRegistrationData, cpf: 'invalid-cpf' })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_CPF');
    });

    it('should return 409 for existing CPF', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...validRegistrationData,
          birthDate: new Date(validRegistrationData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // Mock existing user with same CPF
      mockUserModel.findByCPF.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body.error.code).toBe('CPF_ALREADY_EXISTS');
    });

    it('should return 409 for existing email', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          ...validRegistrationData,
          birthDate: new Date(validRegistrationData.birthDate),
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      mockUserModel.findByCPF.mockResolvedValue(null);
      // Mock existing user with same email
      mockUserModel.findByEmail.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        personalInfo: { name: 'Test User' },
      };

      mockUserModel.findByEmail.mockResolvedValue(mockUser as any);
      mockUserModel.getPasswordHash.mockResolvedValue('hashed_password');
      mockAuthUtils.comparePassword.mockResolvedValue(true);
      mockUserModel.getUserRoles.mockResolvedValue(['consumer']);
      mockAuthUtils.generateToken.mockReturnValue('jwt_token');

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Login successful',
        user: mockUser,
        token: 'jwt_token',
      });
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for incorrect password', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      mockUserModel.findByEmail.mockResolvedValue(mockUser as any);
      mockUserModel.getPasswordHash.mockResolvedValue('hashed_password');
      mockAuthUtils.comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        personalInfo: { name: 'Test User' },
      };

      // Mock authentication middleware
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'user-id', email: 'test@example.com', roles: ['consumer'] };
        next();
      });

      mockUserModel.findById.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({ user: mockUser });
    });

    it('should return 404 for non-existent user', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'user-id', email: 'test@example.com', roles: ['consumer'] };
        next();
      });

      mockUserModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .expect(404);

      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        measurements: { height: 175, weight: 70 },
      };

      const updatedUser = {
        id: 'user-id',
        personalInfo: { name: 'Updated Name' },
        measurements: updateData.measurements,
      };

      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'user-id', email: 'test@example.com', roles: ['consumer'] };
        next();
      });

      mockUserModel.update.mockResolvedValue(updatedUser as any);

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Profile updated successfully',
        user: updatedUser,
      });

      expect(mockUserModel.update).toHaveBeenCalledWith('user-id', updateData);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'user-id', email: 'test@example.com', roles: ['consumer'] };
        next();
      });

      mockUserModel.getUserRoles.mockResolvedValue(['consumer', 'influencer']);
      mockAuthUtils.generateToken.mockReturnValue('new_jwt_token');

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Token refreshed successfully',
        token: 'new_jwt_token',
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database errors during registration', async () => {
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
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockAuthUtils.hashPassword.mockResolvedValue('hashed_password');

      // Simulate database error
      mockUserModel.create.mockRejectedValue(new Error('Database connection failed'));

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

    it('should handle password hashing errors', async () => {
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
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);

      // Simulate password hashing error
      mockAuthUtils.hashPassword.mockRejectedValue(new Error('Hashing failed'));

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

    it('should handle missing password hash during login', async () => {
      const mockUser = { id: 'user-id', email: 'test@example.com' };

      mockUserModel.findByEmail.mockResolvedValue(mockUser as any);
      mockUserModel.getPasswordHash.mockResolvedValue(null); // No password hash found

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should handle role assignment errors during registration', async () => {
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
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockAuthUtils.hashPassword.mockResolvedValue('hashed_password');

      const mockUser = {
        id: 'user-id',
        cpf: '11144477735',
        email: 'test@example.com',
        personalInfo: {
          name: 'Test User',
          birthDate: new Date('1990-01-01'),
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

      mockUserModel.create.mockResolvedValue(mockUser);
      
      // Simulate role assignment error
      mockUserModel.addRole.mockRejectedValue(new Error('Role assignment failed'));

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
  });

  describe('Brazilian market specific tests', () => {
    it('should handle various CPF formats correctly', async () => {
      const cpfFormats = [
        '111.444.777-35',
        '11144477735',
        '111 444 777 35',
      ];

      for (const cpf of cpfFormats) {
        mockUserRegistrationSchema.safeParse.mockReturnValue({
          success: true,
          data: {
            cpf,
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            birthDate: new Date('1990-01-01'),
            gender: 'male',
          },
        });

        mockCPFValidator.isValid.mockReturnValue(true);
        mockCPFValidator.clean.mockReturnValue('11144477735');
        mockUserModel.findByCPF.mockResolvedValue(null);
        mockUserModel.findByEmail.mockResolvedValue(null);
        mockAuthUtils.hashPassword.mockResolvedValue('hashed_password');

        const mockUser = {
          id: 'user-id',
          cpf: '11144477735',
          email: 'test@example.com',
        };

        mockUserModel.create.mockResolvedValue(mockUser as any);
        mockUserModel.addRole.mockResolvedValue();
        mockAuthUtils.generateToken.mockReturnValue('jwt_token');

        await request(app)
          .post('/auth/register')
          .send({
            cpf,
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            birthDate: '1990-01-01',
            gender: 'male',
          })
          .expect(201);

        expect(mockCPFValidator.clean).toHaveBeenCalledWith(cpf);
      }
    });

    it('should enforce one account per CPF rule', async () => {
      mockUserRegistrationSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          cpf: '111.444.777-35',
          email: 'newemail@example.com', // Different email
          password: 'password123',
          name: 'Test User',
          birthDate: new Date('1990-01-01'),
          gender: 'male',
        },
      });

      mockCPFValidator.isValid.mockReturnValue(true);
      mockCPFValidator.clean.mockReturnValue('11144477735');

      // Mock existing user with same CPF but different email
      mockUserModel.findByCPF.mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
      } as any);

      const response = await request(app)
        .post('/auth/register')
        .send({
          cpf: '111.444.777-35',
          email: 'newemail@example.com',
          password: 'password123',
          name: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
        })
        .expect(409);

      expect(response.body.error.code).toBe('CPF_ALREADY_EXISTS');
      expect(response.body.error.message).toBe('An account with this CPF already exists');
    });
  });

  describe('Role-based functionality tests', () => {
    it('should assign default consumer role on registration', async () => {
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
      mockUserModel.findByCPF.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockAuthUtils.hashPassword.mockResolvedValue('hashed_password');

      const mockUser = {
        id: 'user-id',
        cpf: '11144477735',
        email: 'test@example.com',
      };

      mockUserModel.create.mockResolvedValue(mockUser as any);
      mockUserModel.addRole.mockResolvedValue();
      mockAuthUtils.generateToken.mockReturnValue('jwt_token');

      await request(app)
        .post('/auth/register')
        .send({
          cpf: '111.444.777-35',
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          birthDate: '1990-01-01',
          gender: 'male',
        })
        .expect(201);

      expect(mockUserModel.addRole).toHaveBeenCalledWith('user-id', 'consumer');
    });

    it('should include fresh roles in token refresh', async () => {
      mockAuthUtils.authenticateToken.mockImplementation((req: any, res: any, next: any) => {
        req.user = { 
          userId: 'user-id', 
          email: 'test@example.com', 
          roles: ['consumer'] // Old roles in token
        };
        next();
      });

      // User now has additional roles
      mockUserModel.getUserRoles.mockResolvedValue(['consumer', 'influencer', 'brand_owner']);
      mockAuthUtils.generateToken.mockReturnValue('new_jwt_token');

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      expect(mockAuthUtils.generateToken).toHaveBeenCalledWith({
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer', 'influencer', 'brand_owner'],
      });

      expect(response.body.token).toBe('new_jwt_token');
    });
  });
});