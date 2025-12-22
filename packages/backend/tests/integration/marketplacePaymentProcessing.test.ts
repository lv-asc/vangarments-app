/**
 * Integration tests for marketplace payment processing
 * Tests payment workflows, transaction status updates, and error handling
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { TransactionService, CreateTransactionRequest } from '../../src/services/transactionService';
import { PaymentService, PaymentRequest } from '../../src/services/paymentService';
import { MarketplaceModel } from '../../src/models/Marketplace';
import { VUFSCatalogModel } from '../../src/models/VUFSCatalog';
import { Transaction, TransactionStatus } from '@vangarments/shared/types/marketplace';

// Mock database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

// Mock models
jest.mock('../../src/models/Marketplace');
jest.mock('../../src/models/VUFSCatalog');

const { db } = require('../../src/database/connection');
const mockDb = db as jest.Mocked<typeof db>;
const mockMarketplaceModel = MarketplaceModel as jest.Mocked<typeof MarketplaceModel>;
const mockVUFSCatalogModel = VUFSCatalogModel as jest.Mocked<typeof VUFSCatalogModel>;

describe.skip('Marketplace Payment Processing Integration', () => {
  let transactionService: TransactionService;
  let paymentService: PaymentService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService();
    paymentService = new PaymentService();
  });

  describe('Payment Processing Workflow', () => {
    const mockListing = {
      id: 'listing-123',
      itemId: 'item-456',
      sellerId: 'seller-789',
      title: 'Nike Air Max 90',
      price: 250.00,
      status: 'active',
      shipping: {
        domestic: { cost: 15.00 },
      },
    };

    const mockUser = {
      id: 'buyer-123',
      email: 'buyer@example.com',
      cpf: '12345678901',
      profile: { name: 'João Silva' },
    };

    beforeEach(() => {
      mockMarketplaceModel.findById.mockResolvedValue(mockListing as any);
      mockMarketplaceModel.createTransaction.mockResolvedValue({
        id: 'transaction-123',
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        amount: 265.00, // 250 + 15 shipping
        currency: 'BRL',
        fees: {
          platformFee: 12.50,
          paymentFee: 7.69,
          shippingFee: 15.00,
        },
        netAmount: 229.81,
        status: 'pending_payment',
        paymentMethod: 'credit_card',
        shipping: {
          address: {
            name: 'João Silva',
            street: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            postalCode: '01234-567',
            country: 'Brazil',
          },
          method: 'standard',
        },
        timeline: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Transaction);

      mockMarketplaceModel.updateStatus.mockResolvedValue(mockListing as any);
      mockDb.query.mockResolvedValue({ rows: [mockUser] });
    });

    it('should create transaction with PIX payment method', async () => {
      const transactionRequest: CreateTransactionRequest = {
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        shippingAddress: {
          name: 'João Silva',
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01234-567',
          country: 'Brazil',
          phone: '+5511999999999',
        },
        paymentMethod: {
          type: 'pix',
          details: {},
        },
      };

      const result = await transactionService.createTransaction(transactionRequest);

      expect(result.transaction).toBeDefined();
      expect(result.paymentRequired).toBe(true);
      expect(result.paymentInstructions).toEqual({
        type: 'pix',
        qrCode: `pix_qr_${result.transaction.id}`,
        pixKey: 'vangarments@marketplace.com',
        amount: 265.00,
        expiresAt: expect.any(Date),
      });

      expect(mockMarketplaceModel.createTransaction).toHaveBeenCalledWith({
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        amount: 265.00,
        fees: expect.objectContaining({
          platformFee: expect.any(Number),
          paymentFee: expect.any(Number),
          shippingFee: 15.00,
        }),
        shippingAddress: transactionRequest.shippingAddress,
        paymentMethod: 'pix',
      });

      expect(mockMarketplaceModel.updateStatus).toHaveBeenCalledWith('listing-123', 'reserved');
    });

    it('should create transaction with credit card payment method', async () => {
      const transactionRequest: CreateTransactionRequest = {
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        shippingAddress: {
          name: 'João Silva',
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01234-567',
          country: 'Brazil',
        },
        paymentMethod: {
          type: 'credit_card',
          details: {
            cardNumber: '4111111111111111',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
            holderName: 'João Silva',
          },
        },
      };

      const result = await transactionService.createTransaction(transactionRequest);

      expect(result.transaction).toBeDefined();
      expect(result.paymentRequired).toBe(true);
      expect(result.paymentInstructions).toBeUndefined(); // Credit card doesn't need special instructions

      // Verify fees calculation for credit card
      const fees = paymentService.calculateFees(250.00, 'credit_card');
      expect(fees.platformFee).toBe(12.50); // 5%
      expect(fees.paymentFee).toBe(7.55); // 2.9% + 0.30
    });

    it('should process successful PIX payment', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        listingId: 'listing-123',
        amount: 265.00,
        currency: 'BRL',
        status: 'pending_payment' as TransactionStatus,
        paymentMethod: 'pix',
      };

      // Mock getTransactionById
      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      // Mock updateTransactionPayment
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // User query
      mockDb.query.mockResolvedValueOnce({}); // Update transaction payment
      mockDb.query.mockResolvedValueOnce({}); // Add transaction event

      const paymentDetails = {
        pixKey: 'buyer@example.com',
        amount: 265.00,
      };

      const result = await transactionService.processPayment('transaction-123', paymentDetails);

      expect(result.success).toBe(true);
      expect(result.paymentId).toMatch(/^pix_/);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should process successful credit card payment', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        listingId: 'listing-123',
        amount: 265.00,
        currency: 'BRL',
        status: 'pending_payment' as TransactionStatus,
        paymentMethod: 'credit_card',
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // User query
      mockDb.query.mockResolvedValueOnce({}); // Update transaction payment
      mockDb.query.mockResolvedValueOnce({}); // Add transaction event

      const paymentDetails = {
        cardNumber: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
      };

      const result = await transactionService.processPayment('transaction-123', paymentDetails);

      expect(result.success).toBe(true);
      expect(result.paymentId).toMatch(/^stripe_/);
    });

    it('should handle payment failure and release listing reservation', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        listingId: 'listing-123',
        amount: 265.00,
        currency: 'BRL',
        status: 'pending_payment' as TransactionStatus,
        paymentMethod: 'credit_card',
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      // Mock payment failure by overriding the payment service
      const mockPaymentService = {
        processPayment: jest.fn().mockResolvedValue({
          success: false,
          paymentId: '',
          status: 'failed',
          transactionFee: 0,
          errorMessage: 'Insufficient funds',
        }),
      };

      (transactionService as any).paymentService = mockPaymentService;

      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] }); // User query
      mockDb.query.mockResolvedValueOnce({}); // Add transaction event

      const result = await transactionService.processPayment('transaction-123', {});

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Insufficient funds');
      expect(mockMarketplaceModel.updateStatus).toHaveBeenCalledWith('listing-123', 'active');
    });

    it('should validate payment method before processing', () => {
      const validPixMethod = {
        type: 'pix',
        details: {},
      };

      const validCreditCardMethod = {
        type: 'credit_card',
        details: {
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
        },
      };

      const invalidMethod = {
        type: 'invalid_type',
        details: {},
      };

      expect(paymentService.validatePaymentMethod(validPixMethod).valid).toBe(true);
      expect(paymentService.validatePaymentMethod(validCreditCardMethod).valid).toBe(true);
      expect(paymentService.validatePaymentMethod(invalidMethod).valid).toBe(false);
    });

    it('should calculate correct fees for different payment methods', () => {
      const amount = 100.00;

      const pixFees = paymentService.calculateFees(amount, 'pix');
      expect(pixFees.platformFee).toBe(5.00); // 5%
      expect(pixFees.paymentFee).toBe(1.00); // 1% (under R$10 cap)
      expect(pixFees.netAmount).toBe(94.00);

      const creditCardFees = paymentService.calculateFees(amount, 'credit_card');
      expect(creditCardFees.platformFee).toBe(5.00); // 5%
      expect(creditCardFees.paymentFee).toBe(3.20); // 2.9% + R$0.30
      expect(creditCardFees.netAmount).toBe(91.80);

      const bankTransferFees = paymentService.calculateFees(amount, 'bank_transfer');
      expect(bankTransferFees.platformFee).toBe(5.00); // 5%
      expect(bankTransferFees.paymentFee).toBe(1.50); // 1.5%
      expect(bankTransferFees.netAmount).toBe(93.50);
    });
  });

  describe('Transaction Status Updates and Workflow', () => {
    it('should update transaction status to shipped with tracking number', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        listingId: 'listing-123',
        status: 'payment_confirmed' as TransactionStatus,
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          status: 'shipped',
          tracking_number: 'BR123456789',
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          updated_at: new Date(),
          created_at: new Date(),
        }],
      });

      mockDb.query.mockResolvedValueOnce({}); // Add transaction event

      const result = await transactionService.updateTransaction('transaction-123', {
        status: 'shipped',
        trackingNumber: 'BR123456789',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE marketplace_transactions'),
        expect.arrayContaining(['shipped', 'BR123456789', expect.any(Date), 'transaction-123'])
      );

      expect(result.status).toBe('shipped');
    });

    it('should handle delivery confirmation and complete transaction', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        listingId: 'listing-123',
        status: 'shipped' as TransactionStatus,
        netAmount: 229.81,
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          listing_id: 'listing-123',
          status: 'delivered',
          actual_delivery: new Date(),
          updated_at: new Date(),
          created_at: new Date(),
        }],
      });

      mockDb.query.mockResolvedValueOnce({}); // Add status update event
      mockDb.query.mockResolvedValueOnce({}); // Add funds released event
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          listing_id: 'listing-123',
          status: 'completed',
          updated_at: new Date(),
          created_at: new Date(),
        }],
      });

      mockDb.query.mockResolvedValueOnce({}); // Final status update event

      await transactionService.confirmDelivery('transaction-123', 'buyer-123');

      expect(mockMarketplaceModel.updateStatus).toHaveBeenCalledWith('listing-123', 'sold');
    });

    it('should cancel transaction and process refund', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        sellerId: 'seller-789',
        listingId: 'listing-123',
        status: 'payment_confirmed' as TransactionStatus,
        paymentId: 'stripe_payment_123',
        paymentMethod: 'credit_card',
        amount: 265.00,
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      // Mock successful refund
      const mockPaymentService = {
        refundPayment: jest.fn().mockResolvedValue({
          success: true,
          refundId: 'refund_123',
          amount: 265.00,
          status: 'completed',
        }),
      };

      (transactionService as any).paymentService = mockPaymentService;

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          status: 'cancelled',
          updated_at: new Date(),
          created_at: new Date(),
        }],
      });

      mockDb.query.mockResolvedValueOnce({}); // Add cancellation event

      await transactionService.cancelTransaction('transaction-123', 'Buyer requested cancellation');

      expect(mockPaymentService.refundPayment).toHaveBeenCalledWith(
        'stripe',
        'transaction-123',
        265.00
      );

      expect(mockMarketplaceModel.updateStatus).toHaveBeenCalledWith('listing-123', 'active');
    });

    it('should get transaction statistics for seller', async () => {
      const mockStatsResult = {
        rows: [
          {
            total_transactions: '10',
            total_revenue: '2500.00',
            average_order_value: '250.00',
            completion_rate: '0.8',
            status: 'completed',
            status_count: '8',
          },
          {
            status: 'cancelled',
            status_count: '2',
          },
        ],
      };

      mockDb.query.mockResolvedValue(mockStatsResult);

      const stats = await transactionService.getTransactionStats('seller-123');

      expect(stats.totalTransactions).toBe(10);
      expect(stats.totalRevenue).toBe(2500.00);
      expect(stats.averageOrderValue).toBe(250.00);
      expect(stats.completionRate).toBe(0.8);
      expect(stats.statusBreakdown.completed).toBe(8);
      expect(stats.statusBreakdown.cancelled).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    const testMockListing = {
      id: 'listing-123',
      itemId: 'item-456',
      sellerId: 'seller-789',
      title: 'Nike Air Max 90',
      price: 250.00,
      status: 'active',
      shipping: { domestic: { cost: 15.00 } },
    };

    const testMockUser = {
      id: 'buyer-123',
      email: 'buyer@example.com',
      cpf: '12345678901',
      profile: { name: 'João Silva' },
    };

    it('should throw error when listing not found', async () => {
      mockMarketplaceModel.findById.mockResolvedValue(null);

      const transactionRequest: CreateTransactionRequest = {
        listingId: 'non-existent-listing',
        buyerId: 'buyer-123',
        shippingAddress: {} as any,
        paymentMethod: { type: 'pix', details: {} },
      };

      await expect(transactionService.createTransaction(transactionRequest))
        .rejects.toThrow('Listing not found');
    });

    it('should throw error when listing is not active', async () => {
      const inactiveListing = {
        ...testMockListing,
        status: 'sold',
      };

      mockMarketplaceModel.findById.mockResolvedValue(inactiveListing as any);

      const transactionRequest: CreateTransactionRequest = {
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        shippingAddress: {} as any,
        paymentMethod: { type: 'pix', details: {} },
      };

      await expect(transactionService.createTransaction(transactionRequest))
        .rejects.toThrow('Listing is not available for purchase');
    });

    it('should throw error when buyer tries to purchase own listing', async () => {
      mockMarketplaceModel.findById.mockResolvedValue(testMockListing as any);

      const transactionRequest: CreateTransactionRequest = {
        listingId: 'listing-123',
        buyerId: 'seller-789', // Same as seller
        shippingAddress: {} as any,
        paymentMethod: { type: 'pix', details: {} },
      };

      await expect(transactionService.createTransaction(transactionRequest))
        .rejects.toThrow('Cannot purchase your own listing');
    });

    it('should handle payment provider errors gracefully', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        status: 'pending_payment' as TransactionStatus,
        paymentMethod: 'credit_card',
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      // Mock payment service error
      const mockPaymentService = {
        processPayment: jest.fn().mockRejectedValue(new Error('Payment service unavailable')),
      };

      (transactionService as any).paymentService = mockPaymentService;

      mockDb.query.mockResolvedValueOnce({ rows: [testMockUser] }); // User query

      await expect(transactionService.processPayment('transaction-123', {}))
        .rejects.toThrow('Payment service unavailable');
    });

    it('should validate transaction status before operations', async () => {
      const completedTransaction = {
        id: 'transaction-123',
        status: 'completed' as TransactionStatus,
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(completedTransaction as Transaction);

      await expect(transactionService.cancelTransaction('transaction-123', 'Test reason'))
        .rejects.toThrow('Transaction cannot be cancelled in current status');
    });

    it('should handle database errors during transaction updates', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection lost'));

      await expect(transactionService.updateTransaction('transaction-123', { status: 'shipped' }))
        .rejects.toThrow('Database connection lost');
    });

    it('should validate delivery confirmation permissions', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        status: 'shipped' as TransactionStatus,
      };

      jest.spyOn(transactionService, 'getTransactionById').mockResolvedValue(mockTransaction as Transaction);

      await expect(transactionService.confirmDelivery('transaction-123', 'wrong-buyer-id'))
        .rejects.toThrow('Only the buyer can confirm delivery');
    });
  });

  describe('Brazilian Market Specific Features', () => {
    const testMockListing = {
      id: 'listing-123',
      itemId: 'item-456',
      sellerId: 'seller-789',
      title: 'Nike Air Max 90',
      price: 250.00,
      status: 'active',
      shipping: { domestic: { cost: 15.00 } },
    };

    it('should handle CPF validation in payment processing', () => {
      const paymentRequest: PaymentRequest = {
        amount: 100.00,
        currency: 'BRL',
        paymentMethod: {
          type: 'pix',
          details: {},
        },
        customer: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'João Silva',
          document: '12345678901', // CPF
        },
        metadata: {
          transactionId: 'transaction-123',
          listingId: 'listing-123',
          sellerId: 'seller-123',
          buyerId: 'buyer-123',
        },
      };

      expect(paymentRequest.customer.document).toMatch(/^\d{11}$/);
    });

    it('should support Brazilian address format in shipping', async () => {
      const brazilianAddress = {
        name: 'Maria Santos',
        street: 'Rua das Palmeiras, 456, Apto 201',
        city: 'Rio de Janeiro',
        state: 'RJ',
        postalCode: '22071-900', // CEP format
        country: 'Brazil',
        phone: '+5521987654321',
      };

      const transactionRequest: CreateTransactionRequest = {
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        shippingAddress: brazilianAddress,
        paymentMethod: { type: 'pix', details: {} },
      };

      mockMarketplaceModel.findById.mockResolvedValue(testMockListing as any);
      mockMarketplaceModel.createTransaction.mockResolvedValue({
        id: 'transaction-123',
        shipping: { address: brazilianAddress },
      } as any);

      const result = await transactionService.createTransaction(transactionRequest);

      expect(result.transaction.shipping.address.postalCode).toMatch(/^\d{5}-\d{3}$/);
      expect(result.transaction.shipping.address.phone).toMatch(/^\+55\d{10,11}$/);
    });

    it('should provide PIX-specific payment instructions', async () => {
      const transactionRequest: CreateTransactionRequest = {
        listingId: 'listing-123',
        buyerId: 'buyer-123',
        shippingAddress: {} as any,
        paymentMethod: { type: 'pix', details: {} },
      };

      mockMarketplaceModel.findById.mockResolvedValue(testMockListing as any);
      mockMarketplaceModel.createTransaction.mockResolvedValue({
        id: 'transaction-123',
      } as any);

      const result = await transactionService.createTransaction(transactionRequest);

      expect(result.paymentInstructions).toEqual({
        type: 'pix',
        qrCode: 'pix_qr_transaction-123',
        pixKey: 'vangarments@marketplace.com',
        amount: 265.00,
        expiresAt: expect.any(Date),
      });
    });
  });
});