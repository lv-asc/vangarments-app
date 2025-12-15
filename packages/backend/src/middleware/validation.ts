import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('Validation Errors:', JSON.stringify(errors.array(), null, 2));
    const firstError = errors.array()[0];
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError.msg || 'Invalid input data',
        details: errors.array(),
      },
    });
  }

  next();
};