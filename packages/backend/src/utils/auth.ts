import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export class AuthUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
  }

  static authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: { 
          code: 'MISSING_TOKEN', 
          message: 'Access token is required' 
        } 
      });
    }

    try {
      const decoded = AuthUtils.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ 
        error: { 
          code: 'INVALID_TOKEN', 
          message: 'Invalid or expired token' 
        } 
      });
    }
  }

  static optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided, continue without authentication
      req.user = undefined;
      return next();
    }

    try {
      const decoded = AuthUtils.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      // Invalid token, continue without authentication
      req.user = undefined;
      next();
    }
  }

  static requireRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        });
      }

      const hasRole = roles.some(role => req.user!.roles.includes(role));
      if (!hasRole) {
        return res.status(403).json({ 
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: 'Insufficient permissions for this action' 
          } 
        });
      }

      next();
    };
  }
}