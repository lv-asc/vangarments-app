import { Transaction } from '@vangarments/shared/types/marketplace';

export interface PaymentProvider {
  name: string;
  processPayment(paymentData: PaymentRequest): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: {
    type: 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'digital_wallet';
    details: any;
  };
  customer: {
    id: string;
    email: string;
    name: string;
    document?: string; // CPF for Brazilian customers
  };
  metadata: {
    transactionId: string;
    listingId: string;
    sellerId: string;
    buyerId: string;
  };
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionFee: number;
  processingTime?: number;
  errorMessage?: string;
  providerResponse?: any;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  processingTime?: number;
  errorMessage?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

/**
 * Brazilian payment provider integration (Stripe, PagSeguro, Mercado Pago, etc.)
 */
class StripePaymentProvider implements PaymentProvider {
  name = 'stripe';

  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    try {
      // Simulate Stripe payment processing
      const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
      
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Simulate success/failure (95% success rate)
      const success = Math.random() > 0.05;

      if (!success) {
        return {
          success: false,
          paymentId: '',
          status: 'failed',
          transactionFee: 0,
          processingTime,
          errorMessage: 'Payment declined by issuer',
        };
      }

      const transactionFee = paymentData.amount * 0.029 + 0.30; // 2.9% + R$0.30

      return {
        success: true,
        paymentId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        transactionFee,
        processingTime,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        transactionFee: 0,
        errorMessage: 'Payment processing error',
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    try {
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        refundId: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount || 0,
        status: 'completed',
        processingTime: 2000,
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: 'failed',
        errorMessage: 'Refund processing error',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Simulate payment status check
    return {
      paymentId,
      status: 'completed',
      amount: 100,
      currency: 'BRL',
      createdAt: new Date(Date.now() - 60000),
      completedAt: new Date(),
    };
  }
}

/**
 * PIX payment provider for instant Brazilian payments
 */
class PIXPaymentProvider implements PaymentProvider {
  name = 'pix';

  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    try {
      // PIX payments are typically instant
      const processingTime = Math.random() * 1000 + 500; // 0.5-1.5 seconds
      
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // PIX has higher success rate
      const success = Math.random() > 0.02;

      if (!success) {
        return {
          success: false,
          paymentId: '',
          status: 'failed',
          transactionFee: 0,
          processingTime,
          errorMessage: 'PIX payment failed',
        };
      }

      const transactionFee = Math.min(paymentData.amount * 0.01, 10); // 1% capped at R$10

      return {
        success: true,
        paymentId: `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        transactionFee,
        processingTime,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        transactionFee: 0,
        errorMessage: 'PIX processing error',
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    try {
      // PIX refunds are also fast
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        refundId: `pix_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount || 0,
        status: 'completed',
        processingTime: 1000,
      };
    } catch (error) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: 'failed',
        errorMessage: 'PIX refund error',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return {
      paymentId,
      status: 'completed',
      amount: 100,
      currency: 'BRL',
      createdAt: new Date(Date.now() - 30000),
      completedAt: new Date(),
    };
  }
}

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    this.providers.set('stripe', new StripePaymentProvider());
    this.providers.set('pix', new PIXPaymentProvider());
  }

  /**
   * Process payment using specified provider
   */
  async processPayment(
    providerName: string,
    paymentData: PaymentRequest
  ): Promise<PaymentResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }

    return provider.processPayment(paymentData);
  }

  /**
   * Refund payment
   */
  async refundPayment(
    providerName: string,
    transactionId: string,
    amount?: number
  ): Promise<RefundResult> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }

    return provider.refundPayment(transactionId, amount);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    providerName: string,
    paymentId: string
  ): Promise<PaymentStatus> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }

    return provider.getPaymentStatus(paymentId);
  }

  /**
   * Calculate fees for a transaction
   */
  calculateFees(amount: number, paymentMethod: string): {
    platformFee: number;
    paymentFee: number;
    totalFees: number;
    netAmount: number;
  } {
    const platformFeeRate = 0.05; // 5% platform fee
    const platformFee = amount * platformFeeRate;

    let paymentFee = 0;
    switch (paymentMethod) {
      case 'pix':
        paymentFee = Math.min(amount * 0.01, 10); // 1% capped at R$10
        break;
      case 'credit_card':
      case 'debit_card':
        paymentFee = amount * 0.029 + 0.30; // 2.9% + R$0.30
        break;
      case 'bank_transfer':
        paymentFee = Math.min(amount * 0.015, 15); // 1.5% capped at R$15
        break;
      default:
        paymentFee = amount * 0.025; // 2.5% default
    }

    const totalFees = platformFee + paymentFee;
    const netAmount = amount - totalFees;

    return {
      platformFee,
      paymentFee,
      totalFees,
      netAmount,
    };
  }

  /**
   * Validate payment method for Brazilian market
   */
  validatePaymentMethod(paymentMethod: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!paymentMethod.type) {
      errors.push('Payment method type is required');
    }

    const validTypes = ['credit_card', 'debit_card', 'pix', 'bank_transfer', 'digital_wallet'];
    if (!validTypes.includes(paymentMethod.type)) {
      errors.push('Invalid payment method type');
    }

    // Validate specific payment method details
    switch (paymentMethod.type) {
      case 'credit_card':
      case 'debit_card':
        if (!paymentMethod.details?.cardNumber) {
          errors.push('Card number is required');
        }
        if (!paymentMethod.details?.expiryMonth || !paymentMethod.details?.expiryYear) {
          errors.push('Card expiry date is required');
        }
        if (!paymentMethod.details?.cvv) {
          errors.push('CVV is required');
        }
        break;
      case 'pix':
        // PIX doesn't require additional details for processing
        break;
      case 'bank_transfer':
        if (!paymentMethod.details?.bankCode) {
          errors.push('Bank code is required for bank transfer');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available payment methods for Brazilian market
   */
  getAvailablePaymentMethods(): {
    type: string;
    name: string;
    description: string;
    processingTime: string;
    fees: string;
    supported: boolean;
  }[] {
    return [
      {
        type: 'pix',
        name: 'PIX',
        description: 'Instant payment system',
        processingTime: 'Instant',
        fees: '1% (max R$10)',
        supported: true,
      },
      {
        type: 'credit_card',
        name: 'Credit Card',
        description: 'Visa, Mastercard, Elo',
        processingTime: '1-2 business days',
        fees: '2.9% + R$0.30',
        supported: true,
      },
      {
        type: 'debit_card',
        name: 'Debit Card',
        description: 'Visa Debit, Mastercard Debit',
        processingTime: '1 business day',
        fees: '2.9% + R$0.30',
        supported: true,
      },
      {
        type: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'TED/DOC transfer',
        processingTime: '1-3 business days',
        fees: '1.5% (max R$15)',
        supported: true,
      },
      {
        type: 'digital_wallet',
        name: 'Digital Wallet',
        description: 'PicPay, Mercado Pago',
        processingTime: 'Instant',
        fees: '2.5%',
        supported: false, // Coming soon
      },
    ];
  }
}