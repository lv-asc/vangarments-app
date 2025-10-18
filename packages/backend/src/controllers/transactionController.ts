import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { AuthenticatedRequest } from '../utils/auth';

export class TransactionController {
  private static transactionService = new TransactionService();

  /**
   * Create new transaction
   */
  static async createTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { listingId, shippingAddress, paymentMethod, notes } = req.body;

      if (!listingId || !shippingAddress || !paymentMethod) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Listing ID, shipping address, and payment method are required',
          },
        });
      }

      const result = await TransactionController.transactionService.createTransaction({
        listingId,
        buyerId: req.user.userId,
        shippingAddress,
        paymentMethod,
        notes,
      });

      res.status(201).json({
        message: 'Transaction created successfully',
        ...result,
      });
    } catch (error: any) {
      console.error('Create transaction error:', error);
      res.status(400).json({
        error: {
          code: 'TRANSACTION_ERROR',
          message: error.message || 'An error occurred while creating the transaction',
        },
      });
    }
  }

  /**
   * Process payment for transaction
   */
  static async processPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { transactionId } = req.params;
      const { paymentDetails } = req.body;

      if (!paymentDetails) {
        return res.status(400).json({
          error: {
            code: 'MISSING_PAYMENT_DETAILS',
            message: 'Payment details are required',
          },
        });
      }

      const result = await TransactionController.transactionService.processPayment(
        transactionId,
        paymentDetails
      );

      if (result.success) {
        res.json({
          message: 'Payment processed successfully',
          paymentId: result.paymentId,
        });
      } else {
        res.status(400).json({
          error: {
            code: 'PAYMENT_FAILED',
            message: result.errorMessage || 'Payment processing failed',
          },
        });
      }
    } catch (error: any) {
      console.error('Process payment error:', error);
      res.status(500).json({
        error: {
          code: 'PAYMENT_ERROR',
          message: error.message || 'An error occurred while processing payment',
        },
      });
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { transactionId } = req.params;

      const transaction = await TransactionController.transactionService.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found',
          },
        });
      }

      // Check if user is authorized to view this transaction
      if (transaction.buyerId !== req.user.userId && transaction.sellerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to view this transaction',
          },
        });
      }

      res.json({
        transaction,
      });
    } catch (error: any) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        error: {
          code: 'TRANSACTION_ERROR',
          message: 'An error occurred while fetching the transaction',
        },
      });
    }
  }

  /**
   * Get user's transactions
   */
  static async getUserTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { type = 'all', status } = req.query;

      const transactions = await TransactionController.transactionService.getUserTransactions(
        req.user.userId,
        type as 'buyer' | 'seller' | 'all',
        status as any
      );

      res.json({
        transactions,
        count: transactions.length,
      });
    } catch (error: any) {
      console.error('Get user transactions error:', error);
      res.status(500).json({
        error: {
          code: 'TRANSACTIONS_ERROR',
          message: 'An error occurred while fetching transactions',
        },
      });
    }
  }

  /**
   * Update transaction status (seller only)
   */
  static async updateTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { transactionId } = req.params;
      const updateData = req.body;

      // Get transaction to verify seller authorization
      const transaction = await TransactionController.transactionService.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found',
          },
        });
      }

      if (transaction.sellerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only the seller can update transaction status',
          },
        });
      }

      const updatedTransaction = await TransactionController.transactionService.updateTransaction(
        transactionId,
        updateData
      );

      res.json({
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      });
    } catch (error: any) {
      console.error('Update transaction error:', error);
      res.status(400).json({
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'An error occurred while updating the transaction',
        },
      });
    }
  }

  /**
   * Cancel transaction
   */
  static async cancelTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { transactionId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REASON',
            message: 'Cancellation reason is required',
          },
        });
      }

      // Get transaction to verify authorization
      const transaction = await TransactionController.transactionService.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found',
          },
        });
      }

      // Both buyer and seller can cancel under certain conditions
      if (transaction.buyerId !== req.user.userId && transaction.sellerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to cancel this transaction',
          },
        });
      }

      await TransactionController.transactionService.cancelTransaction(transactionId, reason);

      res.json({
        message: 'Transaction cancelled successfully',
      });
    } catch (error: any) {
      console.error('Cancel transaction error:', error);
      res.status(400).json({
        error: {
          code: 'CANCEL_ERROR',
          message: error.message || 'An error occurred while cancelling the transaction',
        },
      });
    }
  }

  /**
   * Confirm delivery (buyer only)
   */
  static async confirmDelivery(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { transactionId } = req.params;

      await TransactionController.transactionService.confirmDelivery(transactionId, req.user.userId);

      res.json({
        message: 'Delivery confirmed successfully',
      });
    } catch (error: any) {
      console.error('Confirm delivery error:', error);
      res.status(400).json({
        error: {
          code: 'DELIVERY_ERROR',
          message: error.message || 'An error occurred while confirming delivery',
        },
      });
    }
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { sellerId } = req.query;

      // If sellerId is provided, user must be that seller or admin
      if (sellerId && sellerId !== req.user.userId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own transaction statistics',
          },
        });
      }

      const stats = await TransactionController.transactionService.getTransactionStats(
        sellerId as string || req.user.userId
      );

      res.json({
        stats,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({
        error: {
          code: 'STATS_ERROR',
          message: 'An error occurred while fetching transaction statistics',
        },
      });
    }
  }
}