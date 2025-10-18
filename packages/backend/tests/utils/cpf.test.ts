import { CPFValidator } from '../../src/utils/cpf';

describe('CPFValidator', () => {
  describe('isValid', () => {
    it('should validate correct CPF numbers', () => {
      // Valid CPF numbers with correct checksums
      const validCPFs = [
        '11144477735',
        '111.444.777-35',
        '12345678909',
        '123.456.789-09',
        '98765432100',
        '987.654.321-00',
      ];

      validCPFs.forEach(cpf => {
        expect(CPFValidator.isValid(cpf)).toBe(true);
      });
    });

    it('should reject invalid CPF numbers', () => {
      const invalidCPFs = [
        '11144477734', // Wrong checksum
        '123.456.789-08', // Wrong checksum
        '12345678900', // Wrong checksum
        '000.000.000-00', // Invalid pattern
        '111.111.111-11', // Invalid pattern
        '222.222.222-22', // Invalid pattern
        '12345', // Too short
        '123456789012', // Too long
        'abc.def.ghi-jk', // Non-numeric
        '', // Empty string
        '   ', // Whitespace only
        '123.456.789', // Missing check digits
        '123-456-789-01', // Wrong format
        '123.456.789-001', // Extra digit
      ];

      invalidCPFs.forEach(cpf => {
        expect(CPFValidator.isValid(cpf)).toBe(false);
      });
    });

    it('should reject known invalid patterns', () => {
      const invalidPatterns = [
        '00000000000',
        '11111111111',
        '22222222222',
        '33333333333',
        '44444444444',
        '55555555555',
        '66666666666',
        '77777777777',
        '88888888888',
        '99999999999',
      ];

      invalidPatterns.forEach(cpf => {
        expect(CPFValidator.isValid(cpf)).toBe(false);
      });
    });

    it('should handle CPF with and without formatting', () => {
      const cpf = '11144477735';
      const formattedCPF = '111.444.777-35';

      expect(CPFValidator.isValid(cpf)).toBe(true);
      expect(CPFValidator.isValid(formattedCPF)).toBe(true);
    });
  });

  describe('format', () => {
    it('should format CPF correctly', () => {
      const cpf = '11144477735';
      const expected = '111.444.777-35';

      expect(CPFValidator.format(cpf)).toBe(expected);
    });

    it('should throw error for invalid length CPF', () => {
      const invalidCPF = '12345';

      expect(() => CPFValidator.format(invalidCPF)).toThrow('Invalid CPF length');
    });

    it('should format already formatted CPF', () => {
      const formattedCPF = '111.444.777-35';
      const expected = '111.444.777-35';

      expect(CPFValidator.format(formattedCPF)).toBe(expected);
    });
  });

  describe('clean', () => {
    it('should remove formatting from CPF', () => {
      const formattedCPF = '111.444.777-35';
      const expected = '11144477735';

      expect(CPFValidator.clean(formattedCPF)).toBe(expected);
    });

    it('should handle already clean CPF', () => {
      const cleanCPF = '11144477735';

      expect(CPFValidator.clean(cleanCPF)).toBe(cleanCPF);
    });

    it('should remove all non-numeric characters', () => {
      const messyCPF = '111.444.777-35 abc';
      const expected = '11144477735';

      expect(CPFValidator.clean(messyCPF)).toBe(expected);
    });

    it('should handle edge cases', () => {
      expect(CPFValidator.clean('')).toBe('');
      expect(CPFValidator.clean('   ')).toBe('');
      expect(CPFValidator.clean('abc')).toBe('');
      expect(CPFValidator.clean('123abc456def789ghi01')).toBe('12345678901');
    });
  });

  describe('Edge cases and security', () => {
    it('should handle null and undefined inputs safely', () => {
      // These should not crash the application
      expect(() => CPFValidator.isValid(null as any)).not.toThrow();
      expect(() => CPFValidator.isValid(undefined as any)).not.toThrow();
      expect(CPFValidator.isValid(null as any)).toBe(false);
      expect(CPFValidator.isValid(undefined as any)).toBe(false);
    });

    it('should validate checksum algorithm correctly', () => {
      // Test specific CPF with known checksum calculation
      const cpf = '11144477735';
      expect(CPFValidator.isValid(cpf)).toBe(true);
      
      // Modify last digit to make it invalid
      const invalidCpf = '11144477734';
      expect(CPFValidator.isValid(invalidCpf)).toBe(false);
    });

    it('should handle Brazilian market requirements', () => {
      // Test that CPF validation meets Brazilian legal requirements
      const brazilianTestCases = [
        { cpf: '11144477735', valid: true, description: 'Standard valid CPF' },
        { cpf: '000.000.000-00', valid: false, description: 'Reserved invalid pattern' },
        { cpf: '123.456.789-09', valid: true, description: 'Another valid CPF' },
      ];

      brazilianTestCases.forEach(testCase => {
        expect(CPFValidator.isValid(testCase.cpf)).toBe(testCase.valid);
      });
    });
  });
});