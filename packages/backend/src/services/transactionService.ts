import { db } from '../database/connection';
import { MarketplaceModel } from '../models/Marketplace';
import { VUFSCatalogModel } from '../models/VUFSCatalog';
import { PaymentService, PaymentRequest } from './paymentService';
import { 
  Transaction, 
  TransactionStatus, 
  TransactionEvent 
} from '../types/shared';

export interface CreateTransactionRequest {
  listingId: string;
  buyerId: string;
  shippingAddress: any;
  paymentMethod: any;
  notes?: string;
}

export interface TransactionUpdate {
  status?: TransactionStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

export class TransactionService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionRequest): Promise<{
    transaction: Transaction;
    paymentRequired: boolean;
    paymentInstructions?: any;
  }> {
    // Get listing details
    const listing = await MarketplaceModel.findById(data.listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not available for purchase');
    }

    if (listing.sellerId === data.buyerId) {
      throw new Error('Cannot purchase your own listing');
    }

    // Calculate fees
    const fees = this.paymentService.calculateFees(listing.price, data.paymentMethod.type);
    const shippingFee = listing.shipping.domestic.cost || 0;
    const totalAmount = listing.price + shippingFee;

    // Create transaction record
    const transaction = await MarketplaceModel.createTransaction({
      listingId: data.listingId,
      buyerId: data.buyerId,
      sellerId: listing.sellerId,
      amount: totalAmount,
      fees: {
        platformFee: fees.platformFee,
        paymentFee: fees.paymentFee,
        shippingFee,
      },
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod.type,
    });

    // Add initial event
    await this.addTransactionEvent(transaction.id, {
      type: 'transaction_created',
      description: 'Transaction created and awaiting payment',
      timestamp: new Date(),
      metadata: { notes: data.notes },
    });

    // Reserve the listing
    await MarketplaceModel.updateStatus(data.listingId, 'reserved');

    // Prepare payment instructions based on method
    let paymentInstructions;
    if (data.paymentMethod.type === 'pix') {
      paymentInstructions = {
        type: 'pix',
        qrCode: `pix_qr_${transaction.id}`,
        pixKey: 'vangarments@marketplace.com',
        amount: totalAmount,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };
    }

    return {
      transaction,
      paymentRequired: true,
      paymentInstructions,
    };
  }

  /**
   * Process payment for transaction
   */
  async processPayment(transactionId: string, paymentDetails: any): Promise<{
    success: boolean;
    paymentId?: string;
    errorMessage?: string;
  }> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending_payment') {
      throw new Error('Transaction is not in a payable state');
    }

    // Get user details for payment
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [transaction.buyerId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('Buyer not found');
    }

    // Prepare payment request
    const paymentRequest: PaymentRequest = {
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: {
        type: transaction.paymentMethod as any,
        details: paymentDetails,
      },
      customer: {
        id: user.id,
        email: user.email,
        name: user.profile?.name || 'Unknown',
        document: user.cpf,
      },
      metadata: {
        transactionId: transaction.id,
        listingId: transaction.listingId,
        sellerId: transaction.sellerId,
        buyerId: transaction.buyerId,
      },
    };

    // Process payment
    const paymentResult = await this.paymentService.processPayment(
      transaction.paymentMethod === 'pix' ? 'pix' : 'stripe',
      paymentRequest
    );

    if (paymentResult.success) {
      // Update transaction with payment info
      await this.updateTransactionPayment(transactionId, {
        paymentId: paymentResult.paymentId,
        status: 'payment_confirmed',
      });

      await this.addTransactionEvent(transactionId, {
        type: 'payment_confirmed',
        description: 'Payment successfully processed',
        timestamp: new Date(),
        metadata: { paymentId: paymentResult.paymentId },
      });

      // Notify seller
      await this.notifySeller(transaction.sellerId, transaction);

      return {
        success: true,
        paymentId: paymentResult.paymentId,
      };
    } else {
      await this.addTransactionEvent(transactionId, {
        type: 'payment_failed',
        description: 'Payment processing failed',
        timestamp: new Date(),
        metadata: { error: paymentResult.errorMessage },
      });

      // Release listing reservation
      await MarketplaceModel.updateStatus(transaction.listingId, 'active');

      return {
        success: false,
        errorMessage: paymentResult.errorMessage,
      };
    }
  }

  /**
   * Update transaction status
   */
  async updateTransaction(transactionId: string, update: TransactionUpdate): Promise<Transaction> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (update.status) {
      updateFields.push(`status = $${paramCount}`);
      values.push(update.status);
      paramCount++;
    }

    if (update.trackingNumber) {
      updateFields.push(`tracking_number = $${paramCount}`);
      values.push(update.trackingNumber);
      paramCount++;
    }

    if (update.estimatedDelivery) {
      updateFields.push(`estimated_delivery = $${paramCount}`);
      values.push(update.estimatedDelivery);
      paramCount++;
    }

    if (update.actualDelivery) {
      updateFields.push(`actual_delivery = $${paramCount}`);
      values.push(update.actualDelivery);
      paramCount++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(transactionId);
    const query = `
      UPDATE marketplace_transactions 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = this.mapToTransaction(result.rows[0]);

    // Add event for status change
    if (update.status) {
      await this.addTransactionEvent(transactionId, {
        type: 'status_updated',
        description: `Transaction status updated to ${update.status}`,
        timestamp: new Date(),
        metadata: update,
      });

      // Handle specific status changes
      if (update.status === 'shipped' && update.trackingNumber) {
        await this.notifyBuyer(transaction.buyerId, transaction, 'shipped');
      }

      if (update.status === 'delivered') {
        await this.handleDeliveryConfirmation(transaction);
      }
    }

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM marketplace_transactions WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToTransaction(result.rows[0]);
  }

  /**
   * Get transactions for user
   */
  async getUserTransactions(
    userId: string,
    type: 'buyer' | 'seller' | 'all' = 'all',
    status?: TransactionStatus
  ): Promise<Transaction[]> {
    const whereConditions = [];
    const values: any[] = [];
    let paramCount = 1;

    if (type === 'buyer') {
      whereConditions.push(`buyer_id = $${paramCount}`);
      values.push(userId);
      paramCount++;
    } else if (type === 'seller') {
      whereConditions.push(`seller_id = $${paramCount}`);
      values.push(userId);
      paramCount++;
    } else {
      whereConditions.push(`(buyer_id = $${paramCount} OR seller_id = $${paramCount})`);
      values.push(userId);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    const query = `
      SELECT * FROM marketplace_transactions 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapToTransaction(row));
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId: string, reason: string): Promise<void> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!['pending_payment', 'payment_confirmed', 'processing'].includes(transaction.status)) {
      throw new Error('Transaction cannot be cancelled in current status');
    }

    // Process refund if payment was made
    if (transaction.paymentId && transaction.status !== 'pending_payment') {
      const refundResult = await this.paymentService.refundPayment(
        transaction.paymentMethod === 'pix' ? 'pix' : 'stripe',
        transaction.id,
        transaction.amount
      );

      if (!refundResult.success) {
        throw new Error('Failed to process refund');
      }
    }

    // Update transaction status
    await this.updateTransaction(transactionId, { status: 'cancelled' });

    // Release listing
    await MarketplaceModel.updateStatus(transaction.listingId, 'active');

    // Add cancellation event
    await this.addTransactionEvent(transactionId, {
      type: 'transaction_cancelled',
      description: `Transaction cancelled: ${reason}`,
      timestamp: new Date(),
      metadata: { reason },
    });
  }

  /**
   * Confirm delivery
   */
  async confirmDelivery(transactionId: string, buyerId: string): Promise<void> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.buyerId !== buyerId) {
      throw new Error('Only the buyer can confirm delivery');
    }

    if (transaction.status !== 'shipped') {
      throw new Error('Transaction must be shipped before delivery confirmation');
    }

    await this.updateTransaction(transactionId, {
      status: 'delivered',
      actualDelivery: new Date(),
    });
  }

  /**
   * Add transaction event
   */
  private async addTransactionEvent(transactionId: string, event: TransactionEvent): Promise<void> {
    const query = `
      INSERT INTO transaction_events (transaction_id, type, description, timestamp, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await db.query(query, [
      transactionId,
      event.type,
      event.description,
      event.timestamp,
      JSON.stringify(event.metadata || {}),
    ]);
  }

  /**
   * Update transaction payment info
   */
  private async updateTransactionPayment(transactionId: string, paymentInfo: {
    paymentId: string;
    status: TransactionStatus;
  }): Promise<void> {
    const query = `
      UPDATE marketplace_transactions 
      SET payment_id = $1, status = $2, updated_at = NOW()
      WHERE id = $3
    `;

    await db.query(query, [paymentInfo.paymentId, paymentInfo.status, transactionId]);
  }

  /**
   * Handle delivery confirmation
   */
  private async handleDeliveryConfirmation(transaction: Transaction): Promise<void> {
    // Update listing status to sold
    await MarketplaceModel.updateStatus(transaction.listingId, 'sold');

    // Release funds to seller (in production, this would trigger payout)
    await this.addTransactionEvent(transaction.id, {
      type: 'funds_released',
      description: 'Funds released to seller after delivery confirmation',
      timestamp: new Date(),
      metadata: { netAmount: transaction.netAmount },
    });

    // Mark transaction as completed
    await this.updateTransaction(transaction.id, { status: 'completed' });
  }

  /**
   * Notify seller of new purchase
   */
  private async notifySeller(sellerId: string, transaction: Transaction): Promise<void> {
    // In production, this would send email/push notification
    console.log(`Notifying seller ${sellerId} of new purchase: ${transaction.id}`);
  }

  /**
   * Notify buyer of status updates
   */
  private async notifyBuyer(buyerId: string, transaction: Transaction, type: string): Promise<void> {
    // In production, this would send email/push notification
    console.log(`Notifying buyer ${buyerId} of ${type}: ${transaction.id}`);
  }

  /**
   * Map database row to Transaction object
   */
  private mapToTransaction(row: any): Transaction {
    const fees = typeof row.fees === 'string' ? JSON.parse(row.fees) : row.fees;
    const shippingAddress = typeof row.shipping_address === 'string' 
      ? JSON.parse(row.shipping_address) 
      : row.shipping_address;

    return {
      id: row.id,
      listingId: row.listing_id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      amount: parseFloat(row.amount),
      currency: row.currency || 'BRL',
      fees,
      netAmount: parseFloat(row.net_amount),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentId: row.payment_id,
      shipping: {
        address: shippingAddress,
        method: row.shipping_method || 'standard',
        trackingNumber: row.tracking_number,
        estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : undefined,
        actualDelivery: row.actual_delivery ? new Date(row.actual_delivery) : undefined,
      },
      timeline: [], // Would be populated from transaction_events table
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(sellerId?: string): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    averageOrderValue: number;
    completionRate: number;
    statusBreakdown: Record<TransactionStatus, number>;
  }> {
    let whereClause = '';
    const values: any[] = [];

    if (sellerId) {
      whereClause = 'WHERE seller_id = $1';
      values.push(sellerId);
    }

    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(amount) as average_order_value,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*) as completion_rate,
        status,
        COUNT(*) as status_count
      FROM marketplace_transactions 
      ${whereClause}
      GROUP BY status
    `;

    const result = await db.query(query, values);
    
    const statusBreakdown: Record<TransactionStatus, number> = {} as any;
    let totalTransactions = 0;
    let totalRevenue = 0;
    let averageOrderValue = 0;
    let completionRate = 0;

    for (const row of result.rows) {
      statusBreakdown[row.status as TransactionStatus] = parseInt(row.status_count);
      if (row.status === 'completed') {
        totalTransactions = parseInt(row.total_transactions);
        totalRevenue = parseFloat(row.total_revenue) || 0;
        averageOrderValue = parseFloat(row.average_order_value) || 0;
        completionRate = parseFloat(row.completion_rate) || 0;
      }
    }

    return {
      totalTransactions,
      totalRevenue,
      averageOrderValue,
      completionRate,
      statusBreakdown,
    };
  }
}