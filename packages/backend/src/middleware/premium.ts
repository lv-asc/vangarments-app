import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscriptionService';

const subscriptionService = new SubscriptionService();

/**
 * Middleware to check if user has access to premium features
 */
export const requirePremiumFeature = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const hasAccess = await subscriptionService.hasFeatureAccess(req.user.id, feature as any);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Premium feature '${feature}' requires subscription upgrade`,
          code: 'PREMIUM_FEATURE_REQUIRED',
          feature,
        });
      }

      next();
    } catch (error) {
      console.error('Premium feature check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking premium feature access',
      });
    }
  };
};

/**
 * Middleware to check advertising access
 */
export const requireAdvertisingAccess = requirePremiumFeature('advertisingAccess');

/**
 * Middleware to check data intelligence access
 */
export const requireDataIntelligenceAccess = requirePremiumFeature('dataIntelligence');

/**
 * Middleware to check advanced analytics access
 */
export const requireAdvancedAnalyticsAccess = requirePremiumFeature('advancedAnalytics');

/**
 * Middleware to check API access
 */
export const requireApiAccess = requirePremiumFeature('apiAccess');

/**
 * Middleware to add subscription info to request
 */
export const addSubscriptionInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.id) {
      const subscription = await subscriptionService.getUserActiveSubscription(req.user.id);
      (req.user as any).subscription = subscription;
    }
    next();
  } catch (error) {
    console.error('Error adding subscription info:', error);
    next(); // Continue without subscription info
  }
};

// Extend Request interface to include subscription
declare global {
  namespace Express {
    interface User {
      subscription?: any;
    }
  }
}