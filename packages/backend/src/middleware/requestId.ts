import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if request ID is already provided in headers
  let requestId = req.headers['x-request-id'] as string;
  
  // Generate new request ID if not provided
  if (!requestId) {
    requestId = uuidv4();
  }
  
  // Add request ID to request object
  (req as RequestWithId).requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);
  
  next();
}

export default requestIdMiddleware;