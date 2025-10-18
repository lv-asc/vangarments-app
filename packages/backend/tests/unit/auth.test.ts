import { AuthUtils } from '../../src/utils/auth';

// Simple unit tests for authentication utilities
describe('Authentication Utils Unit Tests', () => {
  describe('Password Hashing', () => {
    test('should hash password', async () => {
      const password = 'testpassword123';
      const hash = await AuthUtils.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    test('should compare password correctly', async () => {
      const password = 'testpassword123';
      const hash = await AuthUtils.hashPassword(password);
      
      const isValid = await AuthUtils.comparePassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await AuthUtils.comparePassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Operations', () => {
    test('should generate and verify JWT token', () => {
      const payload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      const token = AuthUtils.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = AuthUtils.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.roles).toEqual(payload.roles);
    });

    test('should throw error for invalid token', () => {
      expect(() => AuthUtils.verifyToken('invalid-token')).toThrow();
    });
  });
});