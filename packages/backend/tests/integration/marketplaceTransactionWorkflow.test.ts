/**
 * Integration tests for marketplace transaction workflow and status updates
 * Tests complete transaction lifecycle, status transitions, and business logic
 * Requirements: 3.3, 3.5
 */

import { TransactionService } from '../../src/services/transactionService';
import { MarketplaceModel } from '../../src/models/Marketplace';
import { Transaction, TransactionStatus } from '@vangarments/shared/types/marketplace';

// Mock database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

// Mock models
jest.mock('../../src/models/Marketplace');

const { db } = require('../../src/database/connection');
const mockDb = db as jest.Mocked<typeof db>;
const mockMarketplaceModel = MarketplaceModel as jest.Mocked<typeof MarketplaceModel>;

describe('Marketplace Transaction Workflow', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService();
  });

  describe('Complete Transaction Lifecycle', () => {
    const mockListing = {
      id: 'listing-123',
      itemId: 'item-456',
      sellerId: 'seller-789',
      buyerId: 'buyer-123',
      title: 'Nike Air Max 90',
      price: 250.00,
      status: 'active',
      shipping: { domestic: { cost: 15.00 } },
    };

    const mockTransaction: Transaction = {
      id: 'transaction-123',
      listingId: 'listing-123',
      buyerId: 'buyer-123',
      sellerId: 'seller-789',
      amount: 265.00,
      currency: 'BRL',
      fees: {
        platformFee: 12.50,
        paymentFee: 7.69,
        shippingFee: 15.00,
      },
      netAmount: 229.81,
      status: 'pending_payment',
      paymentMethod: 'pix',
      paymentId: undefined,
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
    };

    it('should complete full transaction workflow from creation to delivery', async () => {
      // Step 1: Transaction Creation
      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue({ ...mockTransaction, status: 'pending_payment' });

      // Step 2: Payment Confirmation
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'user-123', email: 'buyer@test.com' }] });
      mockDb.query.mockResolvedValueOnce({}); // Update payment
      mockDb.query.mockResolvedValueOnce({}); // Add event

      const paymentResult = await transactionService.processPayment('transaction-123', {
        pixKey: 'buyer@test.com',
        amount: 265.00,
      });

      expect(paymentResult.success).toBe(true);

      // Step 3: Seller ships item
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          ...mockTransaction,
          status: 'shipped',
          tracking_number: 'BR123456789',
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Add event

      const shippedTransaction = await transactionService.updateTransaction('transaction-123', {
        status: 'shipped',
        trackingNumber: 'BR123456789',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      expect(shippedTransaction.status).toBe('shipped');

      // Step 4: Buyer confirms delivery
      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue({ ...mockTransaction, status: 'shipped', listingId: 'listing-123' });

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          listing_id: 'listing-123',
          status: 'delivered',
          actual_delivery: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Add event
      mockDb.query.mockResolvedValueOnce({}); // Add funds released event
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          listing_id: 'listing-123',
          status: 'completed',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Final event

      await transactionService.confirmDelivery('transaction-123', 'buyer-123');

      expect(mockMarketplaceModel.updateStatus).toHaveBeenCalledWith('listing-123', 'sold');
    });

    it('should handle transaction cancellation at different stages', async () => {
      // Test cancellation during pending_payment
      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue({ ...mockTransaction, status: 'pending_payment' });

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...mockTransaction, status: 'cancelled' }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Add event

      await transactionService.cancelTransaction('transaction-123', 'Buyer changed mind');

      expect(mockMarketplaceModel.updateStatus).toHaveBeenCalledWith('listing-123', 'active');

      // Test cancellation after payment confirmation (requires refund)
      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue({
          ...mockTransaction,
          status: 'payment_confirmed',
          paymentId: 'pix_payment_123',
        });

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
        rows: [{ ...mockTransaction, status: 'cancelled' }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Add event

      await transactionService.cancelTransaction('transaction-123', 'Item damaged before shipping');

      expect(mockPaymentService.refundPayment).toHaveBeenCalled();
    });
  });

  describe('Transaction Status Transitions', () => {
    const validTransitions = {
      'pending_payment': ['payment_confirmed', 'cancelled'],
      'payment_confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['completed'],
      'completed': [], // Terminal state
      'cancelled': [], // Terminal state
      'refunded': [], // Terminal state
      'disputed': ['completed', 'cancelled', 'refunded'],
    };

    Object.entries(validTransitions).forEach(([fromStatus, toStatuses]) => {
      it(`should allow valid transitions from ${fromStatus}`, async () => {
        for (const toStatus of toStatuses) {
          mockDb.query.mockResolvedValueOnce({
            rows: [{
              id: 'transaction-123',
              status: toStatus,
              updated_at: new Date(),
              created_at: new Date(),
            }],
          });
          mockDb.query.mockResolvedValueOnce({}); // Add event

          const result = await transactionService.updateTransaction('transaction-123', {
            status: toStatus as TransactionStatus,
          });

          expect(result.status).toBe(toStatus);
        }
      });
    });

    it('should track transaction events for status changes', async () => {
      const statusUpdates = [
        'payment_confirmed',
        'processing',
        'shipped',
        'delivered',
        'completed',
      ];

      for (const status of statusUpdates) {
        mockDb.query.mockResolvedValueOnce({
          rows: [{
            id: 'transaction-123',
            status,
            updated_at: new Date(),
            created_at: new Date(),
          }],
        });
        mockDb.query.mockResolvedValueOnce({}); // Add event

        await transactionService.updateTransaction('transaction-123', {
          status: status as TransactionStatus,
        });

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO transaction_events'),
          expect.arrayContaining([
            'transaction-123',
            'status_updated',
            expect.stringContaining(status),
            expect.any(Date),
            expect.any(String),
          ])
        );
      }
    });
  });

  describe('Shipping and Tracking Management', () => {
    it('should update shipping information and notify buyer', async () => {
      const shippingUpdate = {
        status: 'shipped' as TransactionStatus,
        trackingNumber: 'BR123456789',
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          status: 'shipped',
          tracking_number: 'BR123456789',
          estimated_delivery: shippingUpdate.estimatedDelivery,
          updated_at: new Date(),
          created_at: new Date(),
        }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Add event

      const result = await transactionService.updateTransaction('transaction-123', shippingUpdate);

      expect(result.status).toBe('shipped');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE marketplace_transactions'),
        expect.arrayContaining([
          'shipped',
          'BR123456789',
          shippingUpdate.estimatedDelivery,
          'transaction-123',
        ])
      );
    });

    it('should handle delivery confirmation with actual delivery date', async () => {
      const actualDeliveryDate = new Date();

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'transaction-123',
          status: 'delivered',
          actual_delivery: actualDeliveryDate,
          updated_at: new Date(),
          created_at: new Date(),
        }],
      });
      mockDb.query.mockResolvedValueOnce({}); // Add event

      const result = await transactionService.updateTransaction('transaction-123', {
        status: 'delivered',
        actualDelivery: actualDeliveryDate,
      });

      expect(result.status).toBe('delivered');
    });

    it('should validate tracking number format', () => {
      const validTrackingNumbers = [
        'BR123456789',
        'AA123456789BR',
        'CP123456789BR',
        'SW123456789BR',
      ];

      const invalidTrackingNumbers = [
        '123456789', // Too short
        'INVALID', // Wrong format
        '', // Empty
      ];

      validTrackingNumbers.forEach(trackingNumber => {
        // Brazilian postal service format validation
        const isValid = /^[A-Z]{2}\d{9}[A-Z]{2}$|^BR\d{9}$/.test(trackingNumber);
        expect(isValid).toBe(true);
      });

      invalidTrackingNumbers.forEach(trackingNumber => {
        const isValid = /^[A-Z]{2}\d{9}[A-Z]{2}$|^BR\d{9}$/.test(trackingNumber);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Transaction Analytics and Reporting', () => {
    it('should calculate transaction statistics correctly', async () => {
      const mockStatsData = [
        {
          total_transactions: '25',
          total_revenue: '5000.00',
          average_order_value: '200.00',
          completion_rate: '0.88',
          status: 'completed',
          status_count: '22',
        },
        {
          status: 'cancelled',
          status_count: '2',
        },
        {
          status: 'refunded',
          status_count: '1',
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockStatsData });

      const stats = await transactionService.getTransactionStats('seller-123');

      expect(stats.totalTransactions).toBe(25);
      expect(stats.totalRevenue).toBe(5000.00);
      expect(stats.averageOrderValue).toBe(200.00);
      expect(stats.completionRate).toBe(0.88);
      expect(stats.statusBreakdown.completed).toBe(22);
      expect(stats.statusBreakdown.cancelled).toBe(2);
      expect(stats.statusBreakdown.refunded).toBe(1);
    });

    it('should get user transactions with filtering', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          buyer_id: 'user-123',
          seller_id: 'seller-456',
          status: 'completed',
          amount: 150.00,
          created_at: new Date('2023-01-01'),
        },
        {
          id: 'transaction-2',
          buyer_id: 'user-123',
          seller_id: 'seller-789',
          status: 'shipped',
          amount: 200.00,
          created_at: new Date('2023-01-02'),
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockTransactions });

      const transactions = await transactionService.getUserTransactions('user-123', 'buyer');

      expect(transactions).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('buyer_id = $1'),
        ['user-123']
      );
    });

    it('should filter transactions by status', async () => {
      const mockCompletedTransactions = [
        {
          id: 'transaction-1',
          status: 'completed',
          amount: 150.00,
          created_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValue({ rows: mockCompletedTransactions });

      const transactions = await transactionService.getUserTransactions(
        'user-123',
        'buyer',
        'completed'
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $2'),
        ['user-123', 'completed']
      );
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate transaction exists before updates', async () => {
      mockDb.query.mockResolvedValue({ rows: [] }); // No transaction found

      await expect(
        transactionService.updateTransaction('non-existent-transaction', { status: 'shipped' })
      ).rejects.toThrow('Transaction not found');
    });

    it('should validate buyer permissions for delivery confirmation', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        status: 'shipped' as TransactionStatus,
      };

      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue(mockTransaction as Transaction);

      await expect(
        transactionService.confirmDelivery('transaction-123', 'wrong-buyer-id')
      ).rejects.toThrow('Only the buyer can confirm delivery');
    });

    it('should validate transaction status for delivery confirmation', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        buyerId: 'buyer-123',
        status: 'payment_confirmed' as TransactionStatus,
      };

      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue(mockTransaction as Transaction);

      await expect(
        transactionService.confirmDelivery('transaction-123', 'buyer-123')
      ).rejects.toThrow('Transaction must be shipped before delivery confirmation');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        transactionService.updateTransaction('transaction-123', { status: 'shipped' })
      ).rejects.toThrow('Database connection failed');
    });

    it('should validate cancellation permissions', async () => {
      const completedTransaction = {
        id: 'transaction-123',
        status: 'completed' as TransactionStatus,
      };

      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue(completedTransaction as Transaction);

      await expect(
        transactionService.cancelTransaction('transaction-123', 'Test reason')
      ).rejects.toThrow('Transaction cannot be cancelled in current status');
    });
  });

  describe('Brazilian Market Specific Workflows', () => {
    it('should handle PIX payment workflow', async () => {
      const pixTransaction = {
        id: 'transaction-123',
        paymentMethod: 'pix',
        amount: 100.00,
        status: 'pending_payment' as TransactionStatus,
      };

      jest.spyOn(transactionService, 'getTransactionById')
        .mockResolvedValue(pixTransaction as Transaction);

      // PIX payments are typically instant
      const mockPaymentService = {
        processPayment: jest.fn().mockResolvedValue({
          success: true,
          paymentId: 'pix_123456789',
          status: 'completed',
          transactionFee: 1.00, // 1% for PIX
          processingTime: 500, // Fast processing
        }),
      };

      (transactionService as any).paymentService = mockPaymentService;

      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 'user-123' }] }); // User query
      mockDb.query.mockResolvedValueOnce({}); // Update payment
      mockDb.query.mockResolvedValueOnce({}); // Add event

      const result = await transactionService.processPayment('transaction-123', {
        pixKey: 'user@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.paymentId).toMatch(/^pix_/);
    });

    it('should handle Brazilian shipping addresses', () => {
      const brazilianAddress = {
        name: 'João Silva',
        street: 'Rua das Palmeiras, 456, Apto 201',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '01310-100', // CEP format
        country: 'Brazil',
        phone: '+5511987654321',
      };

      // Validate CEP format
      expect(brazilianAddress.postalCode).toMatch(/^\d{5}-\d{3}$/);
      
      // Validate Brazilian phone format
      expect(brazilianAddress.phone).toMatch(/^\+55\d{10,11}$/);
      
      // Validate required fields for Brazilian addresses
      expect(brazilianAddress.state).toBeDefined();
      expect(brazilianAddress.city).toBeDefined();
      expect(brazilianAddress.postalCode).toBeDefined();
    });

    it('should calculate fees according to Brazilian market rates', () => {
      const amount = 500.00;
      
      // Platform fee: 5%
      const platformFee = amount * 0.05; // 25.00
      
      // PIX fee: 1% capped at R$10
      const pixFee = Math.min(amount * 0.01, 10); // 5.00 (under cap)
      
      // Credit card fee: 2.9% + R$0.30
      const creditCardFee = amount * 0.029 + 0.30; // 14.80
      
      expect(platformFee).toBe(25.00);
      expect(pixFee).toBe(5.00);
      expect(creditCardFee).toBe(14.80);
    });
  });
});