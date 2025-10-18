/**
 * Unit tests for marketplace fee calculations
 * Tests Brazilian market fee structures and calculations
 * Requirements: 3.1, 3.2, 3.5
 */

import { PaymentService } from '../../src/services/paymentService';

describe('Marketplace Fee Calculations', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  describe('Brazilian Payment Method Fees', () => {
    it('should calculate PIX fees correctly', () => {
      const amount = 100.00;
      const fees = paymentService.calculateFees(amount, 'pix');

      expect(fees.platformFee).toBe(5.00); // 5%
      expect(fees.paymentFee).toBe(1.00); // 1% (under R$10 cap)
      expect(fees.totalFees).toBe(6.00);
      expect(fees.netAmount).toBe(94.00);
    });

    it('should apply PIX fee cap correctly', () => {
      const amount = 2000.00; // Large amount to test cap
      const fees = paymentService.calculateFees(amount, 'pix');

      expect(fees.platformFee).toBe(100.00); // 5%
      expect(fees.paymentFee).toBe(10.00); // Capped at R$10
      expect(fees.totalFees).toBe(110.00);
      expect(fees.netAmount).toBe(1890.00);
    });

    it('should calculate credit card fees correctly', () => {
      const amount = 100.00;
      const fees = paymentService.calculateFees(amount, 'credit_card');

      expect(fees.platformFee).toBe(5.00); // 5%
      expect(fees.paymentFee).toBe(3.20); // 2.9% + R$0.30
      expect(fees.totalFees).toBe(8.20);
      expect(fees.netAmount).toBe(91.80);
    });

    it('should calculate bank transfer fees correctly', () => {
      const amount = 500.00;
      const fees = paymentService.calculateFees(amount, 'bank_transfer');

      expect(fees.platformFee).toBe(25.00); // 5%
      expect(fees.paymentFee).toBe(7.50); // 1.5% (under R$15 cap)
      expect(fees.totalFees).toBe(32.50);
      expect(fees.netAmount).toBe(467.50);
    });

    it('should apply bank transfer fee cap correctly', () => {
      const amount = 2000.00; // Large amount to test cap
      const fees = paymentService.calculateFees(amount, 'bank_transfer');

      expect(fees.platformFee).toBe(100.00); // 5%
      expect(fees.paymentFee).toBe(15.00); // Capped at R$15
      expect(fees.totalFees).toBe(115.00);
      expect(fees.netAmount).toBe(1885.00);
    });

    it('should use default fee for unknown payment methods', () => {
      const amount = 100.00;
      const fees = paymentService.calculateFees(amount, 'unknown_method');

      expect(fees.platformFee).toBe(5.00); // 5%
      expect(fees.paymentFee).toBe(2.50); // 2.5% default
      expect(fees.totalFees).toBe(7.50);
      expect(fees.netAmount).toBe(92.50);
    });
  });

  describe('Payment Method Validation', () => {
    it('should validate PIX payment method', () => {
      const pixMethod = {
        type: 'pix',
        details: {},
      };

      const validation = paymentService.validatePaymentMethod(pixMethod);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate credit card payment method', () => {
      const validCreditCard = {
        type: 'credit_card',
        details: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
        },
      };

      const validation = paymentService.validatePaymentMethod(validCreditCard);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid credit card payment method', () => {
      const invalidCreditCard = {
        type: 'credit_card',
        details: {
          // Missing required fields
        },
      };

      const validation = paymentService.validatePaymentMethod(invalidCreditCard);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Card number is required');
      expect(validation.errors).toContain('Card expiry date is required');
      expect(validation.errors).toContain('CVV is required');
    });

    it('should reject invalid payment method type', () => {
      const invalidMethod = {
        type: 'invalid_type',
        details: {},
      };

      const validation = paymentService.validatePaymentMethod(invalidMethod);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid payment method type');
    });

    it('should validate bank transfer payment method', () => {
      const bankTransfer = {
        type: 'bank_transfer',
        details: {
          bankCode: '001', // Banco do Brasil
        },
      };

      const validation = paymentService.validatePaymentMethod(bankTransfer);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject bank transfer without bank code', () => {
      const invalidBankTransfer = {
        type: 'bank_transfer',
        details: {},
      };

      const validation = paymentService.validatePaymentMethod(invalidBankTransfer);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Bank code is required for bank transfer');
    });
  });

  describe('Available Payment Methods', () => {
    it('should return Brazilian market payment methods', () => {
      const methods = paymentService.getAvailablePaymentMethods();

      expect(methods).toHaveLength(5);
      
      const pixMethod = methods.find(m => m.type === 'pix');
      expect(pixMethod).toBeDefined();
      expect(pixMethod?.name).toBe('PIX');
      expect(pixMethod?.supported).toBe(true);
      expect(pixMethod?.fees).toBe('1% (max R$10)');

      const creditCardMethod = methods.find(m => m.type === 'credit_card');
      expect(creditCardMethod).toBeDefined();
      expect(creditCardMethod?.supported).toBe(true);
      expect(creditCardMethod?.fees).toBe('2.9% + R$0.30');

      const digitalWalletMethod = methods.find(m => m.type === 'digital_wallet');
      expect(digitalWalletMethod).toBeDefined();
      expect(digitalWalletMethod?.supported).toBe(false); // Coming soon
    });
  });
});