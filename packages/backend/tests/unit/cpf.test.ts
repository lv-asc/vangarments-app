import { CPFValidator } from '../../src/utils/cpf';

describe('CPF Validation Unit Tests', () => {
  describe('Valid CPF Numbers', () => {
    test('should validate correct CPF with checksum', () => {
      expect(CPFValidator.isValid('11144477735')).toBe(true);
      expect(CPFValidator.isValid('111.444.777-35')).toBe(true);
    });

    test('should validate another correct CPF', () => {
      expect(CPFValidator.isValid('12345678909')).toBe(true);
      expect(CPFValidator.isValid('123.456.789-09')).toBe(true);
    });
  });

  describe('Invalid CPF Numbers', () => {
    test('should reject CPF with wrong checksum', () => {
      expect(CPFValidator.isValid('11144477734')).toBe(false);
      expect(CPFValidator.isValid('123.456.789-08')).toBe(false);
    });

    test('should reject known invalid patterns', () => {
      expect(CPFValidator.isValid('00000000000')).toBe(false);
      expect(CPFValidator.isValid('111.111.111-11')).toBe(false);
      expect(CPFValidator.isValid('222.222.222-22')).toBe(false);
    });

    test('should reject invalid lengths', () => {
      expect(CPFValidator.isValid('12345')).toBe(false);
      expect(CPFValidator.isValid('123456789012')).toBe(false);
      expect(CPFValidator.isValid('')).toBe(false);
    });
  });

  describe('CPF Formatting', () => {
    test('should format CPF correctly', () => {
      expect(CPFValidator.format('11144477735')).toBe('111.444.777-35');
    });

    test('should throw error for invalid length', () => {
      expect(() => CPFValidator.format('12345')).toThrow('Invalid CPF length');
    });
  });

  describe('CPF Cleaning', () => {
    test('should remove formatting', () => {
      expect(CPFValidator.clean('111.444.777-35')).toBe('11144477735');
      expect(CPFValidator.clean('111.444.777-35 abc')).toBe('11144477735');
    });
  });
});