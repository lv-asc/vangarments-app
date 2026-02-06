/**
 * CPF (Individual Taxpayer Registry) validation utilities for Brazilian users
 */

export class CPFValidator {
  /**
   * Validates CPF format and checksum
   */
  static isValid(cpf: string): boolean {
    // Handle null/undefined inputs
    if (!cpf || typeof cpf !== 'string') {
      return false;
    }

    // Remove formatting
    const cleanCPF = cpf.replace(/[^\d]/g, '');

    // Check length
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Check for known invalid patterns
    const invalidPatterns = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ];

    if (invalidPatterns.includes(cleanCPF)) {
      return false;
    }

    // Validate checksum digits
    return this.validateChecksum(cleanCPF);
  }

  /**
   * Formats CPF with standard Brazilian formatting
   */
  static format(cpf: string): string {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (cleanCPF.length !== 11) {
      throw new Error('Invalid CPF length');
    }

    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Removes formatting from CPF
   */
  static clean(cpf: string): string {
    return cpf.replace(/[^\d]/g, '');
  }

  private static validateChecksum(cpf: string): boolean {
    // Calculate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }

    let checkDigit1 = 11 - (sum % 11);
    if (checkDigit1 === 10 || checkDigit1 === 11) {
      checkDigit1 = 0;
    }

    if (checkDigit1 !== parseInt(cpf.charAt(9))) {
      return false;
    }

    // Calculate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }

    let checkDigit2 = 11 - (sum % 11);
    if (checkDigit2 === 10 || checkDigit2 === 11) {
      checkDigit2 = 0;
    }

    return checkDigit2 === parseInt(cpf.charAt(10));
  }
}