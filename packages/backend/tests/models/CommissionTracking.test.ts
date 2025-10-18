import { CommissionTrackingModel, CreateCommissionData, UpdateCommissionData, Commission } from '../../src/models/CommissionTracking';
import { db } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection', () => ({
  db: {
    query: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('CommissionTrackingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCreateData: CreateCommissionData = {
    transactionId: 'txn123',
    brandId: 'brand123',
    storeId: 'store456',
    amount: 1000.00,
    commissionRate: 0.10, // 10%
    platformFeeRate: 0.05 // 5%
  };

  const mockDbRow = {
    id: 'commission123',
    transaction_id: 'txn123',
    brand_id: 'brand123',
    store_id: 'store456',
    amount: '1000.00',
    commission_rate: '0.10',
    commission_amount: '100.00',
    platform_fee: '5.00',
    net_amount: '95.00',
    status: 'pending',
    payment_method: null,
    payment_date: null,
    notes: null,
    brand_info: { name: 'Nike', description: 'Just Do It' },
    transaction_status: 'completed',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  };

  describe('create', () => {
    it('should create a new commission successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.create(mockCreateData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO commissions'),
        [
          'txn123',
          'brand123',
          'store456',
          1000.00,
          0.10,
          100.00, // commission amount (1000 * 0.10)
          5.00,   // platform fee (100 * 0.05)
          95.00,  // net amount (100 - 5)
          'pending'
        ]
      );

      expect(result).toEqual({
        id: 'commission123',
        transactionId: 'txn123',
        brandId: 'brand123',
        storeId: 'store456',
        amount: 1000.00,
        commissionRate: 0.10,
        commissionAmount: 100.00,
        platformFee: 5.00,
        netAmount: 95.00,
        status: 'pending',
        paymentMethod: null,
        paymentDate: null,
        notes: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should use default platform fee rate when not provided', async () => {
      const createDataWithoutPlatformFee = {
        transactionId: 'txn123',
        brandId: 'brand123',
        amount: 1000.00,
        commissionRate: 0.10
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.create(createDataWithoutPlatformFee);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO commissions'),
        expect.arrayContaining([
          5.00, // default 5% platform fee on 100 commission
          95.00 // net amount after default platform fee
        ])
      );
    });

    it('should handle commission without store ID', async () => {
      const createDataWithoutStore = {
        transactionId: 'txn123',
        brandId: 'brand123',
        amount: 1000.00,
        commissionRate: 0.10
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...mockDbRow, store_id: null }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.create(createDataWithoutStore);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO commissions'),
        expect.arrayContaining([null]) // store_id should be null
      );

      expect(result.storeId).toBeNull();
    });

    it('should calculate commission amounts correctly', async () => {
      const testCases = [
        { amount: 100, rate: 0.05, expectedCommission: 5, expectedPlatformFee: 0.25, expectedNet: 4.75 },
        { amount: 500, rate: 0.15, expectedCommission: 75, expectedPlatformFee: 3.75, expectedNet: 71.25 },
        { amount: 1500, rate: 0.08, expectedCommission: 120, expectedPlatformFee: 6, expectedNet: 114 }
      ];

      for (const testCase of testCases) {
        mockDb.query.mockResolvedValueOnce({
          rows: [mockDbRow],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: []
        });

        await CommissionTrackingModel.create({
          transactionId: 'txn123',
          brandId: 'brand123',
          amount: testCase.amount,
          commissionRate: testCase.rate
        });

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('INSERT INTO commissions'),
          expect.arrayContaining([
            testCase.expectedCommission,
            testCase.expectedPlatformFee,
            testCase.expectedNet
          ])
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('findById', () => {
    it('should find commission by ID successfully', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.findById('commission123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.*'),
        ['commission123']
      );

      expect(result).toEqual({
        id: 'commission123',
        transactionId: 'txn123',
        brandId: 'brand123',
        storeId: 'store456',
        amount: 1000.00,
        commissionRate: 0.10,
        commissionAmount: 100.00,
        platformFee: 5.00,
        netAmount: 95.00,
        status: 'pending',
        paymentMethod: null,
        paymentDate: null,
        notes: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should return null when commission not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByTransactionId', () => {
    it('should find commissions by transaction ID', async () => {
      const mockMultipleRows = [
        { ...mockDbRow, id: 'commission1' },
        { ...mockDbRow, id: 'commission2' }
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.findByTransactionId('txn123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.transaction_id = $1'),
        ['txn123']
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('commission1');
      expect(result[1].id).toBe('commission2');
    });

    it('should return empty array when no commissions found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.findByTransactionId('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('findMany', () => {
    const mockMultipleRows = [
      { ...mockDbRow, id: 'commission1', total: '5' },
      { ...mockDbRow, id: 'commission2', total: '5' },
      { ...mockDbRow, id: 'commission3', total: '5' }
    ];

    it('should find commissions without filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.findMany();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY c.created_at DESC'),
        [20, 0]
      );

      expect(result.commissions).toHaveLength(3);
      expect(result.total).toBe(5);
    });

    it('should apply brand ID filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.findMany({ brandId: 'brand123' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.brand_id = $1'),
        expect.arrayContaining(['brand123'])
      );
    });

    it('should apply store ID filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.findMany({ storeId: 'store456' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.store_id = $1'),
        expect.arrayContaining(['store456'])
      );
    });

    it('should apply status filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.findMany({ status: 'paid' });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.status = $1'),
        expect.arrayContaining(['paid'])
      );
    });

    it('should apply date range filter', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.findMany({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('c.created_at >= $1 AND c.created_at <= $2'),
        expect.arrayContaining(['2024-01-01', '2024-01-31'])
      );
    });

    it('should apply multiple filters', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.findMany({
        brandId: 'brand123',
        status: 'pending',
        dateRange: { start: '2024-01-01', end: '2024-01-31' }
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.brand_id = $1 AND c.status = $2 AND c.created_at >= $3'),
        expect.arrayContaining(['brand123', 'pending', '2024-01-01', '2024-01-31'])
      );
    });

    it('should apply pagination', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: mockMultipleRows,
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.findMany({}, 10, 20);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        expect.arrayContaining([10, 20])
      );
    });
  });

  describe('update', () => {
    const updateData: UpdateCommissionData = {
      status: 'paid',
      paymentMethod: 'bank_transfer',
      paymentDate: '2024-01-20T10:00:00Z',
      notes: 'Payment processed successfully'
    };

    it('should update commission successfully', async () => {
      const updatedRow = {
        ...mockDbRow,
        status: 'paid',
        payment_method: 'bank_transfer',
        payment_date: '2024-01-20T10:00:00Z',
        notes: 'Payment processed successfully'
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [updatedRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.update('commission123', updateData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE commissions'),
        [
          'paid',
          'bank_transfer',
          '2024-01-20T10:00:00Z',
          'Payment processed successfully',
          'commission123'
        ]
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('paid');
      expect(result?.paymentMethod).toBe('bank_transfer');
      expect(result?.paymentDate).toBe('2024-01-20T10:00:00Z');
      expect(result?.notes).toBe('Payment processed successfully');
    });

    it('should return null when commission not found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.update('nonexistent', updateData);

      expect(result).toBeNull();
    });

    it('should throw error when no fields to update', async () => {
      await expect(CommissionTrackingModel.update('commission123', {}))
        .rejects.toThrow('No fields to update');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { status: 'approved' as const };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...mockDbRow, status: 'approved' }],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.update('commission123', partialUpdate);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SET status = $1'),
        expect.arrayContaining(['approved', 'commission123'])
      );

      expect(result?.status).toBe('approved');
    });

    it('should handle undefined notes update', async () => {
      const updateWithUndefinedNotes = { 
        notes: undefined,
        status: 'approved' as const
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDbRow],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.update('commission123', updateWithUndefinedNotes);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.arrayContaining(['approved', undefined])
      );
    });
  });

  describe('getCommissionSummary', () => {
    it('should return commission summary for brand', async () => {
      // Mock summary query
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          transaction_count: 25,
          total_commissions: '2500.00',
          total_paid: '1800.00',
          total_pending: '700.00',
          avg_commission_rate: '0.12'
        }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      // Mock period breakdown query
      mockDb.query.mockResolvedValueOnce({
        rows: [
          { period: '2024-01', commissions: '1200.00', transactions: 12 },
          { period: '2024-02', commissions: '800.00', transactions: 8 },
          { period: '2024-03', commissions: '500.00', transactions: 5 }
        ],
        rowCount: 3,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.getCommissionSummary('brand123');

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        totalCommissions: 2500,
        totalPaid: 1800,
        totalPending: 700,
        averageCommissionRate: 0.12,
        transactionCount: 25,
        periodBreakdown: [
          { period: '2024-01', commissions: 1200, transactions: 12 },
          { period: '2024-02', commissions: 800, transactions: 8 },
          { period: '2024-03', commissions: 500, transactions: 5 }
        ]
      });
    });

    it('should handle different period formats', async () => {
      const periods = ['week', 'month', 'quarter', 'year'];
      const expectedFormats = ['YYYY-"W"WW', 'YYYY-MM', 'YYYY-Q', 'YYYY'];

      for (let i = 0; i < periods.length; i++) {
        mockDb.query.mockResolvedValueOnce({
          rows: [{ transaction_count: 0, total_commissions: '0', total_paid: '0', total_pending: '0', avg_commission_rate: '0' }],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        mockDb.query.mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        await CommissionTrackingModel.getCommissionSummary('brand123', periods[i] as any);

        expect(mockDb.query).toHaveBeenNthCalledWith(2 * (i + 1),
          expect.stringContaining(`TO_CHAR(created_at, $2)`),
          expect.arrayContaining(['brand123', expectedFormats[i]])
        );

        jest.clearAllMocks();
      }
    });

    it('should handle zero commission data', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          transaction_count: 0,
          total_commissions: null,
          total_paid: null,
          total_pending: null,
          avg_commission_rate: null
        }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await CommissionTrackingModel.getCommissionSummary('brand123');

      expect(result).toEqual({
        totalCommissions: 0,
        totalPaid: 0,
        totalPending: 0,
        averageCommissionRate: 0,
        transactionCount: 0,
        periodBreakdown: []
      });
    });
  });

  describe('processPayment', () => {
    it('should process payment for multiple commissions', async () => {
      const commissionIds = ['commission1', 'commission2', 'commission3'];

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 3,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.processPayment(commissionIds, 'bank_transfer');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SET status = \'paid\''),
        ['bank_transfer', commissionIds]
      );
    });

    it('should handle empty commission IDs array', async () => {
      await CommissionTrackingModel.processPayment([], 'bank_transfer');

      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should only update approved commissions', async () => {
      const commissionIds = ['commission1', 'commission2'];

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1, // Only one was approved
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.processPayment(commissionIds, 'paypal');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ANY($2) AND status = \'approved\''),
        ['paypal', commissionIds]
      );
    });
  });

  describe('bulkApprove', () => {
    it('should approve multiple commissions', async () => {
      const commissionIds = ['commission1', 'commission2', 'commission3'];

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 3,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.bulkApprove(commissionIds);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SET status = \'approved\''),
        [commissionIds]
      );
    });

    it('should handle empty commission IDs array', async () => {
      await CommissionTrackingModel.bulkApprove([]);

      expect(mockDb.query).not.toHaveBeenCalled();
    });

    it('should only update pending commissions', async () => {
      const commissionIds = ['commission1', 'commission2'];

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 2,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      await CommissionTrackingModel.bulkApprove(commissionIds);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ANY($1) AND status = \'pending\''),
        [commissionIds]
      );
    });
  });
});