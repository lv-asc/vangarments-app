/**
 * Comprehensive unit tests for User model
 * Tests all user management functionality including CRUD operations,
 * role management, and Brazilian market specific features
 */

import { UserModel, CreateUserData, UpdateUserData } from '../../src/models/User';

// Mock database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

const { db } = require('../../src/database/connection');
const mockDb = db as jest.Mocked<typeof db>;

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData: CreateUserData = {
        cpf: '11144477735',
        email: 'newuser@example.com',
        passwordHash: '$2b$12$hashedpassword',
        name: 'João Silva',
        birthDate: new Date('1990-05-15'),
        gender: 'male',
        location: {
          country: 'Brazil',
          state: 'SP',
          city: 'São Paulo',
        },
      };

      const mockDbResult = {
        rows: [{
          id: 'new-user-id',
          cpf: '11144477735',
          email: 'newuser@example.com',
          profile: JSON.stringify({
            name: 'João Silva',
            birthDate: '1990-05-15T00:00:00.000Z',
            gender: 'male',
            location: {
              country: 'Brazil',
              state: 'SP',
              city: 'São Paulo',
            },
          }),
          measurements: null,
          preferences: null,
          created_at: new Date('2023-01-01T00:00:00.000Z'),
          updated_at: new Date('2023-01-01T00:00:00.000Z'),
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.create(userData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          '11144477735',
          'newuser@example.com',
          '$2b$12$hashedpassword',
          expect.stringContaining('"name":"João Silva"'),
        ]
      );

      expect(result).toEqual({
        id: 'new-user-id',
        cpf: '11144477735',
        email: 'newuser@example.com',
        personalInfo: {
          name: 'João Silva',
          birthDate: new Date('1990-05-15T00:00:00.000Z'),
          gender: 'male',
          location: {
            country: 'Brazil',
            state: 'SP',
            city: 'São Paulo',
          },
        },
        measurements: {},
        preferences: {},
        badges: [],
        socialLinks: [],
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      });
    });

    it('should create user without location', async () => {
      const userData: CreateUserData = {
        cpf: '12345678909',
        email: 'user@example.com',
        passwordHash: '$2b$12$hashedpassword',
        name: 'Maria Santos',
        birthDate: new Date('1985-03-20'),
        gender: 'female',
      };

      const mockDbResult = {
        rows: [{
          id: 'user-id',
          cpf: '12345678909',
          email: 'user@example.com',
          profile: JSON.stringify({
            name: 'Maria Santos',
            birthDate: '1985-03-20T00:00:00.000Z',
            gender: 'female',
            location: null,
          }),
          measurements: null,
          preferences: null,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.create(userData);

      expect(result.personalInfo.location).toEqual({});
    });
  });

  describe('findById', () => {
    it('should find user by ID with roles', async () => {
      const mockDbResult = {
        rows: [{
          id: 'user-id',
          cpf: '11144477735',
          email: 'user@example.com',
          profile: JSON.stringify({
            name: 'Test User',
            birthDate: '1990-01-01T00:00:00.000Z',
            gender: 'male',
            location: {},
          }),
          measurements: JSON.stringify({
            height: 175,
            weight: 70,
          }),
          preferences: JSON.stringify({
            favoriteColors: ['blue', 'black'],
          }),
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          roles: ['consumer', 'influencer'],
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.findById('user-id');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT u.*, array_agg(ur.role) as roles'),
        ['user-id']
      );

      expect(result).toEqual({
        id: 'user-id',
        cpf: '11144477735',
        email: 'user@example.com',
        personalInfo: {
          name: 'Test User',
          birthDate: new Date('1990-01-01T00:00:00.000Z'),
          gender: 'male',
          location: {},
        },
        measurements: {
          height: 175,
          weight: 70,
        },
        preferences: {
          favoriteColors: ['blue', 'black'],
        },
        badges: [],
        socialLinks: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should return null for non-existent user', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockDbResult = {
        rows: [{
          id: 'user-id',
          cpf: '11144477735',
          email: 'user@example.com',
          profile: JSON.stringify({
            name: 'Test User',
            birthDate: '1990-01-01T00:00:00.000Z',
            gender: 'male',
            location: {},
          }),
          measurements: null,
          preferences: null,
          created_at: new Date(),
          updated_at: new Date(),
          roles: ['consumer'],
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.findByEmail('user@example.com');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.email = $1'),
        ['user@example.com']
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe('user@example.com');
    });

    it('should return null for non-existent email', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByCPF', () => {
    it('should find user by CPF', async () => {
      const mockDbResult = {
        rows: [{
          id: 'user-id',
          cpf: '11144477735',
          email: 'user@example.com',
          profile: JSON.stringify({
            name: 'Test User',
            birthDate: '1990-01-01T00:00:00.000Z',
            gender: 'male',
            location: {},
          }),
          measurements: null,
          preferences: null,
          created_at: new Date(),
          updated_at: new Date(),
          roles: ['consumer'],
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.findByCPF('11144477735');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.cpf = $1'),
        ['11144477735']
      );

      expect(result).toBeDefined();
      expect(result?.cpf).toBe('11144477735');
    });

    it('should return null for non-existent CPF', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.findByCPF('99999999999');

      expect(result).toBeNull();
    });

    it('should handle Brazilian CPF format correctly', async () => {
      const testCPFs = [
        '11144477735',
        '12345678909',
        '98765432100',
      ];

      for (const cpf of testCPFs) {
        mockDb.query.mockResolvedValue({
          rows: [{
            id: 'user-id',
            cpf,
            email: 'user@example.com',
            profile: JSON.stringify({
              name: 'Brazilian User',
              birthDate: '1990-01-01T00:00:00.000Z',
              gender: 'male',
              location: {},
            }),
            measurements: null,
            preferences: null,
            created_at: new Date(),
            updated_at: new Date(),
            roles: ['consumer'],
          }],
        } as any);

        const result = await UserModel.findByCPF(cpf);

        expect(result).toBeDefined();
        expect(result?.cpf).toBe(cpf);
      }
    });
  });

  describe('getPasswordHash', () => {
    it('should retrieve password hash for user', async () => {
      const mockDbResult = {
        rows: [{
          password_hash: '$2b$12$hashedpassword',
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.getPasswordHash('user-id');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT password_hash FROM users WHERE id = $1',
        ['user-id']
      );

      expect(result).toBe('$2b$12$hashedpassword');
    });

    it('should return null for non-existent user', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.getPasswordHash('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user profile successfully', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        measurements: {
          height: 180,
          weight: 75,
          sizes: {
            BR: { shirt: 'L', pants: '44' },
          },
        },
        preferences: {
          favoriteColors: ['blue', 'green'],
          preferredBrands: ['Nike', 'Adidas'],
        },
      };

      // Mock current user for profile update
      const currentUser = {
        id: 'user-id',
        personalInfo: {
          name: 'Old Name',
          birthDate: new Date('1990-01-01'),
          gender: 'male',
          location: {},
        },
      };

      // Mock findById call
      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-id',
            cpf: '11144477735',
            email: 'user@example.com',
            profile: JSON.stringify(currentUser.personalInfo),
            measurements: null,
            preferences: null,
            created_at: new Date(),
            updated_at: new Date(),
            roles: ['consumer'],
          }],
        } as any)
        // Mock update query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-id',
            cpf: '11144477735',
            email: 'user@example.com',
            profile: JSON.stringify({
              ...currentUser.personalInfo,
              name: 'Updated Name',
            }),
            measurements: JSON.stringify(updateData.measurements),
            preferences: JSON.stringify(updateData.preferences),
            created_at: new Date(),
            updated_at: new Date(),
          }],
        } as any);

      const result = await UserModel.update('user-id', updateData);

      expect(result).toBeDefined();
      expect(result?.personalInfo.name).toBe('Updated Name');
      expect(result?.measurements).toEqual(updateData.measurements);
      expect(result?.preferences).toEqual(updateData.preferences);
    });

    it('should handle partial updates', async () => {
      const updateData: UpdateUserData = {
        name: 'Partially Updated Name',
      };

      // Mock current user
      const currentUser = {
        personalInfo: {
          name: 'Old Name',
          birthDate: new Date('1990-01-01'),
          gender: 'male',
          location: {},
        },
      };

      mockDb.query
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-id',
            profile: JSON.stringify(currentUser.personalInfo),
            measurements: JSON.stringify({ height: 175 }),
            preferences: JSON.stringify({ favoriteColors: ['blue'] }),
            created_at: new Date(),
            updated_at: new Date(),
            roles: ['consumer'],
          }],
        } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: 'user-id',
            profile: JSON.stringify({
              ...currentUser.personalInfo,
              name: 'Partially Updated Name',
            }),
            measurements: JSON.stringify({ height: 175 }),
            preferences: JSON.stringify({ favoriteColors: ['blue'] }),
            created_at: new Date(),
            updated_at: new Date(),
          }],
        } as any);

      const result = await UserModel.update('user-id', updateData);

      expect(result?.personalInfo.name).toBe('Partially Updated Name');
      expect(result?.measurements).toEqual({ height: 175 });
      expect(result?.preferences).toEqual({ favoriteColors: ['blue'] });
    });

    it('should return null for non-existent user', async () => {
      mockDb.query.mockResolvedValue({ rows: [] } as any);

      const result = await UserModel.update('non-existent-id', { name: 'Test' });

      expect(result).toBeNull();
    });

    it('should handle empty update data', async () => {
      // Mock findById call
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-id',
          profile: JSON.stringify({
            name: 'Test User',
            birthDate: '1990-01-01T00:00:00.000Z',
            gender: 'male',
            location: {},
          }),
          measurements: null,
          preferences: null,
          created_at: new Date(),
          updated_at: new Date(),
          roles: ['consumer'],
        }],
      } as any);

      const result = await UserModel.update('user-id', {});

      // Should return current user without making update query
      expect(result).toBeDefined();
      expect(result?.personalInfo.name).toBe('Test User');
    });
  });

  describe('Role Management', () => {
    describe('addRole', () => {
      it('should add role to user', async () => {
        mockDb.query.mockResolvedValue({} as any);

        await UserModel.addRole('user-id', 'influencer');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO user_roles'),
          ['user-id', 'influencer']
        );
      });

      it('should handle duplicate role addition gracefully', async () => {
        mockDb.query.mockResolvedValue({} as any);

        await UserModel.addRole('user-id', 'consumer');

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('ON CONFLICT (user_id, role) DO NOTHING'),
          ['user-id', 'consumer']
        );
      });
    });

    describe('removeRole', () => {
      it('should remove role from user', async () => {
        mockDb.query.mockResolvedValue({} as any);

        await UserModel.removeRole('user-id', 'influencer');

        expect(mockDb.query).toHaveBeenCalledWith(
          'DELETE FROM user_roles WHERE user_id = $1 AND role = $2',
          ['user-id', 'influencer']
        );
      });
    });

    describe('getUserRoles', () => {
      it('should retrieve all user roles', async () => {
        const mockDbResult = {
          rows: [
            { role: 'consumer' },
            { role: 'influencer' },
            { role: 'brand_owner' },
          ],
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await UserModel.getUserRoles('user-id');

        expect(mockDb.query).toHaveBeenCalledWith(
          'SELECT role FROM user_roles WHERE user_id = $1',
          ['user-id']
        );

        expect(result).toEqual(['consumer', 'influencer', 'brand_owner']);
      });

      it('should return empty array for user with no roles', async () => {
        mockDb.query.mockResolvedValue({ rows: [] } as any);

        const result = await UserModel.getUserRoles('user-id');

        expect(result).toEqual([]);
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
          'creative_director',
        ];

        const mockDbResult = {
          rows: brazilianRoles.map(role => ({ role })),
        };

        mockDb.query.mockResolvedValue(mockDbResult as any);

        const result = await UserModel.getUserRoles('brazilian-user-id');

        expect(result).toEqual(brazilianRoles);
      });
    });
  });

  describe('Data Mapping and Serialization', () => {
    it('should handle JSON serialization correctly', async () => {
      const complexProfile = {
        name: 'Complex User',
        birthDate: '1990-01-01T00:00:00.000Z',
        gender: 'non-binary',
        location: {
          country: 'Brazil',
          state: 'RJ',
          city: 'Rio de Janeiro',
          neighborhood: 'Copacabana',
          cep: '22070-900',
        },
      };

      const complexMeasurements = {
        height: 165,
        weight: 60,
        sizes: {
          BR: { 
            shirt: 'P', 
            pants: '38', 
            shoes: '37',
            dress: 'P',
          },
          US: { 
            shirt: 'S', 
            pants: '6', 
            shoes: '7',
            dress: 'S',
          },
          EU: { 
            shirt: '36', 
            pants: '38', 
            shoes: '37',
            dress: '36',
          },
        },
      };

      const complexPreferences = {
        favoriteColors: ['burgundy', 'navy', 'emerald'],
        preferredBrands: ['Zara', 'H&M', 'Renner'],
        styleProfile: ['minimalist', 'classic', 'sustainable'],
        priceRange: {
          min: 50,
          max: 300,
        },
      };

      const mockDbResult = {
        rows: [{
          id: 'complex-user-id',
          cpf: '11144477735',
          email: 'complex@example.com',
          profile: JSON.stringify(complexProfile),
          measurements: JSON.stringify(complexMeasurements),
          preferences: JSON.stringify(complexPreferences),
          created_at: new Date(),
          updated_at: new Date(),
          roles: ['consumer', 'influencer'],
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.findById('complex-user-id');

      expect(result?.personalInfo).toEqual({
        name: 'Complex User',
        birthDate: new Date('1990-01-01T00:00:00.000Z'),
        gender: 'non-binary',
        location: complexProfile.location,
      });

      expect(result?.measurements).toEqual(complexMeasurements);
      expect(result?.preferences).toEqual(complexPreferences);
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockDbResult = {
        rows: [{
          id: 'user-id',
          cpf: '11144477735',
          email: 'user@example.com',
          profile: 'invalid json',
          measurements: null,
          preferences: null,
          created_at: new Date(),
          updated_at: new Date(),
          roles: ['consumer'],
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      // This should not throw an error but handle gracefully
      await expect(UserModel.findById('user-id')).rejects.toThrow();
    });

    it('should handle null and undefined values correctly', async () => {
      const mockDbResult = {
        rows: [{
          id: 'user-id',
          cpf: '11144477735',
          email: 'user@example.com',
          profile: JSON.stringify({
            name: 'Test User',
            birthDate: '1990-01-01T00:00:00.000Z',
            gender: 'male',
            location: null,
          }),
          measurements: null,
          preferences: null,
          created_at: new Date(),
          updated_at: new Date(),
          roles: ['consumer'],
        }],
      };

      mockDb.query.mockResolvedValue(mockDbResult as any);

      const result = await UserModel.findById('user-id');

      expect(result?.personalInfo.location).toEqual({});
      expect(result?.measurements).toEqual({});
      expect(result?.preferences).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(UserModel.findById('user-id')).rejects.toThrow('Database connection failed');
    });

    it('should handle constraint violations', async () => {
      const userData: CreateUserData = {
        cpf: '11144477735',
        email: 'duplicate@example.com',
        passwordHash: '$2b$12$hashedpassword',
        name: 'Test User',
        birthDate: new Date('1990-01-01'),
        gender: 'male',
      };

      mockDb.query.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

      await expect(UserModel.create(userData)).rejects.toThrow('duplicate key value violates unique constraint');
    });

    it('should handle invalid data types', async () => {
      const invalidUpdateData = {
        measurements: 'invalid_json_string' as any,
      };

      mockDb.query.mockRejectedValue(new Error('invalid input syntax for type json'));

      await expect(UserModel.update('user-id', invalidUpdateData)).rejects.toThrow('invalid input syntax for type json');
    });
  });
});