/**
 * Integration tests for user registration flow
 * Tests the complete registration process including CPF validation
 */

import { CPFValidator } from '../../src/utils/cpf';
import { AuthUtils } from '../../src/utils/auth';

describe('User Registration Integration Tests', () => {
  describe('CPF Validation in Registration Flow', () => {
    test('should validate CPF during registration process', () => {
      // Test valid CPF
      const validCPF = '111.444.777-35';
      expect(CPFValidator.isValid(validCPF)).toBe(true);
      
      const cleanCPF = CPFValidator.clean(validCPF);
      expect(cleanCPF).toBe('11144477735');
      
      // Test invalid CPF
      const invalidCPF = '111.444.777-34';
      expect(CPFValidator.isValid(invalidCPF)).toBe(false);
    });

    test('should handle CPF uniqueness check scenario', () => {
      const cpf1 = '111.444.777-35';
      const cpf2 = '123.456.789-09';
      
      // Both should be valid but different
      expect(CPFValidator.isValid(cpf1)).toBe(true);
      expect(CPFValidator.isValid(cpf2)).toBe(true);
      expect(CPFValidator.clean(cpf1)).not.toBe(CPFValidator.clean(cpf2));
    });
  });

  describe('Authentication Flow Integration', () => {
    test('should complete password hashing and token generation flow', async () => {
      const password = 'userpassword123';
      const userPayload = {
        id: 'test-user-id',
        userId: 'test-user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      // Hash password (as would happen during registration)
      const hashedPassword = await AuthUtils.hashPassword(password);
      expect(hashedPassword).toBeDefined();

      // Verify password (as would happen during login)
      const isValidPassword = await AuthUtils.comparePassword(password, hashedPassword);
      expect(isValidPassword).toBe(true);

      // Generate token (as would happen after successful login)
      const token = AuthUtils.generateToken(userPayload);
      expect(token).toBeDefined();

      // Verify token (as would happen on protected routes)
      const decodedPayload = AuthUtils.verifyToken(token);
      expect(decodedPayload.userId).toBe(userPayload.userId);
      expect(decodedPayload.email).toBe(userPayload.email);
      expect(decodedPayload.roles).toEqual(userPayload.roles);
    });
  });

  describe('Role-Based Access Control Integration', () => {
    test('should handle different user roles correctly', () => {
      const consumerPayload = {
        id: 'consumer-id',
        userId: 'consumer-id',
        email: 'consumer@example.com',
        roles: ['consumer'],
      };

      const influencerPayload = {
        id: 'influencer-id',
        userId: 'influencer-id',
        email: 'influencer@example.com',
        roles: ['consumer', 'influencer'],
      };

      const brandOwnerPayload = {
        id: 'brand-owner-id',
        userId: 'brand-owner-id',
        email: 'brand@example.com',
        roles: ['consumer', 'brand_owner'],
      };

      // Generate tokens for different roles
      const consumerToken = AuthUtils.generateToken(consumerPayload);
      const influencerToken = AuthUtils.generateToken(influencerPayload);
      const brandOwnerToken = AuthUtils.generateToken(brandOwnerPayload);

      // Verify role information is preserved
      const decodedConsumer = AuthUtils.verifyToken(consumerToken);
      expect(decodedConsumer.roles).toEqual(['consumer']);

      const decodedInfluencer = AuthUtils.verifyToken(influencerToken);
      expect(decodedInfluencer.roles).toEqual(['consumer', 'influencer']);

      const decodedBrandOwner = AuthUtils.verifyToken(brandOwnerToken);
      expect(decodedBrandOwner.roles).toEqual(['consumer', 'brand_owner']);
    });

    test('should validate role requirements', () => {
      const userRoles = ['consumer', 'influencer'];
      
      // Test role checking logic
      const hasConsumerRole = userRoles.includes('consumer');
      const hasInfluencerRole = userRoles.includes('influencer');
      const hasBrandOwnerRole = userRoles.includes('brand_owner');
      const hasAdminRole = userRoles.includes('admin');

      expect(hasConsumerRole).toBe(true);
      expect(hasInfluencerRole).toBe(true);
      expect(hasBrandOwnerRole).toBe(false);
      expect(hasAdminRole).toBe(false);

      // Test multiple role requirements (OR logic)
      const canAccessContentCreator = userRoles.some(role => 
        ['influencer', 'brand_owner'].includes(role)
      );
      expect(canAccessContentCreator).toBe(true);

      const canAccessAdmin = userRoles.some(role => 
        ['admin'].includes(role)
      );
      expect(canAccessAdmin).toBe(false);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid CPF in registration flow', () => {
      const invalidCPFs = [
        '000.000.000-00',
        '111.111.111-11',
        '123.456.789-00',
        '12345',
        'abc.def.ghi-jk',
      ];

      invalidCPFs.forEach(cpf => {
        expect(CPFValidator.isValid(cpf)).toBe(false);
      });
    });

    test('should handle authentication errors', async () => {
      const password = 'correctpassword';
      const wrongPassword = 'wrongpassword';
      
      const hash = await AuthUtils.hashPassword(password);
      
      // Correct password should work
      const validAuth = await AuthUtils.comparePassword(password, hash);
      expect(validAuth).toBe(true);
      
      // Wrong password should fail
      const invalidAuth = await AuthUtils.comparePassword(wrongPassword, hash);
      expect(invalidAuth).toBe(false);
    });

    test('should handle token validation errors', () => {
      const validPayload = {
        id: 'user-id',
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['consumer'],
      };

      // Valid token should work
      const validToken = AuthUtils.generateToken(validPayload);
      expect(() => AuthUtils.verifyToken(validToken)).not.toThrow();

      // Invalid tokens should throw
      expect(() => AuthUtils.verifyToken('invalid-token')).toThrow();
      expect(() => AuthUtils.verifyToken('')).toThrow();
      expect(() => AuthUtils.verifyToken('Bearer invalid-token')).toThrow();
    });
  });
});