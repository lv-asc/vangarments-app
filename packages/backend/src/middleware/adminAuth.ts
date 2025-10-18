import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
import { AdminAuthService } from '../services/adminAuthService';

/**
 * Middleware to require admin privileges
 */
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const isAdmin = await AdminAuthService.isAdmin(req.user.userId);
    if (!isAdmin) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin privileges required',
        },
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while checking admin privileges',
      },
    });
  }
};

/**
 * Middleware to require specific admin permissions
 */
export const requireAdminPermission = (action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const hasPermission = await AdminAuthService.validateAdminAccess(req.user.userId, action);
      if (!hasPermission) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Permission required: ${action}`,
          },
        });
      }

      next();
    } catch (error) {
      console.error('Admin permission middleware error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking permissions',
        },
      });
    }
  };
};

/**
 * Middleware to check if user is admin or owner of resource
 */
export const requireAdminOrOwner = (userIdField: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      // Check if user is admin
      const isAdmin = await AdminAuthService.isAdmin(req.user.userId);
      if (isAdmin) {
        return next();
      }

      // Check if user is owner of the resource
      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      if (req.user.userId === resourceUserId) {
        return next();
      }

      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin privileges or resource ownership required',
        },
      });
    } catch (error) {
      console.error('Admin or owner middleware error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while checking permissions',
        },
      });
    }
  };
};

/**
 * Middleware to add admin context to request
 */
export const addAdminContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      const isAdmin = await AdminAuthService.isAdmin(req.user.userId);
      (req as any).isAdmin = isAdmin;
      
      if (isAdmin) {
        const roles = req.user.roles || [];
        const permissions = await AdminAuthService['getAdminPermissions'](roles);
        (req as any).adminPermissions = permissions;
      }
    }

    next();
  } catch (error) {
    console.error('Add admin context error:', error);
    // Don't fail the request, just continue without admin context
    next();
  }
};